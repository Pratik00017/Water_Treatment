import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Bot,
  Send,
  Sparkles,
  Droplets,
  Brain,
  ShieldCheck,
  FlaskConical,
  Waves,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { chatWithAssistant } from '../services/api';

/* =========================================================
   QUICK QUESTIONS
   ========================================================= */

const suggestedQuestions = [
  'What is pH?',
  'Why is dissolved oxygen important?',
  'What does high nitrate mean?',
  'What is turbidity?',
  'How can I improve water quality?',
  'Explain my latest result.',
];

const quickTopics = [
  {
    title: 'Water Quality Parameters',
    icon: FlaskConical,
  },
  {
    title: 'Interpret Results',
    icon: Sparkles,
  },
  {
    title: 'Treatment Methods',
    icon: Droplets,
  },
  {
    title: 'Safety Guidelines',
    icon: ShieldCheck,
  },
  {
    title: 'Compare Samples',
    icon: Waves,
  },
  {
    title: 'Common Issues',
    icon: Brain,
  },
];

/* =========================================================
   RESPONSE HELPER
   ========================================================= */

function extractAssistantResponse(data) {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  return (
    data.response ||
    data.answer ||
    data.message ||
    data.reply ||
    data.text ||
    data.content ||
    ''
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function AquaAssistant() {
  const { user } =
    useAuth();

  const [messages, setMessages] =
    useState([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          `Hello ${
            user?.name || 'there'
          } 👋\n\nI am Aqua Assistant. I can help you explain water quality parameters, interpret analysis results, understand predictions, and understand recommendations.`,
      },
    ]);

  const [input, setInput] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /* =======================================================
     AUTO SCROLL
     ======================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  /* =======================================================
     SEND MESSAGE
     ======================================================= */

  const sendMessage = async (messageText) => {
    const text =
      String(messageText || '')
        .trim();

    if (!text || loading) {
      return;
    }

    setError('');
    setInput('');

    const userMessage = {
      id:
        `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setLoading(true);

    try {
      /*
       * REAL BACKEND REQUEST
       *
       * Keep this connected to the
       * existing AquaXAI /api/chat
       * backend.
       */
      const response =
        await chatWithAssistant({
          message: text,
        });

      const assistantText =
        extractAssistantResponse(
          response.data
        );

      if (!assistantText) {
        throw new Error(
          'The assistant returned an empty response.'
        );
      }

      const assistantMessage = {
        id:
          `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          assistantText,
      };

      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

    } catch (err) {
      const backendDetail =
        err.response?.data?.detail;

      let message =
        'Unable to connect to Aqua Assistant. Please check that the backend is running.';

      if (
        typeof err.userMessage ===
        'string'
      ) {
        message =
          err.userMessage;

      } else if (
        typeof backendDetail ===
        'string'
      ) {
        message =
          backendDetail;

      } else if (
        typeof err.message ===
        'string' &&
        !err.message.includes(
          'Network Error'
        )
      ) {
        message =
          err.message;
      }

      setError(message);

    } finally {
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  /* =======================================================
     FORM SUBMIT
     ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    await sendMessage(input);
  };

  /* =======================================================
     ENTER KEY
     ======================================================= */

  const handleKeyDown = (e) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendMessage(input);
    }
  };

  /* =======================================================
     QUICK QUESTION
     ======================================================= */

  const handleSuggestedQuestion = (
    question
  ) => {
    sendMessage(question);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className="aqua-assistant-page"
      style={{
        height: 'calc(100vh - 40px)',
        minHeight: '620px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >

      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div
        className="page-head"
        style={{
          flexShrink: 0,
        }}
      >
        <div>
          <h1>
            Aqua Assistant
          </h1>

          <p>
            Your AI-powered guide for
            water quality analysis,
            explanation and recommendations.
          </p>
        </div>
      </div>

      {/* =================================================
          MAIN ASSISTANT LAYOUT
          ================================================= */}

      <div
        className="aqua-assistant-layout"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) 300px',
          gap: '20px',
          flex: 1,
          minHeight: 0,
        }}
      >

        {/* ===============================================
            CHAT PANEL
            =============================================== */}

        <div
          className="aqua-assistant-chat-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: '#ffffff',
            border:
              '1px solid #dbe5ef',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow:
              '0 8px 28px rgba(8,35,63,.06)',
          }}
        >

          {/* =============================================
              CHAT HEADER
              ============================================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: '12px',
              padding:
                '16px 18px',
              borderBottom:
                '1px solid #e7eef5',
              background:
                '#fbfdff',
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >

              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius:
                    '12px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  background:
                    '#eaf5ff',
                  color:
                    '#0878f9',
                }}
              >
                <Bot
                  size={23}
                />
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    color:
                      '#14213d',
                    fontSize:
                      '15px',
                  }}
                >
                  Aqua Assistant
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '6px',
                    marginTop:
                      '3px',
                    color:
                      '#20b26b',
                    fontSize:
                      '12px',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius:
                        '50%',
                      background:
                        '#20b26b',
                    }}
                  />

                  AI Assistant
                </div>
              </div>

            </div>

          </div>

          {/* =============================================
              MESSAGES
              ============================================= */}

          <div
            className="aqua-assistant-messages"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding:
                '22px 20px',
              background:
                '#ffffff',
            }}
          >

            {messages.map(
              (message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      message.role ===
                      'user'
                        ? 'flex-end'
                        : 'flex-start',
                    marginBottom:
                      '18px',
                  }}
                >

                  {/* ===================================
                      ASSISTANT MESSAGE
                      =================================== */}

                  {message.role ===
                    'assistant' && (
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'flex-start',
                        gap: '10px',
                        maxWidth:
                          '78%',
                      }}
                    >

                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          flexShrink: 0,
                          borderRadius:
                            '50%',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          background:
                            '#eaf5ff',
                          color:
                            '#0878f9',
                        }}
                      >
                        <Bot
                          size={18}
                        />
                      </div>

                      <div
                        style={{
                          padding:
                            '12px 15px',
                          borderRadius:
                            '6px 14px 14px 14px',
                          background:
                            '#f2f7fb',
                          color:
                            '#14213d',
                          fontSize:
                            '14px',
                          lineHeight:
                            '1.6',
                          whiteSpace:
                            'pre-wrap',
                        }}
                      >
                        {message.content}
                      </div>

                    </div>
                  )}

                  {/* ===================================
                      USER MESSAGE
                      =================================== */}

                  {message.role ===
                    'user' && (
                    <div
                      style={{
                        maxWidth:
                          '72%',
                        padding:
                          '12px 15px',
                        borderRadius:
                          '14px 6px 14px 14px',
                        background:
                          '#eaf5ff',
                        color:
                          '#08233f',
                        fontSize:
                          '14px',
                        lineHeight:
                          '1.6',
                        whiteSpace:
                          'pre-wrap',
                      }}
                    >
                      {message.content}
                    </div>
                  )}

                </div>
              )
            )}

            {/* =========================================
                LOADING ANIMATION
                ========================================= */}

            {loading && (
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'flex-start',
                  gap: '10px',
                  marginBottom:
                    '18px',
                }}
              >

                {/* Assistant icon */}

                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    flexShrink: 0,
                    borderRadius:
                      '50%',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    background:
                      '#eaf5ff',
                    color:
                      '#0878f9',
                  }}
                >
                  <Bot
                    size={18}
                  />
                </div>

                {/* =================================
                    WATER THINKING LOADER
                    ================================= */}

                <div
                  className="aqua-chat-thinking"
                  style={{
                    position:
                      'relative',
                    minWidth:
                      '145px',
                    padding:
                      '14px 16px',
                    borderRadius:
                      '6px 16px 16px 16px',
                    background:
                      '#f2f7fb',
                    border:
                      '1px solid #e3edf5',
                    overflow:
                      'hidden',
                  }}
                >

                  {/* Soft water glow */}

                  <div
                    className="aqua-thinking-glow"
                  />

                  {/* Ripple circles */}

                  <div
                    className="aqua-thinking-ripple ripple-one"
                  />

                  <div
                    className="aqua-thinking-ripple ripple-two"
                  />

                  {/* Thinking row */}

                  <div
                    style={{
                      position:
                        'relative',
                      zIndex: 2,
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '10px',
                    }}
                  >

                    <div
                      className="aqua-thinking-wave"
                    >
                      <span />
                      <span />
                      <span />
                    </div>

                    <span
                      style={{
                        fontSize:
                          '13px',
                        color:
                          '#64748b',
                        fontWeight:
                          600,
                      }}
                    >
                      Aqua Assistant is thinking
                    </span>

                  </div>

                </div>

              </div>
            )}

            {/* =========================================
                ERROR
                ========================================= */}

            {error && (
              <div
                style={{
                  marginTop:
                    '4px',
                  marginBottom:
                    '14px',
                  padding:
                    '11px 13px',
                  borderRadius:
                    '9px',
                  background:
                    '#fff7f7',
                  border:
                    '1px solid #ffd6d6',
                  color:
                    '#b42318',
                  fontSize:
                    '13px',
                }}
              >
                {error}
              </div>
            )}

            <div
              ref={messagesEndRef}
            />

          </div>

          {/* =============================================
              INPUT AREA
              ============================================= */}

          <div
            style={{
              flexShrink: 0,
              borderTop:
                '1px solid #e2eaf2',
              padding:
                '14px 12px',
              background:
                '#fbfdff',
            }}
          >

            <form
              onSubmit={
                handleSubmit
              }
              style={{
                display:
                  'flex',
                alignItems:
                  'flex-end',
                gap: '10px',
              }}
            >

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={loading}
                rows={1}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  resize: 'none',
                  minHeight:
                    '56px',
                  maxHeight:
                    '130px',
                  border:
                    '1px solid #d8e3ee',
                  borderRadius:
                    '11px',
                  padding:
                    '15px 16px',
                  outline:
                    'none',
                  background:
                    '#ffffff',
                  color:
                    '#14213d',
                  fontSize:
                    '14px',
                  lineHeight:
                    '1.45',
                  fontFamily:
                    'inherit',
                }}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim()
                }
                aria-label="Send message"
                style={{
                  width: '56px',
                  height: '56px',
                  flexShrink: 0,
                  border: 'none',
                  borderRadius:
                    '11px',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  cursor:
                    loading ||
                    !input.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  background:
                    loading ||
                    !input.trim()
                      ? '#b9d4ed'
                      : '#0878f9',
                  color:
                    '#ffffff',
                  transition:
                    'all .2s ease',
                }}
              >
                <Send
                  size={20}
                />
              </button>

            </form>

            <div
              style={{
                marginTop:
                  '7px',
                color:
                  '#94a3b8',
                fontSize:
                  '11px',
              }}
            >
              Press Enter to send •
              Shift + Enter for a new line
            </div>

          </div>

        </div>

        {/* ===============================================
            RIGHT SIDE
            =============================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: '16px',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >

          {/* =============================================
              QUICK TOPICS
              ============================================= */}

          <div
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #dbe5ef',
              borderRadius:
                '16px',
              padding:
                '18px',
              boxShadow:
                '0 8px 28px rgba(8,35,63,.05)',
            }}
          >

            <h3
              style={{
                margin:
                  '0 0 5px',
                fontSize:
                  '16px',
                color:
                  '#14213d',
              }}
            >
              Quick Topics
            </h3>

            <p
              style={{
                margin:
                  '0 0 14px',
                color:
                  '#64748b',
                fontSize:
                  '12px',
                lineHeight:
                  '1.5',
              }}
            >
              Choose a topic to start a
              conversation with Aqua Assistant.
            </p>

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '8px',
              }}
            >

              {quickTopics.map(
                (topic) => {

                  const Icon =
                    topic.icon;

                  return (
                    <button
                      key={
                        topic.title
                      }
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        sendMessage(
                          topic.title
                        )
                      }
                      style={{
                        width:
                          '100%',
                        border:
                          '1px solid #e4ebf2',
                        background:
                          '#ffffff',
                        borderRadius:
                          '9px',
                        padding:
                          '10px 11px',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '9px',
                        textAlign:
                          'left',
                        cursor:
                          loading
                            ? 'not-allowed'
                            : 'pointer',
                        color:
                          '#334155',
                      }}
                    >

                      <Icon
                        size={16}
                        color="#0878f9"
                      />

                      <span
                        style={{
                          fontSize:
                            '12px',
                          fontWeight:
                            600,
                        }}
                      >
                        {
                          topic.title
                        }
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

          {/* =============================================
              SUGGESTED QUESTIONS
              ============================================= */}

          <div
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #dbe5ef',
              borderRadius:
                '16px',
              padding:
                '18px',
              boxShadow:
                '0 8px 28px rgba(8,35,63,.05)',
            }}
          >

            <h3
              style={{
                margin:
                  '0 0 12px',
                fontSize:
                  '16px',
                color:
                  '#14213d',
              }}
            >
              Suggested Questions
            </h3>

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '7px',
              }}
            >

              {suggestedQuestions.map(
                (question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleSuggestedQuestion(
                        question
                      )
                    }
                    style={{
                      border:
                        'none',
                      background:
                        '#f7fafc',
                      borderRadius:
                        '8px',
                      padding:
                        '9px 10px',
                      color:
                        '#475569',
                      fontSize:
                        '12px',
                      textAlign:
                        'left',
                      cursor:
                        loading
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {question}
                  </button>
                )
              )}

            </div>

          </div>

          {/* =============================================
              INFO CARD
              ============================================= */}

          <div
            style={{
              marginTop:
                'auto',
              padding:
                '16px',
              borderRadius:
                '14px',
              background:
                '#eaf5ff',
              border:
                '1px solid #d1eaff',
            }}
          >

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'flex-start',
                gap: '10px',
              }}
            >

              <Droplets
                size={18}
                color="#0878f9"
              />

              <div>

                <strong
                  style={{
                    display:
                      'block',
                    color:
                      '#08233f',
                    fontSize:
                      '13px',
                    marginBottom:
                      '4px',
                  }}
                >
                  AquaXAI AI Assistant
                </strong>

                <span
                  style={{
                    color:
                      '#55708a',
                    fontSize:
                      '11px',
                    lineHeight:
                      '1.5',
                  }}
                >
                  Ask questions about water
                  quality, your analysis results,
                  treatment recommendations,
                  and water parameters.
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          LOADER CSS
          ================================================= */}

      <style>{`

        /* ================================================
           THINKING GLOW
           ================================================ */

        .aqua-chat-thinking {
          animation:
            assistantLoaderAppear
            .25s
            ease-out
            both;
        }

        @keyframes assistantLoaderAppear {
          from {
            opacity: 0;
            transform:
              translateY(5px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .aqua-thinking-glow {
          position: absolute;

          width: 90px;
          height: 90px;

          left: 20px;
          top: -28px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(82,201,255,.18),
              rgba(82,201,255,0)
            );

          animation:
            thinkingGlow
            1.8s
            ease-in-out
            infinite;
        }

        @keyframes thinkingGlow {
          0%,
          100% {
            transform:
              scale(.8);
            opacity:
              .35;
          }

          50% {
            transform:
              scale(1.25);
            opacity:
              .75;
          }
        }

        /* ================================================
           RIPPLE
           ================================================ */

        .aqua-thinking-ripple {
          position: absolute;

          left: 17px;
          top: 8px;

          width: 30px;
          height: 13px;

          border:
            1px solid
            rgba(8,120,249,.25);

          border-radius:
            50%;

          opacity: 0;

          pointer-events:
            none;
        }

        .ripple-one {
          animation:
            thinkingRipple
            1.8s
            ease-out
            infinite;
        }

        .ripple-two {
          animation:
            thinkingRipple
            1.8s
            ease-out
            .8s
            infinite;
        }

        @keyframes thinkingRipple {
          0% {
            transform:
              scale(.3);
            opacity:
              .55;
          }

          70% {
            transform:
              scale(2.4);
            opacity:
              .18;
          }

          100% {
            transform:
              scale(3);
            opacity:
              0;
          }
        }

        /* ================================================
           THREE THINKING DOTS
           ================================================ */

        .aqua-thinking-wave {
          display:
            flex;

          align-items:
            center;

          gap: 4px;
        }

        .aqua-thinking-wave span {
          width: 6px;
          height: 6px;

          border-radius:
            50%;

          background:
            #0878f9;

          opacity:
            .35;

          animation:
            thinkingDots
            1.2s
            ease-in-out
            infinite;
        }

        .aqua-thinking-wave span:nth-child(2) {
          animation-delay:
            .15s;
        }

        .aqua-thinking-wave span:nth-child(3) {
          animation-delay:
            .30s;
        }

        @keyframes thinkingDots {
          0%,
          60%,
          100% {
            transform:
              translateY(0);
            opacity:
              .30;
          }

          30% {
            transform:
              translateY(-5px);
            opacity:
              1;
          }
        }

        /* ================================================
           INPUT FOCUS
           ================================================ */

        .aqua-assistant-chat-card
        textarea:focus {
          border-color:
            #0878f9 !important;

          box-shadow:
            0 0 0 3px
            rgba(8,120,249,.08);

          outline:
            none !important;
        }

        /* ================================================
           SCROLLBAR
           ================================================ */

        .aqua-assistant-messages::-webkit-scrollbar,
        .aqua-assistant-layout::-webkit-scrollbar {
          width: 7px;
        }

        .aqua-assistant-messages::-webkit-scrollbar-thumb,
        .aqua-assistant-layout::-webkit-scrollbar-thumb {
          background:
            #cbd8e5;

          border-radius:
            999px;
        }

        .aqua-assistant-messages::-webkit-scrollbar-track,
        .aqua-assistant-layout::-webkit-scrollbar-track {
          background:
            transparent;
        }

        /* ================================================
           RESPONSIVE
           ================================================ */

        @media (max-width: 900px) {

          .aqua-assistant-layout {
            grid-template-columns:
              1fr !important;

            overflow-y:
              auto !important;
          }

          .aqua-assistant-chat-card {
            min-height:
              600px !important;
          }

        }

        @media (max-width: 600px) {

          .aqua-assistant-layout {
            gap: 12px !important;
          }

          .aqua-assistant-messages {
            padding:
              16px 12px !important;
          }

          .aqua-assistant-chat-card {
            min-height:
              560px !important;
          }

        }

      `}</style>
    </div>
  );
}