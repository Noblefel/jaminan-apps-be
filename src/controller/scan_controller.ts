import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import type { Jaminan } from "../types/jaminan";
import type { Eta } from "eta";
import dayjs from "dayjs";

export default class ScanController {
  constructor(
    private repo: Repository<Jaminan>,
    private view: Eta,
  ) {}

  scanPublic = async (req: Request, res: Response) => {
    const uuid = req.params.uuid as string;
    const jaminan = await this.repo.findOne({
      where: { uuid, status: "pinjam" },
      relations: { client: true },
    });
    const data = {} as any;

    if (jaminan) {
      // Mas Erlang => M** E*****
      data.name = jaminan.client.nama
        .split(" ")
        .map((n) => n[0] + "*".repeat(n.length - 1))
        .join("  ")
        .toUpperCase();

      data.message = "Barang jaminan anda bisa mulai diambil pada tanggal:";
      data.date = dayjs(jaminan.jangka_waktu).format("DD MMMM YYYY");
    } else {
      data.message = "Barang tidak ditemukan atau sudah diserahkan";
    }

    return res.send(this.view.render("./scan", data));
  };
}
