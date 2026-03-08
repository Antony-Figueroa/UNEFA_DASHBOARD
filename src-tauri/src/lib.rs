use tauri::Manager;
use tracing::{info, error, Level};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use std::panic;

mod commands;

fn setup_logging() {
    let log_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("UNEFA Dashboard")
        .join("logs");
    
    std::fs::create_dir_all(&log_dir).ok();
    
    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        log_dir,
        "unefa-dashboard.log",
    );
    
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env().add_directive(Level::INFO.into()))
        .with(fmt::layer().with_writer(non_blocking))
        .with(fmt::layer().with_writer(std::io::stdout))
        .init();
    
    panic::set_hook(Box::new(|panic_info| {
        error!("Application panic: {}", panic_info);
    }));
    
    info!("UNEFA Dashboard starting...");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    setup_logging();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::check_postgresql_status,
            commands::start_postgresql,
            commands::stop_postgresql,
            commands::get_app_info,
            commands::get_logs_path
        ])
        .setup(|app| {
            info!("Tauri app setup complete");
            
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
