import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import * as JD from "decoders";
import JWT, { JWTError } from "../../libs/JWT";
import * as Voucher from "../../libs/Voucher";

const errors = {
  ...JWT.lib.errors,
};

type ResponseData = {
  vouchers: {
    id: string;
    status: Voucher.Status;
    createdAt: number;
    owner: string;
  }[];
  totalVouchers: number;
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

  if (jwtPayload instanceof JWTError) {
    return StandardResponse.fail(response, errors, jwtPayload.name);
  }

  const { page, limit } = decodeParams(request.query);

  const [vouchers, totalVouchers] = await Promise.all([
    Voucher.getVoucherWithPagination({ owner: jwtPayload.userId }, page, limit),
    Voucher.getTotalVoucherByUserId(jwtPayload.userId),
  ]);

  return StandardResponse.success<ResponseData>(response, {
    vouchers: vouchers.map(({ id, status, createdAt, owner }) => ({
      id,
      status,
      createdAt,
      owner,
    })),
    totalVouchers,
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
