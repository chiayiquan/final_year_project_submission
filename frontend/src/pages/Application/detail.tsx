import React, { useState, useEffect } from "react";
import { Typography, Button } from "@mui/material";
import Modal from "../../components/Modal";
import { ApplicationDetail, FileType, Member } from "../../models/Application";
import Table from "../../components/Table";
import { UserSchema } from "../../models/User";

type Props = {
  isModalOpen: boolean;
  setModalState: () => void;
  application: ApplicationDetail | null;
  membersToDisplay: Member[];
  setMembersToDisplay: (members: Member[]) => void;
  approveApplication: (id: string) => Promise<void>;
  rejectApplication: (id: string) => Promise<void>;
  user: UserSchema;
};

function detail({
  isModalOpen,
  setModalState,
  application,
  membersToDisplay,
  setMembersToDisplay,
  approveApplication,
  rejectApplication,
  user,
}: Props) {
  const hasPermission =
    user.role === "ADMIN" ||
    (user.role === "ORGANIZATION_MANAGER" &&
      application?.application.type !== "ORGANIZATION") ||
    (user.role === "ORGANIZATION_MEMBER" &&
      application?.application.type !== "ORGANIZATION");
  const [page, setPage] = useState(0);

  const rowsPerPage = 5;

  const identificationFile =
    (application != null &&
      application.files.filter(
        ({ fileType }) => fileType === "IDENTIFICATION"
      )[0]) ||
    null;

  const incomeFile =
    (application != null &&
      application.files.filter(({ fileType }) => fileType === "INCOME")[0]) ||
    null;

  const merchantFile =
    (application != null &&
      application.files.filter(({ fileType }) => fileType === "LICENSE")[0]) ||
    null;

  const organizationFile =
    (application != null &&
      application.files.filter(
        ({ fileType }) => fileType === "CERTIFICATE"
      )[0]) ||
    null;

  function BusinessInformation({
    name,
    addresses,
    members,
    type,
    file,
  }: {
    name: string;
    addresses: string[];
    members: { name: string; email: string }[] | null;
    type: "MERCHANT" | "ORGANIZATION";
    file: { name: string; url: string; fileType: FileType } | null;
  }) {
    return (
      <div className="flex flex-col">
        <br />
        <Typography variant="h6">
          {type === "ORGANIZATION" ? "Organization" : "Merchant"} Information
        </Typography>
        <Typography variant="subtitle1">Business Name: {name}</Typography>
        <Typography variant="subtitle1">
          Business Addresses:{" "}
          <ul>
            {addresses.map((address, index) => (
              <li key={index}>
                <Typography variant="subtitle2">
                  {index + 1}. {address}
                </Typography>
              </li>
            ))}
          </ul>
        </Typography>
        <Typography variant="subtitle1">
          Business Operation File:{" "}
          {file != null && (
            <a href={file.url} target="_blank">
              {file.name}
            </a>
          )}
        </Typography>
      </div>
    );
  }

  return (
    <Modal isModalOpen={isModalOpen} setModalState={setModalState}>
      {application && (
        <div className="flex flex-col">
          <div className="flex justify-between flex-wrap">
            <div className="flex flex-col">
              <Typography variant="h5">Application Detail</Typography>
              <Typography variant="h6">Personal Information</Typography>
              <Typography variant="subtitle1">
                ID: {application.application.id}
              </Typography>
              <Typography variant="subtitle1">
                Applicant Name: {application.application.applicantName}
              </Typography>
              <Typography variant="subtitle1">
                Country Applied: {application.application.appliedCountry}
              </Typography>
              <Typography variant="subtitle1">
                Role Applied: {application.application.type}
              </Typography>

              <Typography variant="subtitle1">
                Address: {application.personalAddress.address}
              </Typography>

              <Typography variant="subtitle1">
                Identification File:{" "}
                {identificationFile != null && (
                  <a href={identificationFile.url} target="_blank">
                    {identificationFile.name}
                  </a>
                )}
              </Typography>

              <Typography variant="subtitle1">
                Status:{" "}
                <span
                  style={{
                    backgroundColor:
                      application.application.status === "APPROVED"
                        ? "#089000"
                        : application.application.status === "REJECTED"
                        ? "#8B0000"
                        : "grey",
                    color: "white",
                    padding: "5px",
                    borderRadius: "25px",
                  }}
                >
                  {application.application.status}
                </span>
              </Typography>

              {application.application.type === "BENEFICIARY" && (
                <Typography variant="subtitle1">
                  Annual Income File:{" "}
                  {incomeFile != null && (
                    <a href={incomeFile.url} target="_blank">
                      {incomeFile.name}
                    </a>
                  )}
                </Typography>
              )}
            </div>
            <div>
              {application.application.type === "MERCHANT" &&
                application.merchant != null && (
                  <BusinessInformation
                    name={application.merchant.name}
                    addresses={application.merchant.addresses.map(
                      ({ address }) => address
                    )}
                    members={[]}
                    type="MERCHANT"
                    file={merchantFile}
                  />
                )}

              {application.application.type === "ORGANIZATION" &&
                application.organization != null && (
                  <BusinessInformation
                    name={application.organization.name}
                    addresses={application.organization.addresses.map(
                      ({ address }) => address
                    )}
                    members={[]}
                    type="ORGANIZATION"
                    file={organizationFile}
                  />
                )}
              {application.organization != null &&
                application.organization.members.length > 0 && (
                  <>
                    <br />
                    <Typography variant="h6">Organization Members</Typography>
                    <Table
                      rowsPerPage={rowsPerPage}
                      page={page}
                      totalNumberOfEntry={
                        application.organization.members.length
                      }
                      data={membersToDisplay}
                      columns={[
                        { columnKey: "name", columnName: "Member Name" },
                        { columnKey: "email", columnName: "Email" },
                      ]}
                      onPageChange={(newPage) => {
                        if (application != null && application.organization) {
                          const startIndex = newPage * rowsPerPage;
                          setMembersToDisplay(
                            application.organization.members.slice(
                              startIndex,
                              startIndex + rowsPerPage
                            )
                          );
                        }
                        setPage(newPage);
                      }}
                      onClickRedirect={() => {}}
                      onNumOfRowsChange={() => {}}
                      rowsPerPageOptions={[5]}
                    />
                  </>
                )}
            </div>
            <div></div>
          </div>
          {hasPermission && (
            <div className="flex justify-center items-center mt-10">
              {application.application.status !== "REJECTED" && (
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{ marginRight: "10px", padding: "15px" }}
                  onClick={() => rejectApplication(application.application.id)}
                >
                  Reject Application
                </Button>
              )}

              {application.application.status !== "APPROVED" && (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ padding: "15px" }}
                  fullWidth
                  onClick={() => approveApplication(application.application.id)}
                >
                  Accept Application
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default detail;
