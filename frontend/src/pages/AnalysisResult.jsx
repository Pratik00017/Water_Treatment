import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Info,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   HELPERS
========================================================= */

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()/°.%]+/g, "");

const toNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    if (!cleaned) return null;

    const number = Number(cleaned);

    return Number.isFinite(number)
      ? number
      : null;
  }

  return null;
};

const formatNumber = (value, digits = 3) => {
  const number = toNumber(value);

  if (number === null) {
    return "—";
  }

  return number
    .toFixed(digits)
    .replace(/\.?0+$/, "");
};

const formatPercent = (value) => {
  const number = toNumber(value);

  if (number === null) {
    return "—";
  }

  const percent =
    number <= 1
      ? number * 100
      : number;

  return `${percent.toFixed(1)}%`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getByAliases = (object, aliases) => {
  if (!isObject(object)) {
    return undefined;
  }

  const normalizedObject = {};

  Object.entries(object).forEach(
    ([key, value]) => {
      normalizedObject[
        normalizeKey(key)
      ] = value;
    }
  );

  for (const alias of aliases) {
    const value =
      normalizedObject[
        normalizeKey(alias)
      ];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return undefined;
};

/* =========================================================
   PARAMETERS
========================================================= */

const PARAMETER_DEFINITIONS = [
  {
    id: "pH",
    label: "pH",
    aliases: ["pH", "PH", "ph"],
    unit: "",
    range: "6.5 – 8.5",
  },

  {
    id: "Temperature",
    label: "Temperature",
    aliases: [
      "Temperature",
      "Temperature C",
      "Temperature_C",
      "Temperature (°C)",
      "temperature",
    ],
    unit: "°C",
    range: "Reference based",
  },

  {
    id: "Dissolved_Oxygen",
    label: "Dissolved Oxygen",
    aliases: [
      "Dissolved_Oxygen",
      "Dissolved Oxygen",
      "DissolvedOxygen",
      "DO",
      "dissolved_oxygen",
      "dissolvedOxygen",
    ],
    unit: "mg/L",
    range: "Reference based",
  },

  {
    id: "Biochemical_Oxygen_Demand",
    label: "Biochemical Oxygen Demand",
    aliases: [
      "Biochemical_Oxygen_Demand",
      "Biochemical Oxygen Demand",
      "BiochemicalOxygenDemand",
      "BOD",
      "bod",
    ],
    unit: "mg/L",
    range: "Reference based",
  },

  {
    id: "Nitrate",
    label: "Nitrate",
    aliases: [
      "Nitrate",
      "Nitrate (mg/L)",
      "nitrate",
    ],
    unit: "mg/L",
    range: "Reference based",
  },

  {
    id: "Ammonia",
    label: "Ammonia",
    aliases: [
      "Ammonia",
      "Ammonia (mg/L)",
      "ammonia",
    ],
    unit: "mg/L",
    range: "< 1 mg/L",
  },

  {
    id: "Nitrogen",
    label: "Nitrogen",
    aliases: [
      "Nitrogen",
      "Nitrogen (mg/L)",
      "nitrogen",
    ],
    unit: "mg/L",
    range: "Reference based",
  },

  {
    id: "Orthophosphate",
    label: "Orthophosphate",
    aliases: [
      "Orthophosphate",
      "Orthophosphate (mg/L)",
      "orthophosphate",
    ],
    unit: "mg/L",
    range: "Reference based",
  },
];

/* =========================================================
   READ LOCAL ANALYSIS
========================================================= */

function readStoredObject(key) {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return isObject(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/*
 * IMPORTANT:
 * Your application has two separate local storage values:
 *
 * aquaxai-latest-analysis
 * aquaxai-analysis-input
 *
 * The result page now combines both.
 */

function loadCompleteAnalysis() {
  const latest =
    readStoredObject(
      "aquaxai-latest-analysis"
    );

  const input =
    readStoredObject(
      "aquaxai-analysis-input"
    );

  if (!latest && !input) {
    return null;
  }

  /*
   * Backend result stays untouched.
   * Submitted form values are added separately.
   */
  return {
    ...(latest || {}),

    input_data: {
      ...(isObject(
        latest?.input_data
      )
        ? latest.input_data
        : {}),

      ...(isObject(input)
        ? input
        : {}),
    },

    parameters: {
      ...(isObject(
        latest?.parameters
      )
        ? latest.parameters
        : {}),

      ...(isObject(input)
        ? input
        : {}),
    },
  };
}

/* =========================================================
   UNWRAP BACKEND RESULT
========================================================= */

function getContainers(result) {
  if (!result) {
    return [];
  }

  const containers = [];

  const add = (value) => {
    if (
      isObject(value) &&
      !containers.includes(value)
    ) {
      containers.push(value);
    }
  };

  add(result);

  add(result.data);
  add(result.result);
  add(result.analysis);
  add(result.response);

  add(result.data?.data);
  add(result.data?.result);

  add(result.result?.data);
  add(result.result?.result);

  return containers;
}

/* =========================================================
   INPUT DATA
========================================================= */

function getInputData(result) {
  if (!result) {
    return {};
  }

  /*
   * Highest priority.
   */
  if (
    isObject(result.input_data)
  ) {
    return result.input_data;
  }

  if (
    isObject(result.parameters)
  ) {
    return result.parameters;
  }

  const containers =
    getContainers(result);

  for (const container of containers) {
    const candidates = [
      container.input_data,
      container.inputData,
      container.parameters,
      container.water_parameters,
      container.waterParameters,
      container.input,
      container.sample,
    ];

    for (const candidate of candidates) {
      if (isObject(candidate)) {
        return candidate;
      }
    }
  }

  return {};
}

/* =========================================================
   PARAMETERS
========================================================= */

function getParameters(result) {
  const input =
    getInputData(result);

  const resultObjects = [
    input,
    result,
    result?.data,
    result?.result,
    result?.analysis,
  ].filter(isObject);

  return PARAMETER_DEFINITIONS.map(
    (definition) => {
      let value;

      for (const source of resultObjects) {
        value = getByAliases(
          source,
          definition.aliases
        );

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          break;
        }
      }

      return {
        ...definition,
        value,
      };
    }
  ).filter(
    (item) =>
      item.value !== undefined &&
      item.value !== null
  );
}

/* =========================================================
   PREDICTION
========================================================= */

function getPrediction(result) {
  const containers =
    getContainers(result);

  for (const container of containers) {
    const candidates = [
      container.water_quality,
      container.prediction,
      container.predicted_class,
      container.predictedClass,
      container.prediction_label,
      container.predictionLabel,
      container.quality,
      container.classification,
      container.status,
    ];

    for (const candidate of candidates) {
      if (
        typeof candidate === "string" &&
        candidate.trim()
      ) {
        return candidate;
      }

      if (
        typeof candidate === "number"
      ) {
        return String(candidate);
      }

      if (isObject(candidate)) {
        const nested =
          getByAliases(
            candidate,
            [
              "label",
              "name",
              "prediction",
              "water_quality",
              "waterQuality",
              "quality",
              "class",
              "status",
              "value",
            ]
          );

        if (
          nested !== undefined &&
          nested !== null
        ) {
          return String(nested);
        }
      }
    }
  }

  return "Analysis Complete";
}

/* =========================================================
   CONFIDENCE
========================================================= */

function getConfidence(result) {
  const containers =
    getContainers(result);

  for (const container of containers) {
    const direct =
      getByAliases(
        container,
        [
          "confidence",
          "prediction_confidence",
          "predictionConfidence",
          "confidence_score",
          "confidenceScore",
        ]
      );

    const directNumber =
      toNumber(direct);

    if (directNumber !== null) {
      return directNumber;
    }

    if (
      isObject(container.prediction)
    ) {
      const nested =
        getByAliases(
          container.prediction,
          [
            "confidence",
            "prediction_confidence",
            "confidence_score",
          ]
        );

      const nestedNumber =
        toNumber(nested);

      if (nestedNumber !== null) {
        return nestedNumber;
      }
    }
  }

  return null;
}

/* =========================================================
   SHAP
========================================================= */

function normalizeShapItem(item) {
  if (!isObject(item)) {
    return null;
  }

  const feature =
    getByAliases(
      item,
      [
        "feature",
        "feature_name",
        "featureName",
        "name",
        "parameter",
        "parameter_name",
        "parameterName",
      ]
    );

  const value =
    getByAliases(
      item,
      [
        "importance",
        "shap_value",
        "shapValue",
        "contribution",
        "impact",
        "value",
      ]
    );

  const number =
    toNumber(value);

  if (
    feature === undefined ||
    number === null
  ) {
    return null;
  }

  return {
    feature: String(feature),
    value: number,
  };
}

function extractShapFromArray(array) {
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .map(normalizeShapItem)
    .filter(Boolean);
}

function extractShapFromObject(object) {
  if (!isObject(object)) {
    return [];
  }

  return Object.entries(object)
    .map(
      ([feature, value]) => {
        const direct =
          toNumber(value);

        if (direct !== null) {
          return {
            feature,
            value: direct,
          };
        }

        if (isObject(value)) {
          const nested =
            toNumber(
              getByAliases(
                value,
                [
                  "importance",
                  "shap_value",
                  "shapValue",
                  "contribution",
                  "impact",
                  "value",
                ]
              )
            );

          if (nested !== null) {
            return {
              feature,
              value: nested,
            };
          }
        }

        return null;
      }
    )
    .filter(Boolean);
}

function getShap(result) {
  const containers =
    getContainers(result);

  const candidateKeys = [
    "explanation",
    "shap_values",
    "shapValues",
    "shap",
    "shap_explanation",
    "shapExplanation",
    "feature_importance",
    "featureImportance",
    "feature_contributions",
    "featureContributions",
  ];

  for (const container of containers) {
    for (const key of candidateKeys) {
      const candidate =
        container[key];

      if (
        Array.isArray(candidate)
      ) {
        const rows =
          extractShapFromArray(
            candidate
          );

        if (rows.length) {
          return rows;
        }
      }

      if (
        isObject(candidate)
      ) {
        const rows =
          extractShapFromObject(
            candidate
          );

        if (rows.length) {
          return rows;
        }
      }
    }
  }

  return [];
}

/* =========================================================
   RECOMMENDATIONS
========================================================= */

function normalizeRecommendationItem(
  item
) {
  if (
    typeof item === "string"
  ) {
    const text =
      item.trim();

    if (!text) {
      return null;
    }

    return {
      title: "Recommended Action",
      text,
    };
  }

  if (!isObject(item)) {
    return null;
  }

  /*
   * Treatment database objects can contain:
   *
   * treatment_name
   * description
   * parameter
   * condition
   * value
   * basis
   *
   * Display the actual backend information.
   */

  const title =
    getByAliases(
      item,
      [
        "treatment_name",
        "treatmentName",
        "title",
        "name",
        "recommendation",
        "recommended_action",
        "recommendedAction",
        "action",
      ]
    );

  const description =
    getByAliases(
      item,
      [
        "description",
        "text",
        "message",
        "advice",
        "recommendation_text",
        "recommendationText",
      ]
    );

  const parameter =
    getByAliases(
      item,
      [
        "parameter",
      ]
    );

  const condition =
    getByAliases(
      item,
      [
        "condition",
      ]
    );

  const measured =
    getByAliases(
      item,
      [
        "value",
        "measured_value",
        "measuredValue",
      ]
    );

  if (
    !title &&
    !description
  ) {
    return null;
  }

  let text =
    description
      ? String(description)
      : String(title);

  if (
    title &&
    description &&
    String(title) !==
      String(description)
  ) {
    text = String(description);
  }

  return {
    title:
      title
        ? String(title)
        : "Recommended Action",

    text,

    parameter:
      parameter
        ? String(parameter)
        : "",

    condition:
      condition
        ? String(condition)
        : "",

    measured:
      measured !== undefined &&
      measured !== null
        ? String(measured)
        : "",
  };
}

function flattenRecommendations(
  value
) {
  if (!value) {
    return [];
  }

  if (
    typeof value === "string"
  ) {
    const item =
      normalizeRecommendationItem(
        value
      );

    return item ? [item] : [];
  }

  if (
    Array.isArray(value)
  ) {
    return value.flatMap(
      (item) =>
        flattenRecommendations(
          item
        )
    );
  }

  if (isObject(value)) {
    const direct =
      normalizeRecommendationItem(
        value
      );

    if (direct) {
      return [direct];
    }

    return Object.values(value)
      .flatMap((child) =>
        flattenRecommendations(
          child
        )
      );
  }

  return [];
}

function getRecommendations(
  result
) {
  if (!result) {
    return [];
  }

  const containers =
    getContainers(result);

  const fields = [
    "recommended_actions",
    "recommendedActions",
    "recommendations",
    "recommendation",
    "treatment_recommendations",
    "treatmentRecommendations",
    "treatment",
    "actions",
    "advice",
    "guidance",
    "ai_treatment_plan",
    "aiTreatmentPlan",
  ];

  for (const container of containers) {
    for (const field of fields) {
      const value =
        container[field];

      if (
        value === undefined ||
        value === null
      ) {
        continue;
      }

      const items =
        flattenRecommendations(
          value
        );

      if (items.length) {
        return items.filter(
          (item, index, array) =>
            array.findIndex(
              (other) =>
                other.title ===
                  item.title &&
                other.text ===
                  item.text
            ) === index
        );
      }
    }
  }

  return [];
}

/* =========================================================
   OPTIONAL FALLBACK FOR GOOD / EXCELLENT
========================================================= */

function getDisplayRecommendations(
  result,
  actualRecommendations,
  prediction
) {
  /*
   * Prefer the REAL backend recommendation.
   */
  if (
    actualRecommendations.length
  ) {
    return actualRecommendations;
  }

  /*
   * For Excellent / Good, the project's intended
   * treatment logic allows routine monitoring rather
   * than a corrective treatment.
   *
   * This is a display fallback only; it does not
   * overwrite the backend response.
   */
  const quality =
    String(prediction)
      .toLowerCase();

  if (
    quality.includes("excellent") ||
    quality.includes("good")
  ) {
    return [
      {
        title:
          "Routine Monitoring",
        text:
          "No major treatment is required. Continue regular water-quality monitoring and periodic re-testing.",
      },
    ];
  }

  return [];
}

/* =========================================================
   PREDICTION COLOR
========================================================= */

function getTone(prediction) {
  const text =
    String(prediction)
      .toLowerCase();

  if (
    text.includes("poor") ||
    text.includes("critical") ||
    text.includes("unsafe") ||
    text.includes("polluted") ||
    text.includes("contaminated")
  ) {
    return "danger";
  }

  if (
    text.includes("marginal") ||
    text.includes("fair") ||
    text.includes("moderate") ||
    text.includes("warning")
  ) {
    return "warning";
  }

  if (
    text.includes("good") ||
    text.includes("excellent") ||
    text.includes("safe")
  ) {
    return "success";
  }

  return "info";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AnalysisResult() {
  const navigate =
    useNavigate();

  const [analysis, setAnalysis] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadAnalysis = () => {
    try {
      setError("");

      const data =
        loadCompleteAnalysis();

      setAnalysis(data);

      if (data) {
        console.log(
          "AquaXAI COMPLETE ANALYSIS:",
          data
        );

        console.log(
          "Water parameters:",
          getInputData(data)
        );

        console.log(
          "SHAP:",
          getShap(data)
        );

        console.log(
          "Recommendations:",
          getRecommendations(data)
        );
      }
    } catch (err) {
      console.error(
        "Analysis result loading error:",
        err
      );

      setError(
        "Unable to load the analysis result."
      );
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  /* =======================================================
     DATA
  ======================================================= */

  const inputData =
    useMemo(
      () =>
        getInputData(
          analysis
        ),
      [analysis]
    );

  const parameters =
    useMemo(
      () =>
        getParameters(
          analysis
        ),
      [analysis]
    );

  const prediction =
    useMemo(
      () =>
        getPrediction(
          analysis
        ),
      [analysis]
    );

  const confidence =
    useMemo(
      () =>
        getConfidence(
          analysis
        ),
      [analysis]
    );

  const shap =
    useMemo(
      () =>
        getShap(
          analysis
        ),
      [analysis]
    );

  const backendRecommendations =
    useMemo(
      () =>
        getRecommendations(
          analysis
        ),
      [analysis]
    );

  const recommendations =
    useMemo(
      () =>
        getDisplayRecommendations(
          analysis,
          backendRecommendations,
          prediction
        ),
      [
        analysis,
        backendRecommendations,
        prediction,
      ]
    );

  const sortedShap =
    useMemo(
      () =>
        [...shap].sort(
          (a, b) =>
            Math.abs(b.value) -
            Math.abs(a.value)
        ),
      [shap]
    );

  const maxShap =
    useMemo(
      () =>
        Math.max(
          0.000001,
          ...sortedShap.map(
            (item) =>
              Math.abs(
                item.value
              )
          )
        ),
      [sortedShap]
    );

  const tone =
    getTone(
      prediction
    );

  const waterbody =
    getByAliases(
      inputData,
      [
        "Waterbody_Type",
        "Waterbody Type",
        "Waterbody",
        "WaterbodyType",
      ]
    ) || "—";

  const analyzed =
    analysis?.created_at ||
    analysis?.createdAt ||
    analysis?.timestamp ||
    analysis?.analysis_time ||
    analysis?.date;

  /* =======================================================
     NO RESULT
  ======================================================= */

  if (!analysis) {
    return (
      <div style={styles.page}>
        <div
          style={
            styles.emptyCard
          }
        >
          <div
            style={
              styles.emptyIcon
            }
          >
            <Droplets size={34} />
          </div>

          <h1
            style={
              styles.emptyTitle
            }
          >
            No Analysis Result
          </h1>

          <p
            style={
              styles.emptyText
            }
          >
            Run a water analysis first.
            The completed AquaXAI result
            will appear here.
          </p>

          {error && (
            <div
              style={
                styles.errorBox
              }
            >
              {error}
            </div>
          )}

          <button
            type="button"
            style={
              styles.primaryButton
            }
            onClick={() =>
              navigate("/analyze")
            }
          >
            <FlaskConical size={17} />
            Analyze Water
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header
        style={styles.header}
      >
        <div>
          <div
            style={
              styles.eyebrow
            }
          >
            AQUAXAI • WATER
            INTELLIGENCE
          </div>

          <h1
            style={styles.title}
          >
            Analysis Result
          </h1>

          <p
            style={styles.subtitle}
          >
            AI-powered water quality
            prediction and explainable
            analysis.
          </p>
        </div>

        <div
          style={
            styles.headerActions
          }
        >
          <button
            type="button"
            style={
              styles.secondaryButton
            }
            onClick={
              loadAnalysis
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            style={
              styles.primaryButton
            }
            onClick={() =>
              navigate("/analyze")
            }
          >
            <FlaskConical size={17} />
            New Analysis
          </button>
        </div>
      </header>

      {/* SUMMARY */}

      <section
        style={
          styles.summaryGrid
        }
      >
        <SummaryCard
          icon={
            <ShieldCheck size={22} />
          }
          label="Prediction"
          value={prediction}
          tone={tone}
        />

        <SummaryCard
          icon={
            <Sparkles size={22} />
          }
          label="Confidence"
          value={
            confidence === null
              ? "—"
              : formatPercent(
                  confidence
                )
          }
          tone="info"
        />

        <SummaryCard
          icon={
            <Waves size={22} />
          }
          label="Waterbody"
          value={waterbody}
          tone="info"
        />

        <SummaryCard
          icon={
            <Info size={22} />
          }
          label="Analyzed"
          value={formatDate(
            analyzed
          )}
          tone="info"
          small
        />
      </section>

      {/* ===================================================
          WATER PARAMETERS
      =================================================== */}

      <section style={styles.section}>
        <SectionHeader
          icon={
            <Droplets size={20} />
          }
          title="Water Parameters"
          description="Measured values submitted for this water sample."
        />

        {parameters.length >
        0 ? (
          <div
            style={
              styles.parameterTable
            }
          >
            <div
              style={
                styles.parameterHeader
              }
            >
              <div>
                Parameter
              </div>

              <div>
                Value
              </div>

              <div>
                Unit
              </div>

              <div>
                Recommended Range
              </div>
            </div>

            {parameters.map(
              (parameter) => (
                <div
                  key={
                    parameter.id
                  }
                  style={
                    styles.parameterRow
                  }
                >
                  <strong>
                    {parameter.label}
                  </strong>

                  <span
                    style={
                      styles.parameterValue
                    }
                  >
                    {formatNumber(
                      parameter.value
                    )}
                  </span>

                  <span
                    style={
                      styles.parameterUnit
                    }
                  >
                    {parameter.unit ||
                      "—"}
                  </span>

                  <span
                    style={
                      styles.parameterRange
                    }
                  >
                    {parameter.range}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <div
            style={
              styles.noDataBox
            }
          >
            <Info size={27} />

            <strong>
              Water parameters not
              available
            </strong>

            <p>
              The current result did
              not contain readable
              parameter values.
            </p>
          </div>
        )}
      </section>

      {/* ===================================================
          SHAP
      =================================================== */}

      <section style={styles.section}>
        <SectionHeader
          icon={
            <Sparkles size={20} />
          }
          title="AI Explanation"
          description="SHAP feature contributions showing how each parameter influenced the model prediction."
        />

        {sortedShap.length >
        0 ? (
          <div
            style={
              styles.shapContainer
            }
          >
            <div
              style={
                styles.legend
              }
            >
              <span>
                <i
                  style={{
                    ...styles.legendDot,
                    background:
                      "#147ce5",
                  }}
                />
                Positive contribution
              </span>

              <span>
                <i
                  style={{
                    ...styles.legendDot,
                    background:
                      "#d94c4c",
                  }}
                />
                Negative contribution
              </span>
            </div>

            <div
              style={
                styles.shapHeader
              }
            >
              <span>
                Feature
              </span>

              <span>
                SHAP Value
              </span>

              <span>
                Impact
              </span>
            </div>

            {sortedShap.map(
              (item, index) => {
                const positive =
                  item.value >= 0;

                const width =
                  Math.max(
                    5,
                    (Math.abs(
                      item.value
                    ) /
                      maxShap) *
                      100
                  );

                return (
                  <div
                    key={`${item.feature}-${index}`}
                    style={
                      styles.shapRow
                    }
                  >
                    <strong>
                      {item.feature}
                    </strong>

                    <span
                      style={{
                        color:
                          positive
                            ? "#147ce5"
                            : "#d94c4c",
                        fontWeight: 800,
                      }}
                    >
                      {positive
                        ? "+"
                        : ""}
                      {item.value.toFixed(
                        4
                      )}
                    </span>

                    <div>
                      <span
                        style={{
                          ...styles.impactBadge,
                          background:
                            positive
                              ? "#eaf5ff"
                              : "#fff0f0",
                          color:
                            positive
                              ? "#147ce5"
                              : "#d94c4c",
                        }}
                      >
                        {positive ? (
                          <ArrowUp
                            size={13}
                          />
                        ) : (
                          <ArrowDown
                            size={13}
                          />
                        )}

                        {positive
                          ? "Positive"
                          : "Negative"}
                      </span>

                      <div
                        style={
                          styles.shapTrack
                        }
                      >
                        <div
                          style={{
                            ...styles.shapBar,
                            width: `${width}%`,
                            background:
                              positive
                                ? "#147ce5"
                                : "#d94c4c",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}

            <div
              style={
                styles.infoBox
              }
            >
              <Sparkles
                size={18}
                color="#147ce5"
              />

              <div>
                <strong>
                  How to read SHAP
                </strong>

                <p
                  style={
                    styles.infoBoxText
                  }
                >
                  Positive values push
                  the model toward the
                  prediction direction.
                  Negative values push
                  it in the opposite
                  direction. A larger
                  absolute value indicates
                  stronger influence.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={
              styles.noDataBox
            }
          >
            <Sparkles size={27} />

            <strong>
              No SHAP explanation
              available
            </strong>

            <p>
              The backend did not
              return readable SHAP
              contribution values.
            </p>
          </div>
        )}
      </section>

      {/* ===================================================
          RECOMMENDATIONS
      =================================================== */}

      <section style={styles.section}>
        <SectionHeader
          icon={
            <Lightbulb size={20} />
          }
          title="Recommendations"
          description="Treatment and monitoring guidance for this water sample."
        />

        {recommendations.length >
        0 ? (
          <div
            style={
              styles.recommendationList
            }
          >
            {recommendations.map(
              (
                recommendation,
                index
              ) => (
                <div
                  key={`${recommendation.title}-${index}`}
                  style={
                    styles.recommendationCard
                  }
                >
                  <div
                    style={
                      styles.recommendationIcon
                    }
                  >
                    <CheckCircle2
                      size={21}
                    />
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <h3
                      style={
                        styles.recommendationTitle
                      }
                    >
                      {
                        recommendation.title
                      }
                    </h3>

                    <p
                      style={
                        styles.recommendationText
                      }
                    >
                      {
                        recommendation.text
                      }
                    </p>

                    {(
                      recommendation.parameter ||
                      recommendation.condition ||
                      recommendation.measured
                    ) && (
                      <div
                        style={
                          styles.recommendationMeta
                        }
                      >
                        {recommendation.parameter && (
                          <span>
                            Parameter:{" "}
                            <strong>
                              {
                                recommendation.parameter
                              }
                            </strong>
                          </span>
                        )}

                        {recommendation.condition && (
                          <span>
                            Condition:{" "}
                            <strong>
                              {
                                recommendation.condition
                              }
                            </strong>
                          </span>
                        )}

                        {recommendation.measured && (
                          <span>
                            Value:{" "}
                            <strong>
                              {
                                recommendation.measured
                              }
                            </strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div
            style={
              styles.noRecommendation
            }
          >
            <AlertTriangle
              size={23}
              color="#b87900"
            />

            <div>
              <strong>
                No corrective treatment
                required
              </strong>

              <p
                style={
                  styles.noRecommendationText
                }
              >
                The backend did not
                return a specific
                corrective treatment
                for this sample.
                Continue routine
                water-quality monitoring.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}

      <div
        style={
          styles.footer
        }
      >
        <ShieldCheck size={15} />

        <span>
          This result uses the AquaXAI
          backend prediction, SHAP
          explanation and treatment
          response together with the
          submitted sample values.
        </span>
      </div>

      <div
        style={
          styles.bottomActions
        }
      >
        <button
          type="button"
          style={
            styles.secondaryButton
          }
          onClick={
            loadAnalysis
          }
        >
          <RefreshCw size={16} />
          Refresh Result
        </button>

        <button
          type="button"
          style={
            styles.primaryButton
          }
          onClick={() =>
            navigate("/analyze")
          }
        >
          <FlaskConical size={17} />
          Analyze Another Sample
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  tone = "info",
  small = false,
}) {
  const tones = {
    success: {
      bg: "#eaf8f0",
      color: "#159447",
    },

    warning: {
      bg: "#fff6df",
      color: "#b87900",
    },

    danger: {
      bg: "#fff0f0",
      color: "#d94c4c",
    },

    info: {
      bg: "#eaf5ff",
      color: "#147ce5",
    },
  };

  const selected =
    tones[tone] ||
    tones.info;

  return (
    <div
      style={
        styles.summaryCard
      }
    >
      <div
        style={{
          ...styles.summaryIcon,
          background:
            selected.bg,
          color:
            selected.color,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={
            styles.cardLabel
          }
        >
          {label}
        </div>

        <div
          style={{
            ...styles.cardValue,
            color:
              selected.color,
            fontSize:
              small
                ? 13
                : 21,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div
      style={
        styles.sectionHeader
      }
    >
      <div
        style={
          styles.sectionIcon
        }
      >
        {icon}
      </div>

      <div>
        <h2
          style={
            styles.sectionTitle
          }
        >
          {title}
        </h2>

        <p
          style={
            styles.sectionDescription
          }
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f9fc",
    padding: "32px 36px 60px",
    color: "#0b2740",
    boxSizing: "border-box",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  header: {
    maxWidth: "1250px",
    margin: "0 auto 28px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    color: "#087cf2",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1.1,
    fontWeight: 850,
    color: "#08233f",
  },

  subtitle: {
    margin: "10px 0 0",
    fontSize: "15px",
    color: "#587490",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    background: "#087cf2",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "13px",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow:
      "0 6px 16px rgba(8,124,242,.20)",
  },

  secondaryButton: {
    border: "1px solid #ccdeed",
    background: "#fff",
    color: "#0b2740",
    borderRadius: "10px",
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: 750,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },

  summaryGrid: {
    maxWidth: "1250px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "16px",
  },

  summaryCard: {
    background: "#fff",
    border:
      "1px solid #dce8f2",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 5px 18px rgba(11,39,64,.05)",
  },

  summaryIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardLabel: {
    fontSize: "12px",
    color: "#70869a",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    marginBottom: "5px",
  },

  cardValue: {
    fontWeight: 800,
    lineHeight: 1.3,
    wordBreak: "break-word",
  },

  section: {
    maxWidth: "1250px",
    margin: "0 auto 24px",
    background: "#fff",
    border:
      "1px solid #dce8f2",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow:
      "0 5px 18px rgba(11,39,64,.045)",
  },

  sectionHeader: {
    padding: "22px 24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    borderBottom:
      "1px solid #e8eff5",
  },

  sectionIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "12px",
    background: "#e9f5ff",
    color: "#0878e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0b2740",
  },

  sectionDescription: {
    margin: "5px 0 0",
    color: "#637d94",
    fontSize: "13px",
  },

  parameterTable: {
    width: "100%",
  },

  parameterHeader: {
    display: "grid",
    gridTemplateColumns:
      "1.5fr .7fr .7fr 1fr",
    gap: "12px",
    padding: "13px 24px",
    background: "#f3f7fa",
    color: "#63788d",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".5px",
  },

  parameterRow: {
    display: "grid",
    gridTemplateColumns:
      "1.5fr .7fr .7fr 1fr",
    gap: "12px",
    alignItems: "center",
    padding: "17px 24px",
    borderBottom:
      "1px solid #edf2f6",
    fontSize: "14px",
  },

  parameterValue: {
    fontWeight: 800,
    color: "#0b2740",
  },

  parameterUnit: {
    color: "#70869a",
  },

  parameterRange: {
    color: "#59738a",
  },

  noDataBox: {
    minHeight: "180px",
    padding: "35px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textAlign: "center",
    color: "#70869a",
  },

  shapContainer: {
    padding: "20px 24px 24px",
  },

  legend: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "16px",
    color: "#63788d",
    fontSize: "12px",
    fontWeight: 700,
  },

  legendDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "6px",
  },

  shapHeader: {
    display: "grid",
    gridTemplateColumns:
      "1fr 160px 220px",
    gap: "15px",
    padding: "11px 14px",
    background: "#f3f7fa",
    borderRadius: "9px",
    color: "#63788d",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
  },

  shapRow: {
    position: "relative",
    display: "grid",
    gridTemplateColumns:
      "1fr 160px 220px",
    gap: "15px",
    alignItems: "center",
    padding: "17px 14px 24px",
    borderBottom:
      "1px solid #edf2f6",
  },

  shapFeatureName: {
    fontSize: "14px",
    fontWeight: 750,
    color: "#0b2740",
  },

  impactBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  shapTrack: {
    width: "100%",
    height: "6px",
    marginTop: "9px",
    borderRadius: "10px",
    background: "#edf2f6",
    overflow: "hidden",
  },

  shapBar: {
    height: "100%",
    minWidth: "5px",
    borderRadius: "10px",
  },

  infoBox: {
    marginTop: "20px",
    padding: "17px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "#f5f9fc",
    border:
      "1px solid #dce8f2",
    borderRadius: "12px",
    color: "#527089",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  infoBoxText: {
    margin: "5px 0 0",
    color: "#527089",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  recommendationList: {
    padding: "20px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  recommendationCard: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "18px",
    background: "#fbfdff",
    border:
      "1px solid #dce8f2",
    borderLeft:
      "4px solid #159447",
    borderRadius: "12px",
  },

  recommendationIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#eaf8f0",
    color: "#159447",
  },

  recommendationTitle: {
    margin: "1px 0 6px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#0b2740",
  },

  recommendationText: {
    margin: 0,
    color: "#5f7890",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  recommendationMeta: {
    marginTop: "12px",
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  recommendationMeta: {
    marginTop: "12px",
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  noRecommendation: {
    margin: "20px 24px 24px",
    padding: "18px",
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    background: "#fff9e9",
    border:
      "1px solid #f0dfad",
    borderRadius: "12px",
    color: "#725b1c",
  },

  noRecommendationText: {
    margin: "6px 0 0",
    color: "#725b1c",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  footer: {
    maxWidth: "1250px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#6d8295",
    fontSize: "12px",
  },

  bottomActions: {
    maxWidth: "1250px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },

  emptyCard: {
    maxWidth: "700px",
    margin: "90px auto",
    padding: "50px 35px",
    textAlign: "center",
    background: "#fff",
    border:
      "1px solid #dce8f2",
    borderRadius: "18px",
    boxShadow:
      "0 8px 25px rgba(11,39,64,.06)",
  },

  emptyIcon: {
    width: "70px",
    height: "70px",
    margin: "0 auto 18px",
    borderRadius: "20px",
    background: "#e9f5ff",
    color: "#0878e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "24px",
    fontWeight: 800,
    color: "#0b2740",
  },

  emptyText: {
    maxWidth: "520px",
    margin: "0 auto 24px",
    color: "#678096",
    lineHeight: 1.6,
  },

  errorBox: {
    marginBottom: "20px",
    padding: "12px 14px",
    border:
      "1px solid #efb5b5",
    borderRadius: "9px",
    background: "#fff0f0",
    color: "#c63e3e",
    fontSize: "13px",
  },
};