import { Repository } from "typeorm";
import type { TokenData } from "../types/auth";
import dayjs from "dayjs";

import { HttpError } from "../types/error";
import type { Request, Response } from "express";
import type { ClientManual } from "../types/client";
import type { MinioStorage } from "../utils/storage";
import {
  Jaminan,
  validateStoreJaminan,
  type StoreJaminanRequest,
} from "../types/jaminan";
import { randomUUID } from "node:crypto";

const dummy: ClientManual[] = [
  {
    id: 1,
    nama: "Mas Erlangga",
    nik: "10249123",
    tipe: "internal",
    alamat: "Gunung Putri",
    divisi: "ilw",
    id_card: "ID/123/456",
  },
  {
    id: 2,
    nama: "Mas Ichwan",
    nik: "2100021",
    tipe: "external",
    alamat: "Gunung Putri",
    divisi: "fots",
    id_card: "ID/875/215",
  },
];

export default class JaminanController {
  constructor(
    private repo: Repository<Jaminan>,
    private storage: MinioStorage,
  ) {}

  // prettier-ignore
  storeJaminan = async (req: Request, res: Response) => {
    const input: StoreJaminanRequest = req.body;
    const fail = validateStoreJaminan(input);
    if (fail) throw HttpError(fail, 400);

    const auth: TokenData = res.locals.auth;

    const jaminan = new Jaminan();
    jaminan.alasan = input.jaminan.alasan;
    jaminan.barang = input.jaminan.barang;
    jaminan.jangka_waktu = dayjs(input.jaminan.jangka_waktu).toDate();
    jaminan.uuid = randomUUID();
    jaminan.marketing_id = auth.id;
    jaminan.client_manual = input.client?.client_id ? true : false;

    const name = input.client?.nama!;
    const j = await this.storage.put(req, "jaminan[foto_jaminan]", name, "foto_jaminan");
    const s = await this.storage.put(req, "jaminan[foto_surat_pinjam]", name, "foto_surat_pinjam");
  
    jaminan.foto_jaminan = j!;
    jaminan.foto_surat_pinjam = s!;
    this.repo.save(jaminan);

    return res.json({ message: "Lol" });
  };
}
