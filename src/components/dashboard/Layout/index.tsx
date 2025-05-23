import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type ActiveView = "orders" | "quotes" | "clients" | "settings" | "create-quote";

interface DashboardLayoutProps {
  children: ReactNode;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeView,
  setActiveView,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Header activeView={activeView} />
        {children}
      </main>
    </div>
  );
};
