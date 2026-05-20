import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

/** Serves world-atlas TopoJSON from node_modules (same-origin; no CDN fetch in browser). */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') === '50' ? '50' : '110';
    const file = path.join(
      process.cwd(),
      'node_modules',
      'world-atlas',
      `countries-${detail}m.json`,
    );
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
