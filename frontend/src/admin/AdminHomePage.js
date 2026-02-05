// AdminHomePage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHomePage.css";
import bg from "../assets/bg.jpg";
import BurgerMenu from "../components/BurgerMenu";
import alertAvatar from "../assets/alert.jpg";

export default function AdminHomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending citizens from backend
  
 // I-update ang fetchPendingUsers function:
const fetchPendingUsers = async () => {
  setLoadingUsers(true);
  try {
    // TRY BOTH ENDPOINTS:
    const API_URL = process.env.REACT_APP_API_URL;
    
    // Option 1: Try without /api
    const response = await fetch(`${API_URL}/pending-users`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include" // IMPORTANT for sessions/cookies
    });
    
    console.log("Pending users response:", response);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setPendingUsers(data.users || []);
        setPendingCount(data.users?.length || 0);
      }
    } else {
      // Option 2: Try with /api
      const response2 = await fetch(`${API_URL}/api/pending-users`);
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2.success) {
          setPendingUsers(data2.users || []);
          setPendingCount(data2.users?.length || 0);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch pending users:", err);
  }
  setLoadingUsers(false);
};
  // Approve or reject user
  const handleApproveReject = async (userId, approve) => {
    try {
      const endpoint = approve ? "approve-user" : "reject-user";
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`User ${approve ? 'approved' : 'rejected'} successfully!`);
        fetchPendingUsers(); // Refresh list
      } else {
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status");
    }
  };

  // Fetch posts from database
  const fetchPosts = async () => {
    try {
      // For now, use localStorage. Later connect to database
      const storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
      
      // Transform posts to remove ID numbers
      const transformedPosts = storedPosts.map(post => {
        const { id, ...rest } = post; // Remove id if you don't want it
        return {
          ...rest,
          // Add display identifier without numeric ID
          displayId: post.userType === "admin" ? "ADMIN" : "CITIZEN"
        };
      });
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const storedPosts = JSON.parse(localStorage.getItem("posts")) || [];

    if (!storedUser) {
      navigate("/admin-login");
    } else {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // Transform posts to remove ID numbers
        const postsWithoutIds = storedPosts.map(post => {
          const { id, ...postWithoutId } = post;
          return {
            ...postWithoutId,
            // Use descriptive identifier instead of numeric ID
            identifier: post.userType === "admin" ? "🏛️ OFFICIAL" : "👤 CITIZEN"
          };
        });
        
        setPosts(postsWithoutIds);
        fetchPendingUsers(); // Fetch pending users on page load
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/admin-login");
      }
    }
  }, [navigate]);

  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/";
  };

  // Function to get clean display name
  const getDisplayName = (post) => {
    if (post.userType === "admin") {
      return "🏛️ Barangay Admin";
    }
    
    if (post.userName && post.userName !== "No Name") {
      // Remove any ID numbers from name
      const cleanName = post.userName.replace(/\(ID: \d+\)/, '').trim();
      return cleanName || "👤 Anonymous";
    }
    
    return "👤 Anonymous";
  };

  // If no user, show loading
  if (!currentUser) {
    return (
      <div className="admin-home-container" style={{ backgroundImage: `url(${bg})` }}>
        <div className="background-overlay" />
        <div className="loading-state">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="background-overlay" />
      
      {/* Burger menu */}
      {currentUser && <BurgerMenu currentUser={currentUser} onLogout={handleLogout} />}

      <div className="content-wrapper">
        <div className="panel">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Welcome, {currentUser.first_name || currentUser.name}!</h1>
            <p className="welcome-subtitle">Barangay Administration Dashboard</p>
          </div>

          {/* Top buttons */}
          <div className="top-buttons">
            <button className="main-btn" onClick={() => navigate("/admin-post-page")}>
              📢 Post Announcement
            </button>
            <button className="main-btn" onClick={() => navigate("/admin-old-reports")}>
              📋 View Reports
            </button>
            {/* Pending Accounts Button with badge */}
            <button className="main-btn pending-btn" onClick={() => navigate("/pending-accounts-page")}>
              👥 Pending Accounts
              {pendingCount > 0 && (
                <span className="pending-badge">{pendingCount}</span>
              )}
            </button>
          </div>

          {/* Quick Pending Users Preview */}
          {pendingCount > 0 && (
            <div className="pending-preview">
              <h3>🔄 Pending Account Approvals ({pendingCount})</h3>
              <div className="pending-list">
                {pendingUsers.slice(0, 3).map(user => (
                  <div key={user.id} className="pending-item">
                    <div className="pending-info">
                      <strong>{user.first_name || user.full_name || "User"}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="pending-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveReject(user.id, true)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleApproveReject(user.id, false)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCount > 3 && (
                  <div className="view-all">
                    <button onClick={() => navigate("/pending-accounts-page")}>
                      View all {pendingCount} pending accounts →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          <h2 className="recent-posts-label">📢 Recent Announcements & Reports</h2>
          <div className="latest-posts">
            {posts.length === 0 ? (
              <div className="no-posts-message">
                <p>No reports or announcements yet.</p>
                <button 
                  className="create-first-btn"
                  onClick={() => navigate("/admin-post-page")}
                >
                  Create Your First Announcement
                </button>
              </div>
            ) : (
              posts.slice(0, 5).map((post, index) => {
                const isAdminPost = post.userType === "admin";
                const displayName = getDisplayName(post);
                
                return (
                  <div
                    key={index}
                    className={`post-card ${post.alert || isAdminPost ? "alert" : ""}`}
                  >
                    <img
                      src={isAdminPost ? alertAvatar : post.avatar || "https://via.placeholder.com/80"}
                      alt="Avatar"
                      className="post-image"
                    />
                    <div className="post-content">
                      <div className="name-date">
                        <p className="post-name">
                          {displayName}
                          {isAdminPost && <span className="official-badge"> OFFICIAL</span>}
                          {post.alert && <span className="alert-badge"> URGENT</span>}
                        </p>
                        <span className="post-date">{post.date || "-"}</span>
                      </div>
                      <p className="post-text">{post.content}</p>
                      {post.location && (
                        <p className="post-location">📍 {post.location}</p>
                      )}
                      {post.postImage && (
                        <img src={post.postImage} alt="Post attachment" className="post-attachment" />
                      )}
                      <div className="post-footer">
                        <span className="post-type">
                          {isAdminPost ? "📢 Barangay Announcement" : "📝 Citizen Report"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* View All Posts Button */}
          {posts.length > 5 && (
            <div className="view-all-posts">
              <button onClick={() => navigate("/admin-old-reports")}>
                View All Posts ({posts.length}) →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}