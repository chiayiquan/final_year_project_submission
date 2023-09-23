import React, { useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
} from "@mui/material";
import Modal from "../../components/Modal";
import * as Country from "../../models/Country";
import env from "../../env";

type Props = {
  detail: Country.Detail;
  modalOpen: boolean;
  setModalState: () => void;
  selectedCountryName: string;
  selectedCountryCode: string;
  updateCountry: ({
    fees,
    voucherPrice,
    countryCode,
  }: {
    fees: number;
    voucherPrice: number;
    countryCode: string;
  }) => Promise<void>;
  isAdmin: boolean;
};

type Fields = {
  fees: boolean;
  voucherPrice: boolean;
};
function detailModal({
  detail,
  modalOpen,
  setModalState,
  selectedCountryName,
  selectedCountryCode,
  updateCountry,
  isAdmin,
}: Props) {
  const [isEdit, setIsEdit] = useState(false);
  const [fields, setFields] = useState<{ fees: number; voucherPrice: number }>({
    fees: detail.managementFees,
    voucherPrice: detail.mealVoucherPrice,
  });
  const [fieldsError, setFieldsError] = useState<Fields>({
    fees: false,
    voucherPrice: false,
  });

  function updateFieldsError(key: keyof Fields, bool: boolean) {
    return setFieldsError((state) => ({ ...state, [key]: bool }));
  }

  function onSubmit() {
    let isError = {
      fees: false,
      voucherPrice: false,
    };
    const { fees, voucherPrice } = fields;
    if (fees < 0 || fees > 100 || isNaN(fees)) isError.fees = true;
    if (voucherPrice < 0.000001 || isNaN(voucherPrice))
      isError.voucherPrice = true;
    setFieldsError(isError);
    if (
      Object.keys(isError).every((key) => isError[key as keyof Fields] !== true)
    ) {
      setIsEdit(false);
      return updateCountry({
        fees,
        voucherPrice,
        countryCode: selectedCountryCode,
      });
    }
  }

  function PartnerCard({
    name,
    addresses,
  }: {
    name: string;
    addresses: string[];
  }) {
    return (
      <Card
        sx={{
          marginBottom: "10px",
          marginRight: "10px",
          width: "400px",
          cursor: "pointer",
        }}
      >
        <CardContent>
          <Typography variant="body2">{name}</Typography>
          <Typography variant="subtitle1">
            Business Addresses:{" "}
            <ul>
              {addresses.map((address, index) => (
                <li key={index}>
                  <Typography variant="subtitle2">
                    {index + 1}. {address}
                  </Typography>
                </li>
              ))}
            </ul>
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Modal isModalOpen={modalOpen} setModalState={setModalState}>
      <div className="flex justify-between">
        <div className="flex flex-col w-1/2">
          <Typography variant="h4">{selectedCountryName}</Typography>
          <Typography variant="h6" sx={{ marginTop: "8px" }}>
            Contract Information
          </Typography>
          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            Contract Address:{" "}
            <a
              href={`${env.VITE_AVAX_ADDRESS_EXPLORER}/${detail.contractId}`}
              target="_blank"
            >
              {detail.contractId}
            </a>
          </Typography>
          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            USDC Balance: ${detail.usdcBalance}
          </Typography>
          <div className="flex items-center mt-2">
            <Typography variant="body1">
              {isEdit === false &&
                `Meal Voucher Price: $${detail.mealVoucherPrice}`}
            </Typography>
            {isEdit && (
              <TextField
                label="Meal Voucher Price ($)"
                variant="standard"
                type="number"
                size="small"
                value={fields.voucherPrice}
                sx={{ marginBottom: "10px" }}
                onChange={(event) => {
                  updateFieldsError("voucherPrice", false);
                  setFields((state) => ({
                    ...state,
                    voucherPrice: parseFloat(event.target.value),
                  }));
                }}
                required
                error={fieldsError.voucherPrice}
                helperText={
                  fieldsError.voucherPrice
                    ? "Meal Voucher Price cannot be below $0.000001"
                    : null
                }
              />
            )}
          </div>

          <div className="flex items-center mt-2">
            <Typography variant="body1">
              {isEdit === false && `Management Fees:${detail.managementFees}%`}
            </Typography>

            {isEdit && (
              <TextField
                label="Management Fees (%)"
                variant="standard"
                type="number"
                size="small"
                value={fields.fees}
                sx={{ marginBottom: "10px" }}
                onChange={(event) => {
                  updateFieldsError("fees", false);
                  setFields((state) => ({
                    ...state,
                    fees: parseFloat(event.target.value),
                  }));
                }}
                required
                error={fieldsError.fees}
                helperText={
                  fieldsError.fees
                    ? "Fees cannot be below 0 or above 100"
                    : null
                }
              />
            )}
          </div>

          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            Total Voucher Issued: {detail.totalVoucherIssued}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            Total Voucher Used: {detail.totalVoucherUsed}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            Total Voucher Available For Generation:{" "}
            {Math.floor(
              (detail.usdcBalance - detail.unusedVoucherAmount) /
                detail.mealVoucherPrice
            ) || 0}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: "8px" }}>
            Unused Voucher Balance: ${detail.unusedVoucherAmount}
          </Typography>
        </div>
        <div className="flex flex-col justify-center w-1/2">
          {isEdit === false && isAdmin && (
            <Button
              variant="contained"
              sx={{ width: "50%" }}
              onClick={() => setIsEdit(true)}
            >
              Edit Contract
            </Button>
          )}
          {isEdit && isAdmin && (
            <>
              <Button
                variant="contained"
                sx={{ width: "50%", marginBottom: "20px" }}
                onClick={() => {
                  onSubmit();
                }}
                color="success"
              >
                Update Contract
              </Button>
              <Button
                variant="contained"
                sx={{ width: "50%" }}
                color="error"
                onClick={() => setIsEdit(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Typography variant="h6" sx={{ marginTop: "8px" }}>
        Participating Organizations
      </Typography>
      {detail.organizations.length > 0 ? (
        <div className="flex flex-wrap mt-2">
          {detail.organizations.map((organization, index) => (
            <PartnerCard
              name={organization.name}
              addresses={organization.addresses.map(({ address }) => address)}
              key={`${organization.name}_${index}`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2">
          <Typography variant="body1">
            No participating organizations currently
          </Typography>
        </div>
      )}

      <Typography variant="h6" sx={{ marginTop: "8px" }}>
        Participating Merchants
      </Typography>
      {detail.merchants.length > 0 ? (
        <div className="flex flex-wrap mt-2">
          {detail.merchants.map((merchant, index) => (
            <PartnerCard
              name={merchant.name}
              addresses={merchant.addresses.map(({ address }) => address)}
              key={`${merchant.name}_${index}`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2">
          <Typography variant="body1">
            No participating merchants currently
          </Typography>
        </div>
      )}
    </Modal>
  );
}

export default detailModal;
