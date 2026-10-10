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
import { HttpError } from "./types/error.ts";
import type { TokenData } from "./types/auth.ts";
import type AuthController from "./controller/auth_controller.ts";
import type JaminanController from "./controller/jaminan_controller.ts";
import type StorageController from "./controller/storage_controller.ts";
import type PengambilanController from "./controller/pengambilan_controller.ts";
import type { Role } from "./types/user.ts";
import type PeminjamanController from "./controller/peminjaman_controller.ts";
import rateLimit from "express-rate-limit";

export const routes = (
  authCt: AuthController,
  jaminanCt: JaminanController,
  pinjamCt: PeminjamanController,
  ambilCt: PengambilanController,
  storageCt: StorageController,
) => {
  const router = Router();
  router.get("/health", (_, res) => res.send("hello"));
  router.post("/auth/login", authCt.login);
  router.post("/auth/register", authCt.register);

  router.post("/public/jaminan/scan", strict, jaminanCt.publicScan);
  router.post("/public/jaminan/:id/pinjam", strict, pinjamCt.publicStore);

  router.get(
    "/jaminan",
    auth,
    guard("marketing", "adm_jaminan", "hm"),
    jaminanCt.index,
  );

  router.post(
    "/jaminan",
    auth,
    guard("marketing", "hm"),
    upload.array("foto[]", 5),
    jaminanCt.store,
  );

  router.post(
    "/jaminan/:id/pinjam",
    auth,
    guard("marketing", "hm", "adm_jaminan"),
    upload.single("surat_pinjam"),
    pinjamCt.store,
  );

  router.post(
    "/jaminan/:id/out",
    auth,
    guard("marketing", "hm", "adm_jaminan"),
    jaminanCt.out,
  );

  router.get(
    "/peminjaman",
    auth,
    guard("marketing", "adm_jaminan", "adm_external", "adm_internal", "hm"),
    pinjamCt.get,
  );

  router.post(
    "/peminjaman/:id/approve",
    auth,
    guard("adm_jaminan", "hm"),
    pinjamCt.approve,
  );

  router.post(
    "/peminjaman/:id/return",
    auth,
    guard("adm_jaminan", "hm"),
    pinjamCt.returning,
  );

  router.get(
    "/pengambilan",
    auth,
    guard("marketing", "adm_jaminan", "adm_external", "adm_internal", "hm"),
    ambilCt.get,
  );

  router.post(
    "/pengambilan",
    auth,
    guard("marketing", "hm"),
    upload.single("foto_bast"),
    ambilCt.store,
  );

  router.put(
    "/pengambilan/:id",
    auth,
    guard("marketing", "hm"),
    upload.single("foto_bast"),
    ambilCt.put,
  );

  router.post(
    "/pengambilan/:id/approve",
    auth,
    guard("adm_jaminan", "adm_external", "adm_internal", "hm"),
    ambilCt.approve,
  );

  router.get("/storage/*path", storageCt.get);
  router.use(error);
  return router;
};

// middlewares

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const strict = rateLimit({
  limit: 20,
  windowMs: 60 * 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: () => {
    throw HttpError("Anda terkena rate limit", 429);
  },
});

const guard = (...roles: Role[]): RequestHandler => {
  return function (req: Request, res: Response, next: NextFunction) {
    const auth: TokenData = res.locals.auth;
    if (!roles.includes(auth.role)) throw HttpError(`akses dilarang`, 403);
    next();
  };
};

function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const detail = jwt.verify(token!, config.jwtSecret) as TokenData;
    if (dayjs().isAfter(detail.expire)) throw new Error("token expired");
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
