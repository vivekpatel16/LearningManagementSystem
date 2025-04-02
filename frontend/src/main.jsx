// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )


// import { Provider } from "react-redux";
// import store from "./features/auth/store"; // Ensure correct path

// ReactDOM.createRoot(document.getElementById("root")).render(
//     <Provider store={store}>
//         <App />
//     </Provider>
// );


import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./features/auth/store";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { testApiConnection } from "./utils/apiTest";
import API_CONFIG from "./config/apiConfig";

// Log environment config for debugging
console.log("Environment:", import.meta.env.MODE);
console.log("API Base URL:", API_CONFIG.BASE_URL);

// Test API connectivity at startup
// testApiConnection()
//   .then(isConnected => {
//     console.log("API connectivity test result:", isConnected ? "CONNECTED" : "FAILED");
//   })
//   .catch(error => {
//     console.error("API connectivity test error:", error);
//   });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
