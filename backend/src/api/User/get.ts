import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import User, { Role } from "../../libs/User";
import JWT, { JWTError } from "../../libs/JWT";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
  stripeUserId: string | null;
};

export default async function Get(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const user = await User.lib.getUserById(jwtPayload.userId);

  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const { password, ...userData } = user;
  return StandardResponse.success<ResponseData>(response, {
    ...userData,
  });
}
