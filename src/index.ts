import "reflect-metadata";
import e from "express";
import cors from "cors";
import { config } from "./config.ts";
import { Connection } from "./connection.ts";
import { routes } from "./router.ts";
import { User } from "./types/user.ts";
import AuthController from "./controller/auth_controller.ts";
import UserController from "./controller/user_controller.ts";
import JaminanController from "./controller/jaminan_controller.ts";
import { Jaminan } from "./types/jaminan.ts";
import { MinioStorage } from "./utils/storage.ts";
import { ClientManual } from "./types/client.ts";
import { ClientController } from "./controller/client_controller.ts";
import { StorageController } from "./controller/storage_controller.ts";

async function start() {
  await Connection.initialize();

  const storage = new MinioStorage(config.storage);
  await storage.createBucket();

  const userRp = Connection.getRepository(User);
  const clientRp = Connection.getRepository(ClientManual);
  const jaminanRp = Connection.getRepository(Jaminan);

  const userCt = new UserController(userRp);
  const authCt = new AuthController(userRp);
  const clientCt = new ClientController(clientRp);
  const jaminanCt = new JaminanController(jaminanRp, clientRp, storage);
  const storageCt = new StorageController(storage);
  
  const route = routes(authCt, userCt, clientCt, jaminanCt, storageCt);

  const app = e();
  app.use(cors({ origin: config.allowedOrigins }));
  app.use(e.json());
  app.use(route);

  console.log("listening on " + config.port);
  app.listen(config.port);
}

await start();
