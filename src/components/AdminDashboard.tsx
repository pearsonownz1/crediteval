import React, { useState } from "react";
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
} from "lucide-react";

interface Order {
  id: string;
  client: {
    name: string;
    email: string;
    avatar?: string;
  };
  service: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
  documents: number;
  price: number;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    client: {
      name: "John Smith",
      email: "john.smith@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
    service: "Diploma Translation",
    status: "pending",
    date: "2023-06-15",
    documents: 2,
    price: 120,
  },
  {
    id: "ORD-002",
    client: {
      name: "Maria Garcia",
      email: "maria.garcia@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    },
    service: "Course-by-Course Evaluation",
    status: "processing",
    date: "2023-06-12",
    documents: 5,
    price: 250,
  },
  {
    id: "ORD-003",
    client: {
      name: "Ahmed Hassan",
      email: "ahmed.hassan@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed",
    },
    service: "Transcript Translation",
    status: "completed",
    date: "2023-06-10",
    documents: 3,
    price: 150,
  },
  {
    id: "ORD-004",
    client: {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    service: "Document Verification",
    status: "cancelled",
    date: "2023-06-08",
    documents: 1,
    price: 80,
  },
  {
    id: "ORD-005",
    client: {
      name: "Li Wei",
      email: "li.wei@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=li",
    },
    service: "General Document Evaluation",
    status: "pending",
    date: "2023-06-05",
    documents: 4,
    price: 200,
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Stats for the dashboard
  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;
  const processingOrders = orders.filter(
    (order) => order.status === "processing",
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
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
            <div className="text-3xl font-bold">${totalRevenue}</div>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={order.client.avatar}
                              alt={order.client.name}
                            />
                            <AvatarFallback>
                              {order.client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {order.client.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.client.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.service}</TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(order.status)}
                          variant="outline"
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.documents}</TableCell>
                      <TableCell>${order.price}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Dialog
                            open={
                              messageDialogOpen &&
                              selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setMessageDialogOpen(open);
                              if (open) setSelectedOrder(order);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Message Client</DialogTitle>
                                <DialogDescription>
                                  Send a message to {selectedOrder?.client.name}{" "}
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

                          <Dialog
                            open={
                              uploadDialogOpen && selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setUploadDialogOpen(open);
                              if (open) setSelectedOrder(order);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
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

                          <Dialog
                            open={
                              statusDialogOpen && selectedOrder?.id === order.id
                            }
                            onOpenChange={(open) => {
                              setStatusDialogOpen(open);
                              if (open) setSelectedOrder(order);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
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
              <div className="text-sm text-gray-500">
                Showing 5 of 24 orders
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronUp className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
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

        {/* Documents Tab */}
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

        {/* Settings Tab */}
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

      {/* Notifications Panel - Could be expanded in a real implementation */}
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
