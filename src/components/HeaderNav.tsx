import { 
  Play, 
  Network, 
  Shield, 
  Settings, 
  FileCode, 
  Activity,
  Layers,
  Workflow,
  Sun,
  Moon,
  FolderOpen,
  Save
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type MainNavTab = 'continuum' | 'workflow' | 'trust_matrix' | 'settings' | 'export';

interface Props {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenDryRun: () => void;
  totalInstances: number;
  onOpenProjectModal: (mode: 'open' | 'save') => void;
}

export const HeaderNav: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenDryRun,
  totalInstances,
  onOpenProjectModal
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 backdrop-blur-md z-30 shrink-0 shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); onSelectTab('continuum'); }}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
            <Network className="w-4 h-4" />
          </div>
          <span>CloudEdge Studio</span>
        </a>
        <span className="hidden lg:inline text-slate-300 dark:text-slate-600">/</span>
        <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          {totalInstances} Continuum Nodes
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => onSelectTab('continuum')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'continuum' 
              ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Cloud-Edge Continuum
        </button>

        <button
          onClick={() => onSelectTab('workflow')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'workflow' 
              ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Workflow className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          Computational Workflow (BPMN)
        </button>

        <button
          onClick={() => onSelectTab('trust_matrix')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'trust_matrix' 
              ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Trust Matrix
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'settings' 
              ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Simulation Engine
        </button>

        <button
          onClick={() => onSelectTab('export')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'export' 
              ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Export Schema &amp; XML
        </button>
      </nav>

      {/* Zone 3: Project Actions + Theme Toggle + Simulate */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => onOpenProjectModal('open')}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-xs"
            title="Open project from file (.json), browser snapshot, or benchmark preset"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Open</span>
          </button>

          <button
            onClick={() => onOpenProjectModal('save')}
            className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-xs"
            title="Save project to file (.json) or browser snapshot"
          >
            <Save className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Save</span>
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        <button
          onClick={onOpenDryRun}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>
      </div>
    </header>
  );
};
