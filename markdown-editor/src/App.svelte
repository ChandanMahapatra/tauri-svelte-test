<script lang="ts">
  import "@fontsource/fira-code";
  import "@fontsource/ibm-plex-sans";
  import { marked } from "marked";
  import { onMount } from "svelte";

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
  <h1>Markdown Editor</h1>

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

  @media (max-width: 768px) {
    .editor-container {
      flex-direction: column;
    }
  }
</style>
