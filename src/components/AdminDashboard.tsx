import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Bell,
  MessageSquare,
  Upload,
  Filter,
  MoreVertical,
  LogOut,
  Info,
  Trash2,
  ClipboardList, // Icon for Orders
  FileQuestion, // Icon for Quotes
  Settings, // Icon for Settings
  Users as UsersIcon, // Icon for Clients (alias to avoid conflict)
  PlusCircle, // Icon for Create Quote
} from "lucide-react";
import { CreateQuoteForm } from "./CreateQuoteForm"; // Import the new form

// Define types
type Order = any; // Keep flexible for now
type Quote = any; // Define Quote type similarly

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Add 'create-quote' to the possible views
  const [activeView, setActiveView] = useState<'orders' | 'quotes' | 'clients' | 'settings' | 'create-quote'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [quoteDetailsDialogOpen, setQuoteDetailsDialogOpen] = useState(false);
  const [selectedOrderRowKeys, setSelectedOrderRowKeys] = useState<React.Key[]>([]);
  const [selectedQuoteRowKeys, setSelectedQuoteRowKeys] = useState<React.Key[]>([]);
  const [isDeletingSelectedOrders, setIsDeletingSelectedOrders] = useState(false);
  const [isDeletingSelectedQuotes, setIsDeletingSelectedQuotes] = useState(false);

  // --- Data Fetching ---
  const fetchOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setOrders(data || []);
      // Log the first few orders to inspect total_amount
      if (data && data.length > 0) {
        console.log("Fetched Orders Data Sample (first 3):");
        data.slice(0, 3).forEach((order, index) => {
          console.log(`Order ${index + 1} ID: ${order.id}, Total Amount: ${order.total_amount}, Type: ${typeof order.total_amount}`);
        });
      } else {
        console.log("No orders data fetched.");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setErrorOrders(err.details || err.message || "Failed to fetch orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchQuotes = async () => {
    console.log("Attempting to fetch quotes..."); // Log start
    setLoadingQuotes(true);
    setErrorQuotes(null);
    try {
      console.log("Executing Supabase query for quotes..."); // Log before query
      // *** ASSUMPTION: Table name is 'quotes' ***
      // Select only columns that exist in the corrected quotes table schema
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('id, name, email, service_type, price, status, created_at, expires_at, staff_id') // Removed phone, corrected columns
        .order('created_at', { ascending: false });

      console.log("Supabase query finished. Error:", fetchError, "Data:", data); // Log result

      if (fetchError) {
        console.error("Supabase fetch error object:", fetchError); // Log the specific error
        throw fetchError;
      }
      setQuotes(data || []);
      console.log(`Successfully fetched ${data?.length || 0} quotes.`); // Log success
    } catch (err: any) {
      console.error("Caught error during fetchQuotes:", err); // Log caught error
      setErrorQuotes(err.details || err.message || "Failed to fetch quotes.");
    } finally {
      console.log("Executing finally block for fetchQuotes, setting loading to false."); // Log finally
      setLoadingQuotes(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const hash = location.hash.substring(1) || 'orders';
    // Add 'create-quote' to valid views
    const validViews = ['orders', 'quotes', 'clients', 'settings', 'create-quote'];
    const initialView = validViews.includes(hash) ? hash : 'orders';
    setActiveView(initialView as any);

    // Fetch initial data based on hash
    if (initialView === 'quotes') {
      fetchQuotes();
    } else if (initialView === 'clients') {
      // Fetch clients logic
    } else if (initialView === 'settings') {
      // Fetch settings logic
    } else {
      fetchOrders();
    }
  }, [location.hash]); // Only run when hash changes

  // Refetch data when activeView changes if needed (e.g., if data wasn't fetched initially)
   useEffect(() => {
      if (activeView === 'orders' && orders.length === 0 && !loadingOrders) {
          fetchOrders();
      } else if (activeView === 'quotes' && quotes.length === 0 && !loadingQuotes) {
          fetchQuotes();
      }
      // Add logic for clients/settings if needed
  }, [activeView, orders.length, quotes.length, loadingOrders, loadingQuotes]); // Dependencies to refetch if view changes and data is missing


  // --- Deletion Handlers ---
  const handleDeleteSelectedOrders = async () => {
    if (selectedOrderRowKeys.length === 0) return alert("Please select orders to delete.");
    if (!window.confirm(`Delete ${selectedOrderRowKeys.length} order(s)?`)) return;

    setIsDeletingSelectedOrders(true);
    setErrorOrders(null);
    try {
      const { error: deleteError } = await supabase.from('orders').delete().in('id', selectedOrderRowKeys);
      if (deleteError) throw deleteError;
      alert(`${selectedOrderRowKeys.length} order(s) deleted.`);
      setSelectedOrderRowKeys([]);
      await fetchOrders();
    } catch (err: any) {
      setErrorOrders(err.details || err.message || "Failed to delete orders.");
      alert(`Error deleting orders: ${err.message}`);
    } finally {
      setIsDeletingSelectedOrders(false);
    }
  };

  const handleDeleteSelectedQuotes = async () => {
    if (selectedQuoteRowKeys.length === 0) return alert("Please select quotes to delete.");
    if (!window.confirm(`Delete ${selectedQuoteRowKeys.length} quote(s)?`)) return;

    setIsDeletingSelectedQuotes(true);
    setErrorQuotes(null);
    try {
      // *** ASSUMPTION: Table name is 'quotes' ***
      const { error: deleteError } = await supabase.from('quotes').delete().in('id', selectedQuoteRowKeys);
      if (deleteError) throw deleteError;
      alert(`${selectedQuoteRowKeys.length} quote(s) deleted.`);
      setSelectedQuoteRowKeys([]);
      await fetchQuotes();
    } catch (err: any) {
      setErrorQuotes(err.details || err.message || "Failed to delete quotes.");
      alert(`Error deleting quotes: ${err.message}`);
    } finally {
      setIsDeletingSelectedQuotes(false);
    }
  };

  // --- Selection Handlers ---
  const handleSelectAllOrders = (checked: boolean | 'indeterminate') => {
    setSelectedOrderRowKeys(checked === true ? orders.map(o => o.id) : []);
  };
  const handleSelectOrderRow = (id: React.Key, checked: boolean | 'indeterminate') => {
    setSelectedOrderRowKeys(prev => checked === true ? [...prev, id] : prev.filter(k => k !== id));
  };
  const handleSelectAllQuotes = (checked: boolean | 'indeterminate') => {
    setSelectedQuoteRowKeys(checked === true ? quotes.map(q => q.id) : []);
  };
  const handleSelectQuoteRow = (id: React.Key, checked: boolean | 'indeterminate') => {
    setSelectedQuoteRowKeys(prev => checked === true ? [...prev, id] : prev.filter(k => k !== id));
  };

  // --- Stats Calculation (Orders Only for now) ---
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "pending_payment").length;
  const processingOrders = orders.filter(o => o.status === "processing").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;

  // --- Status Color Logic ---
  const getStatusColor = (status: string | null): string => {
    switch (status?.toLowerCase()) {
      case "pending": case "pending_payment": return "bg-yellow-100 text-yellow-800";
      case "processing": case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": case "rejected": return "bg-red-100 text-red-800";
      case "quote_sent": return "bg-purple-100 text-purple-800";
      case "quote_accepted": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error logging out:', error.message);
    }
  };

  // --- Dialog Open Handlers ---
  const handleOrderRowClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };
  const handleQuoteRowClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteDetailsDialogOpen(true);
  };

  // --- Formatting Helpers ---
  const formatServiceType = (type: string | undefined | null): string => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatStatus = (status: string | undefined | null): string => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- Render Helper for Document Links ---
  const renderDocumentLinks = (docPaths: string[] | null | undefined) => {
    if (!docPaths || docPaths.length === 0) {
      return <span className="text-xs text-gray-500">None</span>;
    }
    return (
      <ul className="list-none p-0 m-0 space-y-1">
        {docPaths.map((path, index) => {
          const filename = path.substring(path.lastIndexOf('/') + 1);
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
          const publicUrl = urlData?.publicUrl;
          if (!publicUrl) {
            return <li key={index} className="text-xs text-red-500" title={`Could not get URL for ${path}`}>{decodeURIComponent(filename)} (Error)</li>;
          }
          return (
            <li key={index}>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs" download onClick={(e) => e.stopPropagation()}>
                {decodeURIComponent(filename)}
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  // --- Main Render ---
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 text-center text-xl font-bold border-b border-gray-700">
          CreditEval Admin
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <Link
            to="#orders"
            onClick={() => setActiveView('orders')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${activeView === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-300'}`}
          >
            <ClipboardList className="mr-3 h-5 w-5" /> Orders
          </Link>
          <Link
            to="#quotes"
            onClick={() => setActiveView('quotes')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${activeView === 'quotes' ? 'bg-gray-900 text-white' : 'text-gray-300'}`}
          >
            <FileQuestion className="mr-3 h-5 w-5" /> Quotes
          </Link>
          <Link
            to="#clients"
            onClick={() => setActiveView('clients')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${activeView === 'clients' ? 'bg-gray-900 text-white' : 'text-gray-300'}`}
          >
            <UsersIcon className="mr-3 h-5 w-5" /> Clients
          </Link>
          <Link
            to="#settings"
            onClick={() => setActiveView('settings')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${activeView === 'settings' ? 'bg-gray-900 text-white' : 'text-gray-300'}`}
          >
            <Settings className="mr-3 h-5 w-5" /> Settings
          </Link>
          {/* Add Create Quote Link */}
          <Link
            to="#create-quote"
            onClick={() => setActiveView('create-quote')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 ${activeView === 'create-quote' ? 'bg-gray-900 text-white' : 'text-gray-300'}`}
          >
            <PlusCircle className="mr-3 h-5 w-5" /> Create Quote
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-navy-700">
            {activeView === 'orders' && 'Order Management'}
            {activeView === 'quotes' && 'Quote Management'}
            {activeView === 'clients' && 'Client Management'}
            {activeView === 'settings' && 'Settings'}
            {activeView === 'create-quote' && 'Create New Quote'} {/* Add title for new view */}
          </h1>
        </header>

        {/* Stats Overview */}
        {activeView === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Orders</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{pendingOrders}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Processing Orders</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{processingOrders}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Completed Orders</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{completedOrders}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div></CardContent></Card>
          </div>
        )}

        {/* Conditional Content */}
        {activeView === 'orders' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Orders</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><Input type="search" placeholder="Search orders..." className="pl-8 w-[250px]" /></div>
                  <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                  {selectedOrderRowKeys.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelectedOrders} disabled={isDeletingSelectedOrders}>
                      <Trash2 className="h-4 w-4 mr-2" />{isDeletingSelectedOrders ? 'Deleting...' : `Delete (${selectedOrderRowKeys.length})`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"><Checkbox checked={selectedQuoteRowKeys.length === quotes.length && quotes.length > 0 ? true : selectedQuoteRowKeys.length > 0 ? 'indeterminate' : false} onCheckedChange={handleSelectAllQuotes} aria-label="Select all quote rows" /></TableHead>
                    {/* Update Table Headers */}
                    <TableHead>Quote ID</TableHead><TableHead>Client</TableHead><TableHead>Service Type</TableHead><TableHead>Status</TableHead><TableHead>Price</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrders && <TableRow><TableCell colSpan={8} className="text-center">Loading orders...</TableCell></TableRow>}
                  {errorOrders && <TableRow><TableCell colSpan={8} className="text-center text-red-500">Error: {errorOrders}</TableCell></TableRow>}
                  {!loadingOrders && !errorOrders && orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedOrderRowKeys.includes(order.id)} onCheckedChange={(checked) => handleSelectOrderRow(order.id, checked)} aria-label={`Select order row ${order.id}`} /></TableCell>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell><div className="flex items-center space-x-2 cursor-pointer hover:text-primary" onClick={() => handleOrderRowClick(order)}><Avatar className="h-8 w-8"><AvatarFallback>{order.first_name?.charAt(0)}{order.last_name?.charAt(0)}</AvatarFallback></Avatar><div><div className="font-medium">{order.first_name} {order.last_name}</div><div className="text-xs text-gray-500">{order.email}</div></div></div></TableCell>
                      <TableCell><Badge className={getStatusColor(order.status)} variant="outline">{formatStatus(order.status)}</Badge></TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{renderDocumentLinks(order.document_paths)}</TableCell>
                      <TableCell>{typeof order.total_amount === 'number' ? `$${(order.total_amount / 100).toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell><div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        {/* Action Dialogs */}
                        <Dialog open={messageDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => { setMessageDialogOpen(open); if (open) setSelectedOrder(order); else if (!open && !detailsDialogOpen && !uploadDialogOpen && !statusDialogOpen) setSelectedOrder(null); }}>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" title="Message Client"><MessageSquare className="h-4 w-4" /></Button></DialogTrigger>
                          <DialogContent>
                             <DialogHeader><DialogTitle>Message Client</DialogTitle><DialogDescription>Send a message to {selectedOrder?.first_name} {selectedOrder?.last_name} regarding order {selectedOrder?.id}</DialogDescription></DialogHeader>
                             <div className="space-y-4 py-4"><div className="space-y-2"><label className="text-sm font-medium">Subject</label><Input placeholder="Order Update" /></div><div className="space-y-2"><label className="text-sm font-medium">Message</label><Textarea placeholder="Type your message here..." rows={5}/></div></div>
                             <DialogFooter><Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Cancel</Button><Button>Send Message</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={uploadDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => { setUploadDialogOpen(open); if (open) setSelectedOrder(order); else if (!open && !detailsDialogOpen && !messageDialogOpen && !statusDialogOpen) setSelectedOrder(null); }}>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" title="Upload Documents"><Upload className="h-4 w-4" /></Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Upload Documents</DialogTitle><DialogDescription>Upload completed documents for order {selectedOrder?.id}</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4"><div className="border-2 border-dashed rounded-lg p-6 text-center"><Upload className="h-8 w-8 mx-auto text-gray-400" /><p className="mt-2 text-sm text-gray-500">Drag and drop files here or click to browse</p><Input type="file" className="hidden" id="file-upload-dialog" multiple /><Button variant="outline" className="mt-4" onClick={() => document.getElementById("file-upload-dialog")?.click()}>Select Files</Button></div></div>
                            <DialogFooter><Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button><Button>Upload & Notify Client</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={statusDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => { setStatusDialogOpen(open); if (open) setSelectedOrder(order); else if (!open && !detailsDialogOpen && !messageDialogOpen && !uploadDialogOpen) setSelectedOrder(null); }}>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" title="Update Status"><MoreVertical className="h-4 w-4" /></Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Update Order Status</DialogTitle><DialogDescription>Change the status for order {selectedOrder?.id}</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4"><div className="space-y-2"><label className="text-sm font-medium">Status</label><Select defaultValue={selectedOrder?.status}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div><div className="space-y-2"><label className="text-sm font-medium">Notes</label><Textarea placeholder="Add internal notes..." rows={3}/></div><div className="flex items-center space-x-2"><Checkbox id="notify-client-status" /><label htmlFor="notify-client-status" className="text-sm">Notify client</label></div></div>
                            <DialogFooter><Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button><Button>Update Status</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between"><div className="text-sm text-gray-500">Showing {orders.length} of {orders.length} orders</div></CardFooter>
          </Card>
        )}

        {activeView === 'quotes' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Quote Requests</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><Input type="search" placeholder="Search quotes..." className="pl-8 w-[250px]" /></div>
                  <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                  {selectedQuoteRowKeys.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelectedQuotes} disabled={isDeletingSelectedQuotes}>
                      <Trash2 className="h-4 w-4 mr-2" />{isDeletingSelectedQuotes ? 'Deleting...' : `Delete (${selectedQuoteRowKeys.length})`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"><Checkbox checked={selectedQuoteRowKeys.length === quotes.length && quotes.length > 0 ? true : selectedQuoteRowKeys.length > 0 ? 'indeterminate' : false} onCheckedChange={handleSelectAllQuotes} aria-label="Select all quote rows" /></TableHead>
                    {/* Update Table Headers */}
                    <TableHead>Quote ID</TableHead><TableHead>Client</TableHead><TableHead>Service Type</TableHead><TableHead>Status</TableHead><TableHead>Price</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingQuotes && <TableRow><TableCell colSpan={7} className="text-center">Loading quotes...</TableCell></TableRow>}
                  {errorQuotes && <TableRow><TableCell colSpan={7} className="text-center text-red-500">Error: {errorQuotes}</TableCell></TableRow>}
                  {!loadingQuotes && !errorQuotes && quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedQuoteRowKeys.includes(quote.id)} onCheckedChange={(checked) => handleSelectQuoteRow(quote.id, checked)} aria-label={`Select quote row ${quote.id}`} /></TableCell>
                      <TableCell className="font-medium">{quote.id?.substring(0, 8)}...</TableCell> {/* Shorten ID display */}
                      <TableCell><div className="flex items-center space-x-2 cursor-pointer hover:text-primary" onClick={() => handleQuoteRowClick(quote)}><Avatar className="h-8 w-8"><AvatarFallback>{quote.name?.charAt(0)}</AvatarFallback></Avatar><div><div className="font-medium">{quote.name}</div><div className="text-xs text-gray-500">{quote.email}</div></div></div></TableCell>
                      <TableCell>{formatServiceType(quote.service_type)}</TableCell> {/* Use service_type */}
                      <TableCell><Badge className={getStatusColor(quote.status)} variant="outline">{formatStatus(quote.status)}</Badge></TableCell> {/* Add Status */}
                      <TableCell>${Number(quote.price || 0).toFixed(2)}</TableCell> {/* Add Price */}
                      <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                      {/* Removed Document Links Cell */}
                      <TableCell><div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => handleQuoteRowClick(quote)}><Info className="h-4 w-4" /></Button>
                        {/* Add other quote actions */}
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between"><div className="text-sm text-gray-500">Showing {quotes.length} of {quotes.length} quotes</div></CardFooter>
          </Card>
        )}

        {activeView === 'clients' && (
          <Card><CardHeader><CardTitle>Client Management</CardTitle></CardHeader><CardContent><p className="text-center py-12 text-gray-500">Client management interface...</p></CardContent></Card>
        )}
        {activeView === 'settings' && (
          <Card><CardHeader><CardTitle>Settings</CardTitle></CardHeader><CardContent><p className="text-center py-12 text-gray-500">Settings interface...</p></CardContent></Card>
        )}
        {/* Render CreateQuoteForm when active */}
        {activeView === 'create-quote' && (
           <CreateQuoteForm />
        )}
      </main>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={(open) => { setDetailsDialogOpen(open); if (!open) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Order Details - ID: {selectedOrder?.id}</DialogTitle><DialogDescription>Viewing details for order placed by {selectedOrder?.first_name} {selectedOrder?.last_name}.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Client:</span><span className="text-sm">{selectedOrder?.first_name} {selectedOrder?.last_name}</span></div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Email:</span><span className="text-sm">{selectedOrder?.email}</span></div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Order Date:</span><span className="text-sm">{selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</span></div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Status:</span><span className="text-sm">{formatStatus(selectedOrder?.status)}</span></div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Total Price:</span><span className="text-sm">{typeof selectedOrder?.total_amount === 'number' ? `$${(selectedOrder.total_amount / 100).toFixed(2)}` : 'N/A'}</span></div>

            {/* --- Add Service Details Section --- */}
            <h4 className="font-medium mt-4 border-t pt-4">Service Details</h4>
            {selectedOrder?.services && typeof selectedOrder.services === 'object' ? (
              <div className="space-y-1 pl-2">
                 <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Type:</span><span className="text-xs">{formatServiceType(selectedOrder.services.type)}</span></div>
                 {/* Conditional details */}
                 {selectedOrder.services.type === 'translation' && (
                    <>
                        <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Language From:</span><span className="text-xs">{selectedOrder.services.languageFrom || 'N/A'}</span></div>
                        <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Language To:</span><span className="text-xs">{selectedOrder.services.languageTo || 'N/A'}</span></div>
                        <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Page Count:</span><span className="text-xs">{selectedOrder.services.pageCount || 'N/A'}</span></div>
                    </>
                 )}
                 {selectedOrder.services.type === 'evaluation' && (
                    <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Evaluation Type:</span><span className="text-xs">{formatServiceType(selectedOrder.services.evaluationType)}</span></div>
                 )}
                 {selectedOrder.services.type === 'expert' && (
                    <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Visa Type:</span><span className="text-xs">{selectedOrder.services.visaType || 'N/A'}</span></div>
                 )}
                 <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Urgency:</span><span className="text-xs">{formatStatus(selectedOrder.services.urgency)}</span></div>
                 {selectedOrder.services.specialInstructions && (
                    <div className="grid grid-cols-[120px_1fr] items-start gap-2"><span className="text-xs font-medium text-muted-foreground">Instructions:</span><span className="text-xs whitespace-pre-wrap">{selectedOrder.services.specialInstructions}</span></div>
                 )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground pl-2">Service details not available.</span>
            )}
            {/* --- End Service Details Section --- */}

            <h4 className="font-medium mt-4 border-t pt-4">Documents</h4>
            {renderDocumentLinks(selectedOrder?.document_paths)}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Details Dialog */}
      <Dialog open={quoteDetailsDialogOpen} onOpenChange={(open) => { setQuoteDetailsDialogOpen(open); if (!open) setSelectedQuote(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Quote Request Details - ID: {selectedQuote?.id}</DialogTitle><DialogDescription>Viewing details for quote requested by {selectedQuote?.name}.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Update Quote Details Dialog */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Client:</span><span className="text-sm">{selectedQuote?.name}</span></div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Email:</span><span className="text-sm">{selectedQuote?.email}</span></div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Service Type:</span><span className="text-sm">{formatServiceType(selectedQuote?.service_type)}</span></div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Price:</span><span className="text-sm">${Number(selectedQuote?.price || 0).toFixed(2)}</span></div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Status:</span><span className="text-sm">{formatStatus(selectedQuote?.status)}</span></div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Created Date:</span><span className="text-sm">{selectedQuote?.created_at ? new Date(selectedQuote.created_at).toLocaleString() : 'N/A'}</span></div>
            {selectedQuote?.expires_at && (
                 <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Expires Date:</span><span className="text-sm">{new Date(selectedQuote.expires_at).toLocaleString()}</span></div>
            )}
             {selectedQuote?.staff_id && (
                 <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Staff ID:</span><span className="text-sm">{selectedQuote.staff_id}</span></div>
            )}
             {selectedQuote?.stripe_checkout_session_id && (
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4"><span className="text-sm font-medium text-muted-foreground">Stripe Session:</span><span className="text-sm">{selectedQuote.stripe_checkout_session_id}</span></div>
             )}
            {/* Add Quote URL Link */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Quote URL:</span>
              {selectedQuote?.id ? (
                <a
                  href={`${window.location.origin}/quote-payment/${selectedQuote.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {`${window.location.origin}/quote-payment/${selectedQuote.id}`}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
            </div>
            {/* End Add Quote URL Link */}
            {/* Removed old fields like phone, language, documents */}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setQuoteDetailsDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Panel */}
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg"><Bell className="h-5 w-5" /><span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span></Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
