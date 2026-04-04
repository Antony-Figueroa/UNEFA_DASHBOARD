use serde::{Deserialize, Serialize};
use tauri::Manager;
use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    pub version: String,
    pub name: String,
    pub platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostgreSQLStatus {
    pub running: bool,
    pub port: u16,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo, String> {
    info!("Getting app info");
    
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        name: env!("CARGO_PKG_NAME").to_string(),
        platform: std::env::consts::OS.to_string(),
    })
}

#[tauri::command]
pub async fn check_postgresql_status() -> Result<PostgreSQLStatus, String> {
    info!("Checking PostgreSQL status");
    
    use std::net::TcpStream;
    
    match TcpStream::connect("127.0.0.1:5432") {
        Ok(_stream) => {
            info!("PostgreSQL is running on port 5432");
            Ok(PostgreSQLStatus {
                running: true,
                port: 5432,
                error: None,
            })
        }
        Err(e) => {
            info!("PostgreSQL is not running: {}", e);
            Ok(PostgreSQLStatus {
                running: false,
                port: 5432,
                error: Some(e.to_string()),
            })
        }
    }
}

#[tauri::command]
pub async fn start_postgresql(app: tauri::AppHandle) -> Result<String, String> {
    info!("Attempting to start PostgreSQL");
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let pg_data_dir = app_data_dir.join("postgres").join("data");
    let _pg_bin_dir = app_data_dir.join("postgres").join("bin");
    
    info!("PostgreSQL data directory: {:?}", pg_data_dir);
    
    if !pg_data_dir.exists() {
        info!("PostgreSQL data directory does not exist, will need initialization");
        return Err("PostgreSQL not initialized. Run setup first.".to_string());
    }
    
    Ok(format!("PostgreSQL start requested. Data dir: {:?}", pg_data_dir))
}

#[tauri::command]
pub async fn stop_postgresql() -> Result<String, String> {
    info!("Attempting to stop PostgreSQL");
    Ok("PostgreSQL stop requested".to_string())
}

#[tauri::command]
pub async fn get_logs_path(app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = app.path().app_log_dir()
        .map_err(|e| format!("Failed to get log dir: {}", e))?;
    
    Ok(log_dir.to_string_lossy().to_string())
}
