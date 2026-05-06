<h1 align="center">清砚雪Coding</h1>

<p align="center">
  一款更偏 Codex 风格的桌面 coding agent，支持多模型、工具调用、沙盒、Skills、MCP 连接器和远程工作流。
</p>

<p align="center">
  <a href="./readme.md">English</a> ·
  <a href="https://github.com/huaqiang-huang/qingyanxue-coding/releases">发布页</a> ·
  <a href="https://github.com/huaqiang-huang/qingyanxue-coding/issues">问题反馈</a>
</p>

## 它是什么

清砚雪Coding 不是普通聊天壳子，而是一套偏“直接干活”的桌面 AI agent。

它主要面向这些场景：

- 阅读和修改代码
- 检索大型仓库
- 跑命令、跑验证、查问题
- 用 Skills 生成结构化产物
- 通过 MCP 调浏览器、桌面应用、外部服务
- 在 macOS / Windows 上结合沙盒做更安全的执行

目标很直接：把 AI 在桌面端做项目的体验，尽量做得更像真正的 coding agent。

## 核心能力

- Codex 风格任务流：先收集上下文，再执行，再验证，再收尾
- 多模型支持：OpenAI、Anthropic、Gemini、OpenRouter、Ollama，以及兼容协议的自定义接口
- 内置工具链：文件、命令、搜索、trace、执行状态展示
- Skills 系统：支持 PPTX、DOCX、PDF、XLSX 和自定义工作流
- MCP 连接器：接入浏览器、自动化工具和外部服务
- 远程工作流：支持飞书和 Slack
- 沙盒模式：
  - Windows：WSL2
  - macOS：Lima
  - Linux：本机受控模式

## 安装方式

### 下载安装包

发布页：

- [Releases](https://github.com/huaqiang-huang/qingyanxue-coding/releases)

当前支持：

- Windows：`.exe`
- macOS Apple Silicon：`.dmg`
- Linux x64：`.AppImage`

### Homebrew

```bash
brew tap huaqiang-huang/tap
brew install --cask --no-quarantine qingyanxue-coding
```

### 源码运行

```bash
git clone https://github.com/huaqiang-huang/qingyanxue-coding.git
cd qingyanxue-coding
npm install
npm run rebuild
npm run dev
```

本地打包：

```bash
npm run build
# 或在对应系统上定向打包
npm run build:mac
npm run build:win
npm run build:linux
```

## 快速开始

1. 打开应用
2. 在设置中填好模型提供方配置
3. 选择工作目录
4. 直接给一个具体任务

例如：

- `帮我梳理这个仓库的启动流程。`
- `修掉这个报错并跑一遍验证。`
- `读取这个 CSV，生成一个 5 页总结 PPT。`
- `搜索代码里上下文压缩是怎么做的。`

## 模型支持

这套产品既支持官方提供方，也支持兼容协议的中转或自建接口。

常见配置包括：

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Ollama
- 自定义 OpenAI 兼容接口
- 自定义 Anthropic 兼容接口
- 自定义 Gemini 兼容接口

所以你既可以接官方 API，也可以接第三方网关、自托管代理或兼容服务。

## 安全机制

清砚雪Coding 提供多层保护：

- 以工作目录为默认执行上下文
- 路径感知的文件操作
- 受控 shell 执行
- 可用时启用沙盒隔离
- 对风险操作走明确授权流

沙盒模式：

- Windows：基于 WSL2 的隔离执行
- macOS：基于 Lima 的隔离执行
- Linux：本机执行，但带工作区和路径守卫

## Skills

内置 Skills 位于 `.claude/skills/`。

典型能力包括：

- `pptx`
- `docx`
- `pdf`
- `xlsx`
- `skill-creator`

同时也支持用户自行管理和扩展自定义 Skills。

## 架构概览

高层结构如下：

```text
src/
  main/        Electron 主进程、session、tools、MCP、sandbox、runtime
  preload/     Electron 桥接 API
  renderer/    React 界面、设置、trace、上下文面板
.claude/
  skills/      内置 Skills
resources/
  图标、品牌资源、打包静态文件
```

几个关键模块：

- `src/main/claude/agent-runner.ts`
- `src/main/session/session-manager.ts`
- `src/main/tools/`
- `src/main/mcp/`
- `src/main/sandbox/`
- `src/renderer/components/`

## 项目状态

这个项目当前在持续往“coding-first 桌面 agent”方向收口。

近期重点包括：

- 工具调用稳定性
- 模型兼容性
- 会话状态一致性
- 长上下文与记忆能力
- 跨平台打包稳定性

## License

MIT
