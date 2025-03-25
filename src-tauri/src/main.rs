// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use bcrypt::{hash, verify, DEFAULT_COST};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::State;

struct AppState {
    users: Mutex<HashMap<String, String>>, // Username -> Password Hash
    otps: Mutex<HashMap<String, String>>,  // Username -> OTP
}

#[derive(Serialize, Deserialize)]
struct Credentials {
    username: String,
    password: String,
}

// Register user
#[tauri::command]
fn register(state: State<AppState>, creds: Credentials) -> Result<String, String> {
    let mut users = state.users.lock().unwrap();
    if users.contains_key(&creds.username) {
        return Err("Username already exists".to_string());
    }
    let hashed_password = hash(&creds.password, DEFAULT_COST).map_err(|_| "Hashing error")?;
    users.insert(creds.username.clone(), hashed_password);
    Ok("User registered successfully".to_string())
}

// Login user
#[tauri::command]
fn login(state: State<AppState>, creds: Credentials) -> Result<String, String> {
    let users = state.users.lock().unwrap();
    if let Some(hashed_password) = users.get(&creds.username) {
        if verify(&creds.password, hashed_password).map_err(|_| "Verification error")? {
            return Ok("Login successful".to_string());
        }
    }
    Err("Invalid username or password".to_string())
}

#[tauri::command]
fn generate_otp(username: String, state: State<AppState>) -> String {
    let otp: String = (0..6).map(|_| rand::thread_rng().gen_range(0..=9).to_string()).collect();
    state.otps.lock().unwrap().insert(username.clone(), otp.clone());
    println!("Generated OTP for {}: {}", username, otp); // Log OTP (replace with email/sms later)
    "OTP sent!".to_string()
}

#[tauri::command]
fn verify_otp(username: String, otp: String, state: State<AppState>) -> bool {
    let mut otps = state.otps.lock().unwrap();
    if let Some(stored_otp) = otps.get(&username) {
        if stored_otp == &otp {
            otps.remove(&username); // OTP used, remove it
            return true;
        }
    }
    false
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            users: Mutex::new(HashMap::new()),
            otps: Mutex::new(HashMap::new()), // <-- Add this line
        })
        .invoke_handler(tauri::generate_handler![register, login, generate_otp, verify_otp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

