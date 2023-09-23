import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import Cryptos from "../../libs/Cryptos";
import env from "../../env";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import { ethers } from "ethers";
import USDCArtifact from "../../../artifacts/contracts/USDC/USDC.json";
import Conversion from "../../libs/Cryptos/conversion";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  balance: number;
};

export default async function GetBalance(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const user = await User.lib.getUserById(jwtPayload.userId);
  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const wallet = Cryptos.Wallet.initWallet();
  const usdcContract = new ethers.Contract(
    env.USDC_ADDRESS,
    USDCArtifact,
    wallet
  );

  const balance = await usdcContract.balanceOf(user.id);

  return StandardResponse.success<ResponseData>(response, {
    balance: Conversion.convertFromUAvax(balance),
  });
}
