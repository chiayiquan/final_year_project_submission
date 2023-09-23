import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@mui/material";
import routes from "../../routes";
import { useStore } from "../../store";
import axios from "../../libs/axios";
import * as Voucher from "../../models/Voucher";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import QRCode from "react-qr-code";
import TransactionTable from "./transactionTable";
import Snackbar from "../../components/Snackbar";

function index() {
  const navigate = useNavigate();
  const user = useStore((store) => store.user);
  if (user?.role !== "BENEFICIARY") return navigate("/");
  const [vouchers, setVouchers] = useState<Voucher.Overview[]>([]);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherDetail, setVoucherDetail] = useState<Voucher.Detail | null>(
    null
  );
  const columns: { columnName: string; columnKey: string }[] = [
    { columnName: "id", columnKey: "id" },
    { columnName: "status", columnKey: "status" },
    { columnName: "Created At", columnKey: "createdAt" },
  ];
  const [hasError, setHasError] = useState<{
    hasError: boolean;
    message: string;
  }>({ hasError: false, message: "" });

  async function generateVoucher() {
    try {
      if (user == null) return;
      await axios.post(routes.apiRoutes.generateVoucher, {}, user.jwt);
      await fetchVouchers(page, rowsPerPage);
    } catch (error: any) {
      const { message } = axios.decodeError(error);
      setHasError({ hasError: true, message });
    }
  }

  async function fetchVouchers(page: number, rowsPerPage: number) {
    if (user == null) return;
    const response = await axios.get(
      `${routes.apiRoutes.listVoucher}?page=${page}&limit=${rowsPerPage}`,
      user.jwt
    );

    const decodedData = Voucher.decodeListApiBody(response.data);
    setVouchers(decodedData.vouchers);
    setTotalVouchers(decodedData.totalVouchers);
  }

  async function onPageChange(newPage: number) {
    setPage(newPage);
    return fetchVouchers(newPage, rowsPerPage);
  }

  async function onNumOfRowsChange(numOfRows: number) {
    setRowsPerPage(numOfRows);
    return fetchVouchers(page, numOfRows);
  }

  function setModalOpen() {
    setIsModalOpen((state) => !state);
  }

  async function onClickRedirect({ id }: { id: string }) {
    try {
      if (user == null) return;
      const response = await axios.get(
        `${routes.apiRoutes.viewVoucher}/${id}`,
        user.jwt
      );
      setVoucherDetail(Voucher.decodeDetailApiBody(response.data));
      setModalOpen();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchVouchers(page, rowsPerPage);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-end w-full mb-2">
        <Button
          variant="contained"
          color="success"
          onClick={() => generateVoucher()}
          sx={{ padding: 2 }}
        >
          Generate Weekly Voucher
        </Button>
      </div>
      <Table
        rowsPerPage={rowsPerPage}
        page={page}
        totalNumberOfEntry={totalVouchers}
        data={vouchers}
        columns={columns}
        onPageChange={onPageChange}
        onClickRedirect={onClickRedirect}
        onNumOfRowsChange={onNumOfRowsChange}
      />

      <Modal isModalOpen={isModalOpen} setModalState={setModalOpen}>
        {voucherDetail && (
          <div className="flex flex-col">
            <div className="flex justify-between flex-wrap">
              <div className="flex flex-col">
                <Typography variant="h5">Voucher Detail</Typography>
                <Typography variant="subtitle1">
                  ID: {voucherDetail.voucherDetail.id}
                </Typography>
                <Typography variant="subtitle1">
                  Status:{" "}
                  <span
                    style={{
                      backgroundColor:
                        voucherDetail.voucherDetail.status === "VALID"
                          ? "#089000"
                          : "#8B0000",
                      color: "white",
                      padding: "5px",
                      borderRadius: "25px",
                    }}
                  >
                    {voucherDetail.voucherDetail.status}
                  </span>
                </Typography>
                <Typography variant="subtitle1">
                  Contract Address:{" "}
                  {voucherDetail.voucherDetail.contractAddress}
                </Typography>
                <Typography variant="subtitle1">
                  Voucher ID: {voucherDetail.voucherDetail.voucherId}
                </Typography>
                <Typography variant="subtitle1">
                  Owner: {voucherDetail.voucherDetail.owner}
                </Typography>
                <Typography variant="subtitle1">
                  Value: ${voucherDetail.voucherDetail.value}
                </Typography>
                <Typography variant="subtitle1">
                  Created At: {voucherDetail.voucherDetail.createdAt}
                </Typography>
              </div>
              <div className="flex flex-col flex-wrap">
                <QRCode
                  size={256}
                  className=""
                  value={voucherDetail.url}
                  viewBox={`0 0 256 256`}
                />
                <a href={voucherDetail.url}>URL to redeem</a>
              </div>
            </div>
            <div className="flex flex-col">
              <Typography variant="h5">Transactions</Typography>
              <TransactionTable data={voucherDetail.transactions} />
            </div>
          </div>
        )}
      </Modal>

      <Snackbar
        isOpen={hasError.hasError}
        onClose={() => setHasError((state) => ({ ...state, hasError: false }))}
        message={hasError.message}
        type="error"
      />
    </div>
  );
}

export default index;
