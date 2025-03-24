import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authMessage, setAuthMessage] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<string>("");

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    setPasswordStrength(levels[score]);
  };

  // Register a new user
  const register = async () => {
    if (passwordStrength === "Weak" || passwordStrength === "Fair") {
      setAuthMessage("Password is too weak.");
      return;
    }
    try {
      const response: string = await invoke("register", { creds: { username, password } });
      setAuthMessage(response);
      setIsRegistering(false);
    } catch (err) {
      setAuthMessage("Error: " + err);
    }
  };

  // Login user
  const login = async () => {
    try {
      const response: string = await invoke("login", { creds: { username, password } });
      setAuthMessage(response);
      setIsLoggedIn(true);
    } catch (err) {
      setAuthMessage("Error: " + err);
    }
  };

  return (
    <div className="container">
      <h2>P2P Chat</h2>

      {!isLoggedIn ? (
        <section className="auth-section">
          <h3>{isRegistering ? "Register" : "Login"}</h3>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              checkPasswordStrength(e.target.value);
            }}
            placeholder="Password"
          />
          {isRegistering && <p className={`strength ${passwordStrength.toLowerCase()}`}>Strength: {passwordStrength}</p>}
          <button onClick={isRegistering ? register : login}>{isRegistering ? "Register" : "Login"}</button>
          <button className="toggle-auth" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Already have an account? Login" : "No account? Register"}
          </button>
          <p>{authMessage}</p>
        </section>
      ) : (
        <p>Welcome! You're logged in.</p>
      )}
    </div>
  );
};

export default App;
