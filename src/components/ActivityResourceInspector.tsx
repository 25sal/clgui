import React from 'react';
import { 
  Check, 
  Cpu, 
  Wifi, 
  HardDrive, 
  Clock, 
  Shield, 
  Layers, 
  Sparkles, 
  Sliders, 
  Server, 
  Network, 
  Database,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Plus,
  Trash2
} from 'lucide-react';
import { SimulationGroup, ResourceType } from '../types/simulation';
import { ActivityResourceConstraint, PlacementStrategy, ActivityPriority } from '../types/workflow';
import { ROLE_DEFINITIONS } from '../utils/roleUtils';
import { computeGroupStats } from '../data/resourceCatalog';

interface Props {
  activity: ActivityResourceConstraint | null;
  groups: SimulationGroup[];
  catalog: ResourceType[];
  onUpdateActivity: (updated: ActivityResourceConstraint) => void;
  allActivities: ActivityResourceConstraint[];
  onSelectActivity: (activityId: string) => void;
}

export const ActivityResourceInspector: React.FC<Props> = ({
  activity,
  groups,
  catalog,
  onUpdateActivity,
  allActivities,
  onSelectActivity
}) => {
  if (!activity) {
    return (
      <div className="w-80 md:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Layers className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Activity Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
          Click on any task in the BPMN diagram or select from the workflow list to configure its candidate resources.
        </p>

        <div className="mt-6 w-full space-y-1.5 text-left">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
            Activities in Workflow ({allActivities.length})
          </span>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {allActivities.map(a => (
              <button
                key={a.activityId}
                onClick={() => onSelectActivity(a.activityId)}
                className="w-full text-left p-2 rounded-lg bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white truncate block transition-colors"
              >
                {a.activityName}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Toggle candidate group
  const handleToggleGroup = (groupId: string) => {
    const current = [...activity.candidateGroupIds];
    const exists = current.includes(groupId);
    const updated = exists ? current.filter(id => id !== groupId) : [...current, groupId];
    onUpdateActivity({
      ...activity,
      candidateGroupIds: updated
    });
  };

  // Check which groups satisfy the activity's compute & memory constraints
  const matchingGroupsCount = groups.filter(g => {
    const stats = computeGroupStats(g, catalog);
    return stats.computeTFlops >= activity.requiredComputeTFlops &&
           stats.bandwidthMbps >= activity.requiredBandwidthMbps;
  }).length;

  // BSim Direct Resource ID change
  const handleUpdateBsimResource = (resId: string, amount: number) => {
    const current = activity.bsimResources ? [...activity.bsimResources] : [];
    const index = current.findIndex(r => r.resourceId === resId);
    if (index >= 0) {
      current[index] = { resourceId: resId, amount };
    } else {
      current.push({ resourceId: resId, amount });
    }
    onUpdateActivity({
      ...activity,
      bsimResources: current
    });
  };

  const handleToggleBsimResource = (resId: string) => {
    const current = activity.bsimResources ? [...activity.bsimResources] : [];
    const exists = current.some(r => r.resourceId === resId);
    let updated;
    if (exists) {
      updated = current.filter(r => r.resourceId !== resId);
    } else {
      updated = [...current, { resourceId: resId, amount: 1 }];
    }
    onUpdateActivity({
      ...activity,
      bsimResources: updated
    });
  };

  // BSim Attribute Demand change (numInstructions, readOps, writeOps)
  const handleUpdateAttributeValue = (key: string, value: number) => {
    const current = activity.bsimAttributes ? [...activity.bsimAttributes] : [];
    const index = current.findIndex(a => a.key === key);
    if (index >= 0) {
      current[index] = { key, value };
    } else {
      current.push({ key, value });
    }
    onUpdateActivity({
      ...activity,
      bsimAttributes: current
    });
  };

  const primaryAttribute = activity.bsimAttributes?.find(a => a.key === 'numInstructions' || a.key === 'readOps' || a.key === 'writeOps') || {
    key: 'numInstructions',
    value: Math.max(500, Math.round(activity.requiredComputeTFlops * 1000) || 2000)
  };

  return (
    <div className="w-80 md:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-semibold">
            BPMN Activity Inspector
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            {activity.activityType}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={activity.activityName}>
          {activity.activityName}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          ID: {activity.activityId}
        </p>
      </div>

      {/* Scrollable Configuration Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Direct Simulation Match: [filename].config.xml <bsim:resources> */}
        <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Direct XML Resource Match
            </h4>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">&lt;bsim:resource&gt;</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Assign the dynamic resource type(s) scheduled for this BPMN task:
          </p>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {catalog.map(res => {
              const xmlId = res.id.replace(/^res-/, '').replace(/-/g, '_');
              const isAssigned = (activity.bsimResources && activity.bsimResources.some(r => r.resourceId === xmlId)) ||
                (!activity.bsimResources && activity.allowedResourceTypes?.includes(res.id));
              const amount = activity.bsimResources?.find(r => r.resourceId === xmlId)?.amount || 1;

              return (
                <div
                  key={res.id}
                  onClick={() => handleToggleBsimResource(xmlId)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isAssigned
                      ? 'bg-indigo-100/80 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isAssigned ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isAssigned && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white block truncate">{xmlId}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{res.name}</span>
                    </div>
                  </div>

                  {isAssigned && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">amt:</span>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={amount}
                        onChange={e => handleUpdateBsimResource(xmlId, parseInt(e.target.value) || 1)}
                        className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-900 dark:text-white font-mono text-[10px]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Demand Attribute: numInstructions or readOps / writeOps */}
          <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">Execution Workload Demand</span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">&lt;bsim:attribute&gt;</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={primaryAttribute.key}
                onChange={e => {
                  const newKey = e.target.value;
                  const currentVal = primaryAttribute.value;
                  onUpdateActivity({
                    ...activity,
                    bsimAttributes: [{ key: newKey, value: currentVal }]
                  });
                }}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
              >
                <option value="numInstructions">numInstructions</option>
                <option value="readOps">readOps</option>
                <option value="writeOps">writeOps</option>
                <option value="networkPayload">networkPayload</option>
              </select>

              <input
                type="number"
                min="1"
                step="100"
                value={primaryAttribute.value}
                onChange={e => handleUpdateAttributeValue(primaryAttribute.key, parseInt(e.target.value) || 1000)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Placement Strategy */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Continuum Scheduling Strategy
          </label>
          <select
            value={activity.placementStrategy}
            onChange={(e) => onUpdateActivity({ ...activity, placementStrategy: e.target.value as PlacementStrategy })}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="edge_preferred">Edge Preferred (Near Data Source)</option>
            <option value="mec_preferred">Regional MEC Preferred (Low Latency Cluster)</option>
            <option value="cloud_preferred">Cloud Preferred (Maximum Compute Core)</option>
            <option value="lowest_latency">Lowest Latency (Network-Optimized)</option>
            <option value="highest_compute">Highest Compute Capacity (TFLOPS)</option>
            <option value="energy_efficient">Energy Efficient (Low Wattage)</option>
            <option value="cost_optimal">Cost Optimal</option>
          </select>
        </div>

        {/* Candidate Continuum Groups Assignment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Candidate Continuum Groups ({activity.candidateGroupIds.length})
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {matchingGroupsCount} match requirements
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Select the Cloud-Edge distributed groups where this activity is allowed to be scheduled:
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {groups.map(group => {
              const isChecked = activity.candidateGroupIds.includes(group.id);
              const roleMeta = ROLE_DEFINITIONS[group.role];
              const stats = computeGroupStats(group, catalog);
              const satisfiesReqs = stats.computeTFlops >= activity.requiredComputeTFlops && stats.bandwidthMbps >= activity.requiredBandwidthMbps;

              return (
                <div
                  key={group.id}
                  onClick={() => handleToggleGroup(group.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isChecked
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 dark:text-white truncate" title={group.name}>
                        {group.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className={roleMeta.accentColor}>
                          {group.hierarchyLevel === 1 ? 'Cloud L1' : group.hierarchyLevel === 2 ? 'MEC L2' : 'Edge L3'}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{stats.instances} units</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-mono ${satisfiesReqs ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}`}>
                      {stats.computeTFlops} T
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimum Resource Requirements */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Activity Scheduling Thresholds
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Min Compute (TFLOPS)</span>
              <input
                type="number"
                step="0.1"
                min="0.01"
                value={activity.requiredComputeTFlops}
                onChange={(e) => onUpdateActivity({ ...activity, requiredComputeTFlops: parseFloat(e.target.value) || 0.1 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Min RAM (GB)</span>
              <input
                type="number"
                min="1"
                value={activity.requiredMemoryGB}
                onChange={(e) => onUpdateActivity({ ...activity, requiredMemoryGB: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Min Bandwidth (Mbps)</span>
              <input
                type="number"
                min="1"
                step="50"
                value={activity.requiredBandwidthMbps}
                onChange={(e) => onUpdateActivity({ ...activity, requiredBandwidthMbps: parseInt(e.target.value) || 10 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Max Latency (ms)</span>
              <input
                type="number"
                min="1"
                step="5"
                value={activity.maxLatencyMs}
                onChange={(e) => onUpdateActivity({ ...activity, maxLatencyMs: parseInt(e.target.value) || 50 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Task Workload & Execution Profile */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Execution Profile & Data Volume
          </h4>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Est. Duration</span>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={activity.estimatedDurationSec}
                onChange={(e) => onUpdateActivity({ ...activity, estimatedDurationSec: parseFloat(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
              <span className="text-[9px] text-slate-500">sec</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Input Data</span>
              <input
                type="number"
                min="0"
                value={activity.dataInputSizeMB}
                onChange={(e) => onUpdateActivity({ ...activity, dataInputSizeMB: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
              <span className="text-[9px] text-slate-500">MB</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Output Data</span>
              <input
                type="number"
                min="0"
                value={activity.dataOutputSizeMB}
                onChange={(e) => onUpdateActivity({ ...activity, dataOutputSizeMB: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white text-xs"
              />
              <span className="text-[9px] text-slate-500">MB</span>
            </div>
          </div>
        </div>

        {/* Priority & Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Scheduling Priority
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['low', 'normal', 'high', 'critical'] as ActivityPriority[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => onUpdateActivity({ ...activity, priority: p })}
                className={`py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activity.priority === p 
                    ? p === 'critical' ? 'bg-red-600 text-white' : p === 'high' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
