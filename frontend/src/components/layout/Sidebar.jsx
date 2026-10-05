import React, { useEffect, useState } from 'react';

import {
  LayoutDashboard,
  FlaskConical,
  GitCompare,
  History,
  FileText,
  Bot,
  User,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Analyze Water',
    path: '/analyze',
    icon: FlaskConical,
  },
  {
    label: 'Comparison',
    path: '/comparison',
    icon: GitCompare,
  },
  {
    label: 'History',
    path: '/history',
    icon: History,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: FileText,
  },
  {
    label: 'Aqua Assistant',
    path: '/assistant',
    icon: Bot,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];

/* =========================================================
   SIDEBAR
   ========================================================= */

export default function Sidebar() {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const [hidden, setHidden] = useState(() => {
    try {
      return (
        localStorage.getItem(
          'aquaxai-sidebar-hidden'
        ) === 'true'
      );
    } catch {
      return false;
    }
  });

  /* =======================================================
     SAVE SIDEBAR STATE
     ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        'aquaxai-sidebar-hidden',
        String(hidden)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [hidden]);

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      }
    } catch {
      // Continue to login even if logout request fails.
    }

    navigate('/login');
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`aquaxai-sidebar ${
          hidden
            ? 'aquaxai-sidebar-hidden'
            : ''
        }`}
      >

        {/* ===============================================
            BRAND
            =============================================== */}

        <div className="aquaxai-sidebar-brand">

          <div className="aquaxai-brand-mark">
            <DropletLogo />
          </div>

          <div className="aquaxai-brand-text">

            <strong>
              Aqua<span>XAI</span>
            </strong>

            <small>
              AI-Powered Water
              <br />
              Quality Analysis
            </small>

          </div>

        </div>

        {/* ===============================================
            HIDE SIDEBAR
            =============================================== */}

        <button
          type="button"
          className="aquaxai-sidebar-hide"
          onClick={() => setHidden(true)}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <PanelLeftClose
            size={18}
          />
        </button>

        {/* ===============================================
            NAVIGATION
            =============================================== */}

        <nav className="aquaxai-sidebar-nav">

          <div className="aquaxai-sidebar-section-label">
            MAIN MENU
          </div>

          {navigation.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `aquaxai-sidebar-link ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >

                <Icon
                  size={18}
                  strokeWidth={2}
                />

                <span>
                  {label}
                </span>

              </NavLink>
            )
          )}

        </nav>

        {/* ===============================================
            BOTTOM / LOGOUT
            =============================================== */}

        <div className="aquaxai-sidebar-bottom">

          <div className="aquaxai-sidebar-divider" />

          <button
            type="button"
            className="aquaxai-logout"
            onClick={handleLogout}
          >

            <LogOut
              size={18}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =================================================
          SHOW SIDEBAR BUTTON
          ================================================= */}

      {hidden && (
        <button
          type="button"
          className="aquaxai-sidebar-open"
          onClick={() => setHidden(false)}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <PanelLeftOpen
            size={20}
          />
        </button>
      )}

      {/* =================================================
          STYLES
          ================================================= */}

      <style>{`

        /* ===============================================
           SIDEBAR
        =============================================== */

        .aquaxai-sidebar {
          position: fixed;

          left: 0;
          top: 0;
          bottom: 0;

          width: 254px;

          z-index: 5000;

          display: flex;
          flex-direction: column;

          padding:
            20px 14px 14px;

          /* NEW SIDEBAR COLOR */
          background:
            #123B5D;

          border-right:
            1px solid
            rgba(255,255,255,.08);

          box-shadow:
            4px 0 22px
            rgba(6,27,49,.16);

          transition:
            transform .26s ease,
            box-shadow .26s ease;
        }

        /* ===============================================
           HIDDEN STATE
        =============================================== */

        .aquaxai-sidebar-hidden {
          transform:
            translateX(-100%);

          box-shadow:
            none;
        }

        /* ===============================================
           BRAND
        =============================================== */

        .aquaxai-sidebar-brand {
          display: flex;

          align-items: center;

          gap: 11px;

          padding:
            4px 7px 20px;
        }

        .aquaxai-brand-mark {
          width: 40px;
          height: 40px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius:
            11px;

          background:
            #0878F9;

          color:
            #ffffff;

          box-shadow:
            0 7px 20px
            rgba(8,120,249,.25);
        }

        .aquaxai-brand-text strong {
          display: block;

          color:
            #ffffff;

          font-size:
            18px;

          font-weight:
            800;

          line-height:
            1.1;

          letter-spacing:
            -.4px;
        }

        .aquaxai-brand-text strong span {
          color:
            #65D2FF;
        }

        .aquaxai-brand-text small {
          display: block;

          margin-top:
            4px;

          color:
            rgba(255,255,255,.64);

          font-size:
            9px;

          line-height:
            1.35;

          font-weight:
            500;
        }

        /* ===============================================
           HIDE BUTTON
        =============================================== */

        .aquaxai-sidebar-hide {
          position: absolute;

          right: 11px;
          top: 20px;

          width: 32px;
          height: 32px;

          border:
            1px solid
            rgba(255,255,255,.11);

          border-radius:
            8px;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            rgba(255,255,255,.06);

          color:
            rgba(255,255,255,.75);

          cursor:
            pointer;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .aquaxai-sidebar-hide:hover {
          background:
            rgba(255,255,255,.13);

          color:
            #ffffff;

          transform:
            scale(1.04);
        }

        /* ===============================================
           SECTION LABEL
        =============================================== */

        .aquaxai-sidebar-section-label {
          padding:
            10px 11px 7px;

          color:
            rgba(255,255,255,.40);

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            1.1px;
        }

        /* ===============================================
           NAVIGATION
        =============================================== */

        .aquaxai-sidebar-nav {
          display:
            flex;

          flex-direction:
            column;

          gap:
            5px;

          overflow-y:
            auto;

          flex:
            1;

          padding-right:
            2px;
        }

        .aquaxai-sidebar-link {
          position:
            relative;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          min-height:
            44px;

          padding:
            0 12px;

          border-radius:
            9px;

          text-decoration:
            none;

          color:
            rgba(255,255,255,.76);

          font-size:
            13px;

          font-weight:
            600;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .aquaxai-sidebar-link:hover {
          color:
            #ffffff;

          background:
            rgba(255,255,255,.08);

          transform:
            translateX(2px);
        }

        /* ===============================================
           ACTIVE MENU
        =============================================== */

        .aquaxai-sidebar-link.active {
          color:
            #ffffff;

          background:
            #0878F9;

          box-shadow:
            0 7px 18px
            rgba(8,120,249,.28);
        }

        .aquaxai-sidebar-link.active::before {
          content:
            "";

          position:
            absolute;

          left:
            0;

          top:
            9px;

          bottom:
            9px;

          width:
            3px;

          border-radius:
            0 4px 4px 0;

          background:
            #ffffff;
        }

        /* ===============================================
           BOTTOM
        =============================================== */

        .aquaxai-sidebar-bottom {
          margin-top:
            auto;
        }

        .aquaxai-sidebar-divider {
          height:
            1px;

          margin:
            12px 7px;

          background:
            rgba(255,255,255,.10);
        }

        /* ===============================================
           LOGOUT
        =============================================== */

        .aquaxai-logout {
          width:
            100%;

          min-height:
            43px;

          border:
            0;

          border-radius:
            9px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          padding:
            0 12px;

          background:
            transparent;

          color:
            rgba(255,255,255,.70);

          font-size:
            13px;

          font-weight:
            600;

          cursor:
            pointer;

          transition:
            background .18s ease,
            color .18s ease;
        }

        .aquaxai-logout:hover {
          background:
            rgba(239,68,68,.11);

          color:
            #ffbcbc;
        }

        /* ===============================================
           OPEN SIDEBAR BUTTON
        =============================================== */

        .aquaxai-sidebar-open {
          position:
            fixed;

          left:
            12px;

          top:
            50%;

          transform:
            translateY(-50%);

          z-index:
            5001;

          width:
            42px;

          height:
            42px;

          border:
            1px solid
            #d3e3ef;

          border-radius:
            10px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            #ffffff;

          color:
            #0878F9;

          cursor:
            pointer;

          box-shadow:
            0 7px 24px
            rgba(8,35,63,.15);

          transition:
            transform .18s ease,
            box-shadow .18s ease;
        }

        .aquaxai-sidebar-open:hover {
          transform:
            translateY(-50%)
            scale(1.05);

          box-shadow:
            0 10px 28px
            rgba(8,35,63,.21);
        }

        /* ===============================================
           SCROLLBAR
        =============================================== */

        .aquaxai-sidebar-nav::-webkit-scrollbar {
          width:
            5px;
        }

        .aquaxai-sidebar-nav::-webkit-scrollbar-thumb {
          background:
            rgba(255,255,255,.18);

          border-radius:
            999px;
        }

        .aquaxai-sidebar-nav::-webkit-scrollbar-track {
          background:
            transparent;
        }

        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 760px) {

          .aquaxai-sidebar {
            width:
              245px;
          }

          .aquaxai-sidebar-open {
            left:
              10px;

            width:
              40px;

            height:
              40px;
          }
        }

      `}</style>
    </>
  );
}

/* =========================================================
   WATER BRAND MARK
   ========================================================= */

function DropletLogo() {
  return (
    <svg
      width="21"
      height="24"
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 1.5C12 1.5 4 10.2 4 17.1C4 22.1 7.6 26 12 26C16.4 26 20 22.1 20 17.1C20 10.2 12 1.5 12 1.5Z"
        fill="currentColor"
      />

      <path
        d="M8.2 17.3C8.2 20.3 10.1 22.4 12.8 22.7"
        stroke="#0878F9"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".9"
      />
    </svg>
  );
}