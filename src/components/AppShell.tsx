'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { TickerGrid } from './TickerGrid';
import { RatioLab } from './RatioLab';
import { SettingsModal } from './SettingsModal';
import { clientCache } from '@/lib/cache';

interface AppShellProps {
  initialData?: any;
}

export function AppShell({ initialData }: AppShellProps) {
  const [activeTab, setActiveTab] = useState('tickers');
  const [showSettings, setShowSettings] = useState(false);
  const [fredKey, setFredKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('FRED_API_KEY');
    }
    return null;
  });

  const handleSaveFredKey = (key: string) => {
    localStorage.setItem('FRED_API_KEY', key);
    setFredKey(key);
  };

  const handleClearFredKey = () => {
    localStorage.removeItem('FRED_API_KEY');
    setFredKey(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-amber-400 text-lg font-bold">G/R</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white/90">Gold Ratio Analytics</h1>
                <p className="text-xs text-white/50">Precious metals & macro ratios</p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white/90"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-strong w-full sm:w-auto mb-8">
            <TabsTrigger
              value="tickers"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white px-6"
            >
              Tickers
            </TabsTrigger>
            <TabsTrigger
              value="ratios"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white px-6"
            >
              Ratios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickers" className="mt-0">
            <TickerGrid initialData={initialData} fredKey={fredKey} />
          </TabsContent>

          <TabsContent value="ratios" className="mt-0">
            <RatioLab fredKey={fredKey} onOpenSettings={() => setShowSettings(true)} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fredKey={fredKey}
        onSaveKey={handleSaveFredKey}
        onClearKey={handleClearFredKey}
      />
    </div>
  );
}
