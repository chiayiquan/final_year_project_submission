import React, { useState, useEffect } from "react";
import { Button, Typography } from "@mui/material";
import * as Country from "../../models/Country";
import axios from "../../libs/axios";
import routes from "../../routes";
import CountryCard from "./countryCard";
import DetailModal from "./detailModal";
import { useStore } from "../../store";
import Snackbar from "../../components/Snackbar";
import CreateModal from "./createModal";

function index() {
  const user = useStore((state) => state.user);
  const [countries, setCountries] = useState<{ [key: string]: string }>({});
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedCountryDetail, setSelectedCountryDetail] =
    useState<Country.Detail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [snackbarProps, setSnackbarProps] = useState<{
    isOpen: boolean;
    message: string;
    isSuccess: boolean;
  }>({ isOpen: false, message: "", isSuccess: false });
  const [unsupportedCountry, setUnsupportedCountry] = useState<
    Country.CountrySchema[]
  >([]);
  const [createCountryResult, setCreateCountryResult] = useState<{
    isToDisplay: boolean;
    isSuccess: boolean;
    message: string;
  }>({ isToDisplay: false, isSuccess: false, message: "" });
  const [createCountryLoading, setCreateCountryLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    fetchCountryData();
  }, []);

  async function fetchCountryData() {
    try {
      const response = await axios.get(routes.apiRoutes.supportedCountries);

      const data = Country.decodeList(response.data);
      data.countries.forEach(({ countryCode, countryName }) => {
        setCountries((state) => ({
          ...state,
          [countryCode]: countryName,
        }));
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCountryClick(countryCode: string) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.countryDetail}/${countryCode}`
      );
      const { detail } = Country.decodeDetail(response.data);
      setSelectedCountryName(countries[countryCode]);
      setSelectedCountryCode(countryCode);
      setSelectedCountryDetail(detail);
      setIsDetailModalOpen(true);
    } catch (error) {
      setIsDeploying(true);
    }
  }

  async function updateContract({
    fees,
    voucherPrice,
    countryCode,
  }: {
    fees: number;
    voucherPrice: number;
    countryCode: string;
  }) {
    try {
      const response = await axios.post(
        routes.apiRoutes.updateCountry,
        { fees, voucherPrice, countryCode },
        user?.jwt
      );
      const { message } = axios.decodeMessageSuccess(response);
      setSnackbarProps({ isOpen: true, message, isSuccess: true });
    } catch (error) {
      const { message } = axios.decodeError(error);
      setSnackbarProps({ isOpen: true, message, isSuccess: false });
    }
  }

  async function fetchUnsupportedCountries() {
    try {
      const response = await axios.get(
        routes.apiRoutes.listUnsupportedCountries
      );
      const { countries } = Country.decodeCountries(response.data);
      setUnsupportedCountry(countries);
    } catch (error) {}
  }

  async function openCreateModal() {
    fetchUnsupportedCountries();
    setIsCreateModalOpen(true);
  }

  async function createCountry({
    selectedCountry,
    planName,
    description,
    fees,
    pricePerVoucher,
  }: {
    selectedCountry: string;
    planName: string;
    description: string;
    fees: number;
    pricePerVoucher: number;
  }) {
    try {
      setCreateCountryLoading(true);
      const response = await axios.post(
        routes.apiRoutes.createCountry,
        {
          countryCode: selectedCountry,
          name: planName,
          description,
          pricePerVoucher,
          fees,
        },
        user?.jwt
      );
      const { message } = axios.decodeMessageSuccess(response);
      setCreateCountryResult({ isToDisplay: true, isSuccess: true, message });
      setCreateCountryLoading(false);
      return fetchCountryData();
    } catch (error) {
      const { message } = axios.decodeError(error);
      setCreateCountryLoading(false);
      setCreateCountryResult({ isToDisplay: true, isSuccess: false, message });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <Typography variant="h5" sx={{ marginBottom: "10px" }}>
          Supported Countries
        </Typography>

        {user?.role === "ADMIN" && (
          <Button onClick={() => openCreateModal()}>Deploy New Country</Button>
        )}
      </div>
      <div className="flex flex-wrap">
        {Object.keys(countries).length > 0 ? (
          Object.keys(countries).map((countryCode) => (
            <CountryCard
              countryCode={countryCode}
              countryName={countries[countryCode]}
              onClick={handleCountryClick}
              key={countryCode}
            />
          ))
        ) : (
          <div
            className="flex justify-center items-center w-full h-full"
            style={{ minHeight: "30vh" }}
          >
            <Typography variant="subtitle2">
              No Supported Country Found
            </Typography>
          </div>
        )}
      </div>
      {isDetailModalOpen && selectedCountryDetail != null && (
        <DetailModal
          detail={selectedCountryDetail}
          modalOpen={isDetailModalOpen}
          setModalState={() => setIsDetailModalOpen((state) => !state)}
          selectedCountryName={selectedCountryName}
          selectedCountryCode={selectedCountryCode}
          updateCountry={updateContract}
          isAdmin={user?.role === "ADMIN"}
        />
      )}
      <CreateModal
        countries={unsupportedCountry}
        isModalOpen={isCreateModalOpen}
        setModalState={() => setIsCreateModalOpen(false)}
        createCountry={createCountry}
        result={createCountryResult}
        createCountryLoading={createCountryLoading}
      />
      <Snackbar
        isOpen={snackbarProps.isOpen}
        onClose={() =>
          setSnackbarProps((state) => ({ ...state, isOpen: false }))
        }
        message={snackbarProps.message}
        type={snackbarProps.isSuccess ? "success" : "error"}
      />
      <Snackbar
        isOpen={isDeploying}
        onClose={() => setIsDeploying(false)}
        message="Contract is deploying, please try again later."
        type="info"
      />
    </div>
  );
}

export default index;
