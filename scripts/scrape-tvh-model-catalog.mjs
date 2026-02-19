#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const TVH_BASE_URL = 'https://www.tvh.com';
const SITEMAP_INDEX_URL = `${TVH_BASE_URL}/sitemaps/models/sitemap.xml`;
const MODEL_PAGE_TITLE_SUFFIX = ' - Parts in stock! | TVH';
const LOC_REGEX = /<loc>(.*?)<\/loc>/g;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    output: 'scripts/output/tvh-machine-model-catalog.json',
    sqlOutput: null,
    maxSitemapPages: null,
    maxModels: null,
    upsertSupabase: false,
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--output') {
      options.output = args[++i];
      continue;
    }
    if (arg === '--sql-output') {
      options.sqlOutput = args[++i];
      continue;
    }
    if (arg === '--max-sitemap-pages') {
      options.maxSitemapPages = Number(args[++i]) || null;
      continue;
    }
    if (arg === '--max-models') {
      options.maxModels = Number(args[++i]) || null;
      continue;
    }
    if (arg === '--upsert-supabase') {
      options.upsertSupabase = true;
      continue;
    }
    if (arg === '--supabase-url') {
      options.supabaseUrl = args[++i] ?? '';
      continue;
    }
    if (arg === '--supabase-service-role-key') {
      options.supabaseServiceRoleKey = args[++i] ?? '';
      continue;
    }
  }

  return options;
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'HireBase TVH scraper (+https://www.tvh.com)',
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.text();
};

const getXmlLocs = (xml) => [...xml.matchAll(LOC_REGEX)].map((match) => match[1]);

const normalizeSpaces = (value) => value.replace(/\s+/g, ' ').trim();

const slugToTitleCase = (slug) => {
  const words = decodeURIComponent(slug)
    .split(/[-_]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
  return normalizeSpaces(
    words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  );
};

const slugToModelLabel = (slug) => {
  const words = decodeURIComponent(slug)
    .split(/[-_]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
  return normalizeSpaces(
    words
      .map((word) => {
        if (/[0-9]/.test(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' '),
  );
};

const toAbsoluteUrl = (value) => {
  if (!value) {
    return null;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('//')) {
    return `https:${value}`;
  }
  if (value.startsWith('/')) {
    return `${TVH_BASE_URL}${value}`;
  }
  return `${TVH_BASE_URL}/${value}`;
};

const extractTitle = (html) => {
  const match = html.match(/<title>(.*?)<\/title>/s);
  return match ? normalizeSpaces(match[1]) : '';
};

const extractModelImageFromHtml = (html, expectedAlt = '') => {
  const expected = expectedAlt.toLowerCase();
  const matches = [...html.matchAll(/<img\s+([^>]+?)\/?>/g)];
  const images = matches.map((match) => {
    const attrs = match[1];
    const src = attrs.match(/(?:src|data-src)="([^"]+)"/)?.[1] ?? '';
    const alt = attrs.match(/alt="([^"]*)"/)?.[1] ?? '';
    return {
      src,
      alt,
      absoluteSrc: toAbsoluteUrl(src),
    };
  }).filter((item) => Boolean(item.absoluteSrc));

  const exactAlt = images.find((item) => item.alt && item.alt.toLowerCase() === expected);
  if (exactAlt) {
    return exactAlt.absoluteSrc;
  }

  const containsAlt = images.find((item) => item.alt && expected && item.alt.toLowerCase().includes(expected));
  if (containsAlt) {
    return containsAlt.absoluteSrc;
  }

  const machinePicture = images.find((item) => /machinepictures|inline-images/i.test(item.src));
  if (machinePicture) {
    return machinePicture.absoluteSrc;
  }

  const tvhImage = images.find((item) => item.src.includes('/sites/tvh/files/'));
  return tvhImage?.absoluteSrc ?? null;
};

const parseModelUrl = (url) => {
  const pathParts = new URL(url).pathname
    .replace(/^\/parts\/models\//, '')
    .split('/')
    .filter(Boolean);

  if (pathParts.length !== 3) {
    return null;
  }

  const [machineTypeSlug, makeSlug, modelSlug] = pathParts;
  if (!modelSlug.includes(makeSlug)) {
    return null;
  }

  return { machineTypeSlug, makeSlug, modelSlug };
};

const buildCatalogEntries = (modelUrls, machineTypeImages) => {
  const records = [];

  for (const sourceUrl of modelUrls) {
    const parsed = parseModelUrl(sourceUrl);
    if (!parsed) {
      continue;
    }

    const machineType = slugToTitleCase(parsed.machineTypeSlug);
    const make = slugToTitleCase(parsed.makeSlug);
    const modelFromSlug = slugToModelLabel(parsed.modelSlug);
    let model = modelFromSlug;

    const makeLower = make.toLowerCase();
    const modelLower = modelFromSlug.toLowerCase();
    if (modelLower.startsWith(`${makeLower} `)) {
      model = modelFromSlug.slice(make.length).trim();
    }

    const displayName = normalizeSpaces(`${make} ${model}`.trim());
    records.push({
      machine_type: machineType,
      make,
      model,
      display_name: displayName,
      image_url: machineTypeImages.get(parsed.machineTypeSlug) ?? null,
      source_url: sourceUrl,
    });
  }

  return records.sort((a, b) => a.display_name.localeCompare(b.display_name));
};

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const writeSqlUpsertFile = async (records, outputFile) => {
  const lines = [];

  const sqlValue = (value) => {
    if (value == null) {
      return 'null';
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const groups = chunk(records, 500);
  for (const group of groups) {
    lines.push('insert into public.machine_model_catalog (machine_type, make, model, display_name, image_url, source_url)');
    lines.push('values');
    lines.push(group.map((record) => `  (${[
      sqlValue(record.machine_type),
      sqlValue(record.make),
      sqlValue(record.model),
      sqlValue(record.display_name),
      sqlValue(record.image_url),
      sqlValue(record.source_url),
    ].join(', ')})`).join(',\n'));
    lines.push('on conflict (source_url) do update set');
    lines.push('  machine_type = excluded.machine_type,');
    lines.push('  make = excluded.make,');
    lines.push('  model = excluded.model,');
    lines.push('  display_name = excluded.display_name,');
    lines.push('  image_url = excluded.image_url;');
    lines.push('');
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, lines.join('\n'), 'utf8');
};

const upsertToSupabase = async (records, supabaseUrl, serviceRoleKey) => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --upsert-supabase');
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/machine_model_catalog?on_conflict=source_url`;
  const batches = chunk(records, 500);

  for (let i = 0; i < batches.length; i += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batches[i]),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase upsert failed on batch ${i + 1}/${batches.length}: ${response.status} ${body}`);
    }

    if ((i + 1) % 20 === 0 || i === batches.length - 1) {
      console.log(`Upserted batch ${i + 1}/${batches.length}`);
    }
  }
};

const run = async () => {
  const options = parseArgs();

  console.log(`Fetching sitemap index: ${SITEMAP_INDEX_URL}`);
  const sitemapIndexXml = await fetchText(SITEMAP_INDEX_URL);
  let sitemapPageUrls = getXmlLocs(sitemapIndexXml);
  if (options.maxSitemapPages) {
    sitemapPageUrls = sitemapPageUrls.slice(0, options.maxSitemapPages);
  }

  console.log(`Found ${sitemapPageUrls.length} sitemap pages`);

  const depthOneUrls = new Set();
  const modelCandidateUrls = [];

  for (let i = 0; i < sitemapPageUrls.length; i += 1) {
    const sitemapUrl = sitemapPageUrls[i];
    const sitemapXml = await fetchText(sitemapUrl);
    const pageUrls = getXmlLocs(sitemapXml);

    for (const pageUrl of pageUrls) {
      const parts = new URL(pageUrl).pathname
        .replace(/^\/parts\/models\//, '')
        .split('/')
        .filter(Boolean);

      if (parts.length === 1) {
        depthOneUrls.add(pageUrl);
      } else if (parts.length === 3 && parts[2].includes(parts[1])) {
        modelCandidateUrls.push(pageUrl);
      }
    }

    if ((i + 1) % 25 === 0 || i === sitemapPageUrls.length - 1) {
      console.log(`Parsed ${i + 1}/${sitemapPageUrls.length} sitemap pages`);
    }
  }

  let filteredModelUrls = modelCandidateUrls;
  if (options.maxModels) {
    filteredModelUrls = filteredModelUrls.slice(0, options.maxModels);
  }

  console.log(`Model candidates: ${filteredModelUrls.length}`);
  console.log(`Machine type pages: ${depthOneUrls.size}`);

  const modelsByMachineType = new Map();
  for (const url of filteredModelUrls) {
    const parsed = parseModelUrl(url);
    if (!parsed) {
      continue;
    }
    const list = modelsByMachineType.get(parsed.machineTypeSlug) ?? [];
    list.push(url);
    modelsByMachineType.set(parsed.machineTypeSlug, list);
  }

  const machineTypeImages = new Map();
  for (const [machineTypeSlug, urls] of modelsByMachineType.entries()) {
    let imageUrl = null;

    for (const modelUrl of urls.slice(0, 5)) {
      try {
        const html = await fetchText(modelUrl);
        const title = extractTitle(html);
        const modelName = title.endsWith(MODEL_PAGE_TITLE_SUFFIX)
          ? title.slice(0, -MODEL_PAGE_TITLE_SUFFIX.length).trim()
          : '';
        imageUrl = extractModelImageFromHtml(html, modelName);
        if (imageUrl) {
          break;
        }
      } catch {
        // Ignore per-page failure and try the next model URL for this type.
      }
    }

    if (imageUrl) {
      machineTypeImages.set(machineTypeSlug, imageUrl);
    }
  }

  const catalogEntries = buildCatalogEntries(filteredModelUrls, machineTypeImages);
  console.log(`Catalog rows ready: ${catalogEntries.length}`);

  await fs.mkdir(path.dirname(options.output), { recursive: true });
  await fs.writeFile(options.output, JSON.stringify(catalogEntries, null, 2), 'utf8');
  console.log(`Wrote JSON: ${options.output}`);

  if (options.sqlOutput) {
    await writeSqlUpsertFile(catalogEntries, options.sqlOutput);
    console.log(`Wrote SQL upserts: ${options.sqlOutput}`);
  }

  if (options.upsertSupabase) {
    await upsertToSupabase(
      catalogEntries,
      options.supabaseUrl,
      options.supabaseServiceRoleKey,
    );
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
