import { ResourceType, SimulationGroup, SimulationGlobalConfig, RoleType } from '../types/simulation';

export const INITIAL_RESOURCE_CATALOG: ResourceType[] = [
  {
    id: 'res-h100-sxm5',
    name: 'NVIDIA H100 SXM5 DGX Node',
    category: 'cloud_datacenter',
    computePowerTFlops: 1979.0, // FP16 Tensor Core
    memoryGB: 80,
    bandwidthMbps: 400000, // 400 Gbps InfiniBand
    availabilityPercent: 99.99,
    architecture: 'NVIDIA Hopper GH100',
    powerWatts: 700,
    description: 'High-throughput datacenter accelerator ideal for global root aggregators and parameter servers.'
  },
  {
    id: 'res-a100-80gb',
    name: 'NVIDIA A100 Tensor Core 80GB',
    category: 'cloud_datacenter',
    computePowerTFlops: 312.0,
    memoryGB: 80,
    bandwidthMbps: 200000,
    availabilityPercent: 99.95,
    architecture: 'NVIDIA Ampere GA100',
    powerWatts: 400,
    description: 'Cloud tier training node for high-throughput gradient calculation and validation.'
  },
  {
    id: 'res-poweredge-xr4000',
    name: '5G MEC Server (Dell XR4000)',
    category: 'edge_server',
    computePowerTFlops: 140.0,
    memoryGB: 128,
    bandwidthMbps: 25000, // 25 Gbps
    availabilityPercent: 99.8,
    architecture: 'Intel Xeon D + Dual L4 GPU',
    powerWatts: 350,
    description: 'Ruggedized telecom edge server for Level 2 regional aggregation and localized federated updates.'
  },
  {
    id: 'res-rtx4090-workstation',
    name: 'NVIDIA RTX 4090 Workstation',
    category: 'workstation_gpu',
    computePowerTFlops: 82.6,
    memoryGB: 24,
    bandwidthMbps: 10000, // 10 Gbps LAN
    availabilityPercent: 99.2,
    architecture: 'NVIDIA Ada Lovelace AD102',
    powerWatts: 450,
    description: 'On-premise enterprise hospital or research laboratory workstation node.'
  },
  {
    id: 'res-apple-m3-max',
    name: 'Apple M3 Max Studio Unit',
    category: 'workstation_gpu',
    computePowerTFlops: 35.8,
    memoryGB: 64,
    bandwidthMbps: 1000, // 1 Gbps
    availabilityPercent: 98.8,
    architecture: 'Apple Silicon 16-Core CPU / 40-Core GPU',
    powerWatts: 140,
    description: 'High-memory client workstation for private medical imaging or sensitive financial features.'
  },
  {
    id: 'res-jetson-agx-orin',
    name: 'NVIDIA Jetson AGX Orin 64GB',
    category: 'edge_accelerator',
    computePowerTFlops: 32.0, // FP16, 275 TOPS INT8
    memoryGB: 64,
    bandwidthMbps: 1000,
    availabilityPercent: 97.5,
    architecture: 'NVIDIA Ampere + 12-core ARM Cortex-A78AE',
    powerWatts: 60,
    description: 'Robotic and autonomous vehicle edge compute module for embedded training and inference.'
  },
  {
    id: 'res-jetson-nano-4gb',
    name: 'NVIDIA Jetson Nano 4GB',
    category: 'edge_accelerator',
    computePowerTFlops: 0.47,
    memoryGB: 4,
    bandwidthMbps: 100,
    availabilityPercent: 94.0,
    architecture: '128-core NVIDIA Maxwell',
    powerWatts: 10,
    description: 'Compact low-power edge node for smart traffic signals and distributed CCTV monitoring.'
  },
  {
    id: 'res-snapdragon-8-gen3',
    name: 'Smartphone Flagship (Snapdragon 8 Gen 3)',
    category: 'mobile_device',
    computePowerTFlops: 4.2,
    memoryGB: 16,
    bandwidthMbps: 150, // Average 5G/Wi-Fi uplink
    availabilityPercent: 88.0,
    architecture: 'ARM Cortex-X4 + Adreno 750 + Hexagon NPU',
    powerWatts: 8,
    description: 'Consumer smartphone client for mobile keyboard prediction and photo personalization.'
  },
  {
    id: 'res-midrange-mobile',
    name: 'Smartphone Mid-Tier (Dimensity 8200)',
    category: 'mobile_device',
    computePowerTFlops: 1.8,
    memoryGB: 8,
    bandwidthMbps: 60,
    availabilityPercent: 78.0,
    architecture: 'ARM Cortex-A78 + Mali-G610',
    powerWatts: 6,
    description: 'Budget mobile client with moderate intermittent availability and battery constraints.'
  },
  {
    id: 'res-smart-meter-sensor',
    name: 'Industrial Smart Grid Sensor / Meter',
    category: 'iot_sensor',
    computePowerTFlops: 0.04,
    memoryGB: 1,
    bandwidthMbps: 10, // LTE-M / NB-IoT
    availabilityPercent: 99.6,
    architecture: 'ARM Cortex-A53 quad-core',
    powerWatts: 3,
    description: 'Grid-connected sensor telemetry data source for power consumption forecasting.'
  },
  {
    id: 'res-hospital-pacs-scanner',
    name: 'Hospital PACS Imaging Scanner Node',
    category: 'workstation_gpu',
    computePowerTFlops: 18.5,
    memoryGB: 32,
    bandwidthMbps: 2500,
    availabilityPercent: 99.4,
    architecture: 'NVIDIA RTX A4000 Embedded',
    powerWatts: 180,
    description: 'On-premise MRI/CT raw image source with strict zero-trust perimeter.',
    cpuSpeed: 1000,
    ioRead: 100
  },
  {
    id: 'res-proxy',
    name: 'Proxy Server (Edge / Continuum Cacher)',
    category: 'edge_server',
    computePowerTFlops: 10.0,
    memoryGB: 16,
    bandwidthMbps: 10000,
    availabilityPercent: 99.9,
    architecture: 'Dual-Socket Edge Server',
    powerWatts: 120,
    description: 'Fast intermediate edge caching and forward proxy node.',
    cpuSpeed: 1000,
    defaultQuantity: 1,
    defaultCost: 1,
    defaultTimeUnit: 'SECONDS'
  },
  {
    id: 'res-origin',
    name: 'Origin Storage Server (Datacenter / Backend)',
    category: 'cloud_datacenter',
    computePowerTFlops: 50.0,
    memoryGB: 128,
    bandwidthMbps: 40000,
    availabilityPercent: 99.99,
    architecture: 'Enterprise NVMe Storage Tier',
    powerWatts: 300,
    description: 'High-capacity persistent backend origin server providing dataset storage and IO operations.',
    ioRead: 1,
    defaultQuantity: 1,
    defaultCost: 1,
    defaultTimeUnit: 'SECONDS'
  }
];

export const INITIAL_GROUPS: SimulationGroup[] = [
  {
    id: 'grp-root-cloud',
    name: 'Global Root Aggregator (Cloud Tier 1)',
    role: 'root_aggregator',
    hierarchyLevel: 1,
    parentId: null,
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 4,
    resourceAllocations: [
      { resourceTypeId: 'res-h100-sxm5', instances: 4, weightPercent: 100 }
    ],
    trustLevel: 'secure_enclave',
    customTrustScore: 0.98,
    filterIntervals: {
      computeMin: 500,
      computeMax: 2000,
      bandwidthMin: 100000,
      bandwidthMax: 400000,
      availabilityMin: 99.5,
      availabilityMax: 100
    },
    position: { x: 480, y: 80 },
    notes: 'Central orchestrator running FedAvg and differential privacy noise calibration.',
    colorTheme: 'indigo'
  },
  {
    id: 'grp-eu-regional-agg',
    name: 'EU Regional Aggregator (MEC Tier 2)',
    role: 'regional_aggregator',
    hierarchyLevel: 2,
    parentId: 'grp-root-cloud',
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 8,
    resourceAllocations: [
      { resourceTypeId: 'res-poweredge-xr4000', instances: 8, weightPercent: 100 }
    ],
    trustLevel: 'high_trust',
    customTrustScore: 0.92,
    filterIntervals: {
      computeMin: 50,
      computeMax: 300,
      bandwidthMin: 10000,
      bandwidthMax: 50000,
      availabilityMin: 99.0,
      availabilityMax: 100
    },
    position: { x: 260, y: 260 },
    notes: 'Aggregates European hospital and clinic updates before streaming to global root.',
    colorTheme: 'blue'
  },
  {
    id: 'grp-na-regional-agg',
    name: 'NA Regional Aggregator (MEC Tier 2)',
    role: 'regional_aggregator',
    hierarchyLevel: 2,
    parentId: 'grp-root-cloud',
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 8,
    resourceAllocations: [
      { resourceTypeId: 'res-poweredge-xr4000', instances: 8, weightPercent: 100 }
    ],
    trustLevel: 'high_trust',
    customTrustScore: 0.90,
    filterIntervals: {
      computeMin: 50,
      computeMax: 300,
      bandwidthMin: 10000,
      bandwidthMax: 50000,
      availabilityMin: 99.0,
      availabilityMax: 100
    },
    position: { x: 700, y: 260 },
    notes: 'North American cluster head with localized secure aggregation.',
    colorTheme: 'blue'
  },
  {
    id: 'grp-hospital-clinical-data',
    name: 'Hospital Clinical PACS & Scanners',
    role: 'data_source',
    hierarchyLevel: 3,
    parentId: 'grp-eu-regional-agg',
    resourceSelectionMode: 'multiple',
    sizingMode: 'per_type',
    totalInstances: 35,
    resourceAllocations: [
      { resourceTypeId: 'res-hospital-pacs-scanner', instances: 15, weightPercent: 43 },
      { resourceTypeId: 'res-apple-m3-max', instances: 20, weightPercent: 57 }
    ],
    trustLevel: 'high_trust',
    customTrustScore: 0.88,
    filterIntervals: {
      computeMin: 10,
      computeMax: 50,
      bandwidthMin: 500,
      bandwidthMax: 5000,
      availabilityMin: 98.0,
      availabilityMax: 100
    },
    position: { x: 120, y: 460 },
    notes: 'Curated MRI and CT scan image providers in Berlin and Paris clinical centers.',
    colorTheme: 'emerald'
  },
  {
    id: 'grp-training-workstations-eu',
    name: 'EU Hospital On-Prem GPU Nodes',
    role: 'training_node',
    hierarchyLevel: 3,
    parentId: 'grp-eu-regional-agg',
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 24,
    resourceAllocations: [
      { resourceTypeId: 'res-rtx4090-workstation', instances: 24, weightPercent: 100 }
    ],
    trustLevel: 'semi_honest',
    customTrustScore: 0.82,
    filterIntervals: {
      computeMin: 40,
      computeMax: 120,
      bandwidthMin: 5000,
      bandwidthMax: 20000,
      availabilityMin: 98.5,
      availabilityMax: 100
    },
    position: { x: 340, y: 460 },
    notes: 'Executes 5 local epochs of PyTorch ResNet-50 training before dispatching gradients.',
    colorTheme: 'violet'
  },
  {
    id: 'grp-na-training-cluster',
    name: 'NA Hospital Training Pods',
    role: 'training_node',
    hierarchyLevel: 3,
    parentId: 'grp-na-regional-agg',
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 30,
    resourceAllocations: [
      { resourceTypeId: 'res-rtx4090-workstation', instances: 30, weightPercent: 100 }
    ],
    trustLevel: 'semi_honest',
    customTrustScore: 0.84,
    filterIntervals: {
      computeMin: 40,
      computeMax: 120,
      bandwidthMin: 5000,
      bandwidthMax: 20000,
      availabilityMin: 98.5,
      availabilityMax: 100
    },
    position: { x: 600, y: 460 },
    notes: 'North American hospital research pods handling local gradient updates.',
    colorTheme: 'violet'
  },
  {
    id: 'grp-independent-auditors',
    name: 'Federated Model Auditor & Validator',
    role: 'validator',
    hierarchyLevel: 3,
    parentId: 'grp-root-cloud',
    resourceSelectionMode: 'single',
    sizingMode: 'total',
    totalInstances: 6,
    resourceAllocations: [
      { resourceTypeId: 'res-a100-80gb', instances: 6, weightPercent: 100 }
    ],
    trustLevel: 'secure_enclave',
    customTrustScore: 0.96,
    filterIntervals: {
      computeMin: 200,
      computeMax: 400,
      bandwidthMin: 50000,
      bandwidthMax: 200000,
      availabilityMin: 99.5,
      availabilityMax: 100
    },
    position: { x: 860, y: 460 },
    notes: 'Independent validation suite running adversarial robustness checks on global model.',
    colorTheme: 'amber'
  }
];

export const DEFAULT_GLOBAL_CONFIG: SimulationGlobalConfig = {
  simulationName: 'Hierarchical Federated Learning Simulation',
  federatedAlgorithm: 'hierarchical_fedavg',
  globalRounds: 50,
  localEpochs: 4,
  batchSize: 64,
  learningRate: 0.01,
  simulatedNetworkConditions: {
    packetLossPercent: 1.5,
    latencyJitterMs: 25,
    churnRatePercent: 4.0
  },
  dataDistribution: 'non_iid_dirichlet',
  dirichletAlpha: 0.5,
  secAggEnabled: true,
  byzantineToleranceEnabled: true,
  bsimId: 'proxycache',
  bsimRandomSeed: 42,
  bsimSoftmaxExponent: 1,
  bsimProcessInstances: 2000,
  bsimStartDateTime: '2025-01-01T00:00:00.000+00:00',
  bsimArrivalRateDistribution: 'exponential',
  bsimArrivalRateMean: 50,
  bsimArrivalRateTimeUnit: 'SECONDS'
};

export interface SimulationTemplate {
  id: string;
  name: string;
  description: string;
  groups: SimulationGroup[];
  config: SimulationGlobalConfig;
}

export const TEMPLATE_CONFIGS: SimulationTemplate[] = [
  {
    id: 'tmpl-healthcare',
    name: 'Hierarchical Healthcare FL (Hospitals -> Regional -> Cloud)',
    description: '3-tier hierarchy with hospital imaging scanners and training workstations reporting to regional 5G MEC aggregators, then to a central enclave root.',
    groups: INITIAL_GROUPS,
    config: DEFAULT_GLOBAL_CONFIG
  },
  {
    id: 'tmpl-autonomous-fleet',
    name: 'Smart City & Autonomous Fleet 5G MEC',
    description: 'Roadside units and autonomous vehicles streaming trajectory data to urban MEC servers, coordinating spatial perception models.',
    groups: [
      {
        id: 'grp-central-transport-hub',
        name: 'Smart City Central Cloud Core',
        role: 'root_aggregator' as RoleType,
        hierarchyLevel: 1,
        parentId: null,
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 2,
        resourceAllocations: [{ resourceTypeId: 'res-h100-sxm5', instances: 2, weightPercent: 100 }],
        trustLevel: 'secure_enclave' as const,
        customTrustScore: 0.99,
        filterIntervals: { computeMin: 500, computeMax: 2000, bandwidthMin: 50000, bandwidthMax: 400000, availabilityMin: 99, availabilityMax: 100 },
        position: { x: 480, y: 80 }
      },
      {
        id: 'grp-downtown-mec',
        name: 'Downtown District 5G MEC Cluster',
        role: 'regional_aggregator' as RoleType,
        hierarchyLevel: 2,
        parentId: 'grp-central-transport-hub',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 6,
        resourceAllocations: [{ resourceTypeId: 'res-poweredge-xr4000', instances: 6, weightPercent: 100 }],
        trustLevel: 'high_trust' as const,
        customTrustScore: 0.92,
        filterIntervals: { computeMin: 80, computeMax: 200, bandwidthMin: 10000, bandwidthMax: 50000, availabilityMin: 99, availabilityMax: 100 },
        position: { x: 300, y: 260 }
      },
      {
        id: 'grp-highway-mec',
        name: 'Highway Corridor MEC Cluster',
        role: 'regional_aggregator' as RoleType,
        hierarchyLevel: 2,
        parentId: 'grp-central-transport-hub',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 4,
        resourceAllocations: [{ resourceTypeId: 'res-poweredge-xr4000', instances: 4, weightPercent: 100 }],
        trustLevel: 'high_trust' as const,
        customTrustScore: 0.90,
        filterIntervals: { computeMin: 80, computeMax: 200, bandwidthMin: 10000, bandwidthMax: 50000, availabilityMin: 99, availabilityMax: 100 },
        position: { x: 660, y: 260 }
      },
      {
        id: 'grp-autonomous-fleet-vehicles',
        name: 'Fleet Vehicles (AGX Orin Units)',
        role: 'training_node' as RoleType,
        hierarchyLevel: 3,
        parentId: 'grp-downtown-mec',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 80,
        resourceAllocations: [{ resourceTypeId: 'res-jetson-agx-orin', instances: 80, weightPercent: 100 }],
        trustLevel: 'semi_honest' as const,
        customTrustScore: 0.80,
        filterIntervals: { computeMin: 20, computeMax: 50, bandwidthMin: 500, bandwidthMax: 2000, availabilityMin: 95, availabilityMax: 100 },
        position: { x: 180, y: 460 }
      },
      {
        id: 'grp-smart-traffic-sensors',
        name: 'Smart Intersection Traffic Cams & Sensors',
        role: 'data_source' as RoleType,
        hierarchyLevel: 3,
        parentId: 'grp-downtown-mec',
        resourceSelectionMode: 'multiple' as const,
        sizingMode: 'per_type' as const,
        totalInstances: 140,
        resourceAllocations: [
          { resourceTypeId: 'res-jetson-nano-4gb', instances: 100, weightPercent: 71 },
          { resourceTypeId: 'res-smart-meter-sensor', instances: 40, weightPercent: 29 }
        ],
        trustLevel: 'zero_trust' as const,
        customTrustScore: 0.65,
        filterIntervals: { computeMin: 0.01, computeMax: 2, bandwidthMin: 5, bandwidthMax: 200, availabilityMin: 90, availabilityMax: 100 },
        position: { x: 420, y: 460 }
      },
      {
        id: 'grp-highway-connected-trucks',
        name: 'Connected Heavy Cargo Haulers',
        role: 'training_node' as RoleType,
        hierarchyLevel: 3,
        parentId: 'grp-highway-mec',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 50,
        resourceAllocations: [{ resourceTypeId: 'res-jetson-agx-orin', instances: 50, weightPercent: 100 }],
        trustLevel: 'semi_honest' as const,
        customTrustScore: 0.82,
        filterIntervals: { computeMin: 20, computeMax: 50, bandwidthMin: 500, bandwidthMax: 2000, availabilityMin: 95, availabilityMax: 100 },
        position: { x: 740, y: 460 }
      }
    ],
    config: {
      ...DEFAULT_GLOBAL_CONFIG,
      simulationName: 'Smart City Autonomous 5G MEC Simulation',
      globalRounds: 40,
      simulatedNetworkConditions: { packetLossPercent: 3.5, latencyJitterMs: 40, churnRatePercent: 8.5 }
    }
  },
  {
    id: 'tmpl-massive-mobile',
    name: 'Cross-Device Massive Scale Mobile (10k+ Devices)',
    description: 'Heterogeneous consumer smartphones participating in keyboard prediction with high churn and differential privacy.',
    groups: [
      {
        id: 'grp-mobile-root',
        name: 'Central Mobile FL Orchestrator',
        role: 'root_aggregator' as RoleType,
        hierarchyLevel: 1,
        parentId: null,
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 8,
        resourceAllocations: [{ resourceTypeId: 'res-h100-sxm5', instances: 8, weightPercent: 100 }],
        trustLevel: 'secure_enclave' as const,
        customTrustScore: 0.99,
        filterIntervals: { computeMin: 1000, computeMax: 2000, bandwidthMin: 200000, bandwidthMax: 400000, availabilityMin: 99.5, availabilityMax: 100 },
        position: { x: 480, y: 80 }
      },
      {
        id: 'grp-flagship-phones',
        name: 'Flagship Mobile Client Pool',
        role: 'training_node' as RoleType,
        hierarchyLevel: 2,
        parentId: 'grp-mobile-root',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 4000,
        resourceAllocations: [{ resourceTypeId: 'res-snapdragon-8-gen3', instances: 4000, weightPercent: 100 }],
        trustLevel: 'zero_trust' as const,
        customTrustScore: 0.50,
        filterIntervals: { computeMin: 2.0, computeMax: 6.0, bandwidthMin: 50, bandwidthMax: 300, availabilityMin: 80, availabilityMax: 95 },
        position: { x: 280, y: 320 }
      },
      {
        id: 'grp-midrange-phones',
        name: 'Mid-Tier Mobile Client Pool',
        role: 'training_node' as RoleType,
        hierarchyLevel: 2,
        parentId: 'grp-mobile-root',
        resourceSelectionMode: 'single' as const,
        sizingMode: 'total' as const,
        totalInstances: 6000,
        resourceAllocations: [{ resourceTypeId: 'res-midrange-mobile', instances: 6000, weightPercent: 100 }],
        trustLevel: 'zero_trust' as const,
        customTrustScore: 0.45,
        filterIntervals: { computeMin: 0.5, computeMax: 2.5, bandwidthMin: 20, bandwidthMax: 100, availabilityMin: 70, availabilityMax: 90 },
        position: { x: 680, y: 320 }
      }
    ],
    config: {
      ...DEFAULT_GLOBAL_CONFIG,
      simulationName: 'Massive Mobile Cross-Device Simulation',
      globalRounds: 100,
      federatedAlgorithm: 'fedprox',
      simulatedNetworkConditions: { packetLossPercent: 5.0, latencyJitterMs: 80, churnRatePercent: 18.0 }
    }
  }
];

export function computeGroupStats(group: SimulationGroup, catalog: ResourceType[]) {
  let totalCompute = 0;
  let totalBandwidth = 0;
  let weightedAvailabilitySum = 0;
  let totalAllocatedInstances = 0;

  for (const alloc of group.resourceAllocations) {
    const res = catalog.find(r => r.id === alloc.resourceTypeId);
    if (!res) continue;
    const instances = alloc.instances || 0;
    totalAllocatedInstances += instances;
    totalCompute += res.computePowerTFlops * instances;
    totalBandwidth += res.bandwidthMbps * instances;
    weightedAvailabilitySum += res.availabilityPercent * instances;
  }

  const avgAvailability = totalAllocatedInstances > 0 
    ? weightedAvailabilitySum / totalAllocatedInstances 
    : 0;

  return {
    instances: totalAllocatedInstances,
    computeTFlops: Math.round(totalCompute * 10) / 10,
    bandwidthMbps: Math.round(totalBandwidth),
    bandwidthGbps: Math.round((totalBandwidth / 1000) * 10) / 10,
    avgAvailability: Math.round(avgAvailability * 10) / 10
  };
}

export function computeSystemStats(groups: SimulationGroup[], catalog: ResourceType[]) {
  let totalInstances = 0;
  let totalCompute = 0;
  let totalBandwidthMbps = 0;
  let weightedAvailabilitySum = 0;
  const roleBreakdown: Record<RoleType, number> = {
    root_aggregator: 0,
    regional_aggregator: 0,
    data_source: 0,
    training_node: 0,
    validator: 0,
    parameter_server: 0
  };

  let maxHierarchy = 1;

  for (const group of groups) {
    roleBreakdown[group.role] = (roleBreakdown[group.role] || 0) + 1;
    if (group.hierarchyLevel > maxHierarchy) maxHierarchy = group.hierarchyLevel;

    const stats = computeGroupStats(group, catalog);
    totalInstances += stats.instances;
    totalCompute += stats.computeTFlops;
    totalBandwidthMbps += stats.bandwidthMbps;
    weightedAvailabilitySum += stats.avgAvailability * stats.instances;
  }

  const avgAvailability = totalInstances > 0 
    ? weightedAvailabilitySum / totalInstances 
    : 0;

  return {
    totalGroups: groups.length,
    totalInstances,
    totalComputeTFlops: Math.round(totalCompute * 10) / 10,
    aggregateBandwidthGbps: Math.round((totalBandwidthMbps / 1000) * 10) / 10,
    averageAvailability: Math.round(avgAvailability * 10) / 10,
    hierarchyDepth: maxHierarchy,
    roleBreakdown
  };
}
