import { ToolLayout } from './ToolLayout';
import { Layout, Plus, Minus, Copy, Eye, EyeOff, Grid3X3, Download } from 'lucide-react';
import { copyToClipboard, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentState } from '../../lib/storage';

export function FlexTool() {
  const [itemCount, setItemCount] = usePersistentState('flexbox_item_count', 4);
  const [showGrid, setShowGrid] = usePersistentState('flexbox_show_grid', false);
  const [showCode, setShowCode] = usePersistentState('flexbox_show_code', true);

  const [containerStyle, setContainerStyle] = usePersistentState(
    'flexbox_container_style',
    {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      alignContent: 'stretch',
      gap: '16px',
    }
  );

  // ✅ FIXED: CSS generator
  const generateCss = () => {
    return `/* Flex Container Styling */
.flex-container {
  display: ${containerStyle.display};
  flex-direction: ${containerStyle.flexDirection};
  flex-wrap: ${containerStyle.flexWrap};
  justify-content: ${containerStyle.justifyContent};
  align-items: ${containerStyle.alignItems};
  align-content: ${containerStyle.alignContent};
  gap: ${containerStyle.gap};
}`;
  };

  // ✅ FIXED: missing options
  const options = {
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
    justifyContent: [
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
      'space-evenly',
    ],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    alignContent: [
      'stretch',
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
    ],
  };

  return (
    <ToolLayout
      title="Flexbox Builder"
      description="Visually design flexbox layouts and generate CSS."
      icon={Layout}
      onReset={() => {
        setItemCount(4);
        setContainerStyle({
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          alignContent: 'stretch',
          gap: '16px',
        });
      }}
      onCopy={() => copyToClipboard(generateCss())}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 glass rounded-2xl border">
          <div className="flex items-center space-x-3">
            <Layout className="w-6 h-6 text-brand" />
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-[var(--text-primary)]">CSS Flexbox Generator</h2>
              <p className="text-sm text-[var(--text-muted)]">Visually design layouts and generate production-ready CSS</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                showCode ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              {showCode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showCode ? 'Show Preview' : 'Show Code'}</span>
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center space-x-2",
                showGrid ? "brand-gradient text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 🔧 Controls */}
        <div className="space-y-6">
          <div className="p-6 glass rounded-2xl border space-y-6">
            {/* Item Count */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-secondary)]"
              >
                <Minus />
              </button>
              <span className="font-mono font-black text-lg text-[var(--text-primary)]">{itemCount} Items</span>
              <button 
                onClick={() => setItemCount(Math.min(20, itemCount + 1))}
                className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-secondary)]"
              >
                <Plus />
              </button>
            </div>

            {/* Flex Options */}
            {Object.entries(options).map(([prop, values]) => (
              <div key={prop} className="space-y-3">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">
                  {prop.replace(/([A-Z])/g, ' $1')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {values.map((val) => (
                    <button
                      key={val}
                      onClick={() =>
                        setContainerStyle((prev: any) => ({
                          ...prev,
                          [prop]: val,
                        }))
                      }
                      className={cn(
                        "px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                        (containerStyle as any)[prop] === val
                          ? "brand-gradient text-white border-transparent shadow-lg"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-brand/40"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Gap Slider */}
            <div className="space-y-3">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Gap Spacing</label>
              <input
                type="range"
                min="0"
                max="64"
                value={parseInt(containerStyle.gap)}
                onChange={(e) =>
                  setContainerStyle((prev: any) => ({
                    ...prev,
                    gap: `${e.target.value}px`,
                  }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>0px</span>
                <span className="text-brand font-black">{containerStyle.gap}</span>
                <span>64px</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 Preview & Code */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <div className="p-6 glass rounded-2xl border relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Live Preview</span>
            </div>
            
            <div
              className="w-full h-full mt-8 rounded-2xl border border-dashed border-[var(--border-primary)] p-4 bg-black/5 dark:bg-white/5 relative"
              style={containerStyle as any}
            >
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="h-full w-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #3b82f6 19px, #3b82f6 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #3b82f6 19px, #3b82f6 20px)' }}></div>
                </div>
              )}
              <AnimatePresence>
                {Array.from({ length: itemCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="min-w-[80px] min-h-[80px] brand-gradient rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/20"
                  >
                    {i + 1}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Code Output */}
          <div className="relative">
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(generateCss())}
                className="flex items-center space-x-2 px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand hover:scale-105 active:scale-95 transition-all bg-white dark:bg-black border-[var(--border-primary)]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
              <button
                onClick={() => {
                  const data = {
                    container: containerStyle,
                    itemCount,
                    timestamp: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `flexbox-layout-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center space-x-2 px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand hover:scale-105 active:scale-95 transition-all bg-white dark:bg-black border-[var(--border-primary)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
            
            <div className="p-6 glass rounded-2xl bg-[#0d1117] border-[#30363d] overflow-hidden">
              <pre className="font-mono text-xs md:text-sm text-blue-300 overflow-auto custom-scrollbar leading-relaxed">
                {generateCss()}
              </pre>
            </div>
          </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}