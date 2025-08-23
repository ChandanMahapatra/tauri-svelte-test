<script lang="ts">
  import { onMount } from 'svelte';
  import { Store } from '@tauri-apps/plugin-store';

  let store: Store | null = null;
  
  // Settings state
  let provider = 'ollama';
  let apiKey = '';
  let model = 'llama3';

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
    const savedModel = await store.get('model');
    
    if (savedProvider) provider = savedProvider as string;
    if (savedApiKey) apiKey = savedApiKey as string;
    if (savedModel) model = savedModel as string;
  }

  // Save settings to store
  async function saveSettings() {
    if (!store) return;
    
    await store.set('provider', provider);
    await store.set('apiKey', apiKey);
    await store.set('model', model);
    await store.save();
    
    alert('Settings saved successfully!');
  }
</script>

<div class="settings-panel">
  <h2>Settings</h2>
  
  <div class="form-group">
    <label for="provider">Provider:</label>
    <select id="provider" bind:value={provider}>
      <option value="ollama">Ollama</option>
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
  
  <div class="form-group">
    <label for="model">Model:</label>
    <input 
      type="text" 
      id="model" 
      bind:value={model} 
      placeholder="Enter model name (e.g., gpt-4o-mini, llama3)"
    />
  </div>
  
  <button on:click={saveSettings} class="save-button">Save Settings</button>
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
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
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
  
  .save-button:hover {
    background-color: #0056b3;
  }
</style>