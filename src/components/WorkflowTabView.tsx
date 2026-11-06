import React, { useState } from 'react';
import { 
  Play, 
  FileCode, 
  Upload, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Network, 
  Database, 
  Cpu, 
  Server,
  Download,
  Info,
  Check
} from 'lucide-react';
import { SimulationGroup, ResourceType, SimulationGlobalConfig } from '../types/simulation';
import { WorkflowDefinition, ActivityResourceConstraint } from '../types/workflow';
import { BpmnWorkflowViewer } from './BpmnWorkflowViewer';
import { ActivityResourceInspector } from './ActivityResourceInspector';
import { WorkflowSimulationModal } from './WorkflowSimulationModal';
import { generateBsimGlobalXml, generateBsimConfigXml } from '../utils/bsimXmlGenerator';

interface Props {
  groups: SimulationGroup[];
  catalog: ResourceType[];
  config: SimulationGlobalConfig;
  workflows: WorkflowDefinition[];
  activeWorkflowId: string;
  onSelectWorkflow: (id: string) => void;
  onUpdateWorkflows: React.Dispatch<React.SetStateAction<WorkflowDefinition[]>>;
}

export const WorkflowTabView: React.FC<Props> = ({ 
  groups, 
  catalog, 
  config,
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onUpdateWorkflows
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [showImportXmlModal, setShowImportXmlModal] = useState(false);
  const [customXmlInput, setCustomXmlInput] = useState('');
  const [showXmlExportModal, setShowXmlExportModal] = useState(false);
  const [activeXmlTab, setActiveXmlTab] = useState<'global' | 'config'>('global');
  const [copiedXml, setCopiedXml] = useState(false);
  const [filenamePrefix, setFilenamePrefix] = useState(config.bsimId || 'proxycache');

  const currentWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];
  const activityList = Object.values(currentWorkflow.activityConstraints);
  const selectedActivity = selectedActivityId ? currentWorkflow.activityConstraints[selectedActivityId] || null : null;

  // Handle activity update
  const handleUpdateActivity = (updated: ActivityResourceConstraint) => {
    onUpdateWorkflows(prev => prev.map(w => {
      if (w.id !== currentWorkflow.id) return w;
      return {
        ...w,
        activityConstraints: {
          ...w.activityConstraints,
          [updated.activityId]: updated
        }
      };
    }));
  };

  // Handle activity selection from BPMN viewer or list
  const handleSelectActivity = (activityId: string, activityName?: string) => {
    setSelectedActivityId(activityId);

    // If constraint does not exist yet for this activity (e.g. from custom imported BPMN), create a default one
    if (!currentWorkflow.activityConstraints[activityId]) {
      const newConstraint: ActivityResourceConstraint = {
        activityId,
        activityName: activityName || activityId,
        activityType: 'Task',
        candidateGroupIds: groups.slice(0, 2).map(g => g.id),
        allowedResourceTypes: [],
        placementStrategy: 'edge_preferred',
        requiredComputeTFlops: 1.0,
        requiredMemoryGB: 4,
        requiredBandwidthMbps: 50,
        maxLatencyMs: 100,
        priority: 'normal',
        estimatedDurationSec: 2.0,
        dataInputSizeMB: 10,
        dataOutputSizeMB: 2,
        bsimResources: [{ resourceId: 'proxy', amount: 1 }],
        bsimAttributes: [{ key: 'numInstructions', value: 2000 }]
      };
      handleUpdateActivity(newConstraint);
    }
  };

  // Continuum Tier Distribution statistics
  const tierCounts = activityList.reduce(
    (acc, act) => {
      const assignedGroup = groups.find(g => act.candidateGroupIds.includes(g.id));
      if (!assignedGroup) acc.unassigned++;
      else if (assignedGroup.hierarchyLevel === 1) acc.cloud++;
      else if (assignedGroup.hierarchyLevel === 2) acc.mec++;
      else acc.edge++;
      return acc;
    },
    { edge: 0, mec: 0, cloud: 0, unassigned: 0 }
  );

  // Import custom BPMN XML
  const handleImportXml = () => {
    if (!customXmlInput.trim()) return;
    const newWorkflow: WorkflowDefinition = {
      id: `wf-custom-${Date.now()}`,
      name: 'Custom User BPMN 2.0 Workflow',
      description: 'Imported BPMN diagram mapped to Cloud-Edge continuum resources.',
      bpmnXml: customXmlInput.trim(),
      activityConstraints: {}
    };
    onUpdateWorkflows(prev => [newWorkflow, ...prev]);
    onSelectWorkflow(newWorkflow.id);
    setShowImportXmlModal(false);
    setCustomXmlInput('');
  };

  // XML Generators
  const generatedGlobalXml = generateBsimGlobalXml(groups, catalog, config, filenamePrefix);
  const generatedConfigXml = generateBsimConfigXml(currentWorkflow, groups, catalog, config, filenamePrefix);

  const activeXmlText = activeXmlTab === 'global' ? generatedGlobalXml : generatedConfigXml;
  const activeXmlFilename = activeXmlTab === 'global' ? `${filenamePrefix}.global.xml` : `${filenamePrefix}.config.xml`;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(activeXmlText);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleDownloadActiveXml = () => {
    const blob = new Blob([activeXmlText], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeXmlFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBothXml = () => {
    const blobGlobal = new Blob([generatedGlobalXml], { type: 'application/xml' });
    const urlGlobal = URL.createObjectURL(blobGlobal);
    const a1 = document.createElement('a');
    a1.href = urlGlobal;
    a1.download = `${filenamePrefix}.global.xml`;
    a1.click();
    URL.revokeObjectURL(urlGlobal);

    setTimeout(() => {
      const blobConfig = new Blob([generatedConfigXml], { type: 'application/xml' });
      const urlConfig = URL.createObjectURL(blobConfig);
      const a2 = document.createElement('a');
      a2.href = urlConfig;
      a2.download = `${filenamePrefix}.config.xml`;
      a2.click();
      URL.revokeObjectURL(urlConfig);
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Workflow Subheader & Toolbar */}
      <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Workflow Model:
          </span>
          <select
            value={activeWorkflowId}
            onChange={(e) => {
              onSelectWorkflow(e.target.value);
              setSelectedActivityId(null);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none max-w-sm truncate"
          >
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowImportXmlModal(true)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            Import BPMN XML
          </button>
        </div>

        {/* Continuum Placement Distribution KPI */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Continuum Distribution:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-semibold">
              Edge: {tierCounts.edge}
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 text-[10px] font-semibold">
              MEC: {tierCounts.mec}
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-semibold">
              Cloud: {tierCounts.cloud}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowXmlExportModal(true)}
              className="px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Generate and view [filename].global.xml and [filename].config.xml"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Generate XML Files
            </button>
            <button
              onClick={() => setIsSimulationOpen(true)}
              className="px-4 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Simulate Scheduling
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: BPMN Viewer (center) + Activity Resource Inspector (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* BPMN Diagram Viewport */}
        <div className="flex-1 p-4 overflow-hidden relative flex flex-col">
          <BpmnWorkflowViewer
            xml={currentWorkflow.bpmnXml}
            activityConstraints={currentWorkflow.activityConstraints}
            groups={groups}
            catalog={catalog}
            selectedActivityId={selectedActivityId}
            onSelectActivity={handleSelectActivity}
          />
        </div>

        {/* Right Inspector Panel */}
        <ActivityResourceInspector
          activity={selectedActivity}
          groups={groups}
          catalog={catalog}
          onUpdateActivity={handleUpdateActivity}
          allActivities={activityList}
          onSelectActivity={handleSelectActivity}
        />
      </div>

      {/* Workflow Scheduling Simulation Modal */}
      {isSimulationOpen && (
        <WorkflowSimulationModal
          isOpen={isSimulationOpen}
          onClose={() => setIsSimulationOpen(false)}
          workflow={currentWorkflow}
          groups={groups}
          catalog={catalog}
        />
      )}

      {/* Direct XML Generator Modal */}
      {showXmlExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Generated Simulation Configuration XML Files
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct XML export conforming to Scylla / BSim discrete-event simulation engine specifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowXmlExportModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* XML Toolbar */}
            <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Filename Prefix:</span>
                  <input
                    type="text"
                    value={filenamePrefix}
                    onChange={e => setFilenamePrefix(e.target.value.trim() || 'simulation')}
                    className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none w-28"
                  />
                </div>

                <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => setActiveXmlTab('global')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeXmlTab === 'global' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {filenamePrefix}.global.xml (Resources)
                  </button>
                  <button
                    onClick={() => setActiveXmlTab('config')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeXmlTab === 'config' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {filenamePrefix}.config.xml (Activity Matching)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                  {copiedXml ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadActiveXml}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {activeXmlFilename}
                </button>
                <button
                  onClick={handleDownloadBothXml}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Both XML
                </button>
              </div>
            </div>

            {/* XML Display */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <pre className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-950 overflow-auto font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed select-all">
                {activeXmlText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Import BPMN XML Dialog */}
      {showImportXmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Import Custom BPMN 2.0 XML Diagram
              </h3>
              <button
                type="button"
                onClick={() => setShowImportXmlModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Paste BPMN 2.0 XML (standard OMG format generated by bpmn.io / Camunda):
              </label>
              <textarea
                rows={12}
                value={customXmlInput}
                onChange={(e) => setCustomXmlInput(e.target.value)}
                placeholder="<?xml version='1.0' encoding='UTF-8'?>&#10;<bpmn:definitions ...>"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportXmlModal(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportXml}
                disabled={!customXmlInput.trim()}
                className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-500 disabled:opacity-40 shadow-xs"
              >
                Load into BPMN Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
