// Update base URL
const API_BASE_URL = "https://smart-barangay-production.up.railway.app";

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/citizen-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const signupUser = async (full_name, email, password) => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password })
  });
  return response.json();
};