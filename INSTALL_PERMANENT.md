# Permanent Installation Guide for Firefox

## Option 1: Firefox Developer Edition (Easiest for Personal Use)

### Steps:
1. **Download Firefox Developer Edition**
   - Get it from: https://www.mozilla.org/firefox/developer/
   - Install and run it

2. **Configure Firefox Developer Edition**
   - Type `about:config` in the address bar
   - Search for `xpinstall.signatures.required`
   - Set it to `false` (double-click to toggle)

3. **Package the Extension**
   ```bash
   # From the extension directory, create a ZIP file
   zip -r ../tab-snoozer.xpi manifest.json sw.js popup.js popup.html icon.png
   ```

4. **Install the Extension**
   - Type `about:addons` in Firefox Developer Edition
   - Click the gear icon → "Install Add-on From File..."
   - Select the `tab-snoozer.xpi` file
   - The extension is now permanently installed!

## Option 2: Get Mozilla to Sign It (Most Official)

### For Personal Use (Self-Distribution):
1. **Create a Mozilla Developer Account**
   - Go to: https://addons.mozilla.org/developers/
   - Sign up for a free account

2. **Package the Extension**
   ```bash
   # Install web-ext if you don't have it
   npm install -g web-ext

   # Build the extension
   web-ext build
   ```

3. **Submit for Signing**
   - Go to Developer Hub → Submit a New Add-on
   - Choose "On your own" (self-distribution)
   - Upload the ZIP file from `web-ext build`
   - Wait for automatic validation (~2 minutes)
   - Download the signed .xpi file

4. **Install the Signed Extension**
   - Open the signed .xpi file with regular Firefox
   - It will install permanently in any Firefox version

### For Public Distribution:
- Same process but choose "On this site" instead
- Goes through review process (1-2 days typically)
- Available to all Firefox users once approved

## Option 3: Development Workflow with web-ext

For active development while using the extension:

1. **Install web-ext**
   ```bash
   npm install -g web-ext
   ```

2. **Run Firefox with Extension**
   ```bash
   # This launches Firefox with the extension loaded
   web-ext run

   # Or use Firefox Developer Edition
   web-ext run --firefox=firefoxdeveloperedition

   # Keep profile between sessions
   web-ext run --keep-profile-changes --firefox-profile=snooze-tabs-profile
   ```

3. **Auto-reload on Changes**
   ```bash
   # Watches for file changes and reloads automatically
   web-ext run --watch-file manifest.json --watch-file "*.js" --watch-file "*.html"
   ```

## Option 4: Firefox ESR (Extended Support Release)

Similar to Developer Edition:
1. Download Firefox ESR from Mozilla
2. Set `xpinstall.signatures.required` to `false` in about:config
3. Install the .xpi file

## Recommendation

**For personal daily use**: Use **Option 1** (Firefox Developer Edition) or **Option 2** (get Mozilla to sign it for self-distribution)

**For development**: Use **Option 3** (web-ext workflow)

**For sharing with others**: Use **Option 2** (public distribution through AMO)

## Important Notes

- **Regular Firefox does NOT support unsigned extensions** - no workarounds exist
- Developer Edition is a stable, full-featured browser suitable for daily use
- Signed extensions work in all Firefox versions
- The extension will sync across devices if you use Firefox Sync

## Quick Start (Recommended Path)

For immediate permanent use:
```bash
# 1. Create the package
zip -r tab-snoozer.xpi manifest.json sw.js popup.js popup.html icon.png

# 2. Install Firefox Developer Edition
# Download from: https://www.mozilla.org/firefox/developer/

# 3. In Developer Edition, go to about:config
# Set xpinstall.signatures.required = false

# 4. Go to about:addons → Install Add-on From File
# Select tab-snoozer.xpi

# Done! Extension is permanently installed.
```