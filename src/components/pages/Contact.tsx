import { ArrowLeft, Mail, Github, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ContactPage() {
  return (

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand transition-all group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-brand/20 underline-offset-8 decoration-4">
            Contact Us
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Have questions, feedback, or need help? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto">
              <Github className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">GitHub Issues</h3>
            <p className="text-[var(--text-secondary)]">
              Report bugs, suggest features, or contribute to the project on GitHub.
            </p>
            <a
              href="https://github.com/your-repo/devbox"
              className="inline-flex items-center text-brand hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open an Issue →
            </a>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Community</h3>
            <p className="text-[var(--text-secondary)]">
              Join the discussion, share your experience, and connect with other developers.
            </p>
            <a
              href="https://github.com/your-repo/devbox/discussions"
              className="inline-flex items-center text-brand hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Discussion →
            </a>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Email</h3>
            <p className="text-[var(--text-secondary)]">
              For business inquiries, partnerships, or general questions.
            </p>
            <a
              href="mailto:hello@devbox.io"
              className="inline-flex items-center text-brand hover:underline"
            >
              hello@devbox.io
            </a>
          </div>
        </div>

        <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Is DevBox free to use?</h3>
              <p className="text-[var(--text-secondary)]">Yes, DevBox is completely free and open source.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How does DevBox protect my data?</h3>
              <p className="text-[var(--text-secondary)]">All processing happens locally in your browser. Your data never leaves your device. Read our <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link> for more details.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I contribute to DevBox?</h3>
              <p className="text-[var(--text-secondary)]">Absolutely! DevBox is open source. Visit our GitHub repository to contribute code, report issues, or suggest features.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What browsers are supported?</h3>
              <p className="text-[var(--text-secondary)]">DevBox works in all modern browsers including Chrome, Firefox, Safari, and Edge.</p>
            </div>
          </div>
        </div>
      </div>
    )
}
