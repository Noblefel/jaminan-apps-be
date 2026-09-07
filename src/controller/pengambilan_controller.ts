import type { Request, Response } from "express";
import { IsNull, type Repository } from "typeorm";
import { HttpError } from "../types/error";
import { Pagination } from "../utils/pagination";
import type { MinioStorage } from "../utils/storage";
import type { Jaminan } from "../types/jaminan";
import type { TokenData } from "../types/auth";
import {
  Pengambilan,
  validateApprove,
  validateEditPengambilan,
  validateStorePengambilan,
} from "../types/pengambilan";
import type { Role } from "../types/user";

export default class PengambilanController {
  constructor(
    private repo: Repository<Pengambilan>,
    private repoJaminan: Repository<Jaminan>,
    private storage: MinioStorage,
  ) {}

  get = async (req: Request, res: Response) => {
    const pagination = new Pagination(req);
    const role = req.query.role as Role;

    const query = this.repo
      .createQueryBuilder("ambil")
      .leftJoinAndSelect("ambil.jaminan", "jaminan")
      .leftJoinAndSelect("jaminan.client", "client")
      .orderBy("ambil.created_at", "DESC")
      .offset(pagination.offset)
      .limit(pagination.limit);

    if (req.query.barang) {
      query.andWhere("jaminan.barang = :b", { b: req.query.barang });
    }

    if (req.query.tipe) {
      query.andWhere("client.tipe = :t", { t: req.query.tipe });
    }

    if (req.query.final) {
      query.andWhere("ambil.final_approval = :f", { f: req.query.final });
    }

    if (req.query.search) {
      const like = { s: "%" + (req.query.search as string).trim() + "%" };
      query.andWhere("(client.nama LIKE :s OR client.nik LIKE :s)", like);
    }

    // prettier-ignore
    if (role === "hm") {
      query.andWhere("ambil.final_approval IS NULL");
      query.andWhere("ambil.approval_adm_jaminan = 'approved'");
      query.andWhere("(ambil.approval_adm_internal = 'approved' OR ambil.approval_adm_external = 'approved')");
    } else if (role === "adm_internal") {
      query.andWhere("client.tipe = 'internal'");
      query.andWhere("ambil.final_approval IS NULL");
      query.andWhere("ambil.approval_adm_internal IS NULL");
      query.andWhere("ambil.approval_adm_jaminan = 'approved'");
    } else if (role === "adm_external") {
      query.andWhere("client.tipe = 'external'");
      query.andWhere("ambil.final_approval IS NULL");
      query.andWhere("ambil.approval_adm_external IS NULL");
      query.andWhere("ambil.approval_adm_jaminan = 'approved'");
    } else if (role === "adm_jaminan") {
      query.andWhere("ambil.final_approval IS NULL");
      query.andWhere("ambil.approval_adm_jaminan IS NULL");
    }

    pagination.setPages(await query.getCount());
    const list = await query.getMany();

    return res.json({ data: { list, pagination } });
  };

  store = async (req: Request, res: Response) => {
    const input = validateStorePengambilan(req);
    const files = req.files as any;

    const jaminan = await this.repoJaminan.findOne({
      where: { id: input.jaminan_id },
    });

    if (!jaminan) throw HttpError("Data jaminan tidak ditemukan", 404);

    if (jaminan.status === "lunas")
      throw HttpError("Jaminan ini sudah lunas/diserahkan", 409);

    if (jaminan.status === "ambil")
      throw HttpError("Pengajuan sudah di acc, menunggu pengambilan", 409);

    const pending = await this.repo.exists({
      where: { jaminan_id: input.jaminan_id, final_approval: IsNull() },
    });

    if (pending)
      throw HttpError("Jaminan ini masih ada pengajuan pending", 409);

    const pengambilan = new Pengambilan();
    pengambilan.jaminan_id = input.jaminan_id;

    if (files["foto_bast"]) {
      const f = await this.storage.put(req, "foto_bast", jaminan!.uuid);
      pengambilan.foto_bast = f!;
    }

    const data = this.repo.save(pengambilan);
    const message = "Berhasil diajukan. Menunggu approval Admin & HM";
    return res.json({ message, data });
  };

  put = async (req: Request, res: Response) => {
    const input = validateEditPengambilan(req);
    const id = req.params.id as any;
    const files = req.files as any;

    const ambil = await this.repo.findOne({
      relations: { jaminan: true },
      where: { id },
    });

    if (!ambil) throw HttpError("Data pengajuan tidak ditemukan", 404);

    if (files["foto_bast"]) {
      await this.storage.delete(ambil.foto_bast);
      const f = await this.storage.put(req, "foto_bast", ambil.jaminan.uuid);
      ambil.foto_bast = f!;
    } else if (input.foto_bast === null) {
      await this.storage.delete(ambil.foto_bast);
      ambil.foto_bast = null;
    }

    const data = await this.repo.save(ambil);
    return res.json({ message: "Data pengajuan berhasil disimpan", data });
  };

  approve = async (req: Request, res: Response) => {
    const auth: TokenData = res.locals.auth;
    const input = validateApprove(req, auth);
    const id = req.params.id as any;

    const ambil = await this.repo.findOne({
      relations: { jaminan: { client: true } },
      where: { id },
    });

    if (!ambil) throw HttpError("Data pengajuan tidak ditemukan", 404);

    if (ambil.final_approval != null) {
      const s = ambil.final_approval === "approved" ? "diapprove" : "ditolak";
      throw HttpError(`Pengajuan sudah ${s} final`, 409);
    }

    if (auth.role === "adm_external" && ambil.jaminan.client.tipe == "internal")
      throw HttpError("Pengajuan ini khusus admin internal", 403);

    if (auth.role === "adm_internal" && ambil.jaminan.client.tipe == "external")
      throw HttpError("Pengajuan ini khusus admin external", 403);
 
    // @ts-ignore
    if (ambil["approval_" + auth.role] != null)
      throw HttpError("Tidak bisa approve/reject dua kali", 409);
 
    // @ts-ignore
    ambil["approval_" + auth.role] = input.approval;
    if (auth.role === "adm_internal") ambil["ket_adm_internal"] = input.keterangan;     
    if (auth.role === "adm_external") ambil["ket_adm_external"] = input.keterangan;     

    if (input.approval === "rejected" || auth.role === "hm")
      ambil.final_approval = input.approval;

    if (ambil.final_approval === "approved") ambil.jaminan.status = "ambil";

    const data = await this.repo.save(ambil);
    return res.json({ message: "Data approval berhasil disimpan", data });
  };
}
