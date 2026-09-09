import { DataSource } from "typeorm";
import { config } from "./config.ts";
import { User } from "./types/user.ts";
import { Jaminan } from "./types/jaminan.ts";
import { Pengambilan } from "./types/pengambilan.ts";
import { JaminanBarang } from "./types/jaminan_barang.ts";

export const Connection = new DataSource({
  type: config.database as any, // typescript membagongkan
  host: config.databaseHost,
  port: config.databasePort,
  username: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  synchronize: true,
  logging: true,
  entities: [User, Jaminan, JaminanBarang, Pengambilan],
  timezone: "Z",
  invalidWhereValuesBehavior: { null: "sql-null" },
});
