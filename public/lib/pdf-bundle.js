// The take-away PDF: ONE print-ready file built in the browser with pdf-lib.
//   cover + disclaimer -> register -> manifest -> for each chemical: its assessment, then its SDS pages.
// A safety data sheet shared by several products is included ONCE, right after the first assessment that uses it;
// later assessments say which page it starts on.
// Text is limited to what the standard PDF fonts can draw (WinAnsi), so anything else is swapped or dropped.
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m;
  else (root.SDSLib = root.SDSLib || {}).pdfBundle = m;
})(typeof self !== "undefined" ? self : this, function () {
  function libs() {
    if (typeof module === "object" && module.exports) return { M: require("./export-model.js"), ML: require("./manifest-layout.js") };
    return { M: self.SDSLib.exportModel, ML: self.SDSLib.manifestLayout };
  }

  const SWAPS = {
    "‘": "'", "’": "'", "‚": ",", "“": '"', "”": '"', "–": "-", "—": "-", "−": "-",
    "…": "...", "•": "-", " ": " ", " ": " ", " ": " ", "→": "->", "≤": "<=", "≥": ">=",
    "₂": "2", "₃": "3", "₀": "0", "₁": "1", "²": "2", "³": "3", "℃": "C", "✓": "x", "☐": "[ ]",
  };
  // Keep printable ASCII and Latin-1 letters; swap common punctuation; drop everything else.
  function sanitise(text) {
    let out = "";
    for (const ch of String(text == null ? "" : text)) {
      if (SWAPS[ch] != null) { out += SWAPS[ch]; continue; }
      const c = ch.codePointAt(0);
      if (ch === "\n") out += "\n";
      else if (ch === "\t") out += " ";
      else if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa1 && c <= 0xff)) out += ch;
      else if (c === 0x20ac) out += "EUR";
    }
    return out;
  }

  // Break text into lines no wider than maxWidth (font.widthOfTextAtSize). Honours \n and splits over-long words.
  function wrapText(text, font, size, maxWidth) {
    const lines = [];
    for (const para of sanitise(text).split("\n")) {
      if (!para.trim()) { lines.push(""); continue; }
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) { line = test; continue; }
        if (line) lines.push(line);
        if (font.widthOfTextAtSize(word, size) <= maxWidth) { line = word; continue; }
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) { lines.push(chunk); chunk = ch; } else chunk += ch;
        }
        line = chunk;
      }
      lines.push(line);
    }
    return lines;
  }

  const A4 = [595.28, 841.89];
  const A4L = [841.89, 595.28];

  class Writer {
    constructor(PDFLib, doc, fonts, onNewPage) {
      this.P = PDFLib; this.doc = doc; this.f = fonts; this.onNewPage = onNewPage || null;
      this.margin = 40; this.page = null; this.y = 0; this.size = A4; this.footerSpace = 34;
      this.ink = PDFLib.rgb(0.12, 0.16, 0.14); this.soft = PDFLib.rgb(0.35, 0.37, 0.34); this.line = PDFLib.rgb(0.75, 0.74, 0.7);
      this.tint = PDFLib.rgb(0.91, 0.94, 0.93);
    }
    get width() { return this.size[0] - this.margin * 2; }
    newPage(size) {
      if (size) this.size = size;
      this.page = this.doc.addPage(this.size);
      this.y = this.size[1] - this.margin;
      if (this.onNewPage) this.onNewPage(this.page);
      return this.page;
    }
    ensure(h) { if (!this.page || this.y - h < this.margin + this.footerSpace) { this.newPage(); return true; } return false; }
    gap(h) { this.y -= h; }
    draw(str, x, y, size, bold, color) {
      const t = sanitise(str).replace(/\n/g, " ");
      if (!t) return;
      this.page.drawText(t, { x, y, size, font: bold ? this.f.bold : this.f.reg, color: color || this.ink });
    }
    // Wrapped paragraph; returns nothing. opts: size, bold, color, indent, after
    para(text, opts) {
      const o = opts || {};
      const size = o.size || 10, lh = size * 1.3;
      const font = o.bold ? this.f.bold : this.f.reg;
      const lines = wrapText(text, font, size, this.width - (o.indent || 0));
      for (const ln of lines) {
        this.ensure(lh);
        this.y -= lh;
        this.draw(ln, this.margin + (o.indent || 0), this.y + size * 0.25, size, o.bold, o.color);
      }
      this.y -= o.after == null ? 3 : o.after;
    }
    heading(text, size) {
      const sz = size || 14;
      this.ensure(sz * 2.2);
      this.gap(sz * 0.5);
      this.para(text, { size: sz, bold: true, after: 4 });
    }
    // label: value on one block (value wraps under itself)
    kv(label, value) {
      const v = String(value == null ? "" : value).trim();
      if (!v) return;
      const size = 9.5, lh = size * 1.3, labelW = 118;
      const lines = wrapText(v, this.f.reg, size, this.width - labelW);
      this.ensure(lh * Math.min(lines.length, 2));
      this.y -= lh;
      this.draw(label, this.margin, this.y + 2.4, size, true, this.soft);
      lines.forEach((ln, i) => {
        if (i > 0) { this.ensure(lh); this.y -= lh; }
        this.draw(ln, this.margin + labelW, this.y + 2.4, size, false);
      });
      this.y -= 2;
    }
    rule() { this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.margin + this.width, y: this.y }, thickness: 0.6, color: this.line }); this.y -= 6; }

    // Table with a repeating header row. widths: relative. aligns: "l" | "r" per column.
    table(headLabels, bodyRows, widthsRel, aligns, opts) {
      const o = opts || {};
      const size = o.size || 8, lh = size * 1.25, padX = 3, padY = 3;
      const total = widthsRel.reduce((a, b) => a + b, 0);
      const cols = widthsRel.map((w) => (w / total) * this.width);
      const xs = []; let x = this.margin; cols.forEach((w) => { xs.push(x); x += w; });
      const cellLines = (row, font) => row.map((t, i) => wrapText(t, font, size, cols[i] - padX * 2).slice(0, 8));
      const drawRow = (row, isHead) => {
        const font = isHead ? this.f.bold : this.f.reg;
        const lines = cellLines(row, font);
        const h = Math.max(...lines.map((l) => l.length), 1) * lh + padY * 2;
        if (this.y - h < this.margin + this.footerSpace) {
          this.newPage();
          if (!isHead) drawRow(headLabels, true);
        }
        const top = this.y;
        if (isHead) this.page.drawRectangle({ x: this.margin, y: top - h, width: this.width, height: h, color: this.tint });
        lines.forEach((ls, i) => ls.forEach((ln, j) => {
          const tw = font.widthOfTextAtSize(ln, size);
          const tx = aligns && aligns[i] === "r" ? xs[i] + cols[i] - padX - tw : xs[i] + padX;
          this.page.drawText(ln, { x: tx, y: top - padY - size - j * lh + 1.5, size, font, color: this.ink });
        }));
        this.page.drawLine({ start: { x: this.margin, y: top - h }, end: { x: this.margin + this.width, y: top - h }, thickness: 0.4, color: this.line });
        this.y = top - h;
      };
      this.ensure(60);
      drawRow(headLabels, true);
      if (!bodyRows.length && o.empty) this.para(o.empty, { size: 9, color: this.soft, indent: 3 });
      bodyRows.forEach((r) => drawRow(r, false));
      this.gap(8);
    }
  }

  const wait = () => new Promise((r) => setTimeout(r, 0));

  // data: export-model.normalise() result. opts:
  //   D (window.DISCLAIMER), fetchSds(sdsId) -> Uint8Array | null, onProgress(label, done, total),
  //   layout (manifest layout), appName
  async function buildBundle(PDFLib, model, opts) {
    const { M, ML } = libs();
    const o = opts || {};
    const D = o.D;
    const L = o.layout || ML.LAYOUT;
    const doc = await PDFLib.PDFDocument.create();
    doc.setTitle("SDS EZY take-away register");
    doc.setProducer("SDS EZY");
    const fonts = { reg: await doc.embedFont(PDFLib.StandardFonts.Helvetica), bold: await doc.embedFont(PDFLib.StandardFonts.HelveticaBold) };
    const w = new Writer(PDFLib, doc, fonts);
    const progress = o.onProgress || (() => {});
    const notes = { missing: [], skipped: [] };
    const company = model.company.company_name;
    const prepared = M.fmtDate(model.generated_at);

    // Pages that belong to the document's own text (not copied SDS pages) are tracked so footers differ.
    const generated = new Set();
    w.onNewPage = (p) => generated.add(p);

    // ---- cover + disclaimer
    w.newPage(A4);
    w.gap(60);
    w.para("SDS EZY", { size: 12, bold: true, color: w.soft });
    w.para("Chemical register, hazardous chemicals manifest and risk assessments", { size: 22, bold: true, after: 10 });
    if (company) w.para(company, { size: 14 });
    ML.headerFacts(model.company, prepared, L).filter((f) => f.label !== "Business").forEach((f) => w.kv(f.label, f.value));
    w.gap(14);
    w.heading("Important", 13);
    (D.points || [D.full]).forEach((p) => w.para(p, { size: 10.5, indent: 8, after: 6 }));
    w.gap(10);
    const haz = model.chemicals.filter((c) => c.decision === "hazardous").length;
    w.heading("In this file", 12);
    w.para(model.chemicals.length + " chemicals (" + haz + " hazardous). The register comes first, then the hazardous chemicals manifest, then each chemical's risk assessment followed by its safety data sheet (SDS). " +
      "An SDS used by more than one product is included once, after the first assessment that uses it.", { size: 10 });

    // ---- register (landscape)
    w.newPage(A4L);
    w.heading("Chemical register", 15);
    w.table(
      ["Product", "Supplier", "Decision", "Risk level", "Class", "SDS issued", "Review due", "Where stored"],
      model.chemicals.map((c) => [c.product_name, c.supplier, M.DECISION_LABEL[c.decision] || "Not decided", M.RISK_LABEL[c.risk_level] || "", c.dg_class, M.fmtDate(c.sds_issue_date), M.fmtDate(c.review_due), M.locationText(c)].map((v) => (v == null ? "" : String(v)))),
      [18, 13, 8, 13, 5, 8, 8, 27], null, { empty: "The register is empty." }
    );

    // ---- manifest (landscape)
    const mrows = ML.rowsFromExport({ chemicals: model.chemicals, locations: model.locations });
    w.newPage(A4L);
    w.heading(L.title, 15);
    ML.headerFacts(model.company, prepared, L).forEach((f) => w.kv(f.label, f.value));
    w.gap(6);
    const mm = ML.tableMatrix(mrows, L);
    w.table(mm.head, mm.body, L.columns.map((c) => c.width), L.columns.map((c) => (c.num ? "r" : "l")), { empty: L.emptyText });
    w.heading(L.totals.title, 12);
    const tm = ML.totalsMatrix(ML.computeTotals(mrows), L);
    w.table(tm.head, tm.body, L.totals.columns.map((c) => c.width), L.totals.columns.map((c) => (c.num ? "r" : "l")), { empty: "Nothing to total." });

    // ---- assessments, each followed by its SDS
    const sdsFirst = M.planSds(model.chemicals);
    const sdsStart = new Map(); // sds_id -> first page number of the included SDS
    const list = model.chemicals;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (o.cancelled && o.cancelled()) throw new Error("cancelled");
      progress("Adding " + (c.product_name || "chemical"), i + 1, list.length);
      await wait();
      w.newPage(A4);
      assessmentPage(w, M, c, sdsStart, sdsFirst);
      if (c.sds_id && sdsFirst.get(c.sds_id) === c.id && o.fetchSds) {
        let bytes = null;
        try { bytes = await o.fetchSds(c.sds_id); } catch (e) { bytes = null; }
        if (bytes) {
          try {
            const src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            const pages = await doc.copyPages(src, src.getPageIndices());
            sdsStart.set(c.sds_id, doc.getPageCount() + 1);
            // note on the assessment page where its SDS starts
            pages.forEach((p) => doc.addPage(p));
            c._sdsPages = pages.length;
          } catch (e) {
            notes.skipped.push(c.product_name + " (the PDF could not be read)");
          }
        } else notes.missing.push(c.product_name);
      }
    }

    // ---- footers + page numbers on every page
    const total = doc.getPageCount();
    const pages = doc.getPages();
    const footFont = fonts.reg;
    pages.forEach((p, idx) => {
      const { width } = p.getSize();
      if (p.getRotation().angle !== 0) return;
      const label = "Page " + (idx + 1) + " of " + total;
      const lw = footFont.widthOfTextAtSize(label, 7.5);
      if (generated.has(p)) {
        const short = sanitise(D.short);
        const maxW = width - 80 - lw - 12;
        const line = wrapText(short, footFont, 7, maxW)[0] || "";
        p.drawText(line + (line.length < short.length ? "..." : ""), { x: 40, y: 18, size: 7, font: footFont, color: PDFLib.rgb(0.35, 0.37, 0.34) });
        p.drawText(label, { x: width - 40 - lw, y: 18, size: 7.5, font: footFont, color: PDFLib.rgb(0.35, 0.37, 0.34) });
      } else {
        p.drawText(label, { x: width - 20 - lw, y: 6, size: 7, font: footFont, color: PDFLib.rgb(0.35, 0.37, 0.34) });
        p.drawText("SDS EZY take-away copy of the supplier's SDS", { x: 20, y: 6, size: 7, font: footFont, color: PDFLib.rgb(0.35, 0.37, 0.34) });
      }
    });

    const bytes = await doc.save();
    return { bytes, pageCount: total, notes };
  }

  function assessmentPage(w, M, c, sdsStart, sdsFirst) {
    const a = c.assessment;
    w.heading(c.product_name || "Chemical", 16);
    w.para("Hazard risk assessment", { size: 10, color: w.soft, after: 6 });
    w.kv("Supplier", c.supplier);
    w.kv("Decision", (M.DECISION_LABEL[c.decision] || "Not decided") + (c.decision_note ? " - " + c.decision_note : ""));
    w.kv("Risk level", M.RISK_LABEL[(a && a.risk_level) || c.risk_level] || "");
    w.kv("Signal word", c.signal_word);
    w.kv("Hazard pictograms", c.pictogramList.map((p) => M.PICTOGRAM_LABEL[p] || p).join(", "));
    w.kv("Where stored", M.locationText(c));
    w.kv("SDS issued", [c.sds_issue_date ? M.fmtDate(c.sds_issue_date) : (c.sds_id ? "Date not recorded" : ""), c.review_due ? "review due " + M.fmtDate(c.review_due) : ""].filter(Boolean).join(", "));
    w.kv("Dangerous goods", [c.dg_class ? "Class " + c.dg_class + (c.subsidiary_class ? " (" + c.subsidiary_class + ")" : "") : "", c.un_number ? "UN " + String(c.un_number).replace(/^UN\s*/i, "") : "", c.packing_group ? "PG " + c.packing_group : "", c.hazchem_code ? "Hazchem " + c.hazchem_code : ""].filter(Boolean).join(", "));
    w.kv("Proper shipping name", c.proper_shipping_name);
    w.kv("Hazard statements", c.h_statements);
    w.rule();
    if (!a) {
      w.para("No assessment has been prepared for this chemical yet.", { size: 10, color: w.soft });
    } else {
      w.kv("Assessed", M.fmtDate(a.assessed_date) + (a.assessed_by ? " by " + a.assessed_by : ""));
      w.kv("Physical form", a.form);
      w.kv("How it is used", a.use_description || c.use_description);
      w.kv("Ways it can get in", [a.route_inhalation ? "Breathing in" : "", a.route_ingestion ? "Swallowing" : "", a.route_absorption ? "Through the skin" : ""].filter(Boolean).join(", "));
      M.KINDS.forEach((k) => { if (a.grouped[k].length) w.kv(M.KIND_LABEL[k], a.grouped[k].join("; ")); });
      w.kv("Control notes", a.controls_notes);
      w.kv("PPE notes", a.ppe_notes);
      w.kv("If there is a fire", a.fire_response);
      w.kv("If there is a spill", a.spill_response);
      w.kv("Atmospheric monitoring", M.yesNo(a.monitoring_needed) + (a.monitoring_note ? ": " + a.monitoring_note : ""));
      w.kv("Health surveillance", M.yesNo(a.surveillance_needed) + (a.surveillance_note ? ": " + a.surveillance_note : ""));
      const flags = M.flaggedFields(a);
      if (flags.length) w.kv("Check these", flags.join(", ") + " (not found in the SDS text)");
    }
    w.rule();
    if (!c.sds_id) w.para("No safety data sheet is on file for this chemical.", { size: 9.5, color: w.soft });
    else if (sdsFirst.get(c.sds_id) === c.id) w.para("The supplier's safety data sheet follows this page.", { size: 9.5, color: w.soft });
    else {
      const first = sdsStart.get(c.sds_id);
      w.para(first ? "The safety data sheet for this product is included once, from page " + first + " (after the assessment for the first product that uses it)." :
        "The safety data sheet for this product is shared with another product and is included with that product's assessment.", { size: 9.5, color: w.soft });
    }
  }

  return { buildBundle, sanitise, wrapText, Writer };
});
