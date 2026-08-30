import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ClientManual } from "./client";
import { User } from "./user";
import dayjs from "dayjs";

@Entity()
export class Jaminan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 120, unique: true })
  uuid: string; // for qr

  @OneToOne(() => ClientManual)
  @JoinColumn({ name: "client_id" })
  client: ClientManual;

  @Column({ type: "boolean", default: false })
  client_manual: boolean;

  @Column({ type: "varchar", length: 50 })
  barang: string;

  @Column({ type: "text", nullable: true })
  alasan: string;

  @Column({ type: "date" })
  jangka_waktu: Date;

  @Column({ type: "varchar", length: 50 })
  foto_jaminan: string;

  @Column({ type: "varchar", length: 50 })
  foto_surat_pinjam: string;

  @Column({ type: "unsigned big int", name: "marketing_id" })
  marketing_id: number;

  @OneToOne(() => User)
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
  client?: {
    client_id?: number;
    nama: string;
    alamat: string;
    nik: string;
    tipe: string;
    divisi: string;
    id_card: string;
  };
}

export function validateStoreJaminan(req: StoreJaminanRequest) {
  const j = req.jaminan;
  const c = req.client;

  if (!j || !c) return "tidak ada data jaminan & client";

  if (c.client_id && c.nama) return "konflik client id scan dan client manual";

  if (!j.barang || !j.alasan || !j.jangka_waktu)
    return "input jaminan masih ada yang kosong";

  if (!dayjs(j.jangka_waktu).isValid()) return "format jangka waktu salah";

  if (c.client_id) return ""; // pass

  if (!c.alamat || !c.divisi || !c.id_card || !c.nama || !c.nik || !c.tipe)
    return "input client masih ada yang kosong";

  return "";
}
