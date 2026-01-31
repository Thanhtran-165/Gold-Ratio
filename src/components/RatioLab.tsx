'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { RatioPanel } from './RatioPanel';
import { getAllRatios, getCoreRatios, getFredRatios } from '@/config/ratios';
import { GlassCard } from './GlassCard';

interface RatioLabProps {
  fredKey: string | null;
  onOpenSettings: () => void;
}

export function RatioLab({ fredKey, onOpenSettings }: RatioLabProps) {
  const [selectedRatioId, setSelectedRatioId] = useState<string | null>(null);
  const [window, setWindow] = useState<'6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL'>('3Y');

  const coreRatios = getCoreRatios();
  const fredRatios = getFredRatios();

  const selectedRatio = selectedRatioId
    ? getAllRatios().find((r) => r.id === selectedRatioId)
    : null;

  return (
    <div className="space-y-6">
      {/* Window Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white/90">Ratio Analysis</h2>
          <p className="text-sm text-white/50">Compare gold against various assets and indicators</p>
        </div>

        <div className="flex gap-2">
          {(['6M', '1Y', '3Y', '5Y', '10Y', 'ALL'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                window === w
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {!selectedRatio ? (
        <div className="space-y-6">
          {/* Core Ratios */}
          <section>
            <h3 className="text-lg font-medium text-white/80 mb-4">Core Ratios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coreRatios.map((ratio) => (
                <GlassCard
                  key={ratio.id}
                  onClick={() => setSelectedRatioId(ratio.id)}
                  className="cursor-pointer hover:bg-white/8 transition-all"
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white/90">{ratio.name}</h4>
                    <p className="text-sm text-white/60">{ratio.description}</p>
                    <div className="text-xs text-amber-400">{ratio.id}</div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* FRED Ratios */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white/80">FRED Ratios</h3>
              {!fredKey && (
                <button
                  onClick={onOpenSettings}
                  className="text-sm text-amber-400 hover:text-amber-300 underline"
                >
                  Add API Key
                </button>
              )}
            </div>

            {!fredKey && (
              <div className="glass rounded-lg p-6 mb-4 border border-amber-500/20">
                <div className="flex items-center gap-3 text-amber-400/80">
                  <Lock className="w-5 h-5" />
                  <p className="text-sm">
                    FRED API key required to access these ratios
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fredRatios.map((ratio) => (
                <GlassCard
                  key={ratio.id}
                  onClick={() => fredKey && setSelectedRatioId(ratio.id)}
                  hover={!!fredKey}
                  className={`relative ${!fredKey ? 'opacity-50' : 'cursor-pointer'}`}
                >
                  {!fredKey && (
                    <div className="absolute top-3 right-3 text-amber-500/70">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white/90">{ratio.name}</h4>
                    <p className="text-sm text-white/60">{ratio.description}</p>
                    <div className="text-xs text-amber-400">{ratio.id}</div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedRatioId(null)}
            className="mb-4 text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            ← Back to all ratios
          </button>
          <RatioPanel
            ratio={selectedRatio}
            window={window}
            fredKey={fredKey}
            onOpenSettings={onOpenSettings}
          />
        </div>
      )}
    </div>
  );
}
