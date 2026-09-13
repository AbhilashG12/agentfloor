use crate::domain::agent_event::{RawAgentEvent, SummarizedEvent};
use std::time::{SystemTime, UNIX_EPOCH};

pub async fn summarize_event(raw: RawAgentEvent, user_id: &str) -> SummarizedEvent {
    // 1. Attempt to call local Ollama (assuming agentfloor_core::llm handles the reqwest logic)
    // let summary = agentfloor_core::llm::summarize(&raw.raw_text_snippet).await;
    
    // Mocking the LLM call and fallback for the snippet:
    let summary_text = match mock_llm_call(&raw.raw_text_snippet).await {
        Ok(text) => text,
        Err(_) => {
            // THE CIRCUIT BREAKER: If Ollama is down, do not crash. Generate a safe string.
            // A simple regex or string search could find "files edited" in the raw text.
            "Agent active: generating code (fallback)".to_string()
        }
    };

    SummarizedEvent {
        user_id: user_id.to_string(),
        session_id: raw.session_id,
        source: "claude_code".to_string(),
        summary_text,
        tokens_in: raw.tokens_in,
        tokens_out: raw.tokens_out,
        cost_usd: raw.cost_usd,
        ts: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64,
    }
}

async fn mock_llm_call(_text: &str) -> Result<String, ()> {
    // Simulate HTTP call to local Ollama API
    Ok("Refactoring auth middleware".to_string())
}