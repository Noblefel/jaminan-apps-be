import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { HttpError } from "./error";
import { JaminanBarang, type Barang } from "./jaminan_barang";
import type { Request } from "express";
import dayjs from "dayjs";

export type ClientType = "internal" | "external";

@Entity()
export class Jaminan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120, unique: true })
  uuid: string; // for qr

  @Column({ type: "timestamp", nullable: true })
  barang_keluar: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: "varchar", length: 150 })
  nama: string;

  @Column({ type: "varchar", length: 250 })
  alamat: string;

  @Column({ type: "varchar", length: 30 })
  nik: string;

  @Column({ type: "enum", enum: ["internal", "external"] })
  tipe: ClientType;

  @Column({ type: "varchar", length: 50, nullable: true })
  divisi: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  id_card: string;

  @OneToMany(() => JaminanBarang, (barang) => barang.jaminan, {
    cascade: ["insert"],
  })
  barang?: JaminanBarang[];
}

interface StoreJaminanRequest {
  nama: string;
  alamat: string;
  nik: string;
  tipe: ClientType;
  divisi: string;
  id_card: string;
  barang: Barang[];
}

export function validateStoreJaminan(req: Request): StoreJaminanRequest {
  const b = req.body as StoreJaminanRequest;

  if (!b.nik || !b.nama || !b.alamat)
    throw HttpError("data konsumen masih ada yang kosong", 400);

  if (b.tipe === "internal" && (!b.divisi || !b.id_card))
    throw HttpError("konsumen internal wajib input divisi dan id card", 400);

  if (!b.barang.length || b.barang.some((bb) => !bb.length))
    throw HttpError("Barang jaminan masih kosong", 400);

  // @ts-ignore
  if (!req.files.length)
    throw HttpError("wajib memfoto barang jaminan baru", 400);

  if (b.nik.length > 30) throw HttpError("NIK terlalu panjang", 400);
  if (b.nama.length > 150) throw HttpError("Nama terlalu panjang", 400);
  if (b.nama.length > 250) throw HttpError("Alamat terlalu panjang", 400);
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
