import type { Request, Response } from "express";
import type { MinioStorage } from "../utils/storage";
import { pipeline } from "node:stream/promises";
import path from "node:path";

export class StorageController {
  constructor(private storage: MinioStorage) {}

  get = async (req: Request, res: Response) => {
    const filepath = (req.params.path as string[]).join("/");
    const readable = await this.storage.get(filepath);
    if (!readable) return res.status(404);

    const ftype: any = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".pdf": "application/pdf",
    };

    const ext = path.extname(filepath).toLowerCase();
    res.setHeader("Content-Type", ftype[ext]); // typescript membagongkan
    await pipeline(readable, res);
  };
}
