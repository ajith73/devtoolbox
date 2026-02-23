# DevBox | Professional Developer Toolkit

DevBox is an ultra-premium, 100% client-side collection of **76 developer utilities** designed for extreme speed, precision, and privacy.

- **🎯 Professional Suite**: Now with 75+ premium developer tools
- **💎 Core Tool Overhaul**: Significant enhancements to JSON, CSV, JWT, Token, and Timestamp tools
- **☁️ Weather & Info**: New Weather Lookup, Country Info, GitHub Stats
- **🌍 Translator**: Translate between 15+ languages instantly
- **🖼️ Placeholders**: Generate custom placeholder images with effects
- **⚡ PWA Support**: Fast, offline-capable progressive web app

## 🚀 Key Features

- **100% Client-Side**: No data ever leaves your computer. Everything is processed locally in your browser
- **Extreme Performance**: Built with React 19, Vite 7, with intelligent code splitting for faster loads
- **Premium Aesthetics**: High-end glassmorphism design with full Dark/Light mode support
- **organized Interface**: Grouped, collapsible tool sidebar for easy navigation

## 📚 Complete Tool Suite

### Data & Formats (8 tools)
JSON Formatter (Pro), JSON String Escape, JSON ↔ XML, JSON ↔ YAML, CSV Tool (Advanced), XML & YAML Tools, Base Converter, SQL Formatter

### Encoding (5 tools)
Base64 Encoder, URL Encoder, Unicode Escape, Hex Encode, HTML Entity

### Web Dev (9 tools)
API Tester, HTML Preview, Regex Tester, JWT Tool (Pro), CSS Flexbox, CSS Grid, Bezier Curves, Gradient Generator, GitHub README Generator

### Security (7 tools)
Password Generator, Password Checker, Token Generator (v4/v7), Hash Calculator, HMAC Calculator, AES Encrypt/Decrypt, File Hash

### Network (8 tools)
IP Lookup, IP Validator, DNS Lookup, WHOIS (RDAP), MAC Lookup, HTTP Status Codes, URL Parser, Subnet Calculator

### Time & Date (8 tools)
Timestamp Tool (High Precision), ISO 8601 Parser, Cron Viewer, Timezone Converter, World Clock, Duration Converter, Age Calculator, Date Difference

### Images & Media (7 tools)
Image Master (Compress/Crop), Image Base64, Image Info, Image Format Converter, PDF Tools (Merge/Split/Convert), Color Converter, QR Generator

### Text & Utilities (15 tools)
Case Converter, Markdown Editor, Text Statistics, Lorem Ipsum, Slug Converter, ASCII/Code Point, Text Diff, Morse Code, Unit Converter, User Agent Parser, and more

## 🛠️ Tech Stack

- **Framework**: React 19.2
- **Build Tool**: Vite 7.3
- **Styling**: Tailwind CSS 4 (with CSS variables)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: Custom Persistent State (LocalStorage)
- **PDF Processing**: pdf-lib, pdfjs-dist
- **Data Processing**: PapaParse, js-yaml, diff

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Build for production (with optimized chunks)
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## ⚡ Performance Optimizations

- **Code Splitting**: Vendor (React/Router), UI (Framer/Lucide), Utils (date-fns/uuid/jszip), Code (syntax highlighters), PDF (pdf-lib/pdfjs)
- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Dead code elimination via Vite
- **Asset Optimization**: Minified CSS/JS with gzip compression
- **Fast Rendering**: React 19 concurrent features

## 🌐 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. `vercel.json` handles SPA routing

### Other Platforms
Works on any static hosting (Netlify, Cloudflare Pages, GitHub Pages, etc.)

## 🔒 Privacy & Security

- **No Tracking**: Zero analytics, cookies, or external requests
- **No Backend**: All processing happens in-browser using WebCrypto API
- **Local Storage**: Settings and recent tools saved locally
- **Open Source**: Full transparency

## 📂 Project Structure

```
devtoolbox/
├── src/
│   ├── components/
│   │   ├── layout/         # RootLayout, Sidebar
│   │   └── tools/          # 68+ tool components
│   ├── lib/
│   │   ├── config.ts       # Tool registry
│   │   └── utils.ts        # Shared utilities
│   ├── App.tsx             # Main app with routing
│   └── index.css           # Global styles + theme
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Tools are 100% client-side
- Follow existing code patterns
- Test in both light/dark modes
- Maintain performance standards

---

**Built with ❤️ for developers who value privacy, speed, and great UX**
