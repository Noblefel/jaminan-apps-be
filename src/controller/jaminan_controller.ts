import type { Request, Response } from "express";
import { Repository } from "typeorm";
import { randomUUID } from "node:crypto";
import dayjs from "dayjs";

import { HttpError } from "../types/error";
import { Pagination } from "../utils/pagination";
import type { MinioStorage } from "../utils/storage";
import {
  Jaminan,
  validateEditJaminan,
  validateStoreJaminan,
  type ClientType,
} from "../types/jaminan";
import { JaminanBarang } from "../types/jaminan_barang";

export default class JaminanController {
  constructor(
    private repo: Repository<Jaminan>,
    private storage: MinioStorage,
  ) {}

  index = async (req: Request, res: Response) => {
    const pagination = new Pagination(req);

    const query = this.repo
      .createQueryBuilder("jaminan")
      .leftJoinAndSelect("jaminan.barang", "barang")
      .orderBy("jaminan.created_at", "DESC")
      .offset(pagination.offset)
      .limit(pagination.limit);

    if (req.query.barang) {
      query.andWhere("barang.barang = :b", { b: req.query.barang });
    }

    if (req.query.status) {
      query.andWhere("jaminan.status = :s", { s: req.query.status });
    }

    if (req.query.search) {
      const like = { s: "%" + (req.query.search as string).trim() + "%" };
      query.andWhere("(jaminan.nama LIKE :s OR jaminan.nik LIKE :s)", like);
    }

    pagination.setPages(await query.getCount());
    const list = await query.getMany();

    const rawstat = await this.repo
      .createQueryBuilder("j")
      .leftJoinAndSelect("j.barang", "barang")
      .select("barang, COUNT(*) AS total")
      .groupBy("barang")
      .getRawMany();

    const stat: any = {};

    for (const rs of rawstat) {
      stat[rs.barang] = rs.total;
    }

    return res.json({ data: { list, stat, pagination } });
  };

  store = async (req: Request, res: Response) => {
    const input = validateStoreJaminan(req);

    const jaminan = new Jaminan();
    jaminan.uuid = randomUUID();
    jaminan.divisi = input.divisi;
    jaminan.nama = input.nama;
    jaminan.nik = input.nik;
    jaminan.tipe = input.tipe as ClientType;
    jaminan.alamat = input.alamat;
    jaminan.id_card = input.id_card;
    jaminan.barang = [];

    // typescript membagongkan
    // @ts-ignore
    for (const [i, f] of req.files.entries()) {
      const jb = new JaminanBarang();
      jb.barang = input.barang[i]!;
      jb.foto = (await this.storage.put(f, input.nama, "barang", jb.barang))!;
      jaminan.barang.push(jb);
    }

    const data = await this.repo.save(jaminan);
    return res.json({ message: "Jaminan baru berhasil disimpan", data });
  };

  put = async (req: Request, res: Response) => {
    const input = validateEditJaminan(req);

    const id = Number(req.params.id);
    const condition = { where: { id }, relations: { client: true } };
    const jaminan = await this.repo.findOne(condition);
    if (!jaminan) throw HttpError("data tidak ditemukan", 404);

    jaminan.alasan = input.alasan;
    jaminan.barang = input.barang as Barang;
    jaminan.jangka_waktu = dayjs(input.jangka_waktu).toDate();

    const name = jaminan.client.nama ?? "deleted_user";
    const files = req.files as any; // !!!!typescript membagongkan

    // prettier-ignore
    if (files["foto_jaminan"]) {
      await this.storage.delete(jaminan.foto_jaminan);
      const j = await this.storage.put(req, "foto_jaminan", name, "foto_jaminan");
      jaminan.foto_jaminan = j!
    }

    // prettier-ignore
    if (files["foto_surat_pinjam"]) {
      await this.storage.delete(jaminan.foto_surat_pinjam);
      const s = await this.storage.put(req, "foto_surat_pinjam", name, "foto_surat_pinjam");
      jaminan.foto_surat_pinjam = s!;
    }

    const data = await this.repo.save(jaminan);
    return res.json({ message: "Data jaminan berhasil disimpan", data });
  };

  out = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const jaminan = await this.repo.findOne({ where: { id } });
    if (!jaminan) throw HttpError("data tidak ditemukan", 404);

    if (jaminan.status != "ambil")
      throw HttpError("barang belum ada acc pengambilan", 403);

    jaminan.status = "lunas";
    jaminan.barang_keluar = new Date();
    await this.repo.save(jaminan);
    return res.json({ message: "Barang berhasil diserahkan" });
  };
}
