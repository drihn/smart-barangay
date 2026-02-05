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

  // Check passwords match
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  setLoading(true);

  try {
    // DIRECT API call to Railway backend
    const API_URL = process.env.REACT_APP_API_URL || 'https://smart-barangay-production.up.railway.app';
    
    console.log('🌐 API URL:', API_URL);
    console.log('📤 Sending:', { email, fullName });
    
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        password: password
      })
    });

    console.log('📥 Response status:', response.status);
    
    // CHECK IF RESPONSE IS JSON FIRST
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // Not JSON - get as text
      const text = await response.text();
      console.error('❌ Server returned non-JSON:', text);
      alert(`Server error: ${text.substring(0, 100)}`);
      return;
    }
    
    // Parse as JSON
    const data = await response.json();
    console.log('📦 Response data:', data);

    // Check if registration is successful
    if (data.success) {
      alert(data.message || "Registration successful - pending approval");
      
      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Navigate to success page
      navigate("/registration-complete");
    } else {
      alert(data.error || "Registration failed");
    }
    
  } catch (err) {
    console.error("🔥 Registration error:", err);
    console.error("🔥 Error details:", err.message);
    
    if (err.message.includes('JSON')) {
      alert("Server returned invalid response. Check if /signup endpoint exists.");
    } else {
      alert("Cannot connect to server. Please try again.");
    }
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