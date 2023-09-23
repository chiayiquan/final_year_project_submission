import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import Encryption from "../../libs/Encryption";
import File from "../../libs/File";
import * as JD from "decoders";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
  WALLET_NOT_FOUND: "This wallet does not exist.",
  INCORRECT_WALLET_PASSWORD: "The provided wallet password is incorrect.",
};

type Params = {
  walletPassword: string;
};

export default async function Transfer(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const user = await User.lib.getUserById(jwtPayload.userId);
  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const { walletPassword } = decodeParams(request.body);

  const encryptedFileContent = File.ReadWrite.readFile(user.id, "WALLET");

  if (encryptedFileContent == null)
    return StandardResponse.fail(response, errors, "WALLET_NOT_FOUND");

  const decryptedPK = await Encryption.FileEncryption.decrypt(
    encryptedFileContent,
    walletPassword
  );

  if (decryptedPK instanceof Error)
    return StandardResponse.fail(response, errors, "INCORRECT_WALLET_PASSWORD");

  return StandardResponse.bufferSuccess(response, decryptedPK, {
    contentType: "text/plain",
    disposition: `attachment; filename=${jwtPayload.userId}.txt`,
    cacheControl: StandardResponse.defaultHeaders.cacheControl,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    walletPassword: JD.string,
  }).verify(data);
}
