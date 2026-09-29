mod domain;

use reqwest::Client;
use std::time::{SystemTime, UNIX_EPOCH};

// Import your domain events from the module we created
use crate::domain::agent_event::SummarizedEvent;

#[tokio::main]
async fn main() {
    let http_client = Client::new();
    let api_url = "http://localhost:3001/api/v1/events";

    let actions = [
        "Reading src/auth/jwt.ts",
        "Writing tests for auth middleware",
        "Fixing type errors in packages/contracts",
        "Agent stuck on retry loop... investigating",
    ];

    let mut i = 0;
    let mut total_cost = 0.0;

    println!("Starting AgentFloor Simulator...");

    loop {
        total_cost += 0.005; // Simulate spending money

        let safe_event = SummarizedEvent {
            user_id: "dev_123".to_string(),
            session_id: "session_abc".to_string(),
            source: "claude_code".to_string(),
            summary_text: actions[i % actions.len()].to_string(),
            tokens_in: 1500,
            tokens_out: 450,
            cost_usd: total_cost,
            ts: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
        };

        let res = http_client
            .post(api_url)
            .header("Authorization", "Bearer dev_api_key_123")
            .json(&safe_event)
            .send()
            .await;

        println!(
            "Sent simulated action to gateway: {:?}",
            res.unwrap().status()
        );

        i += 1;
        // Wait 5 seconds before the agent "does" something else
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}
