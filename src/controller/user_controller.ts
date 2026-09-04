import type { Repository } from "typeorm";
import { type User } from "../types/user";
import { HttpError } from "../types/error";
import type { Request, Response } from "express";

// prettier-ignore
const dummy = [
  { nama: "Mas Erlangga", nik: 10249123, tipe: "internal", alamat: "Gunung Putri" },
  { nama: "Mas Ichwan", nik: 4938242, tipe: "internal", alamat: "Klapanunggal" },
  { nama: "Mas Ichwan Kedua", nik: 321321, tipe: "internal", alamat: "Klapanunggal" },
  { nama: "Mas Jibran", nik: 5849258, tipe: "external", alamat: "Cileungsi" },
  { nama: "Mas Jibran Kedua", nik: 567444, tipe: "external", alamat: "Cileungsi" },
  { nama: "Mas Fahri", nik: 7795792, tipe: "external", alamat: "Cibinong" },
];

export default class UserController {
  constructor(private repo: Repository<User>) {}
}
