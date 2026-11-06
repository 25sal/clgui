import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  Network, 
  Sliders, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { SimulationGlobalConfig, FederatedAlgorithm, SimulationGroup, ResourceType } from '../types/simulation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationGlobalConfig;
  onSave: (config: SimulationGlobalConfig) => void;
  groups: SimulationGroup[];
  catalog: ResourceType[];
}

export const SimulationSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave,
  groups,
  catalog
}) => {
  const [formData, setFormData] = useState<SimulationGlobalConfig>({ ...config });

  if (!isOpen) return null;

  // Run validation audits on the configuration
  const validationChecks = (() => {
    const issues: { type: 'error' | 'warning' | 'success'; message: string }[] = [];

    // 1. Root aggregator check
    const rootCount = groups.filter(g => g.role === 'root_aggregator' || (!g.parentId && g.hierarchyLevel === 1)).length;
    if (rootCount === 0) {
      issues.push({
        type: 'error',
        message: 'No Root Aggregator found in the topology. Add at least one Level 1 Aggregator.'
      });
    } else if (rootCount > 1) {
      issues.push({
        type: 'warning',
        message: `Multiple Root Aggregators (${rootCount}) configured. Verify multi-cloud or peer-root coordination mode.`
      });
    } else {
      issues.push({
        type: 'success',
        message: 'Primary Root Aggregator configured correctly.'
      });
    }

    // 2. Orphan leaf check
    const orphans = groups.filter(g => g.role !== 'root_aggregator' && !g.parentId);
    if (orphans.length > 0) {
      issues.push({
        type: 'warning',
        message: `${orphans.length} group(s) have no parent aggregator assigned (orphans in hierarchy).`
      });
    } else {
      issues.push({
        type: 'success',
        message: 'All worker and regional nodes are connected in hierarchy tree.'
      });
    }

    // 3. Compute capacity check
    const totalClients = groups
      .filter(g => g.role === 'training_node' || g.role === 'data_source')
      .reduce((acc, g) => acc + g.totalInstances, 0);

    if (totalClients === 0) {
      issues.push({
        type: 'warning',
        message: 'No training nodes or data sources defined yet. Add client groups to produce local gradients.'
      });
    } else {
      issues.push({
        type: 'success',
        message: `${totalClients} distributed edge client instances provisioned.`
      });
    }

    return issues;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <form 
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Simulation Engine Parameters &amp; Validation</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure distributed execution parameters, network degradation models, and verify hierarchy invariants.
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Validation Status Box */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Topology Sanity Verification
            </h3>
            <div className="space-y-1.5 text-xs">
              {validationChecks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {check.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  {check.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  {check.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                  <span className={check.type === 'error' ? 'text-red-700 dark:text-red-300 font-medium' : check.type === 'warning' ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-slate-700 dark:text-slate-300'}>
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Name & Federated Algorithm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Simulation Run Name
              </label>
              <input
                type="text"
                required
                value={formData.simulationName}
                onChange={(e) => setFormData({ ...formData, simulationName: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Federated Aggregation Algorithm
              </label>
              <select
                value={formData.federatedAlgorithm}
                onChange={(e) => setFormData({ ...formData, federatedAlgorithm: e.target.value as FederatedAlgorithm })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="hierarchical_fedavg">Hierarchical FedAvg (Multi-Tier)</option>
                <option value="fedavg">Standard FedAvg (McMahan et al.)</option>
                <option value="fedprox">FedProx (Heterogeneous Systems with Proximal Term)</option>
                <option value="scaffold">SCAFFOLD (Control Variates for Client Drift)</option>
                <option value="fedopt">FedOpt / FedAdam (Adaptive Server Optimizer)</option>
              </select>
            </div>
          </div>

          {/* Hyperparameters */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Training Hyperparameters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Global Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.globalRounds}
                  onChange={(e) => setFormData({ ...formData, globalRounds: parseInt(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Local Epochs</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.localEpochs}
                  onChange={(e) => setFormData({ ...formData, localEpochs: parseInt(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Batch Size</label>
                <input
                  type="number"
                  min="4"
                  max="512"
                  step="4"
                  value={formData.batchSize}
                  onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) || 32 })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  max="1.0"
                  value={formData.learningRate}
                  onChange={(e) => setFormData({ ...formData, learningRate: parseFloat(e.target.value) || 0.01 })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Network Degradation & Churn Simulation */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Simulated Network Conditions &amp; Device Churn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Packet Loss Rate:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{formData.simulatedNetworkConditions.packetLossPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={formData.simulatedNetworkConditions.packetLossPercent}
                  onChange={(e) => setFormData({
                    ...formData,
                    simulatedNetworkConditions: {
                      ...formData.simulatedNetworkConditions,
                      packetLossPercent: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-sky-600 dark:accent-sky-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Latency Jitter:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{formData.simulatedNetworkConditions.latencyJitterMs} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={formData.simulatedNetworkConditions.latencyJitterMs}
                  onChange={(e) => setFormData({
                    ...formData,
                    simulatedNetworkConditions: {
                      ...formData.simulatedNetworkConditions,
                      latencyJitterMs: parseInt(e.target.value)
                    }
                  })}
                  className="w-full accent-sky-600 dark:accent-sky-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Client Churn Dropout:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{formData.simulatedNetworkConditions.churnRatePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={formData.simulatedNetworkConditions.churnRatePercent}
                  onChange={(e) => setFormData({
                    ...formData,
                    simulatedNetworkConditions: {
                      ...formData.simulatedNetworkConditions,
                      churnRatePercent: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full accent-amber-600 dark:accent-amber-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
                />
              </div>
            </div>
          </div>

          {/* Data Distribution */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Data Partitioning &amp; Non-IID Skew
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Partitioning Strategy</label>
                <select
                  value={formData.dataDistribution}
                  onChange={(e) => setFormData({ ...formData, dataDistribution: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                >
                  <option value="non_iid_dirichlet">Non-IID Dirichlet Distribution (Heterogeneous)</option>
                  <option value="label_skew">Pathological Label Skew (2 classes / client)</option>
                  <option value="iid">IID Uniform (Homogeneous)</option>
                </select>
              </div>

              {formData.dataDistribution === 'non_iid_dirichlet' && (
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Dirichlet Alpha (&alpha;):</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{formData.dirichletAlpha}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="2.0"
                    step="0.05"
                    value={formData.dirichletAlpha}
                    onChange={(e) => setFormData({ ...formData, dirichletAlpha: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600 dark:accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Lower &alpha; (&lt;0.5) = severe feature &amp; label heterogeneity across clients.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
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
            Save Parameters
          </button>
        </div>
      </form>
    </div>
  );
};
