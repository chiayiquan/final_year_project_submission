import * as JD from "decoders";
import * as Transaction from "./Transaction";

type Status = Readonly<"VALID" | "INVALID" | "USED">;

const status: Status[] = ["VALID", "INVALID", "USED"];

export type Overview = Readonly<{
  id: string;
  status: Status;
  createdAt: string;
  owner: string;
}>;

export type Detail = Readonly<{
  url: string;
  voucherDetail: {
    id: string;
    status: Status;
    owner: string;
    value: number;
    voucherId: number;
    contractId: string;
    contractAddress: string;
    createdAt: string;
  };
  transactions: Transaction.Schema[];
}>;

type ListApiResult = { vouchers: Overview[]; totalVouchers: number };

function decodeListApiBody(data: any): ListApiResult {
  return JD.object({
    vouchers: JD.array(
      JD.object({
        id: JD.string,
        status: JD.oneOf(status),
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        owner: JD.string,
      })
    ),
    totalVouchers: JD.number,
  }).verify(data);
}

function decodeDetailApiBody(data: any): Detail {
  return JD.object({
    url: JD.string,
    voucherDetail: JD.object({
      id: JD.string,
      status: JD.oneOf(status),
      owner: JD.string,
      value: JD.number,
      voucherId: JD.number,
      contractId: JD.string,
      contractAddress: JD.string,
      createdAt: JD.number.transform((epoch) =>
        new Date(epoch).toLocaleString()
      ),
    }),
    transactions: JD.array(
      JD.object({
        id: JD.string,
        type: JD.oneOf(Transaction.type),
        status: JD.oneOf(Transaction.status),
        from: JD.string,
        to: JD.string,
        referenceId: JD.string,
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        hash: JD.nullable(JD.string),
      })
    ),
  }).verify(data);
}

export { decodeListApiBody, decodeDetailApiBody };
