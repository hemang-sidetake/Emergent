'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import type { Brief } from '@/lib/types';
import { GlobalNav } from '@/components/global-nav';

export default function SlackMockupPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  useEffect(() => {
    api.brief({}, false).then(setBrief).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper dark:bg-dark-bg">
      <GlobalNav />
      <main className="flex-1 pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.18em] text-muted hover:text-ink dark:hover:text-dark-fg inline-flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="h-3 w-3" /> Back to brief
          </Link>

          <p className="dateline text-muted mb-2">Imagine this in</p>
          <h1 className="font-heading text-5xl font-light tracking-tight mb-8">Slack.</h1>
          <p className="font-reading text-lg text-muted mb-10">
            The same brief, delivered as a Slack DM at 7am. Same voice. Same constraints.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-[#1A1D21] rounded-lg shadow-xl border border-rule dark:border-dark-border overflow-hidden"
            data-testid="slack-mockup"
          >
            {/* Slack header */}
            <div className="bg-[#350D36] text-white px-5 py-3 flex items-center gap-3">
              <Hash className="h-4 w-4 opacity-70" />
              <div>
                <p className="font-sans font-bold text-sm">morning-dispatch</p>
                <p className="font-sans text-xs opacity-70">App · Private to Priya</p>
              </div>
            </div>

            {/* Message */}
            <div className="px-6 py-5 font-sans text-[#1d1c1d] dark:text-[#d1d2d3]">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  MD
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="font-bold text-sm">Morning Dispatch</p>
                    <span className="text-[10px] bg-rule/60 dark:bg-dark-border px-1 rounded">APP</span>
                    <p className="text-xs text-muted">7:00 AM</p>
                  </div>

                  {brief && (
                    <div className="space-y-4 text-sm leading-relaxed">
                      <p>
                        <strong>Good morning, Priya.</strong> Today's brief — read in 45 seconds.
                      </p>

                      <div>
                        <p className="font-bold mb-1">🎯 The one thing today</p>
                        <p>
                          <em>{brief.oneThing.headline}</em>
                        </p>
                        <p className="text-muted">{brief.oneThing.reasoning}</p>
                      </div>

                      <div>
                        <p className="font-bold mb-1">👤 Three to handle personally</p>
                        <ol className="space-y-1 list-decimal list-inside">
                          {brief.handlePersonally.map((h, i) => (
                            <li key={i}>
                              <strong>{h.from}</strong> — {h.subject}. <em>{h.why}</em>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <p className="font-bold mb-1">✂️ One to cancel</p>
                        <p>
                          <s>{brief.toCancel.meeting}</s> at {brief.toCancel.time} —{' '}
                          {brief.toCancel.reason}
                        </p>
                      </div>

                      <div>
                        <p className="font-bold mb-1">♻️ One to revive</p>
                        <p>
                          {brief.toRevive.item} (last touched {brief.toRevive.lastTouched}).{' '}
                          {brief.toRevive.suggestedAction}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button className="font-bold text-xs border border-[#1d1c1d] dark:border-[#d1d2d3] px-3 py-1.5 rounded">
                          Mark read
                        </button>
                        <button className="text-xs px-3 py-1.5 text-muted">Snooze 1 hr</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
