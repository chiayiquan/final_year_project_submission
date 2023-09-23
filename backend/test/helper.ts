import db, { generateID } from "../src/db";
import env from "../src/env";
import knexConfig from "../db/knexfile";
import User, { Role } from "../src/libs/User";
import Session from "../src/libs/Session";
import JWT from "../src/libs/JWT";
import Application, {
  ApplicationType,
  FileType,
} from "../src/libs/Application";
import bcrypt from "bcrypt";
import { Status } from "../src/libs/Application/model";
import Organization from "../src/libs/Organization";
import Encryption from "../src/libs/Encryption";
import File from "../src/libs/File";
import fs from "fs";
import path from "path";
import * as Contract from "../src/libs/Contract";
import Cryptos from "../src/libs/Cryptos";
import { ethers, Wallet } from "ethers";
import {
  abi as mockUSDCAbi,
  bytecode as mockUSDCByteCode,
} from "../artifacts/contracts/MockUSDC.sol/MockUSDC.json";
import * as Voucher from "../src/libs/Voucher";
import * as Transaction from "../src/libs/Transaction";
import Merchant from "../src/libs/Merchant";
import Address from "../src/libs/Address";

export { db, env, generateID };

afterAll(async () => {
  await db.destroy();
});

export async function cleanDb(tableNameToIgnore: string[] = []): Promise<void> {
  const migrationTableNames = [
    ...tableNameToIgnore,
    knexConfig.migrations.tableName,
    knexConfig.migrations.tableName + "_lock",
    "countries",
    "stripeProducts",
    "stripeProductPrices",
  ]
    .map((s) => `'${s}'`)
    .join(",");

  await db
    .raw(
      `SELECT relname AS tablename FROM pg_class
        WHERE relkind = 'r'
        AND relnamespace = 'public'::regnamespace
        AND relname NOT IN (${migrationTableNames})`
    )
    .then((response) => {
      return response.rows.map((row: { tablename: string }) => row.tablename);
    })
    .then((tablenames: string[]) => {
      return db.raw(
        `TRUNCATE TABLE ${tablenames.map((s) => `"${s}"`).join(",")} CASCADE`
      );
    });
}
export const defaultUser = {
  name: "test",
  email: "test@example.com",
  password: "123456789",
  walletPassword: "123456",
  stripeUserId: "test_user",
};
export async function createUser(
  user: {
    name: string;
    email: string;
    password: string;
    walletPassword: string;
    stripeUserId: string;
  } = defaultUser
): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    password: string;
    walletPassword: string;
  };
  jwt: string;
}> {
  const { walletPassword, ...userData } = user;
  const id = await User.lib.createUser(userData, walletPassword);
  if (id == null) return { user: { ...user, id: "" }, jwt: "" };
  await User.lib.updateStripeId(id, user.stripeUserId);
  const jwt = await createJWT(id);
  return { user: { ...user, id }, jwt };
}

export async function createJWT(userId: string) {
  const session = await Session.lib.createSession(userId);
  return JWT.lib.issue(session.id, session.userId);
}

export const defaultApplication = {
  data: {
    appliedCountry: "SG",
  },
  applicationFiles: [
    { name: `${generateID()}.pdf`, fileType: "IDENTIFICATION" as FileType },
    { name: `${generateID()}.pdf`, fileType: "INCOME" as FileType },
  ],
  address: "test address",
};

export async function createApplication(
  userId: string,
  type: ApplicationType = "BENEFICIARY",
  application: {
    data: { appliedCountry: string };
    applicationFiles: { name: string; fileType: FileType }[];
    address: string;
  } = defaultApplication
) {
  return Application.lib.insertApplication(
    { ...application.data, type, userId, applicantName: defaultUser.name },
    application.applicationFiles
  );
}

export const organization: {
  organizationData: { name: string; addresses: string[] };
  members: string[];
} = {
  organizationData: {
    name: "ABC pte ltd",
    addresses: ["LALALAND st 20, #05-23"],
  },
  members: [],
};

export const merchant: {
  merchantData: {
    name: string;
    addresses: string[];
  };
} = {
  merchantData: {
    name: "abc merchant",
    addresses: ["LALALAND st 20, #05-24"],
  },
};

export const defaultPersonalInformation = {
  name: defaultUser.name,
  address: "LALA LAND",
};

export async function createUserWithApplication(
  type: ApplicationType = "BENEFICIARY",
  userData: {
    name: string;
    email: string;
    password: string;
    walletPassword: string;
    stripeUserId: string;
  } = defaultUser,
  application: {
    data: { appliedCountry: string };
    applicationFiles: { name: string; fileType: FileType }[];
    address: string;
  } = defaultApplication
) {
  const { user, jwt } = await createUser(userData);
  const applicationId = await createApplication(user.id, type, application);
  if (applicationId != null)
    await Address.lib.insertAddress(
      [application.address],
      applicationId,
      "PERSONAL"
    );
  return { user, jwt, applicationId };
}

export async function addMemberToOrganization(
  organizationId: string,
  userId: string[]
) {
  await Organization.lib.addNewMember(userId, organizationId);
}

export async function createContract(
  countryCode: string = "SG",
  voucherPrice: number = 1,
  fees: number = 1,
  pk: string = env.PK
) {
  const id = await Contract.createContract({
    countryCode,
    voucherPrice,
    fees,
  });

  const wallet = Cryptos.Wallet.initWallet(pk);
  const mockUSDCAddress = await deployMockUSDC(wallet);
  console.log(mockUSDCAddress);
  if (mockUSDCAddress instanceof Error) {
    console.log(mockUSDCAddress);
    return null;
  }
  const nonce = await wallet.getNonce();
  const contract = await Cryptos.ContractFunction.deployContract(
    wallet,
    voucherPrice,
    fees,
    nonce,
    mockUSDCAddress
  );
  if (contract instanceof Error) {
    console.log(contract);
    return null;
  }
  await Contract.updateContractAddress(
    { address: contract.contractAddress },
    { id: id[0].id }
  );
  return {
    contractId: id[0].id,
    mockUSDCAddress,
    contractAddress: contract.contractAddress,
  };
}

export async function mintMockUSDC(
  mockUSDCAddress: string,
  mealVoucherAddress: string,
  pk: string,
  amount: number = 30
) {
  try {
    const wallet = Cryptos.Wallet.initWallet(pk);

    const mockUSDCContract = new ethers.Contract(
      mockUSDCAddress,
      mockUSDCAbi,
      wallet
    );
    return mockUSDCContract.mintTokens(amount, mealVoucherAddress);
  } catch (error) {
    console.log(error);
  }
}

export async function updateApplicationStatus(
  id: string,
  status: Status,
  role: Role,
  userId: string
) {
  await User.lib.updateRole(userId, role);
  return Application.lib.updateApplicationStatus(id, status);
}

export async function createOrganization(
  organizationData: {
    name: string;
    addresses: string[];
    applicationId: string;
  },
  members: string[]
) {
  const { addresses, ...rest } = organizationData;
  return Organization.lib.insertOrganization(rest, addresses, members);
}

export async function createMerchant(merchantData: {
  name: string;
  addresses: string[];
  applicationId: string;
}) {
  const { addresses, ...rest } = merchantData;
  return Merchant.lib.insertMerchant(rest, addresses);
}

export async function createAdmin() {
  const admin = {
    id: "0x963EFAb61B9550bcE1017Dc08DACA02B434b5796",
    name: "admin",
    email: "sharethemealadmin@example.com",
    password: await bcrypt.hash("123456789", 11),
    role: "ADMIN",
    createdAt: Date.now(),
  };
  await db.insert(admin).into("users");
  const jwt = await createJWT(admin.id);
  return { admin, jwt };
}

export async function updateUserRole(id: string, role: Role = "USER") {
  return db.update({ role }).from("users").where({ id });
}

export function createFile(
  fileName: string,
  fileType: FileType
): Buffer | null {
  const filePath = getFilePath(fileType);
  if (filePath == null) return null;
  const fileContent = fs.readFileSync(filePath);
  const encryptedContent = Encryption.FileEncryption.encrypt(fileContent);
  File.ReadWrite.storeEncryptedContentToFile(
    fileName,
    encryptedContent,
    fileType
  );
  return fileContent;
}

function getFilePath(fileType: FileType): string | null {
  const fileToRead = path.join(__dirname, "/sampleFile/");
  switch (fileType) {
    case "INCOME":
      return `${fileToRead}incomeStatement.pdf`;
    case "CERTIFICATE":
      return `${fileToRead}businessCertificate.pdf`;
    case "IDENTIFICATION":
      return `${fileToRead}identification.pdf`;
    case "LICENSE":
      return `${fileToRead}license.pdf`;
    default:
      return null;
  }
}

async function deployMockUSDC(wallet: Wallet): Promise<string | Error> {
  try {
    const MockUSDC = new ethers.ContractFactory(
      mockUSDCAbi,
      mockUSDCByteCode,
      wallet
    );
    const mockUSDCDeploy = await MockUSDC.deploy();
    return mockUSDCDeploy.getAddress();
  } catch (error) {
    console.log(error);
    return new Error("Deployment failed");
  }
}

export async function createVouchers(
  contractId: string,
  pk: string = env.PK,
  userData: {
    id: string;
    name: string;
    email: string;
    password: string;
    walletPassword: string;
  } | null = null,
  numberOfVoucher: number = 2
) {
  let user = userData;
  if (user == null) {
    const userApplicationObj = await createUserWithApplication();
    user = userApplicationObj.user;
    if (userApplicationObj.applicationId == null) return null;
    await updateApplicationStatus(
      userApplicationObj.applicationId,
      "APPROVED",
      "BENEFICIARY",
      user.id
    );
  }

  const contractDetail = await Contract.getContract(contractId);

  if (contractDetail == null || contractDetail.address == null) return null;
  const vouchers = await generateAndStoreVoucher(
    user,
    contractDetail,
    numberOfVoucher
  );

  const wallet = Cryptos.Wallet.initWallet(pk);
  const nonce = await wallet.getNonce();
  const contract = Cryptos.Wallet.initContract(wallet, contractDetail.address);
  await Cryptos.ContractFunction.generateVoucher(
    contract,
    [vouchers.contract],
    vouchers.contract.voucherIds.length,
    nonce,
    3000000
  );

  const encryptedVoucherId = await Promise.all(
    vouchers.voucherIds.map((id) => Voucher.issue(id))
  );
  return { encryptedVoucherId, voucherIds: vouchers.voucherIds };
}

async function generateAndStoreVoucher(
  user: {
    id: string;
    name: string;
    email: string;
    password: string;
    walletPassword: string;
  },
  contractDetail: Contract.ContractSchema,
  numberOfVoucher: number
) {
  const voucherIds = [...new Array(numberOfVoucher).keys()].map(
    (num) => Date.now() + num
  );

  const vouchers = await Voucher.insertVoucher(
    voucherIds.map((voucherId) => ({
      owner: user.id,
      value: contractDetail.voucherPrice,
      voucherId,
      contractId: contractDetail.id,
    }))
  );

  await Transaction.insertTransaction(
    vouchers.map(({ id }) => ({
      type: "GENERATE_VOUCHER",
      from: env.WALLET_ADDRESS,
      to: user.id,
      referenceId: id,
    }))
  );

  return {
    contract: { userAddress: user.id, voucherIds },
    voucherIds: vouchers.map(({ id }) => id),
  };
}

export function fail() {
  return expect(true).toBe(false);
}
