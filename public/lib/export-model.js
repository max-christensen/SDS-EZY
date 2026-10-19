// Turns the GET /api/export/all reply into one tidy model that the spreadsheet and PDF builders share.
// Tolerant on purpose: it accepts either `id` or `chemical_id` for a chemical, and controls given either as a list
// of {kind,label} or already grouped by kind.
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m;
  else (root.SDSLib = root.SDSLib || {}).exportModel = m;
})(typeof self !== "undefined" ? self : this, function () {
  const RISK_LABEL = {
    not_significant: "Not significant",
    significant_controlled: "Significant but effectively controlled",
    significant_not_controlled: "Significant and not effectively controlled",
    uncertain: "Uncertain",
  };
  const DECISION_LABEL = { hazardous: "Hazardous", not_hazardous: "Not hazardous" };
  const STATUS_LABEL = { overdue: "Overdue", due_soon: "Due within 90 days", ok: "Up to date", no_sds: "No SDS on file", unknown: "No issue date" };
  const KIND_LABEL = { isolation: "Isolation", ventilation: "Ventilation", other: "Other controls", ppe: "PPE", additional_ppe: "Additional PPE" };
  const KINDS = ["isolation", "ventilation", "other", "ppe", "additional_ppe"];
  const PICTOGRAM_LABEL = {
    toxic: "Toxic", health: "Health hazard", flame: "Flammable", exclamation: "Irritant / harmful",
    oxidising: "Oxidising", gas: "Gas under pressure", environment: "Environmental hazard", corrosive: "Corrosive",
  };

  const s = (v) => (v == null ? "" : String(v).trim());

  function todayIso(d) { return (d || new Date()).toISOString().slice(0, 10); }
  function addDays(iso, n) {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function reviewStatus(c, today) {
    if (c.review_status) return c.review_status;
    const t = today || todayIso();
    if (!c.sds_id) return "no_sds";
    if (!c.review_due) return "unknown";
    if (c.review_due < t) return "overdue";
    if (c.review_due <= addDays(t, 90)) return "due_soon";
    return "ok";
  }

  function groupControls(a) {
    const out = {};
    KINDS.forEach((k) => (out[k] = []));
    if (Array.isArray(a.controls)) a.controls.forEach((c) => { if (out[c.kind]) out[c.kind].push(s(c.label)); });
    else if (a.controls && typeof a.controls === "object") KINDS.forEach((k) => { out[k] = (a.controls[k] || []).map((c) => s(c.label || c)); });
    return out;
  }

  function uniqueStr(list) { return [...new Set(list.filter(Boolean))]; }

  // data: the export reply. Returns the model.
  function normalise(data, today) {
    const t = today || todayIso();
    const locBy = new Map();
    for (const l of data.locations || []) {
      const k = Number(l.chemical_id);
      if (!locBy.has(k)) locBy.set(k, []);
      locBy.get(k).push(l);
    }
    const asBy = new Map();
    for (const a of data.assessments || []) {
      const k = Number(a.chemical_id);
      const prev = asBy.get(k);
      if (!prev || (a.is_current !== 0 && prev.is_current === 0)) asBy.set(k, Object.assign({}, a, { grouped: groupControls(a) }));
    }
    const chemicals = (data.chemicals || []).map((c) => {
      const id = Number(c.chemical_id != null ? c.chemical_id : c.id);
      const sdsId = c.sds_id != null ? Number(c.sds_id) : null;
      const row = Object.assign({}, c, { id, sds_id: sdsId });
      row.status = reviewStatus(row, t);
      row.locations = locBy.get(id) || [];
      row.assessment = asBy.get(id) || null;
      row.pictogramList = s(c.pictograms).split(",").map((x) => x.trim()).filter(Boolean);
      return row;
    });
    chemicals.sort((a, b) => s(a.product_name).toLowerCase().localeCompare(s(b.product_name).toLowerCase()));
    const company = data.company || {};
    return {
      generated_at: data.generated_at || new Date().toISOString(),
      company: {
        company_name: s(company.company_name || company.name),
        company_address: s(company.company_address || company.address),
        company_phone: s(company.company_phone || company.phone),
        company_email: s(company.company_email || company.email),
        company_reg: s(company.company_reg || company.reg),
      },
      chemicals,
      byId: new Map(chemicals.map((c) => [c.id, c])),
      sdsFiles: (data.sds_files || []).map((f) => Object.assign({}, f, { sds_id: Number(f.sds_id), product_names: f.product_names || [] })),
      locations: data.locations || [],
    };
  }

  function locationText(c) {
    return (c.locations || []).map((l) => s(l.location) + (l.quantity ? " (" + (Math.round(Number(l.quantity) * 100) / 100) + " " + (s(l.unit) || "L") + ")" : "")).join("; ");
  }

  function fmtDate(iso) {
    const m = s(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return s(iso);
    const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m[2]) - 1];
    return Number(m[3]) + " " + mon + " " + m[1];
  }

  function yesNo(v) { return v === 1 || v === true ? "Yes" : v === 0 || v === false ? "No" : "Not decided"; }

  function flaggedFields(a) {
    try { const l = JSON.parse(a.unverified || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }

  // For the PDF: which SDS file to include after which chemical (the first one that uses it).
  function planSds(chemicalsInOrder) {
    const firstUse = new Map(); // sds_id -> chemical id of the first assessment that uses it
    for (const c of chemicalsInOrder) if (c.sds_id && !firstUse.has(c.sds_id)) firstUse.set(c.sds_id, c.id);
    return firstUse;
  }

  return {
    RISK_LABEL, DECISION_LABEL, STATUS_LABEL, KIND_LABEL, KINDS, PICTOGRAM_LABEL,
    normalise, reviewStatus, locationText, fmtDate, yesNo, flaggedFields, planSds, groupControls, uniqueStr, todayIso,
  };
});
