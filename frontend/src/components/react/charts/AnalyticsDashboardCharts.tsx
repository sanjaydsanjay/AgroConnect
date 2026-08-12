import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MOCK_ANALYTICS } from '../../../lib/mockData';

export const AnalyticsDashboardCharts: React.FC = () => {
  return (
    <div className="bg-white border border-[#ebebeb] rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#171717]">Top Crop Sourcing Demand Index</h3>
          <p className="text-xs text-[#8f8f8f]">Buyer search frequency & transaction volume metrics</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_ANALYTICS.topDemandedCrops} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
            <XAxis dataKey="crop" stroke="#8f8f8f" fontSize={12} tickLine={false} />
            <YAxis stroke="#8f8f8f" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#171717',
                borderRadius: '8px',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="demandIndex" fill="#171717" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
