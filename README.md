# TCC: Context Importance in LLM Development Tasks

This repository contains the code and experiments for my TCC project on analyzing the importance of context in development tasks using Large Language Models (LLMs).

## 🚀 Setup

Follow these steps to get the project running locally:

1. **Install Node version** (using nvm):

```bash
nvm install
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Fetch all experiment repositories**:

```bash
pnpm run experiment-repo:fetch-all
```

4. **Setup all experiment repositories**:

```bash
pnpm run experiment-repo:setup-all
```

> The project uses **Node.js 22**, **TypeScript**, **ESLint** and **tsx** for development.

## 🛠️ Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm run dev:method-exploration` | Runs the `method-exploration` pipeline |
| `pnpm run dev:method-context-exploration` | Runs the `method-context-exploration` pipeline |
| `pnpm run dev:method-reconstruction-experiment` | Runs the `method-reconstruction-experiment` pipeline |
| `pnpm run dev:prototype` | Runs the `prototype` pipeline |

### Experiment Repositories

| Command | Description |
|---------|-------------|
| `pnpm run experiment-repo:add <repo-url>` | Adds a new external repository as a git submodule inside `experiment-repos/`. The folder name is automatically derived from the repository name. |
| `pnpm run experiment-repo:fetch-all` | Initializes and fetches all existing submodules recursively. |
| `pnpm run experiment-repo:setup-all` | Setup dependencies for all existing submodules. |
| `pnpm run experiment-repo:refresh-all` | Updates all submodules to the latest commit from their remote repositories. |

### Python Scripts

| Command | Description |
|---------|-------------|
| `pnpm run python-scripts:dependencies:setup-all` | Installs dependencies for all Python scripts. |

### Analysis

| Command | Description |
|---------|-------------|
| `pnpm run research:notebook` | Opens Jupyter Notebook for the research analysis. |

## 📚 References

```
```
