export type RoleType = 
  | 'root_aggregator' 
  | 'regional_aggregator' 
  | 'data_source' 
  | 'training_node' 
  | 'validator' 
  | 'parameter_server';

export type TrustLevel = 
  | 'zero_trust' 
  | 'semi_honest' 
  | 'high_trust' 
  | 'secure_enclave';

export type ResourceCategory = 
  | 'cloud_datacenter' 
  | 'workstation_gpu' 
  | 'edge_accelerator' 
  | 'mobile_device' 
  | 'iot_sensor' 
  | 'edge_server';

export interface ResourceType {
  id: string;
  name: string;
  category: ResourceCategory;
  computePowerTFlops: number; // e.g., 0.05 to 2000 TFLOPS
  memoryGB: number;
  bandwidthMbps: number; // e.g., 10 to 400000 Mbps
  availabilityPercent: number; // 0 - 100%
  architecture: string;
  powerWatts: number;
  description: string;
  isCustom?: boolean;

  // BSim / Scylla / Simulation parameters for XML generation
  cpuSpeed?: number; // instructions/s (e.g. 1000)
  ioRead?: number;   // operations/s (e.g. 1, 200)
  ioWrite?: number;  // operations/s
  txSpeed?: number;  // MB/s
  rxSpeed?: number;  // MB/s
  defaultQuantity?: number;
  defaultCost?: number;
  defaultTimeUnit?: 'SECONDS' | 'MINUTES' | 'HOURS';
}

export interface GroupResourceAllocation {
  resourceTypeId: string;
  instances: number;
  weightPercent?: number; // for proportional distribution
}

export interface SimulationGroup {
  id: string;
  name: string;
  role: RoleType;
  hierarchyLevel: number; // 1 = Top Root Aggregator, 2 = Regional / Intermediate, 3 = Leaf Node / Data Source / Worker
  parentId: string | null; // ID of parent group in hierarchy
  resourceSelectionMode: 'single' | 'multiple';
  sizingMode: 'total' | 'per_type';
  totalInstances: number;
  resourceAllocations: GroupResourceAllocation[];
  trustLevel: TrustLevel;
  customTrustScore: number; // 0.0 - 1.0
  filterIntervals: {
    computeMin: number;
    computeMax: number;
    bandwidthMin: number;
    bandwidthMax: number;
    availabilityMin: number;
    availabilityMax: number;
  };
  position: { x: number; y: number };
  notes?: string;
  colorTheme?: string;
}

export interface InterGroupTrustLink {
  sourceGroupId: string;
  targetGroupId: string;
  trustScore: number; // 0.0 - 1.0
  securityMode: 'tls_mutual' | 'tee_attested' | 'secagg' | 'differential_privacy';
  dpEpsilon?: number; // Differential privacy epsilon budget
}

export type FederatedAlgorithm = 
  | 'fedavg' 
  | 'fedprox' 
  | 'scaffold' 
  | 'hierarchical_fedavg' 
  | 'fedopt';

export interface SimulationGlobalConfig {
  simulationName: string;
  federatedAlgorithm: FederatedAlgorithm;
  globalRounds: number;
  localEpochs: number;
  batchSize: number;
  learningRate: number;
  simulatedNetworkConditions: {
    packetLossPercent: number;
    latencyJitterMs: number;
    churnRatePercent: number;
  };
  dataDistribution: 'iid' | 'non_iid_dirichlet' | 'label_skew';
  dirichletAlpha: number;
  secAggEnabled: boolean;
  byzantineToleranceEnabled: boolean;

  // BSim Scylla parameters
  bsimId?: string;
  bsimRandomSeed?: number;
  bsimSoftmaxExponent?: number;
  bsimProcessInstances?: number;
  bsimStartDateTime?: string;
  bsimArrivalRateDistribution?: 'exponential' | 'constant' | 'normal';
  bsimArrivalRateMean?: number;
  bsimArrivalRateTimeUnit?: 'SECONDS' | 'MINUTES' | 'HOURS';
}

export interface SimulationStats {
  totalGroups: number;
  totalInstances: number;
  totalComputeTFlops: number;
  aggregateBandwidthGbps: number;
  averageAvailability: number;
  hierarchyDepth: number;
  roleBreakdown: Record<RoleType, number>;
}
