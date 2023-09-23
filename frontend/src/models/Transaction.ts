import * as JD from "decoders";

type Type = Readonly<
  | "CONTRACT_DEPLOYMENT"
  | "TRANSFER"
  | "REDEEM_VOUCHER"
  | "GENERATE_VOUCHER"
  | "UPDATE_FEES"
  | "UPDATE_PRICE"
>;
const type: Type[] = [
  "CONTRACT_DEPLOYMENT",
  "TRANSFER",
  "REDEEM_VOUCHER",
  "GENERATE_VOUCHER",
  "UPDATE_FEES",
  "UPDATE_PRICE",
];

export type ContractErrorType =
  | "INSUFFICIENT_PRIVILEGE"
  | "FEES_BELOW_ZERO"
  | "FEES_ABOVE_HUNDRED"
  | "INVALID_DEPOSIT_AMOUNT"
  | "INSUFFICIENT_USER_FUNDS"
  | "INVALID_VOUCHER_PRICE"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_VOUCHER"
  | "USED_VOUCHER"
  | "VOUCHER_EXISTED"
  | "DEPLOY_FAILED"
  | "UNKNOWN_ERROR";

const errorList: ContractErrorType[] = [
  "INSUFFICIENT_PRIVILEGE",
  "FEES_BELOW_ZERO",
  "FEES_ABOVE_HUNDRED",
  "INVALID_DEPOSIT_AMOUNT",
  "INSUFFICIENT_USER_FUNDS",
  "INVALID_VOUCHER_PRICE",
  "INSUFFICIENT_FUNDS",
  "INVALID_VOUCHER",
  "USED_VOUCHER",
  "VOUCHER_EXISTED",
  "DEPLOY_FAILED",
  "UNKNOWN_ERROR",
];

type Status = Readonly<"SUCCESS" | "PENDING" | ContractErrorType>;

const status: Status[] = [...errorList, "SUCCESS", "PENDING"];

export type Schema = Readonly<{
  id: string;
  type: Type;
  status: Status;
  from: string;
  to: string;
  referenceId: string;
  createdAt: string;
  hash: string | null;
}>;

function convertTypeToText(transactionType: Type): string {
  switch (transactionType) {
    case "CONTRACT_DEPLOYMENT":
      return "Contract Deployment";
    case "GENERATE_VOUCHER":
      return "Generate Voucher";
    case "REDEEM_VOUCHER":
      return "Redeem Voucher";
    case "TRANSFER":
      return "Transfer";
    case "UPDATE_FEES":
      return "Update Contract Fees";
    case "UPDATE_PRICE":
      return "Update Voucher Price";
    default:
      return "Invalid Operation";
  }
}

function convertStatusToText(status: Status): string {
  switch (status) {
    case "SUCCESS":
      return "SUCCESS";
    case "PENDING":
      return "PENDING";
    default:
      return "FAILED";
  }
}

function decode(data: any): {
  transactions: Schema[];
  totalTransactions: number;
} {
  return JD.object({
    transactions: JD.array(
      JD.object({
        id: JD.string,
        type: JD.oneOf(type),
        status: JD.oneOf(status),
        from: JD.string,
        to: JD.string,
        referenceId: JD.string,
        createdAt: JD.number.transform((epoch) =>
          new Date(epoch).toLocaleString()
        ),
        hash: JD.nullable(JD.string),
        address: JD.string,
      })
    ),
    totalTransactions: JD.number,
  }).verify(data);
}

export {
  status,
  type,
  errorList,
  convertTypeToText,
  convertStatusToText,
  decode,
};
