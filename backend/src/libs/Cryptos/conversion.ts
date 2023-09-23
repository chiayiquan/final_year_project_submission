import { ethers } from "ethers";

function convertToUAvax(value: number): number {
  return value * 1000000;
}

function convertFromUAvax(value: ethers.BigNumberish): number {
  const intValue = ethers.toNumber(value);
  return intValue / 1000000;
}

export default { convertToUAvax, convertFromUAvax };
