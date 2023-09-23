import Login from "./pages/Login";
import Register from "./pages/Register";
import Transaction from "./pages/Transactions";
import Donate from "./pages/Donate";
import Application from "./pages/Application";
import Voucher from "./pages/Voucher";
import VoucherRedeem from "./pages/VoucherRedeem";
import DonationSuccess from "./pages/DonationSuccess";
import Country from "./pages/Country";
import Wallet from "./pages/Wallet";

import env from "./env";

type Route = {
  [page: string]: {
    path: string;
    component: any;
    name: string;
    loginRequired: boolean;
  };
};

const backendUrl = env.VITE_BACKEND_URL;
const apiRoutes = {
  login: `${backendUrl}/login`,
  register: `${backendUrl}/register`,
  generateVoucher: `${backendUrl}/voucher/generate`,
  listVoucher: `${backendUrl}/voucher/list`,
  viewVoucher: `${backendUrl}/voucher/view`,
  redeemVoucher: `${backendUrl}/voucher/redeem`,
  listTransaction: `${backendUrl}/transaction/list`,
  generateCheckout: `${backendUrl}/stripe/generate-checkout`,
  checkoutSuccess: `${backendUrl}/stripe/checkout-success`,
  supportedCountries: `${backendUrl}/countries/supported`,
  listStripePrices: `${backendUrl}/stripe/prices/list`,
  uploadBeneficiary: `${backendUrl}/application/beneficiary`,
  uploadMerchant: `${backendUrl}/application/merchant`,
  uploadOrganization: `${backendUrl}/application/organization`,
  listPersonalApplication: `${backendUrl}/application/list/personal`,
  listApplication: `${backendUrl}/application/list`,
  applicationDetail: `${backendUrl}/application-detail`,
  approveApplication: `${backendUrl}/application/approve`,
  rejectApplication: `${backendUrl}/application/reject`,
  listStripeDonation: `${backendUrl}/donation/list/stripe`,
  listMetamaskDonation: `${backendUrl}/donation/list/metamask`,
  insertMetamaskDonation: `${backendUrl}/donation/insert/metamask`,
  listSubscription: `${backendUrl}/stripe/subscription/list`,
  cancelSubscription: `${backendUrl}/stripe/unsubscribe`,
  countryDetail: `${backendUrl}/country/detail`,
  updateCountry: `${backendUrl}/country/update`,
  listUnsupportedCountries: `${backendUrl}/countries/unsupported`,
  createCountry: `${backendUrl}/country/create`,
  getUser: `${backendUrl}/user/get`,
  walletBalance: `${backendUrl}/wallet/balance`,
  walletTransfer: `${backendUrl}/wallet/transfer`,
  walletHistory: `${backendUrl}/wallet/history`,
  listPersonalTransaction: `${backendUrl}/transaction/list/personal`,
  walletDownload: `${backendUrl}/wallet/download`,
};

const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  transaction: "/transaction",
  donate: "/donate",
  application: "/application",
  voucher: "/voucher",
  redeemVoucher: "/voucher/redeem/:id",
  donateSuccess: "/donate-success/:id",
  wallet: "/wallet",
};

const routesObj: Route = {
  home: {
    path: routes.home,
    component: Country,
    name: "home",
    loginRequired: false,
  },
  login: {
    path: routes.login,
    component: Login,
    name: "login",
    loginRequired: false,
  },
  register: {
    path: routes.register,
    component: Register,
    name: "register",
    loginRequired: false,
  },
  transaction: {
    path: routes.transaction,
    component: Transaction,
    name: "Transaction",
    loginRequired: false,
  },
  donate: {
    path: routes.donate,
    component: Donate,
    name: "Donate",
    loginRequired: true,
  },
  application: {
    path: routes.application,
    component: Application,
    name: "Application",
    loginRequired: true,
  },
  voucher: {
    path: routes.voucher,
    component: Voucher,
    name: "Voucher",
    loginRequired: true,
  },
  redeemVoucher: {
    path: routes.redeemVoucher,
    component: VoucherRedeem,
    name: "Redeem Voucher",
    loginRequired: true,
  },
  checkoutSuccess: {
    path: routes.donateSuccess,
    component: DonationSuccess,
    name: "Donation Success",
    loginRequired: true,
  },
  wallet: {
    path: routes.wallet,
    component: Wallet,
    name: "Wallet",
    loginRequired: true,
  },
};

export default {
  routes,
  routesObj,
  apiRoutes,
};
