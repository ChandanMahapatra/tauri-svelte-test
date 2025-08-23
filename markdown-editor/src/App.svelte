<script lang="ts">
  import "@fontsource/fira-code";
  import "@fontsource/ibm-plex-sans";
  import { marked } from "marked";
  import { onMount } from "svelte";
  import Settings from "./lib/Settings.svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { Store } from "@tauri-apps/plugin-store";
  
  interface QueryLLMResponse {
    result: string;
  }
  
  let showSettings = false;
  let prompt = "";
  let response = "";
  let isLoading = false;
  
  // Load settings from store
  async function loadSettings() {
    try {
      const store = await Store.load('settings.json');
      return {
        provider: (await store.get('provider')) || 'ollama',
        apiKey: (await store.get('apiKey')) || '',
        model: (await store.get('model')) || 'llama3'
      };
    } catch (error) {
      console.error("Error loading settings:", error);
      return {
        provider: 'ollama',
        apiKey: '',
        model: 'llama3'
      };
    }
  }
  
  // Query LLM function
  async function queryLLM() {
    if (!prompt.trim()) return;
    
    isLoading = true;
    response = "";
    
    try {
      // Load settings
      const settings = await loadSettings();
      
      // Call the Rust backend command
      const result = await invoke('query_llm', {
        request: {
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          prompt: prompt
        }
      });
      
      const typedResult = result as QueryLLMResponse;
      response = typedResult.result;
    } catch (error) {
      console.error("Error querying LLM:", error);
      response = `Error: ${error}`;
    } finally {
      isLoading = false;
    }
  }

  let markdown = `# Welcome to Markdown Editor

## This is a heading
This is some **bold** text and this is *italic* text.

You can also create lists:
- Item 1
- Item 2
- Item 3

Or numbered lists:
1. First item
2. Second item
3. Third item

> This is a blockquote

\`\`\`javascript
// This is a code block
function helloWorld() {
  console.log('Hello, world!');
}
\`\`\`

[This is a link](https://example.com)
`;

  let html = "";

  async function updatePreview() {
    html = await marked(markdown);
  }

  onMount(() => {
    updatePreview();
  });
</script>

<main>
  <nav class="navbar">
    <h1>Markdown Editor</h1>
    <button class="settings-button" on:click={() => showSettings = !showSettings}>
      {showSettings ? 'Close Settings' : 'Settings'}
    </button>
  </nav>

  <div class="editor-container">
    <div class="editor">
      <textarea bind:value={markdown} on:input={updatePreview}></textarea>
    </div>

    <div class="preview">
      <div class="preview-content">
        {@html html}
      </div>
    </div>
  </div>
  
  {#if showSettings}
    <div class="settings-container">
      <Settings />
    </div>
  {/if}
  
  <div class="llm-container">
    <div class="prompt-section">
      <textarea
        bind:value={prompt}
        placeholder="Enter your prompt here..."
        class="prompt-input"
      ></textarea>
      <button
        on:click={queryLLM}
        disabled={isLoading}
        class="query-button"
      >
        {isLoading ? 'Loading...' : 'Query LLM'}
      </button>
    </div>
    
    <div class="response-section">
      <h3>Response:</h3>
      <div class="response-content">
        {@html response}
      </div>
    </div>
  </div>
</main>

<style>
  main {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  h1 {
    text-align: center;
    padding: 1rem;
    margin: 0;
  }

  .editor-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor,
  .preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow: auto;
  }

  .editor textarea {
    flex: 1;
    padding: 1rem;
    font-family: "Fira Code", monospace;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: none;
  }

  .preview-content {
    flex: 1;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: auto;
    background-color: white;
    font-family: "IBM Plex Sans", sans-serif;
    color: #333333;
  }

  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .settings-button {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .settings-button:hover {
    background-color: #0056b3;
  }

  .settings-container {
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .llm-container {
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .prompt-section {
    margin-bottom: 1rem;
  }
  
  .prompt-input {
    width: 100%;
    min-height: 100px;
    padding: 0.5rem;
    font-family: "Fira Code", monospace;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    margin-bottom: 0.5rem;
  }
  
  .query-button {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .query-button:hover:not(:disabled) {
    background-color: #218838;
  }
  
  .query-button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  .response-section h3 {
    margin-top: 0;
  }
  
  .response-content {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    min-height: 100px;
    font-family: "IBM Plex Sans", sans-serif;
    color: #333333;
  }

  @media (max-width: 768px) {
    .editor-container {
      flex-direction: column;
    }
  }
</style>
