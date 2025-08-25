use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_store::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(Builder::default().build())
        .invoke_handler(tauri::generate_handler![query_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize, Deserialize)]
struct QueryLLMRequest {
    provider: String,
    api_key: Option<String>,
    api_url: Option<String>,
    model: Option<String>,
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
            let model = request.model.ok_or("Model is required for OpenAI")?;
            let client = reqwest::Client::new();
            
            let openai_request = serde_json::json!({
                "model": model,
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
        "local-ai" => {
            // Call Local AI API (Ollama-compatible)
            let api_url = request.api_url.unwrap_or_else(|| "http://localhost:11434/api/generate".to_string());
            let model = request.model.unwrap_or_default();
            let client = reqwest::Client::new();
            
            let mut local_ai_request = serde_json::json!({
                "prompt": request.prompt,
                "stream": false
            });
            
            // Add model to request if provided
            if !model.is_empty() {
                local_ai_request["model"] = serde_json::Value::String(model);
            }
            
            let response = client
                .post(&api_url)
                .json(&local_ai_request)
                .send()
                .await
                .map_err(|e| format!("Failed to send request to Local AI: {}", e))?;
                
            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(format!("Local AI API error: {}", error_text));
            }
            
            let local_ai_response: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse Local AI response: {}", e))?;
                
            let result = local_ai_response["response"]
                .as_str()
                .ok_or("Failed to extract response from Local AI response")?
                .to_string();
                
            Ok(QueryLLMResponse { result })
        }
        "lm-studio" => {
            // Call LM Studio API (OpenAI-compatible)
            let api_url = request.api_url.unwrap_or_else(|| "http://localhost:1234/v1/chat/completions".to_string());
            let model = request.model.ok_or("Model is required for LM Studio")?;
            let client = reqwest::Client::new();
            
            let lm_studio_request = serde_json::json!({
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": request.prompt
                }],
                "stream": false
            });
            
            let response = client
                .post(&api_url)
                .json(&lm_studio_request)
                .send()
                .await
                .map_err(|e| format!("Failed to send request to LM Studio: {}", e))?;
                
            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(format!("LM Studio API error: {}", error_text));
            }
            
            let lm_studio_response: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse LM Studio response: {}", e))?;
                
            let result = lm_studio_response["choices"][0]["message"]["content"]
                .as_str()
                .ok_or("Failed to extract content from LM Studio response")?
                .to_string();
                
            Ok(QueryLLMResponse { result })
        }
        _ => Err("Invalid provider. Supported providers are 'openai', 'local-ai', and 'lm-studio'".to_string()),
    }
}
