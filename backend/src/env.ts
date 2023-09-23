import * as JD from "decoders";

type NodeEnv = "development" | "test";
export type Env = Readonly<{
  NODE_ENV: string;
  PORT: number;
  CHAIN_ENDPOINT: string;
  CHAIN_WSS: string;
  FILE_SECRET: string;
  PK: string;
  WALLET_ADDRESS: string;
  USDC_ADDRESS: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PORT: number;
  DB_PASSWORD: string;
  DB_NAME: string;
  NUMBER_OF_VOUCHER_PER_WEEK: number;
  STORAGE_PATH: string;
  JWT_SECRET: string;
  API_URL: string;
  DOCUMENT_URL_SECRET: string;
  STRIPE_KEY: string;
  STRIPE_URL_SECRET: string;
  VOUCHER_SECRET: string;
  FRONT_END_URL: string;
  FEES_WALLET_PK: string;
  FEES_WALLET_ADDRESS: string;
}>;

const env: Env = JD.object({
  NODE_ENV: JD.string.transform((str) => isNodeEnv(str)),
  PORT: JD.string.transform((strPort) => isPositiveInt(strPort)),
  CHAIN_ENDPOINT: JD.string,
  CHAIN_WSS: JD.string,
  FILE_SECRET: JD.string,
  PK: JD.string,
  WALLET_ADDRESS: JD.string,
  USDC_ADDRESS: JD.string,
  DB_HOST: JD.string,
  DB_USER: JD.string,
  DB_PORT: JD.string.transform((strPort) => isPositiveInt(strPort)),
  DB_PASSWORD: JD.string,
  DB_NAME: JD.string,
  NUMBER_OF_VOUCHER_PER_WEEK: JD.string.transform((strNum) =>
    isPositiveInt(strNum)
  ),
  STORAGE_PATH: JD.string,
  JWT_SECRET: JD.string,
  API_URL: JD.string,
  DOCUMENT_URL_SECRET: JD.string,
  STRIPE_KEY: JD.string,
  STRIPE_URL_SECRET: JD.string,
  VOUCHER_SECRET: JD.string,
  FRONT_END_URL: JD.string,
  FEES_WALLET_PK: JD.string,
  FEES_WALLET_ADDRESS: JD.string,
}).verify(process.env);

function isPositiveInt(value: string): number {
  const num = parseInt(value);
  if (isNaN(num) || num < 0) throw new Error("Must be a positive integer.");
  return num;
}

function isNodeEnv(env: string): NodeEnv {
  switch (env) {
    case "development":
      return "development";
    case "test":
      return "test";
    default:
      throw new Error("Invalid environment");
  }
}

export default env;
