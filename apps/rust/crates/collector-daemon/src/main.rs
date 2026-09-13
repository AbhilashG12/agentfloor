use tokio::sync::mpsc;
use reqwest::Client;
use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<String>(100);
    let http_client = Client::new();
    let api_url = "http://localhost:3001/api/v1/events";

    // 1. Start Health Check server on a background thread
    tokio::spawn(async {
        let app = Router::new().route("/health", get(|| async { "Daemon is running" }));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:8765").await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });

    // 2. Start File Watcher on a background thread
    tokio::spawn(async move {
        // watch_claude_logs(tx).await; 
    });

    // 3. Main processing loop (Debounce & Transport)
    while let Some(_path) = rx.recv().await {
        // Construct RawEvent (Parsing logic omitted for brevity)
        let raw = create_dummy_raw_event(); 
        
        // Summarize (strips sensitive data)
        let safe_event = summarize_event(raw, "user_123").await;

        // Transport
        let res = http_client.post(api_url)
            .header("Authorization", "Bearer dev_api_key_123")
            .json(&safe_event)
            .send()
            .await;
            
        println!("Sent event to gateway: {:?}", res.unwrap().status());
        
        // Debounce: Sleep for 30s so we don't spam the server on every keystroke
        tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
    }
}