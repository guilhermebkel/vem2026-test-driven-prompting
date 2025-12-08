#!/usr/bin/env python3
import argparse
import base64
import json
import sys
import os

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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refs", nargs="+", help="Referências inline ou base64")
    parser.add_argument("--refs-base64", help="Uma referência única em base64")
    parser.add_argument("--hyp", help="Hypótese inline ou base64")
    parser.add_argument("--hyp-base64", help="Hypótese em base64")
    parser.add_argument("--lang", required=True, help="Linguagem")

    args = parser.parse_args()

    # referências
    if args.refs_base64:
        references = [base64.b64decode(args.refs_base64).decode("utf8")]
    else:
        # refs normais (mas tentamos decodificar base64 automaticamente)
        references = [decode_base64_if_needed(r) for r in args.refs] if args.refs else []

    # hipótese
    if args.hyp_base64:
        hypothesis = base64.b64decode(args.hyp_base64).decode("utf8")
    else:
        hypothesis = decode_base64_if_needed(args.hyp)

    result = calc_codebleu(
        references,
        [hypothesis],
        args.lang
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
