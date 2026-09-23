import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { JaminanBarang } from "./jaminan_barang";
import type { Request } from "express";
import dayjs from "dayjs";
import { HttpError } from "./error";
import type { Approval } from "./pengambilan";

@Entity()
export class Peminjaman {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "unsigned big int", name: "barang_id" })
  barang_id: number;

  @ManyToOne(() => JaminanBarang, {
    onDelete: "CASCADE",
    cascade: ["remove", "update"],
  })
  @JoinColumn({ name: "barang_id" })
  barang: JaminanBarang;

  @Column({ type: "varchar", length: 250, nullable: true })
  surat_pinjam: string;

  @Column({ type: "varchar", length: 1500, nullable: true })
  alasan: string;

  @Column({ type: "timestamp" })
  jangka_waktu: Date;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_adm_jaminan: Approval;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_hm: Approval;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  final_approval: Approval; // for easier query check.

  @Column({ type: "timestamp", nullable: true })
  returned_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}

interface StorePeminjamanRequest {
  barang_id: number;
  alasan: string;
  jangka_waktu: string;
}

export function validateStorePeminjaman(req: Request): StorePeminjamanRequest {
  req.body.barang_id = Number(req.body.barang_id);
  if (!req.body.barang_id || isNaN(req.body.barang_id))
    throw HttpError("barang id salah", 400);
  if (!req.body.alasan || req.body.alasan.length < 5)
    throw HttpError("alasan masih kosong", 400);
  if (!dayjs(req.body.jangka_waktu).isValid())
    throw HttpError("format jangka waktu salah", 400);
  return req.body;
}

interface ApprovePinjamRequest {
  approval: Approval;
}

// prettier-ignore
export function validateApprovePinjam(req: Request): ApprovePinjamRequest{
  if (!["approved", "rejected"].includes(req.body.approval)) throw HttpError("invalid approval", 400);
  return req.body;
}
