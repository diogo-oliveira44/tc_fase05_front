import { useEffect, useState } from "react";

export function FileThumbnail({ file, onRemove }: { file: File; onRemove(): void }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <figure className="thumb">
      {url && <img src={url} alt={file.name} />}
      <button type="button" className="thumb-remove" onClick={onRemove} aria-label={`Remover ${file.name}`}>
        ×
      </button>
    </figure>
  );
}
