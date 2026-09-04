import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import multer from "multer";

import { config } from "./config.ts";
import { ROLE } from "./types/user.ts";
import { HttpError } from "./types/error.ts";
import type { TokenData } from "./types/auth.ts";
import type AuthController from "./controller/auth_controller.ts";
import type UserController from "./controller/user_controller.ts";
import type JaminanController from "./controller/jaminan_controller.ts";
import type ClientController from "./controller/client_controller.ts";
import type StorageController from "./controller/storage_controller.ts";
import type ScanController from "./controller/scan_controller.ts";

export const routes = (
  authCt: AuthController,
  userCt: UserController,
  scanCt: ScanController,
  clientCt: ClientController,
  jaminanCt: JaminanController,
  storageCt: StorageController,
) => {
  const router = Router();
  router.get("/health", (_, res) => res.send("hello"));
  router.post("/auth/login", authCt.login);
  router.post("/auth/register", authCt.register);

  router.get(
    "/jaminan",
    auth,
    guard(ROLE.MARKETING, ROLE.ADMIN_JAMINAN, ROLE.HEAD_MANAGER),
    jaminanCt.index,
  );

  router.post(
    "/jaminan",
    auth,
    guard(ROLE.MARKETING, ROLE.HEAD_MANAGER),
    upload.fields(jaminanField),
    jaminanCt.store,
  );

  router.put(
    "/jaminan/:id",
    auth,
    guard(ROLE.MARKETING, ROLE.HEAD_MANAGER),
    upload.fields(jaminanFieldEdit),
    jaminanCt.put,
  );
  
  router.get("/scan/:uuid", scanCt.scanPublic);
  router.get("/client/search", auth, clientCt.search);
  router.get("/storage/*path", storageCt.get);
  router.use(error);
  return router;
};

// middlewares

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const guard = (...roles: ROLE[]): RequestHandler => {
  return function (req: Request, res: Response, next: NextFunction) {
    const auth: TokenData = res.locals.auth;
    if (!roles.includes(auth.role)) throw HttpError(`akses dilarang`, 405);
    next();
  };
};

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

// upload fields

const jaminanFieldEdit = [
  { name: "foto_jaminan" },
  { name: "foto_surat_pinjam" },
];

const jaminanField = [
  { name: "jaminan[foto_jaminan]" },
  { name: "jaminan[foto_surat_pinjam]" },
];
