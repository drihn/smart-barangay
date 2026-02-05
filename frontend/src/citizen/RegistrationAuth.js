// src/citizen/RegistrationAuth.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegistrationAuth.css";
import bg from "../assets/bg.jpg";

function RegistrationAuth() {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

 const handleRegistration = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  setLoading(true);

  try {
    const API_URL = process.env.REACT_APP_API_URL;
    console.log('🔗 API URL:', API_URL);
    
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'same-origin', // or 'include' if using cookies
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        password: password
      })
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers);
    
    const text = await response.text();
    console.log('📊 Raw Response:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      alert(`Server error (not JSON): ${text.substring(0, 200)}`);
      return;
    }
    
    console.log('📦 Parsed Data:', data);

    if (data.success) {
      alert(data.message || "Registration successful - pending approval");
      navigate("/registration-complete");
    } else {
      alert(data.error || "Registration failed");
    }
    
  } catch (err) {
    console.error("🔥 Network Error:", err);
    console.error("🔥 Error Details:", {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    alert("Cannot connect to server. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-card">
        <h2>REGISTER</h2>

        <form className="registration-form" onSubmit={handleRegistration}>
          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Enter your full name"
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{" "}
            <span 
              onClick={() => navigate("/citizen-login")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Login
            </span>
          </p>
          
          <p>
            <span 
              onClick={() => navigate("/")} 
              className="link"
              style={{cursor: 'pointer', color: '#666', fontSize: '14px'}}
            >
              ← Back to Home
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegistrationAuth;