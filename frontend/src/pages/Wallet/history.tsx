import React from "react";
import Table from "../../components/Table";
import * as WalletModel from "../../models/Wallet";

type Props = {
  transferData: { transfers: WalletModel.Schema[]; totalTransfers: number };

  historyTableProps: {
    page: number;
    limit: number;
  };
  onPageChangeHistoryTable: (newPage: number) => void;
  onNumOfRowsChangeHistoryTable: (rowsPerPage: number) => void;
};

function history({
  transferData,
  historyTableProps,
  onPageChangeHistoryTable,
  onNumOfRowsChangeHistoryTable,
}: Props) {
  const columns = [
    { columnName: "Created At", columnKey: "createdAt" },
    { columnName: "Transaction Type", columnKey: "transferType" },
    { columnName: "From", columnKey: "from" },
    { columnName: "To", columnKey: "to" },
    { columnName: "Amount", columnKey: "value" },
  ];

  return (
    <div className="mt-2 pl-2 pr-2 w-full">
      <Table
        rowsPerPage={historyTableProps.limit}
        page={historyTableProps.page}
        totalNumberOfEntry={transferData.totalTransfers}
        data={transferData.transfers}
        columns={columns}
        onPageChange={onPageChangeHistoryTable}
        onNumOfRowsChange={onNumOfRowsChangeHistoryTable}
        onClickRedirect={() => {}}
      />
    </div>
  );
}

export default history;
