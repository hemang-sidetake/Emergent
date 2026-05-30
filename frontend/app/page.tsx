'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Brief, Overrides } from '@/lib/types';
import { Masthead } from '@/components/masthead';
import { MorningBrief } from '@/components/morning-brief';
import { DailyCompanion } from '@/components/daily-companion';
import { DemoConsole } from '@/components/demo-console';
import { RegenerationOverlay } from '@/components/regeneration-overlay';
import { GlobalNav } from '@/components/global-nav';
import { AnimatePresence } from 'framer-motion';

const WEATHER_LINES = [
  'A loud day. Investor windows are closing. Three personal asks. One meeting earns its place; one does not.',
  'Quiet calendar, noisy inbox. One thing matters above the rest.',
  'High stakes morning. Move on what cannot wait.'
];

export default function HomePage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const weatherLine = useMemo(
    () => WEATHER_LINES[Math.floor(Math.random() * WEATHER_LINES.length)],
    []
  );

  const load = useCallback(async (overrides: Overrides = {}, useLlm = true) => {
    setRegenerating(true);
    setError(null);
    try {
      const b = await api.brief(overrides, useLlm);
      setBrief(b);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate brief');
    } finally {
      // Minimum dwell on the overlay so the moment lands
      setTimeout(() => setRegenerating(false), 600);
    }
  }, []);

  useEffect(() => {
    // First load uses the fallback (instant) for speed, then upgrades to LLM
    api
      .brief({}, false)
      .then((fast) => setBrief(fast))
      .catch(() => null)
      .finally(() => load({}, true));
  }, [load]);

  // Cmd+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setConsoleOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-row">
      <GlobalNav />

      <main className="flex-1 flex justify-center px-5 sm:px-10 pt-28 pb-24 overflow-y-auto">
        <div className="w-full max-w-reading">
          {brief && (
            <>
              <Masthead
                date={brief.date}
                founderName={brief.founderName}
                weatherLine={weatherLine}
              />
              <MorningBrief brief={brief} />
            </>
          )}

          {!brief && !error && (
            <div className="pt-40 text-center" data-testid="brief-loading">
              <p className="dateline text-muted mb-3">Setting the type…</p>
              <h2 className="font-heading text-3xl italic font-light text-muted">
                Today's edition is going to press.
              </h2>
            </div>
          )}

          {error && (
            <div
              className="pt-40 text-center max-w-md mx-auto"
              data-testid="brief-error"
              role="alert"
            >
              <p className="dateline text-primary mb-3">Press dropped a plate</p>
              <h2 className="font-heading text-3xl font-medium mb-3">
                The brief didn't make it to print.
              </h2>
              <p className="font-reading text-muted">{error}</p>
              <button
                onClick={() => load({}, true)}
                className="mt-6 font-sans text-xs uppercase tracking-[0.2em] border border-ink dark:border-dark-fg px-5 py-2 hover:bg-ink hover:text-paper dark:hover:bg-dark-fg dark:hover:text-dark-bg transition-colors"
                data-testid="brief-retry"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </main>

      {brief && <DailyCompanion founderName={brief.founderName} refreshKey={refreshKey} />}

      <DemoConsole
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        onRegenerate={async (ov) => {
          setConsoleOpen(false);
          await load(ov, true);
        }}
        isRegenerating={regenerating}
      />

      <AnimatePresence>
        {regenerating && <RegenerationOverlay active={regenerating} />}
      </AnimatePresence>
    </div>
  );
}
