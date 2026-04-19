# Analysis

## Overview

The experiment runs an LLM to reconstruct TypeScript method bodies from a signature plus variable context (relevant test cases). Results are logged to CSV files. The Jupyter notebook in `research/analysis.ipynb` loads these CSVs and produces visualizations.

Repositories tested: **date-fns**, **directus**
Models: **gemini-2.5-flash**, **gemini-3.0-flash**

## Data Location

| Path | Description |
|---|---|
| `logs/method-reconstruction-experiment/{repo}/structured/result.csv` | Structured CSV — one row per experiment run |
| `logs/method-reconstruction-experiment/{repo}/raw/{experimentTitle}/` | Raw logs: system prompt, user prompt, generated code, test suite output, reasoning |

## CSV Format

Each row represents one experiment execution. Columns:

| Column | Type | Description |
|---|---|---|
| `repositoryName` | string | Repository name (`date-fns` or `directus`) |
| `methodName` | string | Name of the method being reconstructed |
| `methodResolvedFilePath` | string | Absolute path to the method's source file |
| `experimentTitle` | string | Encodes model, context type, and permutation index — see format below |
| `experimentContextSlugs` | string | Pipe-separated context definition slugs (e.g. `relevant-test-case`) |
| `modelSystemPrompt` | JSON string | System prompt sent to the LLM |
| `modelUserPrompt` | JSON string | User prompt sent to the LLM |
| `modelReasoningTextResult` | JSON string | Extended reasoning output (may be null) |
| `modelName` | string | LLM model name |
| `modelReasoningBudget` | number | Token budget for reasoning (0 = disabled) |
| `modelTemperature` | number | Sampling temperature |
| `modelResult` | JSON string | Generated method body |
| `isTestSuiteSuccessful` | boolean string | `"true"` if all tests passed after injecting the reconstruction |
| `isModelResultCompilable` | boolean string | `"true"` if the generated code is syntactically valid |
| `relevantTestCaseCount` | number | Number of relevant test cases for this method (identified by Mutation Testing) |
| `testSuiteTotalTestCaseCount` | number | Total tests in the suite |
| `testSuitePassedTestCaseCount` | number | Tests that passed |
| `testSuiteFailedTestCaseCount` | number | Tests that failed |

### experimentTitle format

```
{methodName} > {model}|temperature-{t}|{contextType} [{permIdx}/{totalPerms}]
```

Example: `areIntervalsOverlapping > gemini-2.5-flash|temperature-0|all-relevant-test-case [1/1]`

## Experiment Types (contextType)

Extracted from `experimentTitle` via the segment after `temperature-{n}|`:

| contextType | Description |
|---|---|
| `all-relevant-test-case` | All relevant tests provided, original order |
| `permuted-relevant-test-case` | All relevant tests provided, permuted order (index tracked in `permIdx`) |
| `no-relevant-test-case` | No tests as context — baseline condition |

## Notebook

`research/analysis.ipynb` — loads both CSVs, parses `experimentTitle` to derive `model`, `contextType`, `permIdx`, computes `passRate`, and produces five analyses:

1. Success rate by context type and model (bar chart)
2. Success by method, context, and model (heatmap)
3. Permutation sensitivity — variance in pass rate across orderings (activates when `permuted-relevant-test-case` data is available)
4. Correlation between relevant test count and success rate (scatter)
5. Compilability vs. success rate by context type (line chart)

The notebook also includes a **PandasAI exploratory cell** — a free-form cell backed by Gemini where you can ask questions in natural language about the data. It can return text answers or generate charts.

### Dependencies

Python dependencies are managed in `research/pyproject.toml`. To add a new package, add it to the `dependencies` list there — `uv` will pick it up automatically on the next `uv run`.

```bash
cd research
uv run jupyter notebook
```
