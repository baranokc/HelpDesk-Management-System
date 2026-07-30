"use client";

interface FileInputProps {
  label?: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileInput({
  label = "Dosyalar",
  files,
  onChange,
  accept,
  multiple = true,
}: FileInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
        <span className="text-sm font-medium text-slate-700">
          Dosya seçmek için tıklayın
        </span>
        <span className="mt-1 text-xs text-slate-500">
          En fazla 10 MB; JPG, PNG, PDF ve ofis dosyaları
        </span>
        <input
          accept={accept}
          className="sr-only"
          multiple={multiple}
          onChange={(event) => onChange(Array.from(event.target.files ?? []))}
          type="file"
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {files.map((file) => (
            <li className="flex justify-between gap-3" key={`${file.name}-${file.size}`}>
              <span className="truncate">{file.name}</span>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
