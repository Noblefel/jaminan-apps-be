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

async function start() {
  await Connection.initialize();

  const storage = new MinioStorage();
  await storage.createBucket();

  const userRepo = Connection.getRepository(User);
  const jaminanRepo = Connection.getRepository(Jaminan);

  const userCt = new UserController(userRepo);
  const authCt = new AuthController(userRepo);
  const jaminanCt = new JaminanController(jaminanRepo, storage);
  const route = routes(authCt, userCt, jaminanCt);

  const app = e();
  app.use(cors({ origin: config.allowedOrigins }));
  app.use(e.json());
  app.use(route);

  console.log("listening on " + config.port);
  app.listen(config.port);
}

await start();
