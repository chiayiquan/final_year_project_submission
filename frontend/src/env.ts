import * as JD from "decoders";

export type Env = Readonly<{
  VITE_BACKEND_URL: string;
  VITE_AVAX_TX_EXPLORER: string;
  VITE_AVAX_ADDRESS_EXPLORER: string;
  VITE_USDC_ADDRESS: string;
}>;

const env: Env = JD.object({
  VITE_BACKEND_URL: JD.string,
  VITE_AVAX_TX_EXPLORER: JD.string,
  VITE_AVAX_ADDRESS_EXPLORER: JD.string,
  VITE_USDC_ADDRESS: JD.string,
}).verify(import.meta.env);

export default env;
