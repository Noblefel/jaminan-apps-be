import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum ROLE {
  HEAD_MANAGER = "hm",
  ADMIN_INTERNAL = "adm_internal",
  ADMIN_EXTERNAL = "adm_external",
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

  @CreateDateColumn()
  created_at: Date;
}