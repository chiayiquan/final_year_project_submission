import bcrypt from "bcrypt";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 11);
}

async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export default { hashPassword, comparePassword };
