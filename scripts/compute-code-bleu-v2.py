#!/usr/bin/env python3
import argparse
import base64
import json
import sys
import os
from concurrent.futures import ProcessPoolExecutor, as_completed

# Tenta carregar CodeBLEU
try:
    from codebleu import calc_codebleu
except ImportError:
    print("Installing CodeBLEU...")
    os.system(f"{sys.executable} -m pip install codebleu")
    from codebleu import calc_codebleu


def decode_base64_if_needed(value):
    """Detecta base64 automaticamente e decodifica; caso contrário, retorna a string original."""
    try:
        return base64.b64decode(value).decode("utf-8")
    except Exception:
        return value


def compute_single_pair(reference, hyp, lang):
    """Calcula CodeBLEU para um par ref/hyp."""
    return calc_codebleu([reference], [hyp], lang)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs-base64",
        help="JSON array em Base64 de pares [{\"ref\":\"...\", \"hyp\":\"...\"}, ...]"
    )
    parser.add_argument("--lang", required=True, help="Linguagem")
    parser.add_argument("--workers", type=int, default=4, help="Número de processos paralelos")
    args = parser.parse_args()

    if not args.pairs_base64:
        print("É necessário fornecer --pairs-base64")
        sys.exit(1)

    try:
        decoded_json = base64.b64decode(args.pairs_base64).decode("utf-8")
        pairs = json.loads(decoded_json)
    except Exception as e:
        print("Erro ao decodificar ou parsear o JSON Base64:", e)
        sys.exit(1)

    results = []

    # Paralelismo
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        future_to_pair = {
            executor.submit(
                compute_single_pair,
                decode_base64_if_needed(pair["ref"]),
                decode_base64_if_needed(pair["hyp"]),
                args.lang
            ): pair
            for pair in pairs
        }

        for future in as_completed(future_to_pair):
            pair = future_to_pair[future]
            try:
                res = future.result()
                results.append({"success": res})
            except Exception as e:
                results.append({"error": str(e)})

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
