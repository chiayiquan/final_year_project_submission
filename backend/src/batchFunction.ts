import { parentPort } from "worker_threads";
import Cryptos from "./libs/Cryptos";
import { ethers, Wallet } from "ethers";
import env from "./env";
import * as Transaction from "./libs/Transaction";
import * as Contract from "./libs/Contract";
import db from "./db";

if (parentPort != null) {
  parentPort.on("message", async (message) => {
    try {
      const pendingTransaction = await Transaction.getPendingTransaction();

      const pendingContracts = await Transaction.getPendingContract();

      const pendingFeesUpdate = await Transaction.getPendingUpdateFees();

      const pendingPriceUpdate =
        await Transaction.getPendingUpdateVoucherPrice();

      // pending transaction for CONTRACT_DEPLOYMENT type means contract yet to be deployed meaning it is unique already
      const contractIds: string[] = [];

      pendingTransaction.forEach((transaction) =>
        contractIds.push(transaction.contractId)
      );
      pendingContracts.forEach((transaction) =>
        contractIds.push(transaction.referenceId)
      );

      pendingFeesUpdate.forEach((transaction) =>
        contractIds.push(transaction.referenceId)
      );

      pendingPriceUpdate.forEach((transaction) =>
        contractIds.push(transaction.referenceId)
      );

      const contracts = await Contract.getMultipleContracts([
        ...new Set(contractIds),
      ]);

      const generateVouchers: {
        [contract: string]: { [userAddress: string]: number[] };
      } = {};

      const generateVouchersTxnId: {
        [userAddress: string]: { id: string; voucherId: number }[];
      } = {};

      const redeemVouchers: {
        [contract: string]: {
          userAddress: string;
          voucherId: number;
          merchantAddress: string;
        }[];
      } = {};

      const redeemVouchersTxnId: {
        id: string;
        voucherId: number;
        userAddress: string;
      }[] = [];

      pendingTransaction.forEach((transaction) => {
        if (transaction.type == "GENERATE_VOUCHER") {
          if (generateVouchers[transaction.contractId] == null)
            generateVouchers[transaction.contractId] = {};
          if (generateVouchers[transaction.contractId][transaction.to] == null)
            generateVouchers[transaction.contractId][transaction.to] = [];
          generateVouchers[transaction.contractId][transaction.to].push(
            transaction.voucherId
          );
          if (generateVouchersTxnId[transaction.to] == null)
            generateVouchersTxnId[transaction.to] = [];
          generateVouchersTxnId[transaction.to].push({
            id: transaction.id,
            voucherId: transaction.voucherId,
          });
        } else {
          if (redeemVouchers[transaction.contractId] == null)
            redeemVouchers[transaction.contractId] = [];
          redeemVouchers[transaction.contractId].push({
            userAddress: transaction.from,
            voucherId: transaction.voucherId,
            merchantAddress: transaction.to,
          });
          redeemVouchersTxnId.push({
            id: transaction.id,
            voucherId: transaction.voucherId,
            userAddress: transaction.from,
          });
        }
      });

      const wallet = Cryptos.Wallet.initWallet();
      let nonce = await wallet.getNonce();

      await Promise.all(
        pendingContracts.map(async (transaction, index) => {
          const contract = contracts[transaction.referenceId];

          const result = await Cryptos.ContractFunction.deployContract(
            wallet,
            contract.voucherPrice,
            contract.fees,
            nonce + index
          );

          if (result instanceof Error) return;

          db.transaction(async (txn) => {
            return Promise.all([
              Contract.updateContractAddress(
                { address: result.contractAddress },
                { id: contract.id },
                txn
              ),

              Transaction.updateStatus(
                "SUCCESS",
                result.hash,
                { id: transaction.id },
                txn
              ),
            ]);
          });

          return (
            parentPort &&
            parentPort.postMessage({
              event: "CONTRACT_CREATED",
              contractAddress: result.contractAddress,
            })
          );
        })
      );

      nonce = await wallet.getNonce();

      await Promise.all(
        pendingFeesUpdate.map(async (transaction, index) => {
          const { address, fees } = contracts[transaction.referenceId];

          if (address == null) return;
          const contract = Cryptos.Wallet.initContract(wallet, address);
          const result = await Cryptos.ContractFunction.updateManagementFees(
            contract,
            fees,
            nonce + index
          );

          if (result instanceof Error) return;

          db.transaction(async (txn) => {
            return Promise.all([
              Transaction.updateStatus(
                "SUCCESS",
                result,
                { id: transaction.id },
                txn
              ),
            ]);
          });
        })
      );

      nonce = await wallet.getNonce();

      await Promise.all(
        pendingPriceUpdate.map(async (transaction, index) => {
          const { address, voucherPrice } = contracts[transaction.referenceId];

          if (address == null) return;
          const contract = Cryptos.Wallet.initContract(wallet, address);
          const result = await Cryptos.ContractFunction.updateVoucherPrice(
            contract,
            voucherPrice,
            nonce + index
          );
          if (result instanceof Error) return;

          db.transaction(async (txn) => {
            return Promise.all([
              Transaction.updateStatus(
                "SUCCESS",
                result,
                { id: transaction.id },
                txn
              ),
            ]);
          });
        })
      );

      nonce = await wallet.getNonce();
      await Promise.all(
        Object.keys(generateVouchers).map(async (contractId, index) => {
          const address = contracts[contractId].address;
          if (address == null) return;
          const contract = Cryptos.Wallet.initContract(wallet, address);

          let totalVoucher = 0;
          let idsToUpdate: string[] = [];

          const generateVoucherParam = Object.keys(
            generateVouchers[contractId]
          ).map((userAddress) => {
            totalVoucher += generateVouchers[contractId][userAddress].length;

            idsToUpdate = generateVouchersTxnId[userAddress]
              .filter(({ voucherId }) =>
                generateVouchers[contractId][userAddress].includes(voucherId)
              )
              .map((voucher) => voucher.id);

            return {
              userAddress,
              voucherIds: generateVouchers[contractId][userAddress],
            };
          });
          const generateVoucherHash =
            await Cryptos.ContractFunction.generateVoucher(
              contract,
              generateVoucherParam,
              totalVoucher,
              nonce + index
            );

          if (generateVoucherHash instanceof Error) return;

          // To change as this will update all the transaction for each contract call
          return db.transaction(async (txn) => {
            return Promise.all([
              Transaction.updateBulkStatus(
                "SUCCESS",
                generateVoucherHash,
                { column: "id", listOfData: idsToUpdate },
                txn
              ),
            ]);
          });
        })
      );

      nonce = await wallet.getNonce();
      await Promise.all(
        Object.keys(redeemVouchers).map(async (contractId, index) => {
          const address = contracts[contractId].address;
          if (address == null) return;
          const contract = Cryptos.Wallet.initContract(wallet, address);

          const idsToUpdate: string[] = redeemVouchers[contractId].reduce(
            (accumulator: string[], currentValue) => {
              const voucher = redeemVouchersTxnId.filter(
                ({ userAddress, voucherId }) =>
                  userAddress === currentValue.userAddress &&
                  voucherId === currentValue.voucherId
              );
              voucher[0] != null && accumulator.push(voucher[0].id);
              return accumulator;
            },
            []
          );
          const redeemVoucherHash =
            await Cryptos.ContractFunction.redeemVoucher(
              contract,
              redeemVouchers[contractId],
              redeemVouchers[contractId].length,
              nonce + index
            );

          if (redeemVoucherHash instanceof Error) return;
          // To change as this will update all the transaction for each contract call
          return db.transaction(async (txn) => {
            return Promise.all([
              Transaction.updateBulkStatus(
                "SUCCESS",
                redeemVoucherHash,
                { column: "id", listOfData: idsToUpdate },
                txn
              ),
            ]);
          });
        })
      );

      parentPort && parentPort.postMessage({ event: "FUNCTION_ENDED" });
    } catch (error) {
      return error;
    }

    // const wallet = Cryptos.Web3.initWallet();
    // const web3 = new Web3(env.CHAIN_ENDPOINT);
    // const account = web3.eth.accounts.wallet.add(env.PK);
    // const contractAddresses: string[] = [
    //   "0x4f66D7d5E207f52FEF3d40A681c06DAEaaCa7694",
    //   "0x9fc79CE3AE2d2327437c73BC86C6624c1ee19Bdd",
    // ];

    // const contracts = contractAddresses.map((address) => ({
    //   contract: new web3.eth.Contract(abi as AbiItem[], address),
    //   address,
    // }));

    // const batch = new web3.BatchRequest();

    // function callBack(err: any, result: any, address: string) {
    //   console.log(err, address);
    //   console.log(result, address);
    // }

    // const receipts: any[] = [];
    // contracts.forEach(({ contract, address }) =>
    //   batch.add(
    //     contract.methods
    //       .generateVoucher(
    //         [
    //           {
    //             userAddress: "0xAa821d28b4cAF2ABb187237Db0D5A05aFc6579E8",
    //             voucherIds: [Date.now(), Date.now() + 1],
    //           },
    //         ],
    //         2
    //       )
    //       .call.request({ from: account.address }, (err: any, result: any) =>
    //         callBack(err, result, address)
    //       )
    //   )
    // );

    // batch.execute();
    // console.log(receipts);
    // let contract: { [key: string]: ethers.Contract } = {};
    // contractAddresses.forEach((address: string) => {
    //   contract[address] = Cryptos.Wallet.initContract(wallet, address);
    // });
    // const txn = await wallet.sendTransaction({
    //   to: ethers.ZeroAddress,
    //   data: Object.keys(contract)
    //     .map((address) =>
    //       contract[address].interface.encodeFunctionData("generateVoucher", [
    //         [
    //           {
    //             userAddress: "0xAa821d28b4cAF2ABb187237Db0D5A05aFc6579E8",
    //             voucherIds: [1683795770, 1683795770],
    //           },
    //         ],
    //         2,
    //       ])
    //     )
    //     .join(","),
    // });
    // const receipt = await txn.wait();

    // console.log("Received message from main thread:", message);
    // const result = await asyncFunction();
    // console.log(result);
    // parentPort && parentPort.postMessage(result);
  });

  // async function asyncFunction() {
  //   return new Promise((resolve) =>
  //     setTimeout(() => resolve("some result"), 4000)
  //   );
  // }
}
