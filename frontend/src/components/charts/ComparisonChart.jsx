import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ComparisonChart({ samples }) {
  const data = ['pH','Temperature','Dissolved Oxygen','Nitrate','Ammonia','Turbidity'].map(parameter => {
    const row = { parameter };
    for (const sample of samples) row[sample.name] = parameter === 'Dissolved Oxygen' ? sample.DissolvedOxygen : sample[parameter.replaceAll(' ','')];
    return row;
  });
  return <ResponsiveContainer width="100%" height={320}>
    <BarChart data={data} margin={{top:10,right:10,left:-20,bottom:25}}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E7EEF5"/><XAxis dataKey="parameter" angle={-15} textAnchor="end" height={70} tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/>
      {samples.map((s, i) => <Bar key={s.name} dataKey={s.name} fill={['#0878F9','#20B26B','#F4A51C'][i%3]} radius={[3,3,0,0]}/>) }
    </BarChart>
  </ResponsiveContainer>;
}
