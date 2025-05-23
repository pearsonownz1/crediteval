import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../components/dashboard/Layout";
import { OrdersView } from "../components/dashboard/Orders";
import { QuotesView } from "../components/dashboard/Quotes";
import { ClientsView } from "../components/dashboard/Clients";
import { SettingsView } from "../components/dashboard/Settings";
import { CreateQuoteForm } from "../components/dashboard/Quotes/CreateQuoteForm";

type ActiveView = "orders" | "quotes" | "clients" | "settings" | "create-quote";

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeView, setActiveView] = useState<ActiveView>("orders");

  // Set initial view based on URL hash
  useEffect(() => {
    const hash = location.hash.substring(1) || "orders";
    const validViews = [
      "orders",
      "quotes",
      "clients",
      "settings",
      "create-quote",
    ];
    const initialView = validViews.includes(hash) ? hash : "orders";
    setActiveView(initialView as ActiveView);
  }, [location.hash]);

  // Render the active view
  const renderActiveView = () => {
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

  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      {renderActiveView()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
