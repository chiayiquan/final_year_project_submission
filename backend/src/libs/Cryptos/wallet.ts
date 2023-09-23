import env from "../../env";
import ContractArtifact from "./contractArtifact";
import {
  HDNodeWallet,
  ethers,
  Contract,
  Wallet,
  JsonRpcProvider,
} from "ethers";
import Encryption from "../Encryption";
import File from "../File";

function initProvider(): JsonRpcProvider {
  return new ethers.JsonRpcProvider(env.CHAIN_ENDPOINT);
}
function initWallet(privateKey: string = env.PK): Wallet {
  const provider = initProvider();
  return new ethers.Wallet(privateKey, provider);
}

function initContract(wallet: Wallet, address: string): Contract {
  return new ethers.Contract(address, ContractArtifact.abi, wallet);
}

function initContractWSS(address: string): {
  contract: Contract;
  provider: ethers.WebSocketProvider;
} {
  const provider = new ethers.WebSocketProvider(env.CHAIN_WSS);
  return {
    contract: new ethers.Contract(address, ContractArtifact.abi, provider),
    provider,
  };
}

function generateNewAddress(): HDNodeWallet {
  return ethers.Wallet.createRandom();
}

function createNewWallet(walletPassword: string): string | null {
  const wallet = generateNewAddress();
  const encryptedValue = Encryption.FileEncryption.encrypt(
    wallet.privateKey,
    walletPassword
  );
  const result = File.ReadWrite.storeEncryptedContentToFile(
    wallet.address,
    encryptedValue,
    "WALLET"
  );
  return result ? wallet.address : null;
}

export default {
  initWallet,
  generateNewAddress,
  initContract,
  initContractWSS,
  createNewWallet,
  initProvider,
};
