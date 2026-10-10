import type { Request, Response } from "express";
import { Repository } from "typeorm";
import { randomUUID } from "node:crypto";

import { HttpError } from "../types/error";
import { Pagination } from "../utils/pagination";
import type { MinioStorage } from "../utils/storage";
import {
  Jaminan,
  validatePublicScanJaminan,
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
      query.andWhere("barang.status = :s", { s: req.query.status });
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

  out = async (req: Request, res: Response) => {
    // const id = Number(req.params.id);
    // const jaminan = await this.repo.findOne({ where: { id } });
    // if (!jaminan) throw HttpError("data tidak ditemukan", 404);
    // if (jaminan.status != "ambil")
    //   throw HttpError("barang belum ada acc pengambilan", 403);
    // jaminan.status = "lunas";
    // jaminan.barang_keluar = new Date();
    // await this.repo.save(jaminan);
    // return res.json({ message: "Barang berhasil diserahkan" });
  };

  publicScan = async (req: Request, res: Response) => {
    const input = validatePublicScanJaminan(req);

    const jaminan = await this.repo
      .createQueryBuilder("jaminan")
      .leftJoinAndSelect("jaminan.barang", "barang")
      .leftJoinAndSelect("barang.peminjaman", "peminjaman")
      .where("jaminan.nik = :n", { n: input.nik })
      .andWhere("barang.status != 'selesai'")
      .getMany();

    if (!jaminan.length) {
      throw HttpError(
        "Data nasabah tidak ditemukan. Cek ulang NIK apakah sudah sesuai",
        404,
      );
    }

    return res.json({ data: jaminan });
  };
}
