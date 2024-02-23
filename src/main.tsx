import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import "./styles/globals.css";

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
