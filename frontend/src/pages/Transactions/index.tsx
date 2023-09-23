import React, { useState, useEffect } from "react";
import TableComponent from "../../components/Table";
import * as Transaction from "../../models/Transaction";
import axios from "../../libs/axios";
import routes from "../../routes";
import env from "../../env";
import { Tabs, Tab, Paper } from "@mui/material";
import { useStore } from "../../store";
import Snackbar from "../../components/Snackbar";

function index() {
  const user = useStore((store) => store.user);
  const transactionPageTab = useStore((store) => store.transactionPageTab);
  const setTransactionPageTab = useStore(
    (store) => store.setTransactionPageTab
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<Transaction.Schema[]>([]);
  const [totalTransactions, setTotalTransaction] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [response, setResponse] = useState<{
    toDisplay: boolean;
    isSuccess: boolean;
    message: string;
  }>({ toDisplay: false, isSuccess: false, message: "" });

  const columns = [
    { columnName: "Confirmation Hash", columnKey: "hash" },
    { columnName: "Type", columnKey: "type" },
    { columnName: "Status", columnKey: "status" },
    { columnName: "From", columnKey: "from" },
    { columnName: "To", columnKey: "to" },
    { columnName: "Created At", columnKey: "createdAt" },
  ];

  async function fetchTransaction(page?: number, limit?: number) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listTransaction}?page=${page}&limit=${limit}`
      );
      const { transactions, totalTransactions } = Transaction.decode(
        response.data
      );
      setData(transactions);
      setTotalTransaction(totalTransactions);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchPersonalTransaction(page?: number, limit?: number) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listPersonalTransaction}?page=${page}&limit=${limit}`,
        user?.jwt
      );
      const { transactions, totalTransactions } = Transaction.decode(
        response.data
      );
      setData(transactions);
      setTotalTransaction(totalTransactions);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (transactionPageTab.isTransactionsTab) {
      const { isTransactionsTab, ...rest } = transactionPageTab;
      setTabValue(1);
      setResponse(rest);
      fetchPersonalTransaction(currentPage, rowsPerPage);
      setTransactionPageTab({
        isTransactionsTab: false,
        message: "",
        isSuccess: false,
        toDisplay: false,
      });
    } else fetchTransaction(currentPage, rowsPerPage);
  }, []);

  function onPageChange(newPage: number): void {
    setCurrentPage(newPage);
    if (tabValue === 0) fetchTransaction(newPage, rowsPerPage);
    else fetchPersonalTransaction(newPage, rowsPerPage);
  }

  function onNumOfRowsChange(rowsPerPage: number) {
    setRowsPerPage(rowsPerPage);
    setCurrentPage(0);
    if (tabValue === 0) fetchTransaction(0, rowsPerPage);
    else fetchPersonalTransaction(0, rowsPerPage);
  }

  function redirectToPage(row: { [key: string]: string | number }) {
    if (row.hash !== "-")
      window.open(
        `${env.VITE_AVAX_TX_EXPLORER}${row.hash}`,
        "_blank",
        "noreferrer"
      );
  }

  const handleTabChange = async (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentPage(0);
    setRowsPerPage(10);
    if (newValue === 0) fetchTransaction(0, 10);
    else fetchPersonalTransaction(0, 10);
    setTabValue(newValue);
  };

  return (
    <Paper sx={{ paddingTop: "10px" }} className="w-full min-w-fit">
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        centered
        className="mb-2"
      >
        <Tab label="All Transactions" className="flex jutify-center flex-1" />
        {user != null && (
          <Tab
            label="Personal Transactions"
            className="flex jutify-center flex-1"
          />
        )}
      </Tabs>

      <TableComponent
        rowsPerPage={rowsPerPage}
        page={currentPage}
        totalNumberOfEntry={totalTransactions}
        data={data.map((entry) => ({
          ...entry,
          status: Transaction.convertStatusToText(entry.status),
          type: Transaction.convertTypeToText(entry.type),
          hash: entry.hash || "Pending",
        }))}
        columns={columns}
        onPageChange={onPageChange}
        onClickRedirect={redirectToPage}
        onNumOfRowsChange={onNumOfRowsChange}
      />
      <Snackbar
        isOpen={response.toDisplay}
        onClose={() => setResponse((state) => ({ ...state, toDisplay: false }))}
        message={response.message}
        type={response.isSuccess ? "success" : "error"}
      />
    </Paper>
  );
}

export default index;
