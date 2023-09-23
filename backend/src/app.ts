import express from "express";
import { addRoutesToExpressInstance } from "./routes";
import cors from "cors";
import { Worker } from "worker_threads";
import Cryptos from "./libs/Cryptos";
import ethers from "ethers";
import * as Contract from "./libs/Contract";
import * as Voucher from "./libs/Voucher";
import env from "./env";
import Transfer from "./libs/Transfer";

const app = express();
const corsOpts = {
  origin: "*",

  methods: ["GET", "POST"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOpts));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(express.text({ type: "text/plain" }));

addRoutesToExpressInstance(app);

const websocketProvider: ethers.ethers.WebSocketProvider[] = [];

// TODO create contract listener here
(async () => {
  try {
    // TODO Retrieve all the contract from the database
    const contracts = await Contract.getAllContract();
    contracts.forEach(async (contractDetail) => {
      if (contractDetail.address == null) return;
      const { contract, provider } = Cryptos.Wallet.initContractWSS(
        contractDetail.address
      );
      websocketProvider.push(provider);
      addContractListener(contract);
    });
  } catch (error) {
    console.log(error);
  }

  // Loop through all the contract list and instantiate websocket for those contract
})();

if (env.NODE_ENV !== "test") {
  const worker = new Worker("./src/batchFunction.ts");
  worker.on("message", (message) => {
    if (message.event === "CONTRACT_CREATED") {
      const { contract, provider } = Cryptos.Wallet.initContractWSS(
        message.contractAddress
      );
      websocketProvider.push(provider);
      addContractListener(contract);
    } else {
      worker.postMessage("run");
    }
  });

  worker.postMessage("run");
}

async function addContractListener(contract: ethers.Contract) {
  try {
    contract.on("VoucherGenerated", (voucher) => {
      const vouchers = Cryptos.ContractFunction.decodeVoucherArr(voucher);
      console.log(vouchers);
    });

    contract.on("VoucherUsed", async (voucher) => {
      const vouchers = Cryptos.ContractFunction.decodeVoucherArr(voucher);
      await Promise.all([
        vouchers.forEach((voucher) => {
          Voucher.updateVoucherStatus(voucher.voucherStatus, {
            owner: voucher.voucherOwner,
            voucherId: voucher.id,
          });
        }),
      ]);
      console.log(vouchers);
    });

    contract.on("Transfer", async (transfer) => {
      const transfers = Transfer.decodeSmartContractTransaction(transfer);
      await Transfer.lib.insertTransfer(transfers);
    });
  } catch (error) {
    console.log(error);
  }
}

process.on("exit", () => {
  try {
    Promise.all(
      websocketProvider.map((provider) => {
        provider.websocket.close();
        return provider.removeAllListeners();
      })
    );
    console.log("All websocket removed");
  } catch (error) {}
});

export default app;
