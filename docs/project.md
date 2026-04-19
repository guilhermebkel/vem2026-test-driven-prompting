# Project Overview

**Title:** Análise da importância do contexto em tarefas de desenvolvimento com LLMs

## Objective

Evaluate how the **type and quantity of context** (specifically relevant test cases) influences an LLM's ability to correctly reconstruct method implementations. The experiment uses the variation in quantity and relevance of test cases as a case study, seeking to identify patterns that guide the use of tests as specification in TDD-inspired scenarios.

## Research Questions

1. Does the quantity of relevant tests provided as context influence the success rate in method reconstruction?
2. Are the tests identified by Mutation Testing, when provided in full, sufficient for the model to generate a correct implementation?
3. What is the minimum number of tests needed for consistent success?

## Methodology

1. **Method selection:** keep only methods with ≥ 5 associated tests and a single test file (repositories: date-fns, directus)
2. **Relevant test identification via Mutation Testing (Stryker):** only tests that kill at least one mutant are considered relevant
3. **Experiment execution:** for each subset size 1…N, generate 10 random permutations and run reconstruction
4. **Success criterion:** the full test suite passes after injecting the reconstructed method into the original repository
5. **Impact analysis:** compare results across context configurations to identify minimum viable context

## Key Concepts

- **LLMs** (Gemini 2.5-flash, Gemini 3.0-flash) — models used for reconstruction
- **TDD** — the test suite acts as the correctness oracle; a reconstruction is successful only if all tests pass
- **Mutation Testing** — technique to filter which tests genuinely capture the method's behavior; a test is relevant only if it detects at least one code mutation
- **ts-morph** — static analysis library used to extract method signatures and inject reconstructed bodies into TypeScript repositories

## Expected Results

- Determine whether the quantity of relevant tests provided as context impacts reconstruction success rate
- Verify whether Mutation Testing-identified tests, when fully provided, are sufficient to guide correct reconstruction
- Produce practical recommendations for context selection (especially tests) in LLM-assisted development tasks
