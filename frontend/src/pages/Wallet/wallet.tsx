import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Paper,
  LinearProgress,
} from "@mui/material";
import Regex from "../../libs/regex";
import env from "../../env";

type Props = {
  availableBalance: number;
  result: {
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
    isSubmitting: boolean;
    hash: string;
  };
  sendTransaction: (data: {
    amount: number;
    walletPassword: string;
    recipientAddress: string;
  }) => Promise<void>;
};
type Fields = {
  address: boolean;
  amount: boolean;
  password: boolean;
};

function wallet({ availableBalance, result, sendTransaction }: Props) {
  const [formData, setFormData] = useState<{
    address: string;
    amount: string;
    password: string;
  }>({ address: "", amount: "", password: "" });

  const [fieldsError, setFieldsError] = useState<Fields>({
    address: false,
    amount: false,
    password: false,
  });
  function updateFieldsError(key: keyof Fields, bool: boolean) {
    return setFieldsError((state) => ({ ...state, [key]: bool }));
  }

  function onSubmit() {
    let isError = {
      address: false,
      amount: false,
      password: false,
    };

    if (Regex.checkEthAddress(formData.address) === false)
      isError.address = true;
    const balance = parseFloat(formData.amount);
    if (isNaN(balance) || balance < 0.000001 || balance > availableBalance)
      isError.amount = true;
    if (formData.password.trim().length < 1) isError.password = true;
    setFieldsError(isError);
    if (
      Object.keys(isError).every(
        (key) => isError[key as keyof Fields] === false
      )
    )
      return sendTransaction({
        amount: balance,
        walletPassword: formData.password.trim(),
        recipientAddress: formData.address.trim(),
      });
  }

  return (
    <Paper className="p-5">
      <div className="flex flex-col  min-h-full">
        <Typography variant="h5">Wallet Transfer</Typography>
        <TextField
          label="Recipient Address"
          sx={{ marginTop: "20px" }}
          type="text"
          value={formData.address}
          onChange={(event) => {
            updateFieldsError("address", false);
            setFormData((state) => ({ ...state, address: event.target.value }));
          }}
          error={fieldsError.address}
          helperText={fieldsError.address ? "Invalid address" : null}
        />
        <div className="flex flex-col mt-5">
          <div className="flex justify-end">
            <Typography variant="subtitle2">
              Available Balance: {availableBalance}
            </Typography>
          </div>

          <TextField
            label="Amount To Transfer"
            type="number"
            value={formData.amount}
            onChange={(event) => {
              updateFieldsError("amount", false);
              setFormData((state) => ({
                ...state,
                amount: event.target.value,
              }));
            }}
            error={fieldsError.amount}
            helperText={
              fieldsError.amount
                ? `Minimum amount is 0.000001 and maximum amount is ${availableBalance}`
                : null
            }
          />
        </div>

        <TextField
          label="Wallet Password"
          type="password"
          sx={{ marginTop: "20px", marginBottom: "20px" }}
          value={formData.password}
          onChange={(event) => {
            updateFieldsError("password", false);
            setFormData((state) => ({
              ...state,
              password: event.target.value,
            }));
          }}
          error={fieldsError.password}
          helperText={fieldsError.password ? "Password cannot be empty" : null}
        />

        {result.isToDisplay && (
          <Typography
            className={`${
              result.isSuccess ? "text-green-600" : "text-red-600"
            }`}
            sx={{ marginBottom: "10px" }}
          >
            {result.message}
            {result.isSuccess && (
              <>
                <br />{" "}
                <a
                  href={`${env.VITE_AVAX_TX_EXPLORER}${result.hash}`}
                  target="_blank"
                >
                  Confirmation Hash:{result.hash}
                </a>
              </>
            )}
          </Typography>
        )}

        <div className="flex flex-col flex-wrap">
          <Button
            variant="contained"
            sx={{ padding: "10px" }}
            onClick={() => onSubmit()}
            disabled={result.isSubmitting}
          >
            Transfer USDC
          </Button>
          {result.isSubmitting && <LinearProgress />}
        </div>
      </div>
    </Paper>
  );
}

export default wallet;
