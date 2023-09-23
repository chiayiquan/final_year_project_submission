import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Link,
  LinearProgress,
} from "@mui/material";
import routes from "../../routes";
import Regex from "../../libs/regex";

type Props = {
  onSubmit: (email: string, password: string) => void;
  error: {
    hasError: boolean;
    message: string;
  };
  isSubmitting: boolean;
};

type Fields = {
  email: boolean;
  password: boolean;
};

function form({ onSubmit, error, isSubmitting }: Props) {
  const [formData, setFormData] = useState<{ email: string; password: string }>(
    { email: "", password: "" }
  );
  const [fieldsError, setFieldsError] = useState<Fields>({
    email: false,
    password: false,
  });

  function updateFieldsError(key: keyof Fields, bool: boolean) {
    return setFieldsError((state) => ({ ...state, [key]: bool }));
  }

  function onSubmitValidation() {
    let isError = {
      email: false,
      password: false,
    };

    if (Regex.checkValidEmail(formData.email) === false) isError.email = true;

    if (formData.password.trim().length < 1) isError.password = true;
    setFieldsError(isError);
    if (
      Object.keys(isError).every(
        (key) => isError[key as keyof Fields] === false
      )
    )
      return onSubmit(formData.email.trim(), formData.password.trim());
  }

  return (
    <div className="flex flex-col mt-10 ml-4 mr-4">
      <Typography variant="h3">Login</Typography>
      <div className="mt-10">
        <TextField
          id="email"
          label="Email"
          type="email"
          variant="standard"
          value={formData.email}
          fullWidth={true}
          sx={{ marginTop: "10px" }}
          onChange={(event) => {
            updateFieldsError("email", false);
            setFormData((state) => ({ ...state, email: event.target.value }));
          }}
          error={fieldsError.email}
          helperText={fieldsError.email ? `Email is invalid` : null}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          variant="standard"
          value={formData.password}
          fullWidth={true}
          sx={{ marginTop: "10px" }}
          onChange={(event) => {
            updateFieldsError("password", false);
            setFormData((state) => ({
              ...state,
              password: event.target.value,
            }));
          }}
          error={fieldsError.password}
          helperText={fieldsError.password ? `Password cannot be empty` : null}
        />

        {error.hasError && (
          <Typography className="text-red-600" sx={{ marginTop: "20px" }}>
            {error.message}
          </Typography>
        )}

        {isSubmitting}

        <div className="flex flex-col flex-wrap">
          <Button
            variant="contained"
            fullWidth={true}
            sx={{ padding: "10px 0px", marginTop: "20px" }}
            onClick={() => onSubmitValidation()}
            disabled={isSubmitting}
          >
            Login
          </Button>
          {isSubmitting && <LinearProgress />}
        </div>

        <div className="mt-5">
          <Link href={routes.routes.register}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default form;
