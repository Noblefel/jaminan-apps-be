import "reflect-metadata";
import e from "express";
import cors from "cors";
import path from "node:path";
import dayjs from "dayjs";
import id from "dayjs/locale/id";
import { Eta } from "eta";
import { config } from "./config.ts";
import { Connection } from "./connection.ts";
import { routes } from "./router.ts";
import { User } from "./types/user.ts";
import { Jaminan } from "./types/jaminan.ts";
import { MinioStorage } from "./utils/storage.ts";
import { Pengambilan } from "./types/pengambilan.ts";
import { Peminjaman } from "./types/peminjaman.ts";
import AuthController from "./controller/auth_controller.ts";
import StorageController from "./controller/storage_controller.ts";
import JaminanController from "./controller/jaminan_controller.ts";
import PengambilanController from "./controller/pengambilan_controller.ts";
import PeminjamanController from "./controller/peminjaman_controller.ts";

async function start() {
  await Connection.initialize();
  dayjs.locale(id);

  const storage = new MinioStorage(config.storage);
  await storage.createBucket();

  const eta = new Eta({
    views: path.join(import.meta.dirname, "templates"),
    defaultExtension: ".html",
  });

  const userRp = Connection.getRepository(User);
  const jaminanRp = Connection.getRepository(Jaminan);
  const pinjamRp = Connection.getRepository(Peminjaman);
  const ambilRp = Connection.getRepository(Pengambilan);

  const route = routes(
    new AuthController(userRp),
    new JaminanController(jaminanRp, storage),
    new PeminjamanController(pinjamRp, jaminanRp, storage),
    new PengambilanController(ambilRp, jaminanRp, storage),
    new StorageController(storage),
  );

  const app = e();
  app.use(cors({ origin: config.allowedOrigins }));
  app.use(e.static("public"));
  app.use(e.json());
  app.use(route);

  console.log("listening on " + config.port);
  app.listen(Number(config.port), "0.0.0.0");
}

await start();
