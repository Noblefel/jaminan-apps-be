import type { Request } from "express";
import { HttpError } from "./error";
import type { Role } from "./user";

export interface TokenData {
  id: number;
  name: string;
  role: Role;
  token?: string;
  expire?: Date;
}

interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export function validateLogin(req: Request): LoginRequest {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(req.body.email))
    throw HttpError("format email tidak benar", 400);
  if (req.body.password.length < 8)
    throw HttpError("password minimal 8 karakter", 400);
  return req.body;
}

export function validateRegister(req: Request): RegisterRequest {
  if (!req.body.name.length) throw HttpError("nama masih kosong", 400);
  if (req.body.name.length > 100) throw HttpError("nama terlalu panjang", 400);
  validateLogin(req);
  return req.body;
}
