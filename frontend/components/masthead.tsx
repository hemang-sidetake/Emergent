'use client';
import { motion } from 'framer-motion';
import { formatDateline, volumeLabel } from '@/lib/utils';

interface Props {
  date: string;
  founderName: string;
  weatherLine?: string;
}

export function Masthead({ date, founderName, weatherLine }: Props) {
  return (
    <header className="w-full mb-12">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="masthead-rule py-5"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="dateline text-muted">{volumeLabel(0)}</span>
          <span className="dateline text-muted hidden sm:block">{formatDateline(date)}</span>
          <span className="dateline text-muted">FOR {founderName.toUpperCase()}</span>
        </div>

        <h1 className="font-heading font-light text-center mt-6 mb-2 text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
          The Morning <span className="italic font-normal">Dispatch</span>
        </h1>

        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="dateline text-muted">A Chief of Staff, in print form</span>
        </div>

        {weatherLine && (
          <p className="text-center mt-4 text-sm text-muted italic font-reading">
            {weatherLine}
          </p>
        )}
      </motion.div>
    </header>
  );
}
