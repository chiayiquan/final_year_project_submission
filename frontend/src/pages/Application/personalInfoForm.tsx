import React from "react";
import { TextField, Divider, Typography } from "@mui/material";
import FileUploader from "../../components/FileUploader";

type Props = {
  name: string;
  address: string;
  onNameChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAddressChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (file: File[]) => void;
  removeUploadedFile: () => void;
  file: File | null;
};
function personalInfoForm({
  name,
  address,
  onNameChange,
  onAddressChange,
  handleFileChange,
  removeUploadedFile,
  file,
}: Props) {
  return (
    <div>
      <Typography variant="h6">Personal Informations</Typography>
      <Divider />
      <TextField
        label="Name"
        type="text"
        variant="standard"
        value={name}
        fullWidth={true}
        sx={{ marginTop: "10px" }}
        onChange={onNameChange}
      />
      <TextField
        label="Address"
        type="text"
        variant="standard"
        value={address}
        fullWidth={true}
        sx={{ marginTop: "10px", marginBottom: "20px" }}
        onChange={onAddressChange}
      />

      <FileUploader
        handleFileChange={handleFileChange}
        removeUploadedFile={removeUploadedFile}
        file={file}
        maxFiles={1}
        descriptionField="Drag 'n' drop your identification file(pdf) here, or click
                    to upload your identification file(pdf)"
      />
    </div>
  );
}

export default personalInfoForm;
