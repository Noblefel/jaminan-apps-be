import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import multer from "multer";

import AuthController from "./controller/auth_controller.ts";
import UserController from "./controller/user_controller.ts";
import { HttpError } from "./types/error.ts";
import { config } from "./config.ts";
import type { TokenData } from "./types/auth.ts";
import type JaminanController from "./controller/jaminan_controller.ts";
import type { ClientController } from "./controller/client_controller.ts";

export const routes = (
  authCt: AuthController,
  userCt: UserController,
  clientCt: ClientController,
  jaminanCt: JaminanController,
) => {
  const router = Router();
  router.get("/health", (_, res) => res.send("hello"));
  router.post("/auth/login", authCt.login);
  router.post("/auth/register", authCt.register);
  router.get("/konsumen", auth, userCt.scanKonsumen);

  const jaminanField = [
    { name: "jaminan[foto_jaminan]" },
    { name: "jaminan[foto_surat_pinjam]" },
  ];

  router.post("/jaminan", auth, upload.fields(jaminanField), jaminanCt.store);
  router.get("/jaminan", auth, jaminanCt.index);

  // router.post("/client/check-nik", auth, clientCt.checkNik);
  router.get("/client/search", auth, clientCt.search);

  router.use(error);
  return router;
};

// middlewares

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const detail = jwt.verify(token!, config.jwtSecret) as TokenData;
    if (dayjs().isAfter(detail.expire)) throw new Error("expired");
    res.locals.auth = detail;
    next();
  } catch (error: any) {
    throw HttpError(`unauthorized (${error.message})`, 401);
  }
}

function error(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  const message = err.message || "terjadi kesalahan sistem";
  return res.status(err.statusCode ?? 500).json({ message });
}
