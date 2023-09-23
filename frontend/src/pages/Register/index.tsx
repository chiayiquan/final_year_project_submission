import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Form from "./form";
import axios from "../../libs/axios";
import routes from "../../routes";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store";

function index() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  if (user != null) return navigate(routes.routes.home);
  const [responseResult, setResponseResult] = useState<{
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
    isSubmitting: boolean;
  }>({
    isToDisplay: false,
    isSuccess: false,
    message: "",
    isSubmitting: false,
  });

  useEffect(() => {
    if (user != null) return navigate(routes.routes.home);
  }, []);

  async function register(
    name: string,
    email: string,
    password: string,
    walletPassword: string
  ) {
    try {
      setResponseResult((state) => ({ ...state, isSubmitting: true }));
      const response = await axios.post(routes.apiRoutes.register, {
        name,
        email,
        password,
        walletPassword,
      });

      const { message } = axios.decodeMessageSuccess(response);
      setResponseResult({
        isSubmitting: false,
        message,
        isSuccess: true,
        isToDisplay: true,
      });
    } catch (error) {
      const { message } = axios.decodeError(error);
      setResponseResult({
        isSubmitting: false,
        message,
        isSuccess: false,
        isToDisplay: true,
      });
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="flex justify-center ">
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            width: "100%",
            height: "100%",
            minHeight: "66vh",
          }}
        >
          {/** Registration form */}
          <Form register={register} result={responseResult} />
        </Paper>
      </div>
    </div>
  );
}

export default index;
