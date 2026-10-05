import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Calendar,
  Eye,
  Filter,
  Search,
  Trash2,
  RefreshCw,
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

/* =========================================================
   USER STORAGE
   MUST MATCH AnalyzeWater.jsx EXACTLY
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
    .replace(
      /[^a-z0-9._-]/g,
      '_'
    );
}

function getHistoryKey(user) {
  return (
    `aquaxai-history-` +
    getUserStorageId(user)
  );
}

function getLatestKey(user) {
  return (
    `aquaxai-latest-analysis-` +
    getUserStorageId(user)
  );
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
      .map(
        (item) =>
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

/* =========================================================
   PREDICTION
   ========================================================= */

function getPrediction(
  item
) {
  const prediction =
    item?.prediction;

  if (
    prediction &&
    typeof prediction ===
      'object'
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

/* =========================================================
   DATE
   ========================================================= */

function getDate(
  item
) {
  const value =
    item?.created_at ||
    item?.createdAt ||
    item?.date;

  if (!value) {
    return 'Unknown';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return safeText(
      value,
      'Unknown'
    );
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
   SAMPLE NAME
   ========================================================= */

function getSampleName(
  item
) {
  return safeText(
    item?.sample_name ||
    item?.sampleName ||
    item?.sample ||
    item?.input_data?.Sample ||
    item?.input_data?.Sample_Name ||
    item?.input_data?.Waterbody_Type ||
    item?.Waterbody_Type ||
    item?.waterbody_type,
    'Water Sample'
  );
}

/* =========================================================
   MAIN HISTORY PAGE
   ========================================================= */

export default function History() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    'All Status'
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =======================================================
     CURRENT USER KEY
     ======================================================= */

  const historyKey =
    getHistoryKey(user);

  const latestKey =
    getLatestKey(user);

  /* =======================================================
     LOAD HISTORY
     ======================================================= */

  const loadHistory =
    () => {
      setLoading(true);

      try {
        if (!user) {
          setHistory([]);
          return;
        }

        const saved =
          localStorage.getItem(
            historyKey
          );

        if (!saved) {
          setHistory([]);
          return;
        }

        const parsed =
          JSON.parse(saved);

        if (
          !Array.isArray(
            parsed
          )
        ) {
          setHistory([]);
          return;
        }

        setHistory(
          parsed
        );

      } catch (error) {
        console.error(
          'Failed to load analysis history:',
          error
        );

        setHistory([]);

      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     LOAD WHEN USER CHANGES
     ======================================================= */

  useEffect(() => {
    loadHistory();
  }, [
    user?.email,
    user?.id,
    user?.user_id,
  ]);

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredHistory =
    useMemo(() => {

      return history.filter(
        (item) => {

          const prediction =
            getPrediction(
              item
            );

          const sample =
            getSampleName(
              item
            );

          const searchable =
            [
              prediction,
              sample,
              item?.summary,
              item?.explanation,
            ]
              .map(
                (value) =>
                  safeText(
                    value,
                    ''
                  )
              )
              .join(' ')
              .toLowerCase();

          const searchMatch =
            !search ||
            searchable.includes(
              search.toLowerCase()
            );

          const statusMatch =
            statusFilter ===
              'All Status' ||
            prediction
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

  const viewAnalysis =
    (item) => {

      if (!item) {
        return;
      }

      try {
        /*
         * IMPORTANT:
         * Save under the SAME user-specific
         * latest key used by AnalyzeWater.
         */

        localStorage.setItem(
          latestKey,
          JSON.stringify(
            item
          )
        );

        /*
         * Remove the OLD shared key so another
         * account cannot accidentally read it.
         */

        localStorage.removeItem(
          'aquaxai-latest-analysis'
        );

        navigate(
          '/analysis-result'
        );

      } catch (error) {
        console.error(
          'Unable to open analysis:',
          error
        );
      }
    };

  /* =======================================================
     DELETE ONE
     ======================================================= */

  const deleteAnalysis =
    (item) => {

      if (!user) {
        return;
      }

      const updated =
        history.filter(
          (historyItem) =>
            historyItem !== item
        );

      try {
        localStorage.setItem(
          historyKey,
          JSON.stringify(
            updated
          )
        );

        setHistory(
          updated
        );

        /*
         * If the deleted analysis was also
         * the latest analysis, remove the
         * account-specific latest result.
         */

        const latest =
          localStorage.getItem(
            latestKey
          );

        if (
          latest &&
          JSON.stringify(
            item
          ) === latest
        ) {
          localStorage.removeItem(
            latestKey
          );
        }

      } catch (error) {
        console.error(
          'Unable to delete analysis:',
          error
        );
      }
    };

  /* =======================================================
     CLEAR ALL
     ======================================================= */

  const clearAllHistory =
    () => {

      if (!user) {
        return;
      }

      const confirmed =
        window.confirm(
          'Delete all water analysis history for this account?'
        );

      if (!confirmed) {
        return;
      }

      try {

        /*
         * Remove CURRENT ACCOUNT history.
         */

        localStorage.removeItem(
          historyKey
        );

        /*
         * Remove CURRENT ACCOUNT latest.
         */

        localStorage.removeItem(
          latestKey
        );

        /*
         * Remove old shared keys too.
         */

        localStorage.removeItem(
          'aquaxai-history'
        );

        localStorage.removeItem(
          'aquaxai-latest-analysis'
        );

        localStorage.removeItem(
          'aquaxai-reports'
        );

        localStorage.removeItem(
          'aquaxai-saved-reports'
        );

        setHistory([]);

      } catch (error) {
        console.error(
          'Unable to clear history:',
          error
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="page-head">

        <div>

          <h1>
            Analysis History
          </h1>

          <p>
            View and manage your previous
            water quality analyses.
          </p>

        </div>

        {history.length >
          0 && (
          <button
            type="button"
            onClick={
              clearAllHistory
            }
            style={{
              display:
                'inline-flex',
              alignItems:
                'center',
              gap:
                '7px',
              padding:
                '10px 14px',
              border:
                '1px solid #fecaca',
              borderRadius:
                '8px',
              background:
                '#ffffff',
              color:
                '#dc2626',
              fontSize:
                '13px',
              fontWeight:
                700,
              cursor:
                'pointer',
            }}
          >

            <Trash2
              size={15}
            />

            Clear All History

          </button>
        )}

      </div>

      {/* =================================================
          CARD
          ================================================= */}

      <Card>

        {/* =================================================
            TOOLBAR
            ================================================= */}

        <div className="toolbar">

          {/* SEARCH */}

          <div className="search-box">

            <Search
              size={16}
            />

            <input
              type="text"
              placeholder="Search analyses..."
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          {/* FILTER */}

          <button
            type="button"
            className="filter-button"
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                '8px',
            }}
          >

            <Filter
              size={15}
            />

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              style={{
                border:
                  'none',
                background:
                  'transparent',
                outline:
                  'none',
                fontSize:
                  '14px',
                cursor:
                  'pointer',
              }}
            >

              <option>
                All Status
              </option>

              <option>
                Excellent
              </option>

              <option>
                Good
              </option>

              <option>
                Fair
              </option>

              <option>
                Marginal
              </option>

              <option>
                Poor
              </option>

              <option>
                Safe
              </option>

              <option>
                Critical
              </option>

            </select>

          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={
              loadHistory
            }
            disabled={
              loading
            }
            style={{
              marginLeft:
                'auto',
              width:
                '38px',
              height:
                '38px',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              border:
                '1px solid #dbe5ef',
              borderRadius:
                '8px',
              background:
                '#ffffff',
              color:
                '#4b647b',
              cursor:
                loading
                  ? 'not-allowed'
                  : 'pointer',
            }}
            title="Refresh history"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? 'history-spin'
                  : ''
              }
            />

          </button>

        </div>

        {/* =================================================
            LOADING
            ================================================= */}

        {loading ? (

          <div
            style={{
              minHeight:
                '360px',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              flexDirection:
                'column',
              color:
                '#64748b',
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

        ) : filteredHistory.length ===
          0 ? (

          /* ===============================================
             EMPTY
             =============================================== */

          <div
            style={{
              minHeight:
                '360px',
              display:
                'flex',
              flexDirection:
                'column',
              alignItems:
                'center',
              justifyContent:
                'center',
              textAlign:
                'center',
              padding:
                '30px',
            }}
          >

            <Calendar
              size={48}
              strokeWidth={1.5}
              style={{
                marginBottom:
                  '16px',
                color:
                  '#94a3b8',
              }}
            />

            <h3
              style={{
                margin:
                  '0 0 8px',
                color:
                  '#0b2740',
              }}
            >
              {history.length ===
              0
                ? 'No analyses found'
                : 'No matching analyses'}
            </h3>

            <p
              style={{
                margin:
                  0,
                color:
                  '#64748b',
                fontSize:
                  '13px',
              }}
            >
              {history.length ===
              0
                ? 'This account does not have any saved water analyses yet.'
                : 'Try changing your search or status filter.'}
            </p>

          </div>

        ) : (

          /* ===============================================
             TABLE
             =============================================== */

          <div className="table-scroll">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Date & Time
                  </th>

                  <th>
                    Sample Name
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
                  (
                    item,
                    index
                  ) => {

                    const prediction =
                      getPrediction(
                        item
                      );

                    const sample =
                      getSampleName(
                        item
                      );

                    const date =
                      getDate(
                        item
                      );

                    return (
                      <tr
                        key={
                          item?.id ||
                          item?.analysis_id ||
                          `${date}-${index}`
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {date}
                        </td>

                        <td>
                          {sample}
                        </td>

                        <td>
                          {prediction}
                        </td>

                        <td>

                          <StatusBadge
                            status={
                              prediction
                            }
                          />

                        </td>

                        <td>

                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap:
                                '6px',
                            }}
                          >

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

                            <button
                              type="button"
                              className="table-action"
                              onClick={() =>
                                deleteAnalysis(
                                  item
                                )
                              }
                              style={{
                                color:
                                  '#dc2626',
                              }}
                            >

                              <Trash2
                                size={14}
                              />

                            </button>

                          </div>

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

      {/* =================================================
          STYLES
          ================================================= */}

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
          display:
            inline-flex;

          align-items:
            center;

          gap:
            5px;

          border:
            1px solid #dbe5ef;

          background:
            #ffffff;

          border-radius:
            7px;

          padding:
            7px 9px;

          color:
            #31506b;

          font-size:
            12px;

          cursor:
            pointer;
        }

        .table-action:hover {
          border-color:
            #0878F9;

          color:
            #0878F9;
        }

        @media (max-width: 760px) {

          .toolbar {
            flex-wrap:
              wrap;
          }

          .search-box {
            width:
              100%;
          }

          .toolbar
          > button:last-child {
            margin-left:
              0;
          }

        }

      `}</style>

    </>
  );
}