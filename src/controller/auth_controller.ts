import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import {
  validateLogin,
  validateRegister,
  type LoginRequest,
  type RegisterRequest,
  type TokenData,
} from "../types/auth.ts";
import { User } from "../types/user.ts";
import { config } from "../config.ts";
import { HttpError } from "../types/error.ts";
import dayjs from "dayjs";

export default class AuthController {
  constructor(private repo: Repository<User>) {}

  login = async (req: Request, res: Response) => {
    const input: LoginRequest = req.body;
    const fail = validateLogin(input);
    if (fail) throw HttpError(fail, 400);

    const user = await this.repo.findOne({ where: { email: input.email } });

    if (!user || !bcrypt.compareSync(input.password, user!.password)) {
      throw HttpError("email atau password salah", 401);
    }

    const data: TokenData = {
      id: user.id,
      name: user.name,
      role: user.role,
      expire: dayjs().add(30, "day").toDate(),
    };

    data.token = jwt.sign(data, config.jwtSecret);

    return res.json({ data });
  };

  register = async (req: Request, res: Response) => {
    const input: RegisterRequest = req.body;
    const fail = validateRegister(input);
    if (fail) throw HttpError(fail, 400);

    const exist = await this.repo.exists({ where: { email: input.email } });
    if (exist) throw HttpError("email sudah digunakan", 409);

    const user = new User();
    user.name = input.name;
    user.email = input.email;
    user.password = bcrypt.hashSync(input.password, 13);
      
    await this.repo.save(user); 

    return res.json({ message: "Akun berhasil didaftarkan" });
  };
}
