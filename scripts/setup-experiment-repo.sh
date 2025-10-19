#!/usr/bin/env bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

REPO_NAME="$1"

if [ -z "$REPO_NAME" ]; then
  echo "Usage: $0 <repo-name>"
  exit 1
fi

REPO_PATH="./experiment-repos/$REPO_NAME"

if [ ! -d "$REPO_PATH" ]; then
  echo "Repository not found: $REPO_PATH"
  exit 1
fi

echo "🚀 Running setup for $REPO_NAME..."

case "$REPO_NAME" in
  "date-fns")
    COMMANDS=(
      "cd $REPO_PATH"
      "nvm install"
      "nvm use"
      "npm install -g pnpm"
      "pnpm install"
    )
    ;;
  "fastify")
    COMMANDS=(
      "cd $REPO_PATH"
      "nvm install 22"
      "nvm use 22"
      "npm install -g pnpm"
      "pnpm install"
    )
    ;;
  "directus")
    COMMANDS=(
      "cd $REPO_PATH"
      "nvm install 22"
      "nvm use 22"
      "npm install -g pnpm"
      "pnpm install"
    )
    ;;
  "tabnews.com.br")
    COMMANDS=(
      "cd $REPO_PATH"
      "nvm install"
      "nvm use"
      "npm install"
    )
    ;;
  *)
    echo "No setup defined for $REPO_NAME"
    exit 1
    ;;
esac

for CMD in "${COMMANDS[@]}"; do
  echo -e "\n> $CMD"
  eval "$CMD"
  if [ $? -ne 0 ]; then
    echo "❌ Command failed: $CMD"
    exit 1
  fi
done

echo -e "\n✅ Setup finished for $REPO_NAME"
