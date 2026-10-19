/* The eight GHS hazard pictograms as inline SVG: red-bordered diamond, black symbol.
   They are SVG (not background images) so they print without any browser setting. */
(function () {
  const App = window.App;
  const LABELS = {
    toxic: 'Toxic (acute toxicity)',
    health: 'Health hazard',
    flame: 'Flammable',
    exclamation: 'Harmful or irritant',
    oxidising: 'Oxidising',
    gas: 'Gas under pressure',
    environment: 'Hazardous to the environment',
    corrosive: 'Corrosive',
  };
  // Each symbol is drawn in a 48 x 48 box and placed in the middle of the diamond.
  const GLYPHS = {
    exclamation: '<path d="M17 2h14l-3 30h-8z"/><circle cx="24" cy="41" r="5"/>',
    flame: '<path d="M24 1c2 9 13 15 13 29 0 9-6 17-13 17S11 39 11 30c0-6 3-10 6-13 0 3 1 5 3 6-1-8 1-17 4-22z"/><path fill="#fff" d="M24 46c-5 0-8-3-8-7 0-4 3-7 5-9 1 2 2 3 4 3 0-3 1-6 2-8 3 4 5 8 5 13 0 4-3 8-8 8z"/>',
    gas: '<rect x="20" y="1" width="8" height="5" rx="1"/><rect x="21.5" y="5" width="5" height="9"/><rect x="12" y="13" width="24" height="34" rx="11"/><path fill="none" stroke="#fff" stroke-width="2" d="M19 24v14"/>',
    corrosive: '<g transform="rotate(25 13 8)"><rect x="6" y="1" width="13" height="10" rx="1.5"/></g><g transform="rotate(-25 36 8)"><rect x="29" y="1" width="13" height="10" rx="1.5"/></g><path d="M9 17c1 3 0 5-1 6-1-1-2-3 1-6zM39 17c1 3 0 5-1 6-1-1-2-3 1-6zM24 17c1 3 0 5-1 6-1-1-2-3 1-6z"/><rect x="1" y="35" width="18" height="5"/><rect x="1" y="41" width="18" height="5"/><path d="M26 47V33c0-2 2-2 2 0v-3c0-2 2-2 2 0v-1c0-2 2-2 2 0v1c0-2 2-2 2 0v13c0 3-1 4-2 4z"/>',
    oxidising: '<path d="M24 1c2 5 9 8 9 14 0 4-4 7-9 7s-9-3-9-7c0-3 2-5 3-6 1 2 2 3 3 3-1-4 0-8 3-11z"/><circle cx="24" cy="34" r="10.5" fill="none" stroke="#000" stroke-width="5"/>',
    toxic: '<path stroke="#000" stroke-width="4.5" stroke-linecap="round" d="M5 33L43 46M43 33L5 46"/><circle cx="5" cy="33" r="2.6"/><circle cx="43" cy="33" r="2.6"/><circle cx="5" cy="46" r="2.6"/><circle cx="43" cy="46" r="2.6"/><path d="M24 1c9 0 15 6 15 14 0 5-2 8-5 10v8H14v-8c-3-2-5-5-5-10C9 7 15 1 24 1z"/><circle cx="17.5" cy="16" r="4.2" fill="#fff"/><circle cx="30.5" cy="16" r="4.2" fill="#fff"/><path fill="#fff" d="M24 21l-3 6h6z"/><path stroke="#fff" stroke-width="1.6" d="M19.5 29v6M24 29v6M28.5 29v6"/>',
    health: '<circle cx="24" cy="7" r="6"/><path d="M8 47V25c0-5 4-9 9-9h14c5 0 9 4 9 9v22z"/><path fill="#fff" d="M24 21l2.4 5.6 6-1-4 4.6 4 4.6-6-1L24 40l-2.4-6.6-6 1 4-4.6-4-4.6 6 1z"/>',
    environment: '<path fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" d="M9 38V16M9 28L2 21M9 23l7-8M9 33l6-5"/><ellipse cx="33" cy="25" rx="9" ry="5.5"/><path d="M41 25l7-6v12z"/><circle cx="29" cy="23.5" r="1.5" fill="#fff"/><path fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" d="M1 44q3-3 6 0t6 0 6 0 6 0 6 0 6 0 6 0 5 0"/>',
  };
  const CODES = Object.keys(GLYPHS);

  function parse(list) {
    if (!list) return [];
    const arr = Array.isArray(list) ? list : String(list).split(',');
    return arr.map((s) => String(s).trim().toLowerCase()).filter((c) => GLYPHS[c]);
  }

  App.PICTOGRAM_CODES = CODES;
  App.pictogramLabel = (code) => LABELS[code] || code;
  App.pictogramSvg = function (code, size) {
    code = String(code || '').trim().toLowerCase();
    if (!GLYPHS[code]) return '';
    size = size || 48;
    const label = LABELS[code];
    return `<svg class="picto" role="img" aria-label="${label}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><title>${label}</title>`
      + '<polygon points="50,4 96,50 50,96 4,50" fill="#fff" stroke="#E0001B" stroke-width="8" stroke-linejoin="round"/>'
      + `<g transform="translate(26 26)" fill="#000">${GLYPHS[code]}</g></svg>`;
  };
  App.pictogramRow = function (list, size) {
    const codes = parse(list);
    if (!codes.length) return '';
    return `<span class="picto-row">${codes.map((c) => App.pictogramSvg(c, size || 40)).join('')}</span>`;
  };
  // "Flammable, Corrosive" as plain text, for tables and CSV.
  App.pictogramNames = (list) => parse(list).map((c) => LABELS[c]).join(', ');
})();
