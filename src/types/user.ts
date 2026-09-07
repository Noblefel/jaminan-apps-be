import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export type Role =
  | "hm"
  | "adm_internal"
  | "adm_external"
  | "adm_jaminan"
  | "marketing"
  | "guest";

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

  @Column({
    type: "enum",
    enum: [
      "hm",
      "adm_internal",
      "adm_external",
      "adm_jaminan",
      "marketing",
      "guest",
    ],
    default: "guest",
  })
  role: Role;

  @CreateDateColumn()
  created_at: Date;
}
