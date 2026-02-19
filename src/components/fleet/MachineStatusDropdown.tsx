import { MACHINE_STATUSES } from '../../lib/constants';
import { Select } from '../ui/Select';

interface MachineStatusDropdownProps {
  value: string;
  onChange: (status: string) => void;
}

export function MachineStatusDropdown({ value, onChange }: MachineStatusDropdownProps) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      {MACHINE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replace('_', ' ')}
        </option>
      ))}
    </Select>
  );
}
