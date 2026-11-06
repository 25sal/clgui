import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Wifi, 
  Cpu, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { SimulationGroup, SimulationGlobalConfig, ResourceType } from '../types/simulation';
import { computeGroupStats, computeSystemStats } from '../data/resourceCatalog';
import { ROLE_DEFINITIONS } from '../utils/roleUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: SimulationGroup[];
  config: SimulationGlobalConfig;
  catalog: ResourceType[];
}

export const SimulationDryRunModal: React.FC<Props> = ({
  isOpen,
  onClose,
  groups,
  config,
  catalog
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundDurationMs, setRoundDurationMs] = useState(1200);

  // History logs & simulated metrics
  const [metricsHistory, setMetricsHistory] = useState<{
    round: number;
    loss: number;
    accuracy: number;
    activeNodes: number;
    droppedStragglers: number;
    networkTrafficMB: number;
    stepTimeSec: number;
  }[]>([
    {
      round: 1,
      loss: 2.45,
      accuracy: 18.2,
      activeNodes: 0,
      droppedStragglers: 0,
      networkTrafficMB: 0,
      stepTimeSec: 0
    }
  ]);

  const [activeStepPhase, setActiveStepPhase] = useState<'idle' | 'dispatch_weights' | 'local_training' | 'regional_aggregation' | 'global_aggregation'>('idle');

  const systemStats = computeSystemStats(groups, catalog);

  // Run a single simulation step
  const executeStep = () => {
    setCurrentRound(prevRound => {
      if (prevRound >= config.globalRounds) {
        setIsPlaying(false);
        return prevRound;
      }
      const nextRound = prevRound + 1;

      // Realistic FL convergence formula based on system compute & data distribution
      const baseDecay = config.dataDistribution === 'iid' ? 0.95 : 0.92;
      const progress = nextRound / config.globalRounds;
      const prevLoss = metricsHistory[metricsHistory.length - 1]?.loss || 2.45;
      const noise = (Math.random() - 0.5) * 0.04;
      const newLoss = Math.max(0.18, prevLoss * (1 - (0.07 * (1 - progress * 0.7))) + noise);
      const newAcc = Math.min(96.5, 100 - (newLoss * 32) + (Math.random() * 1.5));

      // Network churn simulation
      const churnRate = config.simulatedNetworkConditions.churnRatePercent / 100;
      const dropped = Math.round(systemStats.totalInstances * churnRate * (0.6 + Math.random() * 0.8));
      const active = Math.max(1, systemStats.totalInstances - dropped);

      // Network communication volume (MB per round)
      const modelSizeMB = 45; // ResNet-50 size
      const totalTraffic = Math.round((active * modelSizeMB * 2) * 10) / 10;

      // Estimated latency based on minimum client bandwidth
      const stepSec = Math.round((4.2 + (modelSizeMB * 8 / 50) + (100 / Math.max(1, systemStats.totalComputeTFlops))) * 10) / 10;

      setMetricsHistory(prev => [
        ...prev,
        {
          round: nextRound,
          loss: Math.round(newLoss * 1000) / 1000,
          accuracy: Math.round(newAcc * 10) / 10,
          activeNodes: active,
          droppedStragglers: dropped,
          networkTrafficMB: totalTraffic,
          stepTimeSec: stepSec
        }
      ]);

      return nextRound;
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      executeStep();
    }, roundDurationMs);
    return () => clearInterval(interval);
  }, [isPlaying, roundDurationMs, currentRound, config.globalRounds, metricsHistory]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentRound(1);
    setMetricsHistory([
      {
        round: 1,
        loss: 2.45,
        accuracy: 18.2,
        activeNodes: Math.round(systemStats.totalInstances * 0.96),
        droppedStragglers: Math.round(systemStats.totalInstances * 0.04),
        networkTrafficMB: 1250,
        stepTimeSec: 5.4
      }
    ]);
  };

  if (!isOpen) return null;

  const currentMetric = metricsHistory[metricsHistory.length - 1] || metricsHistory[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Simulation Engine Step-Through &amp; Dry Run</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify runtime convergence, straggler dropout, and hierarchical gradient aggregation across configured groups.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playback Controls & Progress Bar */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                isPlaying 
                  ? 'bg-amber-600 text-white hover:bg-amber-500' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Start Simulation'}
            </button>

            <button
              onClick={executeStep}
              disabled={isPlaying || currentRound >= config.globalRounds}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Step Round
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Reset simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Round <strong className="text-slate-900 dark:text-white font-mono">{currentRound}</strong> / {config.globalRounds}
            </span>

            <div className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/60">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                style={{ width: `${(currentRound / config.globalRounds) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span>Speed:</span>
              <select
                value={roundDurationMs}
                onChange={(e) => setRoundDurationMs(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white"
              >
                <option value={2000}>0.5x</option>
                <option value={1000}>1.0x</option>
                <option value={400}>2.5x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Telemetry Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-semibold">
                Simulated Loss
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                {currentMetric.loss.toFixed(3)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {config.federatedAlgorithm.toUpperCase()} Optimizer
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-semibold">
                Global Accuracy
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {currentMetric.accuracy.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Test benchmark score
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-semibold">
                Active Nodes / Stragglers
              </span>
              <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
                {currentMetric.activeNodes} <span className="text-xs text-slate-500 font-normal">/ -{currentMetric.droppedStragglers}</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {config.simulatedNetworkConditions.churnRatePercent}% simulated churn
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono font-semibold">
                Round Comm Volume
              </span>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
                {(currentMetric.networkTrafficMB / 1024).toFixed(2)} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">GB</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                SecAgg encrypted packets
              </span>
            </div>
          </div>

          {/* Hierarchical Round Flow Visualization */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Hierarchical Aggregation Pipeline (Round {currentRound})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1: Leaf Clients & Data Sources */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                  <span>1. Local Client Training</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {groups.filter(g => g.role === 'training_node' || g.role === 'data_source').length} edge groups computing {config.localEpochs} local epochs on partitioned batches.
                </p>
                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 pt-1 font-semibold">
                  &bull; Batch size: {config.batchSize} &bull; LR: {config.learningRate}
                </div>
              </div>

              {/* Step 2: Regional MEC Aggregators */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                  <span>2. Regional MEC Reduction</span>
                  <CheckCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {groups.filter(g => g.role === 'regional_aggregator').length || 1} intermediate cluster heads collecting localized weight deltas.
                </p>
                <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400 pt-1 font-semibold">
                  &bull; Byzantine Krum filter applied
                </div>
              </div>

              {/* Step 3: Root Global Aggregator */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                  <span>3. Global Enclave Aggregation</span>
                  <CheckCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Root aggregator updating global model checkpoints and dispatching weights for round {currentRound + 1}.
                </p>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 pt-1 font-semibold">
                  &bull; Model version v{currentRound}.0
                </div>
              </div>
            </div>
          </div>

          {/* Recent Round Logs Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Simulation Round History Telemetry
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950/40">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Round</th>
                    <th className="p-2.5">Loss</th>
                    <th className="p-2.5">Accuracy</th>
                    <th className="p-2.5">Active Clients</th>
                    <th className="p-2.5">Dropped Stragglers</th>
                    <th className="p-2.5">Data Transferred</th>
                    <th className="p-2.5">Step Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
                  {metricsHistory.slice(-6).reverse().map(m => (
                    <tr key={m.round} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-white">#{m.round}</td>
                      <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">{m.loss.toFixed(4)}</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{m.accuracy.toFixed(1)}%</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">{m.activeNodes}</td>
                      <td className="p-2.5 text-amber-600 dark:text-amber-400 font-semibold">{m.droppedStragglers}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">{(m.networkTrafficMB / 1024).toFixed(2)} GB</td>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400">{m.stepTimeSec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Algorithm: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{config.federatedAlgorithm}</span> · Total Instances: <span className="text-slate-900 dark:text-white font-semibold">{systemStats.totalInstances}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition-colors"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
