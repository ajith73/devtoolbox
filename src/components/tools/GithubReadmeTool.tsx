import { useState, useMemo } from 'react'
import { ToolLayout } from './ToolLayout'
import { Github, User, Briefcase, Code2, Globe, Heart, Copy, Share2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function GithubReadmeTool() {
    const [data, setData] = useState({
        name: '',
        title: 'Full Stack Developer',
        location: '',
        bio: 'Passionate about building beautiful and functional web applications.',
        skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
        // Socials
        github: '',
        twitter: '',
        linkedin: '',
        instagram: '',
        devto: '',
        stackoverflow: '',
        discord: '',
        youtube: '',
        medium: '',
        codepen: '',
        leetcode: '',
        website: '',
        // Support
        buyMeACoffee: '',
        patreon: '',
        kofi: '',
        // Professional
        workingOn: '',
        learning: '',
        collaborateOn: '',
        helpWith: '',
        askMeAbout: '',
        reachMe: '',
        funFact: '',
        // Add-ons
        showStats: true,
        showStreaks: true,
        showLanguages: true,
        showTrophies: false,
        showActivityGraph: false,
        showVisitorCount: false,
        theme: 'radical',
        alignment: 'left' as 'left' | 'center' | 'right'
    })

    const [viewMode, setViewMode] = useState<'markdown' | 'preview'>('markdown')

    const readmeContent = useMemo(() => {
        const statsUrl = `https://github-readme-stats.vercel.app/api?username=${data.github}&show_icons=true&theme=${data.theme}`
        const languagesUrl = `https://github-readme-stats.vercel.app/api/top-langs/?username=${data.github}&layout=compact&theme=${data.theme}`
        const streaksUrl = `https://github-readme-streak-stats.herokuapp.com/?user=${data.github}&theme=${data.theme}`
        const trophiesUrl = `https://github-profile-trophy.vercel.app/?username=${data.github}&theme=${data.theme === 'radical' ? 'radical' : 'darkhub'}`
        const activityGraphUrl = `https://github-readme-activity-graph.vercel.app/graph?username=${data.github}&theme=${data.theme === 'radical' ? 'dracula' : 'github-dark'}`
        const visitorCountUrl = `https://komarev.com/ghpvc/?username=${data.github}&label=Profile%20views&color=0e75b6&style=flat`

        const alignStyle = data.alignment === 'center' ? 'align="center"' : data.alignment === 'right' ? 'align="right"' : ''

        return `<h1 ${alignStyle}>Hi there, I'm ${data.name || 'Visitor'}! 👋 ${data.showVisitorCount && data.github ? `\n<img src="${visitorCountUrl}" alt="visitor count" />` : ''}</h1>

<h2 ${alignStyle}>${data.title}</h2>
<p ${alignStyle}>${data.bio}</p>

${(data.workingOn || data.learning || data.collaborateOn || data.helpWith || data.askMeAbout || data.reachMe || data.funFact) ? `### 🚀 Operational Flow\n` : ''}${data.workingOn ? `- 🔭 I’m currently working on **${data.workingOn}**\n` : ''}${data.learning ? `- 🌱 I’m currently learning **${data.learning}**\n` : ''}${data.collaborateOn ? `- 👯 I’m looking to collaborate on **${data.collaborateOn}**\n` : ''}${data.helpWith ? `- 🤔 I’m looking for help with **${data.helpWith}**\n` : ''}${data.askMeAbout ? `- 💬 Ask me about **${data.askMeAbout}**\n` : ''}${data.reachMe ? `- 📫 How to reach me **${data.reachMe}**\n` : ''}${data.funFact ? `- ⚡ Fun fact **${data.funFact}**\n` : ''}
### 🛠 Tech Stack Matrix
${data.skills.map(s => `![${s}](https://img.shields.io/badge/-${encodeURIComponent(s)}-black?style=flat-square&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=white)`).join(' ')}

### 📬 Communication Nodes
${data.website ? `[![Website](https://img.shields.io/badge/-Website-black?style=flat-square&logo=google-chrome&logoColor=white)](${data.website})\n` : ''}${data.github ? `[![GitHub](https://img.shields.io/badge/-GitHub-black?style=flat-square&logo=github&logoColor=white)](https://github.com/${data.github})\n` : ''}${data.linkedin ? `[![LinkedIn](https://img.shields.io/badge/-LinkedIn-black?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/${data.linkedin})\n` : ''}${data.twitter ? `[![Twitter](https://img.shields.io/badge/-Twitter-black?style=flat-square&logo=twitter&logoColor=white)](https://twitter.com/${data.twitter})\n` : ''}${data.instagram ? `[![Instagram](https://img.shields.io/badge/-Instagram-black?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/${data.instagram})\n` : ''}${data.devto ? `[![Dev.to](https://img.shields.io/badge/-Dev.to-black?style=flat-square&logo=dev.to&logoColor=white)](https://dev.to/${data.devto})\n` : ''}${data.stackoverflow ? `[![Stack Overflow](https://img.shields.io/badge/-Stack%20Overflow-black?style=flat-square&logo=stack-overflow&logoColor=white)](https://stackoverflow.com/users/${data.stackoverflow})\n` : ''}${data.leetcode ? `[![LeetCode](https://img.shields.io/badge/-LeetCode-black?style=flat-square&logo=leetcode&logoColor=white)](https://leetcode.com/${data.leetcode})\n` : ''}${data.discord ? `[![Discord](https://img.shields.io/badge/-Discord-black?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/${data.discord})\n` : ''}${data.youtube ? `[![YouTube](https://img.shields.io/badge/-YouTube-black?style=flat-square&logo=youtube&logoColor=white)](https://youtube.com/@${data.youtube})\n` : ''}
${(data.buyMeACoffee || data.patreon || data.kofi) ? `### ☕ Support Nodes\n` : ''}${data.buyMeACoffee ? `[![BuyMeACoffee](https://img.shields.io/badge/-Buy%20Me%20a%20Coffee-black?style=flat-square&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/${data.buyMeACoffee})\n` : ''}${data.patreon ? `[![Patreon](https://img.shields.io/badge/-Patreon-black?style=flat-square&logo=patreon&logoColor=white)](https://patreon.com/${data.patreon})\n` : ''}${data.kofi ? `[![Ko-Fi](https://img.shields.io/badge/-Ko--Fi-black?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/${data.kofi})\n` : ''}
${data.github && (data.showStats || data.showLanguages || data.showStreaks || data.showTrophies || data.showActivityGraph) ? `### 📊 GitHub Insights\n<p align="left">\n${data.showTrophies ? `<img src="${trophiesUrl}" alt="trophies" />\n<br/>\n` : ''}${data.showStats ? `<img src="${statsUrl}" alt="${data.github}'s stats" />\n` : ''}${data.showLanguages ? `<img src="${languagesUrl}" alt="${data.github}'s top languages" />\n` : ''}${data.showStreaks ? `<img src="${streaksUrl}" alt="${data.github}'s streak" />\n` : ''}${data.showActivityGraph ? `<br/><img src="${activityGraphUrl}" alt="${data.github}'s activity graph" width="100%" />\n` : ''}</p>` : ''}

---
*Generated with [DevBox](https://devbox.io)*
`
    }, [data])

    const renderLivePreview = (text: string) => {
        return text
            // Handle HTML Headers and Paragraphs (with alignment)
            .replace(/<h1 align="(.*?)">(.*?)<\/h1>/g, '<div class="text-center md:text-$1 mb-6"><h1 class="text-3xl font-black text-[var(--text-primary)]">$2</h1></div>')
            .replace(/<h1 >(.*?)<\/h1>/g, '<h1 class="text-3xl font-black text-[var(--text-primary)] mb-6">$1</h1>')
            .replace(/<h2 align="(.*?)">(.*?)<\/h2>/g, '<div class="text-center md:text-$1 mb-4"><h2 class="text-2xl font-bold text-[var(--text-primary)]">$2</h2></div>')
            .replace(/<h2 >(.*?)<\/h2>/g, '<h2 class="text-2xl font-bold text-[var(--text-primary)] mb-4">$1</h2>')
            .replace(/<p align="(.*?)">(.*?)<\/p>/g, '<div class="text-center md:text-$1 mb-4 text-[var(--text-muted)]">$2</div>')
            .replace(/<p >(.*?)<\/p>/g, '<p class="text-[var(--text-muted)] mb-4">$1</p>')

            // Markdown Headings
            .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-black mb-6">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-4">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mb-3 text-brand">$1</h3>')

            // Images and Linked Images (Badges)
            .replace(/\[\!\[(.*?)\]\((.*?)\)\]\((.*?)\)/g, '<a href="$3" target="_blank" class="inline-block mr-2 mb-2"><img src="$2" alt="$1" /></a>')
            .replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="inline-block mr-2 mb-2" />')

            // HTML Image tags (for visitor count and stats)
            .replace(/<img src="(.*?)" alt="(.*?)" \/>/g, '<img src="$1" alt="$2" class="inline-block my-2" />')
            .replace(/<img src="(.*?)" alt="(.*?)" width="(.*?)" \/>/g, '<img src="$1" alt="$2" style="width: $3" class="inline-block my-2" />')

            // Formatting
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-none flex items-center space-x-2 my-1"><span class="w-1.5 h-1.5 rounded-full bg-brand/40"></span><span>$1</span></li>')

            // Structural
            .replace(/<p align="left">/g, '<div class="flex flex-wrap gap-4 items-start">')
            .replace(/<\/p>/g, '</div>')
            .replace(/<br\/>/g, '<div class="w-full"></div>')
            .replace(/---/g, '<hr class="my-8 border-[var(--border-primary)]" />')
            .replace(/\n/g, '<br />')
    }

    const updateField = (field: keyof typeof data, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const sections = [
        { id: 'identity', label: 'Identity', icon: User },
        { id: 'professional', label: 'Nodes', icon: Briefcase },
        { id: 'tech', label: 'Stack', icon: Code2 },
        { id: 'social', label: 'Signals', icon: Globe },
        { id: 'support', label: 'Support', icon: Heart },
        { id: 'addons', label: 'Add-ons', icon: Share2 },
    ]

    const [activeSection, setActiveSection] = useState(sections[0].id)

    return (
        <ToolLayout
            title="GitHub Portfolio Forge"
            description="Generate high-performance README architectures for your GitHub profile."
            icon={Github}
            onReset={() => setData({
                name: '',
                title: 'Full Stack Developer',
                location: '',
                bio: 'Passionate about building beautiful and functional web applications.',
                skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
                github: '',
                twitter: '',
                linkedin: '',
                instagram: '',
                devto: '',
                stackoverflow: '',
                discord: '',
                youtube: '',
                medium: '',
                codepen: '',
                leetcode: '',
                website: '',
                buyMeACoffee: '',
                patreon: '',
                kofi: '',
                workingOn: '',
                learning: '',
                collaborateOn: '',
                helpWith: '',
                askMeAbout: '',
                reachMe: '',
                funFact: '',
                showStats: true,
                showStreaks: true,
                showLanguages: true,
                showTrophies: false,
                showActivityGraph: false,
                showVisitorCount: false,
                theme: 'radical',
                alignment: 'left'
            })}
            onCopy={() => copyToClipboard(readmeContent)}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Tabs */}
                <div className="lg:col-span-1 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl transition-all border shrink-0 lg:w-full aspect-square md:aspect-auto md:h-24",
                                activeSection === s.id
                                    ? "brand-gradient text-white border-transparent shadow-lg shadow-brand/20"
                                    : "glass text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                            )}
                        >
                            <s.icon className="w-6 h-6 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Editor Inputs */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {activeSection === 'identity' && (
                                <motion.div
                                    key="identity"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">Identity Core</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[var(--bg-primary)]"
                                                placeholder="Enter mapping name..."
                                                value={data.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Professional Title</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[var(--bg-primary)]"
                                                placeholder="e.g. System Architect"
                                                value={data.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-[var(--border-primary)]">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Hero Alignment</label>
                                            <div className="flex gap-2 mt-2">
                                                {[
                                                    { id: 'left', icon: AlignLeft },
                                                    { id: 'center', icon: AlignCenter },
                                                    { id: 'right', icon: AlignRight },
                                                ].map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => updateField('alignment', item.id as any)}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center p-3 rounded-xl border transition-all",
                                                            data.alignment === item.id
                                                                ? "brand-gradient text-white border-transparent shadow-md"
                                                                : "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-primary)] hover:border-brand/40"
                                                        )}
                                                    >
                                                        <item.icon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Location Node</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[var(--bg-primary)]"
                                                placeholder="e.g. San Francisco, CA"
                                                value={data.location}
                                                onChange={(e) => updateField('location', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'professional' && (
                                <motion.div
                                    key="professional"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">Operational Flow</h4>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Biography / Mission</label>
                                            <textarea
                                                className="w-full bg-[var(--bg-primary)] min-h-[100px] resize-none"
                                                placeholder="Briefly describe your mission statement..."
                                                value={data.bio}
                                                onChange={(e) => updateField('bio', e.target.value)}
                                            />
                                        </div>
                                        {[
                                            { label: '🔭 Current Project', field: 'workingOn', placeholder: 'What are you forging?' },
                                            { label: '🌱 Learning Vector', field: 'learning', placeholder: 'Current knowledge acquisition...' },
                                            { label: '👯 Collaboration', field: 'collaborateOn', placeholder: 'What do you want to build with others?' },
                                            { label: '🤔 Looking for Help', field: 'helpWith', placeholder: 'What do you need assistance with?' },
                                            { label: '💬 Knowledge Hub', field: 'askMeAbout', placeholder: 'What topics can people ask you about?' },
                                            { label: '📫 Contact Protocol', field: 'reachMe', placeholder: 'How should people reach you?' },
                                            { label: '⚡ Fun Fact', field: 'funFact', placeholder: 'Something unique about you...' },
                                        ].map(item => (
                                            <div key={item.field} className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">{item.label}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[var(--bg-primary)]"
                                                    placeholder={item.placeholder}
                                                    value={(data as any)[item.field]}
                                                    onChange={(e) => updateField(item.field as any, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'tech' && (
                                <motion.div
                                    key="tech"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">Tech Stack Matrix</h4>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">Enter your skills separated by commas to update your technical profile.</p>
                                        <textarea
                                            className="w-full bg-[var(--bg-primary)] min-h-[120px] resize-none font-mono text-sm"
                                            placeholder="React, TypeScript, Go, Kubernetes..."
                                            value={data.skills.join(', ')}
                                            onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()))}
                                        />
                                        <div className="flex flex-wrap gap-2 pt-4 max-h-[150px] overflow-y-auto custom-scrollbar">
                                            {data.skills.filter(s => s).map(s => (
                                                <span key={s} className="px-3 py-1 bg-brand/10 border border-brand/20 text-brand rounded-full text-[10px] font-black uppercase tracking-widest">{s}</span>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-[var(--border-primary)]">
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Quick Injectors</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'Tailwind', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'Go'].map(skill => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => {
                                                            if (!data.skills.includes(skill)) {
                                                                updateField('skills', [...data.skills, skill])
                                                            }
                                                        }}
                                                        className="px-2 py-1 glass border-[var(--border-primary)] rounded-md text-[9px] font-bold text-[var(--text-secondary)] hover:border-brand/40 hover:text-brand transition-all"
                                                    >
                                                        + {skill}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'social' && (
                                <motion.div
                                    key="social"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">Communication Nodes</h4>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {[
                                            { label: 'GitHub Handle', field: 'github', placeholder: 'e.g. devbox-io' },
                                            { label: 'Twitter Handle', field: 'twitter', placeholder: 'e.g. devbox_hq' },
                                            { label: 'LinkedIn Username', field: 'linkedin', placeholder: 'e.g. johndoe' },
                                            { label: 'Instagram Handle', field: 'instagram', placeholder: 'e.g. instaname' },
                                            { label: 'Discord Invite Code', field: 'discord', placeholder: 'e.g. J82XyGz' },
                                            { label: 'YouTube @handle', field: 'youtube', placeholder: 'e.g. coding_channel' },
                                            { label: 'LeetCode Username', field: 'leetcode', placeholder: 'e.g. code_master' },
                                            { label: 'Dev.to Username', field: 'devto', placeholder: 'e.g. username' },
                                            { label: 'Stack Overflow ID', field: 'stackoverflow', placeholder: 'e.g. 1234567' },
                                            { label: 'Website URL', field: 'website', placeholder: 'https://yourpage.com' },
                                        ].map(item => (
                                            <div key={item.field} className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">{item.label}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[var(--bg-primary)]"
                                                    placeholder={item.placeholder}
                                                    value={(data as any)[item.field]}
                                                    onChange={(e) => updateField(item.field as any, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'support' && (
                                <motion.div
                                    key="support"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">Support Nodes</h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Buy Me A Coffee', field: 'buyMeACoffee', placeholder: 'e.g. yourname' },
                                            { label: 'Patreon Username', field: 'patreon', placeholder: 'e.g. creator' },
                                            { label: 'Ko-fi Username', field: 'kofi', placeholder: 'e.g. support_me' },
                                        ].map(item => (
                                            <div key={item.field} className="space-y-2">
                                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">{item.label}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[var(--bg-primary)]"
                                                    placeholder={item.placeholder}
                                                    value={(data as any)[item.field]}
                                                    onChange={(e) => updateField(item.field as any, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'addons' && (
                                <motion.div
                                    key="addons"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <h4 className="text-xs font-black text-brand uppercase tracking-[0.3em]">GitHub Matrix Add-ons</h4>
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        <div className="space-y-4">
                                            {[
                                                { label: 'GitHub Stats Card', field: 'showStats' },
                                                { label: 'Top Languages Card', field: 'showLanguages' },
                                                { label: 'Streak Stats Card', field: 'showStreaks' },
                                                { label: 'GitHub Trophies', field: 'showTrophies' },
                                                { label: 'Activity Graph', field: 'showActivityGraph' },
                                                { label: 'Profile Visitor Count', field: 'showVisitorCount' },
                                            ].map(item => (
                                                <label key={item.field} className="flex items-center justify-between p-4 glass rounded-2xl border-[var(--border-primary)] cursor-pointer group">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-brand transition-colors">{item.label}</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded border-[var(--border-primary)] text-brand focus:ring-brand bg-transparent"
                                                        checked={(data as any)[item.field]}
                                                        onChange={(e) => updateField(item.field as any, e.target.checked)}
                                                    />
                                                </label>
                                            ))}
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-[var(--border-primary)]">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Stats Theme</label>
                                            <select
                                                className="w-full bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-xl p-3 text-xs font-black uppercase tracking-widest text-[var(--text-primary)]"
                                                value={data.theme}
                                                onChange={(e) => updateField('theme', e.target.value)}
                                            >
                                                {['radical', 'merko', 'gruvbox', 'tokyonight', 'onedark', 'cobalt', 'synthwave', 'highcontrast', 'dracula'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Preview Output */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-primary)] shadow-sm">
                            <button
                                onClick={() => setViewMode('markdown')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'markdown' ? "brand-gradient text-white shadow-md" : "text-[var(--text-muted)] hover:text-brand"
                                )}
                            >
                                Markdown
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'preview' ? "brand-gradient text-white shadow-md" : "text-[var(--text-muted)] hover:text-brand"
                                )}
                            >
                                Live Preview
                            </button>
                        </div>
                        <button
                            onClick={() => copyToClipboard(readmeContent)}
                            className="flex items-center space-x-2 text-[10px] font-black text-brand uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Source</span>
                        </button>
                    </div>

                    <div className="flex-1 min-h-[500px] lg:h-[650px] relative glass rounded-[2.5rem] bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex-1 p-10 overflow-auto custom-scrollbar">
                            {viewMode === 'markdown' ? (
                                <div className="font-mono text-sm leading-relaxed text-[var(--text-primary)] opacity-90 whitespace-pre-wrap select-all">
                                    {readmeContent}
                                </div>
                            ) : (
                                <div
                                    dangerouslySetInnerHTML={{ __html: renderLivePreview(readmeContent) }}
                                    className="prose prose-slate max-w-none text-[var(--text-primary)]"
                                />
                            )}
                        </div>
                        {/* Status bar */}
                        <div className="p-6 border-t border-[var(--border-primary)]/30 bg-[var(--bg-primary)]/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Share2 className="w-5 h-5 text-brand" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    {viewMode === 'markdown' ? 'Raw Source Protocol' : 'Visual Projection Active'}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-100" />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
