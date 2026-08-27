import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

export enum role {
  HEAD_MANAGER = "hm",
  ADMIN_LAPORAN = "adm_laporan",
  ADMIN_JAMINAN = "adm_jaminan",
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

  @Column({ type: "enum", enum: role })
  role: role;

  @CreateDateColumn()
  created_at: Date;
}
