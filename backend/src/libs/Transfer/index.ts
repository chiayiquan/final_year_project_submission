import lib from "./lib";
import model, { Schema, TransferType } from "./model";

export { Schema as TransferSchema, TransferType };

export default {
  lib,
  decodeSmartContractTransaction: model.decodeSmartContractTransaction,
};
