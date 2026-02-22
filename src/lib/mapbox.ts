export const MAPBOX_ACCESS_TOKEN = String(
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ?? '',
).trim();

export interface MapboxAddressSuggestion {
  id: string;
  fullAddress: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface MapboxContextEntry {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  place_name?: string;
  context?: MapboxContextEntry[];
  center?: [number, number];
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

const findContext = (context: MapboxContextEntry[] | undefined, prefix: string) =>
  (context ?? []).find((entry) => typeof entry.id === 'string' && entry.id.startsWith(prefix));

const parseStateCode = (shortCode?: string) => {
  if (!shortCode) {
    return undefined;
  }

  const upper = shortCode.toUpperCase();
  if (!upper.includes('-')) {
    return upper;
  }
  return upper.split('-').at(-1);
};

export async function searchMapboxAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<MapboxAddressSuggestion[]> {
  const normalized = query.trim();
  if (!normalized || normalized.length < 3 || !MAPBOX_ACCESS_TOKEN) {
    return [];
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    autocomplete: 'true',
    limit: '6',
    language: 'en',
    // "street" is not a valid v5 geocoding type and triggers 422 responses.
    types: 'address,place,postcode,locality,neighborhood',
  });
  const baseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalized)}.json`;
  const endpoint = `${baseUrl}?${params.toString()}`;

  let response = await fetch(endpoint, { signal });
  if (!response.ok && response.status === 422) {
    // Retry without the "types" filter in case Mapbox rejects the type list.
    params.delete('types');
    response = await fetch(`${baseUrl}?${params.toString()}`, { signal });
  }

  if (!response.ok) {
    throw new Error(`Address lookup failed (${response.status})`);
  }

  const payload = (await response.json()) as MapboxResponse;
  return (payload.features ?? []).map((feature) => {
    const context = feature.context ?? [];
    const cityEntry = findContext(context, 'place');
    const stateEntry = findContext(context, 'region');
    const countryEntry = findContext(context, 'country');
    const stateCode = parseStateCode(stateEntry?.short_code);

    return {
      id: feature.id,
      fullAddress: feature.place_name ?? '',
      city: cityEntry?.text,
      state: stateEntry?.text,
      stateCode,
      country: countryEntry?.text,
      longitude: feature.center?.[0],
      latitude: feature.center?.[1],
    };
  });
}
