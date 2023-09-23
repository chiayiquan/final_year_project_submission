import React, { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  Tabs,
  Tab,
  AlertColor,
} from "@mui/material";
import Modal from "../../components/Modal";
import { useStore } from "../../store";
import PersonalInfoForm from "./personalInfoForm";
import axios from "../../libs/axios";
import routes from "../../routes";
import * as Country from "../../models/Country";
import BeneficiaryInfoForm from "./beneficiaryInfoForm";
import MerchantForm from "./merchantForm";
import OrganizationForm from "./organizationInfoForm";
import { useNavigate } from "react-router-dom";
import Application, {
  ApplicationOverview,
  ApplicationDetail,
  Member,
} from "../../models/Application";
import Table from "../../components/Table";
import Detail from "./detail";
import Snackbar from "../../components/Snackbar";

function index() {
  type ApplicationOption = "BENEFICIARY" | "MERCHANT" | "ORGANIZATION";
  const user = useStore((store) => store.user);
  const navigate = useNavigate();

  if (user == null) return navigate(routes.routes.login);
  const applicationOption = ["Beneficiary", "Merchant", "Organization"];
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedApplicationOption, setSelectedApplicationOption] =
    useState<ApplicationOption>("BENEFICIARY");
  const [personalInformation, setPersonalInformation] = useState<{
    name: string;
    address: string;
    file: File | null;
  }>({
    name: (user && user.name) || "",
    address: "",
    file: null,
  });
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<{
    appliedCountry: string;
    incomeFile: File | null;
  }>({
    appliedCountry: "",
    incomeFile: null,
  });
  const [merchantInfo, setMerchantInfo] = useState<{
    appliedCountry: string;
    licenseFile: File | null;
    name: string;
    addresses: string[];
  }>({
    appliedCountry: "",
    licenseFile: null,
    name: "",
    addresses: [""],
  });
  const [organizationInfo, setOrganizationInfo] = useState<{
    appliedCountry: string;
    certificateFile: File | null;
    name: string;
    addresses: string[];
    members: string[];
  }>({
    appliedCountry: "",
    certificateFile: null,
    name: "",
    addresses: [""],
    members: [user.email],
  });
  const [countries, setCountries] = useState<{
    [key: string]: {
      countryName: string;
    };
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitSucceed, setIsSubmitSucceed] = useState(false);
  const [applications, setApplications] = useState<{
    applications: ApplicationOverview[];
    totalApplications: number;
  }>({ applications: [], totalApplications: 0 });
  const [tabValue, setTabValue] = useState(0);
  const [tableAttribute, setTableAttribute] = useState<{
    page: number;
    limit: number;
    countryCode?: string;
    filterType?: string;
  }>({
    page: 0,
    limit: 10,
    countryCode: undefined,
    filterType: undefined,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [applicationDetail, setApplicationDetail] =
    useState<ApplicationDetail | null>(null);
  const [membersToDisplay, setMembersToDisplay] = useState<Member[]>([]);
  const [snackBarState, setSnackBarState] = useState<{
    isOpen: boolean;
    message: string;
    type: AlertColor;
  }>({ isOpen: false, message: "", type: "success" });

  const tableColumns = [
    { columnKey: "id", columnName: "ID" },
    { columnKey: "status", columnName: "Application Status" },
    { columnKey: "type", columnName: "Application Type" },
    { columnKey: "createdAt", columnName: "Created At" },
    { columnKey: "appliedCountry", columnName: "Country Applied" },
  ];

  async function fetchPersonalApplications(page?: number, limit?: number) {
    if (user == null) return;
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listPersonalApplication}?page=${page}&limit=${limit}`,
        user.jwt
      );

      const data = Application.decodeOverview(response.data);
      setApplications(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchSubmittedApplications(
    page?: number,
    limit?: number,
    countryCode?: string,
    filterType?: string
  ) {
    if (user == null) return;
    try {
      const response = await axios.get(
        `${routes.apiRoutes.listApplication}?page=${page}&limit=${limit}&countryCode=${countryCode}&filterType=${filterType}`,
        user.jwt
      );

      const data = Application.decodeOverview(response.data);
      setApplications(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await axios.get(routes.apiRoutes.supportedCountries);

        const data = Country.decodeList(response.data);
        data.countries.forEach(({ countryCode, address, countryName }) => {
          if (address != null)
            setCountries((state) => ({
              ...state,
              [countryCode]: { countryName },
            }));
        });
      } catch (error) {
        console.log(error);
      }
    };
    fetchCountryData();
    fetchPersonalApplications();
  }, []);

  function handleApplicationTypeChange(event: SelectChangeEvent) {
    switch (event.target.value) {
      case "MERCHANT":
        return setSelectedApplicationOption("MERCHANT");
      case "ORGANIZATION":
        return setSelectedApplicationOption("ORGANIZATION");
      default:
        return setSelectedApplicationOption("BENEFICIARY");
    }
  }

  async function onSubmitApplication() {
    setError(null);
    setIsSubmitSucceed(false);
    if (personalInformation.address.trim().length === 0)
      return setError("Personal address cannot be empty.");
    if (personalInformation.name.trim().length === 0)
      return setError("Personal name cannot be empty");
    if (personalInformation.file == null)
      return setError("Identification file is required");
    if (selectedApplicationOption === "BENEFICIARY")
      return submitBeneficiaryApplication();
    if (selectedApplicationOption === "MERCHANT")
      return submitMerchantApplication();
    if (selectedApplicationOption === "ORGANIZATION")
      return submitOrganizationApplication();
  }

  async function submitBeneficiaryApplication() {
    try {
      if (personalInformation.file == null) return;
      if (beneficiaryInfo.incomeFile == null)
        return setError("Annual income statement is required");
      if (beneficiaryInfo.appliedCountry.trim().length === 0)
        return setError("Please select a country you are applying for");
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          countryCode: beneficiaryInfo.appliedCountry,
          personalInformation: {
            name: personalInformation.name,
            address: personalInformation.address,
          },
        })
      );
      formData.append("IDENTIFICATION", personalInformation.file);
      formData.append("INCOME", beneficiaryInfo.incomeFile);
      await axios.postMultipart(
        routes.apiRoutes.uploadBeneficiary,
        formData,
        user?.jwt
      );
      setIsSubmitSucceed(true);
    } catch (error) {
      const decodedError = axios.decodeError(error);
      setError(decodedError.message);
    }
  }

  async function submitMerchantApplication() {
    try {
      if (personalInformation.file == null) return;
      if (merchantInfo.licenseFile == null)
        return setError("Proof of food operation license is required");
      if (merchantInfo.name.trim().length === 0)
        return setError("Stall name cannot be empty");
      const trimmedAddress = merchantInfo.addresses
        .map((address) => address.trim())
        .filter((address) => address.length > 0);
      if (trimmedAddress.length < 1)
        return setError("Please provide one address for your stall");
      if (merchantInfo.appliedCountry.trim().length === 0)
        return setError("Please select a country you are applying");
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          countryCode: merchantInfo.appliedCountry,
          personalInformation: {
            name: personalInformation.name,
            address: personalInformation.address,
          },
          merchantData: {
            name: merchantInfo.name,
            addresses: trimmedAddress,
          },
        })
      );
      formData.append("IDENTIFICATION", personalInformation.file);
      formData.append("LICENSE", merchantInfo.licenseFile);
      await axios.postMultipart(
        routes.apiRoutes.uploadMerchant,
        formData,
        user?.jwt
      );
      setIsSubmitSucceed(true);
    } catch (error) {
      const decodedError = axios.decodeError(error);
      setError(decodedError.message);
    }
  }

  async function submitOrganizationApplication() {
    try {
      if (personalInformation.file == null) return;
      if (organizationInfo.certificateFile == null)
        return setError("Proof of company operation is required");
      if (organizationInfo.name.trim().length === 0)
        return setError("Organization name cannot be empty");
      const trimmedAddress = organizationInfo.addresses
        .map((address) => address.trim())
        .filter((address) => address.length > 0);
      if (trimmedAddress.length < 1)
        return setError("Please provide one address for your organization");
      if (organizationInfo.appliedCountry.trim().length === 0)
        return setError("Please select a country you are applying");

      const trimmedMembers = organizationInfo.members
        .map((member) => member.trim())
        .filter((member) => member.length > 0);

      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          countryCode: organizationInfo.appliedCountry,
          personalInformation: {
            name: personalInformation.name,
            address: personalInformation.address,
          },
          organizationData: {
            name: organizationInfo.name,
            addresses: trimmedAddress,
          },
          members: trimmedMembers,
        })
      );
      formData.append("IDENTIFICATION", personalInformation.file);
      formData.append("CERTIFICATE", organizationInfo.certificateFile);
      await axios.postMultipart(
        routes.apiRoutes.uploadOrganization,
        formData,
        user?.jwt
      );
      setIsSubmitSucceed(true);
    } catch (error) {
      const decodedError = axios.decodeError(error);
      setError(decodedError.message);
    }
  }

  const handleTabChange = async (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setTableAttribute({
      page: 0,
      limit: 10,
      countryCode: undefined,
      filterType: undefined,
    });
    if (newValue === 0) fetchPersonalApplications(0, 10);
    else fetchSubmittedApplications(0, 10);
    setTabValue(newValue);
  };

  function onPageChange(newPage: number): void {
    setTableAttribute((state) => ({ ...state, page: newPage }));
    if (tabValue === 0)
      fetchPersonalApplications(newPage, tableAttribute.limit);
    else
      fetchSubmittedApplications(
        newPage,
        tableAttribute.limit,
        tableAttribute.countryCode,
        tableAttribute.filterType
      );
  }

  function onNumOfRowsChange(rowsPerPage: number) {
    setTableAttribute((state) => ({ ...state, limit: rowsPerPage, page: 0 }));
    if (tabValue === 0) fetchPersonalApplications(0, rowsPerPage);
    else
      fetchSubmittedApplications(
        0,
        rowsPerPage,
        tableAttribute.countryCode,
        tableAttribute.filterType
      );
  }

  async function getApplicationDetail({ id }: { id: string }) {
    try {
      const response = await axios.get(
        `${routes.apiRoutes.applicationDetail}/${id}`,
        user?.jwt
      );
      const application = Application.decodeApplication(response.data);
      if (
        application.organization != null &&
        application.organization.members.length > 0
      )
        setMembersToDisplay(application.organization.members.slice(0, 5));
      setApplicationDetail(application);
    } catch (error) {
      console.log(error);
    }
    setIsDetailModalOpen(true);
  }

  async function approveApplication(id: string) {
    try {
      const response = await axios.post(
        routes.apiRoutes.approveApplication,
        { applicationId: id },
        user?.jwt
      );
      const { message } = axios.decodeMessageSuccess(response);
      await Promise.all([
        getApplicationDetail({ id }),
        fetchSubmittedApplications(
          tableAttribute.page,
          tableAttribute.limit,
          tableAttribute.countryCode,
          tableAttribute.filterType
        ),
      ]);
      return setSnackBarState((state) => ({
        ...state,
        isOpen: true,
        message,
        type: "success",
      }));
    } catch (error) {
      const { message } = axios.decodeError(error);
      setSnackBarState((state) => ({
        ...state,
        isOpen: true,
        message,
        type: "error",
      }));
    }
  }

  async function rejectApplication(id: string) {
    try {
      const response = await axios.post(
        routes.apiRoutes.rejectApplication,
        { applicationId: id },
        user?.jwt
      );
      const { message } = axios.decodeMessageSuccess(response);
      await Promise.all([
        getApplicationDetail({ id }),
        fetchSubmittedApplications(
          tableAttribute.page,
          tableAttribute.limit,
          tableAttribute.countryCode,
          tableAttribute.filterType
        ),
      ]);
      return setSnackBarState((state) => ({
        ...state,
        isOpen: true,
        message,
        type: "success",
      }));
    } catch (error) {
      const { message } = axios.decodeError(error);
      setSnackBarState((state) => ({
        ...state,
        isOpen: true,
        message,
        type: "error",
      }));
    }
  }

  function handleSnackBarClose() {
    setSnackBarState((state) => ({ ...state, isOpen: false }));
  }

  return (
    <div className="flex flex-col lg:items-center">
      <div className="flex justify-end md:w-5/6 lg:w-4/5 pb-5">
        {user && user.role === "USER" && (
          <Button
            variant="contained"
            color="success"
            onClick={() => setCreateModalOpen(true)}
            sx={{ padding: 2 }}
          >
            Create New Application
          </Button>
        )}

        <Modal
          isModalOpen={isCreateModalOpen}
          setModalState={() => setCreateModalOpen(false)}
        >
          <div className="flex flex-col flex-wrap">
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              New Application
            </Typography>

            <FormControl sx={{ marginTop: "10px" }}>
              <InputLabel id="application">Applying For</InputLabel>
              <Select
                value={selectedApplicationOption}
                onChange={handleApplicationTypeChange}
                sx={{ width: "100%", margin: "10px 0px" }}
                labelId="application"
              >
                {applicationOption.map((application) => {
                  return (
                    <MenuItem
                      value={application.toUpperCase()}
                      key={application.toUpperCase()}
                    >
                      {application}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <PersonalInfoForm
              name={personalInformation.name}
              address={personalInformation.address}
              handleFileChange={(file) =>
                setPersonalInformation((state) => ({ ...state, file: file[0] }))
              }
              removeUploadedFile={() =>
                setPersonalInformation((state) => ({
                  ...state,
                  file: null,
                }))
              }
              file={personalInformation.file}
              onNameChange={(event) =>
                setPersonalInformation((state) => ({
                  ...state,
                  name: event.target.value,
                }))
              }
              onAddressChange={(event) =>
                setPersonalInformation((state) => ({
                  ...state,
                  address: event.target.value,
                }))
              }
            />
            {selectedApplicationOption === "BENEFICIARY" && (
              <BeneficiaryInfoForm
                selectedCountry={beneficiaryInfo.appliedCountry}
                countries={countries}
                handleFileChange={(file) =>
                  setBeneficiaryInfo((state) => ({
                    ...state,
                    incomeFile: file[0],
                  }))
                }
                removeUploadedFile={() =>
                  setBeneficiaryInfo((state) => ({
                    ...state,
                    incomeFile: null,
                  }))
                }
                file={beneficiaryInfo.incomeFile}
                handleCountryChange={(event) =>
                  setBeneficiaryInfo((state) => ({
                    ...state,
                    appliedCountry: event.target.value,
                  }))
                }
              />
            )}

            {selectedApplicationOption === "MERCHANT" && (
              <MerchantForm
                name={merchantInfo.name}
                addresses={merchantInfo.addresses}
                onNameChange={(event) =>
                  setMerchantInfo((state) => ({
                    ...state,
                    name: event.target.value,
                  }))
                }
                onAddressChange={(event, index) => {
                  const { addresses } = merchantInfo;
                  addresses[index] = event.target.value;
                  return setMerchantInfo((state) => ({ ...state, addresses }));
                }}
                handleFileChange={(file) =>
                  setMerchantInfo((state) => ({
                    ...state,
                    licenseFile: file[0],
                  }))
                }
                removeUploadedFile={() =>
                  setMerchantInfo((state) => ({
                    ...state,
                    licenseFile: null,
                  }))
                }
                file={merchantInfo.licenseFile}
                handleCountryChange={(event) =>
                  setMerchantInfo((state) => ({
                    ...state,
                    appliedCountry: event.target.value,
                  }))
                }
                selectedCountry={merchantInfo.appliedCountry}
                countries={countries}
                onAddressRemove={(index) => {
                  setMerchantInfo((state) => ({
                    ...state,
                    addresses: state.addresses.filter((_, i) => i !== index),
                  }));
                }}
                addNewAddress={() => {
                  return setMerchantInfo((state) => ({
                    ...state,
                    addresses: [...state.addresses, ""],
                  }));
                }}
              />
            )}

            {selectedApplicationOption === "ORGANIZATION" && (
              <OrganizationForm
                name={organizationInfo.name}
                addresses={organizationInfo.addresses}
                members={organizationInfo.members}
                onNameChange={(event) =>
                  setOrganizationInfo((state) => ({
                    ...state,
                    name: event.target.value,
                  }))
                }
                onAddressChange={(event, index) => {
                  const { addresses } = organizationInfo;
                  addresses[index] = event.target.value;
                  return setOrganizationInfo((state) => ({
                    ...state,
                    addresses,
                  }));
                }}
                onMemberChange={(event, index) => {
                  const { members } = organizationInfo;
                  members[index] = event.target.value;
                  return setOrganizationInfo((state) => ({
                    ...state,
                    members,
                  }));
                }}
                handleFileChange={(file) =>
                  setOrganizationInfo((state) => ({
                    ...state,
                    certificateFile: file[0],
                  }))
                }
                removeUploadedFile={() =>
                  setOrganizationInfo((state) => ({
                    ...state,
                    certificateFile: null,
                  }))
                }
                file={organizationInfo.certificateFile}
                handleCountryChange={(event) =>
                  setOrganizationInfo((state) => ({
                    ...state,
                    appliedCountry: event.target.value,
                  }))
                }
                selectedCountry={organizationInfo.appliedCountry}
                countries={countries}
                onAddressRemove={(index) => {
                  setOrganizationInfo((state) => ({
                    ...state,
                    addresses: state.addresses.filter((_, i) => i !== index),
                  }));
                }}
                onMemberRemove={(index: number) => {
                  setOrganizationInfo((state) => ({
                    ...state,
                    members: state.members.filter((_, i) => i !== index),
                  }));
                }}
                addNewAddress={() => {
                  return setOrganizationInfo((state) => ({
                    ...state,
                    addresses: [...state.addresses, ""],
                  }));
                }}
                addNewMember={() => {
                  return setOrganizationInfo((state) => ({
                    ...state,
                    members: [...state.members, ""],
                  }));
                }}
              />
            )}

            {error != null && (
              <span className="mt-2 mb-2 text-red-600">{error}</span>
            )}

            {isSubmitSucceed && (
              <span className="mt-2 mb-2 text-green-600">
                Applications have been submitted successfully.
              </span>
            )}

            <Button
              variant="contained"
              fullWidth={true}
              sx={{ padding: "15px 0px", marginTop: "20px" }}
              onClick={() => onSubmitApplication()}
            >
              Submit Application
            </Button>
          </div>
        </Modal>
      </div>
      <div className="flex justify-center items-center md:w-5/6 lg:w-4/5 w-full min-w-fit">
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
            value={tabValue}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            centered
          >
            <Tab
              label="Personal Applications"
              className="flex jutify-center flex-1"
            />
            {user.role !== "BENEFICIARY" &&
              user.role !== "MERCHANT" &&
              user.role !== "USER" && (
                <Tab
                  label="Submitted Applications"
                  className="flex jutify-center flex-1"
                />
              )}
          </Tabs>

          <div className="mt-2 pl-2 pr-2 w-full min-w-fit">
            <Table
              rowsPerPage={tableAttribute.limit}
              page={tableAttribute.page}
              totalNumberOfEntry={applications.totalApplications}
              data={applications.applications}
              columns={tableColumns}
              onPageChange={onPageChange}
              onNumOfRowsChange={onNumOfRowsChange}
              onClickRedirect={getApplicationDetail}
            />
          </div>
        </Paper>

        <Detail
          isModalOpen={isDetailModalOpen}
          setModalState={() => setIsDetailModalOpen(false)}
          application={applicationDetail}
          membersToDisplay={membersToDisplay}
          setMembersToDisplay={(members) => setMembersToDisplay(members)}
          approveApplication={approveApplication}
          rejectApplication={rejectApplication}
          user={user}
        />
      </div>

      <Snackbar
        isOpen={snackBarState.isOpen}
        message={snackBarState.message}
        type={snackBarState.type}
        onClose={handleSnackBarClose}
      />
    </div>
  );
}

export default index;
