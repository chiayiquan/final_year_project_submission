import React from "react";
import Dropzone from "react-dropzone";
import { IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  handleFileChange: (file: File[]) => void;
  removeUploadedFile: () => void;
  file: File | null;
  maxFiles: number;
  descriptionField: string;
};

function index({
  handleFileChange,
  removeUploadedFile,
  file,
  maxFiles,
  descriptionField,
}: Props) {
  return (
    <>
      <div className="w-full p-5 border-2 rounded-sm border-dashed outline-none border-slate-600 ">
        <Dropzone
          onDrop={handleFileChange}
          maxFiles={maxFiles}
          accept={{ "application/pdf": [".pdf"] }}
        >
          {({ getRootProps, getInputProps, isDragAccept, isDragActive }) => (
            <section>
              <div {...getRootProps()} className="flex justify-center">
                <input {...getInputProps()} />
                {!isDragActive && <p>{descriptionField}</p>}
                {isDragAccept && <p>Drop file here</p>}
              </div>
            </section>
          )}
        </Dropzone>
      </div>
      {file != null && (
        <div className="flex flex-row items-center mt-2 mb-2">
          <Typography variant="subtitle1">{file.name}</Typography>
          <IconButton onClick={removeUploadedFile} style={{ height: "30px" }}>
            <CloseIcon style={{ height: "30px" }} />
          </IconButton>
        </div>
      )}
    </>
  );
}

export default index;
