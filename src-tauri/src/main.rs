// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::State;

struct AppState {
    users: Mutex<HashMap<String, String>>, // username -> hashed password
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

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            users: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![register, login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
