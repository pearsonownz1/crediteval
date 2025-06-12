import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom"; // Import useParams
import { DashboardLayout } from "../components/dashboard/Layout";
import { OrdersView } from "../components/dashboard/Orders";
import { QuotesView } from "../components/dashboard/Quotes";
import { ClientsView } from "../components/dashboard/Clients";
import { SettingsView } from "../components/dashboard/Settings";
import { CreateQuoteForm } from "../components/dashboard/Quotes/CreateQuoteForm";
import { QuoteDetailsPage } from "./QuoteDetailsPage"; // Import QuoteDetailsPage

type ActiveView = "orders" | "quotes" | "clients" | "settings" | "create-quote";

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); // Get the ID from the URL
  const [activeView, setActiveView] = useState<ActiveView>("orders");

  // Set initial view based on URL pathname
  useEffect(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean); // Filter out empty strings from split
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondLastSegment = pathSegments[pathSegments.length - 2]; // Get the segment before the last one

    let initialView: ActiveView = "orders";

    if (
      secondLastSegment === "quotes" &&
      lastSegment &&
      lastSegment.length === 36 &&
      lastSegment.includes("-")
    ) {
      // Assuming UUID for quote ID
      initialView = "quotes";
    } else if (
      ["orders", "quotes", "clients", "settings", "create-quote"].includes(
        lastSegment
      )
    ) {
      initialView = lastSegment as ActiveView;
    }

    setActiveView(initialView);
  }, [location.pathname]);

  // Render the active view
  const renderActiveView = () => {
    if (activeView === "quotes" && id) {
      return <QuoteDetailsPage />;
    }

    switch (activeView) {
      case "orders":
        return <OrdersView />;
      case "quotes":
        return <QuotesView />;
      case "clients":
        return <ClientsView />;
      case "settings":
        return <SettingsView />;
      case "create-quote":
        return <CreateQuoteForm />;
      default:
        return <OrdersView />;
    }
  };

  return <DashboardLayout>{renderActiveView()}</DashboardLayout>;
};

export default AdminDashboard;
