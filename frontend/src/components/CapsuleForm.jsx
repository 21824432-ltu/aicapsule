import { useState } from "react";

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "",
  prompt_text: "",
  response_summary: "",
  category: "",
  usefulness: "",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export default function CapsuleForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initialValues || emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.project_name || !form.prompt_title || !form.prompt_text) {
      setError("Project name, prompt title and prompt text are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Project name</label>
          <input
            value={form.project_name}
            onChange={(e) => update("project_name", e.target.value)}
            placeholder="e.g. SmartFarm Irrigation"
          />
        </div>
        <div className="form-field">
          <label>Prompt title</label>
          <input
            value={form.prompt_title}
            onChange={(e) => update("prompt_title", e.target.value)}
            placeholder="e.g. Debug cloud deployment"
          />
        </div>

        <div className="form-field">
          <label>Prompt version</label>
          <input
            value={form.prompt_version}
            onChange={(e) => update("prompt_version", e.target.value)}
            placeholder="v1"
          />
        </div>
        <div className="form-field">
          <label>Category</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option value="">Select...</option>
            <option value="Coding">Coding</option>
            <option value="Writing">Writing</option>
            <option value="Research">Research</option>
          </select>
        </div>

        <div className="form-field full">
          <label>Prompt text</label>
          <textarea
            value={form.prompt_text}
            onChange={(e) => update("prompt_text", e.target.value)}
            placeholder="Why does my Node server fail?"
          />
        </div>

        <div className="form-field full">
          <label>Response summary</label>
          <textarea
            value={form.response_summary}
            onChange={(e) => update("response_summary", e.target.value)}
            placeholder="Check start command"
          />
        </div>

        <div className="form-field">
          <label>Usefulness</label>
          <select
            value={form.usefulness}
            onChange={(e) => update("usefulness", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Good">Good</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>
        </div>
        <div className="form-field">
          <label>Screenshot evidence (URL, optional)</label>
          <input
            value={form.screenshot_url}
            onChange={(e) => update("screenshot_url", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="form-field checkbox-field">
          <input
            type="checkbox"
            id="reviewed"
            checked={form.reviewed}
            onChange={(e) => update("reviewed", e.target.checked)}
          />
          <label htmlFor="reviewed">Reviewed</label>
        </div>
        <div className="form-field checkbox-field">
          <input
            type="checkbox"
            id="improved"
            checked={form.improved}
            onChange={(e) => update("improved", e.target.checked)}
          />
          <label htmlFor="improved">Improved</label>
        </div>

        <div className="form-field full">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Tested and worked"
          />
        </div>
      </div>

      <div className="capsule-actions" style={{ marginTop: 16 }}>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export { emptyForm };
