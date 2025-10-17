import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const BatteryCoordination: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Battery Coordination</h1>
        <p className="text-gray-600">Coordinate battery transfers between stations</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Battery Coordination</CardTitle>
          <CardDescription>This feature is under development</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Battery coordination functionality will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatteryCoordination;