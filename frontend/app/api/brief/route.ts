/**
 * Next.js API route — `/api/brief`
 *
 * In the Emergent hosted environment, requests to `/api/*` are routed by
 * the Kubernetes ingress to the FastAPI backend on port 8001. So this
 * handler is primarily for GitHub-portability: if you deploy this codebase
 * to Vercel or Netlify, this route handler will work as the brief endpoint.
 *
 * The intelligence layer in TypeScript form lives under `lib/intelligence/`
 * (mirrors the Python implementation in /app/backend/intelligence/).
 *
 * For now, this route proxies to the FastAPI service.
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.REACT_APP_BACKEND_URL ?? '';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Brief generation failed' },
      { status: 500 }
    );
  }
}
