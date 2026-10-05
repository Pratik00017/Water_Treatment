import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import {
  Card,
  EmptyState,
  StatusBadge,
} from '../components/common/UI';

import ComparisonChart from '../components/charts/ComparisonChart';
import { getAnalysisHistory } from '../services/api';


const PARAMETERS = [
  ['pH', ['pH', 'ph']],
  ['Temperature', ['Temperature', 'temperature']],
  ['Dissolved Oxygen', [
    'Dissolved_Oxygen',
    'DissolvedOxygen',
    'dissolved_oxygen',
  ]],
  ['Nitrate', ['Nitrate', 'nitrate']],
  ['Ammonia', ['Ammonia', 'ammonia']],
  ['Biochemical Oxygen Demand', [
    'Biochemical_Oxygen_Demand',
    'BiochemicalOxygenDemand',
  ]],
  ['Orthophosphate', [
    'Orthophosphate',
    'orthophosphate',
  ]],
  ['Nitrogen', ['Nitrogen', 'nitrogen']],
];


function getValue(analysis, keys) {
  const parameters = analysis?.parameters || {};

  for (const key of keys) {
    if (
      parameters[key] !== undefined &&
      parameters[key] !== null &&
      parameters[key] !== ''
    ) {
      return parameters[key];
    }
  }

  return '—';
}


function formatDate(value) {
  if (!value) return 'Unknown date';

  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}


function formatConfidence(value) {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${Number(value).toFixed(1)}%`;
}


function toChartSample(analysis) {
  return {
    name: `Analysis #${analysis.id}`,

    pH: Number(
      getValue(analysis, ['pH', 'ph'])
    ) || 0,

    Temperature: Number(
      getValue(analysis, [
        'Temperature',
        'temperature',
      ])
    ) || 0,

    DissolvedOxygen: Number(
      getValue(analysis, [
        'Dissolved_Oxygen',
        'DissolvedOxygen',
        'dissolved_oxygen',
      ])
    ) || 0,

    Nitrate: Number(
      getValue(analysis, [
        'Nitrate',
        'nitrate',
      ])
    ) || 0,

    Ammonia: Number(
      getValue(analysis, [
        'Ammonia',
        'ammonia',
      ])
    ) || 0,
  };
}


export default function Comparison() {
  const [analyses, setAnalyses] = useState([]);
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAnalysisHistory();

      const rows =
        response.data?.analyses || [];

      setAnalyses(rows);

      if (rows.length >= 2) {
        setFirstId(String(rows[0].id));
        setSecondId(String(rows[1].id));
      } else if (rows.length === 1) {
        setFirstId(String(rows[0].id));
        setSecondId('');
      } else {
        setFirstId('');
        setSecondId('');
      }

    } catch (err) {
      setError(
        err.userMessage ||
        err.message ||
        'Unable to load analysis history.'
      );

      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadHistory();
  }, []);


  const firstAnalysis = useMemo(
    () =>
      analyses.find(
        (item) =>
          String(item.id) === String(firstId)
      ),
    [analyses, firstId]
  );


  const secondAnalysis = useMemo(
    () =>
      analyses.find(
        (item) =>
          String(item.id) === String(secondId)
      ),
    [analyses, secondId]
  );


  const selectedSamples = useMemo(() => {
    return [
      firstAnalysis,
      secondAnalysis,
    ].filter(Boolean);
  }, [firstAnalysis, secondAnalysis]);


  const chartSamples = useMemo(
    () =>
      selectedSamples.map(toChartSample),
    [selectedSamples]
  );


  return (
    <>
      <div className="page-head">

        <div>
          <h1>Compare Analyses</h1>

          <p>
            Select two analyses from your saved
            backend history to compare water-quality
            parameters, predictions and confidence.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>


      {error && (
        <Card>
          <div className="recommendation">
            <div className="recommendation-icon">
              !
            </div>

            <div>
              <h3>
                Unable to load analysis history
              </h3>

              <p>{error}</p>
            </div>
          </div>
        </Card>
      )}


      {loading ? (

        <Card>
          <EmptyState
            title="Loading analyses"
            message="Fetching your saved analyses from the backend..."
          />
        </Card>

      ) : analyses.length < 2 ? (

        <Card>
          <EmptyState
            title="At least two analyses are required"
            message="Run at least two real water analyses before comparing them."
          />
        </Card>

      ) : (

        <>
          {/* ==================================================
              SELECT ANALYSES
          =================================================== */}

          <Card>

            <div className="comparison-select-grid">

              <div className="comparison-select">
                <label>
                  First Analysis

                  <select
                    value={firstId}
                    onChange={(e) =>
                      setFirstId(e.target.value)
                    }
                  >
                    <option value="">
                      Select first analysis
                    </option>

                    {analyses.map((analysis) => (
                      <option
                        key={analysis.id}
                        value={analysis.id}
                      >
                        #{analysis.id} —{' '}
                        {formatDate(analysis.date)} —{' '}
                        {analysis.prediction ||
                          analysis.summary ||
                          'Unknown'}
                      </option>
                    ))}
                  </select>
                </label>

                {firstAnalysis && (
                  <div className="comparison-selection-info">
                    <strong>
                      Analysis #{firstAnalysis.id}
                    </strong>

                    <span>
                      {formatDate(firstAnalysis.date)}
                    </span>

                    <StatusBadge
                      status={firstAnalysis.status}
                    />
                  </div>
                )}
              </div>


              <div className="comparison-arrow">
                <ArrowRight size={22} />
              </div>


              <div className="comparison-select">
                <label>
                  Second Analysis

                  <select
                    value={secondId}
                    onChange={(e) =>
                      setSecondId(e.target.value)
                    }
                  >
                    <option value="">
                      Select second analysis
                    </option>

                    {analyses.map((analysis) => (
                      <option
                        key={analysis.id}
                        value={analysis.id}
                      >
                        #{analysis.id} —{' '}
                        {formatDate(analysis.date)} —{' '}
                        {analysis.prediction ||
                          analysis.summary ||
                          'Unknown'}
                      </option>
                    ))}
                  </select>
                </label>

                {secondAnalysis && (
                  <div className="comparison-selection-info">
                    <strong>
                      Analysis #{secondAnalysis.id}
                    </strong>

                    <span>
                      {formatDate(secondAnalysis.date)}
                    </span>

                    <StatusBadge
                      status={secondAnalysis.status}
                    />
                  </div>
                )}
              </div>

            </div>

          </Card>


          {/* ==================================================
              COMPARISON CONTENT
          =================================================== */}

          {!firstAnalysis ||
          !secondAnalysis ? (

            <Card>
              <EmptyState
                title="Select two analyses"
                message="Choose one analysis in each selector to compare them."
              />
            </Card>

          ) : firstAnalysis.id ===
            secondAnalysis.id ? (

            <Card>
              <EmptyState
                title="Choose different analyses"
                message="The two selections must be different history records."
              />
            </Card>

          ) : (

            <>
              {/* Prediction summary */}

              <div className="comparison-summary-grid">

                <Card className="comparison-result-card">
                  <span>
                    Analysis #{firstAnalysis.id}
                  </span>

                  <strong>
                    {firstAnalysis.prediction ||
                      firstAnalysis.summary ||
                      'Unknown'}
                  </strong>

                  <small>
                    Confidence:{' '}
                    {formatConfidence(
                      firstAnalysis.confidence
                    )}
                  </small>

                </Card>


                <Card className="comparison-result-card">
                  <span>
                    Analysis #{secondAnalysis.id}
                  </span>

                  <strong>
                    {secondAnalysis.prediction ||
                      secondAnalysis.summary ||
                      'Unknown'}
                  </strong>

                  <small>
                    Confidence:{' '}
                    {formatConfidence(
                      secondAnalysis.confidence
                    )}
                  </small>

                </Card>

              </div>


              {/* Chart */}

              <Card>

                <div className="section-head">

                  <div>
                    <h3>
                      Parameter Comparison
                    </h3>

                    <p>
                      Actual values stored in the
                      selected backend analyses.
                    </p>
                  </div>

                  <BarChart3 size={18} />

                </div>

                <ComparisonChart
                  samples={chartSamples}
                />

              </Card>


              {/* Table */}

              <Card>

                <div className="section-head">

                  <div>
                    <h3>
                      Comparison Table
                    </h3>

                    <p>
                      Direct comparison of the
                      selected historical analyses.
                    </p>
                  </div>

                </div>


                <div className="table-scroll">

                  <table className="data-table">

                    <thead>
                      <tr>
                        <th>Parameter</th>

                        <th>
                          Analysis #{firstAnalysis.id}
                        </th>

                        <th>
                          Analysis #{secondAnalysis.id}
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {PARAMETERS.map(
                        ([label, keys]) => (
                          <tr key={label}>

                            <td>
                              {label}
                            </td>

                            <td>
                              {getValue(
                                firstAnalysis,
                                keys
                              )}
                            </td>

                            <td>
                              {getValue(
                                secondAnalysis,
                                keys
                              )}
                            </td>

                          </tr>
                        )
                      )}


                      <tr>
                        <td>
                          Prediction
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              firstAnalysis.prediction ||
                              firstAnalysis.status
                            }
                          />
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              secondAnalysis.prediction ||
                              secondAnalysis.status
                            }
                          />
                        </td>
                      </tr>


                      <tr>
                        <td>
                          Confidence
                        </td>

                        <td>
                          {formatConfidence(
                            firstAnalysis.confidence
                          )}
                        </td>

                        <td>
                          {formatConfidence(
                            secondAnalysis.confidence
                          )}
                        </td>
                      </tr>


                      <tr>
                        <td>
                          Date
                        </td>

                        <td>
                          {formatDate(
                            firstAnalysis.date
                          )}
                        </td>

                        <td>
                          {formatDate(
                            secondAnalysis.date
                          )}
                        </td>
                      </tr>

                    </tbody>

                  </table>

                </div>

              </Card>

            </>

          )}

        </>

      )}

    </>
  );
}