import React from "react";
import {
  Divider,
  Typography,
  SelectChangeEvent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import FileUploader from "../../components/FileUploader";

type Props = {
  handleFileChange: (file: File[]) => void;
  handleCountryChange: (event: SelectChangeEvent) => void;
  removeUploadedFile: () => void;
  file: File | null;
  selectedCountry: string;
  countries: {
    [key: string]: {
      countryName: string;
    };
  };
};

function beneficiaryInfoForm({
  handleFileChange,
  handleCountryChange,
  selectedCountry,
  countries,
  removeUploadedFile,
  file,
}: Props) {
  return (
    <div>
      <Typography variant="h6">Additional Information</Typography>
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

      <FileUploader
        handleFileChange={handleFileChange}
        removeUploadedFile={removeUploadedFile}
        file={file}
        maxFiles={1}
        descriptionField="Drag 'n' drop your annual income file(pdf) here, or click to
                    upload your annual income file(pdf)"
      />
    </div>
  );
}

export default beneficiaryInfoForm;
