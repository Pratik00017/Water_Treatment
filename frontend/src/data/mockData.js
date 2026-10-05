// Isolated fallback/demo data only. Replace these adapters when the backend adds the missing endpoints.
export const demoAnalyses = [
  { id: 'demo-1', date: '30 Sep 2026, 10:24 AM', sample: 'Lake Sample', summary: 'pH 7.3 · Temp 24.5°C', status: 'Safe' },
  { id: 'demo-2', date: '28 Sep 2026, 09:15 AM', sample: 'River Sample', summary: 'pH 6.2 · Temp 22.1°C', status: 'Needs Treatment' },
  { id: 'demo-3', date: '25 Sep 2026, 11:42 AM', sample: 'Well Sample', summary: 'pH 8.1 · Temp 30.2°C', status: 'Safe' },
];

export const quickComparison = [
  { name: 'Lake Sample', pH: 7.3, Temperature: 24.5, DissolvedOxygen: 9.1, Nitrate: 0.4, Ammonia: 0.02, Turbidity: 1.2 },
  { name: 'River Sample', pH: 6.2, Temperature: 22.1, DissolvedOxygen: 7.8, Nitrate: 1.2, Ammonia: 0.08, Turbidity: 3.4 },
  { name: 'Well Sample', pH: 8.1, Temperature: 26.4, DissolvedOxygen: 8.5, Nitrate: 0.5, Ammonia: 0.04, Turbidity: 0.8 },
];
