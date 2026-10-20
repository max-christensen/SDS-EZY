// Fakes for the offline tests: Cache Storage, localStorage and a routed fetch. Not a test file.
const keyOf = (r) => {
  const u = new URL(typeof r === 'string' ? r : r.url, 'http://localhost');
  return u.origin + u.pathname + u.search;
};

function toResponse(e) { return new Response(e.body, { status: e.status, headers: e.headers }); }

export class FakeCache {
  constructor() { this.map = new Map(); }
  async put(req, res) { this.map.set(keyOf(req), { status: res.status, headers: [...res.headers], body: Buffer.from(await res.arrayBuffer()) }); }
  async match(req) { const e = this.map.get(keyOf(req)); return e ? toResponse(e) : undefined; }
  async delete(req) { return this.map.delete(keyOf(req)); }
  async keys() { return [...this.map.keys()].map((k) => new Request(k)); }
  urls() { return [...this.map.keys()].map((k) => { const u = new URL(k); return u.pathname + u.search; }).sort(); }
}

export class FakeCaches {
  constructor() { this.stores = new Map(); }
  async open(name) { if (!this.stores.has(name)) this.stores.set(name, new FakeCache()); return this.stores.get(name); }
  async keys() { return [...this.stores.keys()]; }
  async delete(name) { return this.stores.delete(name); }
  async has(name) { return this.stores.has(name); }
  async match(req, opts = {}) {
    if (opts.cacheName) { const c = this.stores.get(opts.cacheName); return c ? c.match(req) : undefined; }
    for (const c of this.stores.values()) { const r = await c.match(req); if (r) return r; }
    return undefined;
  }
}

export class FakeStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
export const pdf = (n = 3000) => new Response(Buffer.alloc(n, 0x25), { status: 200, headers: { 'Content-Type': 'application/pdf' } });

// routes: {'/api/me': () => Response}. Anything unlisted is a 404. `fetch.down = true` makes every call throw.
export function makeFetch(routes) {
  const calls = [];
  const f = async (input, init = {}) => {
    const u = new URL(typeof input === 'string' ? input : input.url, 'http://localhost');
    const path = u.pathname + u.search;
    calls.push(path);
    if (f.down) throw new TypeError('Failed to fetch');
    if (init.signal && init.signal.aborted) { const e = new Error('aborted'); e.name = 'AbortError'; throw e; }
    const h = routes[path] || routes[u.pathname];
    if (!h) return new Response('{}', { status: 404 });
    return typeof h === 'function' ? h(path) : h;
  };
  f.calls = calls; f.down = false;
  return f;
}

// A small world: one place with three chemicals, two with an SDS.
export function world() {
  const place = { place: { id: 7, name: 'Hilux 01', place_type: 'vehicle' }, chemicals: [
    { link_id: 1, chemical_id: 11, product_name: 'Acetone', sds_id: 21 },
    { link_id: 2, chemical_id: 12, product_name: 'Bleach', sds_id: 22 },
    { link_id: 3, chemical_id: 13, product_name: 'Water', sds_id: null }
  ], result: {} };
  const routes = {
    '/api/me': () => json({ id: 5, name: 'Sam', role: 'user' }),
    '/api/places/7': () => json(place),
    '/api/places': () => json([{ id: 7 }, { id: 8 }]),
    '/api/places?archived=0': () => json([{ id: 7 }, { id: 8 }]),
    '/api/places/8': () => json({ place: { id: 8, name: 'Depot' }, chemicals: [{ chemical_id: 12, product_name: 'Bleach', sds_id: 22 }], result: {} }),
    '/api/settings': () => json({ company: 'Acme' }),
    '/api/public-settings': () => json({ company: 'Acme' }),
    '/api/options': () => json({ units: [] }),
    '/api/chemicals/11': () => json({ id: 11 }), '/api/chemicals/12': () => json({ id: 12 }), '/api/chemicals/13': () => json({ id: 13 }),
    '/api/sds/21': () => json({ id: 21 }), '/api/sds/22': () => json({ id: 22 }),
    '/api/sds/21/file': () => pdf(3000), '/api/sds/22/file': () => pdf(5000)
  };
  return { place, routes };
}
