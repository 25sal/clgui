import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layout, 
  Plus, 
  Link2, 
  Shield, 
  Cpu, 
  Wifi, 
  Layers, 
  Trash2, 
  Edit3, 
  Move,
  ArrowUp,
  Activity,
  Sliders
} from 'lucide-react';
import { SimulationGroup, ResourceType, RoleType } from '../types/simulation';
import { ROLE_DEFINITIONS, TRUST_DEFINITIONS } from '../utils/roleUtils';
import { computeGroupStats } from '../data/resourceCatalog';

interface Props {
  groups: SimulationGroup[];
  catalog: ResourceType[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onUpdateGroupPosition: (groupId: string, position: { x: number; y: number }) => void;
  onUpdateGroupParent: (groupId: string, parentId: string | null) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenResourceCatalog: (group: SimulationGroup) => void;
  onOpenGroupEditor: (group: SimulationGroup) => void;
  onCreateNewGroup: () => void;
}

export const TopologyCanvas: React.FC<Props> = ({
  groups,
  catalog,
  selectedGroupId,
  onSelectGroup,
  onUpdateGroupPosition,
  onUpdateGroupParent,
  onDeleteGroup,
  onOpenResourceCatalog,
  onOpenGroupEditor,
  onCreateNewGroup
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging group node
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Linking mode: connect child to parent
  const [linkingChildId, setLinkingChildId] = useState<string | null>(null);

  // View toggles
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [showSpecsBadge, setShowSpecsBadge] = useState(true);

  // Pre-calculate group stats
  const groupStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeGroupStats>>();
    groups.forEach(g => {
      map.set(g.id, computeGroupStats(g, catalog));
    });
    return map;
  }, [groups, catalog]);

  // Handle Pan start
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group-node') || (e.target as HTMLElement).closest('.canvas-ui-control')) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (draggingGroupId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const newX = Math.round((e.clientX - containerRect.left - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - containerRect.top - pan.y) / zoom - dragOffset.y);

      onUpdateGroupPosition(draggingGroupId, {
        x: Math.max(20, newX),
        y: Math.max(20, newY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingGroupId(null);
  };

  // Node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, group: SimulationGroup) => {
    e.stopPropagation();
    if (linkingChildId) {
      // If we are in linking mode and clicked on another group
      if (linkingChildId !== group.id) {
        // Prevent cycle: check if target is not a descendant of child
        if (!isDescendant(linkingChildId, group.id, groups)) {
          onUpdateGroupParent(linkingChildId, group.id);
        } else {
          alert('Cannot link to a descendant group (would create a cycle in hierarchy).');
        }
      }
      setLinkingChildId(null);
      return;
    }

    onSelectGroup(group.id);
    setDraggingGroupId(group.id);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    setDragOffset({
      x: mouseCanvasX - group.position.x,
      y: mouseCanvasY - group.position.y
    });
  };

  // Helper to check cycle
  function isDescendant(childId: string, potentialParentId: string, allGroups: SimulationGroup[]): boolean {
    let curr = allGroups.find(g => g.id === potentialParentId);
    while (curr && curr.parentId) {
      if (curr.parentId === childId) return true;
      curr = allGroups.find(g => g.id === curr?.parentId);
    }
    return false;
  }

  // Auto layout algorithms
  const applyLayout = (type: 'hierarchical' | 'radial') => {
    if (type === 'hierarchical') {
      // Group by hierarchy level
      const levels: Record<number, SimulationGroup[]> = {};
      groups.forEach(g => {
        const lvl = g.hierarchyLevel || 1;
        if (!levels[lvl]) levels[lvl] = [];
        levels[lvl].push(g);
      });

      const sortedLevels = Object.keys(levels).map(Number).sort((a, b) => a - b);
      const canvasWidth = 1200;

      sortedLevels.forEach((lvl, rowIdx) => {
        const rowGroups = levels[lvl];
        const count = rowGroups.length;
        const spacing = canvasWidth / (count + 1);
        const y = 80 + rowIdx * 190;

        rowGroups.forEach((g, colIdx) => {
          const x = Math.round(spacing * (colIdx + 1) - 130);
          onUpdateGroupPosition(g.id, { x, y });
        });
      });
    } else if (type === 'radial') {
      // Find root aggregator(s)
      const roots = groups.filter(g => !g.parentId || g.role === 'root_aggregator');
      const centerX = 600;
      const centerY = 350;

      if (roots.length > 0) {
        roots.forEach((r, idx) => {
          onUpdateGroupPosition(r.id, { x: centerX + (idx * 260) - ((roots.length - 1) * 130), y: centerY - 150 });
        });

        const others = groups.filter(g => !roots.some(r => r.id === g.id));
        const radius = 280;
        const angleStep = (2 * Math.PI) / (others.length || 1);

        others.forEach((g, idx) => {
          const angle = idx * angleStep;
          const x = Math.round(centerX + radius * Math.cos(angle) - 130);
          const y = Math.round(centerY + radius * Math.sin(angle) - 60);
          onUpdateGroupPosition(g.id, { x, y });
        });
      }
    }
  };

  const handleFitToScreen = () => {
    if (groups.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    groups.forEach(g => {
      minX = Math.min(minX, g.position.x);
      minY = Math.min(minY, g.position.y);
      maxX = Math.max(maxX, g.position.x + 280);
      maxY = Math.max(maxY, g.position.y + 160);
    });

    const padding = 80;
    const boxWidth = maxX - minX + padding * 2;
    const boxHeight = maxY - minY + padding * 2;
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const scale = Math.min(1.2, Math.max(0.4, Math.min(containerWidth / boxWidth, containerHeight / boxHeight)));
    setZoom(scale);
    setPan({
      x: (containerWidth - (minX + maxX) * scale) / 2,
      y: (containerHeight - (minY + maxY) * scale) / 2
    });
  };

  // Node dimensions
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 140;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden select-none canvas-grid-pattern cursor-grab active:cursor-grabbing transition-colors"
    >
      {/* Floating Canvas Action Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-md dark:shadow-xl canvas-ui-control">
        <button
          onClick={onCreateNewGroup}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Group
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => applyLayout('hierarchical')}
          title="Auto-organize in Hierarchical Tree"
          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
        >
          <Layout className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Tree Layout
        </button>

        <button
          onClick={() => applyLayout('radial')}
          title="Auto-organize in Radial Hub"
          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          Radial
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => setShowFlowAnimation(!showFlowAnimation)}
          title="Toggle animated federated gradient flows"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
            showFlowAnimation 
              ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 font-semibold' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Flows
        </button>

        <button
          onClick={() => setShowSpecsBadge(!showSpecsBadge)}
          title="Toggle specs cards"
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
            showSpecsBadge 
              ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 font-semibold' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Specs
        </button>
      </div>

      {/* Floating Zoom & Navigation Controls */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-md dark:shadow-xl canvas-ui-control">
        <button
          onClick={() => setZoom(prev => Math.max(0.3, prev - 0.15))}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 px-2 min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.min(2.0, prev + 0.15))}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
        <button
          onClick={handleFitToScreen}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Linking Mode Banner */}
      {linkingChildId && (
        <div className="absolute top-4 right-4 z-30 bg-amber-500/90 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-3 animate-bounce">
          <span>Click on an Aggregator group to set as the parent for "{groups.find(g => g.id === linkingChildId)?.name}"</span>
          <button
            onClick={() => setLinkingChildId(null)}
            className="px-2 py-0.5 rounded bg-slate-950 text-white text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Transformable Canvas Surface */}
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '3200px',
          height: '2400px'
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Overlay for Hierarchy Connections */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Arrowhead marker for upward data/gradient flow */}
            <marker
              id="arrow-flow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#818cf8" />
            </marker>
            <marker
              id="arrow-secure"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#22d3ee" />
            </marker>
          </defs>

          {/* Render Hierarchy Links */}
          {groups.map(child => {
            if (!child.parentId) return null;
            const parent = groups.find(g => g.id === child.parentId);
            if (!parent) return null;

            // Compute connection anchors
            const startX = child.position.x + NODE_WIDTH / 2;
            const startY = child.position.y; // top of child
            const endX = parent.position.x + NODE_WIDTH / 2;
            const endY = parent.position.y + NODE_HEIGHT; // bottom of parent

            // Smooth cubic bezier control points
            const deltaY = Math.abs(startY - endY);
            const cpOffset = Math.max(40, deltaY * 0.45);
            const pathData = `M ${startX} ${startY} C ${startX} ${startY - cpOffset}, ${endX} ${endY + cpOffset}, ${endX} ${endY}`;

            // Trust styling
            const trustMeta = TRUST_DEFINITIONS[child.trustLevel];
            const strokeColor = child.trustLevel === 'secure_enclave'
              ? '#22d3ee'
              : child.trustLevel === 'high_trust'
              ? '#10b981'
              : child.trustLevel === 'semi_honest'
              ? '#6366f1'
              : '#f59e0b';

            const strokeDash = child.trustLevel === 'zero_trust' ? '5,5' : 'none';

            // Midpoint for connection label
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={`link-${child.id}-${parent.id}`} className="group-link">
                {/* Background glow stroke */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3"
                  strokeOpacity="0.2"
                />

                {/* Primary connection line with arrowhead */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1.75"
                  strokeDasharray={strokeDash}
                  strokeOpacity="0.8"
                  markerEnd={child.trustLevel === 'secure_enclave' ? 'url(#arrow-secure)' : 'url(#arrow-flow)'}
                />

                {/* Animated Gradient Data Packets */}
                {showFlowAnimation && (
                  <circle r="3.5" fill={strokeColor} className="animate-pulse">
                    <animateMotion
                      path={pathData}
                      dur="2.5s"
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                    />
                  </circle>
                )}

                {/* Connection Trust & Role Label */}
                <g 
                  transform={`translate(${midX}, ${midY})`} 
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGroup(child.id);
                  }}
                >
                  <rect
                    x="-65"
                    y="-11"
                    width="130"
                    height="22"
                    rx="11"
                    className="fill-white dark:fill-slate-900"
                    stroke={strokeColor}
                    strokeWidth="1"
                    strokeOpacity="0.7"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-300 font-semibold"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    Hierarchy Link · {(child.customTrustScore * 100).toFixed(0)}% Trust
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Group Nodes */}
        {groups.map(group => {
          const isSelected = selectedGroupId === group.id;
          const roleMeta = ROLE_DEFINITIONS[group.role];
          const trustMeta = TRUST_DEFINITIONS[group.trustLevel];
          const stats = groupStatsMap.get(group.id);
          const Icon = roleMeta.icon;
          const TrustIcon = trustMeta.icon;

          return (
            <div
              key={group.id}
              style={{
                transform: `translate(${group.position.x}px, ${group.position.y}px)`,
                width: `${NODE_WIDTH}px`
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, group)}
              className={`group-node absolute pointer-events-auto rounded-xl border transition-shadow cursor-grab active:cursor-grabbing ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-md dark:shadow-lg'
              }`}
            >
              {/* Header with Role Icon & Title */}
              <div className="p-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${roleMeta.bgLight} ${roleMeta.borderLight} border ${roleMeta.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight" title={group.name}>
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className={roleMeta.accentColor}>{roleMeta.badge}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px]">Tier {group.hierarchyLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Hierarchy Connector Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkingChildId(group.id);
                  }}
                  title="Link this group to a parent aggregator"
                  className={`p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    linkingChildId === group.id ? 'bg-amber-500 text-slate-950 font-bold' : ''
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Resource Specs and Metrics */}
              {showSpecsBadge && stats && (
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/40 text-[11px] font-mono grid grid-cols-2 gap-x-2 gap-y-1 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Instances:</span>
                    <span className="text-slate-900 dark:text-white font-semibold tabular-nums">{stats.instances}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Compute:</span>
                    <span className="text-indigo-600 dark:text-indigo-300 font-semibold tabular-nums">{stats.computeTFlops} T</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Bandwidth:</span>
                    <span className="text-sky-600 dark:text-sky-400 tabular-nums font-semibold">
                      {stats.bandwidthGbps >= 1 ? `${stats.bandwidthGbps}G` : `${stats.bandwidthMbps}M`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Uptime:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-semibold">{stats.avgAvailability}%</span>
                  </div>
                </div>
              )}

              {/* Trust Badge & Quick Actions */}
              <div className="px-3 py-2 flex items-center justify-between text-[11px]">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${trustMeta.badgeClass}`}>
                  <TrustIcon className="w-3 h-3" />
                  <span className="font-medium">{trustMeta.label.split(' ')[0]}</span>
                  <span className="font-mono text-[10px] opacity-80">{(group.customTrustScore * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenResourceCatalog(group);
                    }}
                    title="Configure resources & interval"
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGroupEditor(group);
                    }}
                    title="Edit group parameters"
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove group "${group.name}"?`)) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    title="Delete group"
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
