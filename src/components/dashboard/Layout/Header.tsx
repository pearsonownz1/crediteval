import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActiveView = "orders" | "quotes" | "clients" | "settings" | "create-quote";

interface HeaderProps {
  activeView: ActiveView;
}

export const Header: React.FC<HeaderProps> = ({ activeView }) => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-navy-700">
        {activeView === "orders" && "Order Management"}
        {activeView === "quotes" && "Quote Management"}
        {activeView === "clients" && "Client Management"}
        {activeView === "settings" && "Settings"}
        {activeView === "create-quote" && "Create New Quote"}
      </h1>

      {/* Notifications Panel - Fixed position */}
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </header>
  );
};
