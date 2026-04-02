import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvhUKSlmTpRW9nGmUaFvHw4uYKerOChCKl6Cmvpvbkv82MRoPJsFuG9E-shqllfmjM/exec";

// ─── EVENTS DATA ─────────────────────────────────────────────────────────────
// HOW TO ADD/EDIT EVENTS:
// "hostPhoto" → paste a direct image URL for the speaker photo
// "poster"    → paste a direct image URL for the event poster
// "fee: 0"    → FREE event (payment screenshot optional)
// "fee: 500"  → Paid (payment screenshot becomes MANDATORY)
// "date"      → use "YYYY-MM-DD" format e.g. "2025-06-15" for automatic upcoming/past sorting
//               use "TBD" if date is not yet decided (will appear in upcoming)
const EVENTS = [
  {
    id: 1,
    title: "Docking & ADMET Training Workshop",
    speaker: "Dr. Hafiz Aamir Ali Kharl",
    speakerTitle: "Lab Manager Narcotics Forensic Lab. , Forensic Pharmacist",
    date: "TBD",
    time: "TBD",
    duration: "2 Days",
    seats: 100,
    filled: 0,
    fee: 200,
    tag: "Molecular Docking, ADMET, Network Pharmacology",
    color: "#4F7CFF",
    description: "An in-depth webinar exploring ADMET & Drug Likeness, Molecular Docking & Validation, Network Pharmacology, Molecular Dynamics Simulation.",
    hostPhoto: "/speaker.jpg",
    poster: "/poster.jpg",
    posterHeight: 400,
    sheetId: "1aR4gZBAlNRDvKUdkr0aGrRIIihZVbMuhMpAXAgMrA9g",
    folderId: "1VRokvaSru9BKFABugsvnkGi2RCW3PhNh",
  },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

// Returns true if the event date has already passed today
// date format expected: "YYYY-MM-DD" e.g. "2025-04-10"
// Events with date "TBD" or unparseable are treated as upcoming
function isPast(dateStr) {
  if (!dateStr || dateStr === "TBD") return false;
  const eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
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

// ─── STYLES ──────────────────────────────────────────────────────────────────
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
    paddingBottom: 52,
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
    fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px",
    color: "#fff", display: "flex", alignItems: "center", gap: 10,
  },
  logoAccent: { color: "#4F7CFF" },
  logoTag: { fontSize: 11, fontWeight: 500, color: "#888", letterSpacing: "0.5px", marginTop: 2 },
  devBar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 480,
    background: "#060912", borderTop: "1px solid #1a2040",
    padding: "9px 0 8px", textAlign: "center", zIndex: 100,
  },
  devText: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 11, color: "#4F7CFF", letterSpacing: "1.5px",
  },
  page: { padding: "20px", paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: 600, color: "#4F7CFF",
    letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26, fontWeight: 800, color: "#fff",
    lineHeight: 1.2, marginBottom: 20, letterSpacing: "-0.5px",
  },
  eventCard: (color) => ({
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, marginBottom: 16, cursor: "pointer",
    transition: "all 0.2s ease", borderLeft: `3px solid ${color}`,
    position: "relative", overflow: "hidden",
  }),
  cardBody: { padding: "16px 20px 20px" },
  tag: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 600, color: color,
    background: `${color}18`, border: `1px solid ${color}30`,
    borderRadius: 20, padding: "3px 10px", marginBottom: 10, letterSpacing: "0.3px",
  }),
  eventTitle: { fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.3 },
  speakerRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  speakerAvatar: {
    width: 40, height: 40, borderRadius: "50%", objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0,
  },
  speakerFallback: (color) => ({
    width: 40, height: 40, borderRadius: "50%",
    background: `${color}30`, border: `2px solid ${color}50`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  }),
  speakerName: { fontSize: 13, color: "#E8EAF0", fontWeight: 600 },
  speakerSub: { fontSize: 11, color: "#666" },
  meta: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 },
  metaItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#888" },
  progressBar: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 10 },
  progressFill: (pct, color) => ({
    height: "100%", width: `${pct}%`, background: color,
    borderRadius: 99, transition: "width 1s ease",
  }),
  feeRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  feeBadge: (free) => ({ fontSize: 14, fontWeight: 700, color: free ? "#22C97A" : "#fff" }),
  registerBtn: (color) => ({
    fontSize: 12, fontWeight: 700, color: "#fff", background: color,
    border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer",
    letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: 6,
  }),
  backBtn: {
    display: "flex", alignItems: "center", gap: 8, color: "#888",
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, marginBottom: 20, padding: 0,
  },
  posterImg: {
    width: "100%", borderRadius: 16, marginBottom: 20,
    objectFit: "contain", display: "block",
  },
  detailHero: (color) => ({
    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
    border: `1px solid ${color}30`, borderRadius: 20, padding: 24, marginBottom: 24,
  }),
  detailTag: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 600, color: color,
    background: `${color}20`, border: `1px solid ${color}40`,
    borderRadius: 20, padding: "3px 10px", marginBottom: 12,
  }),
  detailTitle: { fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 12 },
  detailSpeakerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  detailAvatar: {
    width: 54, height: 54, borderRadius: "50%", objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0,
  },
  detailMeta: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  metaBox: { background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" },
  metaBoxLabel: { fontSize: 10, color: "#666", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 },
  metaBoxValue: { fontSize: 13, fontWeight: 600, color: "#fff" },
  descBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: "#AAB0C0", lineHeight: 1.6,
  },
  bigRegBtn: (color) => ({
    width: "100%", padding: "16px", background: color, color: "#fff",
    fontWeight: 800, fontSize: 16, border: "none", borderRadius: 14,
    cursor: "pointer", letterSpacing: "0.2px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  }),
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 },
  formSub: { fontSize: 13, color: "#888" },
  fieldGroup: { marginBottom: 18 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#AAB0C0", marginBottom: 7, letterSpacing: "0.3px" },
  required: { color: "#FF5555", marginLeft: 3 },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "13px 14px", color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border 0.2s",
  },
  radioGroup: { display: "flex", gap: 12, marginTop: 2 },
  radioOption: (selected, color) => ({
    flex: 1, display: "flex", alignItems: "center", gap: 8,
    padding: "11px 14px", borderRadius: 10,
    border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.1)"}`,
    background: selected ? `${color}15` : "rgba(255,255,255,0.03)",
    cursor: "pointer", transition: "all 0.15s",
  }),
  radioCircle: (selected, color) => ({
    width: 18, height: 18, borderRadius: "50%",
    border: `2px solid ${selected ? color : "#555"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.15s",
  }),
  radioDot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color }),
  radioLabel: (selected) => ({
    fontSize: 13, fontWeight: selected ? 600 : 400,
    color: selected ? "#fff" : "#888", transition: "all 0.15s",
  }),
  errorText: { fontSize: 11, color: "#FF5555", marginTop: 5 },
  submitBtn: {
    width: "100%", padding: "16px",
    background: "linear-gradient(135deg, #4F7CFF, #6B4FFF)",
    color: "#fff", fontWeight: 800, fontSize: 16, border: "none",
    borderRadius: 14, cursor: "pointer", marginTop: 8,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  },
  thankBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "75vh", textAlign: "center", padding: "0 20px",
  },
  checkCircle: {
    width: 80, height: 80, borderRadius: "50%",
    background: "rgba(34,201,122,0.15)", border: "2px solid #22C97A",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#22C97A", marginBottom: 24,
  },
  thankTitle: { fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.5px" },
  thankSub: { fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 32, maxWidth: 300 },
  homeBtn: {
    padding: "14px 32px", background: "rgba(79,124,255,0.15)",
    border: "1px solid rgba(79,124,255,0.4)", color: "#4F7CFF",
    fontWeight: 700, fontSize: 15, borderRadius: 12, cursor: "pointer",
  },
};

// ─── DEV BAR ─────────────────────────────────────────────────────────────────
function DevBar() {
  return (
    <div style={S.devBar}>
      <span style={S.devText}>
        <span style={{ color: "#22C97A" }}>&gt;_ </span>
        <span style={{ color: "#4f7cf0" }}>developed by </span>
        <span style={{ color: "#22C97A" }}>dev_Syed_Hassaan</span>
      </span>
    </div>
  );
}

// ─── UPLOAD FIELD ─────────────────────────────────────────────────────────────
function UploadField({ screenshot, onFile, required, error }) {
  const inputId = "payment-screenshot-input";
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>
        Payment Screenshot
        {required ? <span style={S.required}>*</span> : <span style={{ color: "#555", fontWeight: 400 }}> (optional for free events)</span>}
      </label>
      <label htmlFor={inputId} style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 8,
        border: `2px dashed ${error ? "#FF5555" : screenshot ? "#22C97A" : "rgba(255,255,255,0.2)"}`,
        borderRadius: 12, padding: "28px 16px",
        background: screenshot ? "rgba(34,201,122,0.06)" : "rgba(255,255,255,0.02)",
        cursor: "pointer", textAlign: "center", minHeight: 110,
      }}>
        {screenshot ? (
          <>
            <div style={{ fontSize: 28, color: "#22C97A" }}>✓</div>
            <div style={{ fontSize: 13, color: "#22C97A", fontWeight: 600 }}>{screenshot.name}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Tap to change</div>
          </>
        ) : (
          <>
            <div style={{ color: "#666" }}><Icon.Upload /></div>
            <div style={{ fontSize: 14, color: "#aaa", fontWeight: 500 }}>Tap to choose from Gallery</div>
            <div style={{ fontSize: 11, color: "#555" }}>JPG, JPEG, PNG supported</div>
          </>
        )}
      </label>
      <input id={inputId} type="file" accept="image/jpeg,image/jpg,image/png"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
        onChange={onFile} />
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  );
}

// ─── RADIO FIELD ─────────────────────────────────────────────────────────────
function RadioField({ label, required, options, value, onChange, error, accentColor }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}{required && <span style={S.required}>*</span>}</label>
      <div style={S.radioGroup}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <div key={opt} style={S.radioOption(selected, accentColor)} onClick={() => onChange(opt)}>
              <div style={S.radioCircle(selected, accentColor)}>
                {selected && <div style={S.radioDot(accentColor)} />}
              </div>
              <span style={S.radioLabel(selected)}>{opt}</span>
            </div>
          );
        })}
      </div>
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  );
}

// ─── TEXT FIELD ───────────────────────────────────────────────────────────────
function Field({ id, label, required, type = "text", placeholder, value, onChange, error, accentColor }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}{required && <span style={S.required}>*</span>}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ ...S.input, borderColor: error ? "#FF5555" : "rgba(255,255,255,0.1)" }}
        onFocus={e => e.target.style.borderColor = accentColor || "#4F7CFF"}
        onBlur={e => e.target.style.borderColor = error ? "#FF5555" : "rgba(255,255,255,0.1)"}
      />
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filledCounts, setFilledCounts] = useState(
    Object.fromEntries(EVENTS.map(ev => [ev.id, ev.filled]))
  );
  useEffect(() => {
    async function fetchCounts() {
      const results = await Promise.all(
        EVENTS.map(async (ev) => {
          try {
            const res = await fetch(`${APPS_SCRIPT_URL}?sheetId=${ev.sheetId}`);
            const data = await res.json();
            return [ev.id, data.count];
          } catch {
            return [ev.id, ev.filled];
          }
        })
      );
      setFilledCounts(Object.fromEntries(results));
    }
    fetchCounts();
  }, []);
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "",
    institute: "", fieldOfStudy: "",
    semester: "", status: "",
    screenshot: null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef();

  useEffect(() => {
    if (pageRef.current) pageRef.current.scrollTop = 0;
  }, [screen]);

  function openEvent(ev) { setSelectedEvent(ev); setScreen("detail"); }

  function openForm() {
    setForm({ fullName: "", phone: "", email: "", institute: "", fieldOfStudy: "", semester: "", status: "", screenshot: null });
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
    if (!form.status) e.status = "Please select your status";
    if (selectedEvent?.fee > 0 && !form.screenshot) e.screenshot = "Payment screenshot is required for paid events";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      let screenshotBase64 = null, screenshotName = null;
      if (form.screenshot) {
        screenshotBase64 = await fileToBase64(form.screenshot);
        screenshotName = form.screenshot.name;
      }
      const payload = {
        eventTitle: selectedEvent.title, eventDate: selectedEvent.date,
        fullName: form.fullName, phone: form.phone, email: form.email,
        institute: form.institute, fieldOfStudy: form.fieldOfStudy,
        semester: form.semester, status: form.status,
        screenshotBase64, screenshotName,
        timestamp: new Date().toISOString(),
        sheetId: selectedEvent.sheetId,    // ✅ added
        folderId: selectedEvent.folderId,  // ✅ added
      };
      if (APPS_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        await fetch(APPS_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
      }
      setFilledCounts(prev => ({ ...prev, [selectedEvent.id]: (prev[selectedEvent.id] || 0) + 1 }));
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
    if (!["image/jpeg","image/jpg","image/png"].includes(file.type)) { alert("Only JPG, JPEG, PNG allowed"); return; }
    setForm(f => ({ ...f, screenshot: file }));
    setErrors(er => ({ ...er, screenshot: undefined }));
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") {
    const upcomingEvents = EVENTS.filter(ev => !isPast(ev.date));
    const pastEvents = EVENTS.filter(ev => isPast(ev.date));

    const renderCard = (ev, past) => {
      const filled = filledCounts[ev.id] ?? ev.filled;
      const pct = Math.min(100, Math.round((filled / ev.seats) * 100));
      const cardStyle = past
        ? { ...S.eventCard(ev.color), opacity: 0.6, filter: "grayscale(40%)" }
        : S.eventCard(ev.color);
      return (
        <div key={ev.id} style={cardStyle} onClick={() => openEvent(ev)}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
          <div style={S.cardBody}>
            <div style={S.tag(ev.color)}><Icon.Tag />{ev.tag}</div>
            <div style={S.eventTitle}>{ev.title}</div>
            <div style={S.speakerRow}>
              {ev.hostPhoto
                ? <img src={ev.hostPhoto} alt={ev.speaker} style={S.speakerAvatar} onError={e => e.target.style.display="none"} />
                : <div style={S.speakerFallback(ev.color)}>🎤</div>}
              <div>
                <div style={S.speakerName}>{ev.speaker}</div>
                <div style={S.speakerSub}>{ev.speakerTitle}</div>
              </div>
            </div>
            <div style={S.meta}>
              <div style={S.metaItem}><Icon.Calendar />{ev.date}</div>
              <div style={S.metaItem}><Icon.Clock />{ev.time}</div>
              <div style={S.metaItem}><Icon.Users />{filled}/{ev.seats}</div>
            </div>
            <div style={S.progressBar}><div style={S.progressFill(pct, ev.color)} /></div>
            <div style={S.feeRow}>
              <div style={S.feeBadge(ev.fee === 0)}>{ev.fee === 0 ? "FREE" : `PKR ${ev.fee}`}</div>
              {!past && <button style={S.registerBtn(ev.color)}>Register <Icon.Arrow /></button>}
              {past && <span style={{ fontSize: 11, fontWeight: 600, color: "#555", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "5px 10px" }}>Event Ended</span>}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div style={S.app} ref={pageRef}>
        <div style={S.header}>
          <div style={S.logo}><span>Team<span style={S.logoAccent}> Zarar</span></span></div>
          <div style={S.logoTag}>Expert Talks & Webinars</div>
        </div>
        <div style={S.page}>
          <div style={S.sectionTitle}>Upcoming Webinars</div>
          <div style={S.heroTitle}>Learn from the<br />Best Minds</div>
          {upcomingEvents.length > 0
            ? upcomingEvents.map(ev => renderCard(ev, false))
            : <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>No upcoming events at the moment. Check back soon!</div>
          }
          {pastEvents.length > 0 && (
            <>
              <div style={{ ...S.sectionTitle, marginTop: 28, color: "#666" }}>Past Events</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>These events have already taken place.</div>
              {pastEvents.map(ev => renderCard(ev, true))}
            </>
          )}
        </div>
        <DevBar />
      </div>
    );
  }

  // ── DETAIL ────────────────────────────────────────────────────────────────
  if (screen === "detail" && selectedEvent) {
    const ev = selectedEvent;
    const filled = filledCounts[ev.id] ?? ev.filled;
    const pct = Math.min(100, Math.round((filled / ev.seats) * 100));
    return (
      <div style={S.app} ref={pageRef}>
        <div style={S.header}>
          <div style={S.logo}>Team<span style={S.logoAccent}> Zarar</span></div>
        </div>
        <div style={S.page}>
          <button style={S.backBtn} onClick={() => setScreen("home")}><Icon.Back /> Back to Events</button>
          {ev.poster && <img src={ev.poster} alt="Event Poster" style={S.posterImg} onError={e => e.target.style.display="none"} />}
          <div style={S.detailHero(ev.color)}>
            <div style={S.detailTag(ev.color)}><Icon.Tag />{ev.tag}</div>
            <div style={S.detailTitle}>{ev.title}</div>
            <div style={S.detailSpeakerRow}>
              {ev.hostPhoto
                ? <img src={ev.hostPhoto} alt={ev.speaker} style={S.detailAvatar} onError={e => e.target.style.display="none"} />
                : <div style={{ ...S.speakerFallback(ev.color), width: 54, height: 54, fontSize: 22 }}>🎤</div>}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{ev.speaker}</div>
                <div style={{ fontSize: 12, color: "#AAB0C0" }}>{ev.speakerTitle}</div>
              </div>
            </div>
            <div style={S.detailMeta}>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Date</div><div style={S.metaBoxValue}>{ev.date}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Time</div><div style={S.metaBoxValue}>{ev.time}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Duration</div><div style={S.metaBoxValue}>{ev.duration}</div></div>
              <div style={S.metaBox}><div style={S.metaBoxLabel}>Fee</div><div style={S.metaBoxValue}>{ev.fee === 0 ? "FREE" : `PKR ${ev.fee}`}</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{pct}% seats filled ({filled}/{ev.seats})</div>
            <div style={S.progressBar}><div style={S.progressFill(pct, ev.color)} /></div>
          </div>
          <div style={S.descBox}>{ev.description}</div>
          {!isPast(ev.date) && (
            <button style={S.bigRegBtn(ev.color)} onClick={openForm}>Register for this Event <Icon.Arrow /></button>
          )}
          {isPast(ev.date) && (
            <div style={{ textAlign: "center", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, fontSize: 14, color: "#555", fontWeight: 600 }}>
              This event has already taken place
            </div>
          )}
        </div>
        <DevBar />
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (screen === "form" && selectedEvent) {
    const ev = selectedEvent;
    const mkField = (id, label, required, type, placeholder) => (
      <Field key={id} id={id} label={label} required={required} type={type}
        placeholder={placeholder} value={form[id]} accentColor={ev.color} error={errors[id]}
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
          {mkField("fullName",     "Full Name",              true,  "text",  "e.g. Hassaan Zarar")}
          {mkField("phone",        "Contact Number",         true,  "tel",   "e.g. +92 300 1234567")}
          {mkField("email",        "Email Address",          true,  "email", "e.g. you@example.com")}
          {mkField("institute",    "University / Institute", false, "text",  "e.g. University of Lahore")}
          {mkField("fieldOfStudy", "Field of Study",         false, "text",  "e.g. Computer Science")}
          {mkField("semester",     "Semester / Year",        false, "text",  "e.g. 3rd Semester / 2nd Year")}
          <RadioField
            label="Status" required
            options={["Undergraduate", "Graduated"]}
            value={form.status} accentColor={ev.color} error={errors.status}
            onChange={val => { setForm(f => ({ ...f, status: val })); setErrors(er => ({ ...er, status: undefined })); }}
          />
          {ev.fee > 0 && (
            <div style={{
              background: "rgba(79,124,255,0.08)",
              border: "1px solid rgba(79,124,255,0.25)",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                Make a payment of Rs. {ev.fee} to the following account
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4F7CFF", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
                Bank Account Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Account Number</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>03108753027</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Payment Method</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#22C97A" }}>JazzCash</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Account Name</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Marsad Zaman Khan</span>
                </div>
              </div>
            </div>
          )}
          {ev.fee > 0 && (
            <UploadField screenshot={form.screenshot} onFile={handleFile} required={true} error={errors.screenshot} />
          )}
          <button style={{ ...S.submitBtn, opacity: submitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Registration"} {!submitting && <Icon.Arrow />}
          </button>
          <div style={{ fontSize: 11, color: "#555", textAlign: "center", marginTop: 12 }}>
            Fields marked <span style={{ color: "#FF5555" }}>*</span> are required
          </div>
        </div>
        <DevBar />
      </div>
    );
  }

  // ── THANK YOU ─────────────────────────────────────────────────────────────
  if (screen === "thanks") return (
    <div style={S.app} ref={pageRef}>
      <div style={S.thankBox}>
        <div style={S.checkCircle}><Icon.Check /></div>
        <div style={S.thankTitle}>You're Registered!</div>
        <div style={S.thankSub}>
          Thank you for registering for <strong style={{ color: "#fff" }}>{selectedEvent?.title}</strong>. We'll send the webinar link to your email before the event.
        </div>
        <button style={S.homeBtn} onClick={() => { setScreen("home"); setSelectedEvent(null); }}>Back to Events</button>
      </div>
      <DevBar />
    </div>
  );

  return null;
}
