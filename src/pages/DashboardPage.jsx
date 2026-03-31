import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";

const API_BASE = "http://localhost:8080";

const TYPES = {
  length: {
    label: "Length",
    units: ["Inches", "Feet", "Yards", "Centimeters"],
  },
  weight: {
    label: "Weight",
    units: ["Grams", "Kilograms", "Pounds"],
  },
  volume: {
    label: "Volume",
    units: ["Millilitres", "Litres", "Gallons"],
  },
  temperature: {
    label: "Temperature",
    units: ["Celsius", "Fahrenheit", "Kelvin"],
  },
};

const OPERATION_MAP = {
  length: ["Convert", "Add", "Subtract", "Divide", "Compare"],
  weight: ["Convert", "Add", "Subtract", "Divide", "Compare"],
  volume: ["Convert", "Add", "Subtract", "Divide", "Compare"],
  temperature: ["Convert", "Compare"],
};

const OPERATION_ENDPOINT = {
  Convert: "convert",
  Add: "add",
  Subtract: "subtract",
  Divide: "divide",
  Compare: "compare",
};

const HISTORY_OPERATION_MAP = {
  Convert: "CONVERT",
  Add: "ADD",
  Subtract: "SUBTRACT",
  Divide: "DIVIDE",
  Compare: "COMPARE",
};

function mapUnit(unit) {
  const map = {
    Inches: "INCHES",
    Feet: "FEET",
    Yards: "YARDS",
    Centimeters: "CENTIMETERS",

    Grams: "GRAM",
    Kilograms: "KILOGRAM",
    Pounds: "POUND",

    Millilitres: "MILLILITRE",
    Litres: "LITRE",
    Gallons: "GALLON",

    Celsius: "CELSIUS",
    Fahrenheit: "FAHRENHEIT",
    Kelvin: "KELVIN",
  };

  return map[unit] || unit;
}

function mapMeasurementType(type) {
  const map = {
    length: "LENGTH",
    weight: "WEIGHT",
    volume: "VOLUME",
    temperature: "TEMPERATURE",
  };

  return map[type] || type.toUpperCase();
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  return Number.isInteger(num)
    ? String(num)
    : parseFloat(num.toFixed(4)).toString();
}

function buildHistoryMessage(item) {
  if (!item) return "No details available.";

  const operation = String(item.operation || "").toUpperCase();
  const a = formatNumber(item.operand1);
  const b = formatNumber(item.operand2);
  const r = formatNumber(item.result);

  if (item.error) {
    return item.errorMessage || `${operation} failed.`;
  }

  switch (operation) {
    case "CONVERT":
      return `${a} → ${r}`;
    case "ADD":
      return `${a} + ${b} = ${r}`;
    case "SUBTRACT":
      return `${a} - ${b} = ${r}`;
    case "DIVIDE":
      return `${a} ÷ ${b} = ${r}`;
    case "COMPARE":
      if (Number(item.result) === 1) return `${a} vs ${b} → First greater`;
      if (Number(item.result) === -1) return `${a} vs ${b} → Second greater`;
      if (Number(item.result) === 0) return `${a} vs ${b} → Equal`;
      return `${a} vs ${b}`;
    default:
      return `${operation}: ${r}`;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("quanmentToken") ||
    sessionStorage.getItem("quanmentToken");

  const userName =
    localStorage.getItem("quanmentUserName") ||
    sessionStorage.getItem("quanmentUserName") ||
    "User";

  const [measurementType, setMeasurementType] = useState("length");
  const [operation, setOperation] = useState("Convert");

  const units = useMemo(() => TYPES[measurementType].units, [measurementType]);
  const operations = useMemo(
    () => OPERATION_MAP[measurementType],
    [measurementType]
  );

  const [unitA, setUnitA] = useState(TYPES.length.units[0]);
  const [unitB, setUnitB] = useState(TYPES.length.units[1]);
  const [outputUnit, setOutputUnit] = useState(TYPES.length.units[0]);

  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");

  const [resultValue, setResultValue] = useState("—");
  const [resultText, setResultText] = useState("Your result will appear here.");
  const [summaryLine, setSummaryLine] = useState("No calculation yet.");
  const [statusLine, setStatusLine] = useState("Ready.");

  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    const nextUnits = TYPES[measurementType].units;
    const nextOperations = OPERATION_MAP[measurementType];

    setOperation(nextOperations[0]);
    setUnitA(nextUnits[0]);
    setUnitB(nextUnits[1] || nextUnits[0]);
    setOutputUnit(nextUnits[0]);

    setValueA("");
    setValueB("");

    setResultValue("—");
    setResultText("Your result will appear here.");
    setSummaryLine("No calculation yet.");
    setStatusLine("Ready.");
  }, [measurementType]);

  function logout() {
    localStorage.removeItem("quanmentToken");
    localStorage.removeItem("quanmentUserName");
    localStorage.removeItem("quanmentUserEmail");
    sessionStorage.removeItem("quanmentToken");
    sessionStorage.removeItem("quanmentUserName");
    sessionStorage.removeItem("quanmentUserEmail");
    navigate("/");
  }

  function resetForm() {
    const nextUnits = TYPES[measurementType].units;
    const nextOperations = OPERATION_MAP[measurementType];

    setOperation(nextOperations[0]);
    setUnitA(nextUnits[0]);
    setUnitB(nextUnits[1] || nextUnits[0]);
    setOutputUnit(nextUnits[0]);

    setValueA("");
    setValueB("");

    setResultValue("—");
    setResultText("Your result will appear here.");
    setSummaryLine("No calculation yet.");
    setStatusLine("Ready.");
  }

  function swapUnits() {
    if (operation === "Convert" || operation === "Compare") return;

    setUnitA(unitB);
    setUnitB(unitA);
    setValueA(valueB);
    setValueB(valueA);
  }

  function buildPayload() {
    const backendMeasurementType = mapMeasurementType(measurementType);

    const payload = {
      thisQuantityDTO: {
        value: Number(valueA),
        unit: mapUnit(unitA),
        measurementType: backendMeasurementType,
      },
      thatQuantityDTO: {
        value: Number(valueB || 0),
        unit: mapUnit(unitB),
        measurementType: backendMeasurementType,
      },
      outputUnit:
        operation === "Compare" || operation === "Divide"
          ? null
          : outputUnit
          ? mapUnit(outputUnit)
          : null,
    };

    if (operation === "Convert") {
      payload.thatQuantityDTO = {
        value: 1,
        unit: mapUnit(outputUnit),
        measurementType: backendMeasurementType,
      };
      payload.outputUnit = mapUnit(outputUnit);
    }

    return payload;
  }

  function formatResult(data) {
    if (operation === "Compare") {
      if (data?.message) return data.message;
      if (data?.result === 1) return "First quantity is greater.";
      if (data?.result === -1) return "Second quantity is greater.";
      if (data?.result === 0) return "Both quantities are equal.";
      return "Comparison completed.";
    }

    if (data?.result !== undefined && data?.result !== null) {
      return operation === "Divide"
        ? String(data.result)
        : outputUnit
        ? `${data.result} ${outputUnit}`
        : String(data.result);
    }

    return "—";
  }

  function formatResultText(data) {
    if (operation === "Compare") {
      return data?.message || "Comparison completed.";
    }

    if (data?.error) {
      return data?.message || "Operation failed.";
    }

    if (operation === "Divide") {
      return data?.message || "Division completed successfully.";
    }

    return `${operation} completed successfully.`;
  }

  function formatSummary(data) {
    if (operation === "Convert") {
      return `${valueA} ${unitA} → ${formatResult(data)}`;
    }

    if (operation === "Compare") {
      return `${valueA} ${unitA} compared with ${valueB} ${unitB}`;
    }

    if (operation === "Divide") {
      return `${valueA} ${unitA} ÷ ${valueB} ${unitB} = ${data?.result ?? "—"}`;
    }

    const symbol =
      operation === "Add" ? "+" : operation === "Subtract" ? "-" : operation;

    return `${valueA} ${unitA} ${symbol} ${valueB} ${unitB} = ${formatResult(data)}`;
  }

  async function calculate() {
    if (!valueA.trim()) {
      setResultValue("—");
      setResultText("Please enter Quantity A.");
      setSummaryLine("Calculation failed.");
      setStatusLine("Quantity A is required.");
      return;
    }

    if (operation !== "Convert" && !valueB.trim()) {
      setResultValue("—");
      setResultText("Please enter Quantity B.");
      setSummaryLine("Calculation failed.");
      setStatusLine("Quantity B is required.");
      return;
    }

    setLoading(true);
    setStatusLine("Calculating...");

    try {
      const endpoint = OPERATION_ENDPOINT[operation];
      const payload = buildPayload();

      const response = await fetch(`${API_BASE}/api/v1/quantities/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `${operation} failed.`);
      }

      if (data?.error) {
        throw new Error(data?.message || `${operation} failed.`);
      }

      setResultValue(formatResult(data));
      setResultText(formatResultText(data));
      setSummaryLine(formatSummary(data));
      setStatusLine("Success.");
    } catch (error) {
      setResultValue("—");
      setResultText(error.message || "Something went wrong.");
      setSummaryLine("Calculation failed.");
      setStatusLine("Please check your inputs or backend API.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setStatusLine("Loading history...");

    try {
      const historyUrl =
        operation && HISTORY_OPERATION_MAP[operation]
          ? `${API_BASE}/api/v1/quantities/history/${HISTORY_OPERATION_MAP[operation]}`
          : `${API_BASE}/api/v1/quantities/history`;

      const response = await fetch(historyUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error("Failed to load history.");
      }

      setHistory(Array.isArray(data) ? data : []);
      setHistoryLoaded(true);
      setStatusLine(
        Array.isArray(data) && data.length > 0
          ? "History loaded."
          : "No history available."
      );
    } catch (error) {
      setHistory([]);
      setHistoryLoaded(true);
      setStatusLine(error.message || "Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function clearHistoryView() {
    setHistory([]);
    setHistoryLoaded(false);
    setStatusLine("History view cleared.");
  }

  async function deleteAllHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete all your history?"
    );

    if (!confirmed) return;

    setHistoryLoading(true);
    setStatusLine("Deleting all history...");

    try {
      const response = await fetch(`${API_BASE}/api/v1/quantities/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete history.");
      }

      setHistory([]);
      setHistoryLoaded(true);
      setStatusLine("All history deleted permanently.");
    } catch (error) {
      setStatusLine(error.message || "Failed to delete history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteHistoryItem(id) {
    const confirmed = window.confirm(
      "Delete this history item permanently?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/quantities/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete history item.");
      }

      setHistory((prev) => prev.filter((item) => item.id !== id));
      setStatusLine("History item deleted.");
    } catch (error) {
      setStatusLine(error.message || "Failed to delete history item.");
    }
  }

  const showSecondInput = operation !== "Convert";
  const isTemperature = measurementType === "temperature";
  const showOutputUnit = operation !== "Compare" && operation !== "Divide";

  return (
    <>
      <nav className="topbar">
        <div className="logo-wrap">
          <div className="logo-icon">Q</div>
          <div>
            <div className="logo-text">Quanment</div>
            <div className="logo-sub">Measurement Workspace</div>
          </div>
        </div>

        <div className="topbar-right">
          <span className="user-name">{userName}</span>
          <button className="logout-btn" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </nav>

      <main className="dashboard-shell">
        <div className="dashboard-container">
          <section className="hero-card">
            <div className="hero-left">
              <span className="hero-badge">Dashboard</span>
              <h1>Welcome back, {userName} 👋</h1>
              <p>
                Convert, compare and calculate measurements in a clean,
                focused workspace. Fast inputs, readable results, and less
                clutter.
              </p>
            </div>

            <div className="hero-right">
              <div className="hero-mini-card">
                <span>📏</span>
                <strong>Conversions</strong>
                <p>Smart & precise</p>
              </div>
              <div className="hero-mini-card">
                <span>🧠</span>
                <strong>Compare</strong>
                <p>Across any unit</p>
              </div>
              <div className="hero-mini-card">
                <span>⚡</span>
                <strong>Fast UI</strong>
                <p>No distractions</p>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="left-panel">
              <section className="tool-card">
                <div className="tool-header">
                  <div>
                    <h2>Measurement Calculator</h2>
                    <p>
                      {isTemperature
                        ? "Temperature supports only Convert and Compare."
                        : operation === "Divide"
                        ? "Division returns a ratio, so no output unit is needed."
                        : "Select a measurement type and operation to begin."}
                    </p>
                  </div>

                  <div className="tool-actions-top">
                    <button
                      className="secondary-btn small-btn"
                      onClick={swapUnits}
                      type="button"
                      disabled={!showSecondInput || operation === "Compare"}
                    >
                      Swap
                    </button>
                    <button
                      className="secondary-btn small-btn"
                      onClick={resetForm}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="tool-grid compact-two">
                  <div className="field-group">
                    <label>Measurement Type</label>
                    <select
                      value={measurementType}
                      onChange={(e) => setMeasurementType(e.target.value)}
                    >
                      {Object.entries(TYPES).map(([key, item]) => (
                        <option key={key} value={key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>Operation</label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                    >
                      {operations.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-grid">
                  <div className="input-card">
                    <div className="card-top">
                      <h3>Quantity A</h3>
                      <span className="mini-chip">First</span>
                    </div>

                    <div className="field-group" style={{ marginTop: "14px" }}>
                      <label>Value</label>
                      <input
                        type="number"
                        placeholder="Enter first value"
                        value={valueA}
                        onChange={(e) => setValueA(e.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label>Unit</label>
                      <select
                        value={unitA}
                        onChange={(e) => setUnitA(e.target.value)}
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {showSecondInput && (
                    <div className="input-card">
                      <div className="card-top">
                        <h3>Quantity B</h3>
                        <span className="mini-chip">Second</span>
                      </div>

                      <div className="field-group" style={{ marginTop: "14px" }}>
                        <label>Value</label>
                        <input
                          type="number"
                          placeholder="Enter second value"
                          value={valueB}
                          onChange={(e) => setValueB(e.target.value)}
                        />
                      </div>

                      <div className="field-group">
                        <label>Unit</label>
                        <select
                          value={unitB}
                          onChange={(e) => setUnitB(e.target.value)}
                        >
                          {units.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {showOutputUnit && (
                  <div className="output-card">
                    <div className="card-top">
                      <h3>Output Unit</h3>
                      <span className="mini-chip">Result</span>
                    </div>

                    <div className="field-group" style={{ marginTop: "14px" }}>
                      <label>Result Unit</label>
                      <select
                        value={outputUnit}
                        onChange={(e) => setOutputUnit(e.target.value)}
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="action-row">
                  <button
                    className="primary-btn"
                    onClick={calculate}
                    type="button"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? "Calculating..." : "Calculate →"}
                  </button>
                </div>
              </section>
            </div>

            <div className="right-panel">
              <section className="result-card highlight-card">
                <div className="card-top">
                  <h3>Live Result</h3>
                  <span className="mini-chip">
                    {operation === "Divide" ? "Ratio" : "Output"}
                  </span>
                </div>

                <div className="result-value">{resultValue}</div>
                <p className="result-text">{resultText}</p>

                <div className="summary-box">
                  <p className="summary-line">{summaryLine}</p>
                  <p className="summary-line muted">{statusLine}</p>
                </div>
              </section>

              <section className="history-card">
                <div className="history-header">
                  <div>
                    <h2>Calculation History</h2>
                    <p>View, clear from screen, or permanently delete your own history.</p>
                  </div>
                </div>

                <div className="history-list">
                  {!historyLoaded ? (
                    <p className="empty-text">Press "Load History" to view past calculations.</p>
                  ) : history.length === 0 ? (
                    <p className="empty-text">No history available.</p>
                  ) : (
                    history.map((item, index) => (
                      <div className="history-item" key={item.id || index}>
                        <div className="history-item-top">
                          <span className="history-operation-badge">
                            {String(item.operation || "Operation").toUpperCase()}
                          </span>

                          {item.id && (
                            <button
                              className="danger-btn small-btn"
                              type="button"
                              onClick={() => deleteHistoryItem(item.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        <div className="history-item-body">
                          <p>{buildHistoryMessage(item)}</p>
                          {item.error && (
                            <p className="summary-line muted" style={{ marginTop: "8px" }}>
                              Error entry
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="history-actions-bottom">
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={loadHistory}
                    disabled={historyLoading}
                  >
                    {historyLoading ? "Loading..." : "Load History"}
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={clearHistoryView}
                  >
                    Clear View
                  </button>

                  <button
                    className="danger-btn"
                    type="button"
                    onClick={deleteAllHistory}
                    disabled={historyLoading}
                  >
                    Delete All Permanently
                  </button>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}