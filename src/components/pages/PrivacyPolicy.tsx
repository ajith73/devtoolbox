import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PrivacyPolicyPage() {
  return (

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand transition-all group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-brand/20 underline-offset-8 decoration-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Last updated: February 19, 2026
          </p>
        </div>

        <div className="space-y-8 text-[var(--text-primary)]">
          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              DevBox is designed with privacy as a core principle. We do not collect, store, or transmit any personal information from our users.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>No user accounts or registration required</li>
              <li>No tracking or analytics implemented</li>
              <li>No cookies used for tracking purposes</li>
              <li>No data sent to external servers</li>
            </ul>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">2. How DevBox Works</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              All processing happens entirely in your browser using client-side JavaScript. Your data never leaves your device.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>JSON formatting, API testing, and all tools run locally</li>
              <li>No server-side processing or data storage</li>
              <li>All calculations and transformations happen in your browser</li>
              <li>Local storage is only used for your preferences (optional)</li>
            </ul>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">3. Third-Party Services</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              DevBox does not integrate with any third-party services that collect user data.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>No Google Analytics or similar tracking</li>
              <li>No social media integrations that track users</li>
              <li>No external APIs that require user data transmission</li>
              <li>Only uses browser APIs for functionality</li>
            </ul>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Since all data processing occurs locally in your browser, security is handled by your browser's security features.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Data is never transmitted over the internet</li>
              <li>No risk of server-side data breaches</li>
              <li>Your browser's security protects your data</li>
              <li>HTTPS ensures secure loading of the application</li>
            </ul>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              If you have any questions about this Privacy Policy, please visit our <Link to="/contact" className="text-brand hover:underline">Contact page</Link> or check our GitHub repository for more information about the project.
            </p>
          </div>
        </div>
      </div>
    )
}
