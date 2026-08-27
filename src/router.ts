import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "./config.ts";
import jwt from "jsonwebtoken";

import AuthController from "./controller/auth_controller.ts";
import { Connection } from "./connection.ts";
import { User } from "./types/user.ts";

export const routes = () => {
  const repoUser = Connection.getRepository(User);
  const authController = new AuthController(repoUser);

  const router = Router(); 
  router.get("/health", (req, res) => res.send("hello"));
  router.post("/auth/login", auth, authController.login);
  router.post("/auth/register", auth, authController.register);
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
