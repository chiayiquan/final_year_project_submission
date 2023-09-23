import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import User, { Role } from "../../libs/User";
import Session from "../../libs/Session";
import JWT from "../../libs/JWT";
import Encryption from "../../libs/Encryption";

const errors = {
  INCORRECT_ACCOUNT_INFO: "The email or password provided is incorrect.",
};
type Params = Readonly<{
  email: string;
  password: string;
}>;

type ResponseData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
  stripeUserId: string | null;
  jwt: string;
};

export default async function Login(
  request: express.Request,
  response: express.Response
) {
  const data = decode(request.body);

  const user = await User.lib.getUser(data.email);

  if (user == null)
    return StandardResponse.fail(response, errors, "INCORRECT_ACCOUNT_INFO");

  if (
    (await Encryption.PasswordEncryption.comparePassword(
      data.password,
      user.password
    )) === false
  )
    return StandardResponse.fail(response, errors, "INCORRECT_ACCOUNT_INFO");

  const session = await Session.lib.createSession(user.id);

  const jwt = await JWT.lib.issue(session.id, user.id);

  const { password, ...userData } = user;
  return StandardResponse.success<ResponseData>(response, {
    ...userData,
    jwt,
  });
}

function decode(data: any): Params {
  return JD.object({
    email: JD.string.transform((str) => str.trim().toLowerCase()),
    password: JD.string.transform((str) => str.trim()),
  }).verify(data);
}
