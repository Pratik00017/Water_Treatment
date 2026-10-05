import React from 'react';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingAquaAssistant() {
  const navigate = useNavigate();

  return (
    <div className="floating-aqua-assistant">

      <button
        type="button"
        className="floating-aqua-assistant-button"
        onClick={() => navigate('/assistant')}
        aria-label="Aqua Assistant"
      >
        <Bot size={23} strokeWidth={2.2} />
      </button>

      <div className="floating-aqua-assistant-tooltip">
        Aqua Assistant
      </div>

      <style>{`
        .floating-aqua-assistant {
          position: fixed;

          right: 24px;
          bottom: 24px;

          z-index: 2000;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-aqua-assistant-button {
          width: 54px;
          height: 54px;

          border: none;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #0878F9;

          color: #ffffff;

          cursor: pointer;

          box-shadow:
            0 10px 28px
            rgba(8, 120, 249, 0.28);

          transition:
            transform .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .floating-aqua-assistant-button:hover {
          transform:
            translateY(-3px)
            scale(1.04);

          background: #066bdc;

          box-shadow:
            0 14px 34px
            rgba(8, 120, 249, 0.35);
        }

        .floating-aqua-assistant-button:active {
          transform:
            translateY(0)
            scale(.98);
        }

        .floating-aqua-assistant-tooltip {
          position: absolute;

          right: 66px;

          top: 50%;

          transform:
            translateY(-50%)
            translateX(6px);

          opacity: 0;

          visibility: hidden;

          white-space: nowrap;

          padding:
            8px 12px;

          border-radius: 8px;

          background:
            #08233F;

          color:
            #ffffff;

          font-size: 13px;

          font-weight: 600;

          box-shadow:
            0 8px 22px
            rgba(0,0,0,.18);

          pointer-events: none;

          transition:
            opacity .18s ease,
            transform .18s ease,
            visibility .18s ease;
        }

        .floating-aqua-assistant:hover
        .floating-aqua-assistant-tooltip {
          opacity: 1;

          visibility: visible;

          transform:
            translateY(-50%)
            translateX(0);
        }

        .floating-aqua-assistant-tooltip::after {
          content: "";

          position: absolute;

          right: -5px;

          top: 50%;

          width: 10px;
          height: 10px;

          transform:
            translateY(-50%)
            rotate(45deg);

          background:
            #08233F;
        }

        @media (max-width: 700px) {
          .floating-aqua-assistant {
            right: 16px;
            bottom: 16px;
          }

          .floating-aqua-assistant-button {
            width: 50px;
            height: 50px;
          }

          .floating-aqua-assistant-tooltip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}