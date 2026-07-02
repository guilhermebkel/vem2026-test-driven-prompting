# Replication Package: Test-Driven Prompting

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21118793.svg)](https://doi.org/10.5281/zenodo.21118793)

## An Empirical Evaluation of Methods Reconstruction based on Unit Tests

> VEM 2026 — 14th Workshop on Software Visualization, Evolution and Maintenance

This repository contains the replication package for the paper 
**"Test-Driven Prompting: An Empirical Evaluation of Methods Reconstruction 
based on Unit Tests"**, including all scripts, raw data, and analysis 
notebooks used in the study.

---

## 📦 Repository Structure

| Path | Description |
|------|-------------|
| `src/` | Pipelines for method exploration, mutation testing, and reconstruction |
| `logs/` | Raw results of all 516 experiment executions |
| `research/` | Jupyter Notebooks for statistical analysis and figure generation |
| `caches/test-mutation-relevance/` | StrykerJS mutation testing results per method |
| `experiment-repos/` | Git submodules pinned to the exact commits used in the study |

---

## 🔁 Reproducing the Study

The experiment is organized into four sequential pipelines. 
Run them in order to reproduce the results from scratch.

### Prerequisites

- Node.js 22 (via [nvm](https://github.com/nvm-sh/nvm))
- Python 3.x (for the analysis notebooks)
- A [Google AI Studio](https://aistudio.google.com/) API key 
  with access to `gemini-2.5-flash` and `gemini-3-flash-preview`

### 1. Environment Setup

Install the required Node version and dependencies:

```bash
nvm install
pnpm install
```

Copy the environment file and fill in your API key:

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY=your_api_key_here
```

### 2. Fetch and Set Up Experiment Repositories

Fetches `date-fns` and `Directus` submodules, pinned to the exact 
commits used in the study:

```bash
pnpm run experiment-repo:fetch-all
pnpm run experiment-repo:setup-all
```

### 3. Run the Pipelines

**Step 1 — Method Exploration**  
Identifies eligible methods with 100% line, statement, and branch coverage:
```bash
pnpm run dev:method-exploration
```

**Step 2 — Context Exploration (Mutation Testing)**  
Runs StrykerJS to identify which tests are relevant for each method:
```bash
pnpm run dev:method-context-exploration
```
> ⚠️ This step is computationally expensive. Pre-computed results are 
> available in `caches/test-mutation-relevance/` and will be used 
> automatically if present.

**Step 3 — Reconstruction Experiment**  
Runs the Test-Driven Prompting workflow, submitting prompts to the 
Gemini API and recording results:
```bash
pnpm run dev:method-reconstruction-experiment
```
> Results are saved to `logs/`. Pre-computed logs from the original 
> study are already included in this repository.

### 4. Reproduce the Analysis and Figures

Install Python dependencies and open the notebooks:

```bash
pnpm run python-scripts:dependencies:setup-all
pnpm run research:notebook
```

The notebooks in `research/` reproduce all figures and statistics 
reported in the paper, organized by research question (RQ1, RQ2, RQ3).

---

## 🛠️ All Available Commands

### Development
| Command | Description |
|---------|-------------|
| `pnpm run dev:method-exploration` | Runs the method exploration pipeline |
| `pnpm run dev:method-context-exploration` | Runs the mutation testing pipeline |
| `pnpm run dev:method-reconstruction-experiment` | Runs the reconstruction experiment |
| `pnpm run dev:prototype` | Runs the prototype pipeline |

### Experiment Repositories
| Command | Description |
|---------|-------------|
| `pnpm run experiment-repo:add <repo-url>` | Adds a new repository as a git submodule |
| `pnpm run experiment-repo:fetch-all` | Initializes and fetches all submodules |
| `pnpm run experiment-repo:setup-all` | Installs dependencies for all submodules |
| `pnpm run experiment-repo:refresh-all` | Updates submodules to their latest commit |

### Analysis
| Command | Description |
|---------|-------------|
| `pnpm run python-scripts:dependencies:setup-all` | Installs Python dependencies |
| `pnpm run research:notebook` | Opens Jupyter Notebook for analysis |

---

## 📄 Citation

If you use this replication package, please cite:

```bibtex
@inproceedings{lima2026tdp,
  author = {Lima, Guilherme Mota Bromonschenkel and Montandon, João Eduardo},
  title = {Test-Driven Prompting: An Empirical Evaluation of Methods Reconstruction based on Unit Tests},
  booktitle = {14th Workshop on Software Visualization, Evolution and Maintenance (VEM)},
  year = {2026},
  address = {São Paulo, SP, Brazil}
}
```

---

## 📚 References

- [date-fns](https://github.com/date-fns/date-fns)
- [Directus](https://github.com/directus/directus)
- [StrykerJS](https://stryker-mutator.io/)
- [ts-morph](https://ts-morph.com/)
- [Google Gemini API](https://ai.google.dev/)
