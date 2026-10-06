import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Calendar,
  Eye,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';

import {
  Card,
  StatusBadge,
} from '../components/common/UI';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

import {
  getAnalysisHistory,
} from '../services/api';

/* =========================================================
   HELPERS
   ========================================================= */

function safeText(value, fallback = '-') {
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
      .map((item) => safeText(item, ''))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return (
      value.label ||
      value.name ||
      value.prediction ||
      value.water_quality ||
      value.status ||
      value.result ||
      value.message ||
      value.text ||
      JSON.stringify(value)
    );
  }

  return fallback;
}

function getPrediction(item) {
  const prediction = item?.prediction;

  if (
    prediction &&
    typeof prediction === 'object'
  ) {
    return safeText(
      prediction.label ||
        prediction.status ||
        prediction.prediction ||
        prediction.water_quality ||
        prediction.result,
      'Unknown'
    );
  }

  return safeText(
    prediction ||
      item?.water_quality ||
      item?.classification ||
      item?.status,
    'Unknown'
  );
}

function getStatus(item) {
  const status = safeText(
    item?.status ||
      getPrediction(item),
    'Unknown'
  );

  const lower = status.toLowerCase();

  if (
    lower.includes('critical') ||
    lower.includes('unsafe')
  ) {
    return 'Critical';
  }

  if (
    lower.includes('treatment') ||
    lower.includes('poor') ||
    lower.includes('warning')
  ) {
    return 'Needs Treatment';
  }

  if (
    lower.includes('safe') ||
    lower.includes('good') ||
    lower.includes('excellent')
  ) {
    return 'Safe';
  }

  return status;
}

function getDateValue(item) {
  return (
    item?.created_at ||
    item?.createdAt ||
    item?.date ||
    null
  );
}

function formatDate(item) {
  const value = getDateValue(item);

  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safeText(value, '-');
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

function getSampleName(item) {
  const parameters =
    item?.parameters ||
    item?.input_data ||
    {};

  return safeText(
    item?.sample_name ||
      item?.sampleName ||
      item?.sample ||
      parameters?.Sample ||
      parameters?.Sample_Name ||
      parameters?.Waterbody_Type ||
      parameters?.Waterbody_Type ||
      'Water Sample',
    'Water Sample'
  );
}

function getParameters(item) {
  return (
    item?.parameters ||
    item?.input_data ||
    {}
  );
}

function getParameter(
  parameters,
  names
) {
  for (const name of names) {
    if (
      parameters?.[name] !==
        undefined &&
      parameters?.[name] !== null &&
      parameters?.[name] !== ''
    ) {
      return parameters[name];
    }
  }

  return null;
}

function getUserId(user) {
  const id =
    user?.id ??
    user?.user_id ??
    null;

  if (
    id === null ||
    id === undefined ||
    id === ''
  ) {
    return null;
  }

  return String(id);
}

/* =========================================================
   MAIN HISTORY PAGE
   ========================================================= */

export default function History() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [history, setHistory] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('All Status');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD REAL BACKEND HISTORY
     ======================================================= */

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');

      /*
       * Authentication is required because
       * backend /history filters by X-User-ID.
       */
      const userId = getUserId(user);

      if (!user) {
        setHistory([]);
        setError(
          'Please sign in to view your analysis history.'
        );
        return;
      }

      if (!userId) {
        setHistory([]);
        setError(
          'Your account ID is missing. Please sign out and sign in again.'
        );
        return;
      }

      /*
       * getAnalysisHistory() uses the Axios interceptor
       * from services/api.js.
       *
       * The interceptor reads aquaxai-user and sends:
       *
       * X-User-ID: <logged-in-user-id>
       */
      const response =
        await getAnalysisHistory();

      const backendHistory =
        response?.data?.analyses;

      const records =
        Array.isArray(backendHistory)
          ? backendHistory
          : [];

      setHistory(records);

      /*
       * The backend is now the source of truth.
       */
      console.log(
        'AquaXAI backend history:',
        records
      );
    } catch (err) {
      console.error(
        'Failed to load analysis history:',
        err
      );

      setHistory([]);

      setError(
        err?.userMessage ||
          err?.response?.data?.detail ||
          'Unable to load your analysis history.'
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
  }, [
    user?.id,
    user?.user_id,
    user?.email,
  ]);

  /* =======================================================
     FILTER HISTORY
     ======================================================= */

  const filteredHistory =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return history.filter(
        (item) => {
          const prediction =
            getPrediction(item);

          const sample =
            getSampleName(item);

          const status =
            getStatus(item);

          const parameters =
            getParameters(item);

          const searchable = [
            prediction,
            sample,
            status,
            parameters?.Country,
            parameters?.Waterbody_Type,
            parameters?.pH,
            parameters?.Temperature,
            parameters?.Nitrate,
            parameters?.Ammonia,
            parameters?.Nitrogen,
            parameters?.BOD,
            parameters?.DO,
          ]
            .map((value) =>
              safeText(value, '')
            )
            .join(' ')
            .toLowerCase();

          const searchMatch =
            !query ||
            searchable.includes(query);

          const statusMatch =
            statusFilter ===
              'All Status' ||
            status
              .toLowerCase()
              .includes(
                statusFilter.toLowerCase()
              );

          return (
            searchMatch &&
            statusMatch
          );
        }
      );
    }, [
      history,
      search,
      statusFilter,
    ]);

  /* =======================================================
     VIEW ANALYSIS
     ======================================================= */

  const viewAnalysis = (item) => {
    if (!item) {
      return;
    }

    /*
     * Save the selected backend record as the
     * current result for compatibility with
     * AnalysisResult.jsx.
     */
    try {
      const latestUserId =
        getUserId(user);

      const userKey =
        latestUserId || 'guest';

      localStorage.setItem(
        `aquaxai-latest-analysis-${userKey}`,
        JSON.stringify(item)
      );

      localStorage.setItem(
        `aquaxai-analysis-result-${userKey}`,
        JSON.stringify(item)
      );
    } catch (storageError) {
      console.error(
        'Unable to cache selected analysis:',
        storageError
      );
    }

    /*
     * Also pass the actual backend object
     * through React Router state.
     */
    navigate(
      '/analysis-result',
      {
        state: {
          analysis: item,
          result: item,
          data: item,
        },
      }
    );
  };

  /* =======================================================
     EMPTY MESSAGE
     ======================================================= */

  const hasHistory =
    history.length > 0;

  const hasFilteredHistory =
    filteredHistory.length > 0;

  return (
    <>
      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="page-head">

        <div>
          <h1>
            Analysis History
          </h1>

          <p>
            View all your previous
            water quality analyses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 14px',
            border:
              '1px solid #dbe5ef',
            borderRadius: '8px',
            background: '#ffffff',
            color: '#31506b',
            fontSize: '13px',
            fontWeight: 700,
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? 'history-spin'
                : ''
            }
          />

          Refresh
        </button>

      </div>

      {/* ===================================================
          MAIN CARD
          =================================================== */}

      <Card>

        {/* =================================================
            TOOLBAR
            ================================================= */}

        <div className="toolbar">

          <div className="search-box">

            <Search size={16} />

            <input
              type="text"
              placeholder="Search analyses..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <div
            className="filter-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >

            <Filter size={15} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={{
                border: 'none',
                background:
                  'transparent',
                outline: 'none',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >

              <option value="All Status">
                All Status
              </option>

              <option value="Safe">
                Safe
              </option>

              <option value="Needs Treatment">
                Needs Treatment
              </option>

              <option value="Critical">
                Critical
              </option>

            </select>

          </div>

        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            style={{
              margin:
                '18px 0 0',
              padding:
                '12px 14px',
              border:
                '1px solid #fecaca',
              borderRadius: '8px',
              background:
                '#fff7f7',
              color:
                '#b91c1c',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
            ================================================= */}

        {loading ? (
          <div
            style={{
              minHeight: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#64748b',
            }}
          >

            <RefreshCw
              size={32}
              className="history-spin"
            />

            <p>
              Loading analysis history...
            </p>

          </div>
        ) : !hasHistory ? (
          /* ===============================================
             NO BACKEND HISTORY
             =============================================== */

          <div
            style={{
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '30px',
            }}
          >

            <Calendar
              size={50}
              strokeWidth={1.5}
              style={{
                marginBottom: '16px',
                color: '#94a3b8',
              }}
            />

            <h3
              style={{
                margin:
                  '0 0 8px',
                color: '#0b2740',
              }}
            >
              No analyses found
            </h3>

            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: '13px',
                maxWidth: '430px',
              }}
            >
              No water analysis records
              were returned for this
              account. Run an analysis
              and then refresh this page.
            </p>

          </div>
        ) : !hasFilteredHistory ? (
          /* ===============================================
             FILTER EMPTY
             =============================================== */

          <div
            style={{
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '30px',
            }}
          >

            <Search
              size={45}
              strokeWidth={1.5}
              style={{
                marginBottom: '16px',
                color: '#94a3b8',
              }}
            />

            <h3
              style={{
                margin:
                  '0 0 8px',
                color: '#0b2740',
              }}
            >
              No matching analyses
            </h3>

            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Try changing your search
              or status filter.
            </p>

          </div>
        ) : (
          /* ===============================================
             HISTORY TABLE
             =============================================== */

          <div className="table-scroll">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Date &amp; Time
                  </th>

                  <th>
                    Sample Name
                  </th>

                  <th>
                    Key Parameters
                  </th>

                  <th>
                    Prediction
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredHistory.map(
                  (item, index) => {
                    const parameters =
                      getParameters(
                        item
                      );

                    const prediction =
                      getPrediction(
                        item
                      );

                    const status =
                      getStatus(item);

                    const sample =
                      getSampleName(
                        item
                      );

                    const pH =
                      getParameter(
                        parameters,
                        [
                          'pH',
                          'ph',
                          'PH',
                        ]
                      );

                    const temperature =
                      getParameter(
                        parameters,
                        [
                          'Temperature',
                          'temperature',
                        ]
                      );

                    const dissolvedOxygen =
                      getParameter(
                        parameters,
                        [
                          'DO',
                          'Dissolved_Oxygen',
                          'DissolvedOxygen',
                          'dissolved_oxygen',
                        ]
                      );

                    const nitrate =
                      getParameter(
                        parameters,
                        [
                          'Nitrate',
                          'nitrate',
                        ]
                      );

                    const date =
                      formatDate(item);

                    const id =
                      item?.id ??
                      item?.analysis_id ??
                      `${date}-${index}`;

                    return (
                      <tr
                        key={String(id)}
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {date}
                        </td>

                        <td>
                          <strong>
                            {sample}
                          </strong>
                        </td>

                        <td>
                          <div
                            style={{
                              fontSize:
                                '12px',
                              lineHeight:
                                1.7,
                              color:
                                '#51697f',
                            }}
                          >

                            {pH !== null && (
                              <div>
                                pH:{' '}
                                {pH}
                              </div>
                            )}

                            {temperature !==
                              null && (
                              <div>
                                Temp:{' '}
                                {
                                  temperature
                                }
                                °C
                              </div>
                            )}

                            {dissolvedOxygen !==
                              null && (
                              <div>
                                DO:{' '}
                                {
                                  dissolvedOxygen
                                }
                                mg/L
                              </div>
                            )}

                            {nitrate !==
                              null && (
                              <div>
                                Nitrate:{' '}
                                {nitrate}
                                mg/L
                              </div>
                            )}

                            {pH === null &&
                              temperature ===
                                null &&
                              dissolvedOxygen ===
                                null &&
                              nitrate ===
                                null && (
                                <span>
                                  Water sample
                                </span>
                              )}

                          </div>
                        </td>

                        <td>
                          {prediction}
                        </td>

                        <td>

                          <StatusBadge
                            status={
                              status
                            }
                          />

                        </td>

                        <td>

                          <button
                            type="button"
                            className="table-action"
                            onClick={() =>
                              viewAnalysis(
                                item
                              )
                            }
                          >
                            <Eye
                              size={14}
                            />

                            View
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </Card>

      {/* ===================================================
          STYLES
          =================================================== */}

      <style>{`
        .history-spin {
          animation:
            historySpin
            1s
            linear
            infinite;
        }

        @keyframes historySpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .table-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #dbe5ef;
          background: #ffffff;
          border-radius: 7px;
          padding: 7px 10px;
          color: #31506b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .table-action:hover {
          border-color: #0878F9;
          color: #0878F9;
        }

        @media (max-width: 760px) {
          .toolbar {
            flex-wrap: wrap;
          }

          .search-box {
            width: 100%;
          }
        }
      `}</style>

    </>
  );
}