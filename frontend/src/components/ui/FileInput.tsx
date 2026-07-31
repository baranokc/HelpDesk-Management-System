"use client";

interface FileInputProps {
  label?: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
  error? : string;
}

export function FileInput({
  label = "Files",
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles = 10,
  maxFileSizeMb = 10,
  error,
}: FileInputProps) {
  return (
    <div>
      <label className="label font-semibold">
        {label}
      </label>
      <input
        accept={accept}
        aria-invalid={Boolean(error)}
        className={`file-input w-full ${
          error ? "file-input-error" : ""
        }`}
        multiple={multiple}
        onChange={(event) =>
          onChange(
            Array.from(event.target.files ?? []),
          )
        }
        type="file"
      />

      <p
        className={`label ${
          error ? "text-error" : ""
        }`}
      >
        {error ??
          `Maximum ${maxFiles} files; each file can be up to ${maxFileSizeMb} MB`}
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
