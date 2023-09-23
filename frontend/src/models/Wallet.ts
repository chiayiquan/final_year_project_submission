import * as JD from "decoders";
import Conversion from "../libs/conversion";

type TransferType = "FEES" | "TRANSFER";

const transferType: TransferType[] = ["FEES", "TRANSFER"];
export type Schema = Readonly<{
  id: string;
  transferType: TransferType;
  value: number;
  from: string;
  to: string;
  createdAt: string;
}>;

function decodeBalance(data: any): { balance: number } {
  return JD.object({
    balance: JD.number,
  }).verify(data);
}

function decodeTransferResponse(data: any): {
  message: string;
  hash: string;
} {
  return JD.object({
    message: JD.string,
    hash: JD.string,
  }).verify(data);
}

function decodeTransferHistory(data: any): {
  transfers: Schema[];
  totalTransfers: number;
} {
  return JD.object({
    transfers: JD.array(
      JD.object({
        id: JD.string,
        transferType: JD.oneOf(transferType),
        value: JD.number.transform((num) => Conversion.convertFromUAvax(num)),
        from: JD.string,
        to: JD.string,
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
      })
    ),
    totalTransfers: JD.number,
  }).verify(data);
}

export default { decodeBalance, decodeTransferResponse, decodeTransferHistory };
