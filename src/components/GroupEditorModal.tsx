import React, { useState } from 'react';
import { 
  X, 
  GitMerge, 
  Network, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Server, 
  Shield, 
  Lock, 
  ShieldAlert, 
  Sliders,
  Check
} from 'lucide-react';
import { SimulationGroup, RoleType, TrustLevel } from '../types/simulation';
import { ROLE_DEFINITIONS, TRUST_DEFINITIONS } from '../utils/roleUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: SimulationGroup | null; // null if creating new
  allGroups: SimulationGroup[];
  onSave: (groupData: Partial<SimulationGroup>) => void;
  onOpenResourceCatalogForGroup?: (group: SimulationGroup) => void;
}

export const GroupEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  group,
  allGroups,
  onSave,
  onOpenResourceCatalogForGroup
}) => {
  const isEditing = !!group;

  const [name, setName] = useState(group?.name || 'New Federated Group');
  const [role, setRole] = useState<RoleType>(group?.role || 'training_node');
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(group?.hierarchyLevel || 3);
  const [parentId, setParentId] = useState<string | null>(group?.parentId || null);
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(group?.trustLevel || 'semi_honest');
  const [customTrustScore, setCustomTrustScore] = useState<number>(group?.customTrustScore ?? 0.8);
  const [notes, setNotes] = useState(group?.notes || '');

  if (!isOpen) return null;

  // Potential parent candidates: groups that are not the current group, and typically aggregators or higher level
  const parentCandidates = allGroups.filter(g => {
    if (group && g.id === group.id) return false;
    // Disallow self or circular
    return g.role === 'root_aggregator' || g.role === 'regional_aggregator' || g.hierarchyLevel < hierarchyLevel;
  });

  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    const def = ROLE_DEFINITIONS[newRole];
    setHierarchyLevel(def.defaultLevel);

    // If new role is root_aggregator, it has no parent
    if (newRole === 'root_aggregator') {
      setParentId(null);
    } else if (!parentId && parentCandidates.length > 0) {
      // Pick first root or regional aggregator as default parent
      const defaultParent = parentCandidates.find(g => g.role === 'root_aggregator') || parentCandidates[0];
      if (defaultParent) setParentId(defaultParent.id);
    }
  };

  const handleTrustChange = (newTrust: TrustLevel) => {
    setTrustLevel(newTrust);
    setCustomTrustScore(TRUST_DEFINITIONS[newTrust].defaultScore);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      role,
      hierarchyLevel,
      parentId: role === 'root_aggregator' ? null : parentId,
      trustLevel,
      customTrustScore,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <form 
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Configure Simulation Group' : 'Create New Simulation Group'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify role in the federated topology, hierarchy connections, and security trust tier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Group Title / Entity Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EU Regional Aggregator (MEC Tier 2)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role Selection with Icons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Role in Distributed / Federated Environment
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(Object.keys(ROLE_DEFINITIONS) as RoleType[]).map(roleKey => {
                const meta = ROLE_DEFINITIONS[roleKey];
                const Icon = meta.icon;
                const isSelected = role === roleKey;

                return (
                  <div
                    key={roleKey}
                    onClick={() => handleRoleChange(roleKey)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-white shadow-xs ring-1 ring-indigo-500/40'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg shrink-0 ${meta.bgLight} ${meta.borderLight} border ${meta.accentColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{meta.badge}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Level {meta.defaultLevel}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hierarchy & Parent Aggregator Assignment */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Hierarchy &amp; Aggregator Linkage
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Hierarchy Level / Tier</label>
                <select
                  value={hierarchyLevel}
                  onChange={(e) => setHierarchyLevel(parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={1}>Tier 1 (Root Global Aggregator)</option>
                  <option value={2}>Tier 2 (Regional MEC / Intermediate)</option>
                  <option value={3}>Tier 3 (Edge Nodes / Data Sources / Workers)</option>
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Determines position and tree aggregation flow in topology.
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Parent Aggregator Link</label>
                <select
                  disabled={role === 'root_aggregator'}
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none disabled:opacity-40"
                >
                  <option value="">(None - Top Level)</option>
                  {parentCandidates.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{ROLE_DEFINITIONS[p.role].badge}]
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {role === 'root_aggregator' 
                    ? 'Root aggregators sit at the top of the hierarchy.' 
                    : 'Select the aggregator node this group reports to.'}
                </span>
              </div>
            </div>
          </div>

          {/* Level of Trust Configuration */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Level of Trust &amp; Security Tier
              </h3>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                Score: {(customTrustScore * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(TRUST_DEFINITIONS) as TrustLevel[]).map(tKey => {
                const tMeta = TRUST_DEFINITIONS[tKey];
                const TIcon = tMeta.icon;
                const isSelected = trustLevel === tKey;

                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => handleTrustChange(tKey)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${tMeta.badgeClass} ring-1`
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <TIcon className="w-4 h-4 mb-1.5" />
                    <div className="text-xs font-semibold">{tMeta.label.split(' ')[0]}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{tMeta.label.split('(')[1]?.replace(')', '') || ''}</div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Numeric Trust Score Calibration:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold tabular-nums">
                  {customTrustScore.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.01"
                value={customTrustScore}
                onChange={(e) => setCustomTrustScore(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {TRUST_DEFINITIONS[trustLevel].description}
              </p>
            </div>
          </div>

          {/* Group Notes / Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Simulation Scenario Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Local hospital PACS scanners partitioned by pathology department..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {group && onOpenResourceCatalogForGroup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResourceCatalogForGroup(group);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-semibold"
              >
                <Sliders className="w-3.5 h-3.5" />
                Configure Resources &amp; Instances &rarr;
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
