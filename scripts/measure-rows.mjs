// Measures D1 rows read per request against a running LOCAL dev server started with DEBUG_ROWS=1:
//   npx wrangler dev --local --port 8801 --persist-to .wrangler/agent-server --var DEBUG_ROWS:1
//   node scripts/measure-rows.mjs [--base http://127.0.0.1:8801] [--sizes 60,600]
// It tops the register up with synthetic "Measure NNNN" products (each with an SDS record and storage location, and an
// assessment on every second one) until the register holds each size, and prints the X-Rows-Read header for the key requests.
// Admin login comes from MEASURE_EMAIL / MEASURE_PASSWORD (default: the test admin the server tests create).
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://127.0.0.1:8801");
const SIZES = arg("sizes", "60,600").split(",").map(Number);
const EMAIL = process.env.MEASURE_EMAIL || "admin@test.example";
const PASSWORD = process.env.MEASURE_PASSWORD || "correct-horse-1";
let cookie = "";

async function call(method, path, body) {
  const headers = { ...(cookie ? { Cookie: cookie } : {}) };
  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  const rows = res.headers.get("x-rows-read");
  const data = (res.headers.get("content-type") || "").includes("json") ? await res.json() : null;
  return { status: res.status, data, rows: rows === null ? null : Number(rows) };
}

const login = await call("POST", "/api/login", { email: EMAIL, password: PASSWORD });
if (login.status !== 200) { console.error("Login failed:", login.status, login.data); process.exit(1); }
if (login.rows === null) { console.error("No X-Rows-Read header: start the server with --var DEBUG_ROWS:1"); process.exit(1); }
console.log(`login                     rows_read=${login.rows}`);
// A second login, to show the steady-state number (the first can include one-off settings writes).
const login2 = await call("POST", "/api/login", { email: EMAIL, password: PASSWORD });
console.log(`login (again)             rows_read=${login2.rows}`);

function pdfForm(i, data) {
  const fd = new FormData();
  fd.append("file", new Blob([`%PDF-1.4\n% measure ${i} ${Math.random()}\n%%EOF\n`], { type: "application/pdf" }), `m${i}.pdf`);
  fd.append("data", JSON.stringify(data));
  return fd;
}

async function topUp(target) {
  const all = (await call("GET", "/api/chemicals?limit=2000")).data.items.filter(c => c.product_name.startsWith("Measure item"));
  let n = all.length;
  const classes = ["3", "8", "2.1", "6.1", "", "9"];
  while (n < target) {
    n++;
    const year = 2019 + (n % 8);
    const hasSds = n % 10 !== 0;
    let sdsId;
    if (hasSds) {
      const s = await call("POST", "/api/sds", pdfForm(n, {
        title: `Measure item ${n}`, supplier: `Supplier ${n % 17}`, issue_date: `${year}-0${1 + (n % 9)}-15`,
        dg_class: classes[n % classes.length] || undefined, pictograms: "flame,exclamation", signal_word: "Warning", cas_numbers: "67-64-1",
      }));
      sdsId = s.data.id;
    }
    const c = await call("POST", "/api/chemicals", {
      product_name: `Measure item ${n}`, supplier: `Supplier ${n % 17}`, decision: n % 7 === 0 ? null : (n % 2 ? "hazardous" : "not_hazardous"),
      synonyms: "synonym alpha, synonym beta", product_codes: `P-${n}`, sds_id: sdsId,
    });
    await call("POST", `/api/chemicals/${c.data.id}/locations`, { location: `Store ${n % 9}`, quantity: 5 + (n % 20), unit: n % 3 ? "L" : "kg" });
    if (n % 2 === 0) await call("POST", `/api/chemicals/${c.data.id}/assessments`, { risk_level: "significant_controlled", control_option_ids: [1, 6] });
  }
}

const results = [];
for (const size of SIZES) {
  await topUp(size);
  const total = (await call("GET", "/api/chemicals?limit=1")).data.total;
  const list = await call("GET", "/api/chemicals");
  const review = await call("GET", "/api/review");
  const hazardous = await call("GET", "/api/chemicals?filter=hazardous");
  const sample = list.data.items.find(c => c.sds_id && c.product_name.startsWith("Measure item"));
  const one = await call("GET", `/api/chemicals/${sample.id}`);
  const search = await call("GET", "/api/chemicals?q=measure%20item%2012");
  const search2 = await call("GET", "/api/chemicals?q=acetone");
  const manifest = await call("GET", "/api/manifest");
  const exp = await call("GET", "/api/export/all");
  console.log(`\n--- register holds ${total} chemicals (${size} synthetic target) ---`);
  const row = (k, r) => console.log(`${k.padEnd(26)}rows_read=${r.rows}  (status ${r.status})`);
  row("GET /api/review", review);
  row("GET /api/chemicals", list);
  row("GET /api/chemicals hazardous", hazardous);
  row("GET /api/chemicals/:id", one);
  row("search ?q= (few hits)", search);
  row("search ?q= (many hits)", search2);
  row("GET /api/manifest", manifest);
  row("GET /api/export/all", exp);
  results.push({ size, total });
}
