import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import type { Company, MachineCategory } from '../../types';

interface MachineSearchFiltersProps {
  categories: MachineCategory[];
  companies: Company[];
  values: {
    categoryId: string;
    location: string;
    companyId: string;
    search: string;
    startDate: string;
    endDate: string;
  };
  onChange: (next: Partial<MachineSearchFiltersProps['values']>) => void;
}

export function MachineSearchFilters({ categories, companies, values, onChange }: MachineSearchFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
      <Select value={values.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </Select>
      <Input placeholder="Location / city" value={values.location} onChange={(event) => onChange({ location: event.target.value })} />
      <Select value={values.companyId} onChange={(event) => onChange({ companyId: event.target.value })}>
        <option value="">All companies</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </Select>
      <Input placeholder="Search make/model" value={values.search} onChange={(event) => onChange({ search: event.target.value })} />
      <DatePicker value={values.startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
      <DatePicker value={values.endDate} onChange={(event) => onChange({ endDate: event.target.value })} />
    </div>
  );
}
