import React from "react";
import Table from "../../components/Table";
import { Tabs, Tab, Paper } from "@mui/material";
import TabPanel from "../../components/TabPanel";
import {
  StripeDonationsSchema,
  MetamaskDonationsSchema,
} from "../../models/Donation";
import env from "../../env";

type Props = {
  historyTabValue: number;
  handleHistoryTabChange: (
    event: React.SyntheticEvent,
    newValue: number
  ) => void;
  stripeDonationData: {
    stripeDonation: StripeDonationsSchema[];
    totalStripeDonation: number;
  };
  stripeDonationTableProps: {
    page: number;
    limit: number;
  };
  onPageChangeStripeTable: (newPage: number) => void;
  onNumOfRowsChangeStripeTable: (rowsPerPage: number) => void;
  metamaskDonationData: {
    metamaskDonation: MetamaskDonationsSchema[];
    totalMetamaskDonation: number;
  };
  metamaskDonationTableProps: {
    page: number;
    limit: number;
  };
  onPageChangeMetamaskTable: (newPage: number) => void;
  onNumOfRowsChangeMetamaskTable: (rowsPerPage: number) => void;
};

function history({
  historyTabValue,
  handleHistoryTabChange,
  stripeDonationData,
  stripeDonationTableProps,
  onPageChangeStripeTable,
  onNumOfRowsChangeStripeTable,
  metamaskDonationData,
  metamaskDonationTableProps,
  onPageChangeMetamaskTable,
  onNumOfRowsChangeMetamaskTable,
}: Props) {
  const stripeColumns = [
    { columnKey: "name", columnName: "Donated To" },
    { columnKey: "status", columnName: "Status" },
    { columnKey: "amount", columnName: "Amount ($)" },
    { columnKey: "stripeReferenceId", columnName: "Stripe Reference Id" },
    { columnKey: "createdAt", columnName: "Transacted At" },
  ];

  const metamaskColumns = [
    { columnKey: "hash", columnName: "Confirmation Hash" },
    { columnKey: "metamaskAddress", columnName: "From" },
    { columnKey: "address", columnName: "To" },
    { columnKey: "amount", columnName: "Amount (USDC)" },
    { columnKey: "createdAt", columnName: "Transacted At" },
  ];
  return (
    <div className="flex justify-center items-center md:w-5/6">
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          minHeight: "62vh",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Tabs
          value={historyTabValue}
          onChange={handleHistoryTabChange}
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab
            label="Credit Card Donation"
            className="flex jutify-center flex-1"
          />
          <Tab label="Crypto Donation" className="flex jutify-center flex-1" />
        </Tabs>

        <TabPanel index={0} value={historyTabValue} style={{ width: "100%" }}>
          <div className="mt-2 pl-2 pr-2 w-full">
            <Table
              rowsPerPage={stripeDonationTableProps.limit}
              page={stripeDonationTableProps.page}
              totalNumberOfEntry={stripeDonationData.totalStripeDonation}
              data={stripeDonationData.stripeDonation}
              columns={stripeColumns}
              onPageChange={onPageChangeStripeTable}
              onNumOfRowsChange={onNumOfRowsChangeStripeTable}
              onClickRedirect={() => {}}
            />
          </div>
        </TabPanel>

        <TabPanel index={1} value={historyTabValue} style={{ width: "100%" }}>
          <div className="mt-2 pl-2 pr-2 w-full">
            <Table
              rowsPerPage={metamaskDonationTableProps.limit}
              page={metamaskDonationTableProps.page}
              totalNumberOfEntry={metamaskDonationData.totalMetamaskDonation}
              data={metamaskDonationData.metamaskDonation}
              columns={metamaskColumns}
              onPageChange={onPageChangeMetamaskTable}
              onNumOfRowsChange={onNumOfRowsChangeMetamaskTable}
              onClickRedirect={({ hash }: { [key: string]: string | number }) =>
                window.open(
                  `${env.VITE_AVAX_TX_EXPLORER}${hash}`,
                  "_blank",
                  "noreferrer"
                )
              }
            />
          </div>
        </TabPanel>
      </Paper>
    </div>
  );
}

export default history;
