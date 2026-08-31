import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Jaminan } from "./jaminan";

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
