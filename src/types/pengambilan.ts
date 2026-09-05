import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Jaminan } from "./jaminan";
import type { Request } from "express";
import { HttpError } from "./error";

export type Approval = "approved" | "rejected" | null;

@Entity()
export class Pengambilan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "unsigned big int", name: "jaminan_id" })
  jaminan_id: number;

  @ManyToOne(() => Jaminan, { cascade: ["insert"] })
  @JoinColumn({ name: "jaminan_id" })
  jaminan: Jaminan;

  @Column({ type: "varchar", length: 150, nullable: true })
  foto_bast: string | null;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_adm_internal: Approval;

  @Column({ type: "varchar", length: 350, nullable: true })
  ket_adm_internal: string;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_adm_external: Approval;

  @Column({ type: "varchar", length: 350, nullable: true })
  ket_adm_external: string;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_adm_jaminan: Approval;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  approval_hm: Approval;

  @Column({ type: "enum", enum: ["approved", "rejected"], nullable: true })
  final_status: Approval; // for easier query check.

  @CreateDateColumn()
  created_at: Date;
}

interface StorePengambilanRequest {
  jaminan_id: number;
}

// prettier-ignore
export function validateStorePengambilan(req: Request): StorePengambilanRequest {
  req.body.jaminan_id = Number(req.body?.jaminan_id || 0);

  if (!req.body.jaminan_id)
    throw HttpError("pilih jaminan id terlebih dahulu", 400);
    
  return req.body;
}

interface EditPengambilanRequest {
  foto_bast: string | null;
}

export function validateEditPengambilan(req: Request): EditPengambilanRequest {
  if (req.body.foto_bast === "null") req.body.foto_bast = null; // delete image
  return req.body;
}
