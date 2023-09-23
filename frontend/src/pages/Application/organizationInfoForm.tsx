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
import FileUploader from "../../components/FileUploader";
import MultipleTextField from "../../components/MultipleTextField";

type Props = {
  name: string;
  addresses: string[];
  members: string[];
  onNameChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAddressChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => void;
  onMemberChange: (
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
  onMemberRemove: (index: number) => void;
  addNewMember: () => void;
};

function organizationInfoForm({
  name,
  addresses,
  members,
  onNameChange,
  onAddressChange,
  onMemberChange,
  handleFileChange,
  handleCountryChange,
  selectedCountry,
  countries,
  onAddressRemove,
  addNewAddress,
  onMemberRemove,
  addNewMember,
  removeUploadedFile,
  file,
}: Props) {
  return (
    <div>
      <Typography variant="h6">Organization Informations</Typography>
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
        label="Organization Name"
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
      <MultipleTextField
        fieldName="Members (Email)"
        values={members}
        onValueChange={onMemberChange}
        onRowRemove={onMemberRemove}
        addNewRow={addNewMember}
        isRequired={true}
        textFieldType="email"
        firstFieldDisabled={true}
      />

      <FileUploader
        handleFileChange={handleFileChange}
        removeUploadedFile={removeUploadedFile}
        file={file}
        maxFiles={1}
        descriptionField=" Drag 'n' drop your business operating certificate file(pdf)
                    here, or click to upload your business operating certificate
                    file(pdf)"
      />
    </div>
  );
}

export default organizationInfoForm;
