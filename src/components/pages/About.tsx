import { ArrowLeft, Code, Shield, Zap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AboutPage() {
  return (

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-12 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand transition-all group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-brand/20 underline-offset-8 decoration-4">
            About DevBox
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            The ultimate engineering workbench for developers. Built with modern web technologies for maximum performance and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Lightning Fast</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              DevBox processes everything client-side in your browser. No servers, no latency, no waiting. Get instant results for all your development tasks.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">100% Private</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Your data never leaves your device. All processing happens locally in your browser. No tracking, no analytics, no data collection.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">30+ Tools</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              From JSON formatting and API testing to Base64 encoding and image compression. Everything a developer needs in one place.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Open Source</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Built with modern web technologies including React, TypeScript, and Tailwind CSS. Completely open source and free to use.
            </p>
          </div>
        </div>

        <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
          <h2 className="text-2xl font-bold mb-4">Technologies Used</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 glass rounded-xl">
              <div className="font-bold text-brand">React</div>
              <div className="text-[var(--text-muted)]">UI Framework</div>
            </div>
            <div className="text-center p-4 glass rounded-xl">
              <div className="font-bold text-brand">TypeScript</div>
              <div className="text-[var(--text-muted)]">Type Safety</div>
            </div>
            <div className="text-center p-4 glass rounded-xl">
              <div className="font-bold text-brand">Tailwind CSS</div>
              <div className="text-[var(--text-muted)]">Styling</div>
            </div>
            <div className="text-center p-4 glass rounded-xl">
              <div className="font-bold text-brand">Vite</div>
              <div className="text-[var(--text-muted)]">Build Tool</div>
            </div>
          </div>
        </div>
      </div>
    )
}
