import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface LineItemValue {
  description: string;
  quantity: number;
  unit_price: number;
}

interface LineItemsTableProps {
  items: LineItemValue[];
  onChange: (items: LineItemValue[]) => void;
}

export function LineItemsTable({ items, onChange }: LineItemsTableProps) {
  const updateItem = (index: number, field: keyof LineItemValue, value: string) => {
    const next = [...items];
    next[index] = {
      ...next[index],
      [field]: field === 'description' ? value : Number(value),
    };
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Unit Price</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="p-2">
                  <Input value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="number" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="number" value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} />
                </td>
                <td className="p-2 text-slate-700">${(item.quantity * item.unit_price).toFixed(2)}</td>
                <td className="p-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => removeItem(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="secondary" onClick={addItem}>
        Add Line Item
      </Button>
    </div>
  );
}
