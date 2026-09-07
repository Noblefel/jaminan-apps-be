import "reflect-metadata";
import e from "express";
import cors from "cors";
import path from "node:path";
import { Eta } from "eta";
import { config } from "./config.ts";
import { Connection } from "./connection.ts";
import { routes } from "./router.ts";
import { User } from "./types/user.ts";
import { Jaminan } from "./types/jaminan.ts";
import { MinioStorage } from "./utils/storage.ts";
import { ClientManual } from "./types/client.ts";
import { Pengambilan } from "./types/pengambilan.ts";
import AuthController from "./controller/auth_controller.ts";
import ClientController from "./controller/client_controller.ts";
import StorageController from "./controller/storage_controller.ts";
import JaminanController from "./controller/jaminan_controller.ts";
import ScanController from "./controller/scan_controller.ts";
import PengambilanController from "./controller/pengambilan_controller.ts";

async function start() {
  await Connection.initialize();

  const storage = new MinioStorage(config.storage);
  await storage.createBucket();

  const eta = new Eta({
    views: path.join(import.meta.dirname, "templates"),
    defaultExtension: ".html",
  });

  const userRp = Connection.getRepository(User);
  const clientRp = Connection.getRepository(ClientManual);
  const jaminanRp = Connection.getRepository(Jaminan);
  const ambilRp = Connection.getRepository(Pengambilan);
 
  const route = routes(
    new AuthController(userRp),
    new ScanController(jaminanRp, eta),
    new ClientController(clientRp),
    new JaminanController(jaminanRp, clientRp, storage),
    new PengambilanController(ambilRp, jaminanRp, storage),
    new StorageController(storage),
  );

  const app = e();
  app.use(cors({ origin: config.allowedOrigins }));
  app.use(e.static("public"));
  app.use(e.json());
  app.use(route);

  console.log("listening on " + config.port);
  app.listen(config.port);
}

await start();
