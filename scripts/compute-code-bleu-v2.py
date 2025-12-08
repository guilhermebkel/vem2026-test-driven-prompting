#!/usr/bin/env python3
import argparse
import base64
import json
import sys
import os
from concurrent.futures import ProcessPoolExecutor, as_completed

# Try loading codebleu
try:
    from codebleu import calc_codebleu
except ImportError:
    print("Installing CodeBLEU...")
    os.system(f"{sys.executable} -m pip install codebleu")
    from codebleu import calc_codebleu


def decode_base64_if_needed(value):
    """Detecta base64 automaticamente."""
    try:
        return base64.b64decode(value).decode("utf-8")
    except Exception:
        return value  # não é base64, usar como string normal


def compute_single_hypothesis(reference, hyp, lang):
    """Função auxiliar para paralelismo."""
    return calc_codebleu([reference], [hyp], lang)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refs", nargs="+", help="Referências inline ou base64")
    parser.add_argument("--refs-base64", help="Uma referência única em base64")
    parser.add_argument("--hyps", nargs="+", help="Lista de hipóteses inline ou base64")
    parser.add_argument("--hyps-base64", nargs="+", help="Lista de hipóteses em base64")
    parser.add_argument("--lang", required=True, help="Linguagem")
    parser.add_argument("--workers", type=int, default=4, help="Número de processos paralelos")
    args = parser.parse_args()

    # referências
    if args.refs_base64:
        references = [base64.b64decode(args.refs_base64).decode("utf8")]
    else:
        references = [decode_base64_if_needed(r) for r in args.refs] if args.refs else []

    reference = references[0]  # CodeBLEU só aceita uma referência principal para cada hipótese

    # hipóteses
    if args.hyps_base64:
        hypotheses = [base64.b64decode(h).decode("utf8") for h in args.hyps_base64]
    else:
        hypotheses = [decode_base64_if_needed(h) for h in args.hyps] if args.hyps else []

    results = []

    # Paralelismo
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        future_to_hyp = {executor.submit(compute_single_hypothesis, reference, hyp, args.lang): hyp for hyp in hypotheses}
        for future in as_completed(future_to_hyp):
            hyp = future_to_hyp[future]
            try:
                res = future.result()
                results.append(res)
            except Exception as e:
                results.append(res)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
