export type ActivityType = 
  | 'Task' 
  | 'ServiceTask' 
  | 'UserTask' 
  | 'ScriptTask' 
  | 'SendTask' 
  | 'ReceiveTask'
  | 'SubProcess';

export type PlacementStrategy = 
  | 'edge_preferred' 
  | 'mec_preferred' 
  | 'cloud_preferred' 
  | 'lowest_latency' 
  | 'highest_compute' 
  | 'energy_efficient' 
  | 'cost_optimal';

export type ActivityPriority = 'low' | 'normal' | 'high' | 'critical';

export interface BSimResourceDemand {
  resourceId: string;
  amount: number;
}

export interface BSimAttributeDemand {
  key: string;   // e.g. 'numInstructions', 'readOps', 'writeOps', 'networkPayload'
  value: number; // e.g. 2000, 200
}

export interface ActivityResourceConstraint {
  activityId: string;
  activityName: string;
  activityType: ActivityType;
  // Cloud-Edge Continuum scheduling targets:
  candidateGroupIds: string[]; // Groups in the continuum where this task can run
  allowedResourceTypes: string[]; // Specific resource types or empty for all in candidate groups
  placementStrategy: PlacementStrategy;
  requiredComputeTFlops: number;
  requiredMemoryGB: number;
  requiredBandwidthMbps: number;
  maxLatencyMs: number;
  priority: ActivityPriority;
  estimatedDurationSec: number;
  dataInputSizeMB: number;
  dataOutputSizeMB: number;
  notes?: string;

  // Direct BSim XML mappings (<bsim:resources> and <bsim:attribute>)
  bsimResources?: BSimResourceDemand[];
  bsimAttributes?: BSimAttributeDemand[];
}

export interface WorkflowGatewayBranch {
  gatewayId: string;
  flowId: string;
  targetRef?: string;
  branchingProbability: number; // 0.0 - 1.0 (e.g. 0.8 for Hit, 0.2 for Miss)
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  bpmnXml: string;
  processRef?: string;
  activityConstraints: Record<string, ActivityResourceConstraint>;
  branchingProbabilities?: WorkflowGatewayBranch[];
}

export interface ActivitySchedulingResult {
  activityId: string;
  activityName: string;
  assignedGroupId: string | null;
  assignedGroupName: string;
  assignedResourceName: string;
  assignedHierarchyTier: number; // 1 = Cloud, 2 = MEC, 3 = Edge
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'unschedulable';
  executionTimeSec: number;
  transferLatencyMs: number;
  dataVolumeMB: number;
  computeLoadPercent: number;
  reason?: string;
}

export interface WorkflowSimulationReport {
  workflowId: string;
  workflowName: string;
  totalMakespanSec: number;
  totalNetworkTransferMB: number;
  averageLatencyMs: number;
  tierDistribution: {
    edge: number; // percentage of activities on edge
    mec: number;  // percentage on MEC
    cloud: number; // percentage on cloud
  };
  results: ActivitySchedulingResult[];
}
