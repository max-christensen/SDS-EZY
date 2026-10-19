// MANIFEST LAYOUT: the one place that says what the hazardous chemicals manifest looks like.
// The manifest screen, its CSV, the take-away spreadsheet sheet and the take-away PDF all read this
// definition, so reshaping it to match a real Workshop HAZCHEM Manifest sheet means editing THIS file only.
//
//   header   : the block of facts above the table (label + where the value comes from)
//   columns  : the main table, one line per storage location of a hazardous chemical
//   totals   : the second table, quantities added up by dangerous goods class
//   width    : relative column width (used for the PDF and spreadsheet column widths)
//   get(row) : the display text.  num: true = right aligned / written as a number in the spreadsheet
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m;
  else (root.SDSLib = root.SDSLib || {}).manifestLayout = m;
})(typeof self !== "undefined" ? self : this, function () {
  const clean = (v) => (v == null ? "" : String(v).trim());

  function fmtNum(n) {
    const x = Number(n);
    if (!isFinite(x)) return "";
    return String(Math.round(x * 100) / 100);
  }

  const LAYOUT = {
    title: "Hazardous Chemicals Manifest",
    subtitle: "Workshop HAZCHEM manifest",
    header: [
      { label: "Business", from: "company_name" },
      { label: "Address", from: "company_address" },
      { label: "Emergency contact", from: "company_phone" },
      { label: "Email", from: "company_email" },
      { label: "Prepared", from: "generated" },
    ],
    columns: [
      { key: "location", label: "Location", width: 15, get: (r) => clean(r.location) },
      { key: "product", label: "Product", width: 19, get: (r) => clean(r.product_name) },
      { key: "un", label: "UN no.", width: 6, get: (r) => (clean(r.un_number) ? "UN " + clean(r.un_number).replace(/^UN\s*/i, "") : "") },
      {
        key: "class", label: "Class (sub. risk)", width: 8,
        get: (r) => clean(r.dg_class) + (clean(r.subsidiary_class) ? " (" + clean(r.subsidiary_class) + ")" : ""),
      },
      { key: "pg", label: "PG", width: 4, get: (r) => clean(r.packing_group) },
      { key: "hazchem", label: "Hazchem", width: 7, get: (r) => clean(r.hazchem_code) },
      { key: "psn", label: "Proper shipping name", width: 23, get: (r) => clean(r.proper_shipping_name) },
      { key: "qty", label: "Quantity", width: 7, num: true, get: (r) => fmtNum(r.quantity), raw: (r) => Number(r.quantity) || 0 },
      { key: "unit", label: "Unit", width: 4, get: (r) => clean(r.unit) || "L" },
    ],
    totals: {
      title: "Totals by dangerous goods class",
      columns: [
        { key: "dg_class", label: "Class", width: 10, get: (t) => clean(t.dg_class) || "Unclassified" },
        { key: "litres", label: "Litres (L)", width: 12, num: true, get: (t) => fmtNum(t.litres), raw: (t) => Number(t.litres) || 0 },
        { key: "kg", label: "Kilograms (kg)", width: 12, num: true, get: (t) => fmtNum(t.kg), raw: (t) => Number(t.kg) || 0 },
      ],
    },
    emptyText: "No hazardous chemicals with a storage location yet.",
  };

  function classSortKey(c) {
    const s = clean(c);
    if (!s || /^unclass/i.test(s)) return [9999, 0];
    const m = s.match(/^(\d+)(?:\.(\d+))?/);
    return m ? [Number(m[1]), Number(m[2] || 0)] : [9998, 0];
  }
  function compareClass(a, b) {
    const x = classSortKey(a), y = classSortKey(b);
    return x[0] - y[0] || x[1] - y[1] || clean(a).localeCompare(clean(b));
  }

  // Add quantities up by class: litres and kilograms kept separate (no density guessing).
  function computeTotals(rows) {
    const map = new Map();
    for (const r of rows || []) {
      const k = clean(r.dg_class) || "Unclassified";
      if (!map.has(k)) map.set(k, { dg_class: k, litres: 0, kg: 0 });
      const t = map.get(k);
      const q = Number(r.quantity) || 0;
      if (clean(r.unit).toLowerCase() === "kg") t.kg += q; else t.litres += q;
    }
    return [...map.values()]
      .map((t) => ({ dg_class: t.dg_class, litres: Math.round(t.litres * 100) / 100, kg: Math.round(t.kg * 100) / 100 }))
      .sort((a, b) => compareClass(a.dg_class, b.dg_class));
  }

  // Build the manifest rows from the take-away export (same rule as the Worker: hazardous chemicals with a location).
  function rowsFromExport(data) {
    const chems = new Map();
    for (const c of data.chemicals || []) chems.set(Number(c.chemical_id != null ? c.chemical_id : c.id), c);
    const rows = [];
    for (const l of data.locations || []) {
      const c = chems.get(Number(l.chemical_id));
      if (!c || c.decision !== "hazardous") continue;
      rows.push({
        location_id: l.id, chemical_id: Number(l.chemical_id), product_name: c.product_name, supplier: c.supplier,
        location: l.location, quantity: l.quantity, unit: l.unit, container_note: l.container_note,
        dg_class: c.dg_class, subsidiary_class: c.subsidiary_class, un_number: c.un_number,
        packing_group: c.packing_group, hazchem_code: c.hazchem_code, proper_shipping_name: c.proper_shipping_name,
      });
    }
    rows.sort((a, b) => compareClass(a.dg_class, b.dg_class) || clean(a.product_name).localeCompare(clean(b.product_name)));
    return rows;
  }

  function headerFacts(company, generatedText, layout) {
    const L = layout || LAYOUT;
    const src = Object.assign({}, company || {}, { generated: generatedText || "" });
    return L.header.map((h) => ({ label: h.label, value: clean(src[h.from]) })).filter((h) => h.value);
  }

  // Plain table arrays (strings), used for CSV and PDF.
  function tableMatrix(rows, layout) {
    const L = layout || LAYOUT;
    return { head: L.columns.map((c) => c.label), body: (rows || []).map((r) => L.columns.map((c) => c.get(r))) };
  }
  function totalsMatrix(totals, layout) {
    const L = (layout || LAYOUT).totals;
    return { head: L.columns.map((c) => c.label), body: (totals || []).map((t) => L.columns.map((c) => c.get(t))) };
  }

  // CSV rows for App.csv(): facts, blank line, main table, blank line, totals table.
  function csvRows(manifest, company, layout) {
    const L = layout || LAYOUT;
    const out = [[L.title]];
    for (const f of headerFacts(company, manifest.generated_at || "", L)) out.push([f.label, f.value]);
    out.push([]);
    const m = tableMatrix(manifest.rows, L);
    out.push(m.head);
    m.body.forEach((r) => out.push(r));
    out.push([]);
    out.push([L.totals.title]);
    const t = totalsMatrix(manifest.totals && manifest.totals.length ? manifest.totals : computeTotals(manifest.rows), L);
    out.push(t.head);
    t.body.forEach((r) => out.push(r));
    return out;
  }

  return { LAYOUT, fmtNum, compareClass, computeTotals, rowsFromExport, headerFacts, tableMatrix, totalsMatrix, csvRows };
});
