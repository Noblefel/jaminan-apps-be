import type { Repository } from "typeorm";
import type { ClientManual } from "../types/client";
import type { Request, Response } from "express";
import { HttpError } from "../types/error";


export class ClientController {
    constructor(private repo: Repository<ClientManual>) {}

    checkNik = async (req: Request, res: Response) => {
        const input = { nik: req.body.nik }

        const b = await this.repo.exists({ where: { nik: input.nik } })
        if (b) throw HttpError("nik sudah terdaftar", 409)

        return res.json({ message: "test" })
    }
}