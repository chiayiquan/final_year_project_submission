import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Form from "./form";
import { useStore } from "../../store";
import { decodeUser } from "../../models/User";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../libs/axios";
import routes from "../../routes";

function index() {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectParam = queryParams.get("redirect");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{
    hasError: boolean;
    message: string;
  }>({ hasError: false, message: "" });

  useEffect(() => {
    if (user != null) return navigate("/");
  }, []);

  async function onSubmit(email: string, password: string) {
    try {
      setIsSubmitting(true);
      const response = await axios.post(routes.apiRoutes.login, {
        email,
        password,
      });
      if (response.status === 400) return;

      const user = decodeUser(response.data);
      if (user == null) return;
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      if (
        redirectParam != null &&
        redirectParam !== routes.routes.login &&
        redirectParam !== routes.routes.register
      ) {
        return navigate(redirectParam);
      }
      return navigate("/");
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      const { message } = axios.decodeError(error);
      setError({ hasError: true, message });
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="flex justify-center h-2/3 md:w-2/3">
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            width: "100%",
            height: "100%",
            minHeight: "66vh",
          }}
        >
          {/** login form */}
          <div className="w-full">
            <Form
              onSubmit={onSubmit}
              error={error}
              isSubmitting={isSubmitting}
            />
          </div>
        </Paper>
      </div>
    </div>
  );
}

export default index;
