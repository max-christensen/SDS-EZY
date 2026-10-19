// Builds the take-away spreadsheet's sheet definitions (for write-excel-file). Pure data in, plain objects out.
// Every sheet starts with the business name, the disclaimer line, the Safe Work Australia source line and a blank row.
// opts: { ref (ghs-ref.mjs module), totals (computeSiteTotals result), layout }
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
  const OVER_FILL = "#F4B6B0";
  const status = (s) => (s === "OVER" ? { value: "OVER", type: String, fontWeight: "bold", backgroundColor: OVER_FILL, textColor: "#8C1A12" } : str(s));

  function top(model, title, D, ML) {
    const name = model.company.company_name;
    return [
      [bold(title + (name ? " - " + name : ""))],
      [{ value: D.short, type: String }],
      [{ value: ML.SOURCE_LINE, type: String }],
      [{ value: "Prepared " + model.generated_at.slice(0, 10), type: String }],
      [],
    ];
  }

  const REGISTER_HEAD = ["Product", "Supplier", "Decision", "Decision overridden by an admin", "Risk level", "GHS classification", "Classification flags (check)", "Pictograms (GHS codes)", "Signal word", "ADG class (illustration only)", "SDS issue date", "Review due", "Review status", "Where stored (quantity)", "Use"];
  const HAZ_HEAD = REGISTER_HEAD.slice(0, 14).concat(["UN number", "Subsidiary risk", "Packing group", "Hazchem", "Proper shipping name", "Hazard statements", "Use"]);
  const REGISTER_W = [30, 24, 14, 16, 26, 44, 40, 34, 11, 14, 14, 14, 18, 40, 36];
  const HAZ_W = [30, 24, 14, 16, 26, 44, 40, 34, 11, 14, 14, 14, 18, 40, 11, 11, 9, 9, 28, 50, 36];

  function chemRow(M, ref, c, extended) {
    const base = [
      str(c.product_name), str(c.supplier), str(M.DECISION_LABEL[c.decision] || "Not decided"), str(c.decision_overridden ? "Yes" : ""),
      str(M.RISK_LABEL[c.risk_level] || ""), str(M.classificationText(c.classification, ref)), str((c.flags || []).join(" ")),
      str(M.pictogramText(c.pictogramList, ref) + (c.pictograms_overridden ? " (overridden)" : "")),
      str(c.signal_word), str(c.dg_class), str(M.fmtDate(c.sds_issue_date)), str(M.fmtDate(c.review_due)), str(M.STATUS_LABEL[c.status] || ""),
      str(M.locationText(c)),
    ];
    if (!extended) return base.concat([str(c.use_description)]);
    return base.concat([
      str(c.un_number ? "UN " + String(c.un_number).replace(/^UN\s*/i, "") : ""), str(c.subsidiary_class), str(c.packing_group),
      str(c.hazchem_code), str(c.proper_shipping_name), str(c.h_statements), str(c.use_description),
    ]);
  }

  function registerSheet(model, D, o) {
    const { M, ML } = libs();
    const data = top(model, "Chemical register", D, ML);
    data.push(head(REGISTER_HEAD));
    model.chemicals.forEach((c) => data.push(chemRow(M, o.ref, c, false)));
    return { sheet: "Register", data, columns: widths(REGISTER_W) };
  }

  function hazardousSheet(model, D, o) {
    const { M, ML } = libs();
    const data = top(model, "Hazardous chemicals", D, ML);
    data.push(head(HAZ_HEAD));
    model.chemicals.filter((c) => c.decision === "hazardous").forEach((c) => data.push(chemRow(M, o.ref, c, true)));
    return { sheet: "Hazardous", data, columns: widths(HAZ_W) };
  }

  // Storage locations of hazardous chemicals (the layout in manifest-layout.js).
  function manifestSheet(model, D, o) {
    const { ML } = libs();
    const L = o.layout || ML.LAYOUT;
    const rows = ML.rowsFromExport({ chemicals: model.chemicals, locations: model.locations }, o.ref);
    const data = [[bold(L.title + (model.company.company_name ? " - " + model.company.company_name : ""))], [{ value: D.short, type: String }], [{ value: ML.SOURCE_LINE, type: String }], []];
    ML.headerFacts(model.company, model.generated_at.slice(0, 10), L).forEach((f) => data.push([bold(f.label), str(f.value)]));
    data.push([]);
    data.push(head(L.rows.map((c) => c.label)));
    if (!rows.length) data.push([str(L.emptyText)]);
    rows.forEach((r) => data.push(L.rows.map((c) => (c.num ? num(c.raw ? c.raw(r) : c.get(r)) : str(c.get(r))))));
    data.push([]);
    data.push([{ value: o.ref ? o.ref.ADG_COLUMN_NOTE : "", type: String }]);
    return { sheet: "Manifest", data, columns: widths(L.rows.map((c) => Math.max(8, c.width * 1.6))) };
  }

  // ALL items (43), with OVER cells marked.
  const ITEMS_HEAD = ["Item", "Group", "Description", "Unit", "Placard quantity", "Manifest quantity", "Site total", "Placard status", "Manifest status", "ADG class (illustration only)", "Products counted"];
  function itemsSheet(model, D, o) {
    const { ML } = libs();
    const im = ML.itemsModel(o.totals);
    const data = top(model, "Placard and manifest quantities by item", D, ML);
    const banners = ML.overBanners(im);
    banners.forEach((b) => data.push([{ value: b.text, type: String, fontWeight: "bold", backgroundColor: OVER_FILL, textColor: "#8C1A12" }]));
    if (banners.length) data.push([]);
    data.push(head(ITEMS_HEAD));
    im.forEach((m) => data.push([
      num(m.item), str(m.def.group), str(m.isMix ? "Any mix of items " + m.def.mixOf.join(", ") : m.def.desc), str(m.unit), num(m.placard), num(m.manifest),
      num(m.total), status(m.pstatus), status(m.mstatus), str(m.adg),
      str([m.productsText, m.pnote ? "Placard: " + m.pnote : "", m.mnote ? "Manifest: " + m.mnote : ""].filter(Boolean).join(". ")),
    ]));
    data.push([]);
    data.push([{ value: o.ref ? o.ref.ADG_COLUMN_NOTE : "", type: String }]);
    data.push([{ value: "Quantities are not converted between litres and kilograms. Where a mixing item is shown as NOT APPLIED, one of its items is already over on its own.", type: String }]);
    return { sheet: "Placard and manifest", data, columns: widths([6, 34, 44, 9, 12, 12, 12, 14, 14, 18, 70]) };
  }

  function issuesSheet(model, D, o) {
    const { ML } = libs();
    const data = top(model, "Things to check", D, ML);
    data.push(head(["What", "Product and message", "Why it matters"]));
    const groups = ML.groupIssues(o.totals);
    groups.forEach((g) => g.entries.forEach((e) => data.push([str(g.title), str(e.message), str(g.help)])));
    if (!groups.length) data.push([str("Nothing needs checking.")]);
    return { sheet: "Issues", data, columns: widths([46, 100, 80]) };
  }

  const ASSESS_HEAD = ["Product", "Assessed", "Assessed by", "Risk level", "Form", "Use", "Breathing in", "Swallowing", "Skin absorption", "Isolation", "Ventilation", "Other controls", "PPE", "Additional PPE", "Controls notes", "PPE notes", "Fire response", "Spill response", "Atmospheric monitoring", "Health surveillance", "Check these (not found in the SDS text)"];
  const ASSESS_W = [30, 13, 22, 26, 11, 36, 11, 11, 13, 36, 30, 34, 30, 30, 36, 30, 40, 40, 28, 28, 34];

  function assessmentsSheet(model, D) {
    const { M, ML } = libs();
    const data = top(model, "Risk assessments", D, ML);
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
    const { M, ML } = libs();
    const data = top(model, "Safety data sheets due for review", D, ML);
    data.push(head(["Product", "Supplier", "Status", "Review due", "SDS issue date"]));
    const order = { overdue: 0, due_soon: 1, no_sds: 2, unknown: 3 };
    const list = model.chemicals.filter((c) => c.status !== "ok");
    list.sort((a, b) => (order[a.status] - order[b.status]) || String(a.review_due || "9999").localeCompare(String(b.review_due || "9999")));
    list.forEach((c) => data.push([str(c.product_name), str(c.supplier), str(M.STATUS_LABEL[c.status]), str(M.fmtDate(c.review_due)), str(M.fmtDate(c.sds_issue_date))]));
    if (!list.length) data.push([str("Nothing is due for review.")]);
    return { sheet: "Review due", data, columns: widths([30, 24, 20, 14, 14]) };
  }

  // model: export-model.normalise(); D: window.DISCLAIMER; opts: {ref, totals, layout}
  function buildSheets(model, D, opts) {
    const o = opts || {};
    return [registerSheet(model, D, o), hazardousSheet(model, D, o), manifestSheet(model, D, o), itemsSheet(model, D, o), issuesSheet(model, D, o), assessmentsSheet(model, D), reviewSheet(model, D)];
  }

  return { buildSheets, registerSheet, hazardousSheet, manifestSheet, itemsSheet, issuesSheet, assessmentsSheet, reviewSheet };
});
