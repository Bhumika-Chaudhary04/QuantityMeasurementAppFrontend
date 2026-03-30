const API_BASE = "http://localhost:8080";

function getEl(id) {
  return document.getElementById(id);
}

function showAlert(id, message, type) {
  const box = getEl(id);
  if (!box) return;
  box.textContent = message;
  box.className = `alert ${type}`;
}

function hideAlert(id) {
  const box = getEl(id);
  if (!box) return;
  box.textContent = "";
  box.className = "alert";
}

function setError(inputId, errorId, message) {
  const input = getEl(inputId);
  const error = getEl(errorId);
  if (input) input.classList.add("invalid");
  if (error) error.textContent = message;
}

function clearError(inputId, errorId) {
  const input = getEl(inputId);
  const error = getEl(errorId);
  if (input) input.classList.remove("invalid");
  if (error) error.textContent = "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function togglePw(inputId, btn) {
  const input = getEl(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }
}

function checkStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function updatePasswordStrength(password) {
  const fill = getEl("strengthFill");
  const text = getEl("strengthText");
  if (!fill || !text) return;

  const score = checkStrength(password);
  const levels = [
    { pct: "0%", color: "", label: "" },
    { pct: "20%", color: "#ef5350", label: "Weak" },
    { pct: "40%", color: "#ff9800", label: "Fair" },
    { pct: "65%", color: "#f1c40f", label: "Good" },
    { pct: "85%", color: "#2ecc71", label: "Strong" },
    { pct: "100%", color: "#24b47e", label: "Very Strong" }
  ];

  const level = levels[Math.min(score, 5)];
  fill.style.width = level.pct;
  fill.style.background = level.color;
  text.textContent = level.label;
  text.style.color = level.color || "";
}

function setLoading(buttonId, isLoading, loadingText, normalText) {
  const btn = getEl(buttonId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? loadingText : normalText;
}

function setupSignupStrength() {
  const signupPassword = getEl("signupPassword");
  if (!signupPassword) return;

  signupPassword.addEventListener("input", function () {
    updatePasswordStrength(this.value);
    clearError("signupPassword", "signupPasswordError");
  });
}

function setupLiveValidation() {
  const fieldPairs = [
    ["loginEmail", "loginEmailError"],
    ["loginPassword", "loginPasswordError"],
    ["firstName", "firstNameError"],
    ["lastName", "lastNameError"],
    ["signupEmail", "signupEmailError"],
    ["signupPassword", "signupPasswordError"],
    ["confirmPassword", "confirmPasswordError"]
  ];

  fieldPairs.forEach(([inputId, errorId]) => {
    const input = getEl(inputId);
    if (!input) return;
    input.addEventListener("input", () => clearError(inputId, errorId));
  });

  const terms = getEl("agreeTerms");
  const termsError = getEl("agreeTermsError");
  if (terms && termsError) {
    terms.addEventListener("change", () => {
      termsError.textContent = "";
    });
  }
}

function validateLoginForm() {
  let valid = true;
  const email = getEl("loginEmail")?.value.trim() || "";
  const password = getEl("loginPassword")?.value || "";

  clearError("loginEmail", "loginEmailError");
  clearError("loginPassword", "loginPasswordError");

  if (!email) {
    setError("loginEmail", "loginEmailError", "Email is required.");
    valid = false;
  } else if (!isValidEmail(email)) {
    setError("loginEmail", "loginEmailError", "Enter a valid email address.");
    valid = false;
  }

  if (!password) {
    setError("loginPassword", "loginPasswordError", "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    setError("loginPassword", "loginPasswordError", "Password must be at least 6 characters.");
    valid = false;
  }

  return valid;
}

function validateSignupForm() {
  let valid = true;

  const firstName = getEl("firstName")?.value.trim() || "";
  const lastName = getEl("lastName")?.value.trim() || "";
  const email = getEl("signupEmail")?.value.trim() || "";
  const password = getEl("signupPassword")?.value || "";
  const confirmPassword = getEl("confirmPassword")?.value || "";
  const agreeTerms = getEl("agreeTerms")?.checked || false;

  clearError("firstName", "firstNameError");
  clearError("lastName", "lastNameError");
  clearError("signupEmail", "signupEmailError");
  clearError("signupPassword", "signupPasswordError");
  clearError("confirmPassword", "confirmPasswordError");

  const termsError = getEl("agreeTermsError");
  if (termsError) termsError.textContent = "";

  if (!firstName) {
    setError("firstName", "firstNameError", "First name is required.");
    valid = false;
  }

  if (!lastName) {
    setError("lastName", "lastNameError", "Last name is required.");
    valid = false;
  }

  if (!email) {
    setError("signupEmail", "signupEmailError", "Email is required.");
    valid = false;
  } else if (!isValidEmail(email)) {
    setError("signupEmail", "signupEmailError", "Enter a valid email address.");
    valid = false;
  }

  if (!password) {
    setError("signupPassword", "signupPasswordError", "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    setError("signupPassword", "signupPasswordError", "Password must be at least 6 characters.");
    valid = false;
  }

  if (!confirmPassword) {
    setError("confirmPassword", "confirmPasswordError", "Please confirm your password.");
    valid = false;
  } else if (password !== confirmPassword) {
    setError("confirmPassword", "confirmPasswordError", "Passwords do not match.");
    valid = false;
  }

  if (!agreeTerms && termsError) {
    termsError.textContent = "Please accept the Terms & Conditions.";
    valid = false;
  }

  return valid;
}

function getRememberChoice() {
  return getEl("remember")?.checked || false;
}

function storeAuthSession(token, name, email, rememberMe) {
  localStorage.removeItem("quanmentToken");
  localStorage.removeItem("quanmentUserName");
  localStorage.removeItem("quanmentUserEmail");

  sessionStorage.removeItem("quanmentToken");
  sessionStorage.removeItem("quanmentUserName");
  sessionStorage.removeItem("quanmentUserEmail");

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("quanmentToken", token || "");
  storage.setItem("quanmentUserName", name || "");
  storage.setItem("quanmentUserEmail", email || "");
}

function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const name = params.get("name");
  const email = params.get("email");

  if (!token) return;

  const rememberMe = getRememberChoice();
  storeAuthSession(token, name || "User", email || "", rememberMe);

  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.href = "dashboard.html";
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert("loginAlert");

  if (!validateLoginForm()) {
    showAlert("loginAlert", "Please fix the highlighted fields.", "error");
    return;
  }

  setLoading("loginBtn", true, "Signing In...", "Sign In");

  const payload = {
    email: getEl("loginEmail").value.trim(),
    password: getEl("loginPassword").value
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    const rememberMe = getRememberChoice();
    storeAuthSession(
      data.token || "",
      data.name || payload.email.split("@")[0],
      data.email || payload.email,
      rememberMe
    );

    showAlert("loginAlert", "Login successful! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  } catch (error) {
    showAlert("loginAlert", error.message || "Something went wrong.", "error");
  } finally {
    setLoading("loginBtn", false, "Signing In...", "Sign In");
  }
}

async function handleSignup(e) {
  e.preventDefault();
  hideAlert("signupAlert");

  if (!validateSignupForm()) {
    showAlert("signupAlert", "Please fix the highlighted fields.", "error");
    return;
  }

  setLoading("signupBtn", true, "Creating Account...", "Create Account");

  const firstName = getEl("firstName").value.trim();
  const lastName = getEl("lastName").value.trim();

  const payload = {
    email: getEl("signupEmail").value.trim(),
    name: `${firstName} ${lastName}`.trim(),
    password: getEl("signupPassword").value
  };

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    storeAuthSession(
      data.token || "",
      data.name || payload.name,
      data.email || payload.email,
      true
    );

    showAlert("signupAlert", "Account created successfully! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  } catch (error) {
    showAlert("signupAlert", error.message || "Something went wrong.", "error");
  } finally {
    setLoading("signupBtn", false, "Creating Account...", "Create Account");
  }
}

function googleLogin() {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
}

document.addEventListener("DOMContentLoaded", function () {
  handleOAuthRedirect();

  const loginForm = getEl("loginForm");
  const signupForm = getEl("signupForm");

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (signupForm) signupForm.addEventListener("submit", handleSignup);

  setupSignupStrength();
  setupLiveValidation();
});