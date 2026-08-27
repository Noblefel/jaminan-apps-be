import "reflect-metadata";
import e from "express";
import cors from "cors";
import { config } from "./config.ts";
import { Connection } from "./connection.ts";
import { routes } from "./router.ts";

async function start() {
  await Connection.initialize();
  const app = e();

  app.use(cors({ origin: config.allowedOrigins }));
  app.use(e.json());
  app.use(routes());

  console.log("listening on " + config.port);
  app.listen(config.port);
}

await start()