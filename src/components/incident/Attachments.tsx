import { useEffect, useState } from "react";
import { api } from "../../api/endpoints";
import type { Attachment } from "../../api/types";
import { IMAGE_TYPES, MAX_IMAGES, imageProblem } from "../../lib/images";
import { useAsync } from "../../lib/useAsync";
import { ErrorAlert, Loading } from "../ui";

export function Attachments({ incidentId, canUpload }: { incidentId: string; canUpload: boolean }) {
  const attachments = useAsync(() => api.attachments(incidentId), [incidentId]);
  const [error, setError] = useState<unknown>();
  const [uploading, setUploading] = useState(false);

  const items = attachments.data;
  if (!canUpload && items?.length === 0) return null;

  async function upload(files: File[]) {
    setError(undefined);
    setUploading(true);
    try {
      const slots = MAX_IMAGES - (items?.length ?? 0);
      for (const file of files.slice(0, slots)) {
        const problem = imageProblem(file);
        if (problem) throw new Error(problem);

        await api.uploadAttachment(incidentId, file);
      }
      if (files.length > slots) throw new Error(`Máximo de ${MAX_IMAGES} imagens por ocorrência.`);
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
      attachments.reload();
    }
  }

  return (
    <section className="card">
      <h2>
        Imagens {items && items.length > 0 && <span className="count">{items.length}</span>}
      </h2>
      <ErrorAlert error={attachments.error} />
      {!items && !attachments.error && <Loading />}
      {items &&
        (items.length > 0 ? (
          <div className="thumbs">
            {items.map(attachment => (
              <AttachmentImage key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : (
          <p className="muted small">Nenhuma imagem anexada.</p>
        ))}
      {canUpload && (items?.length ?? 0) < MAX_IMAGES && (
        <label className="button secondary file-button">
          {uploading ? "Enviando…" : "Adicionar imagens"}
          <input
            className="sr-only"
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            disabled={uploading}
            onChange={event => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void upload(files);
            }}
          />
        </label>
      )}
      <ErrorAlert error={error} />
    </section>
  );
}

// Attachment downloads require the bearer token, so they can't be a plain <img src>.
function AttachmentImage({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    api
      .attachment(attachment.incidentId, attachment.id)
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.incidentId, attachment.id]);

  return (
    <figure className="thumb">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title={attachment.fileName}>
          <img src={url} alt={attachment.fileName} />
        </a>
      ) : (
        <span className="thumb-placeholder">{failed ? "Indisponível" : "…"}</span>
      )}
    </figure>
  );
}
