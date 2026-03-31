import lookup from 'country-code-lookup';

/**
 * world-atlas / Natural Earth 110m countries: properties often only have `name`.
 * Feature `id` is ISO 3166-1 numeric (e.g. 840 → US).
 */
export function isoFromRsmGeography(geo) {
  if (!geo) return null;
  const p = geo.properties || {};
  const fromProp = (p.ISO_A2 || p.iso_a2 || p.ISO_A2_EH || '').toString().trim();
  if (fromProp && fromProp !== '-99') return fromProp;

  const id = geo.id != null ? String(geo.id).trim() : '';
  if (!id) return null;

  try {
    const hit = lookup.byIso(id);
    return hit?.iso2 || null;
  } catch {
    return null;
  }
}
