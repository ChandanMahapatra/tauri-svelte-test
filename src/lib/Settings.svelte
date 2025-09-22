<script lang="ts">
  import { onMount } from 'svelte';
  import { Store } from '@tauri-apps/plugin-store';

  let store: Store | null = null;

  // Settings state
  let provider = 'lm-studio';
  let apiKey = '';
  let apiUrl = 'http://localhost:1234/v1/completions';
  let model = 'mistralai/magistral-small-2509';

  // UI state
  let saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  let saveMessage = '';

  // Initialize store
  onMount(async () => {
    store = await Store.load('settings.json');
    await loadSettings();
  });

  // Load settings from store
  async function loadSettings() {
    if (!store) return;
    
    const savedProvider = await store.get('provider');
    const savedApiKey = await store.get('apiKey');
    const savedApiUrl = await store.get('apiUrl');
    const savedModel = await store.get('model');
    
    if (savedProvider) provider = savedProvider as string;
    if (savedApiKey) apiKey = savedApiKey as string;
    if (savedApiUrl) apiUrl = savedApiUrl as string;
    if (savedModel) model = savedModel as string;
  }

  // Save settings to store
  async function saveSettings() {
    if (!store) return;

    saveStatus = 'saving';
    saveMessage = 'Saving settings...';

    try {
      await store.set('provider', provider);
      await store.set('apiKey', apiKey);
      await store.set('apiUrl', apiUrl);
      await store.set('model', model);
      await store.save();

      saveStatus = 'success';
      saveMessage = 'Settings saved successfully!';
    } catch (error) {
      saveStatus = 'error';
      saveMessage = 'Failed to save settings. Please try again.';
      console.error('Settings save error:', error);
    }
  }
</script>

<div class="settings-panel">
  <h2>Settings</h2>
  
  <div class="form-group">
    <label for="provider">Provider:</label>
    <select id="provider" bind:value={provider}>
      <option value="local-ai">Local AI</option>
      <option value="lm-studio">LM Studio</option>
      <option value="openai">OpenAI</option>
    </select>
  </div>
  
  {#if provider === 'openai'}
    <div class="form-group">
      <label for="api-key">API Key:</label>
      <input
        type="password"
        id="api-key"
        bind:value={apiKey}
        placeholder="Enter your OpenAI API key"
      />
    </div>
  {/if}
  
  {#if provider === 'local-ai' || provider === 'lm-studio'}
    <div class="form-group">
      <label for="api-url">API URL:</label>
      <input
        type="text"
        id="api-url"
        bind:value={apiUrl}
        placeholder="Enter API URL (e.g., http://localhost:11434/api/generate)"
      />
    </div>
  {/if}
  
  {#if provider === 'openai' || provider === 'lm-studio'}
    <div class="form-group">
      <label for="model">Model:</label>
      <input
        type="text"
        id="model"
        bind:value={model}
        placeholder="Enter model name (e.g., gpt-4o-mini, llama3)"
      />
    </div>
  {/if}
  
  <button on:click={saveSettings} class="save-button" disabled={saveStatus === 'saving'}>
    {#if saveStatus === 'saving'}
      Saving...
    {:else}
      Save Settings
    {/if}
  </button>

  {#if saveMessage}
    <div class="status-message" class:success={saveStatus === 'success'} class:error={saveStatus === 'error'}>
      {saveMessage}
    </div>
  {/if}
</div>

<style>
  .settings-panel {
    padding: 20px;
    max-width: 500px;
    margin: 0 auto;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: black;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: black;
  }
  
  select, input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }
  
  .save-button {
    width: 100%;
    padding: 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
  }
  
  .save-button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .save-button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }

  .status-message {
    margin-top: 15px;
    padding: 10px 15px;
    border-radius: 4px;
    font-weight: 500;
    text-align: center;
  }

  .status-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .status-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
</style>
