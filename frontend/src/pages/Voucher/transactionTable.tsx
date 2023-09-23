import React, { useEffect } from "react";
import Table from "../../components/Table";
import * as Transaction from "../../models/Transaction";
import env from "../../env";

type TableProps = {
  data: Transaction.Schema[];
};

const columns = [
  { columnName: "Confirmation Hash", columnKey: "hash" },
  { columnName: "Type", columnKey: "type" },
  { columnName: "Status", columnKey: "status" },
  { columnName: "From", columnKey: "from" },
  { columnName: "To", columnKey: "to" },
  { columnName: "Created At", columnKey: "createdAt" },
];

function transactionTable({ data }: TableProps) {
  function redirectToPage(row: { [key: string]: string | number }) {
    if (row.hash !== "-")
      window.open(
        `${env.VITE_AVAX_TX_EXPLORER}${row.hash}`,
        "_blank",
        "noreferrer"
      );
  }

  return (
    <Table
      rowsPerPage={10}
      page={0}
      totalNumberOfEntry={data.length}
      data={data.map((entry) => ({
        ...entry,
        status: Transaction.convertStatusToText(entry.status),
        type: Transaction.convertTypeToText(entry.type),
        hash: entry.hash || "-",
      }))}
      columns={columns}
      onPageChange={() => {}}
      onClickRedirect={redirectToPage}
      onNumOfRowsChange={() => {}}
    />
  );
}

export default transactionTable;
