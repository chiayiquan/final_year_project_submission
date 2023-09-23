import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import * as Transaction from "../../libs/Transaction";

type ResponseData = {
  transactions: Transaction.TransactionWithContractAddress[];
  totalTransactions: number;
};

type Params = {
  page?: number;
  limit?: number;
};

export default async function List(
  request: express.Request,
  response: express.Response
): Promise<express.Response> {
  const { page, limit } = decodeParams(request.query);

  const [transactions, totalTransactions] = await Promise.all([
    Transaction.getTransactionWithAddress(page, limit),
    Transaction.getTotalTransactions({}),
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
