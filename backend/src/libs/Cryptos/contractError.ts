import * as JD from "decoders";

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

export const errorList: ContractErrorType[] = [
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

export const errors: { [key in ContractErrorType]: string } = {
  INSUFFICIENT_PRIVILEGE: "Insufficient privilege to perform this function",
  FEES_BELOW_ZERO: "Fees percentage must be greater than 0",
  FEES_ABOVE_HUNDRED: "Fees percentage must be lesser than 100",
  INVALID_DEPOSIT_AMOUNT: "Deposit amount must be greater than 0",
  INSUFFICIENT_USER_FUNDS: "USDC funds not enough",
  INVALID_VOUCHER_PRICE: "Voucher price cannot be below 0.000001",
  INSUFFICIENT_FUNDS: "Insufficient usdc balance to issue voucher",
  INVALID_VOUCHER: "Voucher is invalid",
  USED_VOUCHER: "Voucher has already been redeemed",
  VOUCHER_EXISTED: "Voucher has already existed",
  DEPLOY_FAILED: "Error in deploying smart contract",
  UNKNOWN_ERROR: "Unexpected error has occurred. Please retry again.",
};

export function decodeContractError(data: any): ContractErrorType {
  try {
    return JD.oneOf<ContractErrorType>(errorList).verify(data);
  } catch (error) {
    console.log(error);
    return "UNKNOWN_ERROR";
  }
}

export class ContractError extends Error {
  name: keyof typeof errors;
  constructor(code: keyof typeof errors) {
    super(errors[code]);
    this.name = code;
  }
}
