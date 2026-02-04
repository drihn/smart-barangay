// src/citizen/CitizenHomePage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CitizenHomePage.css";
import bg from "../assets/bg.jpg";
import defaultAvatar from "../assets/avatar.jpg";
import alertAvatar from "../assets/alert.jpg";
import BurgerMenu from "../components/BurgerMenu";

export default function CitizenHomePage({ posts = [], currentUser: propUser, onLogout }) {

  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // -------------------------------
  // LOAD USER
  // -------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);

      if (parsed.role === "admin") {
        navigate("/admin-home");
        return;
      }

      setLoggedInUser({
        ...parsed,
        first_name: parsed.first_name || parsed.name || "Citizen",
        avatar: parsed.avatar || defaultAvatar
      });

    } else if (propUser) {
      setLoggedInUser(propUser);
    } else {
      navigate("/citizen-login");
    }
  }, [navigate, propUser]);

  // -------------------------------
  // LOAD POSTS
  // -------------------------------
  useEffect(() => {
    setFilteredPosts(posts || []);
  }, [posts]);

  // -------------------------------
  // DISPLAY NAME
  // -------------------------------
  const getPostDisplayName = (post) => {

    if (post.userType === "admin" || post.userName === "Admin") {
      return "🏛️ Barangay Admin";
    }

    if (post.userId === loggedInUser?.id) {
      return "👤 You";
    }

    return `👤 ${post.userName || "Citizen"}`;
  };

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (!loggedInUser) {
    return <h2>Loading...</h2>;
  }

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="Citizen-home-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="background-overlay" />

      <BurgerMenu
        currentUser={loggedInUser}
        onProfileClick={() => setShowProfileModal(true)}
      />

      <div className="content-wrapper">
        <div className="panel">

          <h1>Welcome, {loggedInUser.first_name}!</h1>

          <div className="top-buttons">
            <button className="main-btn" onClick={() => navigate("/post-incident")}>
              📄 FILE A REPORT
            </button>

            <button className="main-btn" onClick={() => navigate("/citizen-old-reports")}>
              📋 MY REPORTS
            </button>
          </div>

          <h2 className="recent-posts-label">📢 Recent Announcements & Reports</h2>

          {filteredPosts.length === 0 ? (
            <p>No reports yet.</p>
          ) : (

            <div className="latest-posts">

              {filteredPosts.map((post, index) => {

                const isAdminPost =
                  post.userType === "admin" ||
                  post.userName === "Admin";

                return (
                  <div
                    key={index}
                    className={`post-card ${isAdminPost ? "alert" : ""}`}
                  >

                    <img
                      src={isAdminPost ? alertAvatar : (post.avatar || defaultAvatar)}
                      alt="avatar"
                      className="post-image"
                    />

                    <div className="post-content">

                      <div className="name-date">
                        <p className="post-name">
                          {getPostDisplayName(post)}
                          {isAdminPost && <span className="official-badge"> OFFICIAL</span>}
                        </p>

                        <span className="post-date">
                          {post.date}
                        </span>
                      </div>

                      <p className="post-content-text">
                        {post.content}
                      </p>

                      {/* ✅ CATEGORY & RISK */}
                      {!isAdminPost && (
                        <div className="post-badges">
                          <span className="category-badge">
                            {post.category || "Uncategorized"}
                          </span>

                          <span className={`risk-badge ${(post.risk || "").toLowerCase()}`}>
                            {post.risk || "Unknown"}
                          </span>
                        </div>
                      )}

                      {post.postImage && (
                        <img
                          src={post.postImage}
                          alt="attachment"
                          className="post-attachment"
                        />
                      )}

                      <div className="post-footer">
                        <span className="post-type">
                          {isAdminPost ? "📢 Barangay Announcement" : "📝 Citizen Report"}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <img src={loggedInUser.avatar} alt="avatar" className="profile-avatar" />
            <h3>{loggedInUser.first_name}</h3>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

    </div>
  );
}
