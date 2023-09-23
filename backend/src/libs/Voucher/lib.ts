import * as Voucher from "./model";
import db, { generateID } from "../../db";
import { Knex } from "knex";
import jwt from "jsonwebtoken";
import * as JD from "decoders";
import env from "../../env";

const { VOUCHER_SECRET } = env;
async function insertVoucher(
  data: {
    owner: string;
    value: number;
    voucherId: number;
    contractId: string;
  }[],
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Voucher.Schema[]> {
  return Voucher.insert(
    data.map((voucherData) => ({
      ...voucherData,
      status: "VALID",
      createdAt: Date.now(),
      id: generateID(),
    })),
    txns
  );
}

async function getMultipleVouchers(ids: string[]): Promise<Voucher.Schema[]> {
  return Voucher.getByIds(ids);
}

async function getVoucher(
  whereClause: Partial<Voucher.Schema>,
  whereBetween: {
    column: keyof Partial<Voucher.Schema>;
    range: [number, number];
  } | null = null
): Promise<Voucher.Schema[]> {
  return Voucher.get(whereClause, whereBetween);
}

async function getVoucherWithPagination(
  whereClause: Partial<Voucher.Schema>,
  page: number = 0,
  limit: number = 10
): Promise<Voucher.Schema[]> {
  return Voucher.getWithPagination(whereClause, page * limit, limit);
}

async function updateVoucherStatus(
  status: Voucher.Status,
  whereClause: Partial<Voucher.Schema>,
  txns: Knex.Transaction | Knex<any, unknown[]> = db
): Promise<Voucher.Schema[]> {
  return Voucher.update({ status }, whereClause, txns);
}

async function getTotalVoucherByUserId(userId: string): Promise<number> {
  return Voucher.count(userId);
}

type VoucherUrlPayload = {
  id: string;
};

async function issue(id: string): Promise<string> {
  return jwt.sign({ id }, VOUCHER_SECRET);
}

async function verifyToken(id: string): Promise<Voucher.Schema | VoucherError> {
  try {
    const payload = decodePayload(jwt.verify(id, VOUCHER_SECRET));
    const voucher = (await Voucher.get({ id: payload.id }))[0] || null;
    return voucher == null ? new VoucherError("INVALID_VOUCHER") : voucher;
  } catch (error) {
    return new VoucherError("INVALID_VOUCHER");
  }
}

function decodePayload(data: any): VoucherUrlPayload {
  return JD.object({
    id: JD.string,
  }).verify(data);
}

class VoucherError extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}

const errors = {
  INVALID_VOUCHER: "Voucher does not exist.",
};

export {
  insertVoucher,
  getMultipleVouchers,
  getVoucher,
  updateVoucherStatus,
  issue,
  verifyToken,
  errors,
  VoucherError,
  getVoucherWithPagination,
  getTotalVoucherByUserId,
};
