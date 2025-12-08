#!/usr/bin/env python3
import argparse
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


def compute_single_pair(reference, hyp, lang):
    """Calcula CodeBLEU para um par ref/hyp."""
    return calc_codebleu([reference], [hyp], lang)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs-file",
        required=True,
        help="Caminho para arquivo JSON contendo pares [{\"ref\":\"...\", \"hyp\":\"...\", \"slug\":\"...\"}, ...]"
    )
    parser.add_argument("--lang", required=True, help="Linguagem")
    parser.add_argument("--workers", type=int, default=4, help="Número de processos paralelos")
    args = parser.parse_args()

    # Carrega os pares do arquivo
    try:
        with open(args.pairs_file, "r", encoding="utf-8") as f:
            pairs = json.load(f)
    except Exception as e:
        print("Erro ao ler ou parsear o arquivo JSON:", e)
        sys.exit(1)

    results = [None] * len(pairs)

    # Paralelismo
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        future_to_index = {
            executor.submit(
                compute_single_pair,
                pair["ref"],
                pair["hyp"],
                args.lang
            ): i
            for i, pair in enumerate(pairs)
        }

        for future in as_completed(future_to_index):
            i = future_to_index[future]
            pair = pairs[i]
            try:
                res = future.result()
                results[i] = {"slug": pair.get("slug"), "success": res}
            except Exception as e:
                results[i] = {"slug": pair.get("slug"), "error": str(e)}

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
