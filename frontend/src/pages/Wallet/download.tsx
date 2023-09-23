import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Paper,
  LinearProgress,
} from "@mui/material";

type Props = {
  isDownload: boolean;
  downloadPrivateKey: (walletPassword: string) => Promise<void>;
  error: {
    isToDisplay: boolean;
    message: string;
  };
};
function download({ isDownload, downloadPrivateKey, error }: Props) {
  const [walletPassword, setWalletPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  function onSubmit() {
    if (walletPassword.trim().length > 0)
      return downloadPrivateKey(walletPassword.trim());
    setPasswordError(true);
  }

  return (
    <div>
      <Paper className="p-5">
        <div className="flex flex-col  min-h-full">
          <Typography variant="h5">Export Private Key</Typography>
          <TextField
            label="Wallet Password"
            type="password"
            sx={{ marginTop: "20px", marginBottom: "20px" }}
            value={walletPassword}
            onChange={(event) => {
              setPasswordError(false);
              setWalletPassword(event.target.value);
            }}
            error={passwordError}
            helperText={passwordError ? "Password cannot be empty" : null}
          />
        </div>

        {error.isToDisplay && (
          <Typography className="text-red-600" sx={{ marginBottom: "10px" }}>
            {error.message}
          </Typography>
        )}

        <div className="flex flex-col flex-wrap">
          <Button
            variant="contained"
            sx={{ padding: "10px" }}
            onClick={() => onSubmit()}
            disabled={isDownload}
          >
            Export Private Key
          </Button>
          {isDownload && <LinearProgress />}
        </div>
      </Paper>
    </div>
  );
}

export default download;
