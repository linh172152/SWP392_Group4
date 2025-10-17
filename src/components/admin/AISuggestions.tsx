import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Brain, Lightbulb, TrendingUp, MapPin } from 'lucide-react';

const AISuggestions: React.FC = () => {
  const mockSuggestions = [
    {
      id: 1,
      type: 'expansion',
      title: 'New Station Recommendation',
      description: 'High demand detected in University District. Consider opening a new station.',
      confidence: 92,
      impact: 'High',
      icon: MapPin
    },
    {
      id: 2,
      type: 'optimization',
      title: 'Battery Redistribution',
      description: 'Move 5 batteries from Mall Plaza to Downtown Hub for better utilization.',
      confidence: 87,
      impact: 'Medium',
      icon: TrendingUp
    },
    {
      id: 3,
      type: 'upgrade',
      title: 'Station Upgrade',
      description: 'Airport Terminal could benefit from 2 additional swap bays.',
      confidence: 78,
      impact: 'High',
      icon: Lightbulb
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Suggestions</h1>
        <p className="text-gray-600">AI-powered recommendations for network optimization</p>
      </div>
      
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <CardTitle className="text-purple-900">AI Insights</CardTitle>
              <CardDescription className="text-purple-700">
                Machine learning powered suggestions for your EV network
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-purple-800">
            Our AI analyzes usage patterns, demand forecasts, and operational data to provide 
            intelligent recommendations for expanding and optimizing your battery swap network.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockSuggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <CardDescription>{suggestion.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm text-gray-600">Confidence</span>
                      <div className="font-semibold text-purple-600">{suggestion.confidence}%</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Impact</span>
                      <div className={`font-semibold ${
                        suggestion.impact === 'High' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {suggestion.impact}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Accept
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Review Later
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Model Performance</CardTitle>
          <CardDescription>How our AI suggestions are performing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">73%</div>
              <div className="text-sm text-gray-600">Suggestions Implemented</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">+18%</div>
              <div className="text-sm text-gray-600">Efficiency Improvement</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISuggestions;