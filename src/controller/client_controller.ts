import type { Request, Response } from "express";
import { Like, type Repository } from "typeorm";
import { HttpError } from "../types/error"; 
import { validateScanKonsumen, type ClientManual } from "../types/client";

export default class ClientController {
  constructor(private repo: Repository<ClientManual>) {}

  checkNik = async (req: Request, res: Response) => {
    const input = { nik: req.body.nik };

    const b = await this.repo.exists({ where: { nik: input.nik } });
    if (b) throw HttpError("nik sudah terdaftar", 409);

    return res.json({ message: "test" });
  };

  search = async (req: Request, res: Response) => {
    const input = validateScanKonsumen(req);

    const condition = [
      { nama: Like(`%${input.key}%`) },
      { nik: Like(`%${input.key}%`) },
    ];

    const data = await this.repo.find({ where: condition });
    return res.json({ message: "test", data });
  };
}
