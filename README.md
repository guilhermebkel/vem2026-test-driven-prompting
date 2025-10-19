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

5. **Run the development environment**:

```bash
pnpm dev
```

> The project uses **Node.js 20**, **TypeScript**, **ESLint** and **tsx** for development.

## 🧪 Experiment Repositories Commands

All commands related to managing the experiment repositories are grouped under the `experiment-repo:` prefix.

| Command | Description |
|---------|-------------|
| `pnpm run experiment-repo:add <repo-url>` | Adds a new external repository as a git submodule inside `experiment-repos/`. The folder name is automatically derived from the repository name. |
| `pnpm run experiment-repo:fetch-all` | Initializes and fetches all existing submodules recursively. |
| `pnpm run experiment-repo:setup-all` | Setup dependencies for all existing submodules. |
| `pnpm run experiment-repo:refresh` | Updates all submodules to the latest commit from their remote repositories. |

## 📚 References

```
```
