import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  Sliders, 
  Layers, 
  Cpu, 
  Wifi, 
  Clock, 
  Server, 
  Info,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ResourceType, GroupResourceAllocation, SimulationGroup } from '../types/simulation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: SimulationGroup;
  catalog: ResourceType[];
  onSave: (updated: {
    resourceSelectionMode: 'single' | 'multiple';
    sizingMode: 'total' | 'per_type';
    totalInstances: number;
    resourceAllocations: GroupResourceAllocation[];
    filterIntervals: SimulationGroup['filterIntervals'];
  }) => void;
  onAddCustomResource: (newResource: ResourceType) => void;
}

export const ResourceCatalogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  group,
  catalog,
  onSave,
  onAddCustomResource
}) => {
  // Mode selection
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>(group.resourceSelectionMode);
  const [sizingMode, setSizingMode] = useState<'total' | 'per_type'>(group.sizingMode);
  const [totalInstances, setTotalInstances] = useState<number>(group.totalInstances || 10);

  // Interval filters
  const [computeMin, setComputeMin] = useState<number>(group.filterIntervals.computeMin ?? 0);
  const [computeMax, setComputeMax] = useState<number>(group.filterIntervals.computeMax ?? 2000);
  const [bandwidthMin, setBandwidthMin] = useState<number>(group.filterIntervals.bandwidthMin ?? 0);
  const [bandwidthMax, setBandwidthMax] = useState<number>(group.filterIntervals.bandwidthMax ?? 400000);
  const [availMin, setAvailMin] = useState<number>(group.filterIntervals.availabilityMin ?? 70);
  const [availMax, setAvailMax] = useState<number>(group.filterIntervals.availabilityMax ?? 100);

  // Text search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected resources state: Map of resourceTypeId -> instances
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    group.resourceAllocations.forEach(a => {
      map[a.resourceTypeId] = a.instances;
    });
    return map;
  });

  // Modal for creating custom resource
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ResourceType['category']>('workstation_gpu');
  const [customCompute, setCustomCompute] = useState(45.0);
  const [customRam, setCustomRam] = useState(32);
  const [customBandwidth, setCustomBandwidth] = useState(2500);
  const [customAvail, setCustomAvail] = useState(99.0);
  const [customArch, setCustomArch] = useState('ARM Cortex / Custom ASIC');

  if (!isOpen) return null;

  // Filter catalog based on intervals and search
  const filteredCatalog = useMemo(() => {
    return catalog.filter(res => {
      // Compute interval check
      if (res.computePowerTFlops < computeMin || res.computePowerTFlops > computeMax) return false;
      // Bandwidth interval check
      if (res.bandwidthMbps < bandwidthMin || res.bandwidthMbps > bandwidthMax) return false;
      // Availability interval check
      if (res.availabilityPercent < availMin || res.availabilityPercent > availMax) return false;

      // Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = res.name.toLowerCase().includes(query);
        const matchesArch = res.architecture.toLowerCase().includes(query);
        const matchesDesc = res.description.toLowerCase().includes(query);
        if (!matchesName && !matchesArch && !matchesDesc) return false;
      }

      return true;
    });
  }, [catalog, computeMin, computeMax, bandwidthMin, bandwidthMax, availMin, availMax, selectedCategory, searchQuery]);

  const selectedIds = Object.keys(allocations).filter(id => allocations[id] > 0);

  // Toggle selection
  const handleToggleResource = (resId: string) => {
    if (selectionMode === 'single') {
      const newMap: Record<string, number> = {};
      newMap[resId] = totalInstances;
      setAllocations(newMap);
    } else {
      const current = allocations[resId] || 0;
      const newMap = { ...allocations };
      if (current > 0) {
        delete newMap[resId];
      } else {
        newMap[resId] = sizingMode === 'per_type' ? 5 : Math.max(1, Math.floor(totalInstances / (selectedIds.length + 1)));
      }
      setAllocations(newMap);
    }
  };

  const handleUpdateInstances = (resId: string, count: number) => {
    const val = Math.max(1, count);
    setAllocations(prev => ({
      ...prev,
      [resId]: val
    }));
  };

  // Quick interval presets
  const applyPreset = (preset: 'all' | 'datacenter' | 'edge' | 'mobile' | 'high_avail') => {
    switch (preset) {
      case 'all':
        setComputeMin(0);
        setComputeMax(2000);
        setBandwidthMin(0);
        setBandwidthMax(400000);
        setAvailMin(70);
        setAvailMax(100);
        break;
      case 'datacenter':
        setComputeMin(200);
        setComputeMax(2000);
        setBandwidthMin(20000);
        setBandwidthMax(400000);
        setAvailMin(99);
        setAvailMax(100);
        break;
      case 'edge':
        setComputeMin(10);
        setComputeMax(150);
        setBandwidthMin(500);
        setBandwidthMax(25000);
        setAvailMin(95);
        setAvailMax(100);
        break;
      case 'mobile':
        setComputeMin(0.01);
        setComputeMax(10);
        setBandwidthMin(10);
        setBandwidthMax(300);
        setAvailMin(70);
        setAvailMax(95);
        break;
      case 'high_avail':
        setAvailMin(99.0);
        setAvailMax(100);
        break;
    }
  };

  // Compute live aggregates of current selection
  const aggregateMetrics = useMemo(() => {
    let count = 0;
    let tflops = 0;
    let mbps = 0;
    let availWeightSum = 0;

    Object.entries(allocations).forEach(([id, inst]) => {
      if (inst <= 0) return;
      const res = catalog.find(r => r.id === id);
      if (!res) return;
      count += inst;
      tflops += res.computePowerTFlops * inst;
      mbps += res.bandwidthMbps * inst;
      availWeightSum += res.availabilityPercent * inst;
    });

    return {
      totalInstances: count,
      totalTFlops: Math.round(tflops * 10) / 10,
      totalGbps: Math.round((mbps / 1000) * 10) / 10,
      avgAvail: count > 0 ? Math.round((availWeightSum / count) * 10) / 10 : 0
    };
  }, [allocations, catalog]);

  const handleSave = () => {
    const resultAllocations: GroupResourceAllocation[] = [];
    const validIds = Object.keys(allocations).filter(id => allocations[id] > 0);

    if (validIds.length === 0) {
      alert('Please select at least one resource type for this group.');
      return;
    }

    if (selectionMode === 'single') {
      const singleId = validIds[0];
      resultAllocations.push({
        resourceTypeId: singleId,
        instances: totalInstances,
        weightPercent: 100
      });
    } else {
      if (sizingMode === 'total') {
        // Distribute totalInstances proportionally
        const count = validIds.length;
        const perRes = Math.floor(totalInstances / count);
        let remainder = totalInstances % count;
        validIds.forEach(id => {
          const inst = perRes + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;
          resultAllocations.push({
            resourceTypeId: id,
            instances: inst,
            weightPercent: Math.round((inst / totalInstances) * 100)
          });
        });
      } else {
        // per_type direct
        const sum = validIds.reduce((acc, id) => acc + allocations[id], 0);
        validIds.forEach(id => {
          resultAllocations.push({
            resourceTypeId: id,
            instances: allocations[id],
            weightPercent: sum > 0 ? Math.round((allocations[id] / sum) * 100) : 0
          });
        });
      }
    }

    const calculatedTotal = resultAllocations.reduce((acc, a) => acc + a.instances, 0);

    onSave({
      resourceSelectionMode: selectionMode,
      sizingMode,
      totalInstances: calculatedTotal,
      resourceAllocations: resultAllocations,
      filterIntervals: {
        computeMin,
        computeMax,
        bandwidthMin,
        bandwidthMax,
        availabilityMin: availMin,
        availabilityMax: availMax
      }
    });
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newRes: ResourceType = {
      id: `res-custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      computePowerTFlops: Number(customCompute),
      memoryGB: Number(customRam),
      bandwidthMbps: Number(customBandwidth),
      availabilityPercent: Number(customAvail),
      architecture: customArch,
      powerWatts: 150,
      description: 'Custom user-defined distributed system compute specification.',
      isCustom: true
    };

    onAddCustomResource(newRes);
    setShowAddCustomModal(false);
    // select it
    setAllocations(prev => ({
      ...prev,
      [newRes.id]: sizingMode === 'per_type' ? 10 : 1
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Resource Database &amp; Interval Filter</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                {group.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter hardware profiles by computational capacity, network bandwidth, and availability intervals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Selection Mode & Sizing Strategy */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Selection Mode:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectionMode('single')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectionMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Single Resource Type
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('multiple')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectionMode === 'multiple'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Heterogeneous Collection (Multiple)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Group Sizing:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSizingMode('total')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sizingMode === 'total'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Total Group Instances
              </button>
              <button
                type="button"
                onClick={() => setSizingMode('per_type')}
                disabled={selectionMode === 'single'}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sizingMode === 'per_type'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
                }`}
              >
                Instances Per Resource Type
              </button>
            </div>

            {sizingMode === 'total' && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-700">
                <label className="text-xs text-slate-600 dark:text-slate-400">Total Count:</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={totalInstances}
                  onChange={(e) => setTotalInstances(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Split Filter Sidebar & Catalog Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Interval Filter Controls Panel */}
          <div className="lg:col-span-4 p-5 bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Interval Specifications</span>
              </div>
              <button
                onClick={() => applyPreset('all')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5 font-medium">Quick Interval Presets</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('datacenter')}
                  className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Cloud Datacenter
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('edge')}
                  className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Edge Servers &amp; Workstations
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('mobile')}
                  className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Mobile &amp; IoT
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('high_avail')}
                  className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  High Availability (&gt;99%)
                </button>
              </div>
            </div>

            {/* 1. Computational Power Interval */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Compute Power (TFLOPS)
                </span>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300 tabular-nums font-medium">
                  {computeMin} - {computeMax} TFLOPS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Min (TFLOPS)</span>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    step="0.5"
                    value={computeMin}
                    onChange={(e) => setComputeMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Max (TFLOPS)</span>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    step="5"
                    value={computeMax}
                    onChange={(e) => setComputeMax(parseFloat(e.target.value) || 2000)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                value={computeMax}
                onChange={(e) => setComputeMax(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
              />
            </div>

            {/* 2. Communication Bandwidth Interval */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Communication Bandwidth
                </span>
                <span className="text-xs font-mono text-sky-600 dark:text-sky-300 tabular-nums font-medium">
                  {bandwidthMin >= 1000 ? `${bandwidthMin/1000} Gbps` : `${bandwidthMin} Mbps`} - {bandwidthMax >= 1000 ? `${bandwidthMax/1000} Gbps` : `${bandwidthMax} Mbps`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Min (Mbps)</span>
                  <input
                    type="number"
                    min="0"
                    max="400000"
                    step="100"
                    value={bandwidthMin}
                    onChange={(e) => setBandwidthMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Max (Mbps)</span>
                  <input
                    type="number"
                    min="10"
                    max="400000"
                    step="1000"
                    value={bandwidthMax}
                    onChange={(e) => setBandwidthMax(parseFloat(e.target.value) || 400000)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="400000"
                value={bandwidthMax}
                onChange={(e) => setBandwidthMax(parseFloat(e.target.value))}
                className="w-full accent-sky-600 dark:accent-sky-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
              />
            </div>

            {/* 3. Availability Interval */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Availability (Uptime %)
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-300 tabular-nums font-medium">
                  {availMin}% - {availMax}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Min (%)</span>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    step="0.5"
                    value={availMin}
                    onChange={(e) => setAvailMin(parseFloat(e.target.value) || 50)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Max (%)</span>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    step="0.1"
                    value={availMax}
                    onChange={(e) => setAvailMax(parseFloat(e.target.value) || 100)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="0.5"
                value={availMin}
                onChange={(e) => setAvailMin(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
              />
            </div>

            {/* Add Custom Hardware Profile */}
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white flex items-center justify-center gap-2 transition-colors bg-white dark:bg-slate-950/40"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Add Custom Resource Specification
            </button>
          </div>

          {/* Catalog Selection & Filtered List */}
          <div className="lg:col-span-8 p-5 bg-slate-100/50 dark:bg-slate-900/40 flex flex-col overflow-hidden">
            {/* Search and Category Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search resources by name, architecture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="cloud_datacenter">Cloud Datacenter</option>
                  <option value="edge_server">Edge MEC Servers</option>
                  <option value="workstation_gpu">Workstation &amp; PACS</option>
                  <option value="edge_accelerator">Edge Embedded Accelerators</option>
                  <option value="mobile_device">Mobile Smartphones</option>
                  <option value="iot_sensor">IoT &amp; Grid Sensors</option>
                </select>
              </div>
            </div>

            {/* Filter Match Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
              <div>
                Matching interval filters: <span className="text-slate-900 dark:text-white font-semibold">{filteredCatalog.length}</span> of {catalog.length} catalog resources
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                {selectedIds.length} resource type{selectedIds.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            {/* Scrollable Resource Cards Grid */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-transparent">
                  <Info className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No resources match the selected interval</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try expanding the compute power or bandwidth intervals on the left, or click "Reset".
                  </p>
                  <button
                    onClick={() => applyPreset('all')}
                    className="mt-3 px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Reset Filter Intervals
                  </button>
                </div>
              ) : (
                filteredCatalog.map(res => {
                  const isSelected = !!allocations[res.id] && allocations[res.id] > 0;
                  const instanceCount = allocations[res.id] || 0;

                  return (
                    <div
                      key={res.id}
                      onClick={() => handleToggleResource(res.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500/60 shadow-xs ring-1 ring-indigo-400/30'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-500 text-white' 
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{res.name}</h4>
                              {res.isCustom && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 rounded font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{res.description}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-1">
                              Arch: {res.architecture} · RAM: {res.memoryGB} GB · Power: {res.powerWatts}W
                            </p>
                          </div>
                        </div>

                        {/* Specs Pill Column */}
                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300 tabular-nums">
                            {res.computePowerTFlops} TFLOPS
                          </div>
                          <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400 tabular-nums font-semibold">
                            {res.bandwidthMbps >= 1000 ? `${res.bandwidthMbps / 1000} Gbps` : `${res.bandwidthMbps} Mbps`}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 tabular-nums font-semibold">
                            {res.availabilityPercent}% uptime
                          </div>
                        </div>
                      </div>

                      {/* If multiple selection and sizing mode is per-type, show instance input */}
                      {isSelected && selectionMode === 'multiple' && sizingMode === 'per_type' && (
                        <div 
                          className="mt-3 pt-2.5 border-t border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            Instances of this type:
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={instanceCount}
                              onChange={(e) => handleUpdateInstances(res.id, parseInt(e.target.value) || 1)}
                              className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono text-right"
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-400">units</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Aggregate Summary & Action Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Instances</span>
              <span className="text-slate-900 dark:text-white font-semibold text-sm tabular-nums">
                {selectionMode === 'single' ? totalInstances : aggregateMetrics.totalInstances}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Combined Compute</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tabular-nums">
                {selectionMode === 'single' && selectedIds[0] 
                  ? `${Math.round((catalog.find(r => r.id === selectedIds[0])?.computePowerTFlops || 0) * totalInstances * 10) / 10} TFLOPS`
                  : `${aggregateMetrics.totalTFlops} TFLOPS`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Agg Bandwidth</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold text-sm tabular-nums">
                {selectionMode === 'single' && selectedIds[0]
                  ? `${Math.round(((catalog.find(r => r.id === selectedIds[0])?.bandwidthMbps || 0) * totalInstances / 1000) * 10) / 10} Gbps`
                  : `${aggregateMetrics.totalGbps} Gbps`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Avg Availability</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm tabular-nums">
                {selectionMode === 'single' && selectedIds[0]
                  ? `${catalog.find(r => r.id === selectedIds[0])?.availabilityPercent || 0}%`
                  : `${aggregateMetrics.avgAvail}%`}
              </span>
            </div>
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
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Resource Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Hardware Resource Specification */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <form 
            onSubmit={handleCreateCustom}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Add Custom Resource Specification
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Resource Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom RISC-V Neural Accelerator"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  >
                    <option value="cloud_datacenter">Cloud Datacenter</option>
                    <option value="edge_server">Edge MEC Server</option>
                    <option value="workstation_gpu">Workstation GPU</option>
                    <option value="edge_accelerator">Edge Accelerator</option>
                    <option value="mobile_device">Mobile Device</option>
                    <option value="iot_sensor">IoT Sensor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Architecture / Microarch</label>
                  <input
                    type="text"
                    value={customArch}
                    onChange={(e) => setCustomArch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Compute (TFLOPS)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCompute}
                    onChange={(e) => setCustomCompute(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Memory RAM (GB)</label>
                  <input
                    type="number"
                    value={customRam}
                    onChange={(e) => setCustomRam(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Bandwidth (Mbps)</label>
                  <input
                    type="number"
                    value={customBandwidth}
                    onChange={(e) => setCustomBandwidth(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Availability Uptime (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={customAvail}
                    onChange={(e) => setCustomAvail(parseFloat(e.target.value) || 99)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-500 shadow-xs"
              >
                Add to Database
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
