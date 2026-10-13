import { type Repository } from "typeorm";
import {
  Peminjaman,
  validateApprovePinjam,
  validateStorePeminjaman,
} from "../types/peminjaman";
import type { MinioStorage } from "../utils/storage";
import type { Request, Response } from "express";
import type { Jaminan } from "../types/jaminan";
import type { TokenData } from "../types/auth";
import { HttpError } from "../types/error";
import { Pagination } from "../utils/pagination";
import type { Role } from "../types/user";
import dayjs from "dayjs";

export default class PeminjamanController {
  constructor(
    private repo: Repository<Peminjaman>,
    private repoJaminan: Repository<Jaminan>,
    private storage: MinioStorage,
  ) {}

  get = async (req: Request, res: Response) => {
    const pagination = new Pagination(req);
    const role = req.query.role as Role;

    const query = this.repo
      .createQueryBuilder("pinjam")
      .leftJoinAndSelect("pinjam.barang", "barang")
      .leftJoinAndSelect("barang.jaminan", "jaminan")
      .orderBy("pinjam.created_at", "DESC")
      .offset(pagination.offset)
      .limit(pagination.limit);

    if (req.query.barang) {
      query.andWhere("barang.barang = :b", { b: req.query.barang });
    }

    if (req.query.tipe) {
      query.andWhere("jaminan.tipe = :t", { t: req.query.tipe });
    }

    if (req.query.final) {
      query.andWhere("pinjam.final_approval = :f", { f: req.query.final });
    }

    if (req.query.kembali === "pending") {
      query.andWhere("pinjam.final_approval IS NULL");
    } else if (req.query.kembali) {
      const b = req.query.kembali === "1" ? "NOT NULL" : "NULL";
      query.andWhere("pinjam.returned_at is " + b);
      query.andWhere("pinjam.final_approval IS NOT NULL");
    }

    if (req.query.search) {
      const like = { s: "%" + (req.query.search as string).trim() + "%" };
      query.andWhere("(jaminan.nama LIKE :s OR jaminan.nik LIKE :s)", like);
    }

    if (role === "hm") {
      query.andWhere("pinjam.final_approval IS NULL");
      query.andWhere("pinjam.approval_adm_jaminan = 'approved'");
    } else if (role === "adm_jaminan") {
      query.andWhere("pinjam.final_approval IS NULL");
      query.andWhere("pinjam.approval_adm_jaminan IS NULL");
    }

    pagination.setPages(await query.getCount());
    const list = await query.getMany();

    return res.json({ data: { list, pagination } });
  };

  store = async (req: Request, res: Response) => {
    const input = validateStorePeminjaman(req);

    const jaminan = await this.repoJaminan.findOne({
      relations: { barang: { peminjaman: true } },
      where: { id: req.params.id as any },
    });
    if (!jaminan) throw HttpError("Data jaminan tidak ditemukan", 404);

    if (jaminan.awaiting_return)
      throw HttpError("Jaminan ini sedang menunggu pengambilan", 404);

    const barang = jaminan.barang?.find((b) => b.id == input.barang_id);
    if (!barang) throw HttpError("Barang tidak ditemukan", 404);

    if (barang.status !== "brankas")
      throw HttpError("Barang sedang dipinjam atau sudah lunas", 409);

    const pending = barang.peminjaman?.some((p) => p.final_approval == null);
    if (pending) throw HttpError("Barang ini masih ada pengajuan pending", 409);

    const pinjam = new Peminjaman();
    pinjam.alasan = input.alasan;
    pinjam.barang_id = input.barang_id;
    pinjam.borrow_start = new Date(input.borrow_start);
    pinjam.borrow_end = new Date(input.borrow_end);

    if (req.file) {
      pinjam.surat_pinjam = (await this.storage.put(
        req.file,
        jaminan.nama,
        "surat_pinjam",
        barang.barang,
      ))!;
    }

    const auth: TokenData = res.locals.auth;
    const resp: any = {};

    if (auth.role === "hm") {
      pinjam.approval_hm = "approved";
      pinjam.final_approval = "approved";
      resp.message = "Peminjaman berhasil. (HM) Otomatis approve";

      barang.status = "pinjam";
      pinjam.barang = barang; // cascade update
    } else if (auth.role === "adm_jaminan") {
      pinjam.approval_adm_jaminan = "approved";
      resp.message = "Peminjaman diajukan. Tunggu approval HM";
    } else {
      resp.message = "Peminjaman diajukan. Tunggu approval admin jaminan & HM";
    }

    resp.data = await this.repo.save(pinjam);
    return res.json(resp);
  };

  approve = async (req: Request, res: Response) => {
    const auth: TokenData = res.locals.auth;
    const input = validateApprovePinjam(req);
    const id = req.params.id as any;

    const pinjam = await this.repo.findOne({
      relations: { barang: true },
      where: { id },
    });

    if (!pinjam) throw HttpError("Data pengajuan tidak ditemukan", 404);

    if (pinjam.final_approval != null) {
      const s = pinjam.final_approval === "approved" ? "diapprove" : "ditolak";
      throw HttpError(`Pengajuan sudah ${s} final`, 409);
    }

    // @ts-ignore
    if (pinjam["approval_" + auth.role] != null)
      throw HttpError("Tidak bisa approve/reject dua kali", 409);

    // @ts-ignore
    pinjam["approval_" + auth.role] = input.approval;

    if (input.approval === "rejected" || auth.role === "hm")
      pinjam.final_approval = input.approval;

    if (pinjam.final_approval === "approved") {
      pinjam.barang.status = "pinjam";
      pinjam.returned_at = new Date();
    }

    const message =
      pinjam.final_approval === "approved"
        ? `Approval berhasil disimpan. Barang tercatat keluar pada ${dayjs(pinjam.borrow_start).format("DD MMMM")}`
        : "Berhasil ditolak. Barang tetap didalam brankas";

    const data = await this.repo.save(pinjam);
    return res.json({ data, message });
  };

  returning = async (req: Request, res: Response) => {
    const id = req.params.id as any;

    const pinjam = await this.repo.findOne({
      relations: { barang: true },
      where: { id },
    });

    if (!pinjam) throw HttpError("Data pengajuan tidak ditemukan", 404);

    if (pinjam.returned_at)
      throw HttpError("Barang jaminan sudah kembali", 409);

    if (!pinjam.final_approval || !pinjam.returned_at === null)
      throw HttpError("Barang jaminan tidak sedang dipinjam", 409);

    pinjam.returned_at = new Date();
    pinjam.barang.status = "brankas";
    await this.repo.save(pinjam);

    return res.json({ message: "Barang tercatat kembali" });
  };

  publicStore = async (req: Request, res: Response) => {
    const input = validateStorePeminjaman(req);

    const jaminan = await this.repoJaminan.findOne({
      relations: { barang: { peminjaman: true } },
      where: { id: req.params.id as any },
    });
    if (!jaminan) throw HttpError("Data jaminan tidak ditemukan", 404);

    const barang = jaminan.barang?.find((b) => b.id == input.barang_id);
    if (!barang) throw HttpError("Barang tidak ditemukan", 404);

    if (barang.status !== "brankas")
      throw HttpError("Barang sedang dipinjam atau sudah lunas", 409);

    const pending = barang.peminjaman?.some((p) => p.final_approval == null);
    if (pending) throw HttpError("Barang ini masih ada pengajuan pending", 409);

    const pinjam = new Peminjaman();
    pinjam.alasan = input.alasan;
    pinjam.barang_id = input.barang_id;
    pinjam.borrow_start = new Date(input.borrow_start);
    pinjam.borrow_end = new Date(input.borrow_end);

    await this.repo.save(pinjam);
    const m = "Peminjaman berhasil diajukan. Menunggu persetujuan dari staf CG";
    return res.json({ message: m });
  };
}
