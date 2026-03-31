import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isOtpStage, setIsOtpStage] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");

  const [ticket, setTicket] = useState<string>("");
  const [joinTicket, setJoinTicket] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [chatLog, setChatLog] = useState<string[]>([]);

  useEffect(() => {
    const unlistenPromise = listen<string>("new-message", (event) => {
      setChatLog((prev) => [...prev, event.payload]);
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const register = async () => {
    try {
      const response: string = await invoke("register", {
        creds: { username, password },
      });
      setAuthMessage(response);
    } catch (err) {
      setAuthMessage("Error: " + err);
    }
  };

  // Create a new chat room.
const createRoom = async () => {
  try {
    const result: string = await invoke("create_chat_room");
    setTicket(result);
  } catch (err) {
    console.error("Error creating room:", err);
  }
};

// Join an existing chat room using the provided ticket.
const joinRoom = async () => {
  try {
    await invoke("join_chat_room", { ticket: joinTicket });
  } catch (err) {
    console.error("Error joining room:", err);
  }
};

// Send a message in the chat room.
const sendMsg = async () => {
  try {
    await invoke("send_message", { message });
    setChatLog((prev) => [...prev, `Me: ${message}`]);
    setMessage("");
  } catch (err) {
    console.error("Error sending message:", err);
  }
};


  const login = async () => {
    try {
      const response: string = await invoke("login", {
        creds: { username, password },
      });
      if (response === "Login successful") {
        setIsOtpStage(true);
        await invoke("generate_otp", { username });
        setAuthMessage("OTP sent! Check console log for now.");
      } else {
        setAuthMessage(response);
      }
    } catch (err) {
      setAuthMessage("Error: " + err);
    }
  };

  const verifyOtp = async () => {
    try {
      const success: boolean = await invoke("verify_otp", { username, otp });
      if (success) {
        setIsLoggedIn(true);
        setIsOtpStage(false);
        setAuthMessage("OTP verified! You are logged in.");
      } else {
        setAuthMessage("Invalid OTP. Try again.");
      }
    } catch (err) {
      setAuthMessage("Error: " + err);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsOtpStage(false);
    setUsername("");
    setPassword("");
    setOtp("");
    setAuthMessage("");
  };

  return (
    <div className="container">
      <h2>P2P Chat</h2>

      {!isLoggedIn ? (
        <section>
          <h3>{isOtpStage ? "Enter OTP" : "Login"}</h3>
          {!isOtpStage ? (
            <>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <button onClick={login}>Login</button>
              <button onClick={register}>Register</button>
            </>
          ) : (
            <>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
              <button onClick={verifyOtp}>Verify OTP</button>
            </>
          )}
          <p>{authMessage}</p>
        </section>
      ) : (
        <>
          <button onClick={logout} style={{ marginBottom: "1rem" }}>
            Logout
          </button>

          <section>
            <h3>Create Chat Room</h3>
            <button onClick={createRoom}>Create Room</button>
            {ticket && (
              <p>
                Your room ticket: <code>{ticket}</code>
              </p>
            )}
          </section>

          <section>
            <h3>Join Chat Room</h3>
            <input type="text" value={joinTicket} onChange={(e) => setJoinTicket(e.target.value)} placeholder="Enter room ticket" />
            <button onClick={joinRoom}>Join Room</button>
          </section>

          <section>
            <h2>Chat</h2>
            <div className="chat-container">
              {chatLog.map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" />
            <button onClick={sendMsg}>Send</button>
          </section>
        </>
      )}
    </div>
  );
};

export default App;
