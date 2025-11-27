import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "Urbanist, Inter, sans-serif",
            colorPrimary: "#2563eb",
            colorInfo: "#2563eb",
            colorBgBase: "#f5f7fb",
          },
          algorithm: theme.defaultAlgorithm,
        }}
      >
    <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);
