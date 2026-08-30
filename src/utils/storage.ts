import type { Request } from "express";
import { Client } from "minio";
import { config } from "../config"; 
import { slug } from "./formatter";
import path from "node:path";
import dayjs from "dayjs";

export class MinioStorage {
  private client;

  constructor(no_storage = false) {
    if (no_storage) return;

    this.client = new Client({
      endPoint: "192.182.6.69",
      accessKey: "tmXfJtNXdtu0Tgp9k1ms",
      secretKey: "4zp6YVeB23jMTXiddrxpvttsUUupy0ZxMTkQs5Vs",
      region: "us-east-1",
      pathStyle: true,
      useSSL: false,
      port: 9002,
    });
  }

  async createBucket() {
    if (!this.client) return;

    const exists = await this.client.bucketExists(config.minioBucket!);
    if (exists) return;

    await this.client.makeBucket(config.minioBucket!, "us-east-1");
    console.log("Bucket created");
  }

  async put(req: Request, field: string, ...names: string[]) {
    if (!this.client) return;

    // @ts-ignore
    const files = req.files[field]; // typescript membagongkan
    if (!files?.length) return;

    let name = path.join(...names.map((p) => slug(p)));
    name += "_" + dayjs().unix();
    name += path.extname(files[0].originalname);

    const buf = files[0].buffer;
    await this.client.putObject(config.minioBucket!, name, buf);

    return name;
  }
}
