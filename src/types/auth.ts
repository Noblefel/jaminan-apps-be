import type { ROLE } from "./user";

export interface TokenData {
  id: number;
  name: string;
  role: ROLE;
  token?: string;
  expire?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export function validateLogin(req: LoginRequest) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(req.email)) return "format email salah";
  if (req.password.length < 8) return "password minimal 8 karakter";
  return false;
}

export function validateRegister(req: RegisterRequest) {
  if (!req.name.length) return "nama masih kosong";
  if (req.name.length > 100) return "nama terlalu panjang";
  return validateLogin({ email: req.email, password: req.password });
}
