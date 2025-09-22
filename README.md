# AI-Powered Markdown Editor

A comprehensive Markdown editor with AI-powered text evaluation, built with Tauri (desktop) and modern web technologies. Features real-time preview, grammar checking, readability analysis, and AI scoring.

## ✨ Features

- **Real-time Markdown editing** with live preview
- **AI-powered text evaluation** with scoring (0-100)
- **Grammar and readability analysis** with issue highlighting
- **Multiple AI integrations** (LM Studio, OpenAI, Chrome Built-in AI)
- **Settings persistence** and customizable AI providers
- **Responsive design** for desktop and mobile

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (for desktop version)
- **LM Studio** or other AI provider (optional, for AI features)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd markdown-editor
   npm install
   ```

## 🖥️ Desktop Version (Recommended)

The desktop version provides full AI integration with local models.

### Setup LM Studio (Recommended AI Provider)

1. **Download and install LM Studio:**

   - Visit [https://lmstudio.ai/](https://lmstudio.ai/)
   - Download and install for your platform

2. **Download a model:**

   - Open LM Studio
   - Go to "My Models" tab
   - Search for and download a model like:
     - `mistralai/Mistral-7B-Instruct-v0.1`
     - `microsoft/DialoGPT-medium`
     - `mistralai/magistral-small-2509` (recommended for speed)

3. **Load the model:**

   - Go to "Chat" or "Local Server" tab
   - Load your downloaded model
   - Start the local server (usually on `http://localhost:1234`)

4. **Configure the app:**
   - Run: `npm run tauri dev`
   - Open Settings (gear icon)
   - Set **Provider** to "LM Studio"
   - Set **API URL** to `http://localhost:1234/v1/completions`
   - Set **Model** to match your loaded model (e.g., `mistralai/mistral-7b-instruct-v0.1`)
   - Click "Save Settings"

### Alternative AI Providers

#### Ollama (Local AI)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Run the app
npm run tauri dev
# In settings: Provider="Local AI", URL="http://localhost:11434/api/generate"
```

#### OpenAI (Cloud)

- Get API key from [OpenAI](https://platform.openai.com/api-keys)
- In settings: Provider="OpenAI", enter your API key

### Running Desktop Version

```bash
npm run tauri dev
```

This launches a native desktop application with full AI capabilities.

## 🔒 Privacy & Security

**Local-First Architecture** - Your data never leaves your device:

- ✅ **No cloud uploads** - All AI processing happens locally
- ✅ **No internet required** - Works offline with local models
- ✅ **Secure storage** - Settings saved locally with Tauri's encrypted store
- ✅ **Private AI** - Models run on your hardware, not sent to servers
- ✅ **Open source** - Transparent code you can inspect and modify

**Supported Local AI Options:**
- **LM Studio** - Run models locally with GPU acceleration
- **Ollama** - Cross-platform local AI server
- **Browser AI** - Experimental Chrome features (client-side only)

## 📊 AI Evaluation Features

### Text Analysis

- **Grammar checking** with error highlighting
- **Readability scoring** (sentence complexity, word choice)
- **Style analysis** (passive voice, adverbs, wordiness)
- **Issue identification** with specific suggestions

### AI Scoring

- **0-100 scale** with categorized feedback
- **Multiple criteria**: Grammar, readability, clarity
- **Detailed issue reports** with actionable suggestions
- **Real-time analysis** as you type

### Supported Models

- **LM Studio**: Local models with OpenAI-compatible API
- **Ollama**: Local models with custom API
- **OpenAI**: Cloud-based GPT models

## 🛠️ Development

### Project Structure

```
├── src/                    # Svelte frontend
│   ├── App.svelte         # Desktop version main component
│   ├── lib/               # Shared components
│   └── main.ts            # Desktop entry point
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Tauri app entry
│   │   └── lib.rs         # Core logic & AI integration
│   └── tauri.conf.json    # Tauri configuration
└── package.json          # Dependencies & scripts
```

### Available Scripts

```bash
npm run dev          # Vite dev server (for debugging)
npm run tauri dev    # Desktop app development
npm run build        # Production build
npm run preview      # Preview production build
```

### Key Technologies

- **Frontend:** Svelte 5, TypeScript, Tailwind CSS
- **Desktop:** Tauri (Rust backend for security)
- **AI Integration:** Multiple providers with unified API
- **Text Analysis:** Custom algorithms + AI evaluation
- **Storage:** Tauri's secure store (desktop)

## 🔧 Configuration

### Settings Options

- **Provider**: Choose AI service (LM Studio, OpenAI, Local AI)
- **API URL**: Endpoint for AI service
- **Model**: Specific model to use
- **API Key**: For cloud services (stored securely)

### Troubleshooting

**Desktop Version Issues:**

- Ensure LM Studio/Ollama server is running
- Check API URL matches your server configuration
- Verify model is loaded in your AI application

## 📈 Performance

- **Desktop**: Full AI inference with local models (fast, private)
- **Real-time**: Analysis updates as you type
- **Efficient**: Optimized for smooth editing experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both desktop and browser versions
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Secure desktop app framework
- [Svelte](https://svelte.dev/) - Reactive UI framework
- [LM Studio](https://lmstudio.ai/) - Local AI model platform

---

**Ready to write better content?** Start with `npm run tauri dev` and explore AI-powered writing assistance!
