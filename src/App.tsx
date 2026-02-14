import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { Dashboard } from './components/Dashboard'
import { JsonTool } from './components/tools/JsonTool'
import { ApiTool } from './components/tools/ApiTool'
import { ImageTool } from './components/tools/ImageTool'
import { Base64Tool } from './components/tools/Base64Tool'
import { SqlTool } from './components/tools/SqlTool'
import { TokenTool } from './components/tools/TokenTool'
import { JwtTool } from './components/tools/JwtTool'
import { TimestampTool } from './components/tools/TimestampTool'
import { RegexTool } from './components/tools/RegexTool'
import { HtmlTool } from './components/tools/HtmlTool'
import { CsvTool } from './components/tools/CsvTool'
import { PasswordTool } from './components/tools/PasswordTool'
import { UrlTool } from './components/tools/UrlTool'
import { ColorTool } from './components/tools/ColorTool'
import { DiffTool } from './components/tools/DiffTool'
import { CronTool } from './components/tools/CronTool'
import { QrTool } from './components/tools/QrTool'
import { GradientTool } from './components/tools/GradientTool'
import { BezierTool } from './components/tools/BezierTool'
import { TextTool } from './components/tools/TextTool'
import { AgeCalculatorTool } from './components/tools/AgeCalculatorTool'
import { MarkdownTool } from './components/tools/MarkdownTool'
import { InfoPage } from './components/InfoPage'

function App() {
  return (
    <Router>
      <RootLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/json" element={<JsonTool />} />
          <Route path="/api" element={<ApiTool />} />
          <Route path="/image" element={<ImageTool />} />
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/sql" element={<SqlTool />} />
          <Route path="/tokens" element={<TokenTool />} />
          <Route path="/jwt" element={<JwtTool />} />
          <Route path="/timestamp" element={<TimestampTool />} />
          <Route path="/regex" element={<RegexTool />} />
          <Route path="/html" element={<HtmlTool />} />
          <Route path="/csv" element={<CsvTool />} />
          <Route path="/password" element={<PasswordTool />} />
          <Route path="/url" element={<UrlTool />} />
          <Route path="/color" element={<ColorTool />} />
          <Route path="/diff" element={<DiffTool />} />
          <Route path="/cron" element={<CronTool />} />
          <Route path="/qr" element={<QrTool />} />
          <Route path="/gradient" element={<GradientTool />} />
          <Route path="/bezier" element={<BezierTool />} />
          <Route path="/text" element={<TextTool />} />
          <Route path="/age" element={<AgeCalculatorTool />} />
          <Route path="/markdown" element={<MarkdownTool />} />

          <Route path="/privacy" element={
            <InfoPage
              title="Privacy Policy"
              type="policy"
              content={[
                "Data Sovereignty\nAt DevBox, we believe your data belongs to you. All processing, formatting, and conversion happen locally in your browser. We never transmit your inputs to our servers.",
                "Zero Tracking\nWe do not use tracking cookies or third-party analytics that profile your behavior. Your engineering workflow remains private.",
                "Storage\nCertain preferences like 'Dark Mode' or 'Recent Tools' may be stored in your browser's LocalStorage. This data never leaves your device."
              ]}
            />
          } />

          <Route path="/terms" element={
            <InfoPage
              title="Terms of Service"
              type="terms"
              content={[
                "License\nDevBox is provided as-is under the MIT License. You are free to use it for personal or commercial projects.",
                "Usage Restrictions\nYou may not use our tools to process data that violates local or international laws.",
                "No Warranty\nWhile we strive for 100% accuracy, we are not responsible for errors in tool output or data loss."
              ]}
            />
          } />

          <Route path="/cookies" element={
            <InfoPage
              title="Cookie Policy"
              type="policy"
              content={[
                "Essential Cookies Only\nDevBox only uses essential local storage to remember your application state (e.g., Theme preference, Recent tools list).",
                "No Third-Party Cookies\nWe do not allow third-party trackers or advertising cookies to be placed on your machine.",
                "Opting Out\nYou can clear your browser's local storage at any time to remove all DevBox-related data."
              ]}
            />
          } />

          <Route path="/changelog" element={
            <InfoPage
              title="Changelog"
              type="changelog"
              content={[
                "v1.5.0 - The Mega Update\nAdded 10 new tools: JWT, Regex, Cron, Color Converter, HTML Preview, and more. Improved global search and project architecture.",
                "v1.0.0 - Initial Launch\nLaunched with core 6 tools: JSON, API Tester, Image Master, Base64, SQL, and Token Gen."
              ]}
            />
          } />

          <Route path="/docs" element={
            <InfoPage
              title="Internal Documentation"
              type="terms"
              content={[
                "Getting Started\nWelcome to the DevBox engineering guide. This project is built with React 19, Vite 7, and Tailwind CSS v4.",
                "System Architecture\nThe app is strictly client-side. See ARCHITECTURE.md in the root directory for more technical details.",
                "Contributing\nFeel free to fork the repository and add new tools by following the ToolLayout pattern."
              ]}
            />
          } />

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </RootLayout>
    </Router>
  )
}

export default App
