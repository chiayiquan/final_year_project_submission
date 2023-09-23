import React, { useState, useEffect } from "react";
import { SelectChangeEvent, Tabs, Tab } from "@mui/material";
import TabPanel from "../../components/TabPanel";
import { ethers } from "ethers";
import USDC from "../../assets/artifacts/contracts/USDC/USDC.json";
import axios from "../../libs/axios";
import routes from "../../routes";
import { useStore } from "../../store";
import * as JD from "decoders";
import * as Country from "../../models/Country";
import * as Stripe from "../../models/Stripe";
import Donation from "./donation";
import DonationModel, {
  StripeDonationsSchema,
  MetamaskDonationsSchema,
  SubscriptionSchema,
} from "../../models/Donation";
import History from "./history";
import Snackbar from "../../components/Snackbar";
import Subscription from "./subscription";
import Conversion from "../../libs/conversion";
import env from "../../env";

function index() {
  const { ethereum } = window;
  const user = useStore((state) => state.user);
  const setHistoryPageTab = useStore((store) => store.setHistoryPageTab);
  const isHistoryPageTab = useStore((store) => store.isHistoryPageTab);

  const [activeStep, setActiveStep] = useState(0);
  const [countries, setCountries] = useState<{
    [key: string]: {
      address: string;
      countryName: string;
    };
  }>({
    NA: {
      address: "NA",
      countryName: "Please Select A Country",
    },
  });

  const [donationPrices, setDonationPrices] = useState<
    { id: string; paymentOccurrence: string; amount: number }[]
  >([]);

  const [selectedCountries, setSelectedCountries] = useState<string>("NA");
  const [paymentTabValue, setPaymentTabValue] = useState(0);
  const [recurrenceTabValue, setRecurrenceTabValue] = useState(0);
  const [selectedDonationValue, setSelectedDonationValue] = useState<
    string | null
  >(null);
  const [metamaskAmount, setMetamaskAmount] = useState(0);
  const [haveMetamask, sethaveMetamask] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [sideTabValue, setSideTabValue] = useState(0);
  const [stripeDonationTableProps, setStripeDonationTableProps] = useState<{
    page: number;
    limit: number;
  }>({ page: 0, limit: 10 });
  const [historyTabValue, setHistoryTabValue] = useState(0);
  const [metamaskDonationTableProps, setMetamaskDonationTableProps] = useState<{
    page: number;
    limit: number;
  }>({ page: 0, limit: 10 });
  const [stripeDonationData, setStripeDonationData] = useState<{
    stripeDonation: StripeDonationsSchema[];
    totalStripeDonation: number;
  }>({ stripeDonation: [], totalStripeDonation: 0 });
  const [metamaskDonationData, setMetamaskDonationData] = useState<{
    metamaskDonation: MetamaskDonationsSchema[];
    totalMetamaskDonation: number;
  }>({ metamaskDonation: [], totalMetamaskDonation: 0 });
  const [isDonationSuccess, setIsDonationSuccess] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSchema[]>([]);
  const [cancellationProps, setCancellationProps] = useState<{
    isSuccess: boolean;
    message: string;
    isOpen: boolean;
  }>({ isSuccess: false, message: "", isOpen: false });
  const [metamaskDonationResult, setMetamaskDonationResult] = useState<{
    toDisplay: boolean;
    isSuccess: boolean;
    message: string;
    hash: string | null;
  }>({ toDisplay: false, isSuccess: false, message: "", hash: null });

  const handleCountryChange = async (event: SelectChangeEvent) => {
    const selectedCountry = event.target.value;
    setSelectedCountries(selectedCountry);
    if (selectedCountry !== "NA") {
      const response = await axios.get(
        `${routes.apiRoutes.listStripePrices}/${selectedCountry}`
      );
      const donationPrices = Stripe.decodeListStripeProductPrices(
        response.data
      );
      setActiveStep(1);
      setDonationPrices(
        donationPrices.prices.sort((a, b) =>
          a.amount < b.amount && a.amount !== 0 ? -1 : 1
        )
      );
    }
  };

  const handleAccordionChange = (step: number) => {
    setActiveStep(step);
  };

  const handlePaymentTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setPaymentTabValue(newValue);
  };

  const handleRecurrenceTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setRecurrenceTabValue(newValue);
  };

  const handleDonationChange = async (
    _event: React.MouseEvent<HTMLElement>,
    newId: string
  ) => {
    newId != null && setSelectedDonationValue(newId);
  };

  async function fetchCountryData() {
    try {
      const response = await axios.get(routes.apiRoutes.supportedCountries);

      const data = Country.decodeList(response.data);
      data.countries.forEach(({ countryCode, address, countryName }) => {
        if (address != null)
          setCountries((state) => ({
            ...state,
            [countryCode]: { address, countryName },
          }));
      });
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    if (isHistoryPageTab) {
      setIsDonationSuccess(true);
      setHistoryPageTab(false);
      getStripeDonation(
        stripeDonationTableProps.page,
        stripeDonationTableProps.limit
      );
      setSideTabValue(1);
    } else fetchCountryData();

    async function checkMetamaskAvailability() {
      if (!ethereum) {
        sethaveMetamask(false);
      }
      sethaveMetamask(true);
    }
    checkMetamaskAvailability();
  }, []);

  async function connectWallet() {
    try {
      if (!ethereum) {
        sethaveMetamask(false);
      }
      await ethereum.request({
        method: "eth_requestAccounts",
      });
      setIsConnected(true);
      const provider = new ethers.BrowserProvider(ethereum);

      setProvider(provider);
    } catch (error) {
      setIsConnected(false);
    }
  }

  async function fetchStripeSubscription() {
    try {
      const response = await axios.get(
        routes.apiRoutes.listSubscription,
        user?.jwt
      );
      const { subscriptions } = DonationModel.decodeSubscription(response.data);
      setSubscriptions(subscriptions);
    } catch (error) {
      console.log(error);
    }
  }

  async function cancelSubscription(id: string) {
    try {
      const response = await axios.post(
        routes.apiRoutes.cancelSubscription,
        { subscriptionId: id },
        user?.jwt
      );
      fetchStripeSubscription();
      const { message } = axios.decodeMessageSuccess(response);
      setCancellationProps({ isSuccess: true, message, isOpen: true });
    } catch (error) {
      console.log(error);
    }
  }

  async function donateThroughCrypto() {
    try {
      setIsDonating(true);
      if (provider == null) return;
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        env.VITE_USDC_ADDRESS,
        USDC,
        signer
      );
      // usdc is 6 decimal
      const uintMetamaskAmount = Conversion.convertToUAvax(metamaskAmount);
      await usdcContract.approve(
        countries[selectedCountries].address,
        uintMetamaskAmount
      );
      const tx = await usdcContract.transfer(
        countries[selectedCountries].address,
        uintMetamaskAmount
      );
      await tx.wait();
      if (tx.hash != null) {
        await axios.post(
          routes.apiRoutes.insertMetamaskDonation,
          {
            amount: uintMetamaskAmount,
            contractAddress: countries[selectedCountries].address,
            hash: tx.hash,
            metamaskAddress: tx.from,
          },
          user?.jwt
        );
      }
      setIsDonating(false);
      setIsDonationSuccess(true);
      setMetamaskDonationResult({
        toDisplay: true,
        isSuccess: true,
        message: `Donation has been successfully transferred to ${tx.from}.`,
        hash: tx.hash,
      });
    } catch (error: any) {
      setMetamaskDonationResult({
        toDisplay: true,
        isSuccess: false,
        message: error.reason || error.message || error,
        hash: null,
      });
      setIsDonating(false);
    }
  }

  async function donateWithCreditCard() {
    if (selectedDonationValue == null || user == null) return;
    try {
      setIsDonating(true);
      const response = await axios.post(
        routes.apiRoutes.generateCheckout,
        {
          priceId: selectedDonationValue,
        },
        user.jwt
      );
      const { url } = JD.object({ url: JD.string }).verify(response.data);
      window.location.replace(url);
    } catch (error) {
      setIsDonating(false);
    }
  }

  const handleSideTabChange = async (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    if (newValue === 0) fetchCountryData();
    else if (newValue === 1)
      getStripeDonation(
        stripeDonationTableProps.page,
        stripeDonationTableProps.limit
      );
    else if (newValue === 2) fetchStripeSubscription();
    setSideTabValue(newValue);
  };

  async function getStripeDonation(page: number, limit: number) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listStripeDonation}?page=${page}&limit=${limit}`,
        user?.jwt
      );
      setStripeDonationData(DonationModel.decodeStripeDonations(response.data));
    } catch (error) {
      console.log(error);
    }
  }

  async function getMetamaskDonation(page: number, limit: number) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listMetamaskDonation}?page=${page}&limit=${limit}`,
        user?.jwt
      );
      setMetamaskDonationData(
        DonationModel.decodeMetamaskDonation(response.data)
      );
    } catch (error) {
      console.log(error);
    }
  }

  const handleHistoryTabChange = async (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    if (newValue === 0)
      getStripeDonation(
        stripeDonationTableProps.page,
        stripeDonationTableProps.limit
      );
    else
      getMetamaskDonation(
        metamaskDonationTableProps.page,
        metamaskDonationTableProps.limit
      );
    setHistoryTabValue(newValue);
  };

  function onPageChangeStripeTable(newPage: number): void {
    setStripeDonationTableProps((state) => ({ ...state, page: newPage }));

    getStripeDonation(newPage, stripeDonationTableProps.limit);
  }

  function onNumOfRowsChangeStripeTable(rowsPerPage: number) {
    setStripeDonationTableProps((state) => ({
      ...state,
      limit: rowsPerPage,
      page: 0,
    }));
    getStripeDonation(0, rowsPerPage);
  }

  function onPageChangeMetamaskTable(newPage: number): void {
    setMetamaskDonationTableProps((state) => ({ ...state, page: newPage }));

    getMetamaskDonation(newPage, stripeDonationTableProps.limit);
  }

  function onNumOfRowsChangeMetamaskTable(rowsPerPage: number) {
    setMetamaskDonationTableProps((state) => ({
      ...state,
      limit: rowsPerPage,
      page: 0,
    }));
    getMetamaskDonation(0, rowsPerPage);
  }

  return (
    <div className="flex lg:justify-center flex-wrap w-full min-w-fit">
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
        <Tab label="Donation" className="flex jutify-center flex-1" />
        <Tab label="History" className="flex jutify-center flex-1" />
        <Tab label="Subscription" className="flex jutify-center flex-1" />
      </Tabs>

      <TabPanel
        value={sideTabValue}
        index={0}
        className="lg:w-4/5 w-full min-w-fit"
      >
        <Donation
          activeStep={activeStep}
          handleAccordionChange={handleAccordionChange}
          selectedCountries={selectedCountries}
          countries={countries}
          handleCountryChange={handleCountryChange}
          paymentTabValue={paymentTabValue}
          handlePaymentTabValue={handlePaymentTabChange}
          recurrenceTabValue={recurrenceTabValue}
          handleRecurrenceTabChange={handleRecurrenceTabChange}
          selectedDonationValue={selectedDonationValue}
          donationPrices={donationPrices}
          isDonating={isDonating}
          donateWithCreditCard={donateWithCreditCard}
          metamaskAmount={metamaskAmount}
          setMetamaskAmount={setMetamaskAmount}
          connectWallet={connectWallet}
          isConnected={isConnected}
          donateThroughCrypto={donateThroughCrypto}
          handleDonationChange={handleDonationChange}
          metamaskDonationResult={metamaskDonationResult}
        />
      </TabPanel>

      <TabPanel
        value={sideTabValue}
        index={1}
        className="lg:w-4/5 w-full min-w-fit"
      >
        <History
          historyTabValue={historyTabValue}
          handleHistoryTabChange={handleHistoryTabChange}
          stripeDonationData={stripeDonationData}
          stripeDonationTableProps={stripeDonationTableProps}
          onPageChangeStripeTable={onPageChangeStripeTable}
          onNumOfRowsChangeStripeTable={onNumOfRowsChangeStripeTable}
          metamaskDonationData={metamaskDonationData}
          metamaskDonationTableProps={metamaskDonationTableProps}
          onPageChangeMetamaskTable={onPageChangeMetamaskTable}
          onNumOfRowsChangeMetamaskTable={onNumOfRowsChangeMetamaskTable}
        />
      </TabPanel>

      <TabPanel
        value={sideTabValue}
        index={2}
        className="lg:w-4/5 w-full min-w-fit"
      >
        <Subscription
          subscriptions={subscriptions}
          cancelSubscription={cancelSubscription}
        />
      </TabPanel>

      <Snackbar
        isOpen={isDonationSuccess}
        onClose={() => setIsDonationSuccess(false)}
        message="Donation have been successfully processed."
        type="success"
      />
      <Snackbar
        isOpen={cancellationProps.isOpen}
        onClose={() =>
          setCancellationProps((state) => ({ ...state, isOpen: false }))
        }
        message={cancellationProps.message}
        type={cancellationProps.isSuccess ? "success" : "error"}
      />
    </div>
  );
}

export default index;
