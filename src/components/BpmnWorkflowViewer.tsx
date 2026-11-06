import React, { useEffect, useRef, useState } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Cpu, 
  Server, 
  Network, 
  Database,
  CheckCircle2,
  Clock,
  Shield,
  Activity as ActivityIcon
} from 'lucide-react';
import { SimulationGroup, ResourceType } from '../types/simulation';
import { ActivityResourceConstraint } from '../types/workflow';

// Import standard bpmn-js styles
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

interface Props {
  xml: string;
  activityConstraints: Record<string, ActivityResourceConstraint>;
  groups: SimulationGroup[];
  catalog: ResourceType[];
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string, activityName?: string) => void;
  activeExecutingActivityId?: string | null;
  scheduledGroupMap?: Record<string, string>; // activityId -> groupId
}

export const BpmnWorkflowViewer: React.FC<Props> = ({
  xml,
  activityConstraints,
  groups,
  catalog,
  selectedActivityId,
  onSelectActivity,
  activeExecutingActivityId,
  scheduledGroupMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize and mount bpmn-js NavigatedViewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create viewer instance
    const viewer = new BpmnViewer({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      }
    });
    viewerRef.current = viewer;

    // Handle element clicks
    viewer.on('element.click', (event: any) => {
      const element = event.element;
      if (element && (element.type.includes('Task') || element.type.includes('Activity') || element.type.includes('Event'))) {
        const activityId = element.id;
        const name = element.businessObject?.name || element.id;
        onSelectActivity(activityId, name);
      }
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Load XML into viewer whenever xml changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;

    setLoadError(null);
    viewer.importXML(xml)
      .then(() => {
        const canvas = viewer.get('canvas');
        if (canvas) {
          canvas.zoom('fit-viewport');
        }
        updateOverlays();
      })
      .catch((err: any) => {
        console.error('BPMN Import error:', err);
        setLoadError(err.message || 'Failed to parse BPMN 2.0 XML');
      });
  }, [xml]);

  // Update overlays whenever constraints or execution states change
  const updateOverlays = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      const overlays = viewer.get('overlays');
      const elementRegistry = viewer.get('elementRegistry');
      if (!overlays || !elementRegistry) return;

      // Clear existing overlays
      overlays.clear();

      // Find all tasks/activities in the BPMN process
      const elements = elementRegistry.filter((e: any) => e.type.includes('Task') || e.type.includes('Activity'));

      elements.forEach((element: any) => {
        const activityId = element.id;
        const constraint = activityConstraints[activityId];
        const assignedGroupId = scheduledGroupMap?.[activityId] || constraint?.candidateGroupIds?.[0];
        const assignedGroup = groups.find(g => g.id === assignedGroupId);

        const isExecuting = activeExecutingActivityId === activityId;
        const isSelected = selectedActivityId === activityId;

        // Build overlay DOM element
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'bpmn-resource-overlay pointer-events-none select-none transition-all';
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.top = '-28px';
        overlayDiv.style.left = '4px';
        overlayDiv.style.zIndex = '50';

        let tierLabel = 'Flexible';
        let tierColor = 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

        if (assignedGroup) {
          if (assignedGroup.hierarchyLevel === 1) {
            tierLabel = 'Cloud (L1)';
            tierColor = 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/50';
          } else if (assignedGroup.hierarchyLevel === 2) {
            tierLabel = 'MEC (L2)';
            tierColor = 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/50';
          } else {
            tierLabel = 'Edge (L3)';
            tierColor = 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/50';
          }
        }

        const executingPulse = isExecuting ? 'animate-pulse ring-2 ring-amber-400 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200' : '';
        const selectedRing = isSelected ? 'ring-2 ring-indigo-500 shadow-md' : '';

        overlayDiv.innerHTML = `
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border shadow-xs ${tierColor} ${executingPulse} ${selectedRing}">
            <span class="font-bold">${tierLabel}</span>
            <span class="opacity-60">·</span>
            <span class="truncate max-w-[100px]">${assignedGroup ? assignedGroup.name.split(' ')[0] : (constraint?.candidateGroupIds?.length ? `${constraint.candidateGroupIds.length} groups` : 'Unassigned')}</span>
          </div>
        `;

        overlays.add(element.id, {
          position: {
            top: 0,
            left: 0
          },
          html: overlayDiv
        });
      });
    } catch (e) {
      console.warn('Overlay error:', e);
    }
  };

  useEffect(() => {
    updateOverlays();
  }, [activityConstraints, groups, selectedActivityId, activeExecutingActivityId, scheduledGroupMap]);

  // Zoom controls
  const handleZoomIn = () => {
    const canvas = viewerRef.current?.get('canvas');
    if (canvas) canvas.zoom(canvas.zoom() + 0.2);
  };

  const handleZoomOut = () => {
    const canvas = viewerRef.current?.get('canvas');
    if (canvas) canvas.zoom(Math.max(0.2, canvas.zoom() - 0.2));
  };

  const handleFitViewport = () => {
    const canvas = viewerRef.current?.get('canvas');
    if (canvas) canvas.zoom('fit-viewport');
  };

  return (
    <div className="relative w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xs transition-colors">
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-md dark:shadow-xl">
        <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 px-2 py-0.5">
          <span className="font-semibold text-slate-900 dark:text-white">bpmn.io</span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">Computational Workflow</span>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-2 px-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Edge
          </span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> MEC
          </span>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Cloud
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-md dark:shadow-xl">
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitViewport}
          title="Fit Viewport"
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/80">
          <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-xl max-w-md text-red-200 text-xs">
            <strong className="block mb-1 text-sm">Failed to render BPMN Diagram</strong>
            {loadError}
          </div>
        </div>
      )}

      {/* BPMN Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing transition-colors"
      />
    </div>
  );
};
