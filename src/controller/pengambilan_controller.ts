import type { Request, Response } from "express";
import { IsNull, type Repository } from "typeorm";
import type { MinioStorage } from "../utils/storage";
import {
  Pengambilan,
  validateEditPengambilan,
  validateStorePengambilan,
} from "../types/pengambilan";
import type { Jaminan } from "../types/jaminan";
import { HttpError } from "../types/error";
import { Pagination } from "../utils/pagination";

export default class PengambilanController {
  constructor(
    private repo: Repository<Pengambilan>,
    private repoJaminan: Repository<Jaminan>,
    private storage: MinioStorage,
  ) {}

  get = async (req: Request, res: Response) => {
    const pagination = new Pagination(req);

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

    if (req.query.search) {
      const like = { s: "%" + (req.query.search as string).trim() + "%" };
      query.andWhere("(client.nama LIKE :s OR client.nik LIKE :s)", like);
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

    const pending = await this.repo.exists({
      where: { jaminan_id: input.jaminan_id, final_status: IsNull() },
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

    if (!ambil) throw HttpError("Data jaminan tidak ditemukan", 404);

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
}
