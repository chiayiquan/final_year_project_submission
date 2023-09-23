import React from "react";
import {
  TextField,
  Divider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import MultipleTextField from "../../components/MultipleTextField";
import FileUploader from "../../components/FileUploader";

type Props = {
  name: string;
  addresses: string[];
  onNameChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAddressChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => void;
  handleFileChange: (file: File[]) => void;
  removeUploadedFile: () => void;
  file: File | null;
  handleCountryChange: (event: SelectChangeEvent) => void;
  selectedCountry: string;
  countries: {
    [key: string]: {
      countryName: string;
    };
  };
  onAddressRemove: (index: number) => void;
  addNewAddress: () => void;
};
function merchantForm({
  name,
  addresses,
  onNameChange,
  onAddressChange,
  handleFileChange,
  countries,
  selectedCountry,
  handleCountryChange,
  onAddressRemove,
  addNewAddress,
  removeUploadedFile,
  file,
}: Props) {
  return (
    <div>
      <Typography variant="h6">Merchant Informations</Typography>
      <Divider />

      <FormControl required sx={{ margin: "10px 0px", width: "100%" }}>
        <InputLabel id="countriesLabel">Country You Are Applying</InputLabel>
        <Select
          labelId="countriesLabel"
          id="countries"
          value={selectedCountry}
          label="Country You Are Applying *"
          onChange={handleCountryChange}
        >
          {Object.keys(countries).map((key) => {
            return (
              <MenuItem value={key} key={key}>
                {countries[key].countryName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        label="Stall Name"
        type="text"
        variant="standard"
        value={name}
        fullWidth={true}
        sx={{ marginTop: "10px" }}
        onChange={onNameChange}
      />
      <MultipleTextField
        fieldName="Business Address"
        values={addresses}
        onValueChange={onAddressChange}
        onRowRemove={onAddressRemove}
        addNewRow={addNewAddress}
        isRequired={true}
        textFieldType="text"
        firstFieldDisabled={false}
      />

      <FileUploader
        handleFileChange={handleFileChange}
        removeUploadedFile={removeUploadedFile}
        file={file}
        maxFiles={1}
        descriptionField=" Drag 'n' drop your food license file(pdf) here, or click to
                    upload your food license file(pdf)"
      />
    </div>
  );
}

export default merchantForm;
