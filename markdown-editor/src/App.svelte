<script lang="ts">
  import "@fontsource/fira-code";
  import "@fontsource/ibm-plex-sans";
  import { marked } from "marked";
  import { onMount } from "svelte";
  import Settings from "./lib/Settings.svelte";
  import TextAnalysis from "./lib/TextAnalysis.svelte";
  import { Store } from "@tauri-apps/plugin-store";

  let showSettings = false;
  let showTextAnalysis = false;

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
    <div class="navbar-buttons">
      <button
        class="settings-button"
        on:click={() => (showSettings = !showSettings)}
      >
        {showSettings ? "Close Settings" : "Settings"}
      </button>
      <button
        class="text-analysis-button"
        on:click={() => (showTextAnalysis = !showTextAnalysis)}
      >
        {showTextAnalysis ? "Close Analysis" : "Analyze Text"}
      </button>
    </div>
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
  
  {#if showTextAnalysis}
    <div class="text-analysis-container">
      <TextAnalysis {markdown} />
    </div>
  {/if}
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
  
  .text-analysis-button {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;
  }
  
  .text-analysis-button:hover {
    background-color: #218838;
  }

  .settings-container {
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .text-analysis-container {
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .navbar-buttons {
    display: flex;
  }

  @media (max-width: 768px) {
    .editor-container {
      flex-direction: column;
    }
  }
</style>
