/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export declare namespace MealVoucher {
  export type VoucherStruct = {
    value: BigNumberish;
    voucherStatus: string;
    id: BigNumberish;
    actionStatus: string;
    userAddress: AddressLike;
    contractAddress: AddressLike;
  };

  export type VoucherStructOutput = [
    value: bigint,
    voucherStatus: string,
    id: bigint,
    actionStatus: string,
    userAddress: string,
    contractAddress: string
  ] & {
    value: bigint;
    voucherStatus: string;
    id: bigint;
    actionStatus: string;
    userAddress: string;
    contractAddress: string;
  };

  export type TransactionStruct = {
    from: AddressLike;
    to: AddressLike;
    value: BigNumberish;
    transferType: string;
  };

  export type TransactionStructOutput = [
    from: string,
    to: string,
    value: bigint,
    transferType: string
  ] & { from: string; to: string; value: bigint; transferType: string };

  export type VoucherIdsStruct = {
    userAddress: AddressLike;
    voucherIds: BigNumberish[];
  };

  export type VoucherIdsStructOutput = [
    userAddress: string,
    voucherIds: bigint[]
  ] & { userAddress: string; voucherIds: bigint[] };

  export type VoucherPayableStruct = {
    userAddress: AddressLike;
    voucherId: BigNumberish;
    merchantAddress: AddressLike;
  };

  export type VoucherPayableStructOutput = [
    userAddress: string,
    voucherId: bigint,
    merchantAddress: string
  ] & { userAddress: string; voucherId: bigint; merchantAddress: string };
}

export interface MealVoucherInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "depositAvax"
      | "depositUSDC"
      | "generateVoucher"
      | "getLifeTimeDonation"
      | "getUsdcBalance"
      | "getUserVouchers"
      | "managementFees"
      | "mealVoucher"
      | "mealVoucherPrice"
      | "owner"
      | "redeemVoucher"
      | "retrieveVoucherDetail"
      | "revokeVoucher"
      | "setVoucherPrice"
      | "totalAmountRedeemed"
      | "totalVoucherIssued"
      | "totalVoucherUsed"
      | "unusedVoucherAmount"
      | "updateManagementFees"
      | "updateUsdcAddress"
      | "usdcToken"
      | "withdraw"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "Received"
      | "RevokeVoucher"
      | "Transfer"
      | "VoucherGenerated"
      | "VoucherUsed"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "depositAvax",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "depositUSDC",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "generateVoucher",
    values: [MealVoucher.VoucherIdsStruct[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getLifeTimeDonation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getUsdcBalance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getUserVouchers",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "managementFees",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "mealVoucher",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "mealVoucherPrice",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "redeemVoucher",
    values: [MealVoucher.VoucherPayableStruct[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "retrieveVoucherDetail",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeVoucher",
    values: [MealVoucher.VoucherIdsStruct[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setVoucherPrice",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "totalAmountRedeemed",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalVoucherIssued",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalVoucherUsed",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "unusedVoucherAmount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "updateManagementFees",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateUsdcAddress",
    values: [AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "usdcToken", values?: undefined): string;
  encodeFunctionData(functionFragment: "withdraw", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "depositAvax",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositUSDC",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "generateVoucher",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLifeTimeDonation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUsdcBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUserVouchers",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "managementFees",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "mealVoucher",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "mealVoucherPrice",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "redeemVoucher",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "retrieveVoucherDetail",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revokeVoucher",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setVoucherPrice",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalAmountRedeemed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalVoucherIssued",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalVoucherUsed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "unusedVoucherAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateManagementFees",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateUsdcAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "usdcToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
}

export namespace ReceivedEvent {
  export type InputTuple = [depositor: AddressLike, amount: BigNumberish];
  export type OutputTuple = [depositor: string, amount: bigint];
  export interface OutputObject {
    depositor: string;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RevokeVoucherEvent {
  export type InputTuple = [arg0: MealVoucher.VoucherStruct[]];
  export type OutputTuple = [arg0: MealVoucher.VoucherStructOutput[]];
  export interface OutputObject {
    arg0: MealVoucher.VoucherStructOutput[];
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TransferEvent {
  export type InputTuple = [arg0: MealVoucher.TransactionStruct[]];
  export type OutputTuple = [arg0: MealVoucher.TransactionStructOutput[]];
  export interface OutputObject {
    arg0: MealVoucher.TransactionStructOutput[];
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace VoucherGeneratedEvent {
  export type InputTuple = [arg0: MealVoucher.VoucherStruct[]];
  export type OutputTuple = [arg0: MealVoucher.VoucherStructOutput[]];
  export interface OutputObject {
    arg0: MealVoucher.VoucherStructOutput[];
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace VoucherUsedEvent {
  export type InputTuple = [arg0: MealVoucher.VoucherStruct[]];
  export type OutputTuple = [arg0: MealVoucher.VoucherStructOutput[]];
  export interface OutputObject {
    arg0: MealVoucher.VoucherStructOutput[];
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface MealVoucher extends BaseContract {
  connect(runner?: ContractRunner | null): MealVoucher;
  waitForDeployment(): Promise<this>;

  interface: MealVoucherInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  depositAvax: TypedContractMethod<[], [void], "payable">;

  depositUSDC: TypedContractMethod<[amount: BigNumberish], [void], "payable">;

  generateVoucher: TypedContractMethod<
    [listOfIds: MealVoucher.VoucherIdsStruct[], numberOfVouchers: BigNumberish],
    [void],
    "nonpayable"
  >;

  getLifeTimeDonation: TypedContractMethod<[], [bigint], "view">;

  getUsdcBalance: TypedContractMethod<[], [bigint], "view">;

  getUserVouchers: TypedContractMethod<
    [userAddress: AddressLike],
    [bigint[]],
    "view"
  >;

  managementFees: TypedContractMethod<[], [bigint], "view">;

  mealVoucher: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [[bigint, bigint] & { value: bigint; status: bigint }],
    "view"
  >;

  mealVoucherPrice: TypedContractMethod<[], [bigint], "view">;

  owner: TypedContractMethod<[], [string], "view">;

  redeemVoucher: TypedContractMethod<
    [
      vouchers: MealVoucher.VoucherPayableStruct[],
      numberOfVouchers: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  retrieveVoucherDetail: TypedContractMethod<
    [_address: AddressLike, voucherId: BigNumberish],
    [MealVoucher.VoucherStructOutput],
    "view"
  >;

  revokeVoucher: TypedContractMethod<
    [listOfIds: MealVoucher.VoucherIdsStruct[], numberOfVouchers: BigNumberish],
    [void],
    "nonpayable"
  >;

  setVoucherPrice: TypedContractMethod<
    [voucherPrice: BigNumberish],
    [boolean],
    "nonpayable"
  >;

  totalAmountRedeemed: TypedContractMethod<[], [bigint], "view">;

  totalVoucherIssued: TypedContractMethod<[], [bigint], "view">;

  totalVoucherUsed: TypedContractMethod<[], [bigint], "view">;

  unusedVoucherAmount: TypedContractMethod<[], [bigint], "view">;

  updateManagementFees: TypedContractMethod<
    [fees: BigNumberish],
    [boolean],
    "nonpayable"
  >;

  updateUsdcAddress: TypedContractMethod<
    [_usdcToken: AddressLike],
    [boolean],
    "nonpayable"
  >;

  usdcToken: TypedContractMethod<[], [string], "view">;

  withdraw: TypedContractMethod<[], [void], "nonpayable">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "depositAvax"
  ): TypedContractMethod<[], [void], "payable">;
  getFunction(
    nameOrSignature: "depositUSDC"
  ): TypedContractMethod<[amount: BigNumberish], [void], "payable">;
  getFunction(
    nameOrSignature: "generateVoucher"
  ): TypedContractMethod<
    [listOfIds: MealVoucher.VoucherIdsStruct[], numberOfVouchers: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getLifeTimeDonation"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getUsdcBalance"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getUserVouchers"
  ): TypedContractMethod<[userAddress: AddressLike], [bigint[]], "view">;
  getFunction(
    nameOrSignature: "managementFees"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "mealVoucher"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [[bigint, bigint] & { value: bigint; status: bigint }],
    "view"
  >;
  getFunction(
    nameOrSignature: "mealVoucherPrice"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "redeemVoucher"
  ): TypedContractMethod<
    [
      vouchers: MealVoucher.VoucherPayableStruct[],
      numberOfVouchers: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "retrieveVoucherDetail"
  ): TypedContractMethod<
    [_address: AddressLike, voucherId: BigNumberish],
    [MealVoucher.VoucherStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "revokeVoucher"
  ): TypedContractMethod<
    [listOfIds: MealVoucher.VoucherIdsStruct[], numberOfVouchers: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setVoucherPrice"
  ): TypedContractMethod<[voucherPrice: BigNumberish], [boolean], "nonpayable">;
  getFunction(
    nameOrSignature: "totalAmountRedeemed"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "totalVoucherIssued"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "totalVoucherUsed"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "unusedVoucherAmount"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "updateManagementFees"
  ): TypedContractMethod<[fees: BigNumberish], [boolean], "nonpayable">;
  getFunction(
    nameOrSignature: "updateUsdcAddress"
  ): TypedContractMethod<[_usdcToken: AddressLike], [boolean], "nonpayable">;
  getFunction(
    nameOrSignature: "usdcToken"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "withdraw"
  ): TypedContractMethod<[], [void], "nonpayable">;

  getEvent(
    key: "Received"
  ): TypedContractEvent<
    ReceivedEvent.InputTuple,
    ReceivedEvent.OutputTuple,
    ReceivedEvent.OutputObject
  >;
  getEvent(
    key: "RevokeVoucher"
  ): TypedContractEvent<
    RevokeVoucherEvent.InputTuple,
    RevokeVoucherEvent.OutputTuple,
    RevokeVoucherEvent.OutputObject
  >;
  getEvent(
    key: "Transfer"
  ): TypedContractEvent<
    TransferEvent.InputTuple,
    TransferEvent.OutputTuple,
    TransferEvent.OutputObject
  >;
  getEvent(
    key: "VoucherGenerated"
  ): TypedContractEvent<
    VoucherGeneratedEvent.InputTuple,
    VoucherGeneratedEvent.OutputTuple,
    VoucherGeneratedEvent.OutputObject
  >;
  getEvent(
    key: "VoucherUsed"
  ): TypedContractEvent<
    VoucherUsedEvent.InputTuple,
    VoucherUsedEvent.OutputTuple,
    VoucherUsedEvent.OutputObject
  >;

  filters: {
    "Received(address,uint256)": TypedContractEvent<
      ReceivedEvent.InputTuple,
      ReceivedEvent.OutputTuple,
      ReceivedEvent.OutputObject
    >;
    Received: TypedContractEvent<
      ReceivedEvent.InputTuple,
      ReceivedEvent.OutputTuple,
      ReceivedEvent.OutputObject
    >;

    "RevokeVoucher(tuple[])": TypedContractEvent<
      RevokeVoucherEvent.InputTuple,
      RevokeVoucherEvent.OutputTuple,
      RevokeVoucherEvent.OutputObject
    >;
    RevokeVoucher: TypedContractEvent<
      RevokeVoucherEvent.InputTuple,
      RevokeVoucherEvent.OutputTuple,
      RevokeVoucherEvent.OutputObject
    >;

    "Transfer(tuple[])": TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;
    Transfer: TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;

    "VoucherGenerated(tuple[])": TypedContractEvent<
      VoucherGeneratedEvent.InputTuple,
      VoucherGeneratedEvent.OutputTuple,
      VoucherGeneratedEvent.OutputObject
    >;
    VoucherGenerated: TypedContractEvent<
      VoucherGeneratedEvent.InputTuple,
      VoucherGeneratedEvent.OutputTuple,
      VoucherGeneratedEvent.OutputObject
    >;

    "VoucherUsed(tuple[])": TypedContractEvent<
      VoucherUsedEvent.InputTuple,
      VoucherUsedEvent.OutputTuple,
      VoucherUsedEvent.OutputObject
    >;
    VoucherUsed: TypedContractEvent<
      VoucherUsedEvent.InputTuple,
      VoucherUsedEvent.OutputTuple,
      VoucherUsedEvent.OutputObject
    >;
  };
}
