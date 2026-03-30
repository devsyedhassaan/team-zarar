import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// After deploying your Google Apps Script, paste the Web App URL here:
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDADiIH3gAdURzmYklPVBhoSaLyYeCPA7qDTk9Crk3vd2b0kNgZhNFRB3up-eRMSXi/exec";

// ─── MOCK EVENTS DATA ───────────────────────────────────────────────────────
const EVENTS = [
  {
    id: 1,
    title: "Docking & ADMET Training Workshop",
    speaker: "Dr. Hafiz Amir Ali Kharl",
    speakerTitle: "Lab Manager Narcotics Forensic Lab., Forensic Pharmacist, Scientist",
    date: "Will be announced soon",
    time: "TBD",
    duration: "2 Days",
    seats: 500,
    filled: 118,
    fee: 200,
    tag: "Molecular Docking, ADMET",
    color: "#4F7CFF",
    description:
      "An in-depth webinar exploring Molecular Docking & Validation, ADMET & Likeness, Network Pharmacology, Molecular Dynamics Simulation.",
    sheetId: "1aR4gZBAlNRDvKUdkr0aGrRIIihZVbMuhMpAXAgMrA9g",   // ← Google Sheet ID for this event
    folderId: "1VRokvaSru9BKFABugsvnkGi2RCW3PhNh", // ← Drive Folder ID for this event
  },
];

// ─── UTILITIES ──────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Icon = {
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Arrow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#0B0E1A",
    color: "#E8EAF0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
  header: {
    padding: "24px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(11,14,26,0.95)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoAccent: {
    color: "#4F7CFF",
  },
  logoTag: {
    fontSize: 11,
    fontWeight: 500,
    color: "#888",
    letterSpacing: "0.5px",
    marginTop: 2,
  },
  page: {
    padding: "20px",
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#4F7CFF",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
    marginBottom: 20,
    letterSpacing: "-0.5px",
  },
  eventCard: (color) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderLeft: `3px solid ${color}`,
    position: "relative",
    overflow: "hidden",
  }),
  tag: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: `${color}18`,
    border: `1px solid ${color}30`,
    borderRadius: 20,
    padding: "3px 10px",
    marginBottom: 10,
    letterSpacing: "0.3px",
  }),
  eventTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 6,
    lineHeight: 1.3,
  },
  speaker: {
    fontSize: 13,
    color: "#AAB0C0",
    marginBottom: 14,
  },
  meta: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#888",
  },
  progressBar: (pct, color) => ({
    height: 3,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 10,
    position: "relative",
  }),
  progressFill: (pct, color) => ({
    height: "100%",
    width: `${pct}%`,
    background: color,
    borderRadius: 99,
    transition: "width 1s ease",
  }),
  feeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeBadge: (free) => ({
    fontSize: 14,
    fontWeight: 700,
    color: free ? "#22C97A" : "#fff",
  }),
  registerBtn: (color) => ({
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    background: color,
    border: "none",
    borderRadius: 8,
    padding: "7px 16px",
    cursor: "pointer",
    letterSpacing: "0.3px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  }),
  // Detail page
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#888",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 20,
    padding: 0,
  },
  detailHero: (color) => ({
    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
    border: `1px solid ${color}30`,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  }),
  detailTag: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: `${color}20`,
    border: `1px solid ${color}40`,
    borderRadius: 20,
    padding: "3px 10px",
    marginBottom: 12,
  }),
  detailTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.25,
    marginBottom: 8,
  },
  detailSpeaker: {
    fontSize: 14,
    color: "#AAB0C0",
    marginBottom: 18,
  },
  detailMeta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },
  metaBox: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: "10px 12px",
  },
  metaBoxLabel: {
    fontSize: 10,
    color: "#666",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metaBoxValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
  },
  descBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 14,
    color: "#AAB0C0",
    lineHeight: 1.6,
  },
  bigRegBtn: (color) => ({
    width: "100%",
    padding: "16px",
    background: color,
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    letterSpacing: "0.2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  }),
  // Form
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    marginBottom: 6,
  },
  formSub: {
    fontSize: 13,
    color: "#888",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#AAB0C0",
    marginBottom: 7,
    letterSpacing: "0.3px",
  },
  required: {
    color: "#FF5555",
    marginLeft: 3,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "13px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  uploadBox: (hasFile) => ({
    border: `2px dashed ${hasFile ? "#22C97A" : "rgba(255,255,255,0.15)"}`,
    borderRadius: 12,
    padding: "24px 16px",
    textAlign: "center",
    cursor: "pointer",
    background: hasFile ? "rgba(34,201,122,0.05)" : "rgba(255,255,255,0.02)",
    transition: "all 0.2s",
  }),
  uploadText: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #4F7CFF, #6B4FFF)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorText: {
    fontSize: 11,
    color: "#FF5555",
    marginTop: 5,
  },
  // Thank you
  thankBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "75vh",
    textAlign: "center",
    padding: "0 20px",
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "rgba(34,201,122,0.15)",
    border: "2px solid #22C97A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#22C97A",
    marginBottom: 24,
  },
  thankTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    marginBottom: 10,
    letterSpacing: "-0.5px",
  },
  thankSub: {
    fontSize: 14,
    color: "#888",
    lineHeight: 1.6,
    marginBottom: 32,
    maxWidth: 300,
  },
  homeBtn: {
    padding: "14px 32px",
    background: "rgba(79,124,255,0.15)",
    border: "1px solid rgba(79,124,255,0.4)",
    color: "#4F7CFF",
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 12,
    cursor: "pointer",
  },
};

// ─── UPLOAD FIELD COMPONENT ──────────────────────────────────────────────────
function UploadField({ screenshot, onFile }) {
  const inputId = "payment-screenshot-input";
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>
        Payment Screenshot
        <span style={{ color: "#666", fontWeight: 400 }}> (JPG / PNG / JPEG)</span>
      </label>

      {/* Visible upload button */}
      <label
        htmlFor={inputId}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: `2px dashed ${screenshot ? "#22C97A" : "rgba(255,255,255,0.2)"}`,
          borderRadius: 12,
          padding: "28px 16px",
          background: screenshot ? "rgba(34,201,122,0.06)" : "rgba(255,255,255,0.02)",
          cursor: "pointer",
          textAlign: "center",
          minHeight: 110,
        }}
      >
        {screenshot ? (
          <>
            <div style={{ fontSize: 28, color: "#22C97A" }}>✓</div>
            <div style={{ fontSize: 13, color: "#22C97A", fontWeight: 600 }}>{screenshot.name}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Tap to change</div>
          </>
        ) : (
          <>
            <div style={{ color: "#666" }}>
              <Icon.Upload />
            </div>
            <div style={{ fontSize: 14, color: "#aaa", fontWeight: 500 }}>Tap to choose from Gallery</div>
            <div style={{ fontSize: 11, color: "#555" }}>JPG, JPEG, PNG supported</div>
          </>
        )}
      </label>

      {/* Actual file input — linked via htmlFor/id */}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
        onChange={onFile}
      />
    </div>
  );
}

// ─── FIELD COMPONENT (must be outside App to prevent focus loss) ─────────────
function Field({ id, label, required, type = "text", placeholder, value, onChange, error, accentColor }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}{required && <span style={S.required}>*</span>}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...S.input, borderColor: error ? "#FF5555" : "rgba(255,255,255,0.1)" }}
        onFocus={e => e.target.style.borderColor = accentColor || "#4F7CFF"}
        onBlur={e => e.target.style.borderColor = error ? "#FF5555" : "rgba(255,255,255,0.1)"}
      />
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | detail | form | thanks
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", institute: "", fieldOfStudy: "", screenshot: null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef();

  useEffect(() => {
    if (pageRef.current) pageRef.current.scrollTop = 0;
  }, [screen]);

  function openEvent(ev) {
    setSelectedEvent(ev);
    setScreen("detail");
  }

  function openForm() {
    setForm({ fullName: "", phone: "", email: "", institute: "", fieldOfStudy: "", screenshot: null });
    setErrors({});
    setScreen("form");
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim()) e.phone = "Contact number is required";
    else if (!/^[\d\s\+\-]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      let screenshotBase64 = null;
      let screenshotName = null;
      if (form.screenshot) {
        screenshotBase64 = await fileToBase64(form.screenshot);
        screenshotName = form.screenshot.name;
      }
      const payload = {
        eventTitle: selectedEvent.title,
        eventDate: selectedEvent.date,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        institute: form.institute,
        fieldOfStudy: form.fieldOfStudy,
        screenshotBase64,
        screenshotName,
        timestamp: new Date().toISOString(),
        sheetId: selectedEvent.sheetId,   // ✅ sends this event's Sheet ID
        folderId: selectedEvent.folderId, // ✅ sends this event's Folder ID
      };
      if (APPS_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setScreen("thanks");
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) { alert("Only JPG, JPEG, PNG allowed"); return; }
    setForm((f) => ({ ...f, screenshot: file }));
  }

  // ── HOME ────────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={S.app} ref={pageRef}>
      <div style={S.header}>
        <div style={S.logo}>
          <span>Team<span style={S.logoAccent}> Zarar</span></span>
        </div>
        <div style={S.logoTag}>Expert Talks & Webinars</div>
      </div>
      <div style={S.page}>
        <div style={S.sectionTitle}>Upcoming Webinars</div>
        <div style={S.heroTitle}>Learn from the<br />Best Minds</div>
        {EVENTS.map((ev) => {
          const pct = Math.round((ev.filled / ev.seats) * 100);
          return (
            <div key={ev.id} style={S.eventCard(ev.color)} onClick={() => openEvent(ev)}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
              <div style={S.tag(ev.color)}><Icon.Tag />{ev.tag}</div>
              <div style={S.eventTitle}>{ev.title}</div>
              <div style={S.speaker}>{ev.speaker} · {ev.speakerTitle}</div>
              <div style={S.meta}>
                <div style={S.metaItem}><Icon.Calendar />{ev.date}</div>
                <div style={S.metaItem}><Icon.Clock />{ev.time}</div>
                <div style={S.metaItem}><Icon.Users />{ev.filled}/{ev.seats} registered</div>
              </div>
              <div style={S.progressBar(pct, ev.color)}>
                <div style={S.progressFill(pct, ev.color)} />
              </div>
              <div style={S.feeRow}>
                <div style={S.feeBadge(ev.fee === 0)}>
                  {ev.fee === 0 ? "FREE" : `PKR ${ev.fee}`}
                </div>
                <button style={S.registerBtn(ev.color)}>Register <Icon.Arrow /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── DETAIL ──────────────────────────────────────────────────────────────
  if (screen === "detail" && selectedEvent) {
    const ev = selectedEvent;
    const pct = Math.round((ev.filled / ev.seats) * 100);
    return (
      <div style={S.app} ref={pageRef}>
        <div style={S.header}>
          <div style={S.logo}>Team<span style={S.logoAccent}> Zarar</span></div>
        </div>
        <div style={S.page}>
          <button style={S.backBtn} onClick={() => setScreen("home")}><Icon.Back /> Back to Events</button>
          <div style={S.detailHero(ev.color)}>
            <div style={S.detailTag(ev.color)}><Icon.Tag />{ev.tag}</div>
            <div style={S.detailTitle}>{ev.title}</div>
            <div style={S.detailSpeaker}>🎤 {ev.speaker} — {ev.speakerTitle}</div>
            <div style={S.detailMeta}>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Date</div><div style={S.metaBoxValue}>{ev.date}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Time</div><div style={S.metaBoxValue}>{ev.time}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Duration</div><div style={S.metaBoxValue}>{ev.duration}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Fee</div><div style={S.metaBoxValue}>{ev.fee === 0 ? "FREE" : `PKR ${ev.fee}`}</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{pct}% seats filled ({ev.filled}/{ev.seats})</div>
            <div style={S.progressBar(pct, ev.color)}><div style={S.progressFill(pct, ev.color)} /></div>
          </div>
          <div style={S.descBox}>{ev.description}</div>
          <button style={S.bigRegBtn(ev.color)} onClick={openForm}>
            Register for this Event <Icon.Arrow />
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ────────────────────────────────────────────────────────────────
  if (screen === "form" && selectedEvent) {
    const ev = selectedEvent;
    const mkField = (id, label, required, type, placeholder) => (
      <Field
        key={id}
        id={id}
        label={label}
        required={required}
        type={type}
        placeholder={placeholder}
        value={form[id]}
        accentColor={ev.color}
        error={errors[id]}
        onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: undefined })); }}
      />
    );
    return (
      <div style={S.app} ref={pageRef}>
        <div style={S.header}>
          <div style={S.logo}>Team<span style={S.logoAccent}> Zarar</span></div>
        </div>
        <div style={S.page}>
          <button style={S.backBtn} onClick={() => setScreen("detail")}><Icon.Back /> Back</button>
          <div style={S.formHeader}>
            <div style={S.sectionTitle}>Registration Form</div>
            <div style={S.formTitle}>{ev.title}</div>
            <div style={S.formSub}>{ev.date} · {ev.time}</div>
          </div>

          {mkField("fullName", "Full Name", true, "text", "e.g. Hassaan Zarar")}
          {mkField("phone", "Contact Number", true, "tel", "e.g. +92 300 1234567")}
          {mkField("email", "Email Address", true, "email", "e.g. you@example.com")}
          {mkField("institute", "University / Institute", false, "text", "e.g. University of Lahore")}
          {mkField("fieldOfStudy", "Field of Study", false, "text", "e.g. Computer Science")}

          <UploadField screenshot={form.screenshot} onFile={handleFile} />

          <button style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Registration"} {!submitting && <Icon.Arrow />}
          </button>
          <div style={{ fontSize: 11, color: "#555", textAlign: "center", marginTop: 12 }}>
            Fields marked <span style={{ color: "#FF5555" }}>*</span> are required
          </div>
        </div>
      </div>
    );
  }

  // ── THANK YOU ───────────────────────────────────────────────────────────
  if (screen === "thanks") return (
    <div style={S.app} ref={pageRef}>
      <div style={S.thankBox}>
        <div style={S.checkCircle}><Icon.Check /></div>
        <div style={S.thankTitle}>You're Registered!</div>
        <div style={S.thankSub}>
          Thank you for registering for <strong style={{ color: "#fff" }}>{selectedEvent?.title}</strong>. We'll send the webinar link to your email before the event.
        </div>
        <button style={S.homeBtn} onClick={() => { setScreen("home"); setSelectedEvent(null); }}>
          Back to Events
        </button>
      </div>
    </div>
  );

  return null;
}
