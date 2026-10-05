import React from 'react';
import { StatusBadge } from '../common/UI';

const labels = [
  ['pH','pH'], ['Temperature','Temperature (°C)'], ['Dissolved_Oxygen','Dissolved Oxygen (mg/L)'],
  ['Nitrate','Nitrate (mg/L)'], ['Ammonia','Ammonia (mg/L)'], ['Turbidity','Turbidity (NTU)']
];

export default function ParameterTable({ input }) {
  const values = input || {};
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Parameter</th><th>Value</th><th>Recommended Range</th><th>Status</th></tr></thead><tbody>
    {labels.map(([key,label]) => <tr key={key}><td>{label}</td><td>{values[key] ?? '—'}</td><td className="muted">Not returned by backend</td><td><StatusBadge status="Not returned"/></td></tr>)}
  </tbody></table></div>;
}
