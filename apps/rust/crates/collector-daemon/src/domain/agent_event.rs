use serde::{Deserialize, Serialize};

#[derive(Serialize,Deserialize,Debug,PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SummarizedEvent{
    pub user_id: String,
    pub session_id: String,
    pub source: String,
    pub summary_text: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub cost_usd: f64,
    pub ts: i64,
}


#[cfg(test)]
mod tests{
    use super::*;
    
    #[test]
    fn test_serialization_matches_zod_contract() {
        let event = SummarizedEvent {
            user_id: "123e4567-e89b-12d3-a456-426614174000".to_string(),
            session_id: "sess_123".to_string(),
            source: "agent_log".to_string(),
            summary_text: "Refactoring auth".to_string(),
            tokens_in: 150,
            tokens_out: 50,
            cost_usd: 0.002,
            ts: 1690000000,
        }
        let json = serde_json::to_string(&event).unwrap();

        assert!(json.contains("\"userId\":\"123e4567-e89b-12d3-a456-426614174000\""));
        assert!(json.contains("\"costUsd\":0.002"));
    }

}