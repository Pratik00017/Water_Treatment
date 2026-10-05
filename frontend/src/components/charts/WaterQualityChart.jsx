import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

export default function WaterQualityChart({ data }) {
  if (!data?.length) return <div className="chart-placeholder">No historical data is available yet.</div>;
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}>
    <LineChart data={data} margin={{top:10,right:10,left:-20,bottom:0}}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E7EEF5"/>
      <XAxis dataKey="month" tick={{fontSize:11}}/>
      <YAxis tick={{fontSize:11}}/>
      <Tooltip/>
      <Legend/>
      <Line type="monotone" dataKey="pH" stroke="#0878F9" strokeWidth={2} dot={false}/>
      <Line type="monotone" dataKey="DissolvedOxygen" stroke="#20B26B" strokeWidth={2} dot={false}/>
      <Line type="monotone" dataKey="Nitrate" stroke="#F4A51C" strokeWidth={2} dot={false}/>
      <Line type="monotone" dataKey="Ammonia" stroke="#EF4444" strokeWidth={2} dot={false}/>
    </LineChart>
  </ResponsiveContainer></div>;
}
