import React from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type: AlertColor;
};
function index({ isOpen, onClose, message, type }: Props) {
  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={isOpen}
      onClose={onClose}
      autoHideDuration={6000}
    >
      <Alert onClose={onClose} severity={type} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default index;
