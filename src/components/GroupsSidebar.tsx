import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sliders, 
  Edit3, 
  Trash2, 
  Layers, 
  Network, 
  Shield, 
  Cpu, 
  Wifi, 
  ChevronRight, 
  ChevronDown,
  FolderSync,
  Sparkles,
  Link2
} from 'lucide-react';
import { SimulationGroup, ResourceType, RoleType } from '../types/simulation';
import { ROLE_DEFINITIONS, TRUST_DEFINITIONS } from '../utils/roleUtils';
import { computeGroupStats, computeSystemStats, TEMPLATE_CONFIGS } from '../data/resourceCatalog';

interface Props {
  groups: SimulationGroup[];
  catalog: ResourceType[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onOpenResourceCatalog: (group: SimulationGroup) => void;
  onOpenGroupEditor: (group: SimulationGroup) => void;
  onCreateNewGroup: () => void;
  onDeleteGroup: (groupId: string) => void;
  onLoadTemplate: (templateId: string) => void;
}

export const GroupsSidebar: React.FC<Props> = ({
  groups,
  catalog,
  selectedGroupId,
  onSelectGroup,
  onOpenResourceCatalog,
  onOpenGroupEditor,
  onCreateNewGroup,
  onDeleteGroup,
  onLoadTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [collapsedTiers, setCollapsedTiers] = useState<Record<number, boolean>>({});

  const systemStats = computeSystemStats(groups, catalog);

  const toggleTier = (tier: number) => {
    setCollapsedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }));
  };

  // Group by hierarchy level
  const filteredGroups = groups.filter(g => {
    if (filterRole !== 'all' && g.role !== filterRole) return false;
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const tieredGroups: Record<number, SimulationGroup[]> = {};
  filteredGroups.forEach(g => {
    const lvl = g.hierarchyLevel || 1;
    if (!tieredGroups[lvl]) tieredGroups[lvl] = [];
    tieredGroups[lvl].push(g);
  });

  const tiers = Object.keys(tieredGroups).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-80 md:w-96 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-xs">
      {/* System KPI Summary Strip */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Distributed System Capacity
          </span>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            {systemStats.totalGroups} Groups · {systemStats.hierarchyDepth} Tiers
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Total Nodes</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm tabular-nums">
              {systemStats.totalInstances.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Compute</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tabular-nums">
              {systemStats.totalComputeTFlops >= 1000 
                ? `${(systemStats.totalComputeTFlops / 1000).toFixed(1)} P` 
                : `${systemStats.totalComputeTFlops} T`}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Bandwidth</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold text-sm tabular-nums">
              {systemStats.aggregateBandwidthGbps} Gbps
            </span>
          </div>
        </div>

        {/* Template Quick Selector */}
        <div className="pt-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Template:
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) onLoadTemplate(e.target.value);
            }}
            defaultValue=""
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none flex-1 max-w-[210px] truncate shadow-2xs"
          >
            <option value="" disabled>Load benchmark preset...</option>
            {TEMPLATE_CONFIGS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search configured groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Roles ({groups.length})</option>
            <option value="root_aggregator">Root Aggregators</option>
            <option value="regional_aggregator">Regional Aggregators</option>
            <option value="data_source">Data Sources</option>
            <option value="training_node">Training Nodes</option>
            <option value="validator">Validators</option>
          </select>

          <button
            onClick={onCreateNewGroup}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Group
          </button>
        </div>
      </div>

      {/* Tiered List of Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tiers.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No simulation groups match the search criteria.
          </div>
        ) : (
          tiers.map(tier => {
            const tierList = tieredGroups[tier] || [];
            const isCollapsed = !!collapsedTiers[tier];
            const tierLabel = tier === 1 ? 'Tier 1: Global Aggregators' : tier === 2 ? 'Tier 2: Regional MEC Aggregators' : `Tier ${tier}: Edge Clients & Data Sources`;

            return (
              <div key={tier} className="space-y-1.5">
                {/* Tier Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleTier(tier)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {tierLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                    {tierList.length}
                  </span>
                </button>

                {/* Tier Group Cards */}
                {!isCollapsed && (
                  <div className="space-y-2">
                    {tierList.map(group => {
                      const isSelected = selectedGroupId === group.id;
                      const roleMeta = ROLE_DEFINITIONS[group.role];
                      const trustMeta = TRUST_DEFINITIONS[group.trustLevel];
                      const stats = computeGroupStats(group, catalog);
                      const Icon = roleMeta.icon;
                      const parentGroup = group.parentId ? groups.find(g => g.id === group.parentId) : null;

                      return (
                        <div
                          key={group.id}
                          onClick={() => onSelectGroup(group.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-indigo-400/40'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 ${roleMeta.bgLight} ${roleMeta.borderLight} border ${roleMeta.accentColor}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-snug">
                                  {group.name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className={roleMeta.accentColor}>{roleMeta.badge}</span>
                                  <span>·</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{stats.instances} units</span>
                                </div>
                              </div>
                            </div>

                            {/* Trust Indicator */}
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${trustMeta.badgeClass}`}>
                              {(group.customTrustScore * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Hardware / Sizing Spec Summary */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            <span>
                              {stats.computeTFlops} TFLOPS · {stats.bandwidthGbps >= 1 ? `${stats.bandwidthGbps} Gbps` : `${stats.bandwidthMbps} Mbps`}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {stats.avgAvailability}%
                            </span>
                          </div>

                          {/* Hierarchy Parent Link */}
                          {parentGroup && (
                            <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Link2 className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0" />
                              <span className="truncate">Reports to: <strong className="text-slate-700 dark:text-slate-300">{parentGroup.name}</strong></span>
                            </div>
                          )}

                          {/* Card Action Controls */}
                          <div 
                            className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onOpenResourceCatalog(group)}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Sliders className="w-3 h-3" />
                              Resources
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenGroupEditor(group)}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete group "${group.name}"?`)) onDeleteGroup(group.id);
                              }}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-[11px] transition-colors"
                              title="Delete group"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
