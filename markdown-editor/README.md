# Markdown Editor

A desktop Markdown editor built with Tauri and SvelteKit.

## Features

- Real-time Markdown preview
- Desktop application with native capabilities
- Cross-platform support (Windows, macOS, Linux)

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run tauri dev
   ```

3. Build the application:
   ```bash
   npm run tauri build
   ```

## Project Structure

- `src/` - SvelteKit frontend code
- `src-tauri/` - Tauri backend code (Rust)
  - `src/main.rs` - Main Tauri application entry point
  - `tauri.conf.json` - Tauri configuration
  - `Cargo.toml` - Rust dependencies

## Learn More

- [Tauri](https://tauri.app/)
- [SvelteKit](https://kit.svelte.dev/)
