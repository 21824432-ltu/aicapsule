import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCapsules, createCapsule, updateCapsule, deleteCapsule } from "../api";
import CapsuleForm, { emptyForm } from "../components/CapsuleForm";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const data = await getCapsules();
      setCapsules(data);
      setStatus("ready");
    } catch (err) {
      if (err.status === 401) {
        // Not logged in / session invalid -> send to login, per spec:
        // a user who hasn't logged in must not be able to use the
        // protected dashboard.
        navigate("/login");
        return;
      }
      setError(err.message);
      setStatus("error");
    }
  }

  async function handleCreate(form) {
    await createCapsule(form);
    setShowForm(false);
    load();
  }

  async function handleUpdate(form) {
    await updateCapsule(editingCapsule.id, form);
    setEditingCapsule(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this capsule?")) return;
    await deleteCapsule(id);
    load();
  }

  if (status === "loading") return <p>Loading your capsules...</p>;
  if (status === "error") return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div className="top-bar">
        <h2>Your Prompt Capsules</h2>
        {!showForm && !editingCapsule && (
          <button className="btn" onClick={() => setShowForm(true)}>
            + New Capsule
          </button>
        )}
      </div>

      {showForm && (
        <CapsuleForm
          initialValues={emptyForm}
          submitLabel="Create capsule"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingCapsule && (
        <CapsuleForm
          initialValues={{
            ...editingCapsule,
            reviewed: !!editingCapsule.reviewed,
            improved: !!editingCapsule.improved,
          }}
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onCancel={() => setEditingCapsule(null)}
        />
      )}

      {capsules.length === 0 && !showForm ? (
        <div className="card empty-state">
          <p>No capsules yet — create your first one.</p>
        </div>
      ) : (
        <div className="capsule-grid">
          {capsules.map((c) => (
            <div className="card capsule-card" key={c.id}>
              <h3>{c.prompt_title}</h3>
              <div className="capsule-meta">
                {c.project_name} · {c.prompt_version || "no version"} ·{" "}
                {c.category || "Uncategorised"} ·{" "}
                {c.usefulness || "Not rated"}
                {c.reviewed ? " · Reviewed" : ""}
                {c.improved ? " · Improved" : ""}
              </div>
              <div className="capsule-text">{c.prompt_text}</div>
              {c.response_summary && (
                <div className="capsule-text">
                  <strong>Response:</strong> {c.response_summary}
                </div>
              )}
              {c.notes && (
                <div className="capsule-text">
                  <strong>Notes:</strong> {c.notes}
                </div>
              )}
              <div className="capsule-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingCapsule(c);
                    setShowForm(false);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
