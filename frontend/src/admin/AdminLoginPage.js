// src/admin/AdminLoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLoginPage.css";
import bg from "../assets/bg.jpg";

export default function AdminLoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ⭐⭐⭐ HARDCODED API URL - 100% WORKING ⭐⭐⭐
  const API_URL = "https://smart-barangay-production.up.railway.app";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Calling API:", `${API_URL}/admin-login`);
      
      const response = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log("Admin login response:", data);

      if (data.success === false) {
        throw new Error(data.error || "Admin login failed");
      }

      const adminData = {
        id: data.admin.id,
        _id: data.admin.id,
        first_name: data.admin.name || data.admin.first_name,
        name: data.admin.name || data.admin.first_name,
        fullName: data.admin.name || data.admin.first_name,
        email: data.admin.email,
        role: "admin",
        userType: "admin",
        ...data.admin
      };

      console.log("Saving admin data:", adminData);
      
      localStorage.setItem("currentUser", JSON.stringify(adminData));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", "admin");

      if (onLogin) {
        onLogin(adminData);
      } else {
        navigate("/admin-homepage");
      }

    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message);
      alert(`Admin login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-login-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          👑 Administrator Access Only 👑
        </p>
        
        {/* ⭐ SHOW API URL FOR TRANSPARENCY */}
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          marginBottom: '10px',
          padding: '5px',
          backgroundColor: '#f0f8ff',
          borderRadius: '3px',
          fontFamily: 'monospace'
        }}>
          🔗 Backend: {API_URL}
        </div>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>Admin Email</label>
          <input
            type="email"
            placeholder="admin@barangay.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label>Admin Password</label>
          <input
            type="password"
            placeholder="admin123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login as Admin"}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
          <p><strong>Test Credentials:</strong></p>
          <p>Email: admin@barangay.com</p>
          <p>Password: admin123</p>
        </div>

        <div className="login-links">
          <p>
            Not an admin?{" "}
            <span 
              onClick={() => navigate("/citizen-login")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Citizen Login
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