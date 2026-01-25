#!/usr/bin/env python3
import argparse
import json
import torch
from transformers import RobertaTokenizer, RobertaModel
from sklearn.metrics.pairwise import cosine_similarity

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
