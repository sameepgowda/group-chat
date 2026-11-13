import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";
import axios from "axios";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{10,15}$/;

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "", // email or phone number
    password: "",
  });
  const [loggingIn, setLoggingIn] = useState(false);

  // Toast popup: { type: 'success' | 'error', message: string }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Shows the toast, then runs an optional callback when it hides.
  // With a callback (success) it hides sooner, so the redirect isn't slow.
  const showToast = (type, message, onDone) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });

    toastTimer.current = setTimeout(
      () => {
        setToast(null);
        if (onDone) onDone();
      },
      onDone ? 1200 : 2500
    );
  };

  // Clear the timer if the component unmounts
  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Returns true on success, false on failure
  const userLogin = async (payload) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/groupChat/user/login",
        payload
      );

      // Axios only gets here for 2xx responses
      showToast(
        "success",
        response.data?.message || "Logged in successfully",
        () => navigate("/home")
      );
      return true;
    } catch (err) {
      // Axios throws for 4xx/5xx, so errors land here
      const message = err.response
        ? err.response.data?.message ||
          err.response.data?.Message ||
          "Login failed. Please try again."
        : "Cannot reach the server. Check your connection.";

      showToast("error", message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loggingIn) return;

    const identifier = formData.identifier.trim();
    const phone = identifier.replace(/[\s-]/g, "");

    let payload;
    if (EMAIL_PATTERN.test(identifier)) {
      payload = {
        email: identifier.toLowerCase(),
        password: formData.password,
      };
    } else if (PHONE_PATTERN.test(phone)) {
      payload = {
        phoneNumber: phone,
        password: formData.password,
      };
    } else {
      showToast("error", "Enter a valid email address or phone number");
      return;
    }

    setLoggingIn(true);
    const success = await userLogin(payload);

    // On success the button stays disabled until the redirect happens
    if (!success) setLoggingIn(false);
  };

  return (
    <div className="signup-container">
      {/* Success / error toast (auto-hides) */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}

      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <p>Log in with your email or phone number</p>

        <label htmlFor="identifier">Email or Phone Number</label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Enter your email or phone number"
          value={formData.identifier}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loggingIn}>
          {loggingIn ? "Logging in..." : "Log In"}
        </button>

        <p>Don't have an account?</p>
        <button type="button" onClick={() => navigate("/")}>
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default Login;
