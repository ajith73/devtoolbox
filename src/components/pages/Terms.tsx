import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Last updated: February 19, 2026
          </p>
        </div>

        <div className="space-y-8 text-[var(--text-primary)]">
          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              By accessing and using DevBox, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Permission is granted to temporarily use DevBox for personal, non-commercial transitory viewing only.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>This is the grant of a license, not a transfer of title</li>
              <li>You may not modify or copy the materials</li>
              <li>You may not use the materials for commercial purposes</li>
              <li>You may not attempt to decompile or reverse engineer any software</li>
            </ul>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              The materials on DevBox are provided on an 'as is' basis. DevBox makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Further, DevBox does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              In no event shall DevBox or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DevBox, even if DevBox or a DevBox authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The materials appearing on DevBox could include technical, typographical, or photographic errors. DevBox does not warrant that any of the materials on its website are accurate, complete, or current. DevBox may make changes to the materials contained on its website at any time without notice. However, DevBox does not make any commitment to update the materials.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">6. Links</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              DevBox has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by DevBox of the site. Use of any such linked website is at the user's own risk.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">7. Modifications</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              DevBox may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>

          <div className="glass rounded-[3rem] p-8 border-[var(--border-primary)]">
            <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </p>
          </div>
        </div>
      </div>
    )
}
