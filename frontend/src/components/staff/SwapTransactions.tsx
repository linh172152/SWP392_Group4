import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Car,
  Battery,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';

// Mock queue data
const mockQueue = [
  {
    id: 'Q-001',
    customerName: 'John Smith',
    customerPhone: '+1 (555) 123-4567',
    vehicle: 'Tesla Model 3',
    licensePlate: 'ABC-123',
    batteryType: 'Standard Range',
    estimatedTime: '3 minutes',
    waitTime: '5 minutes',
    status: 'waiting',
    bay: null,
    reservationTime: '14:30'
  },
  {
    id: 'Q-002',
    customerName: 'Sarah Wilson',
    customerPhone: '+1 (555) 987-6543',
    vehicle: 'BYD Tang EV',
    licensePlate: 'XYZ-789',
    batteryType: 'Long Range',
    estimatedTime: '3.5 minutes',
    waitTime: '2 minutes',
    status: 'in-progress',
    bay: 'Bay 2',
    startTime: '14:25',
    batteryOut: 'LR-003',
    batteryIn: 'LR-012'
  },
  {
    id: 'Q-003',
    customerName: 'Mike Johnson',
    customerPhone: '+1 (555) 456-7890',
    vehicle: 'Tesla Model Y',
    licensePlate: 'DEF-456',
    batteryType: 'Performance',
    estimatedTime: '4 minutes',
    waitTime: '0 minutes',
    status: 'ready',
    bay: 'Bay 1',
    batteryAssigned: 'PERF-005'
  }
];

const SwapTransactions: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<typeof mockQueue[0] | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <RefreshCw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStartSwap = (transaction: typeof mockQueue[0]) => {
    console.log('Starting swap for:', transaction.id);
    // In a real app, this would call the API to start the swap process
  };

  const handleCompleteSwap = (transaction: typeof mockQueue[0]) => {
    console.log('Completing swap for:', transaction.id);
    // In a real app, this would call the API to complete the swap
  };

  const handleCancelSwap = (transaction: typeof mockQueue[0]) => {
    console.log('Cancelling swap for:', transaction.id);
    // In a real app, this would call the API to cancel the swap
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Swap Queue</h1>
          <p className="text-gray-600">Manage active battery swap transactions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold">{mockQueue.filter(q => q.status === 'waiting').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold">{mockQueue.filter(q => q.status === 'ready').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{mockQueue.filter(q => q.status === 'in-progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue */}
      <div className="space-y-4">
        {mockQueue.map((transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Customer & Vehicle Info */}
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{transaction.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{transaction.customerName}</h3>
                    <p className="text-sm text-gray-600">{transaction.customerPhone}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{transaction.vehicle} • {transaction.licensePlate}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Battery Type</p>
                    <p className="font-medium">{transaction.batteryType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wait Time</p>
                    <p className="font-medium">{transaction.waitTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. Duration</p>
                    <p className="font-medium">{transaction.estimatedTime}</p>
                  </div>
                  {transaction.bay && (
                    <div>
                      <p className="text-gray-500">Bay</p>
                      <p className="font-medium">{transaction.bay}</p>
                    </div>
                  )}
                  {transaction.reservationTime && (
                    <div>
                      <p className="text-gray-500">Reserved</p>
                      <p className="font-medium">{transaction.reservationTime}</p>
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end space-y-3">
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusIcon(transaction.status)}
                    <span className="ml-1 capitalize">{transaction.status.replace('-', ' ')}</span>
                  </Badge>

                  <div className="flex space-x-2">
                    {transaction.status === 'waiting' && (
                      <Button size="sm" onClick={() => handleStartSwap(transaction)}>
                        <Zap className="mr-1 h-3 w-3" />
                        Start Swap
                      </Button>
                    )}
                    {transaction.status === 'ready' && (
                      <Button size="sm" onClick={() => handleStartSwap(transaction)}>
                        <Zap className="mr-1 h-3 w-3" />
                        Begin Process
                      </Button>
                    )}
                    {transaction.status === 'in-progress' && (
                      <Button size="sm" onClick={() => handleCompleteSwap(transaction)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleCancelSwap(transaction)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Battery Exchange Info (for in-progress) */}
              {transaction.status === 'in-progress' && transaction.batteryOut && transaction.batteryIn && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                      <Battery className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Out: {transaction.batteryOut}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                      <Battery className="h-4 w-4 text-green-600" />
                      <span className="font-medium">In: {transaction.batteryIn}</span>
                    </div>
                  </div>
                  {transaction.startTime && (
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500">Started at {transaction.startTime}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Battery Assignment (for ready) */}
              {transaction.status === 'ready' && transaction.batteryAssigned && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Battery className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Assigned Battery: {transaction.batteryAssigned}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockQueue.length === 0 && (
        <Card className="p-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active transactions</h3>
          <p className="text-gray-500">
            The swap queue is empty. New customers will appear here when they arrive.
          </p>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Emergency controls and system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
              <span className="text-sm">Emergency Stop</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="text-sm">Reset Bay</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <CheckCircle className="h-6 w-6 mb-2" />
              <span className="text-sm">Manual Override</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-sm">Pause Queue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SwapTransactions;