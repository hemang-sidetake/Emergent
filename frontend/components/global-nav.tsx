'use client';
import Link from 'next/link';
import { Command } from 'lucide-react';

export function GlobalNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-30 bg-paper/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-rule/60 dark:border-dark-border/60"
      data-testid="global-nav"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-lg tracking-tight hover:opacity-70 transition-opacity"
          data-testid="nav-home"
        >
          The Morning <span className="italic">Dispatch</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8 font-sans text-xs uppercase tracking-[0.18em] text-muted">
          <Link href="/" className="hover:text-ink dark:hover:text-dark-fg transition-colors" data-testid="nav-brief">
            Brief
          </Link>
          <Link href="/evening" className="hover:text-ink dark:hover:text-dark-fg transition-colors" data-testid="nav-evening">
            Evening
          </Link>
          <Link
            href="/mockups/slack"
            className="hover:text-ink dark:hover:text-dark-fg transition-colors"
            data-testid="nav-slack"
          >
            In Slack
          </Link>
          <Link
            href="/mockups/email"
            className="hover:text-ink dark:hover:text-dark-fg transition-colors"
            data-testid="nav-email"
          >
            In Email
          </Link>
        </div>

        <button
          className="hidden md:flex items-center gap-2 px-2.5 py-1 border border-rule dark:border-dark-border rounded-sm font-sans text-xs text-muted hover:border-ink/40 dark:hover:border-dark-fg/40 transition-colors"
          onClick={() => {
            const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(ev);
          }}
          data-testid="nav-open-console"
        >
          <Command className="h-3 w-3" />
          <span>K</span>
        </button>
      </div>
    </nav>
  );
}
