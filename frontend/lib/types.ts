// Mirrors /app/backend/intelligence/types.py — keep them in sync.

export type CompanionState = 'silent' | 'attention' | 'escalation' | 'decision';

export interface OneThing {
  headline: string;
  reasoning: string;
}

export interface HandlePersonallyItem {
  source: 'email' | 'slack';
  from: string;
  subject: string;
  why: string;
}

export interface ToCancel {
  meeting: string;
  time: string;
  reason: string;
}

export interface ToRevive {
  item: string;
  lastTouched: string;
  suggestedAction: string;
}

export interface ItemScore {
  itemId: string;
  source: 'email' | 'slack' | 'calendar' | 'open_loop';
  title: string;
  stakes: number;
  founderSpecific: number;
  timeSensitivity: number;
  relationshipWeight: number;
  total: number;
  rationale: string;
}

export interface RuleFlag {
  rule: string;
  targetId: string;
  reason: string;
  severity: 'info' | 'warn' | 'force';
}

export interface Brief {
  date: string;
  founderName: string;
  oneThing: OneThing;
  handlePersonally: HandlePersonallyItem[];
  toCancel: ToCancel;
  toRevive: ToRevive;
  generatedAt: string;
  scoresPreview: ItemScore[];
  ruleFlags: RuleFlag[];
  model: string;
  latencyMs: number;
}

export interface CompanionAlert {
  state: CompanionState;
  title: string;
  body: string;
  cta?: string | null;
  sourceId?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  durationMin: number;
  recurring?: boolean;
  agenda?: string | null;
  attendees?: string[];
  notes?: string | null;
  rescheduleCount?: number;
  personal?: boolean;
}

export interface InboxItem {
  id: string;
  from: string;
  fromEmail?: string;
  fromCategory: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  ageHours: number;
  unanswered?: boolean;
  investorTier?: number | null;
  dealValueINR?: number | null;
  churnRisk?: boolean;
}

export interface SlackItem {
  id: string;
  channel: string;
  channelType: 'dm' | 'channel';
  from: string;
  fromCategory: string;
  text: string;
  timestamp: string;
  ageHours: number;
  unread?: boolean;
  heat: 'low' | 'medium' | 'high' | 'stale';
}

export interface OpenLoop {
  id: string;
  item: string;
  lastTouched: string;
  ageDays: number;
  expiresIn?: string | null;
  category: string;
  weight: number;
}

export interface InputsBundle {
  calendar: CalendarEvent[];
  inbox: InboxItem[];
  slack: SlackItem[];
  openLoops: OpenLoop[];
}

export interface EveningClose {
  date: string;
  decisionsMade: string[];
  stillOpen: string[];
  tomorrowsFirstMove?: string | null;
}

export interface DemoOverride {
  op: 'remove' | 'patch' | 'add';
  id?: string;
  [key: string]: unknown;
}

export interface Overrides {
  calendar?: DemoOverride[];
  inbox?: DemoOverride[];
  slack?: DemoOverride[];
}
