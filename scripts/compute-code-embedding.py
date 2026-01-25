#!/usr/bin/env python3
import argparse
import json
import sys
import hashlib
import pickle
from pathlib import Path
import torch
from transformers import RobertaTokenizer, RobertaModel
from sklearn.metrics.pairwise import cosine_similarity
from filelock import FileLock

# =============================
# Config
# =============================

MODEL_NAME = "microsoft/graphcodebert-base"
CACHE_DIR = Path("../temp/embedding_cache")
LOCK_DIR = CACHE_DIR / "locks"
EMBED_DIR = CACHE_DIR / "embeddings"

CACHE_DIR.mkdir(exist_ok=True)
LOCK_DIR.mkdir(exist_ok=True)
EMBED_DIR.mkdir(exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =============================
# Model loading (once)
# =============================

tokenizer = RobertaTokenizer.from_pretrained(MODEL_NAME)
model = RobertaModel.from_pretrained(MODEL_NAME)
model.to(DEVICE)
model.eval()

# =============================
# Utils
# =============================

def sha256(text: str) -> str:
	return hashlib.sha256(text.encode("utf-8")).hexdigest()

def embedding_cache_path(code_hash: str) -> Path:
	return EMBED_DIR / f"{code_hash}.pkl"

def lock_path(code_hash: str) -> Path:
	return LOCK_DIR / f"{code_hash}.lock"

def embed(code: str):
	inputs = tokenizer(
		code,
		return_tensors="pt",
		truncation=True,
		max_length=512
	)

	inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

	with torch.no_grad():
		outputs = model(**inputs)

	# CLS token
	return outputs.last_hidden_state[:, 0, :].cpu().numpy()

def get_or_compute_embedding(code: str):
	code_hash = sha256(code)
	lock_file = lock_path(code_hash)
	lock = FileLock(lock_file, timeout=60)

	with lock:
		cache_file = embedding_cache_path(code_hash)

		if cache_file.exists():
			with open(cache_file, "rb") as f:
				return pickle.load(f)

		emb = embed(code)

		with open(cache_file, "wb") as f:
			pickle.dump(emb, f)

		return emb

# =============================
# Main
# =============================

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument(
		"--pairs-file",
		required=True,
		help="Path for the JSON file containing [{\"ref\":\"...\", \"hyp\":\"...\"}, ...]"
	)
	args = parser.parse_args()

	try:
		with open(args.pairs_file, "r", encoding="utf-8") as f:
			pairs = json.load(f)
	except Exception as e:
		print("Failed to parse JSON:", e)
		sys.exit(1)

	results = [None] * len(pairs)

	for i, pair in enumerate(pairs):
		try:
			ref_emb = get_or_compute_embedding(pair["ref"])
			hyp_emb = get_or_compute_embedding(pair["hyp"])

			score = cosine_similarity(ref_emb, hyp_emb)[0][0]

			results[i] = {"success": {"embedding_similarity": float(score)}}
		except Exception as e:
			results[i] = {"error": str(e)}

	print(json.dumps(results, indent=2))

if __name__ == "__main__":
	main()
