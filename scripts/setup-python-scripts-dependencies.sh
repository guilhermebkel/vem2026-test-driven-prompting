#!/usr/bin/env bash

set -e

PYTHON=${PYTHON:-python3}

echo "🚀 Updating pip..."
$PYTHON -m pip install --upgrade pip

echo "🚀 Installing dependencies..."

$PYTHON -m pip install \
    torch \
    transformers \
    scikit-learn \
    codebleu

echo "✅ Dependencies installed successfully!"
