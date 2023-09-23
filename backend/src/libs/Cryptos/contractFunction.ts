import { Contract, ethers, BigNumberish, Wallet } from "ethers";
import * as JD from "decoders";
import env from "../../env";
import Conversion from "./conversion";
import { ContractError, errors, decodeContractError } from "./contractError";
import ContractArtifact from "./contractArtifact";

type VoucherStatus = "VALID" | "USED" | "INVALID";

type ActionStatus =
  | "REDEEM_SUCCESS"
  | "GENERATE_SUCCESS"
  | "VOUCHER_EXISTED"
  | "INVALID_VOUCHER"
  | "USED_VOUCHER"
  | "REVOKE_SUCCESS"
  | "REVOKE_FAILED"
  | "INSUFFICIENT_PRIVILEGE"
  | "FEES_BELOW_ZERO"
  | "FEES_ABOVE_HUNDRED"
  | "INVALID_DEPOSIT_AMOUNT"
  | "INSUFFICIENT_USER_FUNDS"
  | "INVALID_VOUCHER_PRICE"
  | "INSUFFICIENT_FUNDS"
  | "DETAIL_RETRIEVAL_SUCCESS";

const voucherStatusArr: VoucherStatus[] = ["VALID", "USED", "INVALID"];

const actionStatusArr: ActionStatus[] = [
  "REDEEM_SUCCESS",
  "GENERATE_SUCCESS",
  "VOUCHER_EXISTED",
  "INVALID_VOUCHER",
  "USED_VOUCHER",
  "REVOKE_SUCCESS",
  "REVOKE_FAILED",
  "INSUFFICIENT_PRIVILEGE",
  "FEES_BELOW_ZERO",
  "FEES_ABOVE_HUNDRED",
  "INVALID_DEPOSIT_AMOUNT",
  "INSUFFICIENT_USER_FUNDS",
  "INVALID_VOUCHER_PRICE",
  "INSUFFICIENT_FUNDS",
  "DETAIL_RETRIEVAL_SUCCESS",
];

export type Voucher = {
  value: number;
  voucherStatus: VoucherStatus;
  id: number;
  actionStatus: ActionStatus;
  voucherOwner: string;
  contractAddress: string;
};

export function decodeVoucherArr(data: any): Voucher[] {
  try {
    return JD.array(
      JD.tuple(
        JD.unknown,
        JD.oneOf<VoucherStatus>(voucherStatusArr),
        JD.unknown,
        JD.oneOf<ActionStatus>(actionStatusArr),
        JD.string,
        JD.string
      )
    )
      .verify(data)
      .map((element) => ({
        value: Conversion.convertFromUAvax(
          ethers.toNumber(element[0] as BigNumberish)
        ),
        voucherStatus: element[1],
        id: ethers.toNumber(element[2] as BigNumberish),
        actionStatus: element[3],
        voucherOwner: element[4],
        contractAddress: element[5],
      }));
  } catch (error) {
    console.log(error);
    return [];
  }
}

function decodeVoucher(data: any): Voucher {
  const cleanData = JD.tuple(
    JD.unknown,
    JD.oneOf<VoucherStatus>(voucherStatusArr),
    JD.unknown,
    JD.oneOf<ActionStatus>(actionStatusArr),
    JD.string,
    JD.string
  ).verify(data);
  return {
    value: Conversion.convertFromUAvax(
      ethers.toNumber(cleanData[0] as BigNumberish)
    ),
    voucherStatus: cleanData[1],
    id: ethers.toNumber(cleanData[2] as BigNumberish),
    actionStatus: cleanData[3],
    voucherOwner: cleanData[4],
    contractAddress: cleanData[5],
  };
}

/* get the usdc address of the contract */
async function getUsdcAddress(contract: Contract): Promise<string> {
  return contract.usdcToken();
}

/* get the amount of the unused voucher in the contract */
async function getUnusedVoucherAmount(contract: Contract): Promise<number> {
  return Conversion.convertFromUAvax(await contract.unusedVoucherAmount());
}

/* get the total number of voucher used */
async function getTotalVoucherUsed(contract: Contract): Promise<number> {
  return ethers.toNumber(await contract.totalVoucherUsed());
}

/* get the total number of voucher issued */
async function getTotalVoucherIssued(contract: Contract): Promise<number> {
  return ethers.toNumber(await contract.totalVoucherIssued());
}

/* get the contract owner address */
async function getContractOwner(contract: Contract): Promise<string> {
  return contract.owner();
}

/* get the voucher price */
async function getVoucherPrice(contract: Contract): Promise<number> {
  return Conversion.convertFromUAvax(await contract.mealVoucherPrice());
}

/* get the state of a meal voucher */
async function getMealVoucherDetail(
  contract: Contract,
  address: string,
  voucherId: number
): Promise<Voucher | ContractError> {
  try {
    return decodeVoucher(
      await contract.retrieveVoucherDetail(address, voucherId)
    );
  } catch (error) {
    console.log(error);
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

/* get the current % for management fees */
async function getCurrentManagementFees(contract: Contract): Promise<number> {
  return parseFloat(await contract.managementFees()) / 100;
}

/* get all the vouchers that belong to the user */
async function getUserVouchers(
  contract: Contract,
  address: string
): Promise<number[]> {
  return (await contract.getUserVouchers(address)).map((voucher: number) =>
    ethers.toNumber(voucher)
  );
}

/* get the total usdc balance in the contract */
async function getUsdcBalance(contract: Contract): Promise<number> {
  return Conversion.convertFromUAvax(await contract.getUsdcBalance());
}

/* update the usdc address for the contract */
async function updateUsdcAddress(
  contract: Contract,
  address: string
): Promise<boolean | ContractError> {
  try {
    return contract.updateUsdcAddress(address);
  } catch (error) {
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

/* update the management fees for the contract */
async function updateManagementFees(
  contract: Contract,
  fees: number,
  nonce: number
): Promise<string | ContractError> {
  try {
    const txns = await contract.updateManagementFees(fees * 100, {
      nonce,
    });
    const receipt = await txns.wait();
    return receipt.hash;
  } catch (error) {
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

/* redeem a voucher */
async function redeemVoucher(
  contract: Contract,
  voucherParams: {
    userAddress: string;
    voucherId: number;
    merchantAddress: string;
  }[],
  length: number,
  nonce: number
): Promise<string | ContractError> {
  try {
    const txns = await contract.redeemVoucher(voucherParams, length, {
      gasLimit: 15000000,
      nonce,
    });
    const receipt = await txns.wait();
    return receipt.hash;
  } catch (error) {
    console.log(error);
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

/* update the voucher price */
async function updateVoucherPrice(
  contract: Contract,
  voucherPrice: number,
  nonce: number
): Promise<string | ContractError> {
  try {
    const txns = await contract.setVoucherPrice(
      Conversion.convertToUAvax(voucherPrice),
      { nonce }
    );
    const receipt = await txns.wait();
    return receipt.hash;
  } catch (error) {
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

/* generate voucher for a user */
async function generateVoucher(
  contract: Contract,
  idArr: { userAddress: string; voucherIds: number[] }[],
  totalLength: number,
  nonce: number,
  gasLimit: number = 15000000
): Promise<string | ContractError> {
  try {
    // const filter = contract.filters.VoucherGenerated(); // replace with your event name
    // contract
    //   .on("VoucherGenerated", (vouchers, event) => {
    //     console.log(vouchers.args[0]); // this will log the event object
    //     event.removeListener();
    //     resolve(decodeVoucherArr(vouchers.args[0]));
    //   })
    //   .catch((error) => {
    //     reject(error);
    //   });

    const txn = await contract.generateVoucher(idArr, totalLength, {
      gasLimit,
      nonce,
    });

    const receipt = await txn.wait();
    // console.log(receipt);
    // const event = receipt.events.find(
    //   (event: any) => event.event === "VoucherGenerated"
    // );
    //   console.log(event.args)
    return receipt.hash;
    // return decodeVoucherArr(receipt.args.result);
  } catch (error) {
    console.log(error);
    let errorType: keyof typeof errors = "UNKNOWN_ERROR";
    if (ethers.isCallException(error)) {
      errorType = decodeContractError(error.reason);
    }
    return new ContractError(errorType);
  }
}

// deploy contract
async function deployContract(
  wallet: Wallet,
  pricePerVoucher: number,
  fees: number,
  nonce: number,
  usdcAddress: string = env.USDC_ADDRESS
): Promise<{ contractAddress: string; hash: string | null } | Error> {
  try {
    const ContractFactory = new ethers.ContractFactory(
      ContractArtifact.abi,
      ContractArtifact.bytecode,
      wallet
    );

    // constructor arguments
    // usdc address, price per voucher, fees(0-100%)
    // ether is equal to $1 denomination in this case
    const contract = await ContractFactory.deploy(
      usdcAddress,
      Conversion.convertToUAvax(pricePerVoucher),
      fees * 100,
      { nonce }
    );
    const receipt = await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`Contract deployed at address: ${contractAddress}`);
    return {
      contractAddress,
      hash: receipt.deploymentTransaction()?.hash || null,
    };
  } catch (error) {
    console.log(error);
    return new Error("unknown error");
  }
}

export default {
  getUsdcAddress,
  getUnusedVoucherAmount,
  getTotalVoucherUsed,
  getTotalVoucherIssued,
  getContractOwner,
  getVoucherPrice,
  getMealVoucherDetail,
  getCurrentManagementFees,
  getUserVouchers,
  getUsdcBalance,
  updateUsdcAddress,
  updateManagementFees,
  redeemVoucher,
  updateVoucherPrice,
  generateVoucher,
  decodeVoucherArr,
  deployContract,
};
