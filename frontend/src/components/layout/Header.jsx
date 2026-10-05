import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenu }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = user?.name || 'Pratik';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="topbar">

      <div className="topbar-left">

        <button
          className="hamburger"
          onClick={onMenu}
          aria-label="Open menu"
          type="button"
        >
          <Menu size={20} />
        </button>

        <div className="search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>

      </div>


      <div className="topbar-right">

        <button
          className="icon-button"
          aria-label="Notifications"
          type="button"
        >
          <Bell size={18} />

          <span className="notification-dot" />
        </button>


        <div className="user-menu-wrapper">

          <button
            className="user-menu"
            onClick={() => setOpen((v) => !v)}
            type="button"
            aria-expanded={open}
          >
            <span className="avatar">
              {initial}
            </span>

            <span className="user-name">
              {displayName}
            </span>

            <ChevronDown
              size={15}
              className={open ? 'chevron-open' : ''}
            />
          </button>


          {open && (
            <div className="user-dropdown">

              <strong>
                {displayName}
              </strong>

              <span>
                {user?.email || 'Authenticated workspace'}
              </span>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}