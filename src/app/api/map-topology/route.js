import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

/** Serves world-atlas TopoJSON from node_modules (same-origin; no CDN fetch in browser). */
export async function GET() {
  try {
    const file = path.join(process.cwd(), 'node_modules', 'world-atlas', 'countries-110m.json');
    const body = await readFile(file, 'utf-8');
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('map-topology', e);
    return NextResponse.json({ error: 'topology_unavailable' }, { status: 500 });
  }
}
