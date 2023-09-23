import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "../../libs/axios";
import routes from "../../routes";
import { useStore } from "../../store";
import { CircularProgress, Typography } from "@mui/material";

function index() {
  const user = useStore((store) => store.user);
  const setTransactionPageTab = useStore(
    (store) => store.setTransactionPageTab
  );
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    async function redeemVoucher() {
      try {
        if (user == null) return;
        const response = await axios.post(
          routes.apiRoutes.redeemVoucher,
          { id },
          user.jwt
        );
        const { message } = axios.decodeMessageSuccess(response);
        setTransactionPageTab({
          isTransactionsTab: true,
          message,
          isSuccess: true,
          toDisplay: true,
        });
        return navigate(routes.routes.transaction);
      } catch (error) {
        console.log(error);
        const { message } = axios.decodeError(error);
        setTransactionPageTab({
          isTransactionsTab: true,
          message,
          isSuccess: false,
          toDisplay: true,
        });
        return navigate(routes.routes.transaction);
      }
    }
    redeemVoucher();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-96 min-h-full">
      <CircularProgress size={52} />
      <span className="mt-4">
        <Typography>Redeeming Voucher....</Typography>
      </span>
    </div>
  );
}

export default index;
