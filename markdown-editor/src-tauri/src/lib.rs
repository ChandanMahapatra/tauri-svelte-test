use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_store::StoreBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(StoreBuilder::default().build())
        .invoke_handler(tauri::generate_handler![query_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize, Deserialize)]
struct QueryLLMRequest {
    provider: String,
    api_key: Option<String>,
    model: String,
    prompt: String,
}

#[derive(Serialize)]
struct QueryLLMResponse {
    result: String,
}

#[command]
async fn query_llm(request: QueryLLMRequest) -> Result<QueryLLMResponse, String> {
    match request.provider.as_str() {
        "openai" => {
            // Call OpenAI API
            let api_key = request.api_key.ok_or("API key is required for OpenAI")?;
            let client = reqwest::Client::new();
            
            let openai_request = serde_json::json!({
                "model": request.model,
                "messages": [{
                    "role": "user",
                    "content": request.prompt
                }],
                "stream": false
            });
            
            let response = client
                .post("https://api.openai.com/v1/chat/completions")
                .header("Authorization", format!("Bearer {}", api_key))
                .header("Content-Type", "application/json")
                .json(&openai_request)
                .send()
                .await
                .map_err(|e| format!("Failed to send request to OpenAI: {}", e))?;
                
            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(format!("OpenAI API error: {}", error_text));
            }
            
            let openai_response: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;
                
            let result = openai_response["choices"][0]["message"]["content"]
                .as_str()
                .ok_or("Failed to extract content from OpenAI response")?
                .to_string();
                
            Ok(QueryLLMResponse { result })
        }
        "ollama" => {
            // Call Ollama API
            let client = reqwest::Client::new();
            
            let ollama_request = serde_json::json!({
                "model": request.model,
                "prompt": request.prompt,
                "stream": false
            });
            
            let response = client
                .post("http://localhost:11434/api/generate")
                .json(&ollama_request)
                .send()
                .await
                .map_err(|e| format!("Failed to send request to Ollama: {}", e))?;
                
            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(format!("Ollama API error: {}", error_text));
            }
            
            let ollama_response: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
                
            let result = ollama_response["response"]
                .as_str()
                .ok_or("Failed to extract response from Ollama response")?
                .to_string();
                
            Ok(QueryLLMResponse { result })
        }
        _ => Err("Invalid provider. Supported providers are 'openai' and 'ollama'".to_string()),
    }
}
