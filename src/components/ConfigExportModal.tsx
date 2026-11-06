import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Upload, 
  FileText,
  Layers,
  Database,
  Workflow
} from 'lucide-react';
import { SimulationGroup, SimulationGlobalConfig, ResourceType, InterGroupTrustLink, FederatedAlgorithm } from '../types/simulation';
import { WorkflowDefinition } from '../types/workflow';
import { generateBsimGlobalXml, generateBsimConfigXml } from '../utils/bsimXmlGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: SimulationGroup[];
  config: SimulationGlobalConfig;
  catalog: ResourceType[];
  trustLinks: InterGroupTrustLink[];
  currentWorkflow?: WorkflowDefinition;
  onImportConfig: (imported: {
    groups: SimulationGroup[];
    config: SimulationGlobalConfig;
  }) => void;
}

export const ConfigExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  groups,
  config,
  catalog,
  trustLinks,
  currentWorkflow,
  onImportConfig
}) => {
  // Format options: 'bsim_global' | 'bsim_config' | 'json' | 'yaml'
  const [activeFormat, setActiveFormat] = useState<'bsim_global' | 'bsim_config' | 'json' | 'yaml'>('bsim_global');
  const [copied, setCopied] = useState(false);
  const [filenamePrefix, setFilenamePrefix] = useState(config.bsimId || 'proxycache');
  const [importText, setImportText] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Generate [filename].global.xml
  const bsimGlobalXml = generateBsimGlobalXml(groups, catalog, config, filenamePrefix);

  // 2. Generate [filename].config.xml
  const bsimConfigXml = currentWorkflow 
    ? generateBsimConfigXml(currentWorkflow, groups, catalog, config, filenamePrefix)
    : `<!-- No active workflow selected. Please select a BPMN workflow in the Computational Workflow tab -->`;

  // 3. JSON Export
  const exportPayload = {
    schemaVersion: '2.0.0',
    exportTimestamp: new Date().toISOString(),
    simulationMetadata: {
      name: config.simulationName,
      algorithm: config.federatedAlgorithm,
      rounds: config.globalRounds,
      localEpochs: config.localEpochs,
      batchSize: config.batchSize,
      learningRate: config.learningRate,
      networkConditions: config.simulatedNetworkConditions,
      bsim: {
        id: filenamePrefix,
        randomSeed: config.bsimRandomSeed ?? 42,
        processInstances: config.bsimProcessInstances ?? 2000,
        arrivalRateMean: config.bsimArrivalRateMean ?? 50
      }
    },
    distributedGroups: groups.map(g => ({
      id: g.id,
      name: g.name,
      role: g.role,
      hierarchyTier: g.hierarchyLevel,
      parentAggregatorId: g.parentId,
      sizing: {
        mode: g.sizingMode,
        totalInstances: g.totalInstances,
        resourceSelectionMode: g.resourceSelectionMode
      },
      trustPolicy: {
        level: g.trustLevel,
        score: g.customTrustScore
      },
      filterIntervals: g.filterIntervals,
      resourceAllocations: g.resourceAllocations.map(a => {
        const res = catalog.find(r => r.id === a.resourceTypeId);
        return {
          resourceTypeId: a.resourceTypeId,
          resourceName: res?.name || 'Unknown',
          instances: a.instances,
          computePowerTFlops: res?.computePowerTFlops || 0,
          bandwidthMbps: res?.bandwidthMbps || 0,
          availabilityPercent: res?.availabilityPercent || 0,
          cpuSpeed: res?.cpuSpeed,
          ioRead: res?.ioRead
        };
      })
    })),
    interGroupTrustMatrix: trustLinks,
    activeWorkflowActivitiesMatch: currentWorkflow?.activityConstraints || {}
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  // 4. YAML serialization
  const yamlString = (() => {
    let str = `# Simulation Configuration Export\n`;
    str += `version: "2.0.0"\n`;
    str += `bsim_prefix: "${filenamePrefix}"\n`;
    str += `simulation:\n`;
    str += `  name: "${config.simulationName}"\n`;
    str += `  algorithm: "${config.federatedAlgorithm}"\n`;
    str += `  rounds: ${config.globalRounds}\n`;
    str += `groups:\n`;
    groups.forEach(g => {
      str += `  - id: "${g.id}"\n`;
      str += `    name: "${g.name}"\n`;
      str += `    role: "${g.role}"\n`;
      str += `    instances: ${g.totalInstances}\n`;
    });
    return str;
  })();

  const activeContent = activeFormat === 'bsim_global' 
    ? bsimGlobalXml 
    : activeFormat === 'bsim_config' 
    ? bsimConfigXml 
    : activeFormat === 'json' 
    ? jsonString 
    : yamlString;

  const currentFilename = activeFormat === 'bsim_global'
    ? `${filenamePrefix}.global.xml`
    : activeFormat === 'bsim_config'
    ? `${filenamePrefix}.config.xml`
    : activeFormat === 'json'
    ? `${filenamePrefix}_config.json`
    : `${filenamePrefix}_config.yaml`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mime = activeFormat === 'json' ? 'application/json' : activeFormat === 'yaml' ? 'text/yaml' : 'application/xml';
    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBothXml = () => {
    // Download .global.xml
    const blobGlobal = new Blob([bsimGlobalXml], { type: 'application/xml' });
    const urlGlobal = URL.createObjectURL(blobGlobal);
    const a1 = document.createElement('a');
    a1.href = urlGlobal;
    a1.download = `${filenamePrefix}.global.xml`;
    a1.click();
    URL.revokeObjectURL(urlGlobal);

    // Download .config.xml with small delay
    setTimeout(() => {
      const blobConfig = new Blob([bsimConfigXml], { type: 'application/xml' });
      const urlConfig = URL.createObjectURL(blobConfig);
      const a2 = document.createElement('a');
      a2.href = urlConfig;
      a2.download = `${filenamePrefix}.config.xml`;
      a2.click();
      URL.revokeObjectURL(urlConfig);
    }, 250);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.distributedGroups || !Array.isArray(parsed.distributedGroups)) {
        throw new Error('Invalid schema: Missing distributedGroups array.');
      }

      const reconstructedGroups: SimulationGroup[] = parsed.distributedGroups.map((g: any, index: number) => ({
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
        position: g.canvasPosition || { x: 200 + (index * 60), y: 150 + (index * 50) },
        notes: g.notes || ''
      }));

      const importedConfig: SimulationGlobalConfig = {
        ...config,
        simulationName: parsed.simulationMetadata?.name || config.simulationName,
        federatedAlgorithm: (parsed.simulationMetadata?.algorithm || config.federatedAlgorithm) as FederatedAlgorithm,
        globalRounds: parsed.simulationMetadata?.rounds || config.globalRounds,
        localEpochs: parsed.simulationMetadata?.localEpochs || config.localEpochs,
        batchSize: parsed.simulationMetadata?.batchSize || config.batchSize
      };

      onImportConfig({
        groups: reconstructedGroups,
        config: importedConfig
      });
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON configuration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Simulation Configuration &amp; XML Generator
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generates <code className="text-indigo-600 dark:text-indigo-300 font-mono font-medium">[filename].global.xml</code> (available resources) and <code className="text-indigo-600 dark:text-indigo-300 font-mono font-medium">[filename].config.xml</code> (activity-to-resource matching) for discrete-event workflow simulation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Filename Prefix & Tab Switcher */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filename Prefix Input */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Filename Prefix:</span>
              <input
                type="text"
                value={filenamePrefix}
                onChange={e => setFilenamePrefix(e.target.value.trim() || 'proxycache')}
                className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none w-28"
                placeholder="proxycache"
              />
            </div>

            {/* Format Selection Tabs */}
            {!isImportMode && (
              <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setActiveFormat('bsim_global')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeFormat === 'bsim_global' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{filenamePrefix}.global.xml</span>
                </button>

                <button
                  onClick={() => setActiveFormat('bsim_config')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeFormat === 'bsim_config' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>{filenamePrefix}.config.xml</span>
                </button>

                <button
                  onClick={() => setActiveFormat('json')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeFormat === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  JSON
                </button>

                <button
                  onClick={() => setActiveFormat('yaml')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeFormat === 'yaml' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  YAML
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setIsImportMode(!isImportMode);
                setImportError(null);
              }}
              className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              {isImportMode ? 'Back to XML Generator' : 'Import JSON'}
            </button>
          </div>

          {!isImportMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download {currentFilename}
              </button>

              <button
                onClick={handleDownloadBothXml}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                title="Download both [filename].global.xml and [filename].config.xml"
              >
                <Download className="w-3.5 h-3.5" />
                Download Both XML Files
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {isImportMode ? (
            <div className="flex-1 flex flex-col space-y-3">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Paste JSON Configuration Payload:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON exported from Studio..."
                className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
              />
              {importError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs font-mono">
                  {importError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1">
                <span>
                  {activeFormat === 'bsim_global' ? (
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">Global Resource Data Definition:</strong>
                  ) : activeFormat === 'bsim_config' ? (
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">Process Activity-to-Resource Assignment Match:</strong>
                  ) : (
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">Unified Schema Format:</strong>
                  )} {currentFilename}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                  {activeContent.split('\n').length} lines · {(activeContent.length / 1024).toFixed(1)} KB
                </span>
              </div>

              <pre className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-950 overflow-auto font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed select-all">
                {activeContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        {isImportMode && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setIsImportMode(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              Load & Apply Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
