import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Jaminan } from "./jaminan";
import { Peminjaman } from "./peminjaman";

@Entity()
export class JaminanBarang {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "unsigned big int", name: "jaminan_id" })
  jaminan_id: number;

  @ManyToOne(() => Jaminan, { onDelete: "CASCADE", cascade: ["remove"] })
  @JoinColumn({ name: "jaminan_id" })
  jaminan: Jaminan;

  @Column({
    type: "enum",
    enum: ["ijazah-sma", "ijazah-smp", "ktp", "shm", "bpkp", "akte", "kk"],
  })
  barang: Barang;

  @Column({ type: "varchar", length: 250, nullable: true })
  foto: string;

  @Column({
    type: "enum",
    enum: ["brankas", "pinjam", "selesai"],
    default: "brankas",
  })
  status: Status;

  @OneToMany(() => Peminjaman, (peminjaman) => peminjaman.barang, {
    cascade: ["insert"],
  })
  peminjaman?: Peminjaman[];
}

// TODO: update barang
export type Barang =
  | "ijazah-sma"
  | "ijazah-smp"
  | "ktp"
  | "shm"
  | "bpkp"
  | "akte"
  | "kk";

export type Status = "brankas" | "pinjam" | "selesai";
