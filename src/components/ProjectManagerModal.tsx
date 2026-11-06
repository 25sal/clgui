import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Save, 
  FolderOpen, 
  FileCode, 
  Trash2, 
  Clock, 
  Check, 
  Layers, 
  Sparkles,
  AlertCircle,
  HardDrive,
  Copy
} from 'lucide-react';
import { SimulationGroup, SimulationGlobalConfig, ResourceType, InterGroupTrustLink, FederatedAlgorithm } from '../types/simulation';
import { WorkflowDefinition } from '../types/workflow';
import { TEMPLATE_CONFIGS } from '../data/resourceCatalog';

export interface ProjectData {
  schemaVersion: string;
  projectName: string;
  savedAt: string;
  config: SimulationGlobalConfig;
  groups: SimulationGroup[];
  catalog: ResourceType[];
  trustLinks: InterGroupTrustLink[];
  workflows: WorkflowDefinition[];
  activeWorkflowId?: string;
}

interface SavedBrowserSlot {
  id: string;
  name: string;
  savedAt: string;
  nodeCount: number;
  data: ProjectData;
}

const LOCAL_STORAGE_KEY = 'cloudedge_saved_projects_v2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: SimulationGroup[];
  config: SimulationGlobalConfig;
  catalog: ResourceType[];
  trustLinks: InterGroupTrustLink[];
  workflows: WorkflowDefinition[];
  activeWorkflowId: string;
  onLoadProject: (project: ProjectData) => void;
  onLoadTemplate: (templateId: string) => void;
  initialMode?: 'open' | 'save';
}

export const ProjectManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  groups,
  config,
  catalog,
  trustLinks,
  workflows,
  activeWorkflowId,
  onLoadProject,
  onLoadTemplate,
  initialMode = 'save'
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'open' | 'templates'>(initialMode);
  const [projectTitle, setProjectTitle] = useState(config.simulationName || 'My Distributed Simulation');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedJson, setPastedJson] = useState('');
  const [savedSlots, setSavedSlots] = useState<SavedBrowserSlot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load browser storage slots
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        setSavedSlots(JSON.parse(raw));
      }
    } catch {
      // Ignore parse error
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build current project payload
  const currentProjectData: ProjectData = {
    schemaVersion: '2.0.0',
    projectName: projectTitle.trim() || 'Distributed Simulation',
    savedAt: new Date().toISOString(),
    config: {
      ...config,
      simulationName: projectTitle.trim() || config.simulationName
    },
    groups,
    catalog,
    trustLinks,
    workflows,
    activeWorkflowId
  };

  const currentProjectJson = JSON.stringify(currentProjectData, null, 2);

  // 1. Download as .project.json
  const handleDownloadFile = () => {
    const filename = `${projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.project.json`;
    const blob = new Blob([currentProjectJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setSaveSuccessMsg(`Project downloaded as "${filename}"`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // 2. Save snapshot to browser storage
  const handleSaveToBrowserStorage = () => {
    try {
      const totalNodes = groups.reduce((acc, g) => acc + (g.totalInstances || 0), 0);
      const newSlot: SavedBrowserSlot = {
        id: `slot-${Date.now()}`,
        name: projectTitle.trim() || 'Untitled Project',
        savedAt: new Date().toISOString(),
        nodeCount: totalNodes,
        data: currentProjectData
      };

      const updated = [newSlot, ...savedSlots.slice(0, 9)];
      setSavedSlots(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      setSaveSuccessMsg(`Project saved to browser storage slots.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMessage(`Failed to save to browser: ${err.message || 'Storage full'}`);
    }
  };

  // 3. Delete browser slot
  const handleDeleteSlot = (slotId: string) => {
    const updated = savedSlots.filter(s => s.id !== slotId);
    setSavedSlots(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // 4. File input upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        validateAndLoadProject(parsed, file.name);
      } catch (err: any) {
        setErrorMessage(`Invalid JSON project file: ${err.message}`);
      }
    };
    reader.onerror = () => setErrorMessage('Error reading uploaded file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  // 5. Load from pasted text
  const handleLoadPasted = () => {
    setErrorMessage(null);
    if (!pastedJson.trim()) return;
    try {
      const parsed = JSON.parse(pastedJson.trim());
      validateAndLoadProject(parsed, 'Pasted JSON');
    } catch (err: any) {
      setErrorMessage(`Failed to parse JSON: ${err.message}`);
    }
  };

  // Shared validator & loader
  const validateAndLoadProject = (parsed: any, sourceName: string) => {
    // Check if format is unified ProjectData or legacy schema export
    let reconstructedGroups: SimulationGroup[] = [];
    let reconstructedConfig: SimulationGlobalConfig = { ...config };
    let reconstructedCatalog: ResourceType[] = [...catalog];
    let reconstructedLinks: InterGroupTrustLink[] = [];
    let reconstructedWorkflows: WorkflowDefinition[] = [...workflows];
    let reconstructedActiveWfId: string = activeWorkflowId;

    if (parsed.groups && Array.isArray(parsed.groups)) {
      // Standard ProjectData format
      reconstructedGroups = parsed.groups;
      if (parsed.config) reconstructedConfig = { ...config, ...parsed.config };
      if (parsed.catalog && Array.isArray(parsed.catalog)) reconstructedCatalog = parsed.catalog;
      if (parsed.trustLinks && Array.isArray(parsed.trustLinks)) reconstructedLinks = parsed.trustLinks;
      if (parsed.workflows && Array.isArray(parsed.workflows) && parsed.workflows.length > 0) {
        reconstructedWorkflows = parsed.workflows;
        reconstructedActiveWfId = parsed.activeWorkflowId || parsed.workflows[0].id;
      }
    } else if (parsed.distributedGroups && Array.isArray(parsed.distributedGroups)) {
      // Legacy ConfigExport JSON format
      reconstructedGroups = parsed.distributedGroups.map((g: any, index: number) => ({
        id: g.id || `grp-imported-${index}`,
        name: g.name || `Imported Group ${index + 1}`,
        role: g.role || 'training_node',
        hierarchyLevel: g.hierarchyTier || 3,
        parentId: g.parentAggregatorId ?? null,
        resourceSelectionMode: g.sizing?.resourceSelectionMode || 'single',
        sizingMode: g.sizing?.mode || 'total',
        totalInstances: g.sizing?.totalInstances || 10,
        resourceAllocations: (g.resourceAllocations || []).map((a: any) => ({
          resourceTypeId: a.resourceTypeId,
          instances: a.instances || 1,
          weightPercent: 100
        })),
        trustLevel: g.trustPolicy?.level || 'semi_honest',
        customTrustScore: g.trustPolicy?.score ?? 0.8,
        filterIntervals: g.filterIntervals || {
          computeMin: 0,
          computeMax: 2000,
          bandwidthMin: 0,
          bandwidthMax: 400000,
          availabilityMin: 70,
          availabilityMax: 100
        },
        position: g.position || { x: 200 + (index * 60), y: 150 + (index * 50) },
        notes: g.notes || ''
      }));

      if (parsed.simulationMetadata) {
        reconstructedConfig = {
          ...config,
          simulationName: parsed.simulationMetadata.name || config.simulationName,
          federatedAlgorithm: (parsed.simulationMetadata.algorithm || config.federatedAlgorithm) as FederatedAlgorithm,
          globalRounds: parsed.simulationMetadata.rounds || config.globalRounds,
          localEpochs: parsed.simulationMetadata.localEpochs || config.localEpochs,
          batchSize: parsed.simulationMetadata.batchSize || config.batchSize
        };
      }
      if (parsed.interGroupTrustMatrix && Array.isArray(parsed.interGroupTrustMatrix)) {
        reconstructedLinks = parsed.interGroupTrustMatrix;
      }
    } else {
      throw new Error('Unrecognized project schema. File must contain "groups" or "distributedGroups" array.');
    }

    onLoadProject({
      schemaVersion: '2.0.0',
      projectName: parsed.projectName || reconstructedConfig.simulationName || 'Loaded Project',
      savedAt: new Date().toISOString(),
      groups: reconstructedGroups,
      config: reconstructedConfig,
      catalog: reconstructedCatalog,
      trustLinks: reconstructedLinks,
      workflows: reconstructedWorkflows,
      activeWorkflowId: reconstructedActiveWfId
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Project Manager: Save &amp; Open
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Save complete Cloud-Edge continuum topologies and BPMN workflow activity schedules to a file or browser storage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('save')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'save'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              Save Project
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'open'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open Project
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Benchmark Presets
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {groups.length} groups · {workflows.length} workflows
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {saveSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SAVE PROJECT */}
          {activeTab === 'save' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. EU Regional Health Federated Simulation"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This title identifies the simulation run and sets the exported file prefix.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Save Option 1: File Download */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Download className="w-4 h-4" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                        Download Project File (.json)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Saves your complete workspace to your computer. You can upload this file anytime on any computer to restore your exact topology, trust links, and BPMN scheduling.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadFile}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download .project.json
                  </button>
                </div>

                {/* Save Option 2: Browser Storage Slot */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <HardDrive className="w-4 h-4" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                        Quick Save to Browser Storage
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Saves a working snapshot directly into your browser's local cache. Quick and persistent across page refreshes.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveToBrowserStorage}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Save Browser Snapshot
                  </button>
                </div>
              </div>

              {/* Saved Browser Snapshots List */}
              {savedSlots.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Recent Browser Saved Snapshots ({savedSlots.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {savedSlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{slot.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(slot.savedAt).toLocaleDateString()} {new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>·</span>
                            <span>{slot.nodeCount} nodes</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onLoadProject(slot.data);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-[11px] transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPEN PROJECT */}
          {activeTab === 'open' && (
            <div className="space-y-5">
              {/* File Upload Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Click to Browse or Drag &amp; Drop a Project File
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Accepts <code className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">*.project.json</code> or exported simulation config files.
                </p>
              </div>

              {/* Paste JSON Fallback */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Or Paste Project JSON Directly:
                  </label>
                  {pastedJson.trim() && (
                    <button
                      onClick={() => setPastedJson('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="Paste JSON project content here..."
                  className="w-full p-2.5 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleLoadPasted}
                    disabled={!pastedJson.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Load Pasted Project
                  </button>
                </div>
              </div>

              {/* Browser Saved Projects */}
              {savedSlots.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Saved in Browser Storage
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {savedSlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{slot.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(slot.savedAt).toLocaleDateString()} {new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>·</span>
                            <span>{slot.nodeCount} nodes</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onLoadProject(slot.data);
                            onClose();
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition-colors"
                        >
                          Open Snapshot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BENCHMARK PRESETS */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Load predefined distributed system benchmark topologies for federated learning and Edge-Cloud continuum simulations:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEMPLATE_CONFIGS.map(t => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                          {t.groups.length} Groups
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {t.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onLoadTemplate(t.id);
                        onClose();
                      }}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 mt-2"
                    >
                      Load Benchmark Preset
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current project has <strong className="text-slate-900 dark:text-white font-mono">{groups.length}</strong> groups &amp; <strong className="text-slate-900 dark:text-white font-mono">{groups.reduce((acc, g) => acc + (g.totalInstances || 0), 0)}</strong> node instances.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
