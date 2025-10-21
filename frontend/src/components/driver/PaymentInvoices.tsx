import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  CreditCard, 
  Search, 
  Download,
  DollarSign,
  Receipt,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock payment data
const mockInvoices = [
  {
    id: 'INV-2024-001',
    date: '2024-01-05',
    amount: 28.50,
    status: 'paid',
    station: 'Downtown EV Hub',
    batteryType: 'Standard Range',
    duration: '3 minutes',
    paymentMethod: 'Visa ****1234',
    downloadUrl: '#'
  },
  {
    id: 'INV-2024-002',
    date: '2024-01-03',
    amount: 28.50,
    status: 'paid',
    station: 'Mall Plaza Station',
    batteryType: 'Standard Range',
    duration: '2.5 minutes',
    paymentMethod: 'Visa ****1234',
    downloadUrl: '#'
  },
  {
    id: 'INV-2024-003',
    date: '2024-01-01',
    amount: 35.00,
    status: 'paid',
    station: 'Highway Rest Stop',
    batteryType: 'Long Range',
    duration: '3.5 minutes',
    paymentMethod: 'Visa ****1234',
    downloadUrl: '#'
  },
  {
    id: 'INV-2023-156',
    date: '2023-12-28',
    amount: 28.50,
    status: 'overdue',
    station: 'Airport Terminal 1',
    batteryType: 'Standard Range',
    duration: '3 minutes',
    paymentMethod: 'Visa ****1234',
    downloadUrl: '#'
  }
];

const mockPaymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '1234',
    expiry: '12/26',
    isDefault: true
  },
  {
    id: '2',
    type: 'Mastercard',
    last4: '5678',
    expiry: '09/25',
    isDefault: false
  }
];

const mockSubscription = {
  plan: 'Premium',
  monthlyFee: 19.99,
  discountRate: 15,
  nextBilling: '2024-02-01',
  status: 'active'
};

const PaymentInvoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const totalSpent = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = mockInvoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = mockInvoices.filter(inv => inv.status === 'overdue');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Invoices</h1>
          <p className="text-gray-600">Manage your payment methods and billing history</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid Invoices</p>
                <p className="text-xl font-bold">{paidInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold">{overdueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{invoice.id}</h3>
                            <p className="text-sm text-gray-600">{invoice.station}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium text-lg">${invoice.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Battery Type</p>
                          <p className="font-medium">{invoice.batteryType}</p>
                          <p className="text-xs text-gray-600">Duration: {invoice.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Payment Method</p>
                          <p className="font-medium">{invoice.paymentMethod}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                      {invoice.status === 'overdue' && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockPaymentMethods.map((method) => (
              <Card key={method.id} className={method.isDefault ? 'border-blue-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{method.type} ****{method.last4}</h3>
                        <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {!method.isDefault && (
                      <Button variant="outline" size="sm" className="flex-1">
                        Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Payment Method Card */}
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-gray-50 rounded-lg inline-block mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2">Add Payment Method</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add a new credit or debit card for seamless payments
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Your active EVSwap plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{mockSubscription.plan} Plan</h3>
                    <p className="text-gray-600">${mockSubscription.monthlyFee}/month</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount on swaps</span>
                    <span className="font-medium">{mockSubscription.discountRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next billing</span>
                    <span className="font-medium">{new Date(mockSubscription.nextBilling).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
                <CardDescription>What you get with Premium</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">15% discount on all battery swaps</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Priority booking at busy stations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Extended battery health warranty</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">24/7 premium customer support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Access to premium battery types</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">This Month's Savings</h4>
                  <div className="text-2xl font-bold text-blue-600">$12.50</div>
                  <p className="text-sm text-blue-700">You've saved this much with your Premium plan</p>
                  <Progress value={75} className="mt-2" />
                  <p className="text-xs text-blue-600 mt-1">75% of monthly fee recovered</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentInvoices;