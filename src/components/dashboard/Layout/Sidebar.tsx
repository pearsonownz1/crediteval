import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  FileQuestion,
  Settings,
  Users as UsersIcon,
  PlusCircle,
  LogOut,
} from "lucide-react";

type ActiveView = "orders" | "quotes" | "clients" | "settings" | "create-quote";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 text-center text-xl font-bold border-b border-gray-700">
        CreditEval Admin
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <Link
          to="/admin/orders"
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${
            isActive("/admin/orders")
              ? "bg-gray-900 text-white"
              : "text-gray-300"
          }`}>
          <ClipboardList className="mr-3 h-5 w-5" /> Orders
        </Link>
        <Link
          to="/admin/quotes"
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${
            isActive("/admin/quotes")
              ? "bg-gray-900 text-white"
              : "text-gray-300"
          }`}>
          <FileQuestion className="mr-3 h-5 w-5" /> Quotes
        </Link>
        <Link
          to="/admin/clients"
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${
            isActive("/admin/clients")
              ? "bg-gray-900 text-white"
              : "text-gray-300"
          }`}>
          <UsersIcon className="mr-3 h-5 w-5" /> Clients
        </Link>
        <Link
          to="/admin/settings"
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${
            isActive("/admin/settings")
              ? "bg-gray-900 text-white"
              : "text-gray-300"
          }`}>
          <Settings className="mr-3 h-5 w-5" /> Settings
        </Link>
        <Link
          to="/admin/create-quote"
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${
            isActive("/admin/create-quote")
              ? "bg-gray-900 text-white"
              : "text-gray-300"
          }`}>
          <PlusCircle className="mr-3 h-5 w-5" /> Create Quote
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={onLogout}>
          <LogOut className="mr-3 h-5 w-5" /> Logout
        </Button>
      </div>
    </aside>
  );
};
