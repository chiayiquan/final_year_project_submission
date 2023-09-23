import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  Input,
  InputLabel,
  IconButton,
  FormControl,
  Tooltip,
  FormHelperText,
  LinearProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import routes from "../../routes";
import Regex from "../../libs/regex";

type Params = {
  register: (
    name: string,
    email: string,
    password: string,
    walletPassword: string
  ) => void;
  result: {
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
    isSubmitting: boolean;
  };
};

function form({ register, result }: Params) {
  type Form = Readonly<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    walletPassword: string;
  }>;
  const [passwordVisibility, setPasswordVisibility] = useState<{
    password: boolean;
    confirmPassword: boolean;
    walletPassword: boolean;
  }>({ password: false, confirmPassword: false, walletPassword: false });

  const [formData, setFormData] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    walletPassword: "",
  });

  const defaultValidationState = {
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    walletPassword: false,
  };

  const [validation, setValidation] = useState<{
    name: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
    walletPassword: boolean;
  }>(defaultValidationState);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  async function onSubmit() {
    setValidation(defaultValidationState);
    const validationResult = {
      name: formData.name.trim().length === 0,
      email: Regex.checkValidEmail(formData.email) === false,
      password: formData.password.trim().length === 0,
      confirmPassword:
        formData.password.trim() !== formData.confirmPassword.trim(),
      walletPassword: formData.walletPassword.trim().length === 0,
    };
    setValidation(validationResult);

    if (Object.values(validationResult).some((value) => value)) return;
    return register(
      formData.name,
      formData.email,
      formData.password,
      formData.walletPassword
    );
  }

  function handleTextChange(data: Partial<Form>, field: keyof Form) {
    setFormData((state) => ({ ...state, ...data }));
    setValidation((state) => ({ ...state, [field]: false }));
  }

  return (
    <div className="flex flex-col mt-10 ml-4 mr-4">
      <Typography variant="h3">Register</Typography>
      <div className="mt-10">
        <TextField
          id="name"
          error={validation.name}
          helperText={validation.name && "Name cannot be empty"}
          label="Name"
          type="text"
          variant="standard"
          fullWidth={true}
          value={formData.name}
          onChange={(event) =>
            handleTextChange({ name: event.target.value }, "name")
          }
          sx={{ marginTop: "10px" }}
          required
        />
        <TextField
          id="email"
          error={validation.email}
          helperText={validation.email && "Invalid email"}
          label="Email"
          type="email"
          variant="standard"
          fullWidth={true}
          value={formData.email}
          onChange={(event) =>
            handleTextChange({ email: event.target.value }, "email")
          }
          sx={{ marginTop: "10px" }}
          required
        />
        <FormControl
          sx={{ marginTop: "10px" }}
          variant="standard"
          fullWidth={true}
        >
          <InputLabel htmlFor="password">Password</InputLabel>
          <Input
            id="password"
            error={validation.password}
            type={passwordVisibility.password ? "text" : "password"}
            fullWidth={true}
            value={formData.password}
            onChange={(event) =>
              handleTextChange({ password: event.target.value }, "password")
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() =>
                    setPasswordVisibility((state) => ({
                      ...state,
                      password: !state.password,
                    }))
                  }
                  onMouseDown={handleMouseDownPassword}
                >
                  {passwordVisibility.password ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            }
            required
          />

          {validation.password && (
            <FormHelperText error>Password cannot be empty</FormHelperText>
          )}
        </FormControl>

        <FormControl
          sx={{ marginTop: "10px" }}
          variant="standard"
          fullWidth={true}
        >
          <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
          <Input
            id="confirmPassword"
            type={passwordVisibility.confirmPassword ? "text" : "password"}
            fullWidth={true}
            value={formData.confirmPassword}
            error={validation.confirmPassword}
            onChange={(event) =>
              handleTextChange(
                { confirmPassword: event.target.value },
                "confirmPassword"
              )
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() =>
                    setPasswordVisibility((state) => ({
                      ...state,
                      confirmPassword: !state.confirmPassword,
                    }))
                  }
                  onMouseDown={handleMouseDownPassword}
                >
                  {passwordVisibility.confirmPassword ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            }
            required
          />
          {validation.confirmPassword && (
            <FormHelperText error>
              Password and Confirm Password must be the same
            </FormHelperText>
          )}
        </FormControl>

        <FormControl
          sx={{ marginTop: "10px" }}
          variant="standard"
          fullWidth={true}
        >
          <InputLabel htmlFor="walletPassword">Wallet Password</InputLabel>
          <Input
            id="walletPassword"
            error={validation.walletPassword}
            type={passwordVisibility.walletPassword ? "text" : "password"}
            fullWidth={true}
            value={formData.walletPassword}
            onChange={(event) =>
              handleTextChange(
                { walletPassword: event.target.value },
                "walletPassword"
              )
            }
            endAdornment={
              <InputAdornment position="end">
                <Tooltip
                  title="Remember this password to access the built-in wallet, there is no way of recovering this password once it's lost"
                  placement="right"
                  disableFocusListener
                >
                  <IconButton>
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() =>
                    setPasswordVisibility((state) => ({
                      ...state,
                      walletPassword: !state.walletPassword,
                    }))
                  }
                  onMouseDown={handleMouseDownPassword}
                >
                  {passwordVisibility.walletPassword ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            }
            required
          />
          {validation.walletPassword && (
            <FormHelperText error>
              Wallet password cannot be empty
            </FormHelperText>
          )}
        </FormControl>

        {result.isToDisplay && (
          <Typography
            className={`${
              result.isSuccess ? "text-green-600" : "text-red-600"
            }`}
            sx={{ marginTop: "20px" }}
          >
            {result.message}
          </Typography>
        )}

        <div className="flex flex-col flex-wrap mt-5">
          <Button
            variant="contained"
            fullWidth={true}
            onClick={() => onSubmit()}
            sx={{ padding: "10px 0px" }}
          >
            Register
          </Button>
          {result.isSubmitting && <LinearProgress />}
        </div>

        <div className="mt-5 mb-5">
          <Link href={routes.routes.login}>
            Have an account already? Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default form;
