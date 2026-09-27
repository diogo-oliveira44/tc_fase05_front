import { useState, type FormEvent } from "react";
import { api } from "../api/endpoints";
import type { Incident } from "../api/types";
import { FileThumbnail } from "../components/FileThumbnail";
import { ErrorAlert, Field } from "../components/ui";
import { useCategories } from "../lib/categories";
import { errorMessage } from "../lib/format";
import { IMAGE_TYPES, MAX_IMAGES, imageProblem } from "../lib/images";
import { Link, navigate } from "../router";

export function NewIncidentPage() {
  const categories = useCategories();
  const [files, setFiles] = useState<File[]>([]);
  const [fileProblems, setFileProblems] = useState<string[]>([]);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<unknown>();
  const [progress, setProgress] = useState<string | null>(null);
  const [partial, setPartial] = useState<{ id: string; failures: string[] } | null>(null);

  function addFiles(incoming: File[]) {
    const problems = incoming.map(imageProblem).filter((problem): problem is string => problem !== null);
    const valid = incoming.filter(file => !imageProblem(file));
    if (files.length + valid.length > MAX_IMAGES) problems.push(`Máximo de ${MAX_IMAGES} imagens por ocorrência.`);
    setFiles([...files, ...valid].slice(0, MAX_IMAGES));
    setFileProblems(problems);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError(new Error("Geolocalização não é suportada neste navegador."));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ latitude: position.latitude.toFixed(6), longitude: position.longitude.toFixed(6) });
        setLocating(false);
      },
      () => {
        setError(new Error("Não foi possível obter sua localização."));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();

    setError(undefined);
    setProgress("Registrando…");

    let incident: Incident;
    try {
      incident = await api.createIncident({
        categoryId: text("categoryId"),
        title: text("title"),
        description: text("description"),
        address: text("address"),
        locationDetails: text("locationDetails") || undefined,
        latitude: coords.latitude ? Number(coords.latitude) : undefined,
        longitude: coords.longitude ? Number(coords.longitude) : undefined,
      });
    } catch (err) {
      setError(err);
      setProgress(null);
      return;
    }

    // Images can only be attached once the incident exists.
    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      setProgress(`Enviando imagem ${index + 1} de ${files.length}…`);
      try {
        await api.uploadAttachment(incident.id, file);
      } catch (err) {
        failures.push(`${file.name}: ${errorMessage(err)}`);
      }
    }

    if (failures.length > 0) {
      setPartial({ id: incident.id, failures });
      return;
    }
    navigate(`/incidents/${incident.id}`);
  }

  if (partial) {
    return (
      <section className="card stack narrow">
        <h1>Ocorrência registrada</h1>
        <div className="alert alert-warning">
          <p>Algumas imagens não foram enviadas:</p>
          <ul>
            {partial.failures.map(failure => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
        </div>
        <p className="muted">Você pode tentar enviá-las novamente na página da ocorrência.</p>
        <div>
          <Link to={`/incidents/${partial.id}`} className="button primary">
            Ver ocorrência
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            ← Minhas ocorrências
          </Link>
          <h1>Nova ocorrência</h1>
          <p className="muted">Quanto mais detalhes, mais rápido o atendimento.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <Field label="Título">
          <input name="title" required minLength={3} maxLength={200} placeholder="Ex.: Lâmpada queimada no corredor B" />
        </Field>
        <Field label="Categoria">
          <select name="categoryId" required defaultValue="">
            <option value="" disabled>
              {categories.loading ? "Carregando…" : "Selecione"}
            </option>
            {categories.data?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descrição" className="full">
          <textarea name="description" required minLength={3} rows={5} placeholder="O que aconteceu? Desde quando?" />
        </Field>
        <Field label="Endereço">
          <input name="address" required maxLength={300} placeholder="Rua, número, bairro" />
        </Field>
        <Field label="Complemento ou ponto de referência" hint="Opcional">
          <input name="locationDetails" maxLength={300} placeholder="Ex.: Bloco C, 2º andar" />
        </Field>

        <fieldset className="coords full">
          <legend>Coordenadas (opcional)</legend>
          <Field label="Latitude">
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={coords.latitude}
              onChange={event => setCoords({ ...coords, latitude: event.target.value })}
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={coords.longitude}
              onChange={event => setCoords({ ...coords, longitude: event.target.value })}
            />
          </Field>
          <button type="button" className="button secondary" onClick={locate} disabled={locating}>
            {locating ? "Localizando…" : "Usar minha localização"}
          </button>
        </fieldset>

        <div className="field full">
          <span className="field-label">Imagens</span>
          {files.length > 0 && (
            <div className="thumbs">
              {files.map((file, index) => (
                <FileThumbnail
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  onRemove={() => setFiles(files.filter((_, other) => other !== index))}
                />
              ))}
            </div>
          )}
          {files.length < MAX_IMAGES && (
            <label className="button secondary file-button">
              Adicionar imagens
              <input
                className="sr-only"
                type="file"
                accept={IMAGE_TYPES.join(",")}
                multiple
                onChange={event => {
                  const selected = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  addFiles(selected);
                }}
              />
            </label>
          )}
          <span className="field-hint">JPEG, PNG ou WebP · até {MAX_IMAGES} imagens de 5 MB cada</span>
          {fileProblems.length > 0 && <p className="alert alert-error">{fileProblems.join(" ")}</p>}
        </div>

        <div className="full stack">
          <ErrorAlert error={error} />
          <div className="form-actions">
            <Link to="/" className="button ghost">
              Cancelar
            </Link>
            <button className="button primary" disabled={progress !== null}>
              {progress ?? "Registrar ocorrência"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
