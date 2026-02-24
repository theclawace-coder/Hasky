import { formatCurrency, formatDate } from '../../lib/utils';
import type { Company, Invoice, InvoiceItem, Customer } from '../../types';

export interface BankDetails {
  bank_name?: string | null;
  bank_bsb?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
}

interface InvoicePreviewProps {
  company: Company | null;
  customer: Customer | null;
  invoice: Invoice;
  items: InvoiceItem[];
  bankDetails?: BankDetails | null;
}

export function InvoicePreview({ company, customer, invoice, items, bankDetails }: InvoicePreviewProps) {
  const outstanding = Math.max(invoice.total - Number(invoice.paid_amount ?? 0), 0);
  const isPaid = invoice.status === 'paid';

  return (
    <div className="print-surface rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* Header: company details + TAX INVOICE label */}
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div>
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="mb-3 h-14 w-auto max-w-[180px] object-contain"
            />
          ) : null}
          <h2 className="text-2xl font-bold text-slate-900">Tax Invoice</h2>
          <p className="mt-2 text-sm font-semibold text-slate-800">{company?.name}</p>
          {company?.abn ? <p className="text-sm text-slate-600">ABN: {company.abn}</p> : null}
          {company?.address ? <p className="text-sm text-slate-600">{company.address}</p> : null}
          {company?.phone ? <p className="text-sm text-slate-600">Ph: {company.phone}</p> : null}
          {company?.email ? <p className="text-sm text-slate-600">{company.email}</p> : null}
        </div>
        <div className="text-sm text-right md:text-right">
          <p className="text-lg font-bold text-slate-900">#{invoice.invoice_number}</p>
          <div className="mt-2 space-y-0.5">
            <p className="text-slate-600"><span className="font-medium text-slate-700">Issue Date:</span> {formatDate(invoice.issue_date)}</p>
            <p className="text-slate-600"><span className="font-medium text-slate-700">Due Date:</span> {formatDate(invoice.due_date)}</p>
            {invoice.paid_date ? <p className="text-emerald-700"><span className="font-medium">Paid:</span> {formatDate(invoice.paid_date)}</p> : null}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill To</p>
        <p className="mt-1 font-semibold text-slate-800">{customer?.name}</p>
        {(customer as Customer & { abn?: string | null })?.abn ? (
          <p className="text-sm text-slate-600">ABN: {(customer as Customer & { abn?: string | null }).abn}</p>
        ) : null}
        {customer?.address ? <p className="text-sm text-slate-600">{customer.address}</p> : null}
        {customer?.email ? <p className="text-sm text-slate-600">{customer.email}</p> : null}
        {customer?.phone ? <p className="text-sm text-slate-600">Ph: {customer.phone}</p> : null}
      </div>

      {/* Line items */}
      <table className="mt-6 min-w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="py-2.5">Description</th>
            <th className="py-2.5 text-right">Qty</th>
            <th className="py-2.5 text-right">Unit Price</th>
            <th className="py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2.5">{item.description}</td>
              <td className="py-2.5 text-right">{item.quantity}</td>
              <td className="py-2.5 text-right">{formatCurrency(item.unit_price)}</td>
              <td className="py-2.5 text-right font-medium">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal (ex. GST)</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        <div className="flex justify-between"><span>GST (10%)</span><span>{formatCurrency(invoice.gst)}</span></div>
        <div className="flex justify-between border-t-2 border-slate-300 pt-2 text-base font-bold">
          <span>Total (inc. GST)</span><span>{formatCurrency(invoice.total)}</span>
        </div>
        {Number(invoice.paid_amount ?? 0) > 0 ? (
          <>
            <div className="flex justify-between text-emerald-600">
              <span>Amount Paid</span>
              <span>- {formatCurrency(Number(invoice.paid_amount))}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
              <span>Balance Due</span>
              <span className={isPaid ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(outstanding)}</span>
            </div>
          </>
        ) : null}
      </div>

      {bankDetails?.bank_account_number && invoice.status !== 'paid' ? (
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Payment Details</p>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-slate-700">
            {bankDetails.bank_name ? (
              <div className="flex gap-2">
                <span className="font-medium text-slate-500 min-w-[110px]">Bank:</span>
                <span>{bankDetails.bank_name}</span>
              </div>
            ) : null}
            {bankDetails.bank_account_name ? (
              <div className="flex gap-2">
                <span className="font-medium text-slate-500 min-w-[110px]">Account Name:</span>
                <span>{bankDetails.bank_account_name}</span>
              </div>
            ) : null}
            {bankDetails.bank_bsb ? (
              <div className="flex gap-2">
                <span className="font-medium text-slate-500 min-w-[110px]">BSB:</span>
                <span>{bankDetails.bank_bsb}</span>
              </div>
            ) : null}
            <div className="flex gap-2">
              <span className="font-medium text-slate-500 min-w-[110px]">Account No:</span>
              <span>{bankDetails.bank_account_number}</span>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <span className="font-medium text-slate-500 min-w-[110px]">Reference:</span>
              <span className="font-semibold">{invoice.invoice_number}</span>
            </div>
          </div>
        </div>
      ) : null}

      {invoice.notes ? (
        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Notes</p>
          {invoice.notes}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">Thank you for your business.</p>
      )}
    </div>
  );
}
