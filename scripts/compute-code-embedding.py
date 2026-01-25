#!/usr/bin/env python3
import argparse
import json
import sys
import subprocess
import time

def pip_install(pkg, retries=3):
    for i in range(retries):
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
            return
        except subprocess.CalledProcessError:
            if i == retries - 1:
                raise
            time.sleep(5)

def ensure_dependencies():
    try:
        import torch
    except ImportError:
        pip_install("torch")
        import torch

    try:
        from transformers import RobertaTokenizer, RobertaModel
    except ImportError:
        pip_install("transformers")
        from transformers import RobertaTokenizer, RobertaModel

    try:
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:
        pip_install("scikit-learn")
        from sklearn.metrics.pairwise import cosine_similarity

    return torch, RobertaTokenizer, RobertaModel, cosine_similarity


torch, RobertaTokenizer, RobertaModel, cosine_similarity = ensure_dependencies()

MODEL_NAME = "microsoft/graphcodebert-base"

tokenizer = RobertaTokenizer.from_pretrained(MODEL_NAME)
model = RobertaModel.from_pretrained(MODEL_NAME)
model.eval()

def embed(code: str):
    inputs = tokenizer(
        code,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )

    with torch.no_grad():
        outputs = model(**inputs)

    # CLS token embedding
    return outputs.last_hidden_state[:, 0, :].numpy()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pairs-file",
        required=True,
        help="Path for the JSON file containing [{\"ref\":\"...\", \"hyp\":\"...\"}, ...]"
    )
    args = parser.parse_args()

    with open(args.pairs_file, "r", encoding="utf-8") as f:
        pairs = json.load(f)

    results = []

    for pair in pairs:
        ref_emb = embed(pair["ref"])
        hyp_emb = embed(pair["hyp"])

        score = cosine_similarity(ref_emb, hyp_emb)[0][0]

        results.append({
            "embedding_similarity": float(score)
        })

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
