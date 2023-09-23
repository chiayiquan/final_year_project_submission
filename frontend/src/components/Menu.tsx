import React, { useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { ImCross } from "react-icons/im";
import { useNavigate } from "react-router-dom";
import routes from "../routes";
import * as User from "../models/User";

const Menu = ({
  isMobile,
  user,
  removeUserSession,
}: {
  isMobile: boolean;
  user: User.UserSchema | null;
  removeUserSession: () => void;
}) => {
  const [nav, setNav] = useState(false);
  const handleNav = () => setNav((state) => !state);

  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#f5f5f5" }}>
      {nav ? (
        <ImCross
          onClick={handleNav}
          className="absolute top-4 right-4 z-[99] lg:hidden"
        />
      ) : (
        <AiOutlineMenu
          onClick={handleNav}
          className="absolute top-4 right-4 z-[99] lg:hidden"
        />
      )}

      {!isMobile && !nav ? (
        <div className=" mt-10 left-1/4 flex justify-center invisible lg:visible rounded">
          <div
            className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
            onClick={() => navigate(routes.routes.home)}
          >
            Home
          </div>
          <div
            className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
            onClick={() => navigate(routes.routes.transaction)}
          >
            Transactions
          </div>
          {user && (
            <>
              <div
                className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
                onClick={() => navigate(routes.routes.donate)}
              >
                Donate
              </div>

              {user.role === "BENEFICIARY" && (
                <div
                  className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
                  onClick={() => navigate(routes.routes.voucher)}
                >
                  Vouchers
                </div>
              )}

              <div
                className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
                onClick={() => navigate(routes.routes.application)}
              >
                Applications
              </div>

              <div
                className="hover:bg-gray-200 cursor-pointer border-gray-200 text-lg font-bold p-2 m-5"
                onClick={() => navigate(routes.routes.wallet)}
              >
                Wallet
              </div>
            </>
          )}
        </div>
      ) : nav ? (
        <div
          className="fixed w-full h-25 flex flex-col justify-center items-start z-20 bg-gray-600"
          // style={{ backgroundColor: "#f5f5f5" }}
        >
          <div
            className="flex justify-start items-center font-bold text-lg"
            style={{ color: "#ffffff" }}
            onClick={() => {
              handleNav();
              navigate(routes.routes.home);
            }}
          >
            Home
          </div>
          <div
            className="flex justify-start items-center font-bold text-lg"
            style={{ color: "#ffffff" }}
            onClick={() => {
              handleNav();
              navigate(routes.routes.transaction);
            }}
          >
            Transactions
          </div>

          {user == null && (
            <>
              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  navigate(routes.routes.login);
                }}
              >
                Login
              </div>

              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  navigate(routes.routes.register);
                }}
              >
                Register
              </div>
            </>
          )}

          {user && (
            <>
              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  navigate(routes.routes.donate);
                }}
              >
                Donate
              </div>

              {user.role === "BENEFICIARY" && (
                <div
                  className="flex justify-start items-center font-bold text-lg"
                  style={{ color: "#ffffff" }}
                  onClick={() => {
                    handleNav();
                    navigate(routes.routes.voucher);
                  }}
                >
                  Vouchers
                </div>
              )}

              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  navigate(routes.routes.application);
                }}
              >
                Applications
              </div>

              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  navigate(routes.routes.wallet);
                }}
              >
                Wallet
              </div>

              <div
                className="flex justify-start items-center font-bold text-lg"
                style={{ color: "#ffffff" }}
                onClick={() => {
                  handleNav();
                  removeUserSession();
                  navigate(routes.routes.home);
                }}
              >
                Logout
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Menu;
