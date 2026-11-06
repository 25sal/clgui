/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  SimulationGroup, 
  ResourceType, 
  SimulationGlobalConfig, 
  InterGroupTrustLink,
  RoleType,
  TrustLevel
} from './types/simulation';
import { 
  INITIAL_RESOURCE_CATALOG, 
  INITIAL_GROUPS, 
  DEFAULT_GLOBAL_CONFIG, 
  TEMPLATE_CONFIGS,
  computeSystemStats 
} from './data/resourceCatalog';
import { HeaderNav, MainNavTab } from './components/HeaderNav';
import { GroupsSidebar } from './components/GroupsSidebar';
import { TopologyCanvas } from './components/TopologyCanvas';
import { ResourceCatalogModal } from './components/ResourceCatalogModal';
import { GroupEditorModal } from './components/GroupEditorModal';
import { TrustMatrixModal } from './components/TrustMatrixModal';
import { SimulationSettingsModal } from './components/SimulationSettingsModal';
import { SimulationDryRunModal } from './components/SimulationDryRunModal';
import { ConfigExportModal } from './components/ConfigExportModal';
import { WorkflowTabView } from './components/WorkflowTabView';
import { ProjectManagerModal, ProjectData } from './components/ProjectManagerModal';

import { WorkflowDefinition } from './types/workflow';
import { DEFAULT_WORKFLOWS } from './data/workflowTemplates';

export default function App() {
  // Core application states
  const [groups, setGroups] = useState<SimulationGroup[]>(INITIAL_GROUPS);
  const [catalog, setCatalog] = useState<ResourceType[]>(INITIAL_RESOURCE_CATALOG);
  const [config, setConfig] = useState<SimulationGlobalConfig>(DEFAULT_GLOBAL_CONFIG);
  const [trustLinks, setTrustLinks] = useState<InterGroupTrustLink[]>([]);
  
  // Workflows
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(DEFAULT_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(DEFAULT_WORKFLOWS[0].id);

  // Selection and Navigation
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id || null);
  const [activeTab, setActiveTab] = useState<MainNavTab>('continuum');

  // Modal Dialog states
  const [resourceModalGroup, setResourceModalGroup] = useState<SimulationGroup | null>(null);
  const [editorModalGroup, setEditorModalGroup] = useState<SimulationGroup | null>(null);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [isTrustMatrixOpen, setIsTrustMatrixOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDryRunOpen, setIsDryRunOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [projectManagerInitialMode, setProjectManagerInitialMode] = useState<'open' | 'save'>('save');

  // System stats
  const systemStats = useMemo(() => computeSystemStats(groups, catalog), [groups, catalog]);

  // Handler: Update group canvas coordinates
  const handleUpdateGroupPosition = (groupId: string, position: { x: number; y: number }) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, position } : g));
  };

  // Handler: Update hierarchy parent
  const handleUpdateGroupParent = (groupId: string, parentId: string | null) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const parent = groups.find(p => p.id === parentId);
      const newHierarchyLevel = parent ? parent.hierarchyLevel + 1 : g.hierarchyLevel;
      return {
        ...g,
        parentId,
        hierarchyLevel: newHierarchyLevel
      };
    }));
  };

  // Handler: Delete group
  const handleDeleteGroup = (groupId: string) => {
    setGroups(prev => {
      // Re-point children of deleted group to null
      return prev
        .filter(g => g.id !== groupId)
        .map(g => g.parentId === groupId ? { ...g, parentId: null } : g);
    });
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  };

  // Handler: Create new group
  const handleStartCreateGroup = () => {
    setIsCreatingNewGroup(true);
    setEditorModalGroup(null);
  };

  // Handler: Save created or edited group
  const handleSaveGroupEditor = (groupData: Partial<SimulationGroup>) => {
    if (editorModalGroup) {
      // Update existing
      setGroups(prev => prev.map(g => g.id === editorModalGroup.id ? { ...g, ...groupData } as SimulationGroup : g));
      setEditorModalGroup(null);
    } else {
      // Create new
      const newId = `grp-${Date.now()}`;
      const defaultRes = catalog[0];
      const newGroup: SimulationGroup = {
        id: newId,
        name: groupData.name || 'New Federated Group',
        role: groupData.role || 'training_node',
        hierarchyLevel: groupData.hierarchyLevel || 3,
        parentId: groupData.parentId || null,
        resourceSelectionMode: 'single',
        sizingMode: 'total',
        totalInstances: 10,
        resourceAllocations: [
          { resourceTypeId: defaultRes.id, instances: 10, weightPercent: 100 }
        ],
        trustLevel: groupData.trustLevel || 'semi_honest',
        customTrustScore: groupData.customTrustScore ?? 0.8,
        filterIntervals: {
          computeMin: 0,
          computeMax: 2000,
          bandwidthMin: 0,
          bandwidthMax: 400000,
          availabilityMin: 70,
          availabilityMax: 100
        },
        position: { x: 300 + (groups.length * 30), y: 300 + (groups.length * 20) },
        notes: groupData.notes || ''
      };

      setGroups(prev => [...prev, newGroup]);
      setSelectedGroupId(newId);
      setIsCreatingNewGroup(false);
    }
  };

  // Handler: Apply updated resource selections
  const handleSaveResourceAllocation = (updated: {
    resourceSelectionMode: 'single' | 'multiple';
    sizingMode: 'total' | 'per_type';
    totalInstances: number;
    resourceAllocations: SimulationGroup['resourceAllocations'];
    filterIntervals: SimulationGroup['filterIntervals'];
  }) => {
    if (!resourceModalGroup) return;
    setGroups(prev => prev.map(g => {
      if (g.id !== resourceModalGroup.id) return g;
      return {
        ...g,
        ...updated
      };
    }));
  };

  // Handler: Add custom resource to catalog
  const handleAddCustomResource = (newResource: ResourceType) => {
    setCatalog(prev => [newResource, ...prev]);
  };

  // Handler: Load preset template
  const handleLoadTemplate = (templateId: string) => {
    const tmpl = TEMPLATE_CONFIGS.find(t => t.id === templateId);
    if (!tmpl) return;
    if (confirm(`Load "${tmpl.name}"? This will overwrite the current topology.`)) {
      setGroups(tmpl.groups);
      setConfig(tmpl.config);
      setSelectedGroupId(tmpl.groups[0]?.id || null);
    }
  };

  // Handler: Load comprehensive project package
  const handleLoadProject = (project: ProjectData) => {
    setGroups(project.groups);
    setConfig(project.config);
    if (project.catalog && project.catalog.length > 0) {
      setCatalog(project.catalog);
    }
    if (project.trustLinks) {
      setTrustLinks(project.trustLinks);
    }
    if (project.workflows && project.workflows.length > 0) {
      setWorkflows(project.workflows);
      setActiveWorkflowId(project.activeWorkflowId || project.workflows[0].id);
    }
    setSelectedGroupId(project.groups[0]?.id || null);
  };

  // Handler: Tab navigation
  const handleSelectTab = (tab: MainNavTab) => {
    if (tab === 'trust_matrix') {
      setIsTrustMatrixOpen(true);
      return;
    }
    if (tab === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    if (tab === 'export') {
      setIsExportOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenDryRun={() => setIsDryRunOpen(true)}
        totalInstances={systemStats.totalInstances}
        onOpenProjectModal={(mode) => {
          setProjectManagerInitialMode(mode);
          setIsProjectManagerOpen(true);
        }}
      />

      {/* Main Workspace: Tab View Switcher */}
      {activeTab === 'workflow' ? (
        <WorkflowTabView 
          groups={groups} 
          catalog={catalog} 
          config={config}
          workflows={workflows}
          activeWorkflowId={activeWorkflowId}
          onSelectWorkflow={setActiveWorkflowId}
          onUpdateWorkflows={setWorkflows}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar: Groups, Capacity Gauges & Templates */}
          <GroupsSidebar
            groups={groups}
            catalog={catalog}
            selectedGroupId={selectedGroupId}
            onSelectGroup={(id) => setSelectedGroupId(id)}
            onOpenResourceCatalog={(group) => setResourceModalGroup(group)}
            onOpenGroupEditor={(group) => setEditorModalGroup(group)}
            onCreateNewGroup={handleStartCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            onLoadTemplate={handleLoadTemplate}
          />

          {/* Center: Interactive Graphical Topology Canvas */}
          <main className="flex-1 h-full relative">
            <TopologyCanvas
              groups={groups}
              catalog={catalog}
              selectedGroupId={selectedGroupId}
              onSelectGroup={(id) => setSelectedGroupId(id)}
              onUpdateGroupPosition={handleUpdateGroupPosition}
              onUpdateGroupParent={handleUpdateGroupParent}
              onDeleteGroup={handleDeleteGroup}
              onOpenResourceCatalog={(group) => setResourceModalGroup(group)}
              onOpenGroupEditor={(group) => setEditorModalGroup(group)}
              onCreateNewGroup={handleStartCreateGroup}
            />
          </main>
        </div>
      )}

      {/* Resource Catalog & Interval Filtering Modal */}
      {resourceModalGroup && (
        <ResourceCatalogModal
          isOpen={!!resourceModalGroup}
          onClose={() => setResourceModalGroup(null)}
          group={resourceModalGroup}
          catalog={catalog}
          onSave={handleSaveResourceAllocation}
          onAddCustomResource={handleAddCustomResource}
        />
      )}

      {/* Group Configuration & Hierarchy Linkage Editor Modal */}
      {(editorModalGroup || isCreatingNewGroup) && (
        <GroupEditorModal
          isOpen={!!editorModalGroup || isCreatingNewGroup}
          onClose={() => {
            setEditorModalGroup(null);
            setIsCreatingNewGroup(false);
          }}
          group={editorModalGroup}
          allGroups={groups}
          onSave={handleSaveGroupEditor}
          onOpenResourceCatalogForGroup={(group) => setResourceModalGroup(group)}
        />
      )}

      {/* Inter-Group Trust Matrix Modal */}
      {isTrustMatrixOpen && (
        <TrustMatrixModal
          isOpen={isTrustMatrixOpen}
          onClose={() => setIsTrustMatrixOpen(false)}
          groups={groups}
          trustLinks={trustLinks}
          onUpdateTrustLinks={(links) => setTrustLinks(links)}
          onUpdateGroupTrust={(groupId, level, score) => {
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, trustLevel: level, customTrustScore: score } : g));
          }}
        />
      )}

      {/* Simulation Engine Hyperparameters & Topology Verification */}
      {isSettingsOpen && (
        <SimulationSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSave={(newConfig) => setConfig(newConfig)}
          groups={groups}
          catalog={catalog}
        />
      )}

      {/* Simulation Engine Dry Run & Real-Time Round Telemetry */}
      {isDryRunOpen && (
        <SimulationDryRunModal
          isOpen={isDryRunOpen}
          onClose={() => setIsDryRunOpen(false)}
          groups={groups}
          config={config}
          catalog={catalog}
        />
      )}

      {/* Production Schema Export (JSON/YAML) & Import */}
      {isExportOpen && (
        <ConfigExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          groups={groups}
          config={config}
          catalog={catalog}
          trustLinks={trustLinks}
          currentWorkflow={workflows.find(w => w.id === activeWorkflowId) || workflows[0]}
          onImportConfig={(imported) => {
            setGroups(imported.groups);
            setConfig(imported.config);
            setSelectedGroupId(imported.groups[0]?.id || null);
          }}
        />
      )}

      {/* Project Manager: Save/Export .project.json or Browser Snapshots & Open/Import */}
      {isProjectManagerOpen && (
        <ProjectManagerModal
          isOpen={isProjectManagerOpen}
          onClose={() => setIsProjectManagerOpen(false)}
          groups={groups}
          config={config}
          catalog={catalog}
          trustLinks={trustLinks}
          workflows={workflows}
          activeWorkflowId={activeWorkflowId}
          onLoadProject={handleLoadProject}
          onLoadTemplate={handleLoadTemplate}
          initialMode={projectManagerInitialMode}
        />
      )}
    </div>
  );
}
