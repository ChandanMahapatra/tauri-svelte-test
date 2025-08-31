<script lang="ts">
  import "@fontsource/fira-code";
  import "@fontsource/ibm-plex-sans";
  import { marked } from "marked";
  import { onMount } from "svelte";
  import Settings from "./lib/Settings.svelte";
  import TextAnalysis from "./lib/TextAnalysis.svelte";
  import { Store } from "@tauri-apps/plugin-store";
  let showSettings = false;
  let viewMode = "editor"; // "editor" or "preview"
  let hoveredIssueType = ""; // Track which issue type is being hovered

  function setShowSettings(value: boolean) {
    showSettings = value;
  }

  function toggleViewMode(mode: string) {
    viewMode = mode;
  }

  function handleIssueHover(issueType: string) {
    hoveredIssueType = issueType;
  }

  function handleIssueLeave() {
    hoveredIssueType = "";
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

You can utilize a simpler word instead of a purple one. Click on highlights to fix them.

Adverbs, passive voice, and other weakening phrases are marked in blue. I believe you should replace them with more forceful language.

This sentence contains really obvious adverbs that should be highlighted clearly.
`;

  let html = "";
  let highlightedHtml = "";

  async function updatePreview() {
    html = await marked(markdown);
    // Apply highlighting to the HTML
    highlightedHtml = await applyHighlightingToHtml(html, markdown);
  }

  async function applyHighlightingToHtml(html: string, markdown: string): Promise<string> {
    // Use the same logic as the counting system from app-logic.ts
    const { getDifficultSentences, resetData } = await import('./app-logic');

    // Reset data to ensure clean state for highlighting
    resetData();

    // Apply highlighting using the same logic used for counting
    let highlightedText = markdown;
    const paragraphs = highlightedText.split("\n");

    // Process each paragraph with the same logic used for counting
    const processedParagraphs = paragraphs.map(p => {
      if (p.trim() !== '') {
        return getDifficultSentences(p);
      }
      return p;
    });

    highlightedText = processedParagraphs.join("\n");

    // Add interactive highlighting classes based on hovered issue type
    if (hoveredIssueType) {
      highlightedText = addInteractiveHighlighting(highlightedText, hoveredIssueType);
    }

    // Convert the highlighted markdown to HTML
    return await marked.parse(highlightedText);
  }

  function addInteractiveHighlighting(text: string, issueType: string): string {
    // Map issue types to their corresponding CSS classes
    const classMap: Record<string, string> = {
      'hardSentence': 'hardSentence',
      'veryHardSentence': 'veryHardSentence',
      'passive': 'passive',
      'adverb': 'adverb',
      'complex': 'complex',
      'qualifier': 'qualifier'
    };

    const targetClass = classMap[issueType];
    if (!targetClass) return text;

    // Replace existing class with class + interactive-highlight
    const regex = new RegExp(`class="${targetClass}"`, 'g');
    return text.replace(regex, `class="${targetClass} interactive-highlight"`);
  }



  onMount(() => {
    updatePreview();
  });

  // Reactive statement to update highlighting when hoveredIssueType changes
  $: hoveredIssueType, updatePreview();
</script>

<main>
  <nav class="navbar">
    <h1>Markdown Editor</h1>
    <div class="navbar-buttons">
      <div class="toggle-group">
        <button
          class="toggle-button"
          class:active={viewMode === "editor"}
          on:click={() => toggleViewMode("editor")}
        >
          Editor
        </button>
        <button
          class="toggle-button"
          class:active={viewMode === "preview"}
          on:click={() => toggleViewMode("preview")}
        >
          Preview
        </button>
      </div>

      <button class="settings-button" on:click={() => setShowSettings(true)}>
        Settings
      </button>
    </div>

    {#if showSettings}
      <div class="modal-overlay" on:click={() => setShowSettings(false)}>
        <div class="modal-content" on:click|stopPropagation>
          <div class="modal-header">
            <h2>Settings</h2>
            <button class="close-button" on:click={() => setShowSettings(false)}>×</button>
          </div>
          <div class="modal-body">
            <Settings />
          </div>
        </div>
      </div>
    {/if}
  </nav>

  <div class="main-content">
    <div class="editor-section">
      {#if viewMode === "editor"}
        <div class="editor">
          <textarea bind:value={markdown} on:input={updatePreview}></textarea>
        </div>
      {:else}
        <div class="preview">
          <div class="preview-content">
            {@html highlightedHtml}
          </div>
        </div>
      {/if}
    </div>

    <div class="analysis-section">
      <TextAnalysis
        markdownContent={markdown}
        onIssueHover={handleIssueHover}
        onIssueLeave={handleIssueLeave}
        hoveredIssueType={hoveredIssueType}
      />
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

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    overflow: hidden;
  }

  .analysis-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #dee2e6;
    overflow: hidden;
  }

  .editor,
  .preview {
    flex: 1;
    display: flex;
    flex-direction: column;
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

  .navbar-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toggle-group {
    display: flex;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .toggle-button {
    padding: 0.5rem 1rem;
    background-color: #f8f9fa;
    color: #495057;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .toggle-button.active {
    background-color: #007bff;
    color: white;
  }

  .toggle-button:not(.active):hover {
    background-color: #e9ecef;
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

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    background-color: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 1001;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
  }

  .modal-header h2 {
    margin: 0;
    color: #333;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .close-button:hover {
    background-color: #f8f9fa;
    color: #495057;
  }

  /* Text highlighting styles */
  .hardSentence {
    background-color: #fff3cd;
    border-bottom: 2px solid #ffc107;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .veryHardSentence {
    background-color: #f8d7da;
    border-bottom: 2px solid #dc3545;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .passive {
    background-color: #e2e3e5;
    border-bottom: 1px solid #6c757d;
    padding: 1px 3px;
    border-radius: 1px;
  }

  .adverb {
    background-color: #d1ecf1;
    border-bottom: 1px solid #17a2b8;
    padding: 1px 3px;
    border-radius: 1px;
  }

  .complex {
    background-color: #d4edda;
    border-bottom: 1px solid #28a745;
    padding: 1px 3px;
    border-radius: 1px;
  }

  .qualifier {
    background-color: #f8f9fa;
    border-bottom: 1px solid #6c757d;
    padding: 1px 3px;
    border-radius: 1px;
  }

  /* Hover effects for highlighting */
  .hardSentence:hover,
  .veryHardSentence:hover,
  .passive:hover,
  .adverb:hover,
  .complex:hover,
  .qualifier:hover {
    opacity: 0.8;
    cursor: pointer;
  }

  /* Interactive highlighting when hovering over issue items */
  :global(.hardSentence.interactive-highlight) {
    background-color: #ffecb5 !important;
    border-bottom: 3px solid #ffc107 !important;
    box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
    animation: pulse 1.5s infinite;
  }

  :global(.veryHardSentence.interactive-highlight) {
    background-color: #f5c6cb !important;
    border-bottom: 3px solid #dc3545 !important;
    box-shadow: 0 0 8px rgba(220, 53, 69, 0.4);
    animation: pulse 1.5s infinite;
  }

  :global(.passive.interactive-highlight) {
    background-color: #d6d8db !important;
    border-bottom: 3px solid #6c757d !important;
    box-shadow: 0 0 8px rgba(108, 117, 125, 0.4);
    animation: pulse 1.5s infinite;
  }

  :global(.adverb.interactive-highlight) {
    background-color: #bee5eb !important;
    border-bottom: 3px solid #17a2b8 !important;
    box-shadow: 0 0 8px rgba(23, 162, 184, 0.4);
    animation: pulse 1.5s infinite;
  }

  :global(.complex.interactive-highlight) {
    background-color: #c3e6cb !important;
    border-bottom: 3px solid #28a745 !important;
    box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
    animation: pulse 1.5s infinite;
  }

  :global(.qualifier.interactive-highlight) {
    background-color: #e2e3e5 !important;
    border-bottom: 3px solid #6c757d !important;
    box-shadow: 0 0 8px rgba(108, 117, 125, 0.4);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @media (max-width: 768px) {
    .main-content {
      flex-direction: column;
    }

    .analysis-section {
      border-left: none;
      border-top: 1px solid #dee2e6;
      flex: none;
      max-height: 300px;
    }
  }
</style>
