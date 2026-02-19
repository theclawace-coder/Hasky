import { Upload } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (files: FileList | null) => void;
}

export function PhotoUpload({ onUpload }: PhotoUploadProps) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-700">
      <Upload className="size-4" />
      Upload photos
      <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => onUpload(event.target.files)} />
    </label>
  );
}
