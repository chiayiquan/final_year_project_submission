import React from "react";
import {
  Paper,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  TextField,
  LinearProgress,
  SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MetaMaskIcon from "../../components/CustomIcons/Metamask";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import TabPanel from "../../components/TabPanel";
import env from "../../env";

type Props = {
  activeStep: number;
  handleAccordionChange: (step: number) => void;
  selectedCountries: string;
  countries: {
    [key: string]: {
      address: string;
      countryName: string;
    };
  };
  handleCountryChange: (event: SelectChangeEvent) => Promise<void>;
  paymentTabValue: number;
  handlePaymentTabValue: (
    event: React.SyntheticEvent,
    newValue: number
  ) => void;
  recurrenceTabValue: number;
  handleRecurrenceTabChange: (
    event: React.SyntheticEvent,
    newValue: number
  ) => void;
  selectedDonationValue: string | null;
  handleDonationChange: (
    _event: React.MouseEvent<HTMLElement>,
    newId: string
  ) => Promise<void>;
  donationPrices: { id: string; paymentOccurrence: string; amount: number }[];
  isDonating: boolean;
  donateWithCreditCard: () => Promise<void>;
  metamaskAmount: number;
  setMetamaskAmount: React.Dispatch<React.SetStateAction<number>>;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  donateThroughCrypto: () => Promise<void>;
  metamaskDonationResult: {
    toDisplay: boolean;
    isSuccess: boolean;
    message: string;
    hash: string | null;
  };
};
function donation({
  activeStep,
  handleAccordionChange,
  selectedCountries,
  countries,
  handleCountryChange,
  paymentTabValue,
  handlePaymentTabValue,
  recurrenceTabValue,
  handleRecurrenceTabChange,
  selectedDonationValue,
  handleDonationChange,
  donationPrices,
  isDonating,
  donateWithCreditCard,
  metamaskAmount,
  setMetamaskAmount,
  connectWallet,
  isConnected,
  donateThroughCrypto,
  metamaskDonationResult,
}: Props) {
  const DonateButton = () => (
    <>
      <Button
        variant="contained"
        onClick={() => donateWithCreditCard()}
        fullWidth
        sx={{ marginTop: "30px", padding: 2 }}
        disabled={isDonating}
      >
        Donate
      </Button>
      {isDonating && <LinearProgress />}
    </>
  );

  return (
    <div className="flex justify-center items-center w-5/6">
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          minHeight: "66vh",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <Typography variant="h3">Donate</Typography>

        <Divider flexItem={true} sx={{ margin: "20px 0px" }} />

        <div className="mb-3">
          <Stepper activeStep={activeStep}>
            <Step key={0}>
              <StepLabel>Choose A Donation Destination</StepLabel>
            </Step>
            <Step key={1}>
              <StepLabel>Choose A Payment Method</StepLabel>
            </Step>
          </Stepper>
        </div>
        <div className="flex flex-col justify-center items-center w-full pl-3 pr-3">
          <Accordion
            expanded={activeStep === 0}
            onChange={() => handleAccordionChange(0)}
            sx={{ width: "100%", margin: "0px,10px" }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>
                {selectedCountries !== "NA"
                  ? countries[selectedCountries].countryName
                  : "Donation Destination"}
              </Typography>
            </AccordionSummary>
            <Divider />
            <AccordionDetails>
              <Select
                value={selectedCountries}
                onChange={handleCountryChange}
                sx={{ width: "100%" }}
              >
                {Object.keys(countries).map((key) => {
                  return (
                    <MenuItem value={key} key={key}>
                      {countries[key].countryName}
                    </MenuItem>
                  );
                })}
              </Select>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={activeStep === 1}
            onChange={() => handleAccordionChange(1)}
            disabled={selectedCountries === "NA"}
            sx={{ width: "100%", margin: "0px,10px" }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>Payment Methods</Typography>
            </AccordionSummary>
            <Divider />
            <AccordionDetails>
              <Tabs
                value={paymentTabValue}
                onChange={handlePaymentTabValue}
                textColor="secondary"
                indicatorColor="secondary"
                centered
              >
                <Tab
                  label="Credit Card"
                  icon={<CreditCardIcon />}
                  iconPosition="end"
                  className="flex jutify-center flex-1"
                />
                <Tab
                  label="MetaMask"
                  icon={<MetaMaskIcon />}
                  iconPosition="end"
                  className="flex jutify-center flex-1"
                />
              </Tabs>

              <TabPanel
                value={paymentTabValue}
                index={0}
                style={{ height: "100%", minHeight: "20vh" }}
              >
                <div className="flex flex-1 flex-wrap">
                  <Tabs
                    value={recurrenceTabValue}
                    onChange={handleRecurrenceTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    orientation="vertical"
                    className="lg:w-1/6 w-full"
                    sx={{
                      borderRight: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Tab
                      label="One Time Donation"
                      className="flex jutify-center flex-1"
                    />
                    <Tab
                      label="Monthly Donation"
                      className="flex jutify-center flex-1"
                    />
                  </Tabs>
                  <TabPanel
                    value={recurrenceTabValue}
                    index={0}
                    className="lg:w-4/5 w-full min-w-min"
                  >
                    <ToggleButtonGroup
                      value={selectedDonationValue}
                      exclusive
                      onChange={handleDonationChange}
                      sx={{
                        display: "flex",
                        gap: 5,
                        flexWrap: "wrap",
                      }}
                    >
                      {donationPrices.map(
                        (donation) =>
                          donation.paymentOccurrence === "ONE_TIME" && (
                            <ToggleButton
                              key={donation.id}
                              value={donation.id}
                              sx={{
                                fontSize: "18px",
                                height: "50px",
                                px: "20px",
                                outline: "solid",
                                outlineColor: "black",
                                outlineWidth: "1px",
                              }} // Increase font size and adjust button size
                            >
                              {donation.amount === 0
                                ? "Custom Amount"
                                : `\$${donation.amount / 100}`}
                            </ToggleButton>
                          )
                      )}
                    </ToggleButtonGroup>
                    <DonateButton />
                  </TabPanel>
                  <TabPanel
                    value={recurrenceTabValue}
                    index={1}
                    className="lg:w-4/5 w-full min-w-min"
                  >
                    <ToggleButtonGroup
                      value={selectedDonationValue}
                      exclusive
                      onChange={handleDonationChange}
                      sx={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                    >
                      {donationPrices.map(
                        (donation) =>
                          donation.paymentOccurrence === "MONTHLY" && (
                            <ToggleButton
                              key={donation.id}
                              value={donation.id}
                              sx={{
                                fontSize: "18px",
                                height: "50px",
                                px: "20px",
                                outline: "solid",
                                outlineColor: "black",
                                outlineWidth: "1px",
                              }} // Increase font size and adjust button size
                            >
                              {donation.amount === 0
                                ? "Custom Amount"
                                : `\$${donation.amount / 100}`}
                            </ToggleButton>
                          )
                      )}
                    </ToggleButtonGroup>
                    <DonateButton />
                  </TabPanel>
                </div>
              </TabPanel>

              <TabPanel
                value={paymentTabValue}
                index={1}
                style={{
                  height: "100%",
                  minHeight: "20vh",
                }}
              >
                <div className="flex flex-col">
                  <span>
                    Contract Address:{" "}
                    <b>{countries[selectedCountries].address}</b>
                  </span>
                  <TextField
                    label="Donation Amount"
                    type="number"
                    variant="outlined"
                    value={metamaskAmount}
                    fullWidth={true}
                    sx={{ marginTop: "20px" }}
                    disabled={!isConnected}
                    onChange={(event) =>
                      parseFloat(event.target.value) < 0
                        ? 0
                        : setMetamaskAmount(parseFloat(event.target.value))
                    }
                  />

                  {metamaskDonationResult.toDisplay && (
                    <>
                      <Typography
                        className={`${
                          metamaskDonationResult.isSuccess
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                        sx={{ marginTop: "20px" }}
                      >
                        {metamaskDonationResult.message}
                        <br />
                        {metamaskDonationResult.hash && (
                          <a
                            href={`${env.VITE_AVAX_TX_EXPLORER}${metamaskDonationResult.hash}`}
                            target="_blank"
                          >
                            Confirmation Hash:{metamaskDonationResult.hash}
                          </a>
                        )}
                      </Typography>
                    </>
                  )}

                  {isConnected ? (
                    <>
                      <Button
                        variant="contained"
                        onClick={donateThroughCrypto}
                        fullWidth
                        sx={{ marginTop: "30px", padding: 2 }}
                        disabled={isDonating}
                      >
                        Donate
                      </Button>
                      {isDonating && <LinearProgress />}
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={connectWallet}
                      fullWidth
                      sx={{ marginTop: "30px", padding: 2 }}
                    >
                      Connect To Metamask
                    </Button>
                  )}
                </div>
              </TabPanel>
            </AccordionDetails>
          </Accordion>
        </div>
      </Paper>
    </div>
  );
}

export default donation;
