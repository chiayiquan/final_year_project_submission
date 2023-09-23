import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../../libs/axios";
import routes from "../../routes";
import { useStore } from "../../store";
import { CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function index() {
  const user = useStore((store) => store.user);
  const setHistoryPageTab = useStore((store) => store.setHistoryPageTab);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkoutSuccess() {
      try {
        if (user == null) return;
        await axios.post(
          routes.apiRoutes.checkoutSuccess,
          { checkoutSession: id },
          user.jwt
        );
        setHistoryPageTab(true);
        navigate(routes.routes.donate);
      } catch (error) {
        console.log(error);
      }
    }

    checkoutSuccess();
  }, []);
  return (
    <div className="flex flex-col justify-center items-center h-96 min-h-full">
      <CircularProgress size={52} />
      <span className="mt-4">
        <Typography>Redirecting....</Typography>
      </span>
    </div>
  );
}

export default index;
