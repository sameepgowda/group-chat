import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Signup.css";

function Signup() {
  const navigate = useNavigate();

  const PHONE_PATTERN = /^\+?\d{10,15}$/;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [signingUp, setSigningUp] = useState(false);

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
      onDone ? 1500 : 2500
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (signingUp) return;
    if (!PHONE_PATTERN.test(formData.phoneNumber)) {
      showToast("error", "Enter a valid phone number");
      return;
    }

    const payload = {
      username: formData.name,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
    };

    try {
      setSigningUp(true);

      const response = await axios.post(
        "http://localhost:3000/groupChat/user/signup",
        payload
      );

      // Axios only gets here for 2xx responses.
      // The button stays disabled until we navigate away.
      showToast(
        "success",
        response.data?.message || "Account created successfully",
        () => navigate("/login")
      );
    } catch (err) {
      // Axios throws for 4xx/5xx, so errors land here
      const message = err.response
        ? err.response.data?.message ||
          err.response.data?.Message ||
          "Signup failed. Please try again."
        : "Cannot reach the server. Check your connection.";

      setSigningUp(false);
      showToast("error", message);
    }
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
        <h2>Create Account</h2>
        <p>Sign up to get started</p>

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
        />

        <button type="submit" disabled={signingUp}>
          {signingUp ? "Signing up..." : "Sign Up"}
        </button>

        <p>Already have an account?</p>
        <button type="button" onClick={() => navigate("/login")}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Signup;
