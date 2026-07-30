"use client";

interface FileInputProps {
  label?: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
}

export function FileInput({
  label = "Dosyalar",
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles = 10,
  maxFileSizeMb = 10,
}: FileInputProps) {
  return (
    <div>
      <label className="label font-semibold">
        {label}
      </label>
      <input
        accept={accept}
        className="file-input w-full"
        multiple={multiple}
        onChange={(event) =>
          onChange(Array.from(event.target.files ?? []).slice(0, maxFiles))
        }
        type="file"
      />
      <p className="label">
        En fazla {maxFiles} dosya; her dosya en fazla {maxFileSizeMb} MB
      </p>
      {files.length > 0 && (
        <ul className="list mt-2 rounded-box border border-base-300 bg-base-100 text-sm">
          {files.map((file) => (
            <li className="list-row py-2" key={`${file.name}-${file.size}`}>
              <span className="list-col-grow truncate">{file.name}</span>
              <span className="badge badge-ghost">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
