import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AssistantButton from '../assistant/AssistantButton';

export default function PageContainer() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    <div className="main-shell">
      <Header onMenu={() => setMenuOpen(v => !v)} />
      <main className="page-content"><Outlet /></main>
    </div>
    {menuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <AssistantButton />
  </div>;
}
