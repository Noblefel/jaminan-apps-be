import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import AuthController from "./controller/auth_controller.ts";
import UserController from "./controller/user_controller.ts";

export const routes = (authCt: AuthController, userCt: UserController) => {
  const router = Router();
  router.get("/health", (_, res) => res.send("hello"));
  router.post("/auth/login", auth, authCt.login);
  router.post("/auth/register", auth, authCt.register);
  router.get("/konsumen", auth, userCt.scanKonsumen);
  router.use(error);
  return router;
};

// middlewares

function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;
  // if (!token) throw new Error("no token");

  // const detail = jwt.verify(token, config.jwtSecret);
  next();
}

function error(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  const message = err.message || "terjadi kesalahan sistem";
  return res.status(err.code ?? 500).json({ message });
}
