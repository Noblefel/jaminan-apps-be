import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum ROLE {
  HEAD_MANAGER = "hm",
  ADMIN_LAPORAN = "adm_laporan",
  ADMIN_JAMINAN = "adm_jaminan",
  MARKETING = "marketing",
  GUEST = "guest",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120 })
  name: string;

  @Column({ type: "varchar", length: 120, unique: true })
  email: string;

  @Column({ type: "varchar", length: 254 })
  password: string;

  @Column({ type: "enum", enum: ROLE, default: ROLE.GUEST })
  role: ROLE;

  @Column({ type: "timestamp" , default: () => 'NOW()', nullable: true })
  created_at: Date;
}

export interface ScanKonsumenRequest {
  /** Name/Nik */
  key: string;
}

export function validateScanKonsumen(req: ScanKonsumenRequest) {
  if (!req.key) return "Keyword kosong";
  if (req.key.length > 100) return "Nama/Nik terlalu panjang";
  return "";
}
