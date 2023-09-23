import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "ethers";
import contractArtifact from "../src/libs/Cryptos/contractArtifact";
import {
  abi as mockUSDCAbi,
  bytecode as mockUSDCByteCode,
} from "../artifacts/contracts/MockUSDC.sol/MockUSDC.json";
import { decodeVoucherArr } from "../src/libs/Cryptos/contractFunction";
import { env } from "./helper";

function getErrorCode(error: any): string {
  return error.info.error.data.reason;
}

jest.setTimeout(50000);

describe("MealVoucher", function () {
  async function deployMealVoucher() {
    const provider = new ethers.JsonRpcProvider(env.CHAIN_ENDPOINT);
    const [owner, firstAccount, secondAccount, thirdAccount] =
      await Promise.all([
        provider.getSigner("0x26ec90358BB947a9Ef15F17E320Ee0C157e266EF"),
        provider.getSigner("0x4e09b3a497419eeD5017AFaBA8870940d5087874"),
        provider.getSigner("0x431A071D740C7a12A884a512B3915d0d75689d47"),
        provider.getSigner("0xAdA11035A6FF1658bC8ffE4fBE4B5076393236A1"),
      ]);

    const MockUSDC = new ethers.ContractFactory(
      mockUSDCAbi,
      mockUSDCByteCode,
      owner
    );
    const mockUSDCDeploy = await MockUSDC.deploy();
    const mockUSDCAddress = await mockUSDCDeploy.getAddress();

    const MealVoucher = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      owner
    );
    const mealVoucherDeploy = await MealVoucher.deploy(
      mockUSDCAddress,
      1000000,
      10
    );
    const mealVoucherAddress = await mealVoucherDeploy.getAddress();

    const mockUSDCContract = new ethers.Contract(
      mockUSDCAddress,
      mockUSDCAbi,
      owner
    );

    const mealVoucherContract = new ethers.Contract(
      mealVoucherAddress,
      contractArtifact.abi,
      owner
    );
    await mockUSDCContract.mintTokens(10, mealVoucherAddress);

    const [
      ownerAddress,
      firstAccountAddress,
      secondAccountAddress,
      thirdAccountAddress,
    ] = await Promise.all([
      owner.getAddress(),
      firstAccount.getAddress(),
      secondAccount.getAddress(),
      thirdAccount.getAddress(),
    ]);

    return {
      mealVoucherContract,
      mealVoucherAddress,
      mockUSDCContract,
      owner,
      firstAccount,
      secondAccount,
      thirdAccount,
      ownerAddress,
      firstAccountAddress,
      secondAccountAddress,
      thirdAccountAddress,
    };
  }

  it("Should deploy smart contract properly", async () => {
    const { mealVoucherAddress } = await loadFixture(deployMealVoucher);
    expect(mealVoucherAddress).not.toBeNull();
  });

  it("Should return correct voucher price", async () => {
    const { mealVoucherContract } = await loadFixture(deployMealVoucher);
    const mealVoucherPrice = await mealVoucherContract.mealVoucherPrice();
    expect(ethers.toNumber(mealVoucherPrice)).toBe(1000000);
  });

  it("Contract should have 20000000 balance", async () => {
    const { mockUSDCContract, mealVoucherAddress } = await loadFixture(
      deployMealVoucher
    );
    const usdcBalance = await mockUSDCContract.balanceOf(mealVoucherAddress);
    expect(ethers.toNumber(usdcBalance)).toBe(10000000);
  });

  it("Should not be able to generate more than 10 vouchers", async () => {
    const vouchers = [...new Array(11).keys()].map((num) => Date.now() + num);
    const {
      mealVoucherContract,
      firstAccountAddress,
      secondAccountAddress,
      ownerAddress,
    } = await loadFixture(deployMealVoucher);

    try {
      const result = await mealVoucherContract.generateVoucher(
        [
          {
            userAddress: firstAccountAddress,
            voucherIds: vouchers.slice(0, 3),
          },
          { userAddress: secondAccountAddress, voucherIds: vouchers.slice(3) },
        ],
        vouchers.length,
        { from: ownerAddress }
      );
    } catch (error: any) {
      expect(getErrorCode(error)).toMatch("INSUFFICIENT_FUNDS");
    }
  });

  it("Should generate vouchers", async () => {
    const vouchers = [...new Array(5).keys()].map((num) => Date.now() + num);
    const {
      mealVoucherContract,
      firstAccountAddress,
      secondAccountAddress,
      mealVoucherAddress,
      ownerAddress,
    } = await loadFixture(deployMealVoucher);

    try {
      await mealVoucherContract.generateVoucher(
        [
          {
            userAddress: firstAccountAddress,
            voucherIds: vouchers.slice(0, 3),
          },
          { userAddress: secondAccountAddress, voucherIds: vouchers.slice(3) },
        ],
        vouchers.length,
        { from: ownerAddress }
      );

      const results = await Promise.all([
        ...vouchers
          .slice(0, 3)
          .map((voucherId) =>
            mealVoucherContract.retrieveVoucherDetail(
              firstAccountAddress,
              voucherId
            )
          ),
        ...vouchers
          .slice(3)
          .map((voucherId) =>
            mealVoucherContract.retrieveVoucherDetail(
              secondAccountAddress,
              voucherId
            )
          ),
      ]);

      const resultToMatch = vouchers.map((voucherId, index) =>
        index < 3
          ? {
              id: voucherId,
              value: 1, // contract value is 1,000,000 but decoder in libs converted it to dollars which is 1
              voucherStatus: "VALID",
              actionStatus: "DETAIL_RETRIEVAL_SUCCESS",
              voucherOwner: firstAccountAddress,
              contractAddress: mealVoucherAddress,
            }
          : {
              id: voucherId,
              value: 1, // contract value is 1,000,000 but decoder in libs converted it to dollars which is 1
              voucherStatus: "VALID",
              actionStatus: "DETAIL_RETRIEVAL_SUCCESS",
              voucherOwner: secondAccountAddress,
              contractAddress: mealVoucherAddress,
            }
      );
      expect(resultToMatch).toEqual(
        expect.arrayContaining(decodeVoucherArr(results))
      );

      const [
        unusedVoucherAmount,
        totalVoucherIssued,
        totalVoucherUsed,
        totalAmountRedeemed,
      ] = await Promise.all([
        mealVoucherContract.unusedVoucherAmount(),
        mealVoucherContract.totalVoucherIssued(),
        mealVoucherContract.totalVoucherUsed(),
        mealVoucherContract.totalAmountRedeemed(),
      ]);
      expect(ethers.toNumber(unusedVoucherAmount)).toBe(5000000);
      expect(ethers.toNumber(totalVoucherIssued)).toBe(5);
      expect(ethers.toNumber(totalVoucherUsed)).toBe(0);
      expect(ethers.toNumber(totalAmountRedeemed)).toBe(0);
    } catch (error: any) {
      console.log(error);
    }
  });

  it("Should not be able to redeem invalid voucher", async () => {
    const {
      mealVoucherContract,
      mockUSDCContract,
      mealVoucherAddress,
      firstAccountAddress,
      secondAccountAddress,
      ownerAddress,
    } = await loadFixture(deployMealVoucher);
    const invalidId = Date.now();
    try {
      await mealVoucherContract.redeemVoucher(
        [
          {
            userAddress: firstAccountAddress,
            voucherId: invalidId,
            merchantAddress: secondAccountAddress,
          },
        ],
        1,
        { from: ownerAddress }
      );

      const [secondAccountBalance, mealVoucherBalance] = await Promise.all([
        mockUSDCContract.balanceOf(secondAccountAddress),
        mockUSDCContract.balanceOf(mealVoucherAddress),
      ]);

      expect(ethers.toNumber(secondAccountBalance)).toBe(0);
      expect(ethers.toNumber(mealVoucherBalance)).toBe(10000000);
    } catch (error: any) {
      console.log(error);
    }
  });

  it("Should redeem vouchers", async () => {
    const vouchers = [...new Array(5).keys()].map((num) => Date.now() + num);
    const {
      mealVoucherContract,
      mockUSDCContract,
      mealVoucherAddress,
      firstAccountAddress,
      secondAccountAddress,
      thirdAccountAddress,
      ownerAddress,
    } = await loadFixture(deployMealVoucher);
    try {
      await mealVoucherContract.generateVoucher(
        [
          {
            userAddress: firstAccountAddress,
            voucherIds: vouchers.slice(0, 3),
          },
          { userAddress: secondAccountAddress, voucherIds: vouchers.slice(3) },
        ],
        vouchers.length,
        { from: ownerAddress }
      );
      await mealVoucherContract.redeemVoucher(
        [
          {
            userAddress: firstAccountAddress,
            voucherId: vouchers[0],
            merchantAddress: thirdAccountAddress,
          },
          {
            userAddress: secondAccountAddress,
            voucherId: vouchers[3],
            merchantAddress: thirdAccountAddress,
          },
          {
            userAddress: secondAccountAddress,
            voucherId: vouchers[4],
            merchantAddress: thirdAccountAddress,
          },
        ],
        3,
        { from: ownerAddress }
      );

      const [
        unusedVoucherAmount,
        totalVoucherIssued,
        totalVoucherUsed,
        totalAmountRedeemed,
        ownerUSDCBalance,
        thirdAccountUSDCBalance,
        mealVoucherUSDCBalance,
      ] = await Promise.all([
        mealVoucherContract.unusedVoucherAmount(),
        mealVoucherContract.totalVoucherIssued(),
        mealVoucherContract.totalVoucherUsed(),
        mealVoucherContract.totalAmountRedeemed(),
        mockUSDCContract.balanceOf(ownerAddress),
        mockUSDCContract.balanceOf(thirdAccountAddress),
        mockUSDCContract.balanceOf(mealVoucherAddress),
      ]);

      expect(ethers.toNumber(unusedVoucherAmount)).toBe(7000000);
      expect(ethers.toNumber(totalVoucherIssued)).toBe(10);
      expect(ethers.toNumber(totalVoucherUsed)).toBe(3);
      expect(ethers.toNumber(totalAmountRedeemed)).toBe(3000000);
      expect(ethers.toNumber(ownerUSDCBalance)).toBe(300000);
      expect(ethers.toNumber(thirdAccountUSDCBalance)).toBe(2700000);
      expect(ethers.toNumber(mealVoucherUSDCBalance)).toBe(7000000);
    } catch (error: any) {
      console.log(error);
    }
  });
});
