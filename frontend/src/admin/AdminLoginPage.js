// src/admin/AdminLoginPage.js
import React, { useState, useEffect } from "react"; // ⭐ ADD useEffect
import { useNavigate } from "react-router-dom";
import "./AdminLoginPage.css";
import bg from "../assets/bg.jpg";

export default function AdminLoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiUrl, setApiUrl] = useState(""); // ⭐ ADD state for API URL

  // ⭐ ADD THIS useEffect TO DEBUG AND SET API URL
  useEffect(() => {
    console.log("🔍 Debugging environment variables:");
    console.log("REACT_APP_API_URL from env:", process.env.REACT_APP_API_URL);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("All env:", process.env);
    
    // Set API URL with fallback
    const url = process.env.REACT_APP_API_URL || 
                window.REACT_APP_API_URL || 
                'https://smart-barangay-production.up.railway.app';
    
    console.log("Using API URL:", url);
    setApiUrl(url);
    
    // Test connection immediately
    fetch(`${url}/health`)
      .then(r => r.json())
      .then(data => console.log("✅ Backend connection test:", data))
      .catch(err => console.error("❌ Backend connection failed:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      // ⭐ USE apiUrl STATE INSTEAD OF process.env directly
      const url = apiUrl || 'https://smart-barangay-production.up.railway.app';
      console.log("Making request to:", `${url}/admin-login`);
      
      const response = await fetch(`${url}/admin-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      // ⭐ CHECK IF RESPONSE IS VALID JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("Not JSON response:", errorText);
        throw new Error(`Server error: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log("Admin login response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Admin login failed");
      }

      // ✅ FIXED: Save as currentUser NOT currentAdmin
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
      
      // ✅ FIXED: Save to currentUser
      localStorage.setItem("currentUser", JSON.stringify(adminData));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", "admin");

      // ✅ If onLogin prop exists, call it
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

  // ⭐ ADD LOADING FOR API URL
  if (!apiUrl && loading) {
    return (
      <div style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}>
        <div>Loading application...</div>
      </div>
    );
  }

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
        
        {/* ⭐ SHOW API URL FOR DEBUGGING */}
        <div style={{ 
          fontSize: '12px', 
          color: '#888', 
          marginBottom: '10px',
          backgroundColor: '#f5f5f5',
          padding: '5px',
          borderRadius: '3px'
        }}>
          API: {apiUrl || 'Loading...'}
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
            disabled={loading || !apiUrl}
          >
            {loading ? "Authenticating..." : "Login as Admin"}
          </button>
        </form>

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