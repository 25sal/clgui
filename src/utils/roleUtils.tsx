import React from 'react';
import { 
  GitMerge, 
  Network, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Server, 
  HardDrive,
  Share2,
  Lock,
  Shield,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { RoleType, TrustLevel } from '../types/simulation';

export interface RoleMeta {
  role: RoleType;
  label: string;
  badge: string;
  defaultLevel: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  borderLight: string;
  description: string;
}

export const ROLE_DEFINITIONS: Record<RoleType, RoleMeta> = {
  root_aggregator: {
    role: 'root_aggregator',
    label: 'Global Root Aggregator (L1)',
    badge: 'Root Aggregator',
    defaultLevel: 1,
    icon: GitMerge,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
    borderLight: 'border-indigo-200 dark:border-indigo-500/30',
    description: 'Central orchestrator executing global model aggregation (FedAvg/SCAFFOLD) across all regional clusters.'
  },
  regional_aggregator: {
    role: 'regional_aggregator',
    label: 'Regional Aggregator (L2)',
    badge: 'Regional Aggregator',
    defaultLevel: 2,
    icon: Network,
    accentColor: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-500/10',
    borderLight: 'border-sky-200 dark:border-sky-500/30',
    description: 'Intermediate edge/MEC aggregator collecting and reducing gradient updates from local client silos.'
  },
  data_source: {
    role: 'data_source',
    label: 'Data Source / Sensor',
    badge: 'Data Source',
    defaultLevel: 3,
    icon: Database,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderLight: 'border-emerald-200 dark:border-emerald-500/30',
    description: 'Generates or stores partitioned raw training data, sensor streams, or local clinical PACS records.'
  },
  training_node: {
    role: 'training_node',
    label: 'Training Node / Worker',
    badge: 'Training Node',
    defaultLevel: 3,
    icon: Cpu,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-500/10',
    borderLight: 'border-purple-200 dark:border-purple-500/30',
    description: 'Executes local training epochs, backpropagation, and computing model parameter deltas.'
  },
  validator: {
    role: 'validator',
    label: 'Model Auditor / Validator',
    badge: 'Validator',
    defaultLevel: 3,
    icon: ShieldCheck,
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    borderLight: 'border-amber-200 dark:border-amber-500/30',
    description: 'Independent evaluation node verifying accuracy, adversarial poison detection, and fair distribution.'
  },
  parameter_server: {
    role: 'parameter_server',
    label: 'Parameter Server',
    badge: 'Param Server',
    defaultLevel: 2,
    icon: Server,
    accentColor: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-500/10',
    borderLight: 'border-teal-200 dark:border-teal-500/30',
    description: 'Dedicated storage node holding global model weights, checkpoint snapshots, and optimizer states.'
  }
};

export interface TrustMeta {
  level: TrustLevel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeClass: string;
  defaultScore: number;
  description: string;
}

export const TRUST_DEFINITIONS: Record<TrustLevel, TrustMeta> = {
  secure_enclave: {
    level: 'secure_enclave',
    label: 'Secure Enclave (TEE)',
    icon: Lock,
    color: 'text-cyan-700 dark:text-cyan-400',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30',
    defaultScore: 0.98,
    description: 'Hardware-attested Trusted Execution Environment (Intel SGX / AMD SEV) with zero leakage.'
  },
  high_trust: {
    level: 'high_trust',
    label: 'High Trust / Certified',
    icon: Shield,
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    defaultScore: 0.90,
    description: 'Certified consortium partner with cryptographic PKI verification and mutual TLS.'
  },
  semi_honest: {
    level: 'semi_honest',
    label: 'Semi-Honest (Standard)',
    icon: ShieldCheck,
    color: 'text-blue-700 dark:text-blue-400',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
    defaultScore: 0.75,
    description: 'Follows federated protocol correctly but may inspect received gradients; protected by SecAgg.'
  },
  zero_trust: {
    level: 'zero_trust',
    label: 'Zero Trust / Untrusted',
    icon: ShieldAlert,
    color: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    defaultScore: 0.50,
    description: 'Public or crowdsourced edge clients subject to Byzantine filtering, clipping, and differential privacy.'
  }
};
