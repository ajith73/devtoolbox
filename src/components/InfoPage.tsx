import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, CheckCircle } from 'lucide-react'

export function InfoPage({ title, content, type = 'policy' }: { title: string, content: string[], type?: 'policy' | 'terms' | 'changelog' }) {
    return (
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 space-y-12 animate-fade-in text-white/80">
            <Link
                to="/"
                className="inline-flex items-center text-sm text-white/40 hover:text-white transition-colors group mb-8"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Tools
            </Link>

            <header className="space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-[2rem] brand-gradient flex items-center justify-center">
                        {type === 'policy' ? <Shield className="w-8 h-8 text-white" /> : type === 'terms' ? <FileText className="w-8 h-8 text-white" /> : <CheckCircle className="w-8 h-8 text-white" />}
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-white">{title}</h1>
                </div>
                <p className="text-xl text-white/40 max-w-2xl italic border-l-4 border-brand/20 pl-6 leading-relaxed">
                    Last Updated: February 14, 2026. This document governs the use of DevBox tools and services.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12">
                {content.map((section, i) => {
                    const [head, ...body] = section.split('\n')
                    return (
                        <section key={i} className="space-y-6">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <span className="text-brand mr-4 font-mono">0{i + 1}.</span>
                                {head}
                            </h2>
                            <div className="space-y-4 text-lg leading-relaxed text-white/60">
                                {body.map((p, j) => (
                                    <p key={j}>{p}</p>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </div>

            <div className="pt-16 border-t border-white/10 text-center">
                <p className="text-sm text-white/20">
                    Questions about this document? Contact us at legal@devbox.io
                </p>
            </div>
        </div>
    )
}
