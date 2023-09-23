import React, { useState, useEffect } from "react";
import { SelectChangeEvent, Tabs, Tab } from "@mui/material";
import TabPanel from "../../components/TabPanel";
import { useStore } from "../../store";
import Wallet from "./wallet";
import routes from "../../routes";
import axios from "../../libs/axios";
import WalletModel, { Schema } from "../../models/Wallet";
import History from "./history";
import Download from "./download";

function index() {
  const user = useStore((state) => state.user);
  const [sideTabValue, setSideTabValue] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [transferResult, setTransferResult] = useState<{
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
    isSubmitting: boolean;
    hash: string;
  }>({
    isToDisplay: false,
    isSuccess: false,
    message: "",
    isSubmitting: false,
    hash: "",
  });
  const [transferData, setTransferData] = useState<{
    transfers: Schema[];
    totalTransfers: number;
  }>({ transfers: [], totalTransfers: 0 });
  const [historyTableProps, setHistoryTableProps] = useState<{
    page: number;
    limit: number;
  }>({ page: 0, limit: 10 });

  const [isDownload, setIsDownload] = useState(false);
  const [downloadError, setDownloadError] = useState<{
    isToDisplay: boolean;
    message: string;
  }>({ isToDisplay: false, message: "" });

  const handleSideTabChange = async (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    if (newValue === 1)
      getHistory(historyTableProps.page, historyTableProps.limit);
    setSideTabValue(newValue);
  };

  useEffect(() => {
    getBalance();
  }, []);

  async function getBalance() {
    try {
      const response = await axios.get(
        routes.apiRoutes.walletBalance,
        user?.jwt
      );
      const { balance } = WalletModel.decodeBalance(response.data);
      setUsdcBalance(balance);
    } catch (error) {
      console.log(error);
    }
  }

  async function sendTransaction(data: {
    amount: number;
    walletPassword: string;
    recipientAddress: string;
  }) {
    try {
      setTransferResult((state) => ({ ...state, isSubmitting: true }));
      const response = await axios.post(
        routes.apiRoutes.walletTransfer,
        data,
        user?.jwt
      );
      const { message, hash } = WalletModel.decodeTransferResponse(
        response.data
      );

      setTransferResult({
        isSubmitting: false,
        isToDisplay: true,
        isSuccess: true,
        message: message,
        hash,
      });

      setTimeout(() => getBalance(), 3000);
    } catch (error) {
      const { message } = axios.decodeError(error);
      setTransferResult({
        isSubmitting: false,
        isToDisplay: true,
        isSuccess: false,
        message: message,
        hash: "",
      });
    }
  }

  async function getHistory(page: number, limit: number) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.walletHistory}?page=${page}&limit=${limit}`,
        user?.jwt
      );
      const transferData = WalletModel.decodeTransferHistory(response.data);
      setTransferData(transferData);
    } catch (error) {
      console.log(error);
    }
  }

  function onPageChangeHistoryTable(newPage: number): void {
    setHistoryTableProps((state) => ({ ...state, page: newPage }));

    getHistory(newPage, historyTableProps.limit);
  }

  function onNumOfRowsChangeHistoryTable(rowsPerPage: number) {
    setHistoryTableProps((state) => ({
      ...state,
      limit: rowsPerPage,
      page: 0,
    }));
    getHistory(0, rowsPerPage);
  }

  async function downloadPrivateKey(walletPassword: string) {
    try {
      setIsDownload(true);
      const response = await axios.post(
        routes.apiRoutes.walletDownload,
        { walletPassword },
        user?.jwt
      );

      // https://stackoverflow.com/questions/50694881/how-to-download-file-in-react-js
      // Convert array buffer to Blob
      const blob = new Blob([response.data], {
        type: "application/octet-stream",
      });

      // Create a Blob URL and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user?.id}.txt`; // Set desired filename
      a.click();
      URL.revokeObjectURL(url); // Clean up the Blob URL
      setIsDownload(false);
    } catch (error) {
      console.log(error);
      const { message } = axios.decodeError(error);
      setDownloadError({ isToDisplay: true, message });
      setIsDownload(false);
    }
  }

  return (
    <div className="flex lg:justify-center flex-wrap">
      <Tabs
        value={sideTabValue}
        onChange={handleSideTabChange}
        textColor="secondary"
        indicatorColor="secondary"
        orientation="vertical"
        className="lg:w-1/6 w-full"
        sx={{
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          marginRight: "10px",
          marginTop: "20px",
        }}
      >
        <Tab label="Wallet" className="flex jutify-center flex-1" />
        <Tab label="History" className="flex jutify-center flex-1" />
        <Tab label="Export Private Key" className="flex jutify-center flex-1" />
      </Tabs>

      <TabPanel
        value={sideTabValue}
        index={0}
        className="lg:w-3/5 w-full min-w-fit"
      >
        <Wallet
          result={transferResult}
          availableBalance={usdcBalance}
          sendTransaction={sendTransaction}
        />
      </TabPanel>

      <TabPanel
        value={sideTabValue}
        index={1}
        className="lg:w-3/5 w-full min-w-fit"
      >
        <History
          transferData={transferData}
          historyTableProps={historyTableProps}
          onPageChangeHistoryTable={onPageChangeHistoryTable}
          onNumOfRowsChangeHistoryTable={onNumOfRowsChangeHistoryTable}
        />
      </TabPanel>

      <TabPanel
        value={sideTabValue}
        index={2}
        className="lg:w-3/5 w-full min-w-fit"
      >
        <Download
          downloadPrivateKey={downloadPrivateKey}
          isDownload={isDownload}
          error={downloadError}
        />
      </TabPanel>
    </div>
  );
}

export default index;
