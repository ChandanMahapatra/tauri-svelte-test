use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_store::Builder;
use reqwest;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(Builder::default().build())
        .invoke_handler(tauri::generate_handler![query_llm, evaluate_text])
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

// Clean up AI response to extract just the JSON part
fn clean_json_response(response: &str) -> String {
    // Look for JSON object starting with { and ending with }
    if let Some(start) = response.find('{') {
        if let Some(end) = response.rfind('}') {
            if end > start {
                let json_part = &response[start..=end];
                // Validate it's valid JSON by trying to parse it
                if serde_json::from_str::<serde_json::Value>(json_part).is_ok() {
                    return json_part.to_string();
                }
            }
        }
    }

    // If we can't find valid JSON, return the original response
    response.to_string()
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
            // Call LM Studio API (completions format, not chat completions)
            let api_url = request.api_url.unwrap_or_else(|| "http://localhost:1234/v1/completions".to_string());
            let model = request.model.ok_or("Model is required for LM Studio")?;
            let client = reqwest::Client::new();

            println!("🌐 LM Studio: Making request to {}", api_url);
            println!("📋 LM Studio: Full request details - provider: {}, api_url: {}, model: {}", request.provider, api_url, model);

            let lm_studio_request = serde_json::json!({
                "model": model,
                "prompt": request.prompt,
                "max_tokens": 1000,
                "temperature": 0.7
            });

            println!("📤 LM Studio request payload: {}", serde_json::to_string_pretty(&lm_studio_request).unwrap_or_default());

            let response = client
                .post(&api_url)
                .json(&lm_studio_request)
                .send()
                .await
                .map_err(|e| {
                    println!("❌ LM Studio: Network error - {}", e);
                    format!("Failed to send request to LM Studio: {}", e)
                })?;

            println!("📥 LM Studio: Response status: {}", response.status());

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                println!("❌ LM Studio: API error - {}", error_text);
                return Err(format!("LM Studio API error: {}", error_text));
            }

            // First try to get the response as text to check for error messages
            let response_text = response.text().await
                .map_err(|e| {
                    println!("❌ LM Studio: Failed to read response text - {}", e);
                    format!("Failed to read LM Studio response: {}", e)
                })?;

            println!("📄 LM Studio: Raw response: {}", response_text);

            // Check if response contains error message
            if response_text.contains("Unexpected endpoint") || response_text.contains("error") {
                println!("❌ LM Studio: Server returned error message: {}", response_text);
                return Err(format!("AI Server Error: {}", response_text));
            }

            // Try to parse as JSON
            let lm_studio_response: serde_json::Value = serde_json::from_str(&response_text)
                .map_err(|e| {
                    println!("❌ LM Studio: Failed to parse response as JSON - {}", e);
                    format!("Failed to parse LM Studio response: {}", e)
                })?;

            println!("📄 LM Studio: Parsed response: {}", serde_json::to_string_pretty(&lm_studio_response).unwrap_or_default());

            let result = lm_studio_response["choices"][0]["text"]
                .as_str()
                .ok_or_else(|| {
                    println!("❌ LM Studio: Could not extract text from response");
                    "Failed to extract text from LM Studio response".to_string()
                })?
                .to_string();

            println!("✅ LM Studio: Successfully extracted content, length: {}", result.len());
            Ok(QueryLLMResponse { result })
        }
        _ => Err("Invalid provider. Supported providers are 'openai', 'local-ai', and 'lm-studio'".to_string()),
    }
}

#[derive(Serialize, Deserialize)]
struct EvaluateTextRequest {
    text: String,
    provider: Option<String>,
    api_url: Option<String>,
    model: Option<String>,
}

#[derive(Serialize)]
struct EvaluateTextResponse {
    score: u32,
    issues: Vec<String>,
}

#[command]
async fn evaluate_text(request: EvaluateTextRequest) -> Result<EvaluateTextResponse, String> {
    let provider = request.provider.unwrap_or_else(|| "lm-studio".to_string());
    let model = request.model.unwrap_or_else(|| "mistralai/magistral-small-2509".to_string());

    println!("🔍 evaluate_text called with provider: {}, model: {}, api_url: {:?}", provider, model, request.api_url);

    let evaluation_prompt = format!(
        "Please evaluate the following text for grammar, readability, and clarity. Provide a score from 0-100 (where 100 is perfect) and list any major issues found. Format your response as JSON with 'score' and 'issues' fields.

Text to evaluate:
{}

Response format:
{{
  \"score\": <number 0-100>,
  \"issues\": [\"<issue1>\", \"<issue2>\", ...]
}}",
        request.text
    );

    let llm_request = QueryLLMRequest {
        provider: provider.clone(),
        api_key: None,
        api_url: request.api_url.clone(),
        model: Some(model.clone()),
        prompt: evaluation_prompt,
    };

    println!("🚀 Calling query_llm with provider: {}, api_url: {:?}", provider, request.api_url);
    let llm_response = query_llm(llm_request).await?;
    println!("✅ query_llm response received, length: {}", llm_response.result.len());

    // Clean up the AI response to extract just the JSON part
    let cleaned_result = clean_json_response(&llm_response.result);
    println!("🧹 Cleaned AI response: {}", cleaned_result);

    // Parse the JSON response
    let parsed: serde_json::Value = serde_json::from_str(&cleaned_result)
        .map_err(|e| {
            println!("❌ Failed to parse AI response as JSON: {}", e);
            println!("❌ Raw response was: {}", llm_response.result);
            format!("Failed to parse AI response as JSON: {}", e)
        })?;

    let score = parsed["score"]
        .as_u64()
        .ok_or_else(|| {
            println!("❌ Score not found in response: {:?}", parsed);
            "Score not found or not a number".to_string()
        })?
        as u32;

    let issues = parsed["issues"]
        .as_array()
        .ok_or_else(|| {
            println!("❌ Issues not found in response: {:?}", parsed);
            "Issues not found or not an array".to_string()
        })?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect::<Vec<String>>();

    println!("✅ Evaluation complete - Score: {}, Issues: {}", score, issues.len());
    Ok(EvaluateTextResponse { score, issues })
}
