import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ClientManual, type ClientType } from "./client";
import { User } from "./user";
import dayjs from "dayjs";

export type Barang =
  | "ijazah-sma"
  | "ijazah-smp"
  | "ktp"
  | "shm"
  | "bpkp"
  | "akte"
  | "kk";

@Entity()
export class Jaminan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120, unique: true })
  uuid: string; // for qr

  @Column({ type: "unsigned big int", name: "client_id" })
  client_id: number;

  @ManyToOne(() => ClientManual, { cascade: ["insert"] })
  @JoinColumn({ name: "client_id" })
  client: ClientManual;

  @Column({ type: "boolean", default: false })
  client_manual: boolean;

  @Column({
    type: "enum",
    enum: ["ijazah-sma", "ijazah-smp", "ktp", "shm", "bpkp", "akte", "kk"],
  })
  barang: Barang;

  @Column({ type: "text", nullable: true })
  alasan: string;

  @Column({ type: "date" })
  jangka_waktu: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  foto_jaminan: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  foto_surat_pinjam: string;

  @Column({ type: "unsigned big int", name: "marketing_id" })
  marketing_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "marketing_id" })
  marketing: User;

  @CreateDateColumn()
  created_at: Date;
}

export interface StoreJaminanRequest {
  jaminan: {
    barang: string;
    alasan: string;
    jangka_waktu: string;
    foto_jaminan: string;
    foto_surat_pinjam: string;
  };
  client: {
    id: number;
    nama: string;
    alamat: string;
    nik: string;
    tipe: string;
    divisi: string;
    id_card: string;
    manual: boolean;
  };
}

export function validateStoreJaminan(req: StoreJaminanRequest) {
  const j = req.jaminan;
  const c = req.client;
  // formdata convert everything to string
  c.id = Number(c.id);
  // formdata convert everything to string. +typescript membagongkan
  c.manual = (c.manual as unknown as string) === "true";

  if (!j || !c) return "tidak ada data jaminan & client";

  if (c.id && c.manual) return "konflik client id scan dan client manual";

  if (!j.barang || !j.alasan || !j.jangka_waktu)
    return "input jaminan masih ada yang kosong";

  if (!dayjs(j.jangka_waktu).isValid()) return "format jangka waktu salah";

  if (c.id) return ""; // pass

  if (!c.alamat || !c.divisi || !c.id_card || !c.nama || !c.nik || !c.tipe)
    return "input client masih ada yang kosong";

  if (c.tipe !== "external" && c.tipe !== "internal")
    return "tipe client tidak benar: " + c.tipe;

  return "";
}
