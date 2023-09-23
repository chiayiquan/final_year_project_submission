import React from "react";
import Header from "./components/Header";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import routes from "./routes";
import { useStore } from "./store";

function App() {
  const user = useStore((store) => store.user);
  const removeUserSession = useStore((store) => store.removeSession);
  const setUser = useStore((store) => store.setUser);

  return (
    <>
      <BrowserRouter>
        <div
          className="flex flex-col h-full min-h-screen overflow-auto"
          style={{ backgroundColor: "#f5f5f5" }}
        >
          <header>
            <Header
              isLogin={user != null}
              removeUserSession={removeUserSession}
              user={user}
              setUser={setUser}
            />
          </header>
          <div
            className="flex-1 ml-10 mr-10 mt-10"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <Routes>
              {Object.keys(routes.routesObj).map((key) => {
                const routesObj = routes.routesObj[key];
                if (routesObj.loginRequired) {
                  if (user == null) {
                    return (
                      <Route
                        path={routesObj.path}
                        element={
                          <Navigate
                            to={`${routes.routes.login}?redirect=${window.location.pathname}`}
                          />
                        }
                        key={routesObj.path}
                      />
                    );
                  }
                }

                return (
                  <Route
                    path={routesObj.path}
                    element={<routesObj.component />}
                    key={routesObj.path}
                  />
                );
              })}
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
