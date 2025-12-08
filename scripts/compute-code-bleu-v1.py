import sys
import os
import json
import argparse
import importlib.util

# --- auto install tree-sitter ---
try:
    import tree_sitter
except ImportError:
    os.system("pip install tree_sitter")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CODEBLEU_DIR = os.path.abspath(os.path.join(
    BASE_DIR,
    "..",
    "vendor",
    "CodeXGLUE",
    "Code-Code",
    "code-to-code-trans",
    "evaluator",
    "CodeBLEU"
))

sys.path.insert(0, CODEBLEU_DIR)
sys.path.insert(1, os.path.join(CODEBLEU_DIR, "parser"))
sys.path.insert(2, os.path.join(CODEBLEU_DIR, "keywords"))

# --- force correct utils ---
UTILS_PATH = os.path.join(CODEBLEU_DIR, "utils.py")
spec = importlib.util.spec_from_file_location("utils", UTILS_PATH)
utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(utils)
sys.modules["utils"] = utils

from calc_code_bleu import calc_code_bleu


# ----------------------------------------------
# One line compactor (ESSENCIAL)
# ----------------------------------------------
def flatten_code(code: str) -> str:
    return " ".join(code.split())


# ----------------------------------------------
# CLI
# ----------------------------------------------
parser = argparse.ArgumentParser()
parser.add_argument("--refs", nargs="+", required=True)
parser.add_argument("--hyp", required=True)
parser.add_argument("--lang", required=True)
args = parser.parse_args()

# read refs
refs_raw = []
for p in args.refs:
    with open(p, "r", encoding="utf8") as f:
        refs_raw.append(f.read())

# read hyp
with open(args.hyp, "r", encoding="utf8") as f:
    hyp_raw = f.read()

# compact into 1 line per example
refs_flat = [ flatten_code(r) for r in refs_raw ]
hyp_flat  = [ flatten_code(hyp_raw) ] * len(refs_raw)

# ----------------------------------------------
# Compute
# ----------------------------------------------
result = calc_code_bleu(refs_flat, hyp_flat, args.lang)

print(json.dumps(result, indent=2))
