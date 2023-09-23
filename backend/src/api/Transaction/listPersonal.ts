import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import * as Transaction from "../../libs/Transaction";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
};

type ResponseData = {
  transactions: Transaction.Schema[];
  totalTransactions: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function ListPersonal(
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

  const [transactions, totalTransactions] = await Promise.all([
    Transaction.getTransactionWithAddress(
      page,
      limit,
      { from: user.id },
      { to: user.id }
    ),
    Transaction.getTotalTransactions({ from: user.id }, { to: user.id }),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    transactions,
    totalTransactions,
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
