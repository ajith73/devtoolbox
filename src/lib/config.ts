import {
    Braces,
    Globe,
    Image as ImageIcon,
    Type,
    Database,
    Fingerprint,
    FileCode,
    Clock,
    SearchCode,
    Eye,
    FileJson,
    ShieldCheck,
    Link,
    Palette,
    FileDiff,
    CalendarClock,
    QrCode,
    Paintbrush,
    Waves,
    CaseLower,
    Baby,
    FileEdit
} from 'lucide-react'

export type Category = 'dev' | 'media' | 'data' | 'util' | 'text'

export interface Tool {
    id: string
    name: string
    description: string
    icon: any
    color: string
    path: string
    category: Category
    seoTitle?: string
    howToUse?: string
}

export const TOOLS: Tool[] = [
    {
        id: 'json',
        name: 'JSON Beautifier',
        description: 'Clean, format and validate JSON data instantly.',
        icon: Braces,
        color: 'text-blue-400',
        path: '/json',
        category: 'data',
        seoTitle: 'Free JSON Formatter & Beautifier Online',
        howToUse: 'Paste your raw JSON into the input area. The tool will automatically validate and format it with 2-space indentation. You can then copy or download the result.'
    },
    {
        id: 'api',
        name: 'API Tester',
        description: 'Test HTTP endpoints with a simple interface.',
        icon: Globe,
        color: 'text-green-400',
        path: '/api',
        category: 'dev',
        seoTitle: 'Online API Tester - Debug REST & HTTP Requests',
        howToUse: 'Enter your API endpoint URL, select the HTTP method (GET, POST, etc.), and optionally add headers or a body. Click "Send Request" to see the full response details including status, headers, and payload.'
    },
    {
        id: 'image',
        name: 'Image Master',
        description: 'Compress, crop and resize images.',
        icon: ImageIcon,
        color: 'text-purple-400',
        path: '/image',
        category: 'media',
        seoTitle: 'Online Image Compressor & Cropper - No Quality Loss',
        howToUse: 'Upload your image using the drag-and-drop zone. Use the interactive lens to crop or zoom into specific areas. Adjust the compression slider for the perfect size, and download your optimized image.'
    },
    {
        id: 'base64',
        name: 'Base64 Tool',
        description: 'Encode/Decode text and files to Base64.',
        icon: Type,
        color: 'text-orange-400',
        path: '/base64',
        category: 'dev',
        seoTitle: 'Base64 Encoder & Decoder - Text and Files',
        howToUse: 'Choose between "Encode" and "Decode" modes. Paste your content or upload a file. The results are generated instantly in-browser for 100% privacy.'
    },
    {
        id: 'sql',
        name: 'SQL Formatter',
        description: 'Pretty-print your SQL queries instantly.',
        icon: Database,
        color: 'text-cyan-400',
        path: '/sql',
        category: 'data',
        seoTitle: 'Online SQL Formatter - SQL Pretty Print & Clean',
        howToUse: 'Paste your messy SQL code into the editor. The tool will automatically organize keywords, handle indentations, and make the query human-readable.'
    },
    {
        id: 'tokens',
        name: 'Token Gen',
        description: 'Generate UUIDs and random secure tokens.',
        icon: Fingerprint,
        color: 'text-pink-400',
        path: '/tokens',
        category: 'util',
        seoTitle: 'Random Token Generator - UUID & Secure Keys',
        howToUse: 'Select the type of token you need (UUID v4, Random Hex, etc.). Click "Generate" to create a fresh secure string. You can copy the result directly to your clipboard.'
    },
    {
        id: 'jwt',
        name: 'JWT Decoder',
        description: 'Decode header, payload and verify token expiry.',
        icon: FileCode,
        color: 'text-yellow-400',
        path: '/jwt',
        category: 'dev',
        seoTitle: 'JWT Decoder Online - Inspect JWT Header & Payload',
        howToUse: 'Paste an encoded JSON Web Token into the input. The tool will instantly parse the Header and Payload sections and show you the expiration status without sending data anywhere.'
    },
    {
        id: 'timestamp',
        name: 'Time Converter',
        description: 'Unix timestamps to readable dates and vice-versa.',
        icon: Clock,
        color: 'text-indigo-400',
        path: '/timestamp',
        category: 'util',
        seoTitle: 'Unix Timestamp Converter - Epoch to Human Readable',
        howToUse: 'Enter a numeric Unix timestamp to get a human-readable date, or enter a date string to get the corresponding Epoch timestamp.'
    },
    {
        id: 'regex',
        name: 'Regex Tester',
        description: 'Test regular expressions with highlight matches.',
        icon: SearchCode,
        color: 'text-emerald-400',
        path: '/regex',
        category: 'dev',
        seoTitle: 'Online Regex Tester - Real-time Pattern Matching',
        howToUse: 'Input your regular expression pattern and the test string. The tool will highlight matches in real-time and provide detailed capture group information.'
    },
    {
        id: 'html',
        name: 'HTML Preview',
        description: 'Live split-screen preview for HTML and CSS.',
        icon: Eye,
        color: 'text-red-400',
        path: '/html',
        category: 'media',
        seoTitle: 'Online HTML & CSS Preview - Live Code Sandbox',
        howToUse: 'Write your HTML and CSS code in the editor. The preview panel updates instantly as you type, allowing for rapid component prototyping.'
    },
    {
        id: 'csv',
        name: 'CSV to JSON',
        description: 'Convert CSV data to structured JSON format.',
        icon: FileJson,
        color: 'text-sky-400',
        path: '/csv',
        category: 'data',
        seoTitle: 'CSV to JSON Converter Online - Clean Data Export',
        howToUse: 'Upload a .csv file or paste your CSV content. The tool will convert it into a structured JSON array that you can copy or download as a file.'
    },
    {
        id: 'password',
        name: 'Pass Generator',
        description: 'Generate customizable secure passwords.',
        icon: ShieldCheck,
        color: 'text-lime-400',
        path: '/password',
        category: 'util',
        seoTitle: 'Secure Password Generator - Strong Random Passwords',
        howToUse: 'Adjust the length and character types (uppercase, numbers, symbols). Click "Generate" to receive a crypthographically secure password.'
    },
    {
        id: 'url',
        name: 'URL Encoder',
        description: 'Safely encode or decode URL components.',
        icon: Link,
        color: 'text-gray-400',
        path: '/url',
        category: 'dev',
        seoTitle: 'URL Encoder & Decoder Online - Safe URL Formatting',
        howToUse: 'Paste your URL or components into the text area. Choose "Encode" to make the URL safe for transport, or "Decode" to see the original characters.'
    },
    {
        id: 'color',
        name: 'Color Converter',
        description: 'Convert between HEX, RGB and HSL formats.',
        icon: Palette,
        color: 'text-rose-400',
        path: '/color',
        category: 'media',
        seoTitle: 'Online Color Converter - HEX, RGB & HSL',
        howToUse: 'Input a color code in any common format. The tool will calculate and display equivalent codes in HEX, RGB, and HSL, along with a visual color preview.'
    },
    {
        id: 'diff',
        name: 'Text Diff',
        description: 'Compare two text blocks and see differences.',
        icon: FileDiff,
        color: 'text-orange-500',
        path: '/diff',
        category: 'util',
        seoTitle: 'Online Text Diff Tool - Compare Files for Changes',
        howToUse: 'Paste two different text blocks into the "Original" and "Modified" areas. The tool highlights additions in green and deletions in red.'
    },
    {
        id: 'cron',
        name: 'Cron Viewer',
        description: 'Explain cron expressions in human language.',
        icon: CalendarClock,
        color: 'text-blue-500',
        path: '/cron',
        category: 'dev',
        seoTitle: 'Cron Expression Viewer - Human Friendly Cron',
        howToUse: 'Enter your cron schedule (e.g. "0 0 * * *"). The viewer will translate it into plain English (e.g. "At 12:00 AM every day") and show the next few execution times.'
    },
    {
        id: 'qr',
        name: 'QR Generator',
        description: 'Create customizable QR codes with logos.',
        icon: QrCode,
        color: 'text-orange-400',
        path: '/qr',
        category: 'util',
        seoTitle: 'QR Code Generator with Logo - Premium Custom Designs',
        howToUse: 'Enter your URL or text. Adjust colors, size, and error correction levels. You can also upload a logo to be displayed in the center of the QR code.'
    },
    {
        id: 'gradient',
        name: 'Gradient Gen',
        description: 'Design beautiful CSS gradients and copy code.',
        icon: Paintbrush,
        color: 'text-purple-400',
        path: '/gradient',
        category: 'media',
        seoTitle: 'CSS Gradient Generator - Premium Linear & Radial Gradients',
        howToUse: 'Choose between linear and radial gradients. Adjust the angle (for linear) and add up to 5 color stops. Copy the generated CSS code with vendor prefixes for your stylesheet.'
    },
    {
        id: 'bezier',
        name: 'Bezier Curves',
        description: 'Create and preview custom easing functions.',
        icon: Waves,
        color: 'text-pink-400',
        path: '/bezier',
        category: 'dev',
        seoTitle: 'CSS Cubic Bezier Generator - Animation Easing Tool',
        howToUse: 'Adjust the bezier curve coordinates manually or select a preset. Watch the animation previews to feel the "bounce" and "snap" effect, then copy the CSS function.'
    },
    {
        id: 'text',
        name: 'Case Converter',
        description: 'Convert between CamelCase, snake_case and more.',
        icon: CaseLower,
        color: 'text-emerald-400',
        path: '/text',
        category: 'text',
        seoTitle: 'Case Converter - Camel, Snake, Kebab & Pascal Case',
        howToUse: 'Enter your text and see it instantly converted into 6 different programming formats. Perfect for variable naming and refactoring.'
    },
    {
        id: 'age',
        name: 'Age Calculator',
        description: 'Calculate exact age in years, months, and days.',
        icon: Baby,
        color: 'text-orange-300',
        path: '/age',
        category: 'util',
        seoTitle: 'Exact Age Calculator - Years, Months, Days',
        howToUse: 'Select your birth date using the picker. The tool will calculate your exact age, including the number of days until your next birthday.'
    },
    {
        id: 'markdown',
        name: 'Markdown Editor',
        description: 'Write Markdown with real-time preview and export.',
        icon: FileEdit,
        color: 'text-blue-300',
        path: '/markdown',
        category: 'text',
        seoTitle: 'Online Markdown Editor with Real-time Preview',
        howToUse: 'Type your markdown on the left. See the rendered HTML on the right. You can download the result as a .md file or an HTML snippet.'
    }
]
