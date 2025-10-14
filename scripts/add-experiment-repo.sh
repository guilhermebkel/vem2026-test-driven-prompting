#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./scripts/add-repo.sh <repo-url>"
  exit 1
fi

REPO_URL="$1"

REPO_NAME=$(basename "$REPO_URL" .git)

TARGET_DIR="experiment-repos/$REPO_NAME"

echo "Adding submodule $REPO_URL -> $TARGET_DIR"

mkdir -p experiment-repos

git submodule add "$REPO_URL" "$TARGET_DIR"

echo "✅ Submodule added successfully!"
