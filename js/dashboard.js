const API_BASE = "http://localhost:8080";

function getStoredToken() {
  return localStorage.getItem("quanmentToken") || sessionStorage.getItem("quanmentToken");
}

function getStoredUserName() {
  return localStorage.getItem("quanmentUserName") || sessionStorage.getItem("quanmentUserName") || "User";
}

function getStoredUserEmail() {
  return localStorage.getItem("quanmentUserEmail") || sessionStorage.getItem("quanmentUserEmail") || "";
}

function storeDashboardAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const name = params.get("name");
  const email = params.get("email");

  if (!token) return;

  localStorage.setItem("quanmentToken", token);
  localStorage.setItem("quanmentUserName", name || "User");
  localStorage.setItem("quanmentUserEmail", email || "");

  window.history.replaceState({}, document.title, "dashboard.html");
}

storeDashboardAuthFromUrl();

const MEASUREMENT_CONFIG = {
  LENGTH: {
    units: ["INCHES", "FEET", "YARDS", "CENTIMETERS"]
  },
  WEIGHT: {
    units: ["GRAM", "KILOGRAM", "POUND"]
  },
  VOLUME: {
    units: ["MILLILITRE", "LITRE", "GALLON"]
  },
  TEMPERATURE: {
    units: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
  }
};

const ALLOWED_OPERATIONS = {
  LENGTH: ["convert", "compare", "add", "subtract", "divide"],
  WEIGHT: ["convert", "compare", "add", "subtract", "divide"],
  VOLUME: ["convert", "compare", "add", "subtract", "divide"],
  TEMPERATURE: ["convert", "compare"]
};

document.addEventListener("DOMContentLoaded", function () {
  const token = getStoredToken();
  const name = getStoredUserName();

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("welcomeText").textContent = `Welcome, ${name}!`;
  document.getElementById("userName").textContent = name;

  setupMeasurementTypes();
  setupOperations();
  setupUnits();
  setupDynamicUI();

  document.getElementById("measurementType").addEventListener("change", onMeasurementTypeChange);
  document.getElementById("operation").addEventListener("change", setupDynamicUI);
  document.getElementById("calculateBtn").addEventListener("click", handleCalculate);
  document.getElementById("loadHistoryBtn").addEventListener("click", loadHistory);
  document.getElementById("clearHistoryViewBtn").addEventListener("click", clearHistoryView);
  document.getElementById("swapUnitsBtn").addEventListener("click", swapUnits);
  document.getElementById("resetBtn").addEventListener("click", resetCalculator);
});

function getAuthHeaders() {
  const token = getStoredToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function onMeasurementTypeChange() {
  setupOperations();
  setupUnits();
  setupDynamicUI();
}

function setupMeasurementTypes() {
  const measurementType = document.getElementById("measurementType");
  measurementType.innerHTML = Object.keys(MEASUREMENT_CONFIG)
    .map(type => `<option value="${type}">${formatLabel(type)}</option>`)
    .join("");
}

function setupOperations() {
  const type = document.getElementById("measurementType").value;
  const operations = ALLOWED_OPERATIONS[type] || ["convert"];

  document.getElementById("operation").innerHTML = operations
    .map(op => `<option value="${op}">${formatLabel(op)}</option>`)
    .join("");
}

function setupUnits() {
  const type = document.getElementById("measurementType").value;
  const units = MEASUREMENT_CONFIG[type]?.units || [];

  const options = units
    .map(unit => `<option value="${unit}">${formatLabel(unit)}</option>`)
    .join("");

  document.getElementById("unitA").innerHTML = options;
  document.getElementById("unitB").innerHTML = options;
  document.getElementById("outputUnit").innerHTML = options;

  if (units.length > 0) {
    document.getElementById("unitA").value = units[0];
    document.getElementById("outputUnit").value = units[0];
  }

  if (units.length > 1) {
    document.getElementById("unitB").value = units[1];
  } else if (units.length > 0) {
    document.getElementById("unitB").value = units[0];
  }
}

function setupDynamicUI() {
  const type = document.getElementById("measurementType").value;
  const operation = document.getElementById("operation").value;

  const quantityBCard = document.getElementById("quantityBCard");
  const valueBLabel = document.getElementById("valueBLabel");
  const unitBLabel = document.getElementById("unitBLabel");
  const valueB = document.getElementById("valueB");
  const outputCard = document.getElementById("outputCard");
  const operationHint = document.getElementById("operationHint");
  const labelA = document.getElementById("labelA");
  const labelB = document.getElementById("labelB");
  const outputUnitLabel = document.getElementById("outputUnitLabel");
  const outputBadge = document.getElementById("outputBadge");

  clearMessage();
  clearResult();

  if (operation === "convert") {
    quantityBCard.style.display = "block";
    outputCard.style.display = "none";

    valueBLabel.textContent = "Preview Value";
    unitBLabel.textContent = "Convert To Unit";
    valueB.value = "";
    valueB.disabled = true;
    valueB.placeholder = "Not needed";

    labelA.textContent = "Convert from";
    labelB.textContent = "Convert to";

    operationHint.textContent = `Convert ${formatLabel(type)} from one unit to another using Spring Boot.`;
  } else if (operation === "compare") {
    quantityBCard.style.display = "block";
    outputCard.style.display = "none";

    valueBLabel.textContent = "Second Value";
    unitBLabel.textContent = "Second Unit";
    valueB.disabled = false;
    valueB.placeholder = "Enter second value";

    labelA.textContent = "First quantity";
    labelB.textContent = "Second quantity";

    operationHint.textContent = `Compare two ${formatLabel(type)} values using Spring Boot.`;
  } else if (operation === "divide") {
    quantityBCard.style.display = "block";
    outputCard.style.display = "block";

    valueBLabel.textContent = "Second Value";
    unitBLabel.textContent = "Second Unit";
    valueB.disabled = false;
    valueB.placeholder = "Enter second value";

    labelA.textContent = "Input A";
    labelB.textContent = "Input B";

    if (outputUnitLabel) outputUnitLabel.textContent = "Reference Unit";
    if (outputBadge) outputBadge.textContent = "Choose reference unit";

    operationHint.textContent = `Divide two ${formatLabel(type)} values using the selected reference unit.`;
  } else {
    quantityBCard.style.display = "block";
    outputCard.style.display = "block";

    valueBLabel.textContent = "Second Value";
    unitBLabel.textContent = "Second Unit";
    valueB.disabled = false;
    valueB.placeholder = "Enter second value";

    labelA.textContent = "Input A";
    labelB.textContent = "Input B";

    if (outputUnitLabel) outputUnitLabel.textContent = "Output Unit";
    if (outputBadge) outputBadge.textContent = "Choose result unit";

    operationHint.textContent = `${formatLabel(operation)} two ${formatLabel(type)} values and choose the output unit.`;
  }
}

function swapUnits() {
  const unitA = document.getElementById("unitA");
  const unitB = document.getElementById("unitB");
  const valueA = document.getElementById("valueA");
  const valueB = document.getElementById("valueB");
  const operation = document.getElementById("operation").value;

  const tempUnit = unitA.value;
  unitA.value = unitB.value;
  unitB.value = tempUnit;

  if (operation !== "convert") {
    const tempValue = valueA.value;
    valueA.value = valueB.value;
    valueB.value = tempValue;
  }

  showMessage("Units swapped successfully.", "info");
}

function resetCalculator() {
  document.getElementById("valueA").value = "";
  document.getElementById("valueB").value = "";
  setupUnits();
  setupDynamicUI();
  clearResult();
  showMessage("Calculator reset.", "info");
}

function mapFrontendUnitToBackend(unit) {
  return unit;
}

function buildRequestBody(type, operation, valueA, unitA, valueB, unitB, outputUnit) {
  const body = {
    thisQuantityDTO: {
      value: valueA,
      unit: mapFrontendUnitToBackend(unitA),
      measurementType: type
    },
    thatQuantityDTO: {
      value: operation === "convert" ? 1 : valueB,
      unit: mapFrontendUnitToBackend(unitB),
      measurementType: type
    }
  };

  if (operation === "add" || operation === "subtract" || operation === "divide") {
    body.outputUnit = mapFrontendUnitToBackend(outputUnit);
  }

  return body;
}

async function callBackendOperation(endpoint, body) {
  const response = await fetch(`${API_BASE}/api/v1/quantities/${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function setResultState(type) {
  const card = document.querySelector(".result-card");
  if (!card) return;

  card.classList.remove(
    "compare-greater",
    "compare-less",
    "compare-equal",
    "result-success"
  );

  if (type) {
    card.classList.add(type);
  }
}

async function handleCalculate() {
  clearMessage();
  clearResult();

  const type = document.getElementById("measurementType").value;
  const operation = document.getElementById("operation").value;
  const valueA = parseFloat(document.getElementById("valueA").value);
  const rawValueB = document.getElementById("valueB").value;
  const valueB = rawValueB === "" ? NaN : parseFloat(rawValueB);
  const unitA = document.getElementById("unitA").value;
  const unitB = document.getElementById("unitB").value;
  const outputUnit = document.getElementById("outputUnit").value;

  if (isNaN(valueA)) {
    showMessage("Please enter the first value.", "error");
    return;
  }

  if (operation !== "convert" && isNaN(valueB)) {
    showMessage("Please enter the second value.", "error");
    return;
  }

  try {
    const body = buildRequestBody(type, operation, valueA, unitA, valueB, unitB, outputUnit);
    const data = await callBackendOperation(operation, body);

    if (typeof data === "number") {
      const divideUnit = outputUnit || unitA;

      setResultState("result-success");
      showResult(
        `${roundResult(data)}`,
        `${roundResult(valueA)} ${formatLabel(unitA)} ÷ ${roundResult(valueB)} ${formatLabel(unitB)}`
      );

      setSummary(
        `Calculated using ${formatLabel(divideUnit)} as reference.`,
        "Result is unitless."
      );

      showMessage("Division successful.", "success");
      return;
    }

    if (data.error) {
      setResultState("");
      showResult("Error", data.message || "Operation failed.");
      setSummary(formatLabel(operation), data.message || "Operation failed.");
      showMessage(data.message || "Operation failed.", "error");
      return;
    }

    if (operation === "compare") {
      let compareText = data.message || "Comparison completed.";
      let compareState = "compare-equal";
      let compareSymbol = "=";

      if (!data.message) {
        if (data.result === 1) {
          compareText = "First quantity is greater.";
          compareState = "compare-greater";
          compareSymbol = ">";
        } else if (data.result === -1) {
          compareText = "Second quantity is greater.";
          compareState = "compare-less";
          compareSymbol = "<";
        } else {
          compareText = "Both quantities are equal.";
          compareState = "compare-equal";
          compareSymbol = "=";
        }
      } else {
        if (data.result === 1) {
          compareState = "compare-greater";
          compareSymbol = ">";
        } else if (data.result === -1) {
          compareState = "compare-less";
          compareSymbol = "<";
        }
      }

      setResultState(compareState);
      showResult(compareSymbol, compareText);
      setSummary(
        `${roundResult(valueA)} ${formatLabel(unitA)} ${compareSymbol} ${roundResult(valueB)} ${formatLabel(unitB)}`,
        "Comparison processed successfully."
      );
      showMessage("Comparison successful.", "success");
      return;
    }

    if (operation === "convert") {
      setResultState("result-success");
      showResult(
        `${roundResult(data.result)} ${formatLabel(unitB)}`,
        `${roundResult(valueA)} ${formatLabel(unitA)} = ${roundResult(data.result)} ${formatLabel(unitB)}`
      );
      setSummary("Conversion completed successfully.", "Processed by Spring Boot.");
      showMessage("Conversion successful.", "success");
      return;
    }

    const resultUnit = operation === "add" || operation === "subtract" ? outputUnit : unitA;

    setResultState("result-success");
    showResult(
      `${roundResult(data.result)} ${formatLabel(resultUnit)}`,
      `${formatLabel(operation)} result`
    );
    setSummary(
      `${roundResult(valueA)} ${formatLabel(unitA)} ${symbolFor(operation)} ${roundResult(valueB)} ${formatLabel(unitB)}`,
      "Processed by Spring Boot."
    );
    showMessage(`${formatLabel(operation)} successful.`, "success");
  } catch (error) {
    setResultState("");
    showMessage(error.message || "Something went wrong.", "error");
  }
}

async function loadHistory() {
  clearMessage();

  try {
    const response = await fetch(`${API_BASE}/api/v1/quantities/history`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load history.");
    }

    renderHistory(data);
    showMessage("History loaded successfully.", "success");
  } catch (error) {
    showMessage(error.message || "Unable to load history. Check backend endpoint or token.", "error");
  }
}

function renderHistory(items) {
  const historyList = document.getElementById("historyList");

  if (!Array.isArray(items) || items.length === 0) {
    historyList.innerHTML = `<p class="empty-text">No history found.</p>`;
    return;
  }

  historyList.innerHTML = items.map(item => {
    const statusClass = item.error ? "error" : "success";
    const details = item.error
      ? (item.errorMessage || "Operation failed")
      : `${item.operand1 ?? "—"}, ${item.operand2 ?? "—"} → ${item.result ?? "—"}`;

    return `
      <div class="history-item ${statusClass}">
        <div>
          <strong>${item.operation || "Operation"}</strong>
          <p>${details}</p>
        </div>
      </div>
    `;
  }).join("");
}

function clearHistoryView() {
  document.getElementById("historyList").innerHTML = `<p class="empty-text">No history loaded yet.</p>`;
  showMessage("History view cleared.", "info");
}

function showMessage(message, type) {
  const box = document.getElementById("messageBox");
  box.textContent = message;
  box.className = `message-box ${type}`;
}

function clearMessage() {
  const box = document.getElementById("messageBox");
  box.textContent = "";
  box.className = "message-box";
}

function showResult(value, text) {
  document.getElementById("resultValue").textContent = value ?? "—";
  document.getElementById("resultText").textContent = text || "Result loaded.";
}

function clearResult() {
  document.getElementById("resultValue").textContent = "—";
  document.getElementById("resultText").textContent = "Your result will appear here.";
  setSummary("No calculation yet.", "Ready.");
  setResultState("");
}

function setSummary(summary, status) {
  document.getElementById("summaryLine").textContent = summary;
  document.getElementById("statusLine").textContent = status;
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Unexpected server response." };
  }
}

function roundResult(value) {
  return Number(value).toFixed(4).replace(/\.?0+$/, "");
}

function formatLabel(value) {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function symbolFor(operation) {
  if (operation === "add") return "+";
  if (operation === "subtract") return "-";
  if (operation === "divide") return "÷";
  return "";
}

function logout() {
  const token = getStoredToken();

  fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }).finally(() => {
    localStorage.removeItem("quanmentToken");
    localStorage.removeItem("quanmentUserName");
    localStorage.removeItem("quanmentUserEmail");

    sessionStorage.removeItem("quanmentToken");
    sessionStorage.removeItem("quanmentUserName");
    sessionStorage.removeItem("quanmentUserEmail");

    window.location.href = "index.html";
  });
}