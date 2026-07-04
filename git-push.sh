#!/bin/bash
# Run this script from the host to push the My Blog repo to GitHub
cd "$(dirname "$0")"
echo "Pushing to GitHub..."
git push origin main
echo "Done. Exit code: $?"
