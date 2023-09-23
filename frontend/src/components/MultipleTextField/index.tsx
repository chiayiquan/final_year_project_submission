import React from "react";
import { TextField, Button, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  fieldName: string;
  values: string[];
  onValueChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => void;
  onRowRemove: (index: number) => void;
  addNewRow: () => void;
  isRequired: boolean;
  textFieldType: React.HTMLInputTypeAttribute;
  firstFieldDisabled: boolean;
};

function index({
  fieldName,
  values,
  onValueChange,
  onRowRemove,
  addNewRow,
  isRequired,
  textFieldType,
  firstFieldDisabled,
}: Props) {
  return (
    <div>
      {values.map((value, index) =>
        index === 0 ? (
          <TextField
            key={index}
            type={textFieldType}
            label={fieldName}
            variant="standard"
            value={value}
            fullWidth
            onChange={(event) => onValueChange(event, index)}
            required={isRequired}
            disabled={firstFieldDisabled}
          />
        ) : (
          <div className="flex flex-row items-center" key={index}>
            <TextField
              key={index}
              type={textFieldType}
              label={fieldName}
              variant="standard"
              value={value}
              fullWidth
              onChange={(event) => onValueChange(event, index)}
            />
            <IconButton
              onClick={() => onRowRemove(index)}
              style={{ height: "30px" }}
            >
              <CloseIcon style={{ height: "30px" }} />
            </IconButton>
          </div>
        )
      )}

      <Button variant="text" onClick={() => addNewRow()}>
        Add New {fieldName}
      </Button>
    </div>
  );
}

export default index;
