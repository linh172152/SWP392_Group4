import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Download, 
  CheckCircle,
  X,
  Clock,
  Zap,
  Calendar,
  DollarSign,
  TrendingUp,
  Battery
} from 'lucide-react';

// Mock transaction history
const mockTransactions = [
  {
    id: 'TXN-2024-001',
    date: '2024-01-05',
    time: '14:30',
    customerName: 'John Smith',
    vehicle: 'Tesla Model 3',
    batteryOut: 'STD-001',
    batteryIn: 'STD-045',
    batteryType: 'Standard Range',
    duration: '2.5 minutes',
    status: 'completed',
    revenue: 28.50,
    staff: 'Jane Staff'
  },
  {
    id: 'TXN-2024-002',
    date: '2024-01-05',
    time: '14:25',
    customerName: 'Sarah Wilson',
    vehicle: 'BYD Tang EV',
    batteryOut: 'LR-003',
    batteryIn: 'LR-012',
    batteryType: 'Long Range',
    duration: '3.1 minutes',
    status: 'completed',
    revenue: 35.00,
    staff: 'Jane Staff'
  },
  {
    id: 'TXN-2024-003',
    date: '2024-01-05',
    time: '14:20',
    customerName: 'Mike Johnson',
    vehicle: 'Tesla Model Y',
    batteryOut: 'STD-012',
    batteryIn: 'STD-023',
    batteryType: 'Standard Range',
    duration: '1.8 minutes',
    status: 'completed',
    revenue: 28.50,
    staff: 'Jane Staff'
  },
  {
    id: 'TXN-2024-004',
    date: '2024-01-05',
    time: '13:45',
    customerName: 'Lisa Brown',
    vehicle: 'Nissan Ariya',
    batteryOut: 'STD-005',
    batteryIn: null,
    batteryType: 'Standard Range',
    duration: null,
    status: 'failed',
    revenue: 0,
    staff: 'Jane Staff',
    failureReason: 'Battery compatibility issue'
  }
];

const TransactionHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.revenue, 0);
  const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
  const avgDuration = completedTransactions.length > 0 
    ? completedTransactions.reduce((sum, t) => sum + parseFloat(t.duration?.split(' ')[0] || '0'), 0) / completedTransactions.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600">View and analyze completed battery swaps</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">{completedTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue Today</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{avgDuration.toFixed(1)} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((completedTransactions.length / filteredTransactions.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Transaction Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{transaction.id}</h3>
                        <p className="text-sm text-gray-600">{transaction.customerName} • {transaction.vehicle}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1 capitalize">{transaction.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date & Time</p>
                      <p className="font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600">{transaction.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Battery Type</p>
                      <p className="font-medium">{transaction.batteryType}</p>
                    </div>
                    {transaction.duration && (
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{transaction.duration}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Revenue</p>
                      <p className="font-medium">${transaction.revenue.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Battery Exchange Details */}
                  {transaction.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Battery className="h-4 w-4 text-red-600" />
                          <span>Out: {transaction.batteryOut}</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center space-x-2">
                          <Battery className="h-4 w-4 text-green-600" />
                          <span>In: {transaction.batteryIn}</span>
                        </div>
                        <div className="ml-auto text-gray-500">
                          Staff: {transaction.staff}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Failure Reason */}
                  {transaction.status === 'failed' && transaction.failureReason && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        <span>Failure reason: {transaction.failureReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {transaction.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      Download Receipt
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Station efficiency analysis for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{completedTransactions.length}</div>
              <div className="text-sm text-gray-600">Successful Swaps</div>
              <div className="text-xs text-green-600 mt-1">↑ 12% from yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{avgDuration.toFixed(1)} min</div>
              <div className="text-sm text-gray-600">Average Duration</div>
              <div className="text-xs text-blue-600 mt-1">↓ 0.3 min improvement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">${totalRevenue.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-xs text-purple-600 mt-1">↑ 8% from yesterday</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No transactions have been completed yet.'
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default TransactionHistory;