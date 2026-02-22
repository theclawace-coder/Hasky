// Supabase Edge Function: generate-invoice-pdf
// Uses pdf-lib (pure JS, Deno-compatible) to create a professional A4 invoice PDF.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const errResponse = (status: number, msg: string) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeRelation = <T>(v: T | T[] | null | undefined): T | null => {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
};

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });

const fmtDate = (s: string | null | undefined) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errResponse(405, 'Method not allowed');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errResponse(401, 'Unauthorized');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceKey);

  let body: { invoice_id?: string };
  try {
    body = await req.json() as { invoice_id?: string };
  } catch {
    return errResponse(400, 'Invalid JSON body');
  }

  const invoiceId = body.invoice_id;
  if (!invoiceId) return errResponse(400, 'invoice_id is required');

  // Fetch invoice (via user client to enforce RLS)
  const { data: inv, error: invErr } = await userClient
    .from('invoices')
    .select('*, customers(*), invoice_items(*)')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invErr || !inv) return errResponse(404, 'Invoice not found or access denied');

  // Fetch company settings via admin client (service role bypasses RLS on companies)
  const { data: company } = await adminClient
    .from('companies')
    .select('*')
    .eq('id', inv.company_id)
    .maybeSingle();

  const { data: settings } = await adminClient
    .from('company_settings')
    .select('bank_bsb, bank_account_number, bank_account_name, default_invoice_notes')
    .eq('company_id', inv.company_id)
    .maybeSingle();

  const customer = normalizeRelation<{ name: string; abn: string | null; address: string | null; email: string | null; phone: string | null }>(inv.customers);
  const items: Array<{ description: string; quantity: number; unit_price: number; amount: number }> =
    Array.isArray(inv.invoice_items) ? inv.invoice_items : [];

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const BLACK = rgb(0.05, 0.05, 0.05);
  const SLATE = rgb(0.35, 0.40, 0.46);
  const MUTED = rgb(0.55, 0.60, 0.65);
  const BRAND = rgb(0.40, 0.33, 0.90);   // violet-600
  const WHITE = rgb(1, 1, 1);
  const LIGHT = rgb(0.96, 0.97, 0.98);
  const GREEN = rgb(0.04, 0.60, 0.40);

  const margin = 48;
  let y = height - margin;

  const text = (
    str: string,
    x: number,
    yPos: number,
    opts: { font?: typeof fontBold; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(str, {
      x,
      y: yPos,
      font: opts.font ?? fontRegular,
      size: opts.size ?? 10,
      color: opts.color ?? BLACK,
    });
  };

  // ── Header band ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BRAND });

  // Company name (white)
  const companyName = (company as { name?: string } | null)?.name ?? 'Your Company';
  text(companyName, margin, height - 32, { font: fontBold, size: 20, color: WHITE });

  // INVOICE label on the right
  const invLabel = 'INVOICE';
  const invLabelWidth = fontBold.widthOfTextAtSize(invLabel, 22);
  text(invLabel, width - margin - invLabelWidth, height - 32, { font: fontBold, size: 22, color: WHITE });

  // Invoice number under label
  const invNum = inv.invoice_number ?? '';
  const invNumWidth = fontRegular.widthOfTextAtSize(invNum, 10);
  text(invNum, width - margin - invNumWidth, height - 52, { size: 10, color: rgb(0.8, 0.8, 1) });

  y = height - 100;

  // ── Company + Customer details row ──────────────────────────────────────
  const col2 = width / 2 + margin / 2;

  text('From', margin, y, { font: fontBold, size: 8, color: MUTED });
  text('Bill To', col2, y, { font: fontBold, size: 8, color: MUTED });
  y -= 14;

  const co = company as { name?: string; abn?: string | null; address?: string | null; email?: string | null; phone?: string | null } | null;
  const companyLines = [
    co?.name ?? '',
    co?.abn ? `ABN: ${co.abn}` : '',
    co?.address ?? '',
    co?.phone ?? '',
    co?.email ?? '',
  ].filter(Boolean);

  const customerLines = [
    customer?.name ?? '',
    customer?.abn ? `ABN: ${customer.abn}` : '',
    customer?.address ?? '',
    customer?.phone ?? '',
    customer?.email ?? '',
  ].filter(Boolean);

  const maxLines = Math.max(companyLines.length, customerLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (companyLines[i]) text(companyLines[i], margin, y, { size: 9.5, color: i === 0 ? BLACK : SLATE, font: i === 0 ? fontBold : fontRegular });
    if (customerLines[i]) text(customerLines[i], col2, y, { size: 9.5, color: i === 0 ? BLACK : SLATE, font: i === 0 ? fontBold : fontRegular });
    y -= 13;
  }

  y -= 8;

  // ── Invoice meta row ─────────────────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 28, width: width - margin * 2, height: 28, color: LIGHT, borderRadius: 4 });

  const metaCols = [
    { label: 'Issue Date', value: fmtDate(inv.issue_date) },
    { label: 'Due Date', value: fmtDate(inv.due_date) },
    { label: 'Status', value: (inv.status ?? '').toUpperCase() },
  ];
  const metaColW = (width - margin * 2) / metaCols.length;
  metaCols.forEach((m, i) => {
    const mx = margin + i * metaColW + 12;
    text(m.label, mx, y - 10, { size: 7.5, color: MUTED, font: fontBold });
    text(m.value, mx, y - 22, { size: 9, color: BLACK, font: fontBold });
  });

  y -= 44;

  // ── Line items table ──────────────────────────────────────────────────────
  const colWidths = { desc: width - margin * 2 - 60 - 80 - 80, qty: 60, rate: 80, amount: 80 };
  const colX = {
    desc: margin,
    qty: margin + colWidths.desc,
    rate: margin + colWidths.desc + colWidths.qty,
    amount: margin + colWidths.desc + colWidths.qty + colWidths.rate,
  };

  // Table header
  page.drawRectangle({ x: margin, y: y - 20, width: width - margin * 2, height: 20, color: BRAND });
  text('Description', colX.desc + 8, y - 13, { font: fontBold, size: 8.5, color: WHITE });
  text('Qty', colX.qty + 8, y - 13, { font: fontBold, size: 8.5, color: WHITE });
  text('Unit Price', colX.rate + 8, y - 13, { font: fontBold, size: 8.5, color: WHITE });
  text('Amount', colX.amount + 8, y - 13, { font: fontBold, size: 8.5, color: WHITE });
  y -= 20;

  // Rows
  items.forEach((item, idx) => {
    const rowH = 20;
    const bg = idx % 2 === 1 ? LIGHT : WHITE;
    page.drawRectangle({ x: margin, y: y - rowH, width: width - margin * 2, height: rowH, color: bg });
    // Truncate long descriptions
    const desc = item.description.length > 55 ? item.description.slice(0, 52) + '…' : item.description;
    text(desc, colX.desc + 8, y - 13, { size: 9, color: BLACK });
    text(String(item.quantity), colX.qty + 8, y - 13, { size: 9, color: SLATE });
    text(fmt(Number(item.unit_price)), colX.rate + 8, y - 13, { size: 9, color: SLATE });
    text(fmt(Number(item.amount)), colX.amount + 8, y - 13, { size: 9, color: BLACK, font: fontBold });
    y -= rowH;
  });

  // Bottom border of table
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: LIGHT });
  y -= 10;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalsX = width - margin - 200;
  const valueX = width - margin - 8;

  const drawTotalRow = (label: string, value: string, bold = false, highlight = false) => {
    if (highlight) {
      page.drawRectangle({ x: totalsX - 8, y: y - 18, width: 200 + 8, height: 18, color: BRAND });
    }
    text(label, totalsX, y - 12, { size: 9, color: highlight ? WHITE : SLATE, font: bold ? fontBold : fontRegular });
    const vWidth = (bold ? fontBold : fontRegular).widthOfTextAtSize(value, 9);
    text(value, valueX - vWidth, y - 12, { size: 9, color: highlight ? WHITE : BLACK, font: bold ? fontBold : fontRegular });
    y -= 20;
  };

  drawTotalRow('Subtotal (ex GST)', fmt(Number(inv.subtotal ?? 0)));
  drawTotalRow('GST (10%)', fmt(Number(inv.gst ?? 0)));
  drawTotalRow('Total (inc. GST)', fmt(Number(inv.total ?? 0)), true, true);

  if (Number(inv.paid_amount ?? 0) > 0) {
    y -= 4;
    drawTotalRow('Paid', fmt(Number(inv.paid_amount ?? 0)), false, false);
    const outstanding = Math.max(Number(inv.total ?? 0) - Number(inv.paid_amount ?? 0), 0);
    if (outstanding > 0) {
      const outstandingLabel = 'Balance Outstanding';
      const outstandingValue = fmt(outstanding);
      page.drawRectangle({ x: totalsX - 8, y: y - 18, width: 200 + 8, height: 18, color: rgb(1, 0.92, 0.88) });
      text(outstandingLabel, totalsX, y - 12, { size: 9, color: rgb(0.7, 0.15, 0.05), font: fontBold });
      const ovWidth = fontBold.widthOfTextAtSize(outstandingValue, 9);
      text(outstandingValue, valueX - ovWidth, y - 12, { size: 9, color: rgb(0.7, 0.15, 0.05), font: fontBold });
      y -= 20;
    }
  }

  y -= 16;

  // ── Bank / Payment details ────────────────────────────────────────────────
  if (settings?.bank_account_number && inv.status !== 'paid') {
    page.drawRectangle({ x: margin, y: y - 60, width: width - margin * 2, height: 60, color: LIGHT, borderRadius: 4 });
    text('Payment Details', margin + 12, y - 12, { font: fontBold, size: 9, color: BLACK });
    const bankLines = [
      settings.bank_account_name ? `Account Name: ${settings.bank_account_name}` : null,
      settings.bank_bsb ? `BSB: ${settings.bank_bsb}` : null,
      `Account: ${settings.bank_account_number}`,
      `Reference: ${inv.invoice_number}`,
    ].filter(Boolean) as string[];
    bankLines.forEach((line, i) => {
      text(line, margin + 12, y - 24 - i * 10, { size: 8.5, color: SLATE });
    });
    y -= 72;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  const notes = inv.notes ?? settings?.default_invoice_notes ?? null;
  if (notes) {
    text('Notes', margin, y - 10, { font: fontBold, size: 9, color: MUTED });
    const noteLines = notes.split('\n').slice(0, 4);
    noteLines.forEach((line: string, i: number) => {
      text(line, margin, y - 22 - i * 12, { size: 8.5, color: SLATE });
    });
    y -= 22 + noteLines.length * 12 + 10;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: margin, y: 40 }, end: { x: width - margin, y: 40 }, thickness: 0.5, color: LIGHT });
  const footerText = `Generated by HireHub · ${inv.invoice_number} · Thank you for your business`;
  const ftW = fontRegular.widthOfTextAtSize(footerText, 7.5);
  text(footerText, (width - ftW) / 2, 28, { size: 7.5, color: MUTED });

  // ── Paid watermark ────────────────────────────────────────────────────────
  if (inv.status === 'paid') {
    page.drawText('PAID', {
      x: 120,
      y: height / 2 - 40,
      size: 120,
      font: fontBold,
      color: rgb(0.04, 0.60, 0.40),
      opacity: 0.08,
      rotate: { type: 'degrees', angle: 30 },
    });
  }

  const pdfBytes = await doc.save();

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${inv.invoice_number ?? 'invoice'}.pdf"`,
    },
  });
});
