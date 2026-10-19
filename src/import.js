// One-time spreadsheet import. The browser parses and maps the columns; this validates and creates the rows.
import { json, addYearsIso } from "./lib.js";
import { bad, readJson, cleanStr, cleanEnum, cleanDate, PHYSICAL_FORMS, DECISIONS, buildSearchText, classificationStatements } from "./register.js";

const MAX_ROWS = 2000;
const CHUNK_STATEMENTS = 80;

function normUnit(u) {
  if (u === undefined || u === null || String(u).trim() === "") return "L";
  const s = String(u).trim().toLowerCase();
  if (/^(l|lt|ltr|litre|litres|liter|liters)$/.test(s)) return "L";
  if (/^(kg|kgs|kilo|kilos|kilogram|kilograms)$/.test(s)) return "kg";
  throw bad("Unit must be L or kg");
}

function cleanRow(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) throw bad("Row is not valid");
  const chem = {
    product_name: cleanStr(r.product_name, 200, "Product name", { required: true }),
    supplier: cleanStr(r.supplier, 200, "Supplier"),
    synonyms: cleanStr(r.synonyms, 1000, "Other names"),
    product_codes: cleanStr(r.product_codes, 500, "Product codes"),
    use_description: cleanStr(r.use_description, 2000, "Use description"),
    physical_form: cleanEnum(r.physical_form ? String(r.physical_form).toLowerCase() : null, PHYSICAL_FORMS, "Physical form"),
    decision_override: cleanEnum(r.decision ? String(r.decision).toLowerCase() : null, DECISIONS, "Decision"),
    decision_note: cleanStr(r.decision_note, 1000, "Decision note"),
  };
  // Transport details and the SDS date from the spreadsheet go on a placeholder SDS row (no PDF yet).
  const sds = {
    un_number: cleanStr(r.un_number ? String(r.un_number).replace(/D/g, "") : null, 8, "UN number"),
    dg_class: cleanStr(r.dg_class, 10, "Dangerous goods class"),
    subsidiary_class: cleanStr(r.subsidiary_class, 20, "Subsidiary class"),
    packing_group: cleanEnum(r.packing_group ? String(r.packing_group).toUpperCase().replace(/[^IV]/g, "") : null, ["I", "II", "III"], "Packing group"),
    hazchem_code: cleanStr(r.hazchem_code, 12, "Hazchem code"),
    issue_date: cleanDate(r.sds_date, "SDS date"),
  };
  const hasSds = Object.values(sds).some(v => v);
  let loc = null;
  const location = cleanStr(r.location, 200, "Location");
  if (location) {
    const q = r.quantity === undefined || r.quantity === null || r.quantity === "" ? 0 : Number(r.quantity);
    if (!Number.isFinite(q) || q < 0 || q > 1e9) throw bad("Quantity must be a number from 0 up");
    loc = { location, quantity: Math.round(q * 1000) / 1000, unit: normUnit(r.unit), container_note: cleanStr(r.container_note, 300, "Container note"), spill_compound: cleanStr(r.spill_compound, 200, "Spill compound") };
  }
  return { chem, loc, sds: hasSds ? sds : null };
}

export async function handleImport(c) {
  const { env, user } = c;
  const body = await readJson(c.request, 8_000_000);
  if (!Array.isArray(body.rows)) throw bad("rows must be a list");
  if (body.rows.length > MAX_ROWS) throw bad(`Import at most ${MAX_ROWS} rows at a time`);
  const dry = !!body.dry_run;
  const errors = [];
  const parsed = [];
  body.rows.forEach((r, i) => {
    try { parsed.push({ i, ...cleanRow(r) }); } catch (e) { errors.push({ row: i + 1, error: e.message }); }
  });
  const key = (n, s) => `${n.toLowerCase()}\u0001${(s || "").toLowerCase()}`;

  // Existing products: one indexed lookup (idx_chem_name) per distinct name, batched.
  const names = [...new Set(parsed.map(p => p.chem.product_name.toLowerCase()))];
  const existing = new Set();
  for (let i = 0; i < names.length; i += 50) {
    const slice = names.slice(i, i + 50);
    const res = await env.DB.batch(slice.map(n => env.DB.prepare("SELECT supplier FROM chemicals WHERE product_name = ? COLLATE NOCASE").bind(n)));
    res.forEach((r, k) => r.results.forEach(row => existing.add(key(slice[k], row.supplier))));
  }

  // Group rows: the first row for a product creates it, further rows for the same product add storage locations.
  const groups = new Map();
  let skipped = 0;
  const skippedList = [];
  for (const p of parsed) {
    const k = key(p.chem.product_name, p.chem.supplier);
    if (existing.has(k)) { skipped++; skippedList.push({ row: p.i + 1, product_name: p.chem.product_name }); continue; }
    const g = groups.get(k);
    if (g) { if (p.loc) g.locs.push(p.loc); if (!g.sds && p.sds) g.sds = p.sds; } else groups.set(k, { chem: p.chem, sds: p.sds, locs: p.loc ? [p.loc] : [] });
  }
  const created = groups.size;
  const locationsCreated = [...groups.values()].reduce((n, g) => n + g.locs.length, 0);
  if (dry) return json({ dry_run: true, created, skipped, locations_created: locationsCreated, errors, skipped_rows: skippedList.slice(0, 200) });

  let stmts = [];
  const flush = async () => { if (stmts.length) { await env.DB.batch(stmts); stmts = []; } };
  for (const g of groups.values()) {
    const f = g.chem, d = g.sds;
    if (d) {
      stmts.push(env.DB.prepare(
        `INSERT INTO sds (doc_key, title, supplier, issue_date, review_due, un_number, dg_class, subsidiary_class, packing_group, hazchem_code, source, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'import', ?)`
      ).bind(crypto.randomUUID(), f.product_name, f.supplier, d.issue_date, d.issue_date ? addYearsIso(d.issue_date, 5) : null,
        d.un_number, d.dg_class, d.subsidiary_class, d.packing_group, d.hazchem_code, user.id));
    }
    stmts.push(env.DB.prepare(
      `INSERT INTO chemicals (product_name, supplier, synonyms, product_codes, use_description, physical_form, decision_note,
         source, search_text, created_by, sds_id, sds_issue_date, review_due, dg_class)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'import', ?, ?, ${d ? "(SELECT MAX(id) FROM sds)" : "NULL"}, ?, ?, ?)`
    ).bind(f.product_name, f.supplier, f.synonyms, f.product_codes, f.use_description, f.physical_form, f.decision_note,
      buildSearchText(f, d), user.id,
      d ? d.issue_date : null, d && d.issue_date ? addYearsIso(d.issue_date, 5) : null, d ? d.dg_class : null));
    // Not classified (ghs_classification NULL): the sheet's ADG class says nothing about the GHS category.
    // A decision column becomes the override; the effective decision follows it.
    stmts.push(...classificationStatements(env, "last", null, { overrides: { decision: f.decision_override, pictograms: null }, decisionBy: user.name }));
    for (const l of g.locs) {
      stmts.push(env.DB.prepare(
        "INSERT INTO storage_locations (chemical_id, location, spill_compound, quantity, unit, container_note) VALUES ((SELECT MAX(id) FROM chemicals), ?, ?, ?, ?, ?)"
      ).bind(l.location, l.spill_compound, l.quantity, l.unit, l.container_note));
    }
    if (stmts.length >= CHUNK_STATEMENTS) await flush();
  }
  await flush();
  return json({ created, skipped, locations_created: locationsCreated, errors, skipped_rows: skippedList.slice(0, 200) });
}
