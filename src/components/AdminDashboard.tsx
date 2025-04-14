import React, { useState, useEffect } from "react"; // Import useEffect
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "../lib/supabaseClient"; // Corrected import path
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ChevronDown,
  ChevronUp,
  LogOut, // Import LogOut icon
  Info, // Import Info icon for details
  Trash2, // Import Trash icon for delete button
} from "lucide-react";

// Define a more flexible Order type based on expected Supabase columns
type Order = any;

const AdminDashboard = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [orders, setOrders] = useState<Order[]>([]); // Initialize with empty array
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false); // State for details modal
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // State for selected order IDs
  const [isDeletingSelected, setIsDeletingSelected] = useState(false); // State for deleting selected orders

  // Fetch orders function (extracted for reusability)
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch orders
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*') // Select all existing columns
        .order('created_at', { ascending: false }); // Order by most recent

      if (fetchError) {
        throw fetchError;
      }

      // Set orders directly from fetched data
      setOrders(data || []);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      // Try to get more specific error details from Supabase error object if available
      const errorMessage = err.details || err.message || "Failed to fetch orders.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Fetch orders from Supabase on component mount
  useEffect(() => {
    fetchOrders(); // Call the extracted fetchOrders function
  }, []); // Empty dependency array means this runs once on mount


  // Function to handle deleting selected orders
  const handleDeleteSelectedOrders = async () => {
    console.log("handleDeleteSelectedOrders called."); // Log function entry
    console.log("Attempting to delete IDs:", selectedRowKeys); // Log the IDs to be deleted

    if (selectedRowKeys.length === 0) {
      console.log("No rows selected, aborting delete.");
      alert("Please select orders to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRowKeys.length} selected order(s)? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSelected(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', selectedRowKeys); // Delete orders WHERE id is IN the selectedRowKeys array

      if (deleteError) {
        throw deleteError;
      }

      alert(`${selectedRowKeys.length} order(s) deleted successfully.`);
      setSelectedRowKeys([]); // Clear selection
      // Re-fetch orders to update the list
      await fetchOrders();

    } catch (err: any) {
      console.error("Detailed error deleting selected orders:", err); // Log the full error object
      const errorMessage = err.details || err.message || "Failed to delete selected orders.";
      setError(errorMessage);
      alert(`Error deleting orders. Check the console for details. Message: ${errorMessage}`); // Update alert message
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // Handle selecting/deselecting all rows
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRowKeys(orders.map(order => order.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  // Handle selecting/deselecting a single row
  const handleSelectRow = (id: React.Key, checked: boolean | 'indeterminate') => {
    setSelectedRowKeys(prev =>
      checked === true
        ? [...prev, id]
        : prev.filter(key => key !== id)
    );
  };

  // Calculate stats based on fetched orders
  const pendingOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "pending_payment", // Include pending_payment
  ).length;
  const processingOrders = orders.filter(
    (order) => order.status === "processing", // Assuming 'processing' status exists
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "completed", // Assuming 'completed' status exists
  ).length;
  // Calculate revenue based on total_amount (assuming it's in cents)
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / 100;

  const getStatusColor = (status: string | null) => { // Accept string | null
    switch (status) {
      case "pending":
      case "pending_payment": // Treat pending_payment visually like pending
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login'); // Redirect to login page after logout
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      // Optionally show an error message to the user
    }
  };

  // Function to open the details dialog
  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  // Helper function to format service type text
  const formatServiceType = (type: string | undefined | null): string => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-navy-700">Admin Dashboard</h1>
          <p className="text-gray-500">Manage orders, clients, and documents</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards remain the same */}
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Processing Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div> {/* Ensure 2 decimal places */}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Orders</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="pl-8 w-[250px]"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  {/* Delete Selected Button */}
                  {selectedRowKeys.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        console.log("Delete Selected button clicked!"); // Log button click directly
                        handleDeleteSelectedOrders();
                      }}
                      disabled={isDeletingSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeletingSelected ? 'Deleting...' : `Delete (${selectedRowKeys.length})`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"> {/* Checkbox column */}
                      <Checkbox
                        checked={selectedRowKeys.length === orders.length && orders.length > 0 ? true : selectedRowKeys.length > 0 ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    {/* <TableHead>Service</TableHead> */} {/* Removed Service column */}
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading orders...</TableCell> {/* Adjusted colSpan */}
                    </TableRow>
                  )}
                  {error && (
                     <TableRow>
                      <TableCell colSpan={8} className="text-center text-red-500">Error: {error}</TableCell> {/* Adjusted colSpan */}
                    </TableRow>
                  )}
                  {!loading && !error && orders.map((order) => (
                    <TableRow
                      key={order.id}
                      // className="cursor-pointer hover:bg-muted/50" // Remove row click for details
                      // onClick={() => handleRowClick(order)} // Remove row click for details
                    >
                       <TableCell onClick={(e) => e.stopPropagation()}> {/* Prevent row click */}
                        <Checkbox
                          checked={selectedRowKeys.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked)}
                          aria-label={`Select row ${order.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                         {/* Make client name clickable for details */}
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:text-primary"
                          onClick={() => handleRowClick(order)} // Open details on click
                        >
                          {/* Basic Avatar Fallback */}
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {order.first_name?.charAt(0) || ''}{order.last_name?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {order.first_name || ''} {order.last_name || ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Removed Service cell */}
                      {/* <TableCell>
                        {formatServiceType(order.services?.type)}
                      </TableCell> */}
                      <TableCell>
                        <Badge
                          className={getStatusColor(order.status)}
                          variant="outline"
                        >
                          {/* Format status nicely */}
                          {order.status ? order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      {/* Format date */}
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      {/* Display document links */}
                      <TableCell>
                        {order.document_paths && order.document_paths.length > 0 ? (
                          <ul className="list-none p-0 m-0 space-y-1">
                            {order.document_paths.map((path: string, index: number) => {
                              // Extract filename from path
                              const filename = path.substring(path.lastIndexOf('/') + 1);
                              // Manually construct public URL
                              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Get base URL
                              const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${path}`; // Construct URL

                              return (
                                <li key={index}>
                                  <a
                                    href={publicUrl} // Use manually constructed URL
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs"
                                    download // Optional: Suggest download
                                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
                                  >
                                    {/* Decode URI component for display */}
                                    {decodeURIComponent(filename)}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        )}
                      </TableCell>
                      {/* Format price (assuming cents), handle null/undefined */}
                      <TableCell>
                        {typeof order.total_amount === 'number'
                          ? `$${(order.total_amount / 100).toFixed(2)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {/* Keep action buttons, but stop propagation */}
                        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          {/* Message Dialog */}
                          <Dialog
                            open={
                              messageDialogOpen &&
                              selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setMessageDialogOpen(open);
                              if (open) setSelectedOrder(order);
                              else if (!open && !detailsDialogOpen && !uploadDialogOpen && !statusDialogOpen) setSelectedOrder(null); // Clear selection if no other dialogs open
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Message Client">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {/* Message Dialog Content remains the same */}
                               <DialogHeader>
                                <DialogTitle>Message Client</DialogTitle>
                                <DialogDescription>
                                  Send a message to {selectedOrder?.first_name || ''} {selectedOrder?.last_name || ''}{" "}
                                  regarding order {selectedOrder?.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Subject
                                  </label>
                                  <Input placeholder="Order Update" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Message
                                  </label>
                                  <Textarea
                                    placeholder="Type your message here..."
                                    rows={5}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setMessageDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button>Send Message</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Upload Dialog */}
                          <Dialog
                            open={
                              uploadDialogOpen && selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setUploadDialogOpen(open);
                              if (open) setSelectedOrder(order);
                               else if (!open && !detailsDialogOpen && !messageDialogOpen && !statusDialogOpen) setSelectedOrder(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Upload Documents">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {/* Upload Dialog Content remains the same */}
                               <DialogHeader>
                                <DialogTitle>Upload Documents</DialogTitle>
                                <DialogDescription>
                                  Upload completed documents for order{" "}
                                  {selectedOrder?.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-500">
                                    Drag and drop files here or click to browse
                                  </p>
                                  <Input
                                    type="file"
                                    className="hidden"
                                    id="file-upload"
                                    multiple
                                  />
                                  <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() =>
                                      document
                                        .getElementById("file-upload")
                                        ?.click()
                                    }
                                  >
                                    Select Files
                                  </Button>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setUploadDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button>Upload & Notify Client</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Status Dialog */}
                          <Dialog
                            open={
                              statusDialogOpen && selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setStatusDialogOpen(open);
                              if (open) setSelectedOrder(order);
                               else if (!open && !detailsDialogOpen && !messageDialogOpen && !uploadDialogOpen) setSelectedOrder(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Update Status">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {/* Status Dialog Content remains the same */}
                               <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                                <DialogDescription>
                                  Change the status for order{" "}
                                  {selectedOrder?.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Status
                                  </label>
                                  <Select defaultValue={selectedOrder?.status}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        Pending
                                      </SelectItem>
                                      <SelectItem value="processing">
                                        Processing
                                      </SelectItem>
                                      <SelectItem value="completed">
                                        Completed
                                      </SelectItem>
                                      <SelectItem value="cancelled">
                                        Cancelled
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Notes
                                  </label>
                                  <Textarea
                                    placeholder="Add internal notes about this status change..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="notify-client"
                                    className="rounded"
                                  />
                                  <label
                                    htmlFor="notify-client"
                                    className="text-sm"
                                  >
                                    Notify client about this status change
                                  </label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setStatusDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button>Update Status</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              {/* Pagination remains the same */}
               <div className="text-sm text-gray-500">
                Showing {orders.length} of {orders.length} orders {/* Update count dynamically */}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronUp className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled> {/* Disable next for now */}
                  Next <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Other Tabs (Clients, Documents, Settings) remain the same */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                View and manage client information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-12 text-gray-500">
                Client management interface will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Repository</CardTitle>
              <CardDescription>
                Manage all uploaded and processed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-12 text-gray-500">
                Document management interface will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system preferences and user access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-12 text-gray-500">
                Settings interface will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={(open) => {
          setDetailsDialogOpen(open);
          if (!open) setSelectedOrder(null); // Clear selected order when closing
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details - ID: {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Viewing details for order placed by {selectedOrder?.first_name} {selectedOrder?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Display Client Info */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Client:</span>
              <span className="text-sm">{selectedOrder?.first_name} {selectedOrder?.last_name}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Email:</span>
              <span className="text-sm">{selectedOrder?.email}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Order Date:</span>
              <span className="text-sm">{selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <span className="text-sm">{selectedOrder?.status ? formatServiceType(selectedOrder.status) : 'N/A'}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Total Price:</span>
              <span className="text-sm">${selectedOrder?.total_amount ? (selectedOrder.total_amount / 100).toFixed(2) : 'N/A'}</span>
            </div>

            {/* Service Details section removed */}

             {/* Display Documents in Modal */}
             <h4 className="font-medium mt-4 border-t pt-4">Documents</h4>
             {selectedOrder?.document_paths && selectedOrder.document_paths.length > 0 ? (
                <ul className="list-none p-0 m-0 space-y-1">
                  {selectedOrder.document_paths.map((path: string, index: number) => {
                    const filename = path.substring(path.lastIndexOf('/') + 1);
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${path}`;
                    return (
                      <li key={index}>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                          download
                        >
                          {decodeURIComponent(filename)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded for this order.</p>
              )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Notifications Panel - Could be expanded in a real implementation */}
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            3 {/* Example notification count */}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
