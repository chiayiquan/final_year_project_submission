import React, { useEffect } from "react";
import { PiBowlFoodFill } from "react-icons/pi";
import Menu from "./Menu";
import { useNavigate, useLocation } from "react-router-dom";
import routes from "../routes";
import { isMobile } from "react-device-detect";
import axios from "../libs/axios";
import * as User from "../models/User";

function Header({
  isLogin,
  removeUserSession,
  user,
  setUser,
}: {
  isLogin: boolean;
  removeUserSession: () => void;
  setUser: (data: User.UserSchema) => void;
  user: User.UserSchema | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function updateUser(jwt: string) {
      try {
        const response = await axios.get(routes.apiRoutes.getUser, jwt);
        const data = User.decodeUserInfo(response.data);
        if (data != null) setUser({ ...data, jwt });
      } catch (error) {}
    }

    if (user != null) updateUser(user.jwt);
  }, []);

  const pathWithoutMenu = [routes.routes.login, routes.routes.register];
  const pathWithoutLoginHeader = [routes.routes.login, routes.routes.register];

  return (
    <>
      <div className="flex flex-row justify-between mt-2 h-auto">
        <span
          className="flex flex-col text-xl cursor-pointer w-36 ml-10 text-gray-600 font-bold"
          onClick={() => navigate("/")}
        >
          <span className="flex flex-row items-center">
            SHARE <PiBowlFoodFill />
          </span>
          <span className="flex flex-row items-center">THE MEAL</span>
        </span>
        <div className="flex flex-row justify-end w-36 mr-10 lg:visible invisible">
          {!isLogin ? (
            <>
              {pathWithoutLoginHeader.every(
                (path) => path !== location.pathname
              ) && (
                <>
                  <span
                    className="cursor-pointer mr-3"
                    onClick={() => navigate(routes.routes.login)}
                  >
                    Login
                  </span>
                  <span
                    className="cursor-pointer"
                    onClick={() => navigate(routes.routes.register)}
                  >
                    Register
                  </span>
                </>
              )}{" "}
            </>
          ) : (
            <span
              className="cursor-pointer"
              onClick={() => {
                navigate(routes.routes.home);
                removeUserSession();
              }}
            >
              Logout
            </span>
          )}
        </div>
      </div>

      {pathWithoutMenu.every((path) => path !== location.pathname) && (
        <div className="lg:h-11 sm:h-0">
          <Menu
            isMobile={isMobile}
            user={user}
            removeUserSession={removeUserSession}
          />
        </div>
      )}
    </>
  );
}

export default Header;
