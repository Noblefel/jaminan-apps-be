import type { Request, Response } from "express";
import { Repository } from "typeorm";
import { randomUUID } from "node:crypto";
import dayjs from "dayjs";

import { HttpError } from "../types/error";
import { ClientManual, type ClientType } from "../types/client";
import { Pagination } from "../utils/pagination";
import type { MinioStorage } from "../utils/storage";
import type { TokenData } from "../types/auth";
import {
  Jaminan,
  validateEditJaminan,
  validateStoreJaminan,
  type Barang,
  type StoreJaminanRequest,
} from "../types/jaminan";

export default class JaminanController {
  constructor(
    private repo: Repository<Jaminan>,
    private repoClient: Repository<ClientManual>,
    private storage: MinioStorage,
  ) {}

  // prettier-ignore
  store = async (req: Request, res: Response) => {
    const input: StoreJaminanRequest = req.body;
    const fail = validateStoreJaminan(input);
    if (fail) throw HttpError(fail, 400);

    const auth: TokenData = res.locals.auth;

    const jaminan = new Jaminan();
    jaminan.alasan = input.jaminan.alasan;
    jaminan.barang = input.jaminan.barang as Barang;
    jaminan.jangka_waktu = dayjs(input.jaminan.jangka_waktu).toDate();
    jaminan.uuid = randomUUID();
    jaminan.marketing_id = auth.id;

    if (input.client.manual) {
      const client = new ClientManual();
      const c = input.client!;

      // scan konsumen itu ambil dari DB CG & client manual. CG lebih prioritas
      const b = await this.repoClient.exists({ where: { nik: c.nik } })
      if (b) throw HttpError("NIK sudah terdaftar, silahkan pakai fitur search konsumen", 409)

      client.divisi = c.divisi;
      client.nama = c.alamat;
      client.nik = c.alamat;
      client.tipe = c.tipe as ClientType;
      client.alamat = c.alamat;
      client.id_card = c.id_card;
      jaminan.client = client;
      jaminan.client_manual = true;
    } else {
      jaminan.client_id = input.client.id
    }

    const name = input.client?.nama!;
    const j = await this.storage.put(req, "jaminan[foto_jaminan]", name, "foto_jaminan");
    const s = await this.storage.put(req, "jaminan[foto_surat_pinjam]", name, "foto_surat_pinjam");

    jaminan.foto_jaminan = j!;
    jaminan.foto_surat_pinjam = s!;
    const saved = await this.repo.save(jaminan);

    return res.json({ message: "Data jaminan berhasil disimpan", data: saved.uuid });
  };

  index = async (req: Request, res: Response) => {
    console.log(req.query.limit)
    const pagination = new Pagination(req);


    const list = await this.repo.find({
      relations: { client: true, marketing: true },
      order: { created_at: "DESC" },
      skip: pagination.offset,
      take: pagination.limit,
    });

    pagination.setPages(await this.repo.count());

    const rawstat = await this.repo
      .createQueryBuilder("c")
      .select("barang, COUNT(*) AS total")
      .groupBy("barang")
      .getRawMany();

    const stat: any = {};

    for (const rs of rawstat) {
      stat[rs.barang] = rs.total;
    }

    return res.json({ data: { list, stat, pagination } });
  };

  put = async (req: Request, res: Response) => {
    const [input, fail] = validateEditJaminan(req.body);
    if (fail) throw HttpError(fail, 400);

    const id = Number(req.params.id);
    const condition = { where: { id }, relations: { client: true } };
    const jaminan = await this.repo.findOne(condition);
    if (!jaminan) throw HttpError("not found", 404);

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

    if (files["foto_surat_pinjam"]) {
      await this.storage.delete(jaminan.foto_surat_pinjam);
      const s = await this.storage.put(
        req,
        "foto_surat_pinjam",
        name,
        "foto_surat_pinjam",
      );
      jaminan.foto_surat_pinjam = s!;
    }

    const updated = await this.repo.save(jaminan);

    return res.json({
      message: "Data jaminan berhasil disimpan",
      data: updated,
    });
  };
}
