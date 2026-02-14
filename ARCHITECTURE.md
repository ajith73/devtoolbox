# DevBox Architecture & Development Guide

## 🚀 Project Philosophy
DevBox is a ultra-premium, client-side toolkit for developers. 
- **100% Client-Side**: No data is sent to servers.
- **Micro-UX**: Every interaction (copy, reset, download) is polished with animations and feedback.
- **Glassmorphism Design**: Unified UI language using Tailwind CSS v4.

## 📂 Folder Structure
- `src/`
  - `components/`
    - `layout/`: Main application shells (`RootLayout`, `Sidebar`).
    - `tools/`: Individual tool implementations (e.g., `JsonTool`, `JwtTool`).
    - `ui/`: (Future) Base atomic components.
  - `lib/`: Shared logic.
    - `config.ts`: Central registry for tools (names, icons, paths).
    - `utils.ts`: Tailwind merging (`cn`) and clipboard handlers.
  - `assets/`: Images and global styles.

## 🛠️ Adding a New Tool
1. **Define in Config**: Add the tool's metadata to `src/lib/config.ts`.
2. **Create Component**: Create `src/components/tools/NewTool.tsx`. Use `ToolLayout` for consistency.
3. **Register Route**: Add the route in `src/App.tsx`.
4. **Export**: Ensure it's imported correctly.

## 🎨 Design Tokens
The app uses a custom design system defined in `src/index.css` via CSS variables:
- `--brand`: The primary signature blue (#3b82f6).
- `--surface-900`: Deep dark background (#020617).
- `.glass`: Reusable utility for translucent panels.

## 📦 Core Dependencies
- **Styling**: Tailwind CSS v4 + Lucide React.
- **Animations**: Framer Motion + Canvas Confetti.
- **Processing Engine**: 
  - `jwt-decode` (JWT)
  - `date-fns` (Time)
  - `sql-formatter` (SQL)
  - `papaparse` (CSV)
  - `cron-parser` & `cronstrue` (Cron)
  - `jsdiff` (Diff)
  - `react-colorful` (Color)

## ⚡ Performance Optimization
- All heavy processing libraries are lightweight or browser-native.
- Static assets are optimized via Vite build.
- `ToolLayout` ensures minimal re-renders for tool transitions.

---
© 2026 DevBox Dev Team. Maintain with excellence.
