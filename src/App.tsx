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
import { XmlYamlTool } from './components/tools/XmlYamlTool'
import { FlexTool } from './components/tools/FlexTool'
import { GridTool } from './components/tools/GridTool'
import { GithubReadmeTool } from './components/tools/GithubReadmeTool'
import { PdfTool } from './components/tools/PdfTool'
import { HtmlEntityTool } from './components/tools/HtmlEntityTool'
import { UnicodeEscapeTool } from './components/tools/UnicodeEscapeTool'
import { HexTool } from './components/tools/HexTool'
import { JsonStringEscapeTool } from './components/tools/JsonStringEscapeTool'
import { AsciiCodepointTool } from './components/tools/AsciiCodepointTool'
import { TextStatisticsTool } from './components/tools/TextStatisticsTool'
import { BaseConverterTool } from './components/tools/BaseConverterTool'
import { UrlParserTool } from './components/tools/UrlParserTool'
import { HttpStatusCodesTool } from './components/tools/HttpStatusCodesTool'
import { UserAgentParserTool } from './components/tools/UserAgentParserTool'
import { Iso8601Tool } from './components/tools/Iso8601Tool'
import { DurationConverterTool } from './components/tools/DurationConverterTool'
import { LoremIpsumTool } from './components/tools/LoremIpsumTool'
import { PasswordCheckerTool } from './components/tools/PasswordCheckerTool'
import { MorseTool } from './components/tools/MorseTool'
import { JsonXmlTool } from './components/tools/JsonXmlTool'
import { ImageBase64Tool } from './components/tools/ImageBase64Tool'
import { ImageInfoTool } from './components/tools/ImageInfoTool'
import { UnitConverterTool } from './components/tools/UnitConverterTool'
import { TimezoneConverterTool } from './components/tools/TimezoneConverterTool'
import { WorldClockTool } from './components/tools/WorldClockTool'
import { IpLookupTool } from './components/tools/IpLookupTool'
import { DnsLookupTool } from './components/tools/DnsLookupTool'
import { WhoisRdapTool } from './components/tools/WhoisRdapTool'
import { MacLookupTool } from './components/tools/MacLookupTool'
import { HashTool } from './components/tools/HashTool'
import { HmacTool } from './components/tools/HmacTool'
import { AesTool } from './components/tools/AesTool'
import { FileHashTool } from './components/tools/FileHashTool'
import { SubnetCalculatorTool } from './components/tools/SubnetCalculatorTool'
import { ImageFormatConverterTool } from './components/tools/ImageFormatConverterTool'
import { SlugTool } from './components/tools/SlugTool'
import { DateDifferenceTool } from './components/tools/DateDifferenceTool'
import { IpValidatorTool } from './components/tools/IpValidatorTool'
import { JsonYamlTool } from './components/tools/JsonYamlTool'
import { CsvJsonTool } from './components/tools/CsvJsonTool'
import { CurrencyConverterTool } from './components/tools/CurrencyConverterTool'
import { DictionaryTool } from './components/tools/DictionaryTool'
import { CountryInfoTool } from './components/tools/CountryInfoTool'
import { RandomDataGeneratorTool } from './components/tools/RandomDataGeneratorTool'
import { WeatherTool } from './components/tools/WeatherTool'
import { GithubStatsTool } from './components/tools/GithubStatsTool'
import { TranslatorTool } from './components/tools/TranslatorTool'
import { PlaceholderImageTool } from './components/tools/PlaceholderImageTool'
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
          <Route path="/xml-yaml" element={<XmlYamlTool />} />
          <Route path="/html-entity" element={<HtmlEntityTool />} />
          <Route path="/unicode" element={<UnicodeEscapeTool />} />
          <Route path="/hex" element={<HexTool />} />
          <Route path="/json-string" element={<JsonStringEscapeTool />} />
          <Route path="/ascii" element={<AsciiCodepointTool />} />
          <Route path="/text-stats" element={<TextStatisticsTool />} />
          <Route path="/base-converter" element={<BaseConverterTool />} />
          <Route path="/url-parser" element={<UrlParserTool />} />
          <Route path="/http-status" element={<HttpStatusCodesTool />} />
          <Route path="/ua" element={<UserAgentParserTool />} />
          <Route path="/iso8601" element={<Iso8601Tool />} />
          <Route path="/duration" element={<DurationConverterTool />} />
          <Route path="/lorem" element={<LoremIpsumTool />} />
          <Route path="/password-checker" element={<PasswordCheckerTool />} />
          <Route path="/morse" element={<MorseTool />} />
          <Route path="/json-xml" element={<JsonXmlTool />} />
          <Route path="/image-base64" element={<ImageBase64Tool />} />
          <Route path="/image-info" element={<ImageInfoTool />} />
          <Route path="/unit" element={<UnitConverterTool />} />
          <Route path="/timezone" element={<TimezoneConverterTool />} />
          <Route path="/world-clock" element={<WorldClockTool />} />
          <Route path="/ip" element={<IpLookupTool />} />
          <Route path="/dns" element={<DnsLookupTool />} />
          <Route path="/whois" element={<WhoisRdapTool />} />
          <Route path="/mac" element={<MacLookupTool />} />
          <Route path="/hash" element={<HashTool />} />
          <Route path="/hmac" element={<HmacTool />} />
          <Route path="/aes" element={<AesTool />} />
          <Route path="/file-hash" element={<FileHashTool />} />
          <Route path="/subnet" element={<SubnetCalculatorTool />} />
          <Route path="/image-convert" element={<ImageFormatConverterTool />} />
          <Route path="/slug" element={<SlugTool />} />
          <Route path="/date-diff" element={<DateDifferenceTool />} />
          <Route path="/ip-validator" element={<IpValidatorTool />} />
          <Route path="/json-yaml" element={<JsonYamlTool />} />
          <Route path="/csv-json" element={<CsvJsonTool />} />
          <Route path="/flex" element={<FlexTool />} />
          <Route path="/grid" element={<GridTool />} />
          <Route path="/github-readme" element={<GithubReadmeTool />} />
          <Route path="/pdf" element={<PdfTool />} />
          <Route path="/currency" element={<CurrencyConverterTool />} />
          <Route path="/dictionary" element={<DictionaryTool />} />
          <Route path="/country-info" element={<CountryInfoTool />} />
          <Route path="/random-data" element={<RandomDataGeneratorTool />} />
          <Route path="/weather" element={<WeatherTool />} />
          <Route path="/github-stats" element={<GithubStatsTool />} />
          <Route path="/translator" element={<TranslatorTool />} />
          <Route path="/placeholder-image" element={<PlaceholderImageTool />} />

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
