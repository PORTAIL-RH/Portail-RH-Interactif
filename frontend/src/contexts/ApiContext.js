import React from "react";

const ApiContext = React.createContext();

export const ApiProvider = ({ children }) => {
  const API_URL = "http://localhost:8080/api";

  return (
    <ApiContext.Provider value={{ API_URL }}>
      {children}
    </ApiContext.Provider>
  );
};

export default ApiContext;