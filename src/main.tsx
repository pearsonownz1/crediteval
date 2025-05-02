import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Tracker from '@openreplay/tracker'; // Import OpenReplay Tracker
import trackerAssist from '@openreplay/tracker-assist'; // Import Assist plugin
import { TempoDevtools } from "tempo-devtools";
import { PostHogProvider } from 'posthog-js/react';

TempoDevtools.init();

const tracker = new Tracker({
  projectKey: "mm7loMLeLPc0as2lWG72",
});
tracker.use(trackerAssist()); // Use the Assist plugin
tracker.start();

const basename = import.meta.env.BASE_URL;

// TODO: Replace with your actual publishable key, ideally from environment variables
const stripePromise = loadStripe("pk_live_5vKOii6RstRUd7bpww7zaSof");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: "https://us.i.posthog.com",
        debug: import.meta.env.MODE === "development",
      }}
    >
      <BrowserRouter basename={basename}>
        <AuthProvider> {/* Wrap App with AuthProvider */}
          <Elements stripe={stripePromise}>
            <App />
          </Elements>
        </AuthProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>,
);
