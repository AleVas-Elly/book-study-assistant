#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building Frontend..."
npm install --prefix client
npm run build --prefix client

echo "Installing Backend..."
pip install -r server/requirements.txt

echo "Build Complete."
