import * as JD from "decoders";

export type Role = Readonly<
  | "USER"
  | "ADMIN"
  | "MERCHANT"
  | "ORGANIZATION_MANAGER"
  | "ORGANIZATION_MEMBER"
  | "BENEFICIARY"
>;
const role: Role[] = [
  "USER",
  "ADMIN",
  "MERCHANT",
  "ORGANIZATION_MANAGER",
  "ORGANIZATION_MEMBER",
  "BENEFICIARY",
];

type User = Readonly<{
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
  stripeUserId: string | null;
}>;

export type UserSchema = Readonly<User & { jwt: string }>;

export function decodeUser(data: any): UserSchema | null {
  try {
    return JD.object({
      id: JD.string,
      name: JD.string,
      email: JD.string,
      role: JD.oneOf(role),
      createdAt: JD.number,
      stripeUserId: JD.nullable(JD.string),
      jwt: JD.string,
    }).verify(data);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function decodeUserInfo(data: any): User | null {
  try {
    return JD.object({
      id: JD.string,
      name: JD.string,
      email: JD.string,
      role: JD.oneOf(role),
      createdAt: JD.number,
      stripeUserId: JD.nullable(JD.string),
    }).verify(data);
  } catch (error) {
    return null;
  }
}
