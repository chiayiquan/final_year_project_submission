import { Express, Response, Request, NextFunction } from "express";
import StandardResponse from "./libs/StandardResponse";
import CreateContract from "./api/Country/create";
import GenerateVoucher from "./api/Voucher/generate";
import RedeemVoucher from "./api/Voucher/redeem";
import Register from "./api/User/register";
import Login from "./api/User/login";
import UploadBeneficiary from "./api/Application/uploadBeneficiary";
import UploadMerchant from "./api/Application/uploadMerchant";
import UploadOrganization from "./api/Application/uploadOrganization";
import ApplicationApprove from "./api/Application/approve";
import ApplicationReject from "./api/Application/reject";
import ViewApplication from "./api/Application/view";
import ViewFile from "./api/Application/viewFile";
import GenerateCheckoutLink from "./api/Stripe/generateCheckoutLink";
import ListVoucher from "./api/Voucher/list";
import ViewVoucher from "./api/Voucher/view";
import ListTransaction from "./api/Transaction/list";
import ListApplication from "./api/Application/list";
import AddOrganizationMember from "./api/Organization/addMember";
import ListOrganization from "./api/Organization/list";
import ListMember from "./api/Organization/listMember";
import RemoveMember from "./api/Organization/removeMember";
import ViewOrganization from "./api/Organization/view";
import StripeCheckoutSuccess from "./api/Stripe/checkoutSuccess";
import SupportedCountries from "./api/Country/list";
import ListStripePrices from "./api/Stripe/listPrices";
import ListPersonalApplication from "./api/Application/listPersonal";
import ListStripeDonation from "./api/Donation/listStripe";
import ListMetamaskDonation from "./api/Donation/listMetamask";
import InsertMetamaskDonation from "./api/Donation/insert";
import ListSubscription from "./api/Stripe/listSubscription";
import StripeUnsubscribe from "./api/Stripe/unsubscribe";
import CountryDetail from "./api/Country/detail";
import ListUnsupportedCountries from "./api/Country/listUnsupported";
import UpdateContract from "./api/Country/update";
import GetUser from "./api/User/get";
import WalletTransfer from "./api/Wallet/transfer";
import WalletBalance from "./api/Wallet/getBalance";
import WalletHistory from "./api/Wallet/list";
import ListPersonalTransaction from "./api/Transaction/listPersonal";
import WalletDownload from "./api/Wallet/download";

type ApiFunction = (
  request: Request,
  response: Response,
  next?: NextFunction
) => Promise<Response>;

function handleError(api: ApiFunction): ApiFunction {
  return async (request, response, next) => {
    return api(request, response, next).catch(async (error) => {
      console.log(error);
      // we have an uncaught error here
      return StandardResponse.serverFail(request, response, error);
    });
  };
}

export function addRoutesToExpressInstance(app: Express): void {
  app.get("/", (_req, res) => {
    res.json({ data: "Server is up" });
  });

  app.get("/view-file/:id", ViewFile);
  app.post("/wallet/download", WalletDownload);

  app.get("/application-detail/:id", handleError(ViewApplication));
  app.get("/voucher/list", handleError(ListVoucher));
  app.get("/voucher/view/:id", handleError(ViewVoucher));
  app.get("/transaction/list", handleError(ListTransaction));
  app.get("/application/list", handleError(ListApplication));
  app.get("/organization/list", handleError(ListOrganization));
  app.get("/organization/member/list", handleError(ListMember));
  app.get("/organization/view/:id", handleError(ViewOrganization));
  app.get("/countries/supported", handleError(SupportedCountries));
  app.get("/stripe/prices/list/:countryCode", handleError(ListStripePrices));
  app.get("/application/list/personal", handleError(ListPersonalApplication));
  app.get("/donation/list/stripe", handleError(ListStripeDonation));
  app.get("/donation/list/metamask", handleError(ListMetamaskDonation));
  app.get("/stripe/subscription/list", handleError(ListSubscription));
  app.get("/country/detail/:countryCode", handleError(CountryDetail));
  app.get("/countries/unsupported", handleError(ListUnsupportedCountries));
  app.get("/user/get", handleError(GetUser));
  app.get("/wallet/balance", handleError(WalletBalance));
  app.get("/wallet/history", handleError(WalletHistory));
  app.get("/transaction/list/personal", handleError(ListPersonalTransaction));

  app.post("/country/create", handleError(CreateContract));
  app.post("/voucher/generate", handleError(GenerateVoucher));
  app.post("/voucher/redeem", handleError(RedeemVoucher));
  app.post("/register", handleError(Register));
  app.post("/login", handleError(Login));
  app.post("/application/beneficiary", handleError(UploadBeneficiary));
  app.post("/application/merchant", handleError(UploadMerchant));
  app.post("/application/organization", handleError(UploadOrganization));
  app.post("/application/approve", handleError(ApplicationApprove));
  app.post("/application/reject", handleError(ApplicationReject));
  app.post("/stripe/generate-checkout", handleError(GenerateCheckoutLink));
  app.post("/organization/member/add", handleError(AddOrganizationMember));
  app.post("/organization/member/remove", handleError(RemoveMember));
  app.post("/stripe/checkout-success", handleError(StripeCheckoutSuccess));
  app.post("/donation/insert/metamask", handleError(InsertMetamaskDonation));
  app.post("/stripe/unsubscribe", handleError(StripeUnsubscribe));
  app.post("/country/update", handleError(UpdateContract));
  app.post("/wallet/transfer", handleError(WalletTransfer));
}
