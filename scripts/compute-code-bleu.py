#!/usr/bin/env python3
import argparse
import json
import sys
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from codebleu import calc_codebleu

def compute_single_pair(reference, hyp, lang):
    return calc_codebleu([reference], [hyp], lang)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs-file",
        required=True,
        help="Path for the JSON file containing [{\"ref\":\"...\", \"hyp\":\"...\"}, ...]"
    )
    parser.add_argument("--lang", required=True, help="Coding Language")
    parser.add_argument("--workers", type=int, default=4, help="Parallel Processes")
    args = parser.parse_args()

    try:
        with open(args.pairs_file, "r", encoding="utf-8") as f:
            pairs = json.load(f)
    except Exception as e:
        print("Failed to parse JSON:", e)
        sys.exit(1)

    results = [None] * len(pairs)

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
            try:
                res = future.result()
                results[i] = {"success": res}
            except Exception as e:
                results[i] = {"error": str(e)}

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
