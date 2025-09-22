#!/bin/bash

# Package the Tab Snoozer extension for Firefox

echo "Packaging Tab Snoozer extension..."

# Remove old package if it exists
rm -f tab-snoozer.xpi

# Create the XPI package (ZIP file with .xpi extension)
zip -r tab-snoozer.xpi \
  manifest.json \
  sw.js \
  popup.js \
  popup.html \
  icon.png \
  -x "*.DS_Store" \
  -x "*.md" \
  -x "*.sh" \
  -x ".git/*"

if [ -f tab-snoozer.xpi ]; then
  echo "✓ Package created successfully: tab-snoozer.xpi"
  echo ""
  echo "To install permanently:"
  echo "1. Use Firefox Developer Edition or ESR"
  echo "2. Set xpinstall.signatures.required to false in about:config"
  echo "3. Go to about:addons → Install Add-on From File"
  echo "4. Select tab-snoozer.xpi"
else
  echo "✗ Failed to create package"
  exit 1
fi