<h1 align="center">清砚雪Coding</h1>

<p align="center">
  A Codex-style desktop coding agent with multi-model support, tool execution, sandbox options, Skills, MCP connectors, and remote workflows.
</p>

<p align="center">
  <a href="./README_zh.md">中文文档</a> ·
  <a href="https://github.com/huaqiang-huang/qingyanxue-coding/releases">Releases</a> ·
  <a href="https://github.com/huaqiang-huang/qingyanxue-coding/issues">Issues</a>
</p>

## What It Is

清砚雪Coding is a desktop AI agent for real project work, not just chat.

It is designed for workflows like:

- reading and editing code
- searching large repositories
- running shell commands and validations
- generating structured outputs with Skills
- using MCP tools to connect browsers, apps, and external services
- working with sandbox isolation on macOS and Windows

The product goal is simple: make AI feel closer to a serious coding agent in a desktop app.

## Core Capabilities

- Codex-style task flow: inspect, execute, verify, then close out
- Multi-model routing: OpenAI, Anthropic, Gemini, OpenRouter, Ollama, and custom compatible endpoints
- Built-in tools: file operations, shell, search, trace visibility, and structured execution state
- Skills system: reusable workflows for PPTX, DOCX, PDF, XLSX, and custom tasks
- MCP connectors: extend the agent with browser, automation, and external-service tools
- Remote workflows: Feishu and Slack channel integration
- Sandbox modes:
  - Windows: WSL2
  - macOS: Lima
  - Linux: native guarded mode

## Installation

### Download

Download builds from the project releases page:

- [Releases](https://github.com/huaqiang-huang/qingyanxue-coding/releases)

Available targets:

- Windows: `.exe`
- macOS Apple Silicon: `.dmg`
- Linux x64: `.AppImage`

### Homebrew

```bash
brew tap huaqiang-huang/tap
brew install --cask --no-quarantine qingyanxue-coding
```

### Build From Source

```bash
git clone https://github.com/huaqiang-huang/qingyanxue-coding.git
cd qingyanxue-coding
npm install
npm run rebuild
npm run dev
```

Build installers locally:

```bash
npm run build
# or per platform on a matching host OS
npm run build:mac
npm run build:win
npm run build:linux
```

## Quick Start

1. Open the app.
2. Add your model provider configuration in Settings.
3. Choose a working directory.
4. Start with a concrete task.

Example prompts:

- `Review this repo and explain the startup flow.`
- `Fix the failing test and run verification.`
- `Read this CSV and generate a 5-slide summary deck.`
- `Search the codebase for how context compaction works.`

## Model Support

The app supports both direct providers and compatible endpoints.

Common setups:

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Ollama
- Custom OpenAI-compatible endpoints
- Custom Anthropic-compatible endpoints
- Custom Gemini-compatible endpoints

This makes it practical to use official APIs, self-hosted relays, or third-party gateways with the same desktop workflow.

## Safety Model

清砚雪Coding supports multiple safety layers:

- workspace-first execution
- path-aware file operations
- guarded shell execution
- sandbox isolation where available
- explicit permission flows for risky actions

Sandbox modes:

- Windows: WSL2-based isolated execution
- macOS: Lima-based isolated execution
- Linux: native execution with path and workspace guards

## Skills

Built-in skills live under `.claude/skills/`.

Typical examples:

- `pptx`
- `docx`
- `pdf`
- `xlsx`
- `skill-creator`

The app also supports user-managed and custom skills.

## Architecture

High-level structure:

```text
src/
  main/        Electron main process, sessions, tools, MCP, sandbox, runtime
  preload/     Electron bridge APIs
  renderer/    React UI, panels, settings, traces, context
.claude/
  skills/      Built-in Skills
resources/
  icons, branding, packaged assets
```

Key runtime areas:

- `src/main/claude/agent-runner.ts`
- `src/main/session/session-manager.ts`
- `src/main/tools/`
- `src/main/mcp/`
- `src/main/sandbox/`
- `src/renderer/components/`

## Project Status

This repository is actively evolving around a coding-first desktop agent experience.

Current priorities include:

- stronger tool-call stability
- better model compatibility
- cleaner session state handling
- better memory and long-context behavior
- stable cross-platform packaging

## License

MIT
