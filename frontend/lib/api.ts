import type {
  Brief,
  CompanionAlert,
  EveningClose,
  InputsBundle,
  Overrides
} from './types';

const RAW_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.REACT_APP_BACKEND_URL ?? '';
const BASE = RAW_BASE.replace(/\/$/, '');

if (!BASE && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set; API calls will fail.');
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => http<{ status: string }>('/api/health'),
  persona: () => http<Record<string, unknown>>('/api/persona'),
  inputs: () => http<InputsBundle>('/api/inputs'),
  brief: (overrides: Overrides = {}, useLlm = true) =>
    http<Brief>('/api/brief', {
      method: 'POST',
      body: JSON.stringify({ use_llm: useLlm, overrides })
    }),
  companion: () => http<{ alerts: CompanionAlert[] }>('/api/companion'),
  saveEveningClose: (payload: EveningClose) =>
    http<{ status: string }>('/api/evening-close', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getEveningClose: () => http<EveningClose>('/api/evening-close')
};
