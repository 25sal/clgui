import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Wifi, 
  Cpu, 
  Server, 
  Database,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { SimulationGroup, ResourceType } from '../types/simulation';
import { WorkflowDefinition, ActivitySchedulingResult, WorkflowSimulationReport } from '../types/workflow';
import { computeGroupStats } from '../data/resourceCatalog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowDefinition;
  groups: SimulationGroup[];
  catalog: ResourceType[];
}

export const WorkflowSimulationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  workflow,
  groups,
  catalog
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200);

  const activityList = Object.values(workflow.activityConstraints);

  // Compute schedule for all activities based on candidate groups & placement strategy
  const scheduledResults: ActivitySchedulingResult[] = activityList.map((act, index) => {
    // Filter candidate groups
    const candidateGroups = groups.filter(g => act.candidateGroupIds.includes(g.id));

    let chosenGroup: SimulationGroup | null = null;

    if (candidateGroups.length > 0) {
      if (act.placementStrategy === 'edge_preferred') {
        chosenGroup = candidateGroups.find(g => g.hierarchyLevel === 3) || candidateGroups[0];
      } else if (act.placementStrategy === 'mec_preferred') {
        chosenGroup = candidateGroups.find(g => g.hierarchyLevel === 2) || candidateGroups[0];
      } else if (act.placementStrategy === 'cloud_preferred') {
        chosenGroup = candidateGroups.find(g => g.hierarchyLevel === 1) || candidateGroups[0];
      } else if (act.placementStrategy === 'highest_compute') {
        chosenGroup = [...candidateGroups].sort((a, b) => {
          const statsA = computeGroupStats(a, catalog);
          const statsB = computeGroupStats(b, catalog);
          return statsB.computeTFlops - statsA.computeTFlops;
        })[0];
      } else {
        chosenGroup = candidateGroups[0];
      }
    } else {
      // Fallback: pick any group that matches hierarchy
      chosenGroup = groups[0] || null;
    }

    const groupStats = chosenGroup ? computeGroupStats(chosenGroup, catalog) : null;
    const tier = chosenGroup ? chosenGroup.hierarchyLevel : 3;

    // Execution time inversely proportional to group compute
    const baseDuration = act.estimatedDurationSec;
    const speedup = groupStats ? Math.min(4.0, Math.max(0.5, groupStats.computeTFlops / Math.max(1, act.requiredComputeTFlops * 2))) : 1.0;
    const actualExecTime = Math.round((baseDuration / speedup) * 10) / 10;

    // Inter-tier data transfer latency
    // If adjacent tasks are on different tiers (e.g. Edge to MEC, or MEC to Cloud), calculate network time
    let transferLatency = 5; // local
    if (index > 0) {
      const prevGroup = groups.find(g => g.id === activityList[index - 1]?.candidateGroupIds[0]);
      const prevTier = prevGroup ? prevGroup.hierarchyLevel : 3;
      if (prevTier !== tier) {
        const bandwidthMbps = Math.min(groupStats?.bandwidthMbps || 100, 1000);
        transferLatency = Math.round(((act.dataInputSizeMB * 8) / bandwidthMbps) * 1000 + (Math.abs(prevTier - tier) * 15));
      }
    }

    return {
      activityId: act.activityId,
      activityName: act.activityName,
      assignedGroupId: chosenGroup?.id || null,
      assignedGroupName: chosenGroup?.name || 'Unassigned',
      assignedResourceName: chosenGroup?.resourceAllocations[0] 
        ? catalog.find(r => r.id === chosenGroup?.resourceAllocations[0].resourceTypeId)?.name || 'Custom Hardware'
        : 'Default Compute',
      assignedHierarchyTier: tier,
      status: index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'running' : 'pending',
      executionTimeSec: actualExecTime,
      transferLatencyMs: transferLatency,
      dataVolumeMB: act.dataInputSizeMB + act.dataOutputSizeMB,
      computeLoadPercent: Math.min(95, Math.round((act.requiredComputeTFlops / Math.max(1, groupStats?.computeTFlops || 10)) * 100))
    };
  });

  const totalMakespan = scheduledResults.reduce((acc, r) => acc + r.executionTimeSec + (r.transferLatencyMs / 1000), 0);
  const totalDataVolume = scheduledResults.reduce((acc, r) => acc + r.dataVolumeMB, 0);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= activityList.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activityList.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cloud-Edge Continuum Workflow Scheduling</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulating pipeline dispatch of BPMN activities across available Edge, MEC, and Cloud resources.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playback Controls & Progress Bar */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                isPlaying 
                  ? 'bg-amber-600 text-white hover:bg-amber-500' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Start Workflow Run'}
            </button>

            <button
              onClick={() => setCurrentStepIndex(prev => Math.min(activityList.length, prev + 1))}
              disabled={isPlaying || currentStepIndex >= activityList.length}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Step Activity
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Reset workflow execution"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400">
              Completed <strong className="text-slate-900 dark:text-white">{Math.min(activityList.length, currentStepIndex)}</strong> / {activityList.length} Tasks
            </span>

            <div className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/60">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                style={{ width: `${(Math.min(activityList.length, currentStepIndex) / activityList.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Simulated Makespan</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm tabular-nums">
              {totalMakespan.toFixed(1)}s
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Total Data Moved</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold text-sm tabular-nums">
              {totalDataVolume} MB
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Continuum Balance</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tabular-nums">
              Edge: {scheduledResults.filter(r => r.assignedHierarchyTier === 3).length} · MEC: {scheduledResults.filter(r => r.assignedHierarchyTier === 2).length} · Cloud: {scheduledResults.filter(r => r.assignedHierarchyTier === 1).length}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Execution State</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {currentStepIndex >= activityList.length ? 'Completed (Finished)' : isPlaying ? 'Active Running...' : 'Paused / Step'}
            </span>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">BPMN Activity</th>
                <th className="p-3">Assigned Continuum Group</th>
                <th className="p-3">Continuum Tier</th>
                <th className="p-3">Hardware Node</th>
                <th className="p-3">Exec Time</th>
                <th className="p-3">Transfer Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
              {scheduledResults.map((res, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isDone = idx < currentStepIndex;

                return (
                  <tr 
                    key={res.activityId} 
                    className={`transition-colors ${
                      isCurrent 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium ring-1 ring-indigo-500' 
                        : isDone 
                        ? 'bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-300' 
                        : 'text-slate-400 dark:text-slate-500 opacity-60'
                    }`}
                  >
                    <td className="p-3">
                      {isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : isCurrent ? (
                        <span className="text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1 font-bold">
                          <Clock className="w-3.5 h-3.5" /> Running
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Queued</span>
                      )}
                    </td>

                    <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                      {res.activityName}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300 font-sans truncate max-w-[200px]" title={res.assignedGroupName}>
                      {res.assignedGroupName}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.assignedHierarchyTier === 1 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' 
                          : res.assignedHierarchyTier === 2 
                          ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30' 
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      }`}>
                        {res.assignedHierarchyTier === 1 ? 'Cloud (L1)' : res.assignedHierarchyTier === 2 ? 'MEC (L2)' : 'Edge (L3)'}
                      </span>
                    </td>

                    <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={res.assignedResourceName}>
                      {res.assignedResourceName}
                    </td>

                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {res.executionTimeSec}s
                    </td>

                    <td className="p-3 text-sky-600 dark:text-sky-400 font-semibold">
                      {res.transferLatencyMs} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Workflow: <span className="text-slate-900 dark:text-white font-semibold">{workflow.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition-colors"
          >
            Close Simulation View
          </button>
        </div>
      </div>
    </div>
  );
};
