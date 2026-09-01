import { Like, type Repository } from "typeorm";
import type { ClientManual } from "../types/client";
import type { Request, Response } from "express";
import { HttpError } from "../types/error";
import { validateScanKonsumen, type ScanKonsumenRequest } from "../types/user";

export class ClientController {
  constructor(private repo: Repository<ClientManual>) {}

  checkNik = async (req: Request, res: Response) => {
    const input = { nik: req.body.nik };

    const b = await this.repo.exists({ where: { nik: input.nik } });
    if (b) throw HttpError("nik sudah terdaftar", 409);

    return res.json({ message: "test" });
  };

  search = async (req: Request, res: Response) => {
    const input: ScanKonsumenRequest = req.query as any; // typescript membagongkan
    const fail = validateScanKonsumen(input);
    if (fail) throw HttpError(fail, 400);

    const condition = [
      { nama: Like(`%${input.key}%`) },
      { nik: Like(`%${input.key}%`) },
    ];

    const data = await this.repo.find({ where: condition });
    return res.json({ message: "test", data });
  };
}
