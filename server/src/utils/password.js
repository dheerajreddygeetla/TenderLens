import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

/** Basic strength gate — used by validation layer too. */
export const isStrongEnough = (password) => {
  if (typeof password !== "string" || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};
