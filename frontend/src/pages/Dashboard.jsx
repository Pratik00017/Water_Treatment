import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

import {
  Card,
  EmptyState,
  StatusBadge,
} from '../components/common/UI';

import WaterQualityChart from '../components/charts/WaterQualityChart';

import { useAuth } from '../context/AuthContext';

import {
  getAnalysisHistory,
} from '../services/api';

import FloatingAquaAssistant from '../components/layout/FloatingAquaAssistant';

/* =========================================================
   STATISTICS CONFIG
   ========================================================= */

const statsConfig = [
  ['Total Analyses', Activity],
  ['Safe Samples', CheckCircle2],
  ['Needs Treatment', AlertTriangle],
  ['Critical Samples', ShieldAlert],
];

/* =========================================================
   PARAMETER HELPER
   ========================================================= */

function getParameter(
  parameters,
  names
) {
  if (!parameters) {
    return null;
  }

  for (const name of names) {
    if (
      parameters[name] !== undefined &&
      parameters[name] !== null
    ) {
      const value =
        Number(parameters[name]);

      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }

  return null;
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(date) {
  if (!date) {
    return '-';
  }

  try {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  } catch {
    return date;
  }
}

/* =========================================================
   CONFIDENCE FORMAT
   Backend already returns confidence as percentage.
   Example: 96 -> 96.0%
   ========================================================= */

function formatConfidence(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'N/A';
  }

  const number =
    Number(value);

  if (Number.isNaN(number)) {
    return 'N/A';
  }

  return `${number.toFixed(1)}%`;
}

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function Dashboard() {
  const { user } =
    useAuth();

  const [
    analyses,
    setAnalyses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
     LOAD BACKEND HISTORY
     ======================================================= */

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await getAnalysisHistory();

      setAnalyses(
        response.data?.analyses || []
      );
    } catch (err) {
      setError(
        err.userMessage ||
        err.message ||
        'Unable to load analysis history.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadHistory();
  }, []);

  /* =======================================================
     STATISTICS
     ======================================================= */

  const stats = useMemo(() => {
    const total =
      analyses.length;

    const safe =
      analyses.filter(
        (item) =>
          String(
            item.status
          ).toLowerCase() ===
          'safe'
      ).length;

    const treatment =
      analyses.filter(
        (item) =>
          String(
            item.status
          ).toLowerCase() ===
          'needs treatment'
      ).length;

    const critical =
      analyses.filter(
        (item) =>
          String(
            item.status
          ).toLowerCase() ===
          'critical'
      ).length;

    return [
      ['Total Analyses', total],
      ['Safe Samples', safe],
      ['Needs Treatment', treatment],
      ['Critical Samples', critical],
    ];
  }, [analyses]);

  /* =======================================================
     CHART DATA
     ======================================================= */

  const chart = useMemo(() => {
    const latest =
      [...analyses]
        .sort(
          (a, b) =>
            new Date(a.date) -
            new Date(b.date)
        )
        .slice(-6);

    return latest.map(
      (item) => {
        const parameters =
          item.parameters || {};

        const date =
          item.date
            ? new Date(item.date)
            : null;

        return {
          month: date
            ? date.toLocaleDateString(
                'en-IN',
                {
                  month: 'short',
                }
              )
            : `#${item.id}`,

          pH:
            getParameter(
              parameters,
              [
                'pH',
                'ph',
                'Ph',
              ]
            ),

          DissolvedOxygen:
            getParameter(
              parameters,
              [
                'DissolvedOxygen',
                'dissolved_oxygen',
                'dissolvedOxygen',
                'DO',
                'do',
                'Dissolved_Oxygen',
              ]
            ),

          Nitrate:
            getParameter(
              parameters,
              [
                'Nitrate',
                'nitrate',
              ]
            ),

          Ammonia:
            getParameter(
              parameters,
              [
                'Ammonia',
                'ammonia',
              ]
            ),
        };
      }
    );
  }, [analyses]);

  /* =======================================================
     LATEST ANALYSIS
     ======================================================= */

  const latestAnalysis =
    analyses.length > 0
      ? analyses[0]
      : null;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="page-head">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Welcome back,{' '}
            {user?.name || 'Pratik'}!
            {' '}
            Let's analyze your water
            for a cleaner and healthier
            future.
          </p>

        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          className="secondary-button"
          title="Refresh history"
        >
          <RefreshCw
            size={16}
          />

          Refresh
        </button>

      </div>

      {/* =================================================
          BACKEND ERROR
          ================================================= */}

      {error && (
        <Card>

          <div className="recommendation">

            <div className="recommendation-icon">
              !
            </div>

            <div>

              <h3>
                Unable to load backend history
              </h3>

              <p>
                {error}
              </p>

            </div>

          </div>

        </Card>
      )}

      {/* =================================================
          STAT CARDS
          ================================================= */}

      <div className="stat-grid">

        {stats.map(
          ([label, value], index) => {

            const Icon =
              statsConfig[index][1];

            return (
              <Card
                key={label}
                className="stat-card"
              >

                <div className="stat-icon">
                  <Icon size={18} />
                </div>

                <div>

                  <strong>
                    {value}
                  </strong>

                  <span>
                    {label}
                  </span>

                </div>

              </Card>
            );
          }
        )}

      </div>

      {/* =================================================
          TOP TWO COLUMNS
          ================================================= */}

      <div className="two-col">

        {/* ===============================================
            WATER QUALITY OVERVIEW
            =============================================== */}

        <Card>

          <div className="section-head">

            <div>

              <h3>
                Water Quality Overview
              </h3>

              <p>
                Real analysis values from
                backend history.
              </p>

            </div>

            <select
              defaultValue="6"
              aria-label="Analysis range"
            >
              <option value="6">
                Last 6 Analyses
              </option>
            </select>

          </div>

          {loading ? (

            <EmptyState
              title="Loading history"
              message="Fetching analysis history from the backend..."
            />

          ) : chart.length === 0 ? (

            <EmptyState
              title="No analysis history"
              message="Run Analyze Water to create your first real backend analysis."
            />

          ) : (

            <WaterQualityChart
              data={chart}
            />

          )}

        </Card>

        {/* ===============================================
            LATEST ANALYSIS
            =============================================== */}

        <Card>

          <div className="section-head">

            <div>

              <h3>
                Latest Analysis Result
              </h3>

              <p>
                Most recent result from the
                backend.
              </p>

            </div>

          </div>

          {loading ? (

            <EmptyState
              title="Loading"
              message="Fetching the latest analysis..."
            />

          ) : !latestAnalysis ? (

            <EmptyState
              title="No analysis yet"
              message="Use Analyze Water to run the real /api/analyze-water endpoint."
            />

          ) : (

            <div className="latest-result">

              <div>

                <strong>
                  {
                    latestAnalysis.prediction ||
                    latestAnalysis.summary ||
                    'Analysis'
                  }
                </strong>

                <p>
                  Date:{' '}
                  {formatDate(
                    latestAnalysis.date
                  )}
                </p>

                <p>
                  Confidence:{' '}
                  {formatConfidence(
                    latestAnalysis.confidence
                  )}
                </p>

                <StatusBadge
                  status={
                    latestAnalysis.status
                  }
                />

              </div>

            </div>

          )}

        </Card>

      </div>

      {/* =================================================
          RECENT ANALYSES
          ================================================= */}

      <Card>

        <div className="section-head">

          <div>

            <h3>
              Recent Analyses
            </h3>

            <p>
              Real records stored by the
              backend.
            </p>

          </div>

          <FileText size={18} />

        </div>

        {loading ? (

          <EmptyState
            title="Loading history"
            message="Fetching records from MySQL..."
          />

        ) : analyses.length === 0 ? (

          <EmptyState
            title="No analyses found"
            message="Run an analysis from Analyze Water. The result will appear here automatically."
          />

        ) : (

          <div className="table-scroll">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Sample
                  </th>

                  <th>
                    Summary
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Confidence
                  </th>

                </tr>

              </thead>

              <tbody>

                {analyses.map(
                  (item) => (
                    <tr
                      key={item.id}
                    >

                      <td>
                        {formatDate(
                          item.date
                        )}
                      </td>

                      <td>
                        {item.sample ||
                          '-'}
                      </td>

                      <td>
                        {item.summary ||
                          item.prediction ||
                          '-'}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td>
                        {formatConfidence(
                          item.confidence
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </Card>

      {/* =================================================
          AI RECOMMENDATION
          ================================================= */}

      <Card>

        <div className="recommendation">

          <div className="recommendation-icon">
            ✓
          </div>

          <div>

            <h3>
              AI Recommendation
            </h3>

            <p>
              Recommendations are generated
              by the backend treatment engine
              after a real water analysis.
            </p>

          </div>

        </div>

      </Card>

      {/* =================================================
          FLOATING AQUA ASSISTANT
          ================================================= */}

      <FloatingAquaAssistant />

    </>
  );
}