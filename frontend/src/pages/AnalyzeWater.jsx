import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Loader2,
  Upload,
} from "lucide-react";

import { analyzeWater } from "../services/api";

/* =========================================================
   DEFAULT FORM
========================================================= */

const DEFAULT_FORM = {
  country: "India",
  waterbodyType: "River",
  ph: "7.2",
  temperature: "25",
  dissolvedOxygen: "8.5",
  bod: "3.0",
  nitrate: "0.5",
  ammonia: "0.05",
  nitrogen: "1.5",
  orthophosphate: "0.2",
  year: "2026",
  month: "10",
};

/* =========================================================
   HELPERS
========================================================= */

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const buildPayload = (form) => ({
  Country: String(form.country).trim(),
  Waterbody_Type: String(form.waterbodyType).trim(),

  Ammonia: Number(form.ammonia),

  Biochemical_Oxygen_Demand: Number(
    form.bod
  ),

  Dissolved_Oxygen: Number(
    form.dissolvedOxygen
  ),

  Orthophosphate: Number(
    form.orthophosphate
  ),

  pH: Number(form.ph),
  Temperature: Number(form.temperature),
  Nitrogen: Number(form.nitrogen),
  Nitrate: Number(form.nitrate),

  Year: Number(form.year),
  Month: Number(form.month),
});

/* =========================================================
   ERROR FORMATTER
========================================================= */

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        const location = Array.isArray(item?.loc)
          ? item.loc.join(" → ")
          : "";

        return `${location}${
          location ? ": " : ""
        }${item?.msg || "Invalid value"}`;
      })
      .join(" | ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (error?.userMessage) {
    return error.userMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return (
    "We could not connect to the analysis service. " +
    "Please check that the backend is running."
  );
};

/* =========================================================
   VALIDATION
========================================================= */

const validateForm = (form) => {
  const required = [
    ["country", "Country"],
    ["waterbodyType", "Waterbody Type"],
    ["ph", "pH"],
    ["temperature", "Temperature"],
    ["dissolvedOxygen", "Dissolved Oxygen"],
    ["bod", "BOD"],
    ["nitrate", "Nitrate"],
    ["ammonia", "Ammonia"],
    ["nitrogen", "Nitrogen"],
    ["orthophosphate", "Orthophosphate"],
    ["year", "Year"],
    ["month", "Month"],
  ];

  for (const [key, label] of required) {
    if (
      form[key] === undefined ||
      form[key] === null ||
      String(form[key]).trim() === ""
    ) {
      return `${label} is required.`;
    }
  }

  const numeric = [
    ["ph", "pH"],
    ["temperature", "Temperature"],
    ["dissolvedOxygen", "Dissolved Oxygen"],
    ["bod", "BOD"],
    ["nitrate", "Nitrate"],
    ["ammonia", "Ammonia"],
    ["nitrogen", "Nitrogen"],
    ["orthophosphate", "Orthophosphate"],
    ["year", "Year"],
    ["month", "Month"],
  ];

  for (const [key, label] of numeric) {
    const value = Number(form[key]);

    if (!Number.isFinite(value)) {
      return `${label} must be a valid number.`;
    }
  }

  const month = Number(form.month);

  if (month < 1 || month > 12) {
    return "Month must be between 1 and 12.";
  }

  const ph = Number(form.ph);

  if (ph < 0 || ph > 14) {
    return "pH must be between 0 and 14.";
  }

  return "";
};

/* =========================================================
   SAVE COMPLETE REAL ANALYSIS
========================================================= */

const saveAnalysis = (backendResponse, payload) => {
  const backend = backendResponse || {};

  /*
   * Backend returns:
   * water_quality
   * confidence
   * explanation
   * recommended_actions
   * input_data
   */

  const realExplanation =
    backend.explanation ??
    backend.shap_explanation ??
    backend.shap ??
    [];

  /*
   * Backend explanation contains:
   *
   * [
   *   {
   *     feature: "...",
   *     importance: 0.123
   *   }
   * ]
   *
   * Keep the exact backend values and expose them
   * under shap_values as a compatibility alias.
   */
  let shapValues = backend.shap_values;

  if (
    !Array.isArray(shapValues) &&
    Array.isArray(realExplanation)
  ) {
    shapValues = realExplanation
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        if (
          item.feature === undefined ||
          item.importance === undefined
        ) {
          return null;
        }

        return {
          feature: item.feature,
          shap_value: Number(item.importance),
        };
      })
      .filter(
        (item) =>
          item &&
          Number.isFinite(item.shap_value)
      );
  }

  /*
   * Preserve real recommendations from backend.
   *
   * Do NOT create fake recommendations.
   */
  const realRecommendations =
    backend.recommended_actions ??
    backend.recommendedActions ??
    backend.recommendations ??
    [];

  /*
   * Build ONE complete object.
   *
   * The submitted payload is stored with the real backend
   * result because the backend result page needs to display
   * the values entered by the user.
   */
  const result = {
    ...backend,

    /*
     * Normalized prediction aliases
     */
    prediction:
      backend.prediction ??
      backend.water_quality ??
      backend.predicted_class ??
      backend.predictedClass ??
      "Unknown",

    water_quality:
      backend.water_quality ??
      backend.prediction ??
      null,

    /*
     * Real backend confidence
     */
    confidence:
      backend.confidence ?? null,

    /*
     * Real backend explanation
     */
    explanation: realExplanation,

    /*
     * SHAP compatibility alias
     */
    shap_values: shapValues ?? [],

    /*
     * REAL backend recommendations
     */
    recommended_actions: realRecommendations,

    recommendations: realRecommendations,

    /*
     * CRITICAL:
     * Store the EXACT submitted values.
     */
    input_data: {
      ...payload,
      BOD: payload.Biochemical_Oxygen_Demand,
      DO: payload.Dissolved_Oxygen,
    },

    /*
     * Extra compatibility aliases for the result page.
     */
    parameters: {
      ...payload,
      BOD: payload.Biochemical_Oxygen_Demand,
      DO: payload.Dissolved_Oxygen,
    },

    input: {
      ...payload,
      BOD: payload.Biochemical_Oxygen_Demand,
      DO: payload.Dissolved_Oxygen,
    },

    created_at: new Date().toISOString(),
  };

  console.log(
    "========== AQUAXAI COMPLETE RESULT =========="
  );
  console.log(result);
  console.log(
    "=============================================="
  );

  /*
   * Latest result
   */
  localStorage.setItem(
    "aquaxai-latest-analysis",
    JSON.stringify(result)
  );

  /*
   * Compatibility result key
   */
  localStorage.setItem(
    "aquaxai-analysis-result",
    JSON.stringify(result)
  );

  /*
   * Input copy
   */
  localStorage.setItem(
    "aquaxai-analysis-input",
    JSON.stringify(payload)
  );

  /*
   * History
   */
  let history = [];

  try {
    const oldHistory =
      localStorage.getItem(
        "aquaxai-history"
      );

    const parsed = oldHistory
      ? JSON.parse(oldHistory)
      : [];

    if (Array.isArray(parsed)) {
      history = parsed;
    }
  } catch {
    history = [];
  }

  const newHistory = [
    result,
    ...history,
  ].slice(0, 25);

  localStorage.setItem(
    "aquaxai-history",
    JSON.stringify(newHistory)
  );

  return result;
};

/* =========================================================
   PROCESSING ANIMATION
   NO SMALL CENTRAL WATER DROP
   RAIN FALLS FROM TOP
========================================================= */

function WaterProcessingAnimation({
  complete,
}) {
  const rainDrops = Array.from(
    { length: 55 },
    (_, index) => index
  );

  return (
    <div className="aqua-processing-overlay">

      <div className="aqua-processing-background">
        <div className="aqua-glow aqua-glow-one" />
        <div className="aqua-glow aqua-glow-two" />

        <div className="aqua-rain">
          {rainDrops.map((index) => (
            <span
              key={index}
              className="aqua-rain-drop"
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(
                  (index * 0.11) %
                  2.8
                ).toFixed(2)}s`,
                animationDuration: `${(
                  1.35 +
                  ((index * 17) % 14) / 10
                ).toFixed(2)}s`,
              }}
            />
          ))}
        </div>

        <div className="aqua-water-floor">
          <div className="aqua-water-wave wave-one" />
          <div className="aqua-water-wave wave-two" />
          <div className="aqua-water-wave wave-three" />

          <div className="aqua-surface-ripple ripple-one" />
          <div className="aqua-surface-ripple ripple-two" />
          <div className="aqua-surface-ripple ripple-three" />
        </div>
      </div>

      <div className="aqua-processing-panel">

        <div className="aqua-processing-logo">
          <div className="aqua-logo-drop">
            <Droplets size={30} />
          </div>

          <div>
            <div className="aqua-brand">
              Aqua<span>XAI</span>
            </div>

            <div className="aqua-brand-subtitle">
              AI-Powered Water Quality Analysis
            </div>
          </div>
        </div>

        <div className="aqua-progress-track">
          <div
            className={`aqua-progress-bar ${
              complete
                ? "complete"
                : ""
            }`}
          />
        </div>

        {!complete ? (
          <>
            <div className="aqua-loader-circle">
              <Loader2
                size={54}
                className="aqua-spin"
              />
            </div>

            <h2>
              Analyzing Water Parameters
            </h2>

            <p>
              Running AI model and generating
              explanation...
            </p>

            <div className="aqua-processing-status">
              <span />
              Processing your sample
            </div>
          </>
        ) : (
          <>
            <div className="aqua-complete-circle">
              <CheckCircle2 size={52} />
            </div>

            <h2>
              Analysis Complete
            </h2>

            <p>
              Preparing your results...
            </p>
          </>
        )}
      </div>

      <style>{`
        .aqua-processing-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              180deg,
              #041522 0%,
              #06304a 50%,
              #064663 100%
            );
          color: #ffffff;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .aqua-processing-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .aqua-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }

        .aqua-glow-one {
          width: 600px;
          height: 420px;
          left: 50%;
          top: -180px;
          transform: translateX(-50%);
          background:
            rgba(62, 197, 255, 0.16);
        }

        .aqua-glow-two {
          width: 500px;
          height: 280px;
          left: 50%;
          bottom: 5%;
          transform: translateX(-50%);
          background:
            rgba(0, 153, 214, 0.12);
        }

        .aqua-rain {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .aqua-rain-drop {
          position: absolute;
          top: -90px;
          width: 2px;
          height: 65px;
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              transparent 0%,
              rgba(220, 248, 255, 0.45) 25%,
              rgba(98, 210, 255, 0.95) 70%,
              transparent 100%
            );
          opacity: 0;
          transform: rotate(7deg);
          animation:
            aquaRainFall
            linear
            infinite;
        }

        @keyframes aquaRainFall {
          0% {
            transform:
              translate3d(0, -100px, 0)
              rotate(7deg);
            opacity: 0;
          }

          8% {
            opacity: 0.8;
          }

          48% {
            opacity: 0.95;
          }

          78% {
            opacity: 0.5;
          }

          100% {
            transform:
              translate3d(-40px, 115vh, 0)
              rotate(7deg);
            opacity: 0;
          }
        }

        .aqua-water-floor {
          position: absolute;
          left: -10%;
          bottom: -5%;
          width: 120%;
          height: 31%;
          border-radius:
            50% 50% 0 0 /
            17% 17% 0 0;
          background:
            linear-gradient(
              180deg,
              rgba(50, 189, 232, 0.30),
              rgba(7, 117, 168, 0.62),
              rgba(3, 55, 89, 0.96)
            );
          box-shadow:
            0 -24px 70px
            rgba(61, 201, 255, 0.16);
          animation:
            aquaSurfaceRise
            1.1s
            ease-out;
        }

        @keyframes aquaSurfaceRise {
          from {
            transform: translateY(80px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .aqua-water-wave {
          position: absolute;
          left: -5%;
          width: 110%;
          height: 55px;
          border-top:
            2px solid
            rgba(220, 249, 255, 0.18);
          border-radius: 50%;
        }

        .wave-one {
          top: 13px;
          animation:
            aquaWaveOne
            3.2s
            ease-in-out
            infinite;
        }

        .wave-two {
          top: 35px;
          opacity: 0.55;
          animation:
            aquaWaveTwo
            4.4s
            ease-in-out
            infinite;
        }

        .wave-three {
          top: 55px;
          opacity: 0.35;
          animation:
            aquaWaveThree
            5.1s
            ease-in-out
            infinite;
        }

        @keyframes aquaWaveOne {
          0%,
          100% {
            transform:
              translateX(-18px)
              scaleX(1);
          }

          50% {
            transform:
              translateX(18px)
              scaleX(1.03);
          }
        }

        @keyframes aquaWaveTwo {
          0%,
          100% {
            transform:
              translateX(15px)
              scaleX(1.02);
          }

          50% {
            transform:
              translateX(-15px)
              scaleX(0.98);
          }
        }

        @keyframes aquaWaveThree {
          0%,
          100% {
            transform:
              translateX(-10px);
          }

          50% {
            transform:
              translateX(10px);
          }
        }

        .aqua-surface-ripple {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          border:
            1px solid
            rgba(220, 250, 255, 0.42);
          border-radius: 50%;
          opacity: 0;
        }

        .ripple-one {
          top: 18px;
          width: 70px;
          height: 18px;
          animation:
            aquaRipple
            2.4s
            ease-out
            infinite;
        }

        .ripple-two {
          top: 18px;
          width: 150px;
          height: 38px;
          animation:
            aquaRipple
            2.4s
            0.65s
            ease-out
            infinite;
        }

        .ripple-three {
          top: 18px;
          width: 245px;
          height: 60px;
          animation:
            aquaRipple
            2.4s
            1.25s
            ease-out
            infinite;
        }

        @keyframes aquaRipple {
          0% {
            transform:
              translateX(-50%)
              scale(0.35);
            opacity: 0;
          }

          20% {
            opacity: 0.55;
          }

          100% {
            transform:
              translateX(-50%)
              scale(1);
            opacity: 0;
          }
        }

        .aqua-processing-panel {
          position: relative;
          z-index: 20;
          width: min(540px, calc(100vw - 40px));
          padding: 38px 38px 34px;
          border:
            1px solid
            rgba(255,255,255,0.12);
          border-radius: 24px;
          background:
            rgba(3, 25, 42, 0.68);
          backdrop-filter:
            blur(18px);
          box-shadow:
            0 30px 90px
            rgba(0,0,0,0.28);
          text-align: center;
        }

        .aqua-processing-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }

        .aqua-logo-drop {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(33, 139, 221, 0.22);
          color: #66d4ff;
        }

        .aqua-brand {
          text-align: left;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .aqua-brand span {
          color: #62d4ff;
        }

        .aqua-brand-subtitle {
          margin-top: 3px;
          text-align: left;
          font-size: 11px;
          color:
            rgba(220,243,252,0.72);
        }

        .aqua-progress-track {
          width: 100%;
          height: 5px;
          border-radius: 999px;
          overflow: hidden;
          background:
            rgba(255,255,255,0.10);
          margin-bottom: 38px;
        }

        .aqua-progress-bar {
          width: 68%;
          height: 100%;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              #1389ff,
              #66d9ff
            );
          animation:
            aquaProgress
            2.4s
            ease-in-out
            infinite;
        }

        .aqua-progress-bar.complete {
          width: 100%;
          animation: none;
        }

        @keyframes aquaProgress {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(150%);
          }
        }

        .aqua-loader-circle,
        .aqua-complete-circle {
          width: 92px;
          height: 92px;
          margin: 0 auto 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(34, 154, 222, 0.16);
          border:
            1px solid
            rgba(110, 219, 255, 0.22);
        }

        .aqua-loader-circle {
          color: #6bdcff;
        }

        .aqua-complete-circle {
          color: #4de08e;
          background:
            rgba(40, 197, 107, 0.13);
          border-color:
            rgba(77,224,142,0.3);
        }

        .aqua-spin {
          animation:
            aquaSpin
            1.1s
            linear
            infinite;
        }

        @keyframes aquaSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .aqua-processing-panel h2 {
          margin: 0;
          font-size: 25px;
          font-weight: 800;
          color: #ffffff;
        }

        .aqua-processing-panel p {
          margin: 10px 0 0;
          color:
            rgba(223,242,250,0.76);
          font-size: 14px;
        }

        .aqua-processing-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 21px;
          padding: 8px 13px;
          border-radius: 999px;
          background:
            rgba(255,255,255,0.06);
          color:
            rgba(226,244,251,0.72);
          font-size: 12px;
        }

        .aqua-processing-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4de08e;
          box-shadow:
            0 0 12px
            rgba(77,224,142,0.75);
        }

        @media (max-width: 600px) {
          .aqua-processing-panel {
            padding: 30px 22px 28px;
          }

          .aqua-processing-panel h2 {
            font-size: 21px;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  min,
  max,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={styles.input}
      />
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AnalyzeWater() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] =
    useState("manual");

  const [form, setForm] =
    useState(DEFAULT_FORM);

  const [loading, setLoading] =
    useState(false);

  const [animationComplete, setAnimationComplete] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = (
    key,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* =======================================================
     SAMPLE DATA
  ======================================================= */

  const handleSampleData = () => {
    setForm({
      ...DEFAULT_FORM,
    });

    setActiveTab("manual");
    setError("");
    setSuccess(
      "Sample water data loaded successfully."
    );
  };

  /* =======================================================
     FILE UPLOAD
  ======================================================= */

  const handleFileUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const text =
          String(
            reader.result || ""
          ).trim();

        if (!text) {
          throw new Error(
            "The selected file is empty."
          );
        }

        let data;

        if (
          file.name
            .toLowerCase()
            .endsWith(".json")
        ) {
          data = JSON.parse(text);

          if (Array.isArray(data)) {
            data = data[0];
          }
        } else {
          const lines = text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(Boolean);

          if (lines.length < 2) {
            throw new Error(
              "CSV must contain a header and at least one data row."
            );
          }

          const headers =
            lines[0]
              .split(",")
              .map((item) =>
                item.trim()
              );

          const values =
            lines[1]
              .split(",")
              .map((item) =>
                item.trim()
              );

          data = {};

          headers.forEach(
            (header, index) => {
              data[header] =
                values[index] ?? "";
            }
          );
        }

        const normalized = {};

        Object.entries(
          data || {}
        ).forEach(
          ([key, value]) => {
            normalized[
              key
                .toLowerCase()
                .replace(
                  /[\s_\-()/°]+/g,
                  ""
                )
            ] = value;
          }
        );

        const getValue = (
          aliases
        ) => {
          for (const alias of aliases) {
            const value =
              normalized[
                alias
                  .toLowerCase()
                  .replace(
                    /[\s_\-()/°]+/g,
                    ""
                  )
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

        setForm((previous) => ({
          country:
            getValue([
              "Country",
            ]) ??
            previous.country,

          waterbodyType:
            getValue([
              "Waterbody_Type",
              "Waterbody Type",
              "Waterbody",
              "Type",
            ]) ??
            previous.waterbodyType,

          ph:
            getValue([
              "pH",
              "PH",
            ]) ??
            previous.ph,

          temperature:
            getValue([
              "Temperature",
              "Temperature C",
              "Temperature (°C)",
            ]) ??
            previous.temperature,

          dissolvedOxygen:
            getValue([
              "Dissolved_Oxygen",
              "Dissolved Oxygen",
              "DissolvedOxygen",
              "DO",
            ]) ??
            previous.dissolvedOxygen,

          bod:
            getValue([
              "Biochemical_Oxygen_Demand",
              "Biochemical Oxygen Demand",
              "BiochemicalOxygenDemand",
              "BOD",
            ]) ??
            previous.bod,

          nitrate:
            getValue([
              "Nitrate",
            ]) ??
            previous.nitrate,

          ammonia:
            getValue([
              "Ammonia",
            ]) ??
            previous.ammonia,

          nitrogen:
            getValue([
              "Nitrogen",
            ]) ??
            previous.nitrogen,

          orthophosphate:
            getValue([
              "Orthophosphate",
            ]) ??
            previous.orthophosphate,

          year:
            getValue([
              "Year",
            ]) ??
            previous.year,

          month:
            getValue([
              "Month",
            ]) ??
            previous.month,
        }));

        setActiveTab("manual");

        setSuccess(
          `${file.name} loaded successfully.`
        );
      } catch (uploadError) {
        console.error(
          "Upload error:",
          uploadError
        );

        setError(
          uploadError.message ||
            "Could not read this file. Use a valid CSV or JSON file."
        );
      }
    };

    reader.onerror = () => {
      setError(
        "Could not read the selected file."
      );
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleAnalyze = async (
    event
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const validationError =
      validateForm(form);

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    const payload =
      buildPayload(form);

    console.log(
      "================================="
    );

    console.log(
      "AquaXAI REQUEST PAYLOAD"
    );

    console.log(payload);

    console.log(
      "================================="
    );

    setLoading(true);
    setAnimationComplete(false);

    try {
      /*
       * Start backend request immediately.
       */
      const backendRequest =
        analyzeWater(payload);

      /*
       * Keep professional animation
       * visible for at least 3.2 seconds.
       */
      const animationTimer =
        sleep(3200);

      const [response] =
        await Promise.all([
          backendRequest,
          animationTimer,
        ]);

      console.log(
        "================================="
      );

      console.log(
        "AquaXAI BACKEND RESPONSE"
      );

      console.log(
        response?.data
      );

      console.log(
        "================================="
      );

      /*
       * Show completion state.
       */
      setAnimationComplete(true);

      await sleep(650);

      /*
       * Save COMPLETE real result.
       *
       * This is the important fix.
       */
      const result =
        saveAnalysis(
          response?.data,
          payload
        );

      setSuccess(
        "Water analysis completed successfully."
      );

      /*
       * Pass the same complete object
       * to AnalysisResult.
       */
      navigate(
        "/analysis-result",
        {
          state: {
            analysis: result,
            result,
            data: result,
          },
        }
      );
    } catch (err) {
      console.error(
        "================================="
      );

      console.error(
        "AquaXAI ANALYSIS ERROR"
      );

      console.error(err);

      console.error(
        err?.response?.data
      );

      console.error(
        "================================="
      );

      setError(
        getErrorMessage(err)
      );

      setLoading(false);
      setAnimationComplete(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div style={styles.page}>

      {loading && (
        <WaterProcessingAnimation
          complete={
            animationComplete
          }
        />
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            AQUAXAI • WATER INTELLIGENCE
          </div>

          <h1 style={styles.title}>
            Analyze Water
          </h1>

          <p style={styles.subtitle}>
            Enter water sample parameters
            to get AI-powered analysis and
            recommendations.
          </p>
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} />

          <div>
            <strong>
              Analysis failed
            </strong>

            <div
              style={{
                marginTop: 4,
              }}
            >
              {error}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && !loading && (
        <div style={styles.successBox}>
          <CheckCircle2 size={19} />

          <span>
            {success}
          </span>
        </div>
      )}

      {/* ===================================================
          MAIN CARD
      =================================================== */}

      <div style={styles.card}>

        {/* =================================================
            TABS
        ================================================= */}

        <div style={styles.tabs}>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              setError("");
              setSuccess("");
            }}
            style={{
              ...styles.tab,
              ...(activeTab === "manual"
                ? styles.activeTab
                : {}),
            }}
          >
            <FlaskConical size={18} />
            Manual Input
          </button>

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            style={{
              ...styles.tab,
              ...(activeTab === "upload"
                ? styles.activeTab
                : {}),
            }}
          >
            <Upload size={18} />
            Upload File
          </button>

          <button
            type="button"
            onClick={
              handleSampleData
            }
            style={styles.tab}
          >
            <Droplets size={18} />
            Use Sample Data
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={(event) => {
              setActiveTab(
                "upload"
              );
              handleFileUpload(event);
            }}
            style={{
              display: "none",
            }}
          />
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        {activeTab === "manual" && (
          <form
            onSubmit={
              handleAnalyze
            }
            style={styles.form}
          >

            <div
              style={
                styles.sectionHeader
              }
            >
              <h2>
                Water Sample Parameters
              </h2>

              <p>
                Enter the measured values
                for the water sample.
              </p>
            </div>

            <div
              style={
                styles.formGrid
              }
            >

              <Field
                label="Country"
                value={
                  form.country
                }
                onChange={(value) =>
                  updateField(
                    "country",
                    value
                  )
                }
              />

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Waterbody Type
                </label>

                <select
                  value={
                    form.waterbodyType
                  }
                  onChange={(event) =>
                    updateField(
                      "waterbodyType",
                      event.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="River">
                    River
                  </option>

                  <option value="Lake">
                    Lake
                  </option>

                  <option value="Pond">
                    Pond
                  </option>

                  <option value="Groundwater">
                    Groundwater
                  </option>

                  <option value="Reservoir">
                    Reservoir
                  </option>

                  <option value="Stream">
                    Stream
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <Field
                label="pH"
                type="number"
                step="0.01"
                value={form.ph}
                onChange={(value) =>
                  updateField(
                    "ph",
                    value
                  )
                }
              />

              <Field
                label="Temperature (°C)"
                type="number"
                step="0.1"
                value={
                  form.temperature
                }
                onChange={(value) =>
                  updateField(
                    "temperature",
                    value
                  )
                }
              />

              <Field
                label="Dissolved Oxygen (mg/L)"
                type="number"
                step="0.01"
                value={
                  form.dissolvedOxygen
                }
                onChange={(value) =>
                  updateField(
                    "dissolvedOxygen",
                    value
                  )
                }
              />

              <Field
                label="BOD (mg/L)"
                type="number"
                step="0.01"
                value={form.bod}
                onChange={(value) =>
                  updateField(
                    "bod",
                    value
                  )
                }
              />

              <Field
                label="Nitrate (mg/L)"
                type="number"
                step="0.01"
                value={
                  form.nitrate
                }
                onChange={(value) =>
                  updateField(
                    "nitrate",
                    value
                  )
                }
              />

              <Field
                label="Ammonia (mg/L)"
                type="number"
                step="0.01"
                value={
                  form.ammonia
                }
                onChange={(value) =>
                  updateField(
                    "ammonia",
                    value
                  )
                }
              />

              <Field
                label="Nitrogen (mg/L)"
                type="number"
                step="0.01"
                value={
                  form.nitrogen
                }
                onChange={(value) =>
                  updateField(
                    "nitrogen",
                    value
                  )
                }
              />

              <Field
                label="Orthophosphate (mg/L)"
                type="number"
                step="0.01"
                value={
                  form.orthophosphate
                }
                onChange={(value) =>
                  updateField(
                    "orthophosphate",
                    value
                  )
                }
              />

              <Field
                label="Year"
                type="number"
                min="2000"
                max="2100"
                value={form.year}
                onChange={(value) =>
                  updateField(
                    "year",
                    value
                  )
                }
              />

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Month
                </label>

                <select
                  value={form.month}
                  onChange={(event) =>
                    updateField(
                      "month",
                      event.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="1">
                    January
                  </option>

                  <option value="2">
                    February
                  </option>

                  <option value="3">
                    March
                  </option>

                  <option value="4">
                    April
                  </option>

                  <option value="5">
                    May
                  </option>

                  <option value="6">
                    June
                  </option>

                  <option value="7">
                    July
                  </option>

                  <option value="8">
                    August
                  </option>

                  <option value="9">
                    September
                  </option>

                  <option value="10">
                    October
                  </option>

                  <option value="11">
                    November
                  </option>

                  <option value="12">
                    December
                  </option>
                </select>
              </div>

            </div>

            <div
              style={
                styles.formFooter
              }
            >
              <div
                style={
                  styles.infoText
                }
              >
                <Droplets size={18} />

                <span>
                  Your sample will be
                  processed using the
                  AquaXAI ML model with
                  XAI/SHAP explanation.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={
                  styles.analyzeButton
                }
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      style={{
                        animation:
                          "aqSubmitSpin 1s linear infinite",
                      }}
                    />

                    Analyzing Water...
                  </>
                ) : (
                  <>
                    <FlaskConical
                      size={18}
                    />

                    Analyze Water
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* =================================================
            UPLOAD
        ================================================= */}

        {activeTab === "upload" && (
          <div
            style={
              styles.uploadArea
            }
          >
            <Upload
              size={44}
              style={{
                marginBottom: 12,
              }}
            />

            <h3>
              Upload Water Sample
            </h3>

            <p>
              Upload a CSV or JSON file
              containing your water-quality
              parameters.
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              style={
                styles.analyzeButton
              }
            >
              <Upload size={18} />
              Choose File
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes aqSubmitSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "34px 36px 60px",
    background: "#f5f9fc",
    color: "#0b2740",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  header: {
    maxWidth: "1250px",
    margin: "0 auto 24px",
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
    fontSize: "38px",
    lineHeight: 1.15,
    fontWeight: 800,
    color: "#08233f",
  },

  subtitle: {
    margin: "9px 0 0",
    fontSize: "15px",
    color: "#55718d",
  },

  errorBox: {
    maxWidth: "1250px",
    margin: "0 auto 16px",
    padding: "13px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    borderRadius: "10px",
    border: "1px solid #fca5a5",
    background: "#fff3f3",
    color: "#b91c1c",
    boxSizing: "border-box",
  },

  successBox: {
    maxWidth: "1250px",
    margin: "0 auto 16px",
    padding: "13px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderRadius: "10px",
    border: "1px solid #86efac",
    background: "#f0fdf4",
    color: "#166534",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "1250px",
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #dbe5ef",
    borderRadius: "17px",
    overflow: "hidden",
    boxShadow:
      "0 5px 20px rgba(11, 39, 64, 0.05)",
  },

  tabs: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px",
    borderBottom:
      "1px solid #dbe5ef",
    flexWrap: "wrap",
  },

  tab: {
    minHeight: "46px",
    padding: "0 19px",
    borderRadius: "10px",
    border: "1px solid #dbe5ef",
    background: "#ffffff",
    color: "#6c8095",
    fontSize: "14px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },

  activeTab: {
    background: "#087cf2",
    borderColor: "#087cf2",
    color: "#ffffff",
    boxShadow:
      "0 6px 16px rgba(8,124,242,0.20)",
  },

  form: {
    padding: "30px 32px 34px",
  },

  sectionHeader: {
    marginBottom: "28px",
  },

  sectionHeaderTitle: {
    margin: 0,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0b2740",
  },

  input: {
    width: "100%",
    minHeight: "48px",
    boxSizing: "border-box",
    padding: "0 14px",
    border:
      "1px solid #cbd9e8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#0b2740",
    fontSize: "15px",
    outline: "none",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "23px",
  },

  formFooter: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop:
      "1px solid #e4ebf2",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
  },

  infoText: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#526b84",
    fontSize: "13px",
  },

  analyzeButton: {
    border: "none",
    borderRadius: "10px",
    minHeight: "46px",
    padding: "0 20px",
    background: "#087cf2",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 6px 17px rgba(8,124,242,0.22)",
  },

  uploadArea: {
    padding: "70px 30px",
    textAlign: "center",
    color: "#61758c",
  },
};
