use notify::{Watcher, RecursiveMode, Event, Config};
use tokio::sync::mpsc;
use std::path::Path;

pub async fn watch_claude_logs(tx: mpsc::Sender<String>) {
    let home = std::env::var("HOME").unwrap();
    let claude_dir = format!("{}/.claude/projects", home);
    
    // Create an OS-level watcher
    let (std_tx, std_rx) = std::sync::mpsc::channel();
    let mut watcher = notify::RecommendedWatcher::new(std_tx, Config::default()).unwrap();
    
    // Watch the claude directory recursively
    watcher.watch(Path::new(&claude_dir), RecursiveMode::Recursive).unwrap();

    // Whenever a file is modified, read the new lines and send to our processing channel
    for res in std_rx {
        match res {
            Ok(Event { kind, paths, .. }) if kind.is_modify() => {
                for path in paths {
                    if path.extension().unwrap_or_default() == "jsonl" {
                        // In reality, you'd track file offsets here to only read NEW lines.
                        // For MVP, trigger an event saying "This file changed"
                        tx.blocking_send(path.to_string_lossy().to_string()).unwrap();
                    }
                }
            }
            _ => {}
        }
    }
}