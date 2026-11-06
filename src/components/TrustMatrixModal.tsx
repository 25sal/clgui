import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  Info,
  Check,
  RefreshCw
} from 'lucide-react';
import { SimulationGroup, TrustLevel, InterGroupTrustLink } from '../types/simulation';
import { ROLE_DEFINITIONS, TRUST_DEFINITIONS } from '../utils/roleUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: SimulationGroup[];
  trustLinks: InterGroupTrustLink[];
  onUpdateTrustLinks: (links: InterGroupTrustLink[]) => void;
  onUpdateGroupTrust: (groupId: string, level: TrustLevel, score: number) => void;
}

export const TrustMatrixModal: React.FC<Props> = ({
  isOpen,
  onClose,
  groups,
  trustLinks,
  onUpdateTrustLinks,
  onUpdateGroupTrust
}) => {
  if (!isOpen) return null;

  // Local state for pairwise trust map: `${sourceId}->${targetId}` -> trustScore (0.0 to 1.0)
  const [matrixScores, setMatrixScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    // Seed default based on groups
    groups.forEach(source => {
      groups.forEach(target => {
        if (source.id === target.id) {
          map[`${source.id}->${target.id}`] = 1.0;
        } else {
          const existing = trustLinks.find(
            l => l.sourceGroupId === source.id && l.targetGroupId === target.id
          );
          if (existing) {
            map[`${source.id}->${target.id}`] = existing.trustScore;
          } else {
            // Default calculated from group base trust scores
            const avg = (source.customTrustScore + target.customTrustScore) / 2;
            map[`${source.id}->${target.id}`] = Math.round(avg * 100) / 100;
          }
        }
      });
    });
    return map;
  });

  const [selectedPair, setSelectedPair] = useState<{ sourceId: string; targetId: string } | null>(
    groups.length >= 2 ? { sourceId: groups[0].id, targetId: groups[1].id } : null
  );

  const handleCellClick = (sourceId: string, targetId: string) => {
    setSelectedPair({ sourceId, targetId });
  };

  const handleScoreChange = (score: number) => {
    if (!selectedPair) return;
    const key = `${selectedPair.sourceId}->${selectedPair.targetId}`;
    setMatrixScores(prev => ({
      ...prev,
      [key]: score
    }));
  };

  const handleSave = () => {
    const newLinks: InterGroupTrustLink[] = [];
    Object.entries(matrixScores).forEach(([key, score]) => {
      const [sourceId, targetId] = key.split('->');
      if (sourceId !== targetId) {
        newLinks.push({
          sourceGroupId: sourceId,
          targetGroupId: targetId,
          trustScore: score,
          securityMode: score > 0.9 ? 'tee_attested' : score > 0.7 ? 'secagg' : 'differential_privacy',
          dpEpsilon: score < 0.6 ? 1.5 : 5.0
        });
      }
    });
    onUpdateTrustLinks(newLinks);
    onClose();
  };

  const getCellColor = (score: number) => {
    if (score >= 0.95) return 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/30 dark:text-cyan-200 dark:border-cyan-500/40 font-medium';
    if (score >= 0.8) return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/30 dark:text-emerald-200 dark:border-emerald-500/40 font-medium';
    if (score >= 0.6) return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/30 dark:text-blue-200 dark:border-blue-500/40 font-medium';
    return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/40 font-medium';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inter-Group Trust &amp; Privacy Matrix</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define mutual trust levels and cryptographic parameters governing federated gradient exchanges.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Matrix Grid & Selected Pair Editor */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Matrix Grid */}
          <div className="lg:col-span-8 p-5 overflow-auto border-r border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-between">
              <span>Row: Reporting Source Group &rarr; Column: Receiving Target Aggregator</span>
              <span className="text-[11px] text-slate-500">Click any cell to edit pairwise trust</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-600 dark:text-slate-500 font-semibold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 sticky left-0 z-10">
                      Source \ Target
                    </th>
                    {groups.map(target => (
                      <th 
                        key={target.id}
                        className="p-2 text-center text-slate-800 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 max-w-[120px] truncate"
                        title={target.name}
                      >
                        {target.name.split(' ')[0]}..
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map(source => (
                    <tr key={source.id}>
                      <td className="p-2 font-medium text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky left-0 z-10 max-w-[160px] truncate" title={source.name}>
                        {source.name}
                      </td>
                      {groups.map(target => {
                        const isSelf = source.id === target.id;
                        const key = `${source.id}->${target.id}`;
                        const score = isSelf ? 1.0 : (matrixScores[key] ?? 0.8);
                        const isSelected = selectedPair?.sourceId === source.id && selectedPair?.targetId === target.id;

                        return (
                          <td
                            key={target.id}
                            onClick={() => !isSelf && handleCellClick(source.id, target.id)}
                            className={`p-2 text-center border font-mono tabular-nums cursor-pointer transition-colors ${
                              isSelf
                                ? 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-default'
                                : isSelected
                                ? 'ring-2 ring-indigo-500 z-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-950 dark:text-white font-bold'
                                : `${getCellColor(score)} hover:brightness-95 dark:hover:brightness-125`
                            }`}
                          >
                            {isSelf ? '—' : `${(score * 100).toFixed(0)}%`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Pair Detail Panel */}
          <div className="lg:col-span-4 p-5 bg-slate-50/70 dark:bg-slate-950/40 space-y-5 overflow-y-auto">
            {selectedPair && selectedPair.sourceId !== selectedPair.targetId ? (
              (() => {
                const source = groups.find(g => g.id === selectedPair.sourceId);
                const target = groups.find(g => g.id === selectedPair.targetId);
                const key = `${selectedPair.sourceId}->${selectedPair.targetId}`;
                const currentScore = matrixScores[key] ?? 0.8;

                if (!source || !target) return null;

                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Pairwise Trust Calibration
                    </h3>

                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Source Node:</span>
                        <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[180px]">{source.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Target Aggregator:</span>
                        <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[180px]">{target.name}</span>
                      </div>
                    </div>

                    {/* Trust Level Slider */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Inter-Group Trust Score</span>
                        <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                          {(currentScore * 100).toFixed(0)}% ({currentScore.toFixed(2)})
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.02"
                        value={currentScore}
                        onChange={(e) => handleScoreChange(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded"
                      />

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        {currentScore >= 0.95 ? (
                          <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                            Hardware Enclave (TEE) attestation enabled. Zero differential privacy noise required.
                          </span>
                        ) : currentScore >= 0.8 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            High Trust verified. Secure Aggregation (SecAgg) protocol active.
                          </span>
                        ) : currentScore >= 0.6 ? (
                          <span className="text-blue-700 dark:text-blue-400 font-medium">
                            Semi-Honest assumptions. Gradients clipped and masked via SecAgg.
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Zero Trust / Adversarial risk. Local Differential Privacy (DP epsilon = 1.2) + Byzantine Krum filter applied.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Security Protocol Options */}
                    <div className="space-y-2 text-xs">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Active Security Protocol</label>
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span>Secure Aggregation (SecAgg):</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Byzantine Tolerance:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">Multi-Krum Filter</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>DP Noise Budget (Epsilon):</span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                            {currentScore < 0.6 ? '1.5 (Strict)' : '4.5 (Moderate)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select any pair cell in the matrix table to inspect and customize trust settings.
              </div>
            )}
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
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Trust Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
