import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import User from "../../libs/User";
import Regex from "../../libs/Regex";

const errors = {
  INVALID_EMAIL: "Email provided are invalid.",
  EMAIL_EXISTED: "Email already in use.",
  UNKNOWN_ERROR: "Unexpected error occurred, please try again.",
};
type Params = Readonly<{
  name: string;
  email: string;
  password: string;
  walletPassword: string;
}>;

type ResponseData = {
  message: string;
};

export default async function Register(
  request: express.Request,
  response: express.Response
) {
  const data = decode(request.body);

  const { walletPassword, ...userData } = data;

  if (Regex.lib.checkValidEmail(data.email) === false)
    return StandardResponse.fail(response, errors, "INVALID_EMAIL");

  if ((await User.lib.checkUserExist(data.email)) === true)
    return StandardResponse.fail(response, errors, "EMAIL_EXISTED");

  const user = await User.lib.createUser(userData, walletPassword);

  if (user == null)
    return StandardResponse.fail(response, errors, "UNKNOWN_ERROR");

  return StandardResponse.success<ResponseData>(response, {
    message: "Account has been created successfully.",
  });
}

function decode(data: any): Params {
  return JD.object({
    name: JD.string,
    email: JD.string.transform((str) => str.trim().toLowerCase()),
    password: JD.string.transform((str) => str.trim()),
    walletPassword: JD.string.transform((str) => str.trim()),
  }).verify(data);
}
