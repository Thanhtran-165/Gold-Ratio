'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fredKey: string | null;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  fredKey,
  onSaveKey,
  onClearKey,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(fredKey || '');
      setTestResult(null);
    }
  }, [isOpen, fredKey]);

  const handleSave = () => {
    onSaveKey(apiKey);
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    onClearKey();
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!apiKey) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/fred/ping', {
        headers: {
          'x-fred-api-key': apiKey,
        },
      });

      const data = await response.json();
      setTestResult({ success: data.success, message: data.message || (data.success ? 'Connected!' : 'Connection failed') });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect to FRED API' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <GlassCard className="relative w-full max-w-md animate-fadeIn z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white/90">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* FRED API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">FRED API Key</label>
              {fredKey && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="w-3 h-3" />
                  Connected
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your FRED API key"
                className="w-full px-4 py-3 pr-24 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={isTesting || !apiKey}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey}
                className="flex-1 px-4 py-2 bg-amber-600/80 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              {fredKey && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {testResult.success ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <p className="text-sm text-white/70">
              Get your free FRED API key from{' '}
              <a
                href="https://fred.stlouisfed.org/docs/api/api_key.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                stlouisfed.org
              </a>
            </p>
            <p className="text-xs text-white/50">
              Required for US Treasury yields, M2 money supply, and US debt data.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
