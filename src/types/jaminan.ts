import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ClientManual, type ClientType } from "./client";
import { User } from "./user";
import dayjs from "dayjs";
import type { Request } from "express";
import { HttpError } from "./error";

export type Barang =
  | "ijazah-sma"
  | "ijazah-smp"
  | "ktp"
  | "shm"
  | "bpkp"
  | "akte"
  | "kk";

@Entity()
export class Jaminan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120, unique: true })
  uuid: string; // for qr

  @Column({ type: "unsigned big int", name: "client_id" })
  client_id: number;

  @ManyToOne(() => ClientManual, { cascade: ["insert"] })
  @JoinColumn({ name: "client_id" })
  client: ClientManual;

  @Column({ type: "boolean", default: false })
  client_manual: boolean;

  @Column({
    type: "enum",
    enum: ["ijazah-sma", "ijazah-smp", "ktp", "shm", "bpkp", "akte", "kk"],
  })
  barang: Barang;

  @Column({ type: "text", nullable: true })
  alasan: string;

  @Column({ type: "date" })
  jangka_waktu: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  foto_jaminan: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  foto_surat_pinjam: string;

  @Column({ type: "unsigned big int", name: "marketing_id" })
  marketing_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "marketing_id" })
  marketing: User;

  @CreateDateColumn()
  created_at: Date;
}

interface StoreJaminanRequest {
  jaminan: {
    barang: string;
    alasan: string;
    jangka_waktu: string;
    foto_jaminan: Object | null;
    foto_surat_pinjam: Object | null;
  };
  client: {
    id: number;
    nama: string;
    alamat: string;
    nik: string;
    tipe: string;
    divisi: string;
    id_card: string;
    manual: boolean;
  };
}

export function validateStoreJaminan(req: Request): StoreJaminanRequest {
  const j = req.body.jaminan;
  const c = req.body.client;
  const f = req.files as any;

  if (!j || !c) throw HttpError("tidak ada data jaminan & client", 400);
  // formdata convert everything to string
  c.id = Number(c?.id || 0);
  // formdata convert everything to string. +typescript membagongkan
  c.manual = (c.manual as unknown as string) === "true";

  if (c.id && c.manual)
    throw HttpError("konflik client id scan dan client manual", 400);
  if (!j.barang || !j.alasan || !j.jangka_waktu)
    throw HttpError("input jaminan masih ada yang kosong", 400);
  if (!f["jaminan[foto_jaminan]"] || !f["jaminan[foto_surat_pinjam]"])
    throw HttpError("wajib memiliki foto jaminan dan surat pinjam", 400);
  if (!dayjs(j.jangka_waktu).isValid())
    throw HttpError("format jangka waktu salah", 400);

  if (c.id) return req.body; // pass

  if (!c.alamat || !c.nama || !c.nik || !c.tipe)
    throw HttpError("input client masih ada yang kosong", 400);
  if (c.tipe !== "external" && c.tipe !== "internal")
    throw HttpError("tipe client tidak benar: " + c.tipe, 400);
  if (c.tipe == "internal" && (!c.divisi || !c.id_card))
    throw HttpError("Internal id card dan divisi (PT) masih kosong", 400);

  return req.body;
}

interface EditJaminanRequest {
  id: number;
  barang: string;
  alasan: string;
  jangka_waktu: string;
  foto_jaminan: Object | string;
  foto_surat_pinjam: Object | string;
}

// prettier-ignore
export function validateEditJaminan(req: Request): EditJaminanRequest {
  if (!req.body.barang || !req.body.alasan || !req.body.jangka_waktu)
    throw HttpError("input jaminan masih ada yang kosong", 400);
  if (!dayjs(req.body.jangka_waktu).isValid())
    throw HttpError("format jangka waktu salah", 400);
  return req.body;
}
