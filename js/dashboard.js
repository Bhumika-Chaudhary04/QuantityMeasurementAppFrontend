/* ===========================
   dashboard.js — Converter
   =========================== */

// ---- CONVERSION DATA ----
const TYPES = {
  length: {
    units: ['Metres', 'Centimetres', 'Kilometres', 'Miles', 'Yards', 'Feet', 'Inches', 'Millimetres'],
    toBase: {
      'Metres': 1,
      'Centimetres': 0.01,
      'Kilometres': 1000,
      'Miles': 1609.344,
      'Yards': 0.9144,
      'Feet': 0.3048,
      'Inches': 0.0254,
      'Millimetres': 0.001
    },
    convert(val, from, to) {
      const base = val * this.toBase[from];
      return base / this.toBase[to];
    }
  },

  temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    convert(val, from, to) {
      // Convert to Celsius first (base)
      let celsius;
      if (from === 'Celsius')    celsius = val;
      if (from === 'Fahrenheit') celsius = (val - 32) * 5 / 9;
      if (from === 'Kelvin')     celsius = val - 273.15;

      // Convert from Celsius to target
      if (to === 'Celsius')    return celsius;
      if (to === 'Fahrenheit') return celsius * 9 / 5 + 32;
      if (to === 'Kelvin')     return celsius + 273.15;
    }
  },

  volume: {
    units: ['Litres', 'Millilitres', 'Cubic Metres', 'Gallons (US)', 'Gallons (UK)', 'Fluid Ounces', 'Cups', 'Tablespoons'],
    toBase: {
      'Litres': 1,
      'Millilitres': 0.001,
      'Cubic Metres': 1000,
      'Gallons (US)': 3.78541,
      'Gallons (UK)': 4.54609,
      'Fluid Ounces': 0.0295735,
      'Cups': 0.236588,
      'Tablespoons': 0.0147868
    },
    convert(val, from, to) {
      const base = val * this.toBase[from];
      return base / this.toBase[to];
    }
  }
};

// ---- STATE ----
let currentType = 'length';
let history     = JSON.parse(localStorage.getItem('quanment_history') || '[]');

// ---- INIT ----
document.addEventListener('DOMContentLoaded', function () {
  loadSession();
  populateUnits();
});

// ---- SESSION ----
function loadSession() {
  const session = JSON.parse(localStorage.getItem('quanment_session') || 'null');
  if (!session) {
    // No session — redirect to login
    window.location.href = 'index.html';
    return;
  }
  // Set user initials in nav
  const navUser = document.getElementById('navUser');
  if (navUser) navUser.textContent = session.initials || 'U';
}

function handleLogout() {
  localStorage.removeItem('quanment_session');
  window.location.href = 'index.html';
}

// ---- TYPE SELECTION ----
function setType(type, el) {
  currentType = type;

  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  populateUnits();
  hideResult();
  document.getElementById('fromVal').value = '1';
  document.getElementById('toVal').value   = '';
  liveConvert();
}

// ---- POPULATE UNIT DROPDOWNS ----
function populateUnits() {
  const units = TYPES[currentType].units;

  ['fromUnit', 'toUnit'].forEach((id, i) => {
    const sel = document.getElementById(id);
    sel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    sel.selectedIndex = i === 0 ? 0 : 1;
  });

  liveConvert();
}

// ---- FORMAT NUMBER ----
function formatNum(n) {
  if (isNaN(n) || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 0.0001 && n !== 0)) {
    return n.toExponential(4);
  }
  // Up to 8 significant digits, strip trailing zeros
  return parseFloat(n.toPrecision(8)).toString();
}

// ---- LIVE CONVERT (on input/change) ----
function liveConvert() {
  const val   = parseFloat(document.getElementById('fromVal').value);
  const fromU = document.getElementById('fromUnit').value;
  const toU   = document.getElementById('toUnit').value;

  if (isNaN(val)) {
    document.getElementById('toVal').value = '';
    return;
  }

  const result = TYPES[currentType].convert(val, fromU, toU);
  document.getElementById('toVal').value = formatNum(result);
}

// ---- CONVERT BUTTON ----
function doConvert() {
  const val   = parseFloat(document.getElementById('fromVal').value);
  const fromU = document.getElementById('fromUnit').value;
  const toU   = document.getElementById('toUnit').value;

  if (isNaN(val)) return;

  const result = TYPES[currentType].convert(val, fromU, toU);
  const formatted = formatNum(result);

  // Show result box
  document.getElementById('resultVal').textContent  = `${formatted} ${toU}`;
  document.getElementById('resultDesc').textContent = `${val} ${fromU} = ${formatted} ${toU}`;
  document.getElementById('resultBox').classList.add('show');

  // Save to history
  history.unshift({
    from: `${val} ${fromU}`,
    to:   `${formatted} ${toU}`,
    type: currentType,
    ts:   Date.now()
  });

  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem('quanment_history', JSON.stringify(history));
}

// ---- SWAP UNITS ----
function swapUnits() {
  const fromUnit = document.getElementById('fromUnit');
  const toUnit   = document.getElementById('toUnit');
  const fromVal  = document.getElementById('fromVal');
  const toVal    = document.getElementById('toVal');

  // Swap unit selections
  const tmpUnit    = fromUnit.value;
  fromUnit.value   = toUnit.value;
  toUnit.value     = tmpUnit;

  // Swap values
  const tmpVal     = fromVal.value;
  fromVal.value    = toVal.value || tmpVal;

  liveConvert();
}

// ---- HIDE RESULT ----
function hideResult() {
  document.getElementById('resultBox').classList.remove('show');
}

// ---- NAV: SHOW CONVERTER ----
function showConverter() {
  document.getElementById('converterSection').style.display = 'block';
  document.getElementById('historySection').classList.remove('show');

  document.getElementById('navConverter').classList.add('active');
  document.getElementById('navHistory').classList.remove('active');
}

// ---- NAV: SHOW HISTORY ----
function showHistory() {
  document.getElementById('converterSection').style.display = 'none';
  document.getElementById('historySection').classList.add('show');

  document.getElementById('navConverter').classList.remove('active');
  document.getElementById('navHistory').classList.add('active');

  renderHistory();
}

// ---- RENDER HISTORY ----
function renderHistory() {
  const list = document.getElementById('historyList');

  if (!history.length) {
    list.innerHTML = '<div class="history-empty">No conversions yet. Start converting!</div>';
    return;
  }

  list.innerHTML = history.map(h => `
    <div class="history-item">
      <span class="h-from">${h.from}</span>
      <span class="h-arrow">→</span>
      <span class="h-to">${h.to}</span>
      <span class="h-type">${h.type}</span>
    </div>
  `).join('');
}

// ---- CLEAR HISTORY ----
function clearHistory() {
  if (!confirm('Clear all conversion history?')) return;
  history = [];
  localStorage.removeItem('quanment_history');
  renderHistory();
}

// ---- ENTER KEY SUPPORT ----
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doConvert();
});