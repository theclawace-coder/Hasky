import { formatCurrency, formatDate } from '../../lib/utils';
import type { Company, Customer, Quote, QuoteItem } from '../../types';

interface QuotePreviewProps {
  company: Company | null;
  customer: Customer | null;
  quote: Quote;
  items: QuoteItem[];
}

export function QuotePreview({ company, customer, quote, items }: QuotePreviewProps) {
  return (
    <div className="print-surface rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quote</h2>
          <p className="mt-2 text-sm text-slate-600">{company?.name}</p>
          <p className="text-sm text-slate-600">{company?.address}</p>
          <p className="text-sm text-slate-600">{company?.city} {company?.state}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-slate-900">Quote For</p>
          <p className="text-slate-700">{customer?.name}</p>
          <p className="text-slate-600">{customer?.address}</p>
          <p className="text-slate-600">{customer?.city} {customer?.state}</p>
          <p className="mt-3 text-slate-700">#{quote.quote_number}</p>
          <p className="text-slate-600">Issue: {formatDate(quote.issue_date)}</p>
          <p className="text-slate-600">Expiry: {formatDate(quote.expiry_date)}</p>
          {quote.paid_date ? <p className="text-emerald-700">Paid: {formatDate(quote.paid_date)}</p> : null}
        </div>
      </div>

      <table className="mt-6 min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="py-2">Description</th>
            <th className="py-2">Qty</th>
            <th className="py-2">Unit Price</th>
            <th className="py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2">{item.description}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">{formatCurrency(item.unit_price)}</td>
              <td className="py-2">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
        <div className="flex justify-between"><span>GST (10%)</span><span>{formatCurrency(quote.gst)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total</span><span>{formatCurrency(quote.total)}</span></div>
      </div>

      <p className="mt-6 text-sm text-slate-600">{quote.notes || 'This quote is valid until the expiry date shown above.'}</p>
    </div>
  );
}
