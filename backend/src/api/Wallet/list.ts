import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import Transfer, { TransferSchema } from "../../libs/Transfer";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  transfers: TransferSchema[];
  totalTransfers: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const user = await User.lib.getUserById(jwtPayload.userId);
  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const { page, limit } = decodeParams(request.query);

  const [transfers, totalTransfers] = await Promise.all([
    Transfer.lib.getTransferWithPagination(user.id, page, limit),
    Transfer.lib.getTotalTransfer(user.id),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    transfers,
    totalTransfers,
  });
}

function decodeParams(data: any): Params {
  return JD.object({
    page: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
    limit: JD.optional(JD.string).transform(
      (strNum) => Number(strNum) || undefined
    ),
  }).verify(data);
}
