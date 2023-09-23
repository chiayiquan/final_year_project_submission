import React, { useState } from "react";
import Modal from "../../components/Modal";
import {
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  LinearProgress,
} from "@mui/material";
import * as Country from "../../models/Country";

type Props = {
  isModalOpen: boolean;
  setModalState: () => void;
  countries: Country.CountrySchema[];
  createCountry: (data: {
    selectedCountry: string;
    planName: string;
    description: string;
    fees: number;
    pricePerVoucher: number;
  }) => Promise<void>;
  result: {
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
  };
  createCountryLoading: boolean;
};

type Fields = {
  selectedCountry: boolean;
  planName: boolean;
  description: boolean;
  fees: boolean;
  pricePerVoucher: boolean;
};
function createModal({
  isModalOpen,
  setModalState,
  countries,
  createCountry,
  result,
  createCountryLoading,
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [fees, setFees] = useState(0);
  const [pricePerVoucher, setPricePerVoucher] = useState(1);
  const [fieldsError, setFieldsError] = useState<Fields>({
    selectedCountry: false,
    planName: false,
    description: false,
    fees: false,
    pricePerVoucher: false,
  });

  function updateFieldsError(key: keyof Fields, bool: boolean) {
    return setFieldsError((state) => ({ ...state, [key]: bool }));
  }

  function onSubmit() {
    let isError = {
      selectedCountry: false,
      planName: false,
      description: false,
      fees: false,
      pricePerVoucher: false,
    };
    if (selectedCountry === "") isError.selectedCountry = true;
    if (planName.trim().length === 0) isError.planName = true;
    if (description.trim().length === 0) isError.description = true;
    if (fees < 0 || fees > 100 || isNaN(fees)) isError.fees = true;
    if (pricePerVoucher < 0.000001 || isNaN(pricePerVoucher))
      isError.pricePerVoucher = true;
    setFieldsError(isError);
    console.log(isError);
    if (
      Object.keys(isError).every((key) => isError[key as keyof Fields] !== true)
    )
      return createCountry({
        selectedCountry,
        planName,
        description,
        fees,
        pricePerVoucher,
      });
  }

  return (
    <Modal isModalOpen={isModalOpen} setModalState={setModalState}>
      <div className="flex flex-col">
        <Typography variant="h5">Add Support For New Country</Typography>
        <Divider />
        <FormControl required sx={{ margin: "10px 0px", width: "100%" }}>
          <InputLabel id="countriesLabel">
            New Country To Be Supported
          </InputLabel>
          <Select
            labelId="countriesLabel"
            id="countries"
            value={selectedCountry}
            label="New Country To Be Supported"
            onChange={(event) => {
              updateFieldsError("selectedCountry", false);
              setSelectedCountry(event.target.value);
            }}
          >
            {countries.map(({ code, name }) => {
              return (
                <MenuItem value={code} key={code}>
                  {name}
                </MenuItem>
              );
            })}
          </Select>
          {fieldsError.selectedCountry && (
            <Typography className="text-red-600">
              Please Select A Country
            </Typography>
          )}
        </FormControl>

        <TextField
          label="Plan Name For Stripe"
          type="text"
          variant="standard"
          value={planName}
          fullWidth={true}
          sx={{ marginBottom: "10px" }}
          onChange={(event) => {
            updateFieldsError("planName", false);
            setPlanName(event.target.value);
          }}
          required
          error={fieldsError.planName}
          helperText={fieldsError.planName ? "Plan Name Cannot Be Empty" : null}
        />

        <TextField
          label="Short Description Of Plan"
          multiline
          maxRows={4}
          variant="standard"
          value={description}
          fullWidth={true}
          sx={{ marginBottom: "10px" }}
          onChange={(event) => {
            updateFieldsError("description", false);
            setDescription(event.target.value);
          }}
          required
          error={fieldsError.description}
          helperText={
            fieldsError.description ? "Short Description Cannot Be Empty" : null
          }
        />

        <TextField
          label="Meal Voucher Price ($)"
          variant="standard"
          type="number"
          value={pricePerVoucher}
          sx={{ marginBottom: "10px" }}
          onChange={(event) => {
            updateFieldsError("pricePerVoucher", false);
            setPricePerVoucher(parseFloat(event.target.value));
          }}
          required
          error={fieldsError.pricePerVoucher}
          helperText={
            fieldsError.pricePerVoucher
              ? "Meal Voucher Price cannot be below $0.000001"
              : null
          }
        />
        <TextField
          label="Management Fees (%)"
          variant="standard"
          type="number"
          value={fees}
          sx={{ marginBottom: "10px" }}
          onChange={(event) => {
            updateFieldsError("fees", false);
            setFees(parseFloat(event.target.value));
          }}
          required
          error={fieldsError.fees}
          helperText={
            fieldsError.fees ? "Fees cannot be below 0 or above 100" : null
          }
        />
        {result.isToDisplay && (
          <Typography
            className={`mt-3 ${
              result.isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {result.message}
          </Typography>
        )}

        <>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: "10px", padding: "20px" }}
            onClick={() => onSubmit()}
            disabled={createCountryLoading}
          >
            Deploy New Country
          </Button>

          {createCountryLoading && <LinearProgress />}
        </>
      </div>
    </Modal>
  );
}

export default createModal;
