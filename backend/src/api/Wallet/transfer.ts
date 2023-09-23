import express from "express";
import StandardResponse from "../../libs/StandardResponse";
import Cryptos from "../../libs/Cryptos";
import env from "../../env";
import JWT, { JWTError } from "../../libs/JWT";
import User from "../../libs/User";
import { ethers, BigNumberish } from "ethers";
import USDCArtifact from "../../../artifacts/contracts/USDC/USDC.json";
import Encryption from "../../libs/Encryption";
import File from "../../libs/File";
import * as JD from "decoders";
import Conversion from "../../libs/Cryptos/conversion";
import TransferLib from "../../libs/Transfer";

const errors = {
  ...JWT.lib.errors,
  INVALID_USER: "User does not exist.",
  WALLET_NOT_FOUND: "This wallet does not exist.",
  INCORRECT_WALLET_PASSWORD: "The provided wallet password is incorrect.",
  INSUFFICIENT_BALANCE: "You do not have sufficient balance in your wallet.",
  INSUFFICIENT_GAS_BALANCE:
    "Gas wallet is insufficient, please contact the owner.",
  TRANSFER_ERROR:
    "An error occurred when transferring USDC, please try again or import your private key to a crypto wallet to do transfer.",
  GAS_PRICE_ERROR: "Unable to estimate gas fees currently, please try again.",
};

type Params = {
  amount: number;
  walletPassword: string;
  recipientAddress: string;
};

type ResponseData = {
  message: string;
  hash: string;
};

export default async function Transfer(
  request: express.Request,
  response: express.Response
) {
  const jwtPayload = await JWT.lib.getJWTToken(request);

  if (jwtPayload instanceof JWTError)
    return StandardResponse.fail(response, errors, jwtPayload.name);

  const user = await User.lib.getUserById(jwtPayload.userId);
  if (user == null)
    return StandardResponse.fail(response, errors, "INVALID_USER");

  const { walletPassword, amount, recipientAddress } = decodeParams(
    request.body
  );

  const encryptedFileContent = File.ReadWrite.readFile(user.id, "WALLET");

  if (encryptedFileContent == null)
    return StandardResponse.fail(response, errors, "WALLET_NOT_FOUND");

  const decryptedPK = await Encryption.FileEncryption.decrypt(
    encryptedFileContent,
    walletPassword
  );

  if (decryptedPK instanceof Error)
    return StandardResponse.fail(response, errors, "INCORRECT_WALLET_PASSWORD");

  const userWallet = Cryptos.Wallet.initWallet(decryptedPK.toString());

  const usdcContract = new ethers.Contract(
    env.USDC_ADDRESS,
    USDCArtifact,
    userWallet
  );

  const userBalance = await usdcContract.balanceOf(user.id);
  if (
    ethers.toNumber(userBalance) < amount ||
    ethers.toNumber(userBalance) === 0
  )
    return StandardResponse.fail(response, errors, "INSUFFICIENT_BALANCE");

  try {
    const estimatedGas = await usdcContract.transfer.estimateGas(
      recipientAddress,
      amount
    );

    const provider = Cryptos.Wallet.initProvider();
    const currentWalletBalance = await provider.getBalance(user.id);
    const gasData = await provider.getFeeData();

    if (gasData.maxPriorityFeePerGas == null || gasData.gasPrice == null)
      return StandardResponse.fail(response, errors, "GAS_PRICE_ERROR");

    const finalGasAmount =
      estimatedGas *
      (gasData.gasPrice + gasData.maxPriorityFeePerGas) *
      ethers.toBigInt(3);

    if (currentWalletBalance < finalGasAmount) {
      const haveTransferred = await sendFees(
        finalGasAmount - currentWalletBalance,
        user.id
      );
      if (haveTransferred === false)
        return StandardResponse.fail(
          response,
          errors,
          "INSUFFICIENT_GAS_BALANCE"
        );
    }

    const txn = await usdcContract.transfer(recipientAddress, amount);
    txn.wait();

    await TransferLib.lib.insertTransfer([
      {
        transferType: "TRANSFER",
        from: user.id,
        to: recipientAddress,
        value: amount,
      },
    ]);
    return StandardResponse.success<ResponseData>(response, {
      message: `Transfer of ${Conversion.convertFromUAvax(
        amount
      )} to ${recipientAddress} are successful.`,
      hash: txn.hash,
    });
  } catch (error) {
    console.log(error);
    return StandardResponse.fail(response, errors, "TRANSFER_ERROR");
  }
}

async function sendFees(
  gas: BigNumberish,
  userAddress: string
): Promise<boolean> {
  try {
    const feesWallet = Cryptos.Wallet.initWallet(env.FEES_WALLET_PK);
    const tx = await feesWallet.sendTransaction({
      to: userAddress,
      value: gas,
    });
    tx.wait();
    return tx.hash ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function decodeParams(data: any): Params {
  return JD.object({
    amount: JD.number.transform((amt) => Conversion.convertToUAvax(amt)),
    walletPassword: JD.string,
    recipientAddress: JD.string,
  }).verify(data);
}
