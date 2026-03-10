import { useState, useCallback, useEffect } from 'react'
import { ToolLayout } from './ToolLayout'
import { Grid3X3, Plus, Trash2, Save, Share2, Code, FileText } from 'lucide-react'
import { copyToClipboard, cn } from '../../lib/utils'

interface GridArea {
  id: string
  name: string
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
  color: string
}

export function CssGridTool() {
  const [columns, setColumns] = useState(3)
  const [rows, setRows] = useState(3)
  const [gap, setGap] = useState('16px')
  const [gridAreas, setGridAreas] = useState<GridArea[]>([])
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startCell, setStartCell] = useState<{row: number, col: number} | null>(null)
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [responsiveBreakpoints, setResponsiveBreakpoints] = useState({
    tablet: '768px',
    mobile: '480px'
  })
  const [exportFormat, setExportFormat] = useState<'css' | 'tailwind' | 'scss' | 'html'>('css')

  // Color palette for grid areas
  const areaColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]

  const generateGridTemplateAreas = useCallback(() => {
    if (gridAreas.length === 0) return ''

    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '.')
    )

    gridAreas.forEach(area => {
      for (let r = area.rowStart - 1; r < area.rowEnd - 1; r++) {
        for (let c = area.colStart - 1; c < area.colEnd - 1; c++) {
          if (r >= 0 && r < rows && c >= 0 && c < columns) {
            grid[r][c] = area.name
          }
        }
      }
    })

    return grid.map(row => `"${row.join(' ')}"`).join('\n')
  }, [gridAreas, rows, columns])

  const generateCSS = useCallback(() => {
    let css = `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
  gap: ${gap};
}`

    if (gridAreas.length > 0) {
      css += `

/* Grid Areas */
.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
  gap: ${gap};
  grid-template-areas:
${generateGridTemplateAreas()};
}`

      gridAreas.forEach(area => {
        css += `

.${area.name} {
  grid-area: ${area.name};
}`
      })
    }

    return css
  }, [columns, rows, gap, gridAreas, generateGridTemplateAreas])

  const generateResponsiveCSS = useCallback(() => {
    let css = generateCSS()

    if (gridAreas.length > 0) {
      // Tablet responsive CSS
      css += `

/* Tablet (max-width: ${responsiveBreakpoints.tablet}) */
@media (max-width: ${responsiveBreakpoints.tablet}) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(${Math.ceil(gridAreas.length / 2)}, auto);
  }

  /* Adjust grid areas for tablet */
  ${gridAreas.map((area, index) => {
    const tabletRow = Math.floor(index / 2) + 1
    const tabletCol = (index % 2) + 1
    return `.${area.name} {
    grid-column: ${tabletCol};
    grid-row: ${tabletRow};
  }`
  }).join('\n  ')}
}`

      // Mobile responsive CSS
      css += `

/* Mobile (max-width: ${responsiveBreakpoints.mobile}) */
@media (max-width: ${responsiveBreakpoints.mobile}) {
  .grid-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(${gridAreas.length}, auto);
  }

  /* Adjust grid areas for mobile */
  ${gridAreas.map((area, index) => {
    return `.${area.name} {
    grid-column: 1;
    grid-row: ${index + 1};
  }`
  }).join('\n  ')}
}`
    }

    return css
  }, [generateCSS, gridAreas, responsiveBreakpoints])

  const generateTailwindCSS = useCallback(() => {
    if (gridAreas.length === 0) return ''

    const tailwindClasses = [
      'grid',
      `grid-cols-${columns}`,
      gap === '16px' ? 'gap-4' : gap === '8px' ? 'gap-2' : gap === '24px' ? 'gap-6' : gap === '32px' ? 'gap-8' : 'gap-4'
    ]

    let tailwindOutput = `<div class="${tailwindClasses.join(' ')}">
${gridAreas.map(area => `  <div class="${area.name}">${area.name.charAt(0).toUpperCase() + area.name.slice(1)}</div>`).join('\n')}
</div>`

    if (gridAreas.length > 0) {
      tailwindOutput += '\n\n/* Custom grid area classes */\n'
      gridAreas.forEach(area => {
        const colSpan = area.colEnd - area.colStart
        const rowSpan = area.rowEnd - area.rowStart
        const classes = [
          `col-span-${colSpan}`,
          rowSpan > 1 ? `row-span-${rowSpan}` : ''
        ].filter(Boolean).join(' ')
        tailwindOutput += `.${area.name} { @apply ${classes}; }\n`
      })
    }

    return tailwindOutput
  }, [columns, gap, gridAreas])

  const generateSCSS = useCallback(() => {
    let scss = `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
  gap: ${gap};
`

    if (gridAreas.length > 0) {
      scss += `
  grid-template-areas:
${generateGridTemplateAreas()};
}

${gridAreas.map(area => `.${area.name} {
  grid-area: ${area.name};
}`).join('\n\n')}`
    } else {
      scss += '\n}'
    }

    return scss
  }, [columns, rows, gap, gridAreas, generateGridTemplateAreas])

  const generateHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Grid Layout</title>
  <style>
${generateResponsiveCSS()}
  </style>
</head>
<body>
  <div class="grid-container">
${gridAreas.map(area => `    <div class="${area.name}">${area.name.charAt(0).toUpperCase() + area.name.slice(1)}</div>`).join('\n')}
  </div>
</body>
</html>`

    return html
  }, [gridAreas, generateResponsiveCSS])

  const getExportContent = useCallback(() => {
    switch (exportFormat) {
      case 'tailwind':
        return generateTailwindCSS()
      case 'scss':
        return generateSCSS()
      case 'html':
        return generateHTML()
      default:
        return generateResponsiveCSS()
    }
  }, [exportFormat, generateTailwindCSS, generateSCSS, generateHTML, generateResponsiveCSS])

  const getResponsiveGridConfig = () => {
    switch (viewportMode) {
      case 'tablet':
        return {
          columns: 2,
          rows: Math.ceil(gridAreas.length / 2),
          areas: gridAreas.map((area: GridArea, index) => ({
            ...area,
            colStart: (index % 2) + 1,
            colEnd: (index % 2) + 2,
            rowStart: Math.floor(index / 2) + 1,
            rowEnd: Math.floor(index / 2) + 2
          }))
        }
      case 'mobile':
        return {
          columns: 1,
          rows: gridAreas.length,
          areas: gridAreas.map((area: GridArea, index) => ({
            ...area,
            colStart: 1,
            colEnd: 2,
            rowStart: index + 1,
            rowEnd: index + 2
          }))
        }
      default:
        return { columns, rows, areas: gridAreas }
    }
  }

  const handleCellMouseDown = (row: number, col: number) => {
    setIsDrawing(true)
    setStartCell({ row, col })
    setSelectedArea(null)
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isDrawing && startCell) {
      const newArea: GridArea = {
        id: `area-${Date.now()}`,
        name: `area${gridAreas.length + 1}`,
        rowStart: Math.min(startCell.row, row) + 1,
        rowEnd: Math.max(startCell.row, row) + 2,
        colStart: Math.min(startCell.col, col) + 1,
        colEnd: Math.max(startCell.col, col) + 2,
        color: areaColors[gridAreas.length % areaColors.length]
      }

      setGridAreas(prev => {
        const filtered = prev.filter(area =>
          !(area.rowStart <= newArea.rowEnd - 1 && area.rowEnd - 1 >= newArea.rowStart - 1 &&
            area.colStart <= newArea.colEnd - 1 && area.colEnd - 1 >= newArea.colStart - 1)
        )
        return [...filtered, newArea]
      })
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setStartCell(null)
  }

  const addGridArea = () => {
    const newArea: GridArea = {
      id: `area-${Date.now()}`,
      name: `area${gridAreas.length + 1}`,
      rowStart: 1,
      rowEnd: 2,
      colStart: 1,
      colEnd: 2,
      color: areaColors[gridAreas.length % areaColors.length]
    }
    setGridAreas(prev => [...prev, newArea])
  }

  const deleteGridArea = (id: string) => {
    setGridAreas(prev => prev.filter(area => area.id !== id))
    if (selectedArea === id) setSelectedArea(null)
  }

  const updateAreaName = (id: string, name: string) => {
    setGridAreas(prev => prev.map(area =>
      area.id === id ? { ...area, name } : area
    ))
  }

  const saveLayout = () => {
    const layout = {
      id: Date.now().toString(),
      name: `Grid Layout ${new Date().toLocaleDateString()}`,
      columns,
      rows,
      gap,
      gridAreas,
      responsiveBreakpoints,
      createdAt: new Date().toISOString()
    }

    const savedLayouts = JSON.parse(localStorage.getItem('css-grid-layouts') || '[]')
    savedLayouts.push(layout)
    localStorage.setItem('css-grid-layouts', JSON.stringify(savedLayouts))

    alert('Layout saved successfully!')
  }

  const generateShareLink = () => {
    const layoutData = {
      columns,
      rows,
      gap,
      gridAreas,
      responsiveBreakpoints
    }

    const encodedData = btoa(JSON.stringify(layoutData))
    const shareUrl = `${window.location.origin}${window.location.pathname}#layout=${encodedData}`

    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!')
    })
  }

  const loadSharedLayout = () => {
    const hash = window.location.hash
    if (hash.startsWith('#layout=')) {
      try {
        const encodedData = hash.substring(8)
        const layoutData = JSON.parse(atob(encodedData))

        setColumns(layoutData.columns || 3)
        setRows(layoutData.rows || 3)
        setGap(layoutData.gap || '16px')
        setGridAreas(layoutData.gridAreas || [])
        setResponsiveBreakpoints(layoutData.responsiveBreakpoints || {
          tablet: '768px',
          mobile: '480px'
        })
      } catch (error) {
        console.error('Failed to load shared layout:', error)
      }
    }
  }

  // Load shared layout on component mount
  useEffect(() => {
    loadSharedLayout()
  }, [])

  const handleCopy = () => {
    copyToClipboard(getExportContent())
  }

  const handleDownload = () => {
    const blob = new Blob([getExportContent()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grid-layout.${exportFormat === 'html' ? 'html' : exportFormat === 'css' ? 'css' : exportFormat === 'scss' ? 'scss' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderGrid = () => {
    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const area = gridAreas.find(a =>
          r >= a.rowStart - 1 && r < a.rowEnd - 1 &&
          c >= a.colStart - 1 && c < a.colEnd - 1
        )

        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-gray-300 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors",
              area ? "text-white" : "text-gray-400 hover:bg-gray-100",
              selectedArea === area?.id ? "ring-2 ring-blue-500" : ""
            )}
            style={{
              backgroundColor: area?.color || 'transparent',
              gridRow: r + 1,
              gridColumn: c + 1
            }}
            onMouseDown={() => handleCellMouseDown(r, c)}
            onMouseEnter={() => handleCellMouseEnter(r, c)}
            onClick={() => area && setSelectedArea(area.id)}
          >
            {area?.name || '.'}
          </div>
        )
      }
    }
    return cells
  }

  return (
    <ToolLayout
      title="CSS Grid Generator"
      description="Create responsive CSS Grid layouts with drag-and-drop visual builder."
      icon={Grid3X3}
      onCopy={handleCopy}
      onDownload={handleDownload}
    >
      <div className="space-y-8">
        {/* Live HTML + CSS Preview */}
        <div className="glass rounded-[2.5rem] p-6">
          <h3 className="text-lg font-bold mb-4">Live HTML Preview</h3>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Generated HTML:</div>
            <div className="bg-gray-50 p-4 rounded-lg border text-sm font-mono overflow-x-auto">
              <pre>{`<div class="grid-container">
${gridAreas.map(area => `  <div class="${area.name}">${area.name.charAt(0).toUpperCase() + area.name.slice(1)}</div>`).join('\n')}
</div>`}</pre>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <style dangerouslySetInnerHTML={{
              __html: generateResponsiveCSS()
            }} />
            <div
              className="grid-container border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50"
              style={{
                minHeight: '200px',
                display: 'grid'
              }}
            >
              {gridAreas.map(area => (
                <div
                  key={`preview-${area.id}`}
                  className={cn(area.name, "p-3 border border-white rounded-lg flex items-center justify-center text-sm font-medium text-white shadow-sm")}
                  style={{
                    backgroundColor: area.color,
                    minHeight: '40px'
                  }}
                >
                  {area.name.charAt(0).toUpperCase() + area.name.slice(1)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            This preview shows exactly how your grid layout will render in a browser.
            Each colored area represents a grid item with the generated CSS applied.
          </div>
        </div>

        {/* Export Options */}
        <div className="glass rounded-[2.5rem] p-6">
          <h3 className="text-lg font-bold mb-4">Export Options</h3>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setExportFormat('css')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                exportFormat === 'css' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              <Code className="w-4 h-4" />
              CSS
            </button>
            <button
              onClick={() => setExportFormat('tailwind')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                exportFormat === 'tailwind' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              <FileText className="w-4 h-4" />
              Tailwind
            </button>
            <button
              onClick={() => setExportFormat('scss')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                exportFormat === 'scss' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              <FileText className="w-4 h-4" />
              SCSS
            </button>
            <button
              onClick={() => setExportFormat('html')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                exportFormat === 'html' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              )}
            >
              <FileText className="w-4 h-4" />
              HTML
            </button>
            <div className="flex gap-2 ml-4">
              <button
                onClick={saveLayout}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={generateShareLink}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-purple-500 text-white hover:bg-purple-600"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
            <code>{getExportContent()}</code>
          </div>
        </div>

        {/* Grid Controls */}
        <div className="glass rounded-[2.5rem] p-6">
          <h3 className="text-lg font-bold mb-4">Grid Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-bold">Columns: {columns}</label>
              <input
                type="range"
                min="1"
                max="12"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-bold">Rows: {rows}</label>
              <input
                type="range"
                min="1"
                max="12"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-bold">Gap</label>
              <select
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl"
              >
                <option value="4px">4px</option>
                <option value="8px">8px</option>
                <option value="16px">16px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Grid Builder */}
        <div className="glass rounded-[2.5rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Visual Grid Builder</h3>
            <button
              onClick={addGridArea}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Area
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Click and drag to create grid areas, or use the Add Area button.
          </div>

          <div
            className="grid gap-1 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              maxWidth: '600px',
              aspectRatio: `${columns}/${rows}`
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {renderGrid()}
          </div>
        </div>

        {/* Grid Areas Editor */}
        {gridAreas.length > 0 && (
          <div className="glass rounded-[2.5rem] p-6">
            <h3 className="text-lg font-bold mb-4">Grid Areas</h3>
            <div className="space-y-3">
              {gridAreas.map(area => (
                <div
                  key={area.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    selectedArea === area.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: area.color }}
                  />
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => updateAreaName(area.id, e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Area name"
                  />
                  <span className="text-sm text-gray-500">
                    {area.colStart}-{area.colEnd - 1}, {area.rowStart}-{area.rowEnd - 1}
                  </span>
                  <button
                    onClick={() => deleteGridArea(area.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Grid Preview */}
        <div className="glass rounded-[2.5rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Responsive Preview</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewportMode('desktop')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  viewportMode === 'desktop' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  viewportMode === 'tablet' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
              >
                📱 Tablet
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  viewportMode === 'mobile' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Breakpoints:</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tablet:</label>
                <input
                  type="text"
                  value={responsiveBreakpoints.tablet}
                  onChange={(e) => setResponsiveBreakpoints((prev: {tablet: string, mobile: string}) => ({ ...prev, tablet: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="768px"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mobile:</label>
                <input
                  type="text"
                  value={responsiveBreakpoints.mobile}
                  onChange={(e) => setResponsiveBreakpoints((prev: {tablet: string, mobile: string}) => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="480px"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${getResponsiveGridConfig().columns}, 1fr)`,
                gridTemplateRows: `repeat(${getResponsiveGridConfig().rows}, 1fr)`,
                maxWidth: viewportMode === 'mobile' ? '200px' : viewportMode === 'tablet' ? '400px' : '600px',
                aspectRatio: `${getResponsiveGridConfig().columns}/${getResponsiveGridConfig().rows}`
              }}
            >
              {getResponsiveGridConfig().areas.map(area => (
                <div
                  key={`${viewportMode}-${area.id}`}
                  className="border border-gray-300 flex items-center justify-center text-xs font-medium text-white rounded"
                  style={{
                    backgroundColor: area.color,
                    gridColumn: `${area.colStart} / ${area.colEnd}`,
                    gridRow: `${area.rowStart} / ${area.rowEnd}`
                  }}
                >
                  {area.name}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Preview shows how your grid adapts to different screen sizes.
            {viewportMode === 'desktop' && " Desktop: Full layout with all areas"}
            {viewportMode === 'tablet' && " Tablet: 2-column layout"}
            {viewportMode === 'mobile' && " Mobile: Single column layout"}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
