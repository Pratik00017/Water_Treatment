import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Download,
  FileText,
  Printer,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Eye,
  Trash2,
  ShieldCheck,
  FlaskConical,
  Droplets,
} from 'lucide-react';

import {
  Card,
  EmptyState,
  StatusBadge,
} from '../components/common/UI';

import { useAuth } from '../context/AuthContext';

import { getAnalysisHistory } from '../services/api';

/* =========================================================
   USER-SPECIFIC STORAGE
   ========================================================= */

function getUserStorageId(user) {
  const identity =
    user?.email ||
    user?.username ||
    user?.id ||
    user?.user_id ||
    'guest';

  return String(identity)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_');
}

function getHistoryKey(user) {
  return `aquaxai-history-${getUserStorageId(user)}`;
}

function getLatestKey(user) {
  return `aquaxai-latest-analysis-${getUserStorageId(user)}`;
}

function getSavedReportsKey(user) {
  return `aquaxai-saved-reports-${getUserStorageId(user)}`;
}

/* =========================================================
   SAFE TEXT
   ========================================================= */

function safeText(
  value,
  fallback = '-'
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        safeText(item, '')
      )
      .filter(Boolean)
      .join(', ');
  }

  if (
    typeof value === 'object'
  ) {
    return (
      value.label ||
      value.name ||
      value.value ||
      value.prediction ||
      value.water_quality ||
      value.status ||
      value.result ||
      value.message ||
      value.text ||
      value.description ||
      JSON.stringify(value)
    );
  }

  return fallback;
}

/* =========================================================
   NUMBER
   ========================================================= */

function safeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/* =========================================================
   DATE
   ========================================================= */

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return safeText(value);
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return safeText(value);
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

/* =========================================================
   GET OBJECT VALUE
   ========================================================= */

function getValue(
  object,
  names
) {
  if (!object) {
    return null;
  }

  for (
    const name of names
  ) {
    const value =
      object[name];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
}

/* =========================================================
   INPUT DATA
   ========================================================= */

function getInputValue(
  analysis,
  names
) {
  const input =
    analysis?.input_data ||
    analysis?.parameters ||
    analysis?.data ||
    analysis?.input ||
    analysis?.water_parameters ||
    analysis?.result?.input_data ||
    analysis?.result?.parameters ||
    analysis?.result?.data ||
    {};

  return getValue(
    input,
    names
  );
}

/* =========================================================
   PREDICTION
   ========================================================= */

function extractPrediction(
  analysis
) {
  const source =
    analysis?.prediction ??
    analysis?.water_quality ??
    analysis?.result?.prediction ??
    analysis?.result?.water_quality ??
    analysis?.classification ??
    analysis?.status ??
    'Not available';

  if (
    source &&
    typeof source === 'object' &&
    !Array.isArray(source)
  ) {
    return safeText(
      source.label ??
      source.status ??
      source.prediction ??
      source.water_quality ??
      source.result ??
      source.value,
      'Not available'
    );
  }

  return safeText(
    source,
    'Not available'
  );
}

/* =========================================================
   CONFIDENCE
   ========================================================= */

function extractConfidence(
  analysis
) {
  const value =
    analysis?.confidence ??
    analysis?.result?.confidence ??
    analysis?.prediction?.confidence ??
    null;

  const number =
    safeNumber(value);

  if (number === null) {
    return null;
  }

  /*
   * Backend confidence is already
   * a percentage.
   *
   * 96 -> 96%
   */

  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );
}

/* =========================================================
   EXPLANATION
   ========================================================= */

function extractExplanation(
  analysis
) {
  const value =
    analysis?.explanation ??
    analysis?.xai_explanation ??
    analysis?.shap_explanation ??
    analysis?.explanation_text ??
    analysis?.result?.explanation ??
    analysis?.result?.xai_explanation ??
    analysis?.result?.shap_explanation ??
    analysis?.summary ??
    '';

  if (!value) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {
    return value;
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) => {

        if (
          typeof item ===
          'string'
        ) {
          return item;
        }

        if (
          item &&
          typeof item ===
            'object'
        ) {
          const feature =
            item.feature ||
            item.name;

          const importance =
            safeNumber(
              item.importance
            );

          if (
            feature &&
            importance !== null
          ) {
            const direction =
              importance >= 0
                ? 'positive'
                : 'negative';

            return (
              `${feature} had a ` +
              `${direction} impact ` +
              `on the prediction ` +
              `(${importance.toFixed(3)}).`
            );
          }

          return (
            item.text ||
            item.message ||
            item.description ||
            ''
          );
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return safeText(
    value,
    ''
  );
}

/* =========================================================
   RECOMMENDATIONS
   IMPORTANT:
   BACKEND RETURNS recommended_actions
   ========================================================= */

function extractRecommendations(
  analysis
) {
  if (!analysis) {
    return [];
  }

  const candidates = [
    analysis?.recommended_actions,
    analysis?.recommendedActions,

    analysis?.recommendations,
    analysis?.recommendation,

    analysis?.treatment_recommendations,
    analysis?.treatmentRecommendations,

    analysis?.treatment,
    analysis?.actions,

    analysis?.result?.recommended_actions,
    analysis?.result?.recommendedActions,
    analysis?.result?.recommendations,
    analysis?.result?.recommendation,

    analysis?.result?.treatment_recommendations,
    analysis?.result?.treatmentRecommendations,

    analysis?.result?.treatment,
  ];

  const value =
    candidates.find(
      (item) =>
        item !== undefined &&
        item !== null &&
        item !== ''
    );

  if (
    value === undefined
  ) {
    return [];
  }

  /* -----------------------------------------------
     ARRAY
     ----------------------------------------------- */

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) => {

        if (
          typeof item ===
          'string'
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item ===
            'object'
        ) {
          return (
            item.recommendation ||
            item.action ||
            item.text ||
            item.message ||
            item.description ||
            item.title ||
            item.name ||
            ''
          )
            .toString()
            .trim();
        }

        return '';
      })
      .filter(Boolean);
  }

  /* -----------------------------------------------
     STRING
     ----------------------------------------------- */

  if (
    typeof value ===
    'string'
  ) {
    return value
      .split(/\r?\n/)
      .map((item) =>
        item
          .replace(
            /^[-•*]\s*/,
            ''
          )
          .trim()
      )
      .filter(Boolean);
  }

  /* -----------------------------------------------
     OBJECT
     ----------------------------------------------- */

  if (
    value &&
    typeof value ===
      'object'
  ) {
    const direct =
      value.recommendation ||
      value.action ||
      value.text ||
      value.message ||
      value.description ||
      value.title ||
      value.name;

    if (direct) {
      return [
        String(direct).trim(),
      ];
    }

    return Object.entries(
      value
    )
      .map(
        ([key, item]) => {
          const text =
            safeText(
              item,
              ''
            );

          if (!text) {
            return '';
          }

          return `${key}: ${text}`;
        }
      )
      .filter(Boolean);
  }

  return [];
}

/* =========================================================
   PARAMETERS
   ========================================================= */

function buildParameterRows(
  analysis
) {
  return [
    {
      parameter: 'pH',

      value:
        getInputValue(
          analysis,
          [
            'pH',
            'ph',
            'PH',
          ]
        ),

      range:
        '6.5 – 8.5',

      unit: '',
    },

    {
      parameter:
        'Temperature',

      value:
        getInputValue(
          analysis,
          [
            'Temperature',
            'temperature',
          ]
        ),

      range:
        '20 – 30',

      unit:
        '°C',
    },

    {
      parameter:
        'Dissolved Oxygen',

      value:
        getInputValue(
          analysis,
          [
            'Dissolved_Oxygen',
            'DissolvedOxygen',
            'dissolved_oxygen',
            'dissolvedOxygen',
            'DO',
            'do',
          ]
        ),

      range:
        '> 5',

      unit:
        'mg/L',
    },

    {
      parameter:
        'BOD',

      value:
        getInputValue(
          analysis,
          [
            'Biochemical_Oxygen_Demand',
            'BiochemicalOxygenDemand',
            'BOD',
            'bod',
          ]
        ),

      range:
        '< 5',

      unit:
        'mg/L',
    },

    {
      parameter:
        'Nitrate',

      value:
        getInputValue(
          analysis,
          [
            'Nitrate',
            'nitrate',
          ]
        ),

      range:
        '< 10',

      unit:
        'mg/L',
    },

    {
      parameter:
        'Ammonia',

      value:
        getInputValue(
          analysis,
          [
            'Ammonia',
            'ammonia',
          ]
        ),

      range:
        '< 1',

      unit:
        'mg/L',
    },

    {
      parameter:
        'Nitrogen',

      value:
        getInputValue(
          analysis,
          [
            'Nitrogen',
            'nitrogen',
          ]
        ),

      range:
        'Reference based',

      unit:
        'mg/L',
    },

    {
      parameter:
        'Orthophosphate',

      value:
        getInputValue(
          analysis,
          [
            'Orthophosphate',
            'orthophosphate',
          ]
        ),

      range:
        'Reference based',

      unit:
        'mg/L',
    },
  ].filter(
    (row) =>
      row.value !==
        null &&
      row.value !==
        undefined &&
      row.value !== ''
  );
}

/* =========================================================
   READ USER HISTORY
   ========================================================= */

function readUserHistory(
  user
) {
  if (!user) {
    return [];
  }

  try {
    const value =
      JSON.parse(
        localStorage.getItem(
          getHistoryKey(user)
        ) || '[]'
      );

    return Array.isArray(
      value
    )
      ? value
      : [];
  } catch {
    return [];
  }
}

/* =========================================================
   READ USER LATEST ANALYSIS
   ========================================================= */

function readUserLatest(
  user
) {
  if (!user) {
    return null;
  }

  try {
    const value =
      localStorage.getItem(
        getLatestKey(user)
      );

    return value
      ? JSON.parse(value)
      : null;
  } catch {
    return null;
  }
}

/* =========================================================
   READ USER SAVED REPORTS
   ========================================================= */

function readSavedReports(
  user
) {
  if (!user) {
    return [];
  }

  try {
    const value =
      JSON.parse(
        localStorage.getItem(
          getSavedReportsKey(user)
        ) || '[]'
      );

    return Array.isArray(
      value
    )
      ? value
      : [];
  } catch {
    return [];
  }
}

/* =========================================================
   SAVE USER REPORTS
   ========================================================= */

function saveReports(
  user,
  reports
) {
  if (!user) {
    return;
  }

  try {
    localStorage.setItem(
      getSavedReportsKey(user),
      JSON.stringify(
        reports
      )
    );
  } catch {
    // Ignore storage errors.
  }
}

/* =========================================================
   MAIN
   ========================================================= */

export default function Reports() {
  const { user } =
    useAuth();

  const [
    analyses,
    setAnalyses,
  ] = useState([]);

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState('0');

  const [
    savedReports,
    setSavedReports,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'generate'
  );

  const [
    reportType,
    setReportType,
  ] = useState(
    'Individual Analysis Report'
  );

  const [
    reportFormat,
    setReportFormat,
  ] = useState(
    'PDF'
  );

  /* =======================================================
     LOAD ACCOUNT DATA
     ======================================================= */

  const loadData =
    async () => {
      if (!user) {
        setAnalyses([]);
        setSavedReports([]);
        setSelectedIndex('0');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        /*
         * PRIMARY SOURCE:
         * account-specific local history.
         *
         * These are real results produced by
         * the backend analysis endpoint.
         */

        let userHistory =
          readUserHistory(user);

        const latest =
          readUserLatest(user);

        /*
         * Make sure the latest complete analysis
         * is available in Reports.
         */

        if (
          latest &&
          !userHistory.some(
            (item) =>
              JSON.stringify(
                item
              ) ===
              JSON.stringify(
                latest
              )
          )
        ) {
          userHistory = [
            latest,
            ...userHistory,
          ];
        }

        /*
         * OPTIONAL BACKEND HISTORY:
         *
         * Only accept records that explicitly
         * belong to the current user.
         *
         * This prevents another account's
         * unscoped backend records from being
         * shown here.
         */

        try {
          const response =
            await getAnalysisHistory();

          const serverData =
            response.data?.analyses ||
            response.data ||
            [];

          const serverList =
            Array.isArray(
              serverData
            )
              ? serverData
              : [];

          const currentEmail =
            String(
              user.email ||
              ''
            )
              .trim()
              .toLowerCase();

          const currentId =
            String(
              user.id ||
              user.user_id ||
              ''
            );

          const matchingServer =
            serverList.filter(
              (item) => {

                const itemEmail =
                  String(
                    item?.user_email ||
                    item?.email ||
                    item?.user?.email ||
                    ''
                  )
                    .trim()
                    .toLowerCase();

                const itemId =
                  String(
                    item?.user_id ||
                    item?.userId ||
                    item?.user?.id ||
                    ''
                  );

                /*
                 * Only accept the server record
                 * when identity is explicitly present.
                 */

                if (
                  currentEmail &&
                  itemEmail &&
                  currentEmail ===
                    itemEmail
                ) {
                  return true;
                }

                if (
                  currentId &&
                  itemId &&
                  currentId ===
                    itemId
                ) {
                  return true;
                }

                return false;
              }
            );

          /*
           * Add matching backend records only.
           */

          if (
            matchingServer.length
          ) {
            const merged = [
              ...matchingServer,
              ...userHistory,
            ];

            const unique = [];

            for (
              const item of merged
            ) {
              const signature =
                JSON.stringify(
                  item
                );

              if (
                !unique.some(
                  (existing) =>
                    JSON.stringify(
                      existing
                    ) ===
                    signature
                )
              ) {
                unique.push(
                  item
                );
              }
            }

            userHistory =
              unique;
          }

        } catch {
          /*
           * If backend history is unavailable,
           * keep the account-specific local history.
           */
        }

        setAnalyses(
          userHistory
        );

        setSavedReports(
          readSavedReports(user)
        );

        setSelectedIndex(
          '0'
        );

      } catch (err) {

        setError(
          err.userMessage ||
          'Unable to load your reports.'
        );

      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     LOAD WHEN ACCOUNT CHANGES
     ======================================================= */

  useEffect(() => {
    loadData();
  }, [
    user?.email,
    user?.id,
    user?.user_id,
  ]);

  /* =======================================================
     SELECTED ANALYSIS
     ======================================================= */

  const selectedAnalysis =
    useMemo(() => {

      if (
        !analyses.length
      ) {
        return null;
      }

      const index =
        Number(
          selectedIndex
        );

      return (
        analyses[index] ||
        analyses[0]
      );

    }, [
      analyses,
      selectedIndex,
    ]);

  /* =======================================================
     REPORT VALUES
     ======================================================= */

  const prediction =
    extractPrediction(
      selectedAnalysis
    );

  const confidence =
    extractConfidence(
      selectedAnalysis
    );

  const explanation =
    extractExplanation(
      selectedAnalysis
    );

  const recommendations =
    extractRecommendations(
      selectedAnalysis
    );

  const parameterRows =
    buildParameterRows(
      selectedAnalysis
    );

  const sampleName =
    safeText(
      selectedAnalysis?.sample ||
      selectedAnalysis?.sample_name ||
      getInputValue(
        selectedAnalysis,
        [
          'Sample',
          'Sample_Name',
          'sample_name',
        ]
      ) ||
      getInputValue(
        selectedAnalysis,
        [
          'Waterbody_Type',
          'waterbody_type',
        ]
      ),
      'Water Sample'
    );

  const analysisDate =
    selectedAnalysis?.date ||
    selectedAnalysis?.created_at ||
    selectedAnalysis?.createdAt ||
    new Date().toISOString();

  const waterbodyType =
    safeText(
      getInputValue(
        selectedAnalysis,
        [
          'Waterbody_Type',
          'Waterbody Type',
          'waterbody_type',
        ]
      ),
      '-'
    );

  const country =
    safeText(
      getInputValue(
        selectedAnalysis,
        [
          'Country',
          'country',
        ]
      ),
      '-'
    );

  /* =======================================================
     GENERATE REPORT
     ======================================================= */

  const generateReport =
    () => {

      if (
        !selectedAnalysis
      ) {
        setError(
          'Please select an analysis first.'
        );

        return;
      }

      setError('');

      /*
       * Save report metadata for the
       * currently logged-in user.
       */

      const report = {
        id:
          `report-${Date.now()}`,

        type:
          reportType,

        format:
          reportFormat,

        sample:
          sampleName,

        prediction:
          prediction,

        confidence:
          confidence,

        analysisDate:
          analysisDate,

        createdAt:
          new Date().toISOString(),

        analysisIndex:
          Number(
            selectedIndex
          ),
      };

      const updated = [
        report,
        ...savedReports,
      ].slice(
        0,
        20
      );

      setSavedReports(
        updated
      );

      saveReports(
        user,
        updated
      );

      setTimeout(() => {
        window.print();
      }, 150);
    };

  /* =======================================================
     DELETE SAVED REPORT
     ======================================================= */

  const deleteSavedReport =
    (reportId) => {

      const updated =
        savedReports.filter(
          (report) =>
            report.id !==
            reportId
        );

      setSavedReports(
        updated
      );

      saveReports(
        user,
        updated
      );
    };

  /* =======================================================
     VIEW SAVED REPORT
     ======================================================= */

  const viewSavedReport =
    (report) => {

      const index =
        Number(
          report.analysisIndex
        );

      if (
        Number.isFinite(index) &&
        analyses[index]
      ) {
        setSelectedIndex(
          String(index)
        );
      }

      setActiveTab(
        'generate'
      );
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="reports-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="page-head reports-page-head">

        <div>

          <h1>
            Reports
          </h1>

          <p>
            Generate and download detailed
            water quality analysis reports.
          </p>

        </div>

        <button
          type="button"
          className="reports-refresh-button"
          onClick={loadData}
          disabled={loading}
        >

          <RefreshCw
            size={16}
            className={
              loading
                ? 'reports-spin'
                : ''
            }
          />

          Refresh

        </button>

      </div>

      {/* =================================================
          MAIN
          ================================================= */}

      <div className="reports-shell">

        {/* ===============================================
            TABS
            =============================================== */}

        <div className="reports-tabs">

          <button
            type="button"
            className={
              activeTab ===
              'generate'
                ? 'reports-tab active'
                : 'reports-tab'
            }
            onClick={() =>
              setActiveTab(
                'generate'
              )
            }
          >

            <FileText
              size={17}
            />

            Generate Report

          </button>

          <button
            type="button"
            className={
              activeTab ===
              'saved'
                ? 'reports-tab active'
                : 'reports-tab'
            }
            onClick={() =>
              setActiveTab(
                'saved'
              )
            }
          >

            <Clock3
              size={17}
            />

            Saved Reports

            {savedReports.length >
              0 && (
              <span className="reports-count">
                {
                  savedReports.length
                }
              </span>
            )}

          </button>

        </div>

        {/* ===============================================
            ERROR
            =============================================== */}

        {error && (
          <div className="reports-alert">
            {safeText(
              error
            )}
          </div>
        )}

        {/* ===============================================
            GENERATE TAB
            =============================================== */}

        {activeTab ===
          'generate' && (
          <>

            {/* ===========================================
                CONTROLS
                =========================================== */}

            <div className="reports-controls">

              <div className="report-control">

                <label>
                  Report Type
                </label>

                <select
                  value={
                    reportType
                  }
                  onChange={(e) =>
                    setReportType(
                      e.target.value
                    )
                  }
                >

                  <option>
                    Individual Analysis Report
                  </option>

                  <option>
                    Detailed Water Quality Report
                  </option>

                  <option>
                    Executive Summary
                  </option>

                </select>

              </div>

              <div className="report-control">

                <label>
                  Select Analysis
                </label>

                <select
                  value={
                    selectedIndex
                  }
                  onChange={(e) =>
                    setSelectedIndex(
                      e.target.value
                    )
                  }
                  disabled={
                    loading ||
                    analyses.length === 0
                  }
                >

                  {analyses.length ===
                  0 ? (

                    <option value="">
                      No analysis available
                    </option>

                  ) : (

                    analyses.map(
                      (
                        analysis,
                        index
                      ) => (

                        <option
                          key={
                            index
                          }
                          value={
                            index
                          }
                        >

                          {safeText(
                            analysis?.sample ||
                            analysis?.sample_name ||
                            analysis?.Waterbody_Type ||
                            analysis?.waterbody_type,
                            `Analysis ${index + 1}`
                          )}

                          {' — '}

                          {formatDate(
                            analysis?.date ||
                            analysis?.created_at
                          )}

                        </option>

                      )
                    )

                  )}

                </select>

              </div>

              <div className="report-control">

                <label>
                  Report Format
                </label>

                <select
                  value={
                    reportFormat
                  }
                  onChange={(e) =>
                    setReportFormat(
                      e.target.value
                    )
                  }
                >

                  <option value="PDF">
                    PDF
                  </option>

                  <option value="Print">
                    Print
                  </option>

                </select>

              </div>

              <button
                type="button"
                className="reports-generate-button"
                onClick={
                  generateReport
                }
                disabled={
                  !selectedAnalysis
                }
              >

                <Download
                  size={17}
                />

                Generate Report

              </button>

            </div>

            {/* ===========================================
                NOTE
                =========================================== */}

            <div className="reports-generator-note">

              <ShieldCheck
                size={16}
              />

              <span>

                Report data comes from the real
                AquaXAI water analysis response
                for the current account.

                <strong>
                  {' '}
                  Save as PDF
                </strong>
                {' '}
                from the browser print dialog.

              </span>

            </div>

            {/* ===========================================
                REPORT PREVIEW
                =========================================== */}

            {loading ? (

              <div className="reports-loading">

                <RefreshCw
                  size={22}
                  className="reports-spin"
                />

                <span>
                  Loading your analysis reports...
                </span>

              </div>

            ) : selectedAnalysis ? (

              <div className="reports-preview-area">

                {/* =====================================
                    TOOLBAR
                    ===================================== */}

                <div className="reports-preview-toolbar">

                  <div>

                    <span className="preview-label">
                      REPORT PREVIEW
                    </span>

                    <h2>
                      Water Quality Analysis Report
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="preview-print-button"
                    onClick={
                      generateReport
                    }
                  >

                    <Printer
                      size={16}
                    />

                    Print / Save PDF

                  </button>

                </div>

                {/* =====================================
                    DOCUMENT
                    ===================================== */}

                <div
                  id="aquaxai-report-print"
                  className="report-document"
                >

                  {/* HEADER */}

                  <div className="report-document-header">

                    <div className="report-brand">

                      <div className="report-brand-icon">

                        <Droplets
                          size={22}
                        />

                      </div>

                      <div>

                        <strong>
                          Aqua
                          <span>
                            XAI
                          </span>
                        </strong>

                        <small>
                          AI-Powered Water Quality Analysis
                        </small>

                      </div>

                    </div>

                    <div className="report-date">

                      <span>
                        Report Date
                      </span>

                      <strong>
                        {formatDate(
                          new Date()
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="report-document-divider" />

                  {/* TITLE */}

                  <div className="report-title-block">

                    <div>

                      <span className="report-eyebrow">
                        WATER QUALITY ASSESSMENT
                      </span>

                      <h1>
                        Water Quality Analysis Report
                      </h1>

                      <p>
                        Detailed AI-assisted
                        assessment of the
                        selected water sample.
                      </p>

                    </div>

                    <div className="report-sample-chip">

                      <FlaskConical
                        size={17}
                      />

                      {sampleName}

                    </div>

                  </div>

                  {/* SAMPLE INFORMATION */}

                  <div className="report-section">

                    <div className="report-section-heading">
                      Sample Information
                    </div>

                    <div className="report-info-grid">

                      <div className="report-info-item">

                        <span>
                          Sample
                        </span>

                        <strong>
                          {sampleName}
                        </strong>

                      </div>

                      <div className="report-info-item">

                        <span>
                          Analysis Date
                        </span>

                        <strong>
                          {formatDateTime(
                            analysisDate
                          )}
                        </strong>

                      </div>

                      <div className="report-info-item">

                        <span>
                          Waterbody Type
                        </span>

                        <strong>
                          {waterbodyType}
                        </strong>

                      </div>

                      <div className="report-info-item">

                        <span>
                          Country
                        </span>

                        <strong>
                          {country}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* RESULT */}

                  <div className="report-result-grid">

                    <div className="report-result-card">

                      <span>
                        Overall Prediction
                      </span>

                      <strong>
                        {prediction}
                      </strong>

                      <div className="report-result-status">

                        <StatusBadge
                          status={
                            prediction
                          }
                        />

                      </div>

                    </div>

                    <div className="report-result-card">

                      <span>
                        Confidence Score
                      </span>

                      <strong>

                        {confidence !==
                        null
                          ? `${confidence.toFixed(
                              1
                            )}%`
                          : 'N/A'}

                      </strong>

                      {confidence !==
                        null && (

                        <div className="report-confidence-bar">

                          <span
                            style={{
                              width:
                                `${confidence}%`,
                            }}
                          />

                        </div>

                      )}

                    </div>

                  </div>

                  {/* PARAMETERS */}

                  <div className="report-section">

                    <div className="report-section-heading">
                      Parameter Results
                    </div>

                    {parameterRows.length >
                    0 ? (

                      <div className="report-table-wrap">

                        <table className="report-parameter-table">

                          <thead>

                            <tr>

                              <th>
                                Parameter
                              </th>

                              <th>
                                Value
                              </th>

                              <th>
                                Recommended Range
                              </th>

                              <th>
                                Unit
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {parameterRows.map(
                              (row) => (

                                <tr
                                  key={
                                    row.parameter
                                  }
                                >

                                  <td>

                                    <strong>
                                      {
                                        row.parameter
                                      }
                                    </strong>

                                  </td>

                                  <td>
                                    {safeText(
                                      formatValue(
                                        row.value
                                      )
                                    )}
                                  </td>

                                  <td>
                                    {row.range}
                                  </td>

                                  <td>
                                    {row.unit ||
                                      '-'}
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    ) : (

                      <div className="report-empty-section">
                        No parameter details were
                        included in this analysis.
                      </div>

                    )}

                  </div>

                  {/* EXPLANATION */}

                  <div className="report-section">

                    <div className="report-section-heading">
                      AI Explanation
                    </div>

                    <div className="report-explanation">

                      <div className="report-explanation-icon">

                        <SparkleIcon />

                      </div>

                      <div>

                        {explanation
                          ? safeText(
                              explanation
                            )
                          : 'No separate explanation was returned with this analysis.'}

                      </div>

                    </div>

                  </div>

                  {/* RECOMMENDATIONS */}

                  <div className="report-section">

                    <div className="report-section-heading">
                      Recommendations
                    </div>

                    {recommendations.length >
                    0 ? (

                      <div className="report-recommendations">

                        {recommendations.map(
                          (
                            recommendation,
                            index
                          ) => (

                            <div
                              key={
                                `${index}-${recommendation}`
                              }
                              className="report-recommendation"
                            >

                              <div className="recommendation-check">

                                <CheckCircle2
                                  size={17}
                                />

                              </div>

                              <span>
                                {safeText(
                                  recommendation
                                )}
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    ) : (

                      <div className="report-no-recommendation">

                        <CheckCircle2
                          size={17}
                        />

                        <div>

                          <strong>
                            No separate treatment action
                          </strong>

                          <span>
                            The backend did not return
                            a recommendation for this
                            particular analysis.
                          </span>

                        </div>

                      </div>

                    )}

                  </div>

                  {/* FOOTER */}

                  <div className="report-document-footer">

                    <div>
                      AquaXAI
                    </div>

                    <span>
                      AI-Powered Water Quality Analysis
                    </span>

                  </div>

                </div>

              </div>

            ) : (

              <div className="reports-empty">

                <FileText
                  size={40}
                />

                <h3>
                  No analysis available
                </h3>

                <p>
                  This account does not have
                  a completed water analysis yet.
                </p>

              </div>

            )}

          </>
        )}

        {/* ===============================================
            SAVED REPORTS
            =============================================== */}

        {activeTab ===
          'saved' && (

          <div className="saved-reports">

            {savedReports.length ===
            0 ? (

              <EmptyState
                title="No saved reports"
                message="Generate a report and it will appear here."
              />

            ) : (

              <div className="saved-report-list">

                {savedReports.map(
                  (report) => (

                    <div
                      key={
                        report.id
                      }
                      className="saved-report-row"
                    >

                      <div className="saved-report-icon">

                        <FileText
                          size={20}
                        />

                      </div>

                      <div className="saved-report-info">

                        <strong>
                          {safeText(
                            report.type
                          )}
                        </strong>

                        <span>
                          {safeText(
                            report.sample
                          )}

                          {' • '}

                          {formatDate(
                            report.analysisDate
                          )}
                        </span>

                        <small>
                          Created{' '}

                          {formatDateTime(
                            report.createdAt
                          )}
                        </small>

                      </div>

                      <div className="saved-report-result">

                        <strong>
                          {safeText(
                            report.prediction
                          )}
                        </strong>

                        <span>

                          {report.confidence !==
                          null &&
                          report.confidence !==
                            undefined
                            ? `${Number(
                                report.confidence
                              ).toFixed(
                                1
                              )}% confidence`
                            : 'Confidence unavailable'}

                        </span>

                      </div>

                      <div className="saved-report-actions">

                        <button
                          type="button"
                          onClick={() =>
                            viewSavedReport(
                              report
                            )
                          }
                          title="View report"
                        >

                          <Eye
                            size={16}
                          />

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            viewSavedReport(
                              report
                            )
                          }
                          title="Print report"
                        >

                          <Printer
                            size={16}
                          />

                        </button>

                        <button
                          type="button"
                          className="delete-report-button"
                          onClick={() =>
                            deleteSavedReport(
                              report.id
                            )
                          }
                          title="Delete report"
                        >

                          <Trash2
                            size={16}
                          />

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        )}

      </div>

      {/* =================================================
          STYLES
          ================================================= */}

      <style>{`

        .reports-page {
          width: 100%;
        }

        .reports-page-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .reports-refresh-button {
          height: 40px;

          padding:
            0 14px;

          border:
            1px solid #d6e2ed;

          border-radius:
            8px;

          background:
            #ffffff;

          color:
            #334155;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          font-size:
            13px;

          font-weight:
            700;

          cursor:
            pointer;
        }

        .reports-refresh-button:hover {
          border-color:
            #0878F9;

          color:
            #0878F9;
        }

        .reports-refresh-button:disabled {
          opacity:
            .6;

          cursor:
            not-allowed;
        }

        .reports-spin {
          animation:
            reportsSpin
            1s
            linear
            infinite;
        }

        @keyframes reportsSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .reports-shell {
          background:
            #ffffff;

          border:
            1px solid #d8e3ed;

          border-radius:
            14px;

          overflow:
            hidden;

          box-shadow:
            0 7px 24px
            rgba(8,35,63,.05);
        }

        .reports-tabs {
          display:
            flex;

          align-items:
            center;

          gap:
            2px;

          padding:
            0 22px;

          border-bottom:
            1px solid #dfe8f0;
        }

        .reports-tab {
          position:
            relative;

          height:
            59px;

          border:
            0;

          background:
            transparent;

          padding:
            0 15px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          color:
            #476078;

          font-size:
            13px;

          font-weight:
            700;

          cursor:
            pointer;
        }

        .reports-tab:hover {
          color:
            #0878F9;
        }

        .reports-tab.active {
          color:
            #0878F9;
        }

        .reports-tab.active::after {
          content:
            "";

          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            -1px;

          height:
            2px;

          background:
            #0878F9;
        }

        .reports-count {
          min-width:
            20px;

          height:
            20px;

          padding:
            0 5px;

          border-radius:
            10px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            #eaf5ff;

          color:
            #0878F9;

          font-size:
            10px;

          font-weight:
            800;
        }

        .reports-alert {
          margin:
            18px 22px 0;

          padding:
            11px 13px;

          border:
            1px solid #f4caca;

          border-radius:
            8px;

          background:
            #fff7f7;

          color:
            #b42318;

          font-size:
            13px;
        }

        .reports-controls {
          display:
            grid;

          grid-template-columns:
            minmax(190px, 1fr)
            minmax(250px, 1.25fr)
            minmax(160px, .75fr)
            auto;

          gap:
            14px;

          align-items:
            end;

          padding:
            22px;

          border-bottom:
            1px solid #e8eef4;
        }

        .report-control {
          min-width:
            0;
        }

        .report-control label {
          display:
            block;

          margin-bottom:
            7px;

          color:
            #334155;

          font-size:
            12px;

          font-weight:
            700;
        }

        .report-control select {
          width:
            100%;

          height:
            42px;

          padding:
            0 11px;

          border:
            1px solid #ccd9e5;

          border-radius:
            8px;

          background:
            #ffffff;

          color:
            #14213D;

          font-size:
            13px;

          outline:
            none;
        }

        .report-control select:focus {
          border-color:
            #0878F9;

          box-shadow:
            0 0 0 3px
            rgba(8,120,249,.08);
        }

        .reports-generate-button {
          height:
            42px;

          border:
            0;

          border-radius:
            8px;

          padding:
            0 17px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          background:
            #0878F9;

          color:
            #ffffff;

          font-size:
            13px;

          font-weight:
            800;

          white-space:
            nowrap;

          cursor:
            pointer;

          box-shadow:
            0 7px 18px
            rgba(8,120,249,.18);
        }

        .reports-generate-button:hover {
          background:
            #066fe7;
        }

        .reports-generate-button:disabled {
          opacity:
            .45;

          cursor:
            not-allowed;

          box-shadow:
            none;
        }

        .reports-generator-note {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          margin:
            18px 22px 0;

          padding:
            11px 13px;

          border:
            1px solid #dcecf8;

          border-radius:
            8px;

          background:
            #f6fbff;

          color:
            #587089;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .reports-generator-note svg {
          flex-shrink:
            0;

          color:
            #0878F9;
        }

        .reports-loading {
          min-height:
            260px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          color:
            #64748B;

          font-size:
            13px;
        }

        .reports-preview-area {
          margin:
            18px 22px 24px;

          border:
            1px solid #dbe5ee;

          border-radius:
            12px;

          background:
            #f7fafc;

          overflow:
            hidden;
        }

        .reports-preview-toolbar {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          padding:
            16px 18px;

          background:
            #ffffff;

          border-bottom:
            1px solid #dbe5ee;
        }

        .preview-label {
          display:
            block;

          margin-bottom:
            4px;

          color:
            #7c8ea1;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            1px;
        }

        .reports-preview-toolbar h2 {
          margin:
            0;

          color:
            #14213D;

          font-size:
            17px;

          font-weight:
            800;
        }

        .preview-print-button {
          height:
            38px;

          padding:
            0 12px;

          border:
            1px solid #d4e1ec;

          border-radius:
            8px;

          background:
            #ffffff;

          color:
            #334155;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          font-size:
            12px;

          font-weight:
            700;

          cursor:
            pointer;
        }

        .preview-print-button:hover {
          border-color:
            #0878F9;

          color:
            #0878F9;
        }

        .report-document {
          max-width:
            920px;

          margin:
            22px auto;

          padding:
            38px 44px;

          background:
            #ffffff;

          box-shadow:
            0 8px 32px
            rgba(8,35,63,.10);

          color:
            #14213D;
        }

        .report-document-header {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;
        }

        .report-brand {
          display:
            flex;

          align-items:
            center;

          gap:
            11px;
        }

        .report-brand-icon {
          width:
            42px;

          height:
            42px;

          border-radius:
            10px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            #eaf5ff;

          color:
            #0878F9;
        }

        .report-brand strong {
          display:
            block;

          font-size:
            19px;

          font-weight:
            800;
        }

        .report-brand strong span {
          color:
            #0878F9;
        }

        .report-brand small {
          display:
            block;

          margin-top:
            3px;

          color:
            #64748B;

          font-size:
            10px;
        }

        .report-date {
          text-align:
            right;
        }

        .report-date span {
          display:
            block;

          color:
            #7b8da0;

          font-size:
            10px;
        }

        .report-date strong {
          display:
            block;

          margin-top:
            3px;

          color:
            #14213D;

          font-size:
            12px;
        }

        .report-document-divider {
          height:
            1px;

          margin:
            24px 0;

          background:
            #dce6ef;
        }

        .report-title-block {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            20px;

          margin-bottom:
            28px;
        }

        .report-eyebrow {
          display:
            block;

          margin-bottom:
            6px;

          color:
            #0878F9;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            1px;
        }

        .report-title-block h1 {
          margin:
            0;

          color:
            #14213D;

          font-size:
            26px;

          font-weight:
            800;

          letter-spacing:
            -.5px;
        }

        .report-title-block p {
          margin:
            7px 0 0;

          color:
            #64748B;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .report-sample-chip {
          flex-shrink:
            0;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          padding:
            9px 12px;

          border:
            1px solid #d6eaf7;

          border-radius:
            8px;

          background:
            #f4fbff;

          color:
            #0878F9;

          font-size:
            11px;

          font-weight:
            700;
        }

        .report-section {
          margin-top:
            26px;
        }

        .report-section-heading {
          margin-bottom:
            11px;

          color:
            #14213D;

          font-size:
            13px;

          font-weight:
            800;
        }

        .report-info-grid {
          display:
            grid;

          grid-template-columns:
            repeat(4, 1fr);

          border:
            1px solid #dce6ef;

          border-radius:
            9px;

          overflow:
            hidden;
        }

        .report-info-item {
          min-height:
            68px;

          padding:
            12px 13px;

          border-right:
            1px solid #dce6ef;

          background:
            #fbfdff;
        }

        .report-info-item:last-child {
          border-right:
            0;
        }

        .report-info-item span {
          display:
            block;

          margin-bottom:
            5px;

          color:
            #7a8da0;

          font-size:
            10px;
        }

        .report-info-item strong {
          display:
            block;

          color:
            #14213D;

          font-size:
            12px;
        }

        .report-result-grid {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            14px;

          margin-top:
            24px;
        }

        .report-result-card {
          min-height:
            110px;

          padding:
            17px;

          border:
            1px solid #dce6ef;

          border-radius:
            10px;

          background:
            #fbfdff;
        }

        .report-result-card > span {
          display:
            block;

          color:
            #72869a;

          font-size:
            10px;

          font-weight:
            700;
        }

        .report-result-card > strong {
          display:
            block;

          margin-top:
            7px;

          color:
            #14213D;

          font-size:
            25px;

          font-weight:
            800;
        }

        .report-result-status {
          margin-top:
            9px;
        }

        .report-confidence-bar {
          height:
            5px;

          margin-top:
            13px;

          border-radius:
            999px;

          overflow:
            hidden;

          background:
            #e4edf4;
        }

        .report-confidence-bar span {
          display:
            block;

          height:
            100%;

          border-radius:
            inherit;

          background:
            #0878F9;
        }

        .report-table-wrap {
          overflow-x:
            auto;
        }

        .report-parameter-table {
          width:
            100%;

          min-width:
            620px;

          border-collapse:
            collapse;

          border:
            1px solid #dce6ef;

          font-size:
            11px;
        }

        .report-parameter-table th {
          padding:
            10px 11px;

          text-align:
            left;

          background:
            #f2f7fb;

          border-bottom:
            1px solid #dce6ef;

          color:
            #52697f;

          font-size:
            10px;

          font-weight:
            800;
        }

        .report-parameter-table td {
          padding:
            10px 11px;

          border-bottom:
            1px solid #e4ebf1;

          color:
            #334155;
        }

        .report-parameter-table tr:last-child td {
          border-bottom:
            0;
        }

        .report-parameter-table td strong {
          color:
            #14213D;
        }

        .report-explanation {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            12px;

          padding:
            15px;

          border:
            1px solid #dce6ef;

          border-radius:
            9px;

          background:
            #fbfdff;

          color:
            #475569;

          font-size:
            12px;

          line-height:
            1.65;

          white-space:
            pre-wrap;
        }

        .report-explanation-icon {
          width:
            32px;

          height:
            32px;

          flex-shrink:
            0;

          border-radius:
            8px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            #eaf5ff;

          color:
            #0878F9;
        }

        .report-recommendations {
          display:
            flex;

          flex-direction:
            column;

          gap:
            8px;
        }

        .report-recommendation {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          padding:
            12px 13px;

          border:
            1px solid #d9eee4;

          border-radius:
            9px;

          background:
            #f7fcf9;

          color:
            #315247;

          font-size:
            12px;

          line-height:
            1.55;
        }

        .recommendation-check {
          width:
            24px;

          height:
            24px;

          flex-shrink:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #e4f7ec;

          color:
            #20B26B;
        }

        .report-no-recommendation {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          padding:
            13px;

          border:
            1px solid #e3e9ee;

          border-radius:
            9px;

          background:
            #fafcfd;

          color:
            #64748B;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .report-no-recommendation svg {
          flex-shrink:
            0;

          color:
            #94a3b8;
        }

        .report-no-recommendation strong {
          display:
            block;

          color:
            #475569;

          margin-bottom:
            3px;
        }

        .report-no-recommendation span {
          display:
            block;
        }

        .report-empty-section {
          padding:
            13px;

          border:
            1px solid #e3e9ee;

          border-radius:
            8px;

          background:
            #fafcfd;

          color:
            #64748B;

          font-size:
            12px;
        }

        .report-document-footer {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          margin-top:
            32px;

          padding-top:
            14px;

          border-top:
            1px solid #dce6ef;

          color:
            #7b8da0;

          font-size:
            9px;
        }

        .report-document-footer div {
          color:
            #0878F9;

          font-weight:
            800;
        }

        .reports-empty {
          min-height:
            320px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          text-align:
            center;

          color:
            #64748B;
        }

        .reports-empty svg {
          color:
            #0878F9;

          margin-bottom:
            12px;
        }

        .reports-empty h3 {
          margin:
            0 0 6px;

          color:
            #14213D;
        }

        .reports-empty p {
          margin:
            0;

          font-size:
            13px;
        }

        .saved-reports {
          padding:
            22px;
        }

        .saved-report-list {
          display:
            flex;

          flex-direction:
            column;

          gap:
            9px;
        }

        .saved-report-row {
          display:
            grid;

          grid-template-columns:
            44px
            minmax(220px, 1fr)
            150px
            auto;

          align-items:
            center;

          gap:
            13px;

          padding:
            13px;

          border:
            1px solid #dce6ef;

          border-radius:
            10px;

          background:
            #ffffff;
        }

        .saved-report-row:hover {
          border-color:
            #bfd7eb;

          box-shadow:
            0 5px 16px
            rgba(8,35,63,.05);
        }

        .saved-report-icon {
          width:
            40px;

          height:
            40px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            9px;

          background:
            #eaf5ff;

          color:
            #0878F9;
        }

        .saved-report-info strong {
          display:
            block;

          color:
            #14213D;

          font-size:
            13px;
        }

        .saved-report-info span {
          display:
            block;

          margin-top:
            3px;

          color:
            #52697f;

          font-size:
            11px;
        }

        .saved-report-info small {
          display:
            block;

          margin-top:
            3px;

          color:
            #94a3b8;

          font-size:
            10px;
        }

        .saved-report-result {
          text-align:
            right;
        }

        .saved-report-result strong {
          display:
            block;

          color:
            #14213D;

          font-size:
            12px;
        }

        .saved-report-result span {
          display:
            block;

          margin-top:
            3px;

          color:
            #64748B;

          font-size:
            10px;
        }

        .saved-report-actions {
          display:
            flex;

          align-items:
            center;

          gap:
            5px;
        }

        .saved-report-actions button {
          width:
            34px;

          height:
            34px;

          border:
            1px solid #dbe5ee;

          border-radius:
            7px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            #ffffff;

          color:
            #50677d;

          cursor:
            pointer;
        }

        .saved-report-actions button:hover {
          border-color:
            #0878F9;

          color:
            #0878F9;
        }

        .saved-report-actions
        .delete-report-button:hover {
          border-color:
            #ef4444;

          color:
            #ef4444;
        }

        @media (max-width: 1000px) {

          .reports-controls {
            grid-template-columns:
              1fr 1fr;
          }

          .reports-generate-button {
            width:
              100%;
          }

          .report-info-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .report-info-item:nth-child(2) {
            border-right:
              0;
          }

          .report-info-item:nth-child(-n+2) {
            border-bottom:
              1px solid #dce6ef;
          }

          .saved-report-row {
            grid-template-columns:
              44px
              1fr
              auto;
          }

          .saved-report-result {
            display:
              none;
          }

        }

        @media (max-width: 700px) {

          .reports-page-head {
            align-items:
              flex-start;
          }

          .reports-refresh-button {
            display:
              none;
          }

          .reports-tabs {
            padding:
              0 10px;
          }

          .reports-controls {
            grid-template-columns:
              1fr;

            padding:
              16px;
          }

          .reports-generator-note {
            margin:
              16px;
          }

          .reports-preview-area {
            margin:
              16px;
          }

          .reports-preview-toolbar {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .report-document {
            margin:
              10px;

            padding:
              25px 20px;
          }

          .report-document-header,
          .report-title-block {
            flex-direction:
              column;
          }

          .report-date {
            text-align:
              left;
          }

          .report-info-grid {
            grid-template-columns:
              1fr;
          }

          .report-info-item {
            border-right:
              0;

            border-bottom:
              1px solid #dce6ef;
          }

          .report-info-item:last-child {
            border-bottom:
              0;
          }

          .report-result-grid {
            grid-template-columns:
              1fr;
          }

          .saved-report-row {
            grid-template-columns:
              40px
              1fr;
          }

          .saved-report-actions {
            grid-column:
              2;
          }

        }

        @media print {

          @page {
            size:
              A4;

            margin:
              12mm;
          }

          html,
          body {
            background:
              #ffffff !important;
          }

          body * {
            visibility:
              hidden !important;
          }

          #aquaxai-report-print,
          #aquaxai-report-print * {
            visibility:
              visible !important;
          }

          #aquaxai-report-print {
            position:
              absolute;

            left:
              0;

            top:
              0;

            width:
              100%;

            max-width:
              none;

            margin:
              0;

            padding:
              0;

            box-shadow:
              none;
          }

          .reports-page,
          .reports-shell,
          .reports-preview-area {
            background:
              #ffffff !important;

            border:
              0 !important;

            box-shadow:
              none !important;
          }

        }

      `}</style>

    </div>
  );
}

/* =========================================================
   FORMAT VALUE
   ========================================================= */

function formatValue(
  value
) {
  const number =
    safeNumber(value);

  if (
    number !== null
  ) {
    return Number.isInteger(
      number
    )
      ? String(number)
      : number.toFixed(2);
  }

  return safeText(
    value
  );
}

/* =========================================================
   SPARKLE ICON
   ========================================================= */

function SparkleIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >

      <path
        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
        fill="currentColor"
      />

      <path
        d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z"
        fill="currentColor"
        opacity=".7"
      />

    </svg>
  );
}