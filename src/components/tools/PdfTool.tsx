import { useState, useRef } from 'react'
import { ToolLayout } from './ToolLayout'
import { FileStack, FilePlus, Image as ImageIcon, Download, Trash2, AlertCircle, Loader2, FileImage } from 'lucide-react'
import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'
import { PDFDocument } from 'pdf-lib'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source logic - using CDN to avoid build complexites
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface FileItem {
    id: string
    file: File
    preview?: string
}

export function PdfTool() {
    const [activeMode, setActiveMode] = useState<'merge' | 'convert' | 'split' | 'pdf-to-img'>('merge')
    const [files, setFiles] = useState<FileItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        // Single file check for split and pdf-to-img
        if ((activeMode === 'split' || activeMode === 'pdf-to-img') && (files.length > 0 || selectedFiles.length > 1)) {
            alert('This mode only supports processing one file at a time.')
            return
        }
        const newItems: FileItem[] = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }))
        setFiles(prev => [...prev, ...newItems])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeFile = (id: string) => {
        setFiles(prev => {
            const item = prev.find(f => f.id === id)
            if (item?.preview) URL.revokeObjectURL(item.preview)
            return prev.filter(f => f.id !== id)
        })
    }

    const handleMerge = async () => {
        if (files.length < 2) return
        setIsProcessing(true)
        try {
            const mergedPdf = await PDFDocument.create()
            for (const item of files) {
                const arrayBuffer = await item.file.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
                copiedPages.forEach((page) => mergedPdf.addPage(page))
            }
            const pdfBytes = await mergedPdf.save()
            downloadFile(pdfBytes, 'merged_document.pdf', 'application/pdf')
        } catch (error) {
            console.error('Merge error:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSplit = async () => {
        if (files.length !== 1) return
        setIsProcessing(true)
        try {
            const arrayBuffer = await files[0].file.arrayBuffer()
            const sourcePdf = await PDFDocument.load(arrayBuffer)
            const pageCount = sourcePdf.getPageCount()

            // If only 1 page, just download it directly (maybe it's a 1-page PDF, effectively a copy)
            if (pageCount === 1) {
                const pdfBytes = await sourcePdf.save()
                downloadFile(pdfBytes, 'split_page_1.pdf', 'application/pdf')
                return
            }

            const zip = new JSZip()

            for (let i = 0; i < pageCount; i++) {
                const newDoc = await PDFDocument.create()
                const [copiedPage] = await newDoc.copyPages(sourcePdf, [i])
                newDoc.addPage(copiedPage)
                const pdfBytes = await newDoc.save()
                zip.file(`page_${i + 1}.pdf`, pdfBytes)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            downloadFile(content, 'split_pages.zip', 'application/zip')

        } catch (error) {
            console.error('Split error:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePdfToImages = async () => {
        if (files.length !== 1) return
        setIsProcessing(true)
        try {
            const arrayBuffer = await files[0].file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise
            const zip = new JSZip()

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: 2 }) // Higher scale for better quality
                const canvas = document.createElement('canvas')
                const context = canvas.getContext('2d')
                if (!context) continue

                canvas.height = viewport.height
                canvas.width = viewport.width

                await page.render({ canvasContext: context, viewport } as any).promise
                const imgData = canvas.toDataURL('image/jpeg', 0.85)
                zip.file(`page_${i}.jpg`, imgData.split(',')[1], { base64: true })
            }

            const content = await zip.generateAsync({ type: 'blob' })
            downloadFile(content, 'pdf_images.zip', 'application/zip')
        } catch (error) {
            console.error('PDF to Image error:', error)
            alert('Failed to convert PDF. Ensure the file is not password protected.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConvert = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        try {
            const doc = new jsPDF()
            for (let i = 0; i < files.length; i++) {
                const item = files[i]
                if (!item.file.type.startsWith('image/')) continue

                const imgData = await fileToDataURL(item.file)
                const img = new Image()
                img.src = imgData
                await new Promise(resolve => img.onload = resolve)

                const pageWidth = doc.internal.pageSize.getWidth()
                const pageHeight = doc.internal.pageSize.getHeight()
                const ratio = Math.min(pageWidth / img.width, pageHeight / img.height)
                const imgWidth = img.width * ratio
                const imgHeight = img.height * ratio
                const x = (pageWidth - imgWidth) / 2
                const y = (pageHeight - imgHeight) / 2

                if (i > 0) doc.addPage()
                doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)
            }
            doc.save('converted_images.pdf')
        } catch (error) {
            console.error('Convert error:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const downloadFile = (data: Uint8Array | Blob, fileName: string, type: string) => {
        const blob = data instanceof Blob ? data : new Blob([data as any], { type })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <ToolLayout
            title="PDF Power Suite"
            description="Professional PDF orchestration: merge, split, convert to images and create PDFs."
            icon={FileStack}
            onReset={() => setFiles([])}
        >
            <div className="space-y-8">
                {/* Mode Selector */}
                <div className="flex items-center justify-center space-x-4 p-1.5 glass rounded-2xl md:rounded-3xl bg-[var(--bg-secondary)] border-[var(--border-primary)] w-fit mx-auto mb-2 overflow-hidden shadow-lg flex-wrap gap-y-2">
                    {[
                        { id: 'merge', label: 'Merge', icon: FilePlus },
                        { id: 'split', label: 'Split', icon: FileStack },
                        { id: 'pdf-to-img', label: 'PDF to Img', icon: FileImage },
                        { id: 'convert', label: 'Img to PDF', icon: ImageIcon },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => {
                                setActiveMode(mode.id as any)
                                setFiles([])
                            }}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase transition-all duration-300",
                                activeMode === mode.id
                                    ? "brand-gradient text-white shadow-lg shadow-brand/20 scale-105"
                                    : "text-[var(--text-secondary)] hover:text-brand hover:bg-brand/5"
                            )}
                        >
                            <mode.icon className="w-3.5 h-3.5" />
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Upload Zone */}
                    <div className="lg:col-span-12">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative h-48 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-[2.5rem] bg-[var(--bg-secondary)]/30 hover:bg-brand/5 hover:border-brand/40 transition-all cursor-pointer overflow-hidden shadow-inner"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                multiple={activeMode === 'merge' || activeMode === 'convert'}
                                accept={activeMode === 'convert' ? "image/*" : ".pdf"}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center space-y-4 relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-brand/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {activeMode === 'convert'
                                        ? <ImageIcon className="w-8 h-8 text-brand" />
                                        : activeMode === 'pdf-to-img'
                                            ? <FileImage className="w-8 h-8 text-brand" />
                                            : <FilePlus className="w-8 h-8 text-brand" />
                                    }
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                                        Drop your {activeMode === 'convert' ? 'Images' : (activeMode === 'split' || activeMode === 'pdf-to-img' ? 'PDF' : 'PDFs')} here
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2 font-bold uppercase tracking-tight">
                                        or click to browse local storage
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Staging Area ({files.length} {files.length === 1 ? 'file' : 'files'})</label>
                            {files.length > 0 && (
                                <button
                                    onClick={() => setFiles([])}
                                    className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                                >
                                    Clear Matrix
                                </button>
                            )}
                        </div>

                        <div className="glass rounded-[2.5rem] bg-[var(--bg-secondary)] border-[var(--border-primary)] p-6 min-h-[400px] shadow-2xl flex flex-col">
                            {files.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-20">
                                    <FileStack className="w-20 h-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Matrix is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-3 px-2 custom-scrollbar overflow-auto max-h-[500px]">
                                    {files.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group flex items-center space-x-4 p-4 glass rounded-2xl border-[var(--border-primary)] bg-[var(--bg-primary)]/50 hover:bg-[var(--bg-primary)] transition-all"
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black text-brand">{index + 1}</span>
                                                </div>
                                                {item.preview ? (
                                                    <img src={item.preview} className="w-12 h-12 rounded-lg object-cover border border-[var(--border-primary)] shrink-0" alt="preview" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                                                        <FileStack className="w-6 h-6 text-[var(--text-muted)]" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.file.name}</p>
                                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mt-0.5">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(item.id)}
                                                className="p-2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 glass rounded-[2.5rem] border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 space-y-6 sticky top-8">
                            <h4 className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Engine Control</h4>

                            <div className="space-y-4">
                                <div className="p-5 glass rounded-2xl border-[var(--border-primary)] bg-brand/5 border-brand/20">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <AlertCircle className="w-4 h-4 text-brand" />
                                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Protocol Active</p>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
                                        {activeMode === 'merge'
                                            ? "Ensure you merge at least 2 PDF files. The sequence in the matrix defines the document flow."
                                            : activeMode === 'split'
                                                ? "Drop a single PDF here to extract all pages into separate documents instantly."
                                                : activeMode === 'pdf-to-img'
                                                    ? "Convert all PDF pages into high-quality images packaged in a ZIP archive."
                                                    : "All selected images will be scaled to fit A4 distribution. Sequence defines the page order."}
                                    </p>
                                </div>

                                <button
                                    disabled={
                                        files.length === 0 ||
                                        (activeMode === 'merge' && files.length < 2) ||
                                        ((activeMode === 'split' || activeMode === 'pdf-to-img') && files.length !== 1) ||
                                        isProcessing
                                    }
                                    onClick={() => {
                                        if (activeMode === 'merge') handleMerge()
                                        else if (activeMode === 'split') handleSplit()
                                        else if (activeMode === 'pdf-to-img') handlePdfToImages()
                                        else handleConvert()
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-center space-x-3 p-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all",
                                        files.length === 0 ||
                                            (activeMode === 'merge' && files.length < 2) ||
                                            ((activeMode === 'split' || activeMode === 'pdf-to-img') && files.length !== 1) ||
                                            isProcessing
                                            ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)] cursor-not-allowed"
                                            : "brand-gradient text-white shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Synthesizing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            <span>
                                                {activeMode === 'merge' ? 'Generate Merged PDF'
                                                    : activeMode === 'split' ? 'Extract All Pages'
                                                        : activeMode === 'pdf-to-img' ? 'Convert to Images'
                                                            : 'Generate PDF'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="pt-6 border-t border-[var(--border-primary)]/30 space-y-4">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    <span>Total Payload</span>
                                    <span className="text-brand">{(files.reduce((acc, f) => acc + f.file.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    <span>Matrix Nodes</span>
                                    <span className="text-brand">{files.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    )
}
