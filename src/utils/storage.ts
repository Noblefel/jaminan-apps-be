import type { Request } from "express";
import { Client } from "minio";
import { config } from "../config";
import { slug } from "./formatter";
import path from "node:path";
import dayjs from "dayjs";
import { HttpError } from "../types/error";

export class MinioStorage {
  private client;

  constructor(with_storage = false) {
    if (!with_storage) return;

    this.client = new Client({
      endPoint: config.minioURL,
      accessKey: config.minioAccess,
      secretKey: config.minioSecret,
      region: "us-east-1",
      pathStyle: true,
      useSSL: false,
      port: config.minioPort,
    });
  }

  async createBucket() {
    if (!this.client) return;

    const exists = await this.client.bucketExists(config.minioBucket!);
    if (exists) return;

    await this.client.makeBucket(config.minioBucket!, "us-east-1");
    console.log("Bucket created");
  }

  async put(file: any, ...names: string[]) {
    if (!this.client || !file) return;

    let name = names.map((p) => slug(p)).join("/");
    name += "_" + dayjs().unix();
    name += path.extname(file.originalname);
    await this.client.putObject(config.minioBucket!, name, file.buffer);

    return name;
  }

  async get(path: string) {
    if (!this.client) return;
    return await this.client.getObject(config.minioBucket!, path);
  }

  async delete(...path: string[]) {
    const url = path?.join('/');
    if (!this.client || !url || !url.length) return;
    await this.client.removeObject(config.minioBucket!, url);
  }
}
