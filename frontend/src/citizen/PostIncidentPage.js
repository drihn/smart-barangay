// src/citizen/PostIncidentPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PostIncidentPage.css";
import defaultAvatar from "../assets/avatar.jpg";
import bg from "../assets/bg.jpg";

export default function PostIncidentPage({
  posts,
  setPosts,
  currentUser,
  onPostCreated
}) {

  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // -------------------------------
  // SUBMIT REPORT
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please fill in the description!");
      return;
    }

    // -------------------------------
    // GET USER NAME
    // -------------------------------
    let actualUserName = "Citizen";

    if (currentUser) {
      actualUserName =
        currentUser.first_name ||
        currentUser.name ||
        currentUser.firstName ||
        currentUser.fullName ||
        "Citizen";

      if (actualUserName === "Citizen" && currentUser.email) {
        const emailName = currentUser.email.split("@")[0];
        actualUserName =
          emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }

    // -------------------------------
    // CALL ML MODEL
    // -------------------------------
    let category = "Unknown";
    let risk = "Unknown";

    try {
      const mlResponse = await axios.post(
        "http://127.0.0.1:5000/predict",
        { description: description }
      );

      category = mlResponse.data.category;
      risk = mlResponse.data.risk;

      console.log("🧠 ML RESULT:", category, risk);
    } catch (error) {
      console.error("❌ ML API ERROR:", error);
    }

    // -------------------------------
    // CREATE POST OBJECT
    // -------------------------------
    const newPost = {
      id: Date.now(),
      userName: actualUserName,
      userId: currentUser?.id,
      location:
        currentUser?.location ||
        currentUser?.address ||
        "Barangay",
      phoneNumber:
        currentUser?.phone ||
        currentUser?.phoneNumber ||
        "N/A",
      content: description,

      category: category,   // ✅
      risk: risk,           // ✅

      date: new Date().toLocaleString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: defaultAvatar,
      postImage: imageFile
        ? URL.createObjectURL(imageFile)
        : null,
      alert: false,
      userType: "citizen",
    };

    // -------------------------------
    // SAVE LOCALLY
    // -------------------------------
    const existingPosts =
      JSON.parse(localStorage.getItem("posts")) || [];

    const updatedPosts = [newPost, ...existingPosts];
    localStorage.setItem("posts", JSON.stringify(updatedPosts));

    // -------------------------------
    // UPDATE STATE
    // -------------------------------
    if (onPostCreated) {
      onPostCreated(newPost);
    } else if (setPosts) {
      setPosts([newPost, ...posts]);
    }

    alert(`Report successfully submitted as ${actualUserName}!`);
    navigate("/citizenhomepage");
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div
      className="post-incident-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div className="background-overlay" />

      <div className="post-incident-card">
        <h1>File a New Incident Report</h1>

        <form
          className="post-incident-form"
          onSubmit={handleSubmit}
        >
          <label>Incident Details *</label>
          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Describe what happened, when, and where..."
            required
            rows={6}
          />

          <label>Attach Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImageFile(e.target.files[0])
            }
          />

          <div className="post-incident-buttons">
            <button type="submit" className="submit-btn">
              📄 Submit Report
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate("/citizenhomepage")
              }
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
