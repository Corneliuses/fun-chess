import "./storage-shim.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PawnParty from "./PawnParty.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PawnParty />
  </StrictMode>
);
