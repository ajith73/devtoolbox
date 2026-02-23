# DevToolbox Tools List

This document lists all available tools in the DevToolbox application, along with their implemented features.

## Tools Overview

### API Tool
- **Status**: Available
- **Features**:
  - HTTP request sending (GET, POST, PUT, etc.)
  - Custom headers
  - Request body input
  - Response display
  - History (pending)
  - Code generation (pending)
  - Query parameters (pending)
  - Enhanced body editing (pending)
  - Response viewer modes (pending)

### Image Tool
- **Status**: Available
- **Features**:
  - Smart image compression (quality slider, target size, lossless/lossy)
  - Precision cropping (aspect ratios, zoom, rotation, grid)
  - Format conversion (JPEG, PNG, WEBP, AVIF, SVG)
  - Image resize presets (Profile, Thumbnail, etc.)
  - Background removal (AI via remove.bg API)
  - Metadata viewer/remover
  - Batch processing
  - Base64 converter (Image ↔ Base64)
  - Image URL loader
  - Download size comparison

### JSON Tool (Pro)
- **Status**: Available
- **Features**:
  - Smart Formatting (Pretty/Minify/Prettify)
  - Interactive Tree View with node selection
  - **TypeScript Interface Generator** (Auto-derive types from JSON)
  - **API Preview** (Generate Fetch, Axios, and cURL snippets)
  - Bidirectional Conversion (YAML, XML, CSV)
  - Statistical Analysis (Key counts, depth, array distribution)
  - Local persistence for session recovery

### Base64 Tool
- **Status**: Available
- **Features**:
  - Text ↔ Base64 encoding/decoding
  - Image ↔ Base64 conversion with preview
  - File ↔ Base64 for various types (PDF, ZIP, DOC, etc.)
  - Download decoded files
  - Copy buttons (Base64, decoded content, data URL)
  - Data URL generator with prefix toggle
  - Size comparison (original, encoded, percentage change)
  - Auto-detect Base64 type (text, image, file, JSON, JWT)
  - URL-safe Base64 encoding/decoding
  - JWT payload decoder with pretty-print
  - JSON pretty-printing for decoded content

### HTML Preview Tool
- **Status**: Available
- **Features**:
  - Split-screen editor with separate HTML, CSS, and JavaScript tabs
  - Live preview with auto-refresh toggle and manual run option
  - Full-screen preview mode
  - Desktop, tablet, and mobile view modes
  - Download complete HTML file combining all code
  - Load predefined templates (starter, flexbox, card, form)
  - External library loader for CDNs (Bootstrap, FontAwesome, custom URLs)
  - Persist code in localStorage across sessions
  - Copy embed code (iframe snippet)
  - Reset and clear all code

### Other Tools
- AES Tool
- Age Calculator Tool
- ASCII Codepoint Tool
- Base Converter Tool
- Bezier Tool
- Color Tool
- Country Info Tool
- Cron Tool
- CSS Formatter Tool
- CSV Tool (Advanced)
  - Professional Transcoder (NDJSON, Keyed Objects)
  - Character Case Transformation (camel, snake, kebab)
  - Auto-typing and Schema support
- Currency Converter Tool
- Date Difference Tool
- Dictionary Tool
- Diff Tool
- DNS Lookup Tool
- Duration Converter Tool
- File Hash Tool
- Flex Tool
- GitHub Readme Tool
- GitHub Stats Tool
- Gradient Tool
- Grid Tool
- Hash Tool
- Hex Tool
- HMAC Tool
- HTML Entity Tool
- HTML Formatter Tool
- HTML Tool
- HTTP Status Codes Tool
- Image Base64 Tool
- Image Format Converter Tool
- Image Info Tool
- IP Lookup Tool
- IP Validator Tool
- ISO8601 Tool
- JS Formatter Tool
- JSON String Escape Tool
- JSON XML Tool
- JSON YAML Tool
- JWT Tool (Pro)
  - Integrated Decoder & Generator
  - Signature Verification (HS256/RS256)
  - Security Auditing (None-alg, Expiry checks)
- Lorem Ipsum Tool
- MAC Lookup Tool
- Markdown Tool
- Morse Tool
- Password Checker Tool
- Password Tool (Pro)
  - CSPRNG Secure Generation
  - Entropy & Crack Time Estimation
  - Passphrase & Pattern Modes
  - Bulk Generation & Export
  - Private Breach Security Audit (HIBP)
- PDF Tool
- Placeholder Image Tool
- Punycode Tool
- QR Tool
- Random Data Generator Tool
- Regex Tool
- Slug Tool
- SQL Tool
- Subnet Calculator Tool
- Text Statistics Tool
- Text Tool
- Timestamp Tool (High Precision)
  - Sub-second precision (ms, μs, ns)
  - Real-time Temporal Sync
  - Local History Matrix
- Timezone Converter Tool
- Token Tool (v4/v7)
  - UUID v4 & v7 (Time-sortable)
  - NanoID & Secure Hex
  - Bulk Generator (CSV/JSON/TXT)
- Translator Tool
- Unicode Escape Tool
- Unit Converter Tool
- URL Tool (Pro)
  - Auto-detection Protocol
  - Segmented Encoding (Query, Path, Fragment)
  - Structural Parser with Live Editing
  - Mass URL Transformer
- User Agent Parser Tool
- Weather Tool
- WHOIS RDAP Tool
- World Clock Tool
- XML YAML Tool

## Feature Status Legend
- ✅ Available: Fully implemented
- 🚧 In Progress: Partially implemented
- ❌ Not Available: Not implemented
- ⏳ Pending: Planned for future implementation
