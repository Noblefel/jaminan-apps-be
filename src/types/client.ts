import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Jaminan } from "./jaminan";
import type { Request } from "express";
import { HttpError } from "./error";

export type ClientType = "internal" | "external";

@Entity()
export class ClientManual {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120 })
  nama: string;

  @Column({ type: "varchar", length: 250 })
  alamat: string;

  @Column({ type: "varchar", length: 30, unique: true })
  nik: string;

  @Column({ type: "enum", enum: ["internal", "external"] })
  tipe: ClientType;

  @Column({ type: "varchar", length: 50 })
  divisi: string;

  @Column({ type: "varchar", length: 50 })
  id_card: string;

  @CreateDateColumn()
  created_at?: Date;

  @OneToMany(() => Jaminan, (jaminan) => jaminan.client)
  jaminan?: Jaminan[];
}

interface ScanKonsumenRequest {
  key: string;
}

export function validateScanKonsumen(req: Request): ScanKonsumenRequest {
  const q = req.query as any;
  if (!q || !q.key) throw HttpError("keyword search masih kosong", 400);
  if (q.key.length > 100) throw HttpError("keyword search terlalu panjang", 400);
  return q;
}
