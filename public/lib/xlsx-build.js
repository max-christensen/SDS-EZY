// Builds the take-away spreadsheet's sheet definitions (for write-excel-file). Pure data in, plain objects out.
// Every sheet starts with the business name, the disclaimer line, then a blank row.
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m;
  else (root.SDSLib = root.SDSLib || {}).xlsxBuild = m;
})(typeof self !== "undefined" ? self : this, function () {
  function libs() {
    if (typeof module === "object" && module.exports) return { M: require("./export-model.js"), ML: require("./manifest-layout.js") };
    return { M: self.SDSLib.exportModel, ML: self.SDSLib.manifestLayout };
  }

  const bold = (v) => ({ value: v == null ? "" : String(v), fontWeight: "bold" });
  const str = (v) => (v == null || v === "" ? null : { value: String(v), type: String });
  const num = (v) => (v == null || v === "" || isNaN(Number(v)) ? null : { value: Number(v), type: Number });
  const head = (labels) => labels.map((l) => ({ value: l, fontWeight: "bold", backgroundColor: "#E7EFEE", wrap: true }));
  const widths = (list) => list.map((w) => ({ width: w }));

  function top(model, title, disclaimerShort, ncols) {
    const name = model.company.company_name;
    const rows = [
      [bold(title + (name ? " - " + name : ""))],
      [{ value: disclaimerShort, type: String }],
      [{ value: "Prepared " + model.generated_at.slice(0, 10), type: String }],
      [],
    ];
    void ncols;
    return rows;
  }

  function chemRow(M, c, extended) {
    const sds = c;
    const base = [
      str(c.product_name), str(c.supplier), str(M.DECISION_LABEL[c.decision] || "Not decided"),
      str(M.RISK_LABEL[c.risk_level] || ""), str(c.dg_class), str(c.signal_word),
      str(M.fmtDate(c.sds_issue_date)), str(M.fmtDate(c.review_due)), str(M.STATUS_LABEL[c.status] || ""),
      str(M.locationText(c)),
    ];
    if (!extended) return base.concat([str(c.use_description)]);
    return base.concat([
      str(sds.un_number ? "UN " + String(sds.un_number).replace(/^UN\s*/i, "") : ""), str(sds.subsidiary_class), str(sds.packing_group),
      str(sds.hazchem_code), str(sds.proper_shipping_name), str(sds.h_statements), str(c.use_description),
    ]);
  }

  const REGISTER_HEAD = ["Product", "Supplier", "Decision", "Risk level", "DG class", "Signal word", "SDS issue date", "Review due", "Review status", "Where stored (quantity)", "Use"];
  const HAZ_HEAD = ["Product", "Supplier", "Decision", "Risk level", "DG class", "Signal word", "SDS issue date", "Review due", "Review status", "Where stored (quantity)", "UN number", "Subsidiary risk", "Packing group", "Hazchem", "Proper shipping name", "Hazard statements", "Use"];
  const REGISTER_W = [30, 24, 14, 26, 9, 11, 14, 14, 18, 40, 36];
  const HAZ_W = [30, 24, 14, 26, 9, 11, 14, 14, 18, 40, 11, 11, 9, 9, 28, 50, 36];

  function registerSheet(model, D) {
    const { M } = libs();
    const data = top(model, "Chemical register", D.short);
    data.push(head(REGISTER_HEAD));
    model.chemicals.forEach((c) => data.push(chemRow(M, c, false)));
    return { sheet: "Register", data, columns: widths(REGISTER_W) };
  }

  function hazardousSheet(model, D) {
    const { M } = libs();
    const data = top(model, "Hazardous chemicals", D.short);
    data.push(head(HAZ_HEAD));
    model.chemicals.filter((c) => c.decision === "hazardous").forEach((c) => data.push(chemRow(M, c, true)));
    return { sheet: "Hazardous", data, columns: widths(HAZ_W) };
  }

  function manifestSheet(model, D, layout) {
    const { ML } = libs();
    const L = layout || ML.LAYOUT;
    const rows = ML.rowsFromExport({ chemicals: model.chemicals, locations: model.locations });
    const totals = ML.computeTotals(rows);
    const data = [[bold(L.title + (model.company.company_name ? " - " + model.company.company_name : ""))], [{ value: D.short, type: String }], []];
    ML.headerFacts(model.company, model.generated_at.slice(0, 10), L).forEach((f) => data.push([bold(f.label), str(f.value)]));
    data.push([]);
    data.push(head(L.columns.map((c) => c.label)));
    if (!rows.length) data.push([str(L.emptyText)]);
    rows.forEach((r) => data.push(L.columns.map((c) => (c.num ? num(c.raw ? c.raw(r) : c.get(r)) : str(c.get(r))))));
    data.push([]);
    data.push([bold(L.totals.title)]);
    data.push(head(L.totals.columns.map((c) => c.label)));
    totals.forEach((t) => data.push(L.totals.columns.map((c) => (c.num ? num(c.raw ? c.raw(t) : c.get(t)) : str(c.get(t))))));
    return { sheet: "Manifest", data, columns: widths(L.columns.map((c) => Math.max(8, c.width * 1.5))) };
  }

  const ASSESS_HEAD = ["Product", "Assessed", "Assessed by", "Risk level", "Form", "Use", "Breathing in", "Swallowing", "Skin absorption", "Isolation", "Ventilation", "Other controls", "PPE", "Additional PPE", "Controls notes", "PPE notes", "Fire response", "Spill response", "Atmospheric monitoring", "Health surveillance", "Check these (not found in the SDS text)"];
  const ASSESS_W = [30, 13, 22, 26, 11, 36, 11, 11, 13, 36, 30, 34, 30, 30, 36, 30, 40, 40, 28, 28, 34];

  function assessmentsSheet(model, D) {
    const { M } = libs();
    const data = top(model, "Risk assessments", D.short);
    data.push(head(ASSESS_HEAD));
    model.chemicals.forEach((c) => {
      const a = c.assessment;
      if (!a) return;
      const g = a.grouped;
      data.push([
        str(c.product_name), str(M.fmtDate(a.assessed_date)), str(a.assessed_by), str(M.RISK_LABEL[a.risk_level] || ""), str(a.form), str(a.use_description),
        str(M.yesNo(a.route_inhalation)), str(M.yesNo(a.route_ingestion)), str(M.yesNo(a.route_absorption)),
        str(g.isolation.join("; ")), str(g.ventilation.join("; ")), str(g.other.join("; ")), str(g.ppe.join("; ")), str(g.additional_ppe.join("; ")),
        str(a.controls_notes), str(a.ppe_notes), str(a.fire_response), str(a.spill_response),
        str(M.yesNo(a.monitoring_needed) + (a.monitoring_note ? ": " + a.monitoring_note : "")),
        str(M.yesNo(a.surveillance_needed) + (a.surveillance_note ? ": " + a.surveillance_note : "")),
        str(M.flaggedFields(a).join(", ")),
      ]);
    });
    return { sheet: "Assessments", data, columns: widths(ASSESS_W) };
  }

  function reviewSheet(model, D) {
    const { M } = libs();
    const data = top(model, "Safety data sheets due for review", D.short);
    data.push(head(["Product", "Supplier", "Status", "Review due", "SDS issue date"]));
    const order = { overdue: 0, due_soon: 1, no_sds: 2, unknown: 3 };
    const list = model.chemicals.filter((c) => c.status !== "ok");
    list.sort((a, b) => (order[a.status] - order[b.status]) || String(a.review_due || "9999").localeCompare(String(b.review_due || "9999")));
    list.forEach((c) => data.push([str(c.product_name), str(c.supplier), str(M.STATUS_LABEL[c.status]), str(M.fmtDate(c.review_due)), str(M.fmtDate(c.sds_issue_date))]));
    if (!list.length) data.push([str("Nothing is due for review.")]);
    return { sheet: "Review due", data, columns: widths([30, 24, 20, 14, 14]) };
  }

  // model: export-model.normalise(); D: window.DISCLAIMER
  function buildSheets(model, D, layout) {
    return [registerSheet(model, D), hazardousSheet(model, D), manifestSheet(model, D, layout), assessmentsSheet(model, D), reviewSheet(model, D)];
  }

  return { buildSheets, registerSheet, hazardousSheet, manifestSheet, assessmentsSheet, reviewSheet };
});
