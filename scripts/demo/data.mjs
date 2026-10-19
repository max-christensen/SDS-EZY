// Demo data: fictional SDS documents and the chemicals that use them.
// "ago" is whole months before the --today date the SDS was issued (review is due 5 years after issue).
//   overdue   : ago > 60
//   due soon  : ago 58..59 (review due within 90 days)
// dg = [un, class, subsidiary, packing group, hazchem, proper shipping name]
// Real CAS numbers are used only where the substance genuinely matches (ethanol, acetone, toluene, ...).


export const SDS = [
  // ---- flammable liquids ---------------------------------------------------------------
  { k: 'acetone', t: 'Marlow Acetone Solvent', s: 'marlow', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation'], H: ['H225', 'H319', 'H336'], tags: ['flam'],
    dg: ['1090', '3', '', 'II', '2YE', 'ACETONE'], cas: ['67-64-1'], comp: [['Acetone', '67-64-1', '>99']], form: 'liquid', ago: 14, rev: '3.1', fp: '-20 deg C', ph: 'Colourless volatile liquid, sweet odour' },
  { k: 'metho_v1', t: 'Marlow Methylated Spirits', s: 'marlow', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation'], H: ['H225', 'H319'], tags: ['flam'],
    dg: ['1170', '3', '', 'II', '2YE', 'ETHANOL SOLUTION'], cas: ['64-17-5'], comp: [['Ethanol', '64-17-5', '90-95'], ['Denaturants', '', '<5']], form: 'liquid', ago: 55, rev: '1.0', fp: '13 deg C', ph: 'Clear liquid, purple dye', current: false, doc: 'metho' },
  { k: 'metho', t: 'Marlow Methylated Spirits', s: 'marlow', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation'], H: ['H225', 'H319', 'H336'], tags: ['flam'],
    dg: ['1170', '3', '', 'II', '2YE', 'ETHANOL SOLUTION'], cas: ['64-17-5'], comp: [['Ethanol', '64-17-5', '90-95'], ['Denaturants', '', '<5']], form: 'liquid', ago: 20, rev: '2.0 (replaces 1.0)', fp: '13 deg C', ph: 'Clear liquid, purple dye', doc: 'metho', version: 2, replaces: 'metho_v1' },
  { k: 'turps', t: 'Marlow Mineral Turpentine', s: 'marlow', hz: 1, sig: 'Warning', pic: ['health', 'exclamation', 'environment'], H: ['H226', 'H304', 'H336', 'H411'], tags: ['flam', 'env'],
    dg: ['1268', '3', '', 'III', '3Y', 'PETROLEUM DISTILLATES, N.O.S.'], cas: ['8052-41-3'], comp: [['White spirit (Stoddard solvent)', '8052-41-3', '>95']], form: 'liquid', ago: 33, rev: '4.2', fp: '40 deg C', ph: 'Clear liquid, hydrocarbon odour' },
  { k: 'thinners', t: 'Marlow Lacquer Thinners', s: 'marlow', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'exclamation'], H: ['H225', 'H304', 'H315', 'H319', 'H336', 'H373'], tags: ['flam'], ps: 'S5',
    dg: ['1263', '3', '', 'II', '3YE', 'PAINT RELATED MATERIAL'], cas: ['108-88-3', '67-64-1', '141-78-6'], comp: [['Toluene', '108-88-3', '30-50'], ['Acetone', '67-64-1', '20-30'], ['Ethyl acetate', '141-78-6', '10-20']], form: 'liquid', ago: 62, rev: '2.4', fp: '-18 deg C', ph: 'Clear volatile liquid, solvent odour' },
  { k: 'stain', t: 'Kestrel Oil Stain (Walnut, Jarrah)', s: 'kestrel', hz: 1, sig: 'Warning', pic: ['flame', 'health', 'exclamation'], H: ['H226', 'H304', 'H336', 'H412'], tags: ['flam'],
    dg: ['1263', '3', '', 'III', '3Y', 'PAINT RELATED MATERIAL'], cas: ['8052-41-3'], comp: [['White spirit', '8052-41-3', '40-60'], ['Alkyd resin', '', '20-30'], ['Pigments', '', '<10']], form: 'liquid', ago: 9, rev: '5.0', fp: '40 deg C', ph: 'Coloured liquid' },
  { k: 'varnish', t: 'Kestrel Polyurethane Varnish Gloss (solvent-based)', s: 'kestrel', hz: 1, sig: 'Warning', pic: ['flame', 'health', 'exclamation'], H: ['H226', 'H304', 'H336', 'H412'], tags: ['flam'],
    dg: ['1263', '3', '', 'III', '3Y', 'PAINT RELATED MATERIAL'], cas: ['8052-41-3'], comp: [['White spirit', '8052-41-3', '40-60'], ['Urethane alkyd resin', '', '30-50']], form: 'liquid', ago: 28, rev: '3.3', fp: '41 deg C', ph: 'Pale amber liquid' },
  { k: 'contact', t: 'Stickfast Contact Adhesive 500', s: 'stick', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'exclamation'], H: ['H225', 'H315', 'H336', 'H373'], tags: ['flam'],
    dg: ['1133', '3', '', 'II', '2YE', 'ADHESIVES'], cas: ['67-64-1', '110-54-3'], comp: [['Acetone', '67-64-1', '30-50'], ['n-Hexane', '110-54-3', '10-20'], ['Synthetic rubber', '9010-98-4', '20-30']], form: 'liquid', ago: 58, rev: '6.1', fp: '-20 deg C', ph: 'Tan viscous liquid' },
  { k: 'grip', t: 'Stickfast Grip Max Construction Adhesive (cartridge and pail)', s: 'stick', hz: 1, sig: 'Warning', pic: ['health', 'exclamation'], H: ['H226', 'H304', 'H315', 'H336'], tags: ['flam'],
    dg: ['1133', '3', '', 'III', '3Y', 'ADHESIVES'], cas: ['64742-49-0'], comp: [['Hydrotreated light naphtha', '64742-49-0', '10-20'], ['Calcium carbonate', '471-34-1', '30-50'], ['Synthetic polymer', '', '20-30']], form: 'paste', ago: 21, rev: '2.2', fp: '38 deg C', ph: 'Beige paste' },
  { k: 'petrol', t: 'Harbourlight Unleaded Petrol', s: 'harbour', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'environment'], H: ['H225', 'H304', 'H315', 'H336', 'H411'], tags: ['flam', 'env'],
    dg: ['1203', '3', '', 'II', '3YE', 'PETROL'], cas: ['86290-81-5'], comp: [['Gasoline', '86290-81-5', '100']], form: 'liquid', ago: 40, rev: '7.0', fp: '-40 deg C', ph: 'Clear liquid, characteristic odour' },
  { k: 'diesel', t: 'Harbourlight Diesel Fuel', s: 'harbour', hz: 1, sig: 'Warning', pic: ['health', 'exclamation', 'environment'], H: ['H226', 'H304', 'H315', 'H332', 'H411'], tags: ['flam', 'env'],
    dg: ['1202', '3', '', 'III', '3Z', 'DIESEL FUEL'], cas: ['68334-30-5'], comp: [['Fuels, diesel', '68334-30-5', '100']], form: 'liquid', ago: 36, rev: '5.1', fp: '>62 deg C', ph: 'Pale liquid' },
  { k: 'twostroke', t: 'Harbourlight Two-Stroke Fuel Mix 50:1', s: 'harbour', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'environment'], H: ['H225', 'H304', 'H315', 'H336', 'H411'], tags: ['flam', 'env'],
    dg: ['1203', '3', '', 'II', '3YE', 'PETROL'], cas: ['86290-81-5'], comp: [['Gasoline', '86290-81-5', '95-99'], ['Two-stroke oil additive', '', '1-5']], form: 'liquid', ago: 5, rev: '1.0', fp: '-40 deg C', ph: 'Pink-tinted liquid' },
  { k: 'brushclean', t: 'Fernhill Brush Cleaner and Thinner', s: 'fern', hz: 1, sig: 'Warning', pic: ['health', 'exclamation'], H: ['H226', 'H304', 'H336'], tags: ['flam'],
    dg: ['1993', '3', '', 'III', '3Y', 'FLAMMABLE LIQUID, N.O.S. (hydrocarbon solvent)'], cas: ['8052-41-3'], comp: [['White spirit', '8052-41-3', '>90']], form: 'liquid', ago: 46, rev: '1.4', fp: '42 deg C', ph: 'Clear liquid' },
  // ---- aerosols ------------------------------------------------------------------------
  { k: 'spayenamel', t: 'Kestrel Spray Enamel Aerosol Gloss Black', s: 'kestrel', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation', 'gas'], H: ['H222', 'H229', 'H315', 'H319', 'H336'], tags: ['aer'],
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['115-10-6', '67-64-1', '74-98-6'], comp: [['Dimethyl ether', '115-10-6', '20-30'], ['Acetone', '67-64-1', '10-20'], ['Propane', '74-98-6', '10-20']], form: 'aerosol', ago: 11, rev: '2.0', fp: '<0 deg C (propellant)', ph: 'Aerosol, 400 mL' },
  { k: 'penetrant', t: 'Ironwood Penetrating Spray', s: 'iron', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation', 'gas'], H: ['H222', 'H229', 'H315', 'H336', 'H411'], tags: ['aer', 'env'],
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['64742-48-9', '74-98-6', '106-97-8'], comp: [['Hydrotreated heavy naphtha', '64742-48-9', '40-60'], ['Propane', '74-98-6', '10-20'], ['Butane', '106-97-8', '10-20']], form: 'aerosol', ago: 30, rev: '3.0', fp: '<0 deg C (propellant)', ph: 'Aerosol, 300 g' },
  { k: 'silicone', t: 'Ironwood Silicone Lubricant Spray', s: 'iron', hz: 1, sig: 'Danger', pic: ['flame', 'gas'], H: ['H222', 'H229', 'H336'], tags: ['aer'],
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['63148-62-9', '74-98-6', '106-97-8'], comp: [['Polydimethylsiloxane', '63148-62-9', '10-20'], ['Propane', '74-98-6', '20-30'], ['Butane', '106-97-8', '20-30']], form: 'aerosol', ago: 25, rev: '1.2', fp: '<0 deg C (propellant)', ph: 'Aerosol, 300 g' },
  { k: 'brakeclean', t: 'Wattlebird Brake and Parts Cleaner Aerosol', s: 'wattle', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'exclamation', 'gas'], H: ['H222', 'H229', 'H315', 'H319', 'H336', 'H373'], tags: ['aer', 'irrit'], ps: 'S5',
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['67-64-1', '110-54-3', '74-98-6'], comp: [['Acetone', '67-64-1', '40-60'], ['n-Hexane', '110-54-3', '10-20'], ['Propane', '74-98-6', '10-20']], form: 'aerosol', ago: 66, rev: '4.0', fp: '<0 deg C (propellant)', ph: 'Aerosol, 500 mL' },
  { k: 'sprayglue', t: 'Stickfast Spray Adhesive Aerosol', s: 'stick', hz: 1, sig: 'Danger', pic: ['flame', 'exclamation', 'gas'], H: ['H222', 'H229', 'H315', 'H319', 'H336'], tags: ['aer'],
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['115-10-6', '67-64-1'], comp: [['Dimethyl ether', '115-10-6', '30-40'], ['Acetone', '67-64-1', '20-30'], ['Synthetic rubber', '9010-98-4', '10-20']], form: 'aerosol', ago: 7, rev: '1.1', fp: '<0 deg C (propellant)', ph: 'Aerosol, 400 g' },
  { k: 'foam', t: 'Wattlebird Expanding Foam Gap Filler', s: 'wattle', hz: 1, sig: 'Danger', pic: ['flame', 'health', 'exclamation', 'gas'], H: ['H222', 'H229', 'H315', 'H317', 'H319', 'H332', 'H334', 'H335', 'H373'], tags: ['aer', 'sens'],
    dg: ['1950', '2.1', '', '', '2YE', 'AEROSOLS, FLAMMABLE'], cas: ['101-68-8', '74-98-6', '115-10-6'], comp: [['Methylene diphenyl diisocyanate (MDI)', '101-68-8', '30-50'], ['Propane', '74-98-6', '5-15'], ['Dimethyl ether', '115-10-6', '5-15']], form: 'aerosol', ago: 12, rev: '3.0', fp: '<0 deg C (propellant)', ph: 'Aerosol, 750 mL' },
  // ---- gases ---------------------------------------------------------------------------
  { k: 'lpg', t: 'Quillon LPG (Liquefied Petroleum Gas) Cylinder 9 kg', s: 'quill', hz: 1, sig: 'Danger', pic: ['flame', 'gas'], H: ['H220', 'H280'], tags: ['gas'],
    dg: ['1075', '2.1', '', '', '2YE', 'PETROLEUM GASES, LIQUEFIED'], cas: ['68476-85-7'], comp: [['Petroleum gases, liquefied', '68476-85-7', '100']], form: 'gas', ago: 18, rev: '2.0', fp: '-104 deg C', ph: 'Colourless gas, stenched' },
  { k: 'acetylene', t: 'Quillon Acetylene (dissolved gas)', s: 'quill', hz: 1, sig: 'Danger', pic: ['flame', 'gas'], H: ['H220', 'H280'], tags: ['gas'],
    dg: ['1001', '2.1', '', '', '2SE', 'ACETYLENE, DISSOLVED'], cas: ['74-86-2'], comp: [['Acetylene', '74-86-2', '>98']], form: 'gas', ago: 22, rev: '3.1', fp: '-18 deg C', ph: 'Colourless gas' },
  { k: 'oxygen', t: 'Quillon Oxygen (compressed)', s: 'quill', hz: 1, sig: 'Danger', pic: ['oxidising', 'gas'], H: ['H270', 'H280'], tags: ['gas', 'ox'],
    dg: ['1072', '2.2', '5.1', '', '2WE', 'OXYGEN, COMPRESSED'], cas: ['7782-44-7'], comp: [['Oxygen', '7782-44-7', '>99.5']], form: 'gas', ago: 22, rev: '2.3', fp: 'Not applicable', ph: 'Colourless odourless gas' },
  { k: 'shield', t: 'Quillon Welding Shielding Gas (Argon / Carbon Dioxide)', s: 'quill', hz: 1, sig: 'Warning', pic: ['gas'], H: ['H280'], tags: ['gas'],
    dg: ['1956', '2.2', '', '', '2TE', 'COMPRESSED GAS, N.O.S. (argon, carbon dioxide)'], cas: ['7440-37-1', '124-38-9'], comp: [['Argon', '7440-37-1', '80-90'], ['Carbon dioxide', '124-38-9', '10-20']], form: 'gas', ago: 15, rev: '1.5', fp: 'Not applicable', ph: 'Colourless odourless gas' },
  // ---- corrosives / oxidisers ----------------------------------------------------------
  { k: 'hcl', t: 'Tidewater Hydrochloric Acid 32%', s: 'tide', hz: 1, sig: 'Danger', pic: ['corrosive', 'exclamation'], H: ['H290', 'H314', 'H335'], tags: ['corr'], ps: 'S6',
    dg: ['1789', '8', '', 'II', '2R', 'HYDROCHLORIC ACID'], cas: ['7647-01-0', '7732-18-5'], comp: [['Hydrogen chloride', '7647-01-0', '30-33'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 47, rev: '3.0', fp: 'Not applicable', ph: 'Colourless fuming liquid' },
  { k: 'caustic', t: 'Tidewater Caustic Soda Flakes', s: 'tide', hz: 1, sig: 'Danger', pic: ['corrosive'], H: ['H290', 'H314'], tags: ['corr'], ps: 'S6',
    dg: ['1823', '8', '', 'II', '2R', 'SODIUM HYDROXIDE, SOLID'], cas: ['1310-73-2'], comp: [['Sodium hydroxide', '1310-73-2', '>98']], form: 'solid', ago: 52, rev: '2.1', fp: 'Not applicable', ph: 'White flakes' },
  { k: 'bleach', t: 'Tidewater Liquid Chlorine 12.5%', s: 'tide', hz: 1, sig: 'Danger', pic: ['corrosive', 'environment'], H: ['H290', 'H314', 'H411'], tags: ['corr', 'env'], ps: 'S5',
    dg: ['1791', '8', '', 'II', '2X', 'HYPOCHLORITE SOLUTION'], cas: ['7681-52-9', '1310-73-2'], comp: [['Sodium hypochlorite', '7681-52-9', '10-15'], ['Sodium hydroxide', '1310-73-2', '<2']], form: 'liquid', ago: 13, rev: '2.0', fp: 'Not applicable', ph: 'Pale yellow liquid, chlorine odour' },
  { k: 'drain', t: 'Tidewater Drain Unblocker Gel', s: 'tide', hz: 1, sig: 'Danger', pic: ['corrosive'], H: ['H290', 'H314'], tags: ['corr'], ps: 'S6',
    dg: ['1760', '8', '', 'II', '2X', 'CORROSIVE LIQUID, N.O.S. (sodium hydroxide)'], cas: ['1310-73-2'], comp: [['Sodium hydroxide', '1310-73-2', '10-20']], form: 'liquid', ago: 59, agoD: 10, rev: '1.3', fp: 'Not applicable', ph: 'Viscous clear gel' },
  { k: 'battery', t: 'Wattlebird Battery Acid (Sulfuric Acid 35%)', s: 'wattle', hz: 1, sig: 'Danger', pic: ['corrosive'], H: ['H290', 'H314'], tags: ['corr'], ps: 'S6',
    dg: ['2796', '8', '', 'II', '2R', 'BATTERY FLUID, ACID'], cas: ['7664-93-9', '7732-18-5'], comp: [['Sulfuric acid', '7664-93-9', '30-40'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 75, rev: '2.0', fp: 'Not applicable', ph: 'Colourless liquid' },
  { k: 'peroxide', t: 'Tidewater Hydrogen Peroxide 35%', s: 'tide', hz: 1, sig: 'Danger', pic: ['oxidising', 'corrosive', 'exclamation'], H: ['H271', 'H302', 'H314', 'H332', 'H335'], tags: ['ox', 'corr'], ps: 'S6',
    dg: ['2014', '5.1', '8', 'II', '2P', 'HYDROGEN PEROXIDE, AQUEOUS SOLUTION'], cas: ['7722-84-1', '7732-18-5'], comp: [['Hydrogen peroxide', '7722-84-1', '34-36'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 26, rev: '1.1', fp: 'Not applicable', ph: 'Colourless liquid' },
  { k: 'epoxyA', t: 'Kestrel Two-Pack Epoxy Resin (Part A)', s: 'kestrel', hz: 1, sig: 'Warning', pic: ['exclamation', 'environment'], H: ['H315', 'H317', 'H319', 'H411'], tags: ['sens', 'env', 'irrit'],
    dg: ['3082', '9', '', 'III', '3Z', 'ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S. (epoxy resin)'], cas: ['25068-38-6'], comp: [['Bisphenol A epoxy resin', '25068-38-6', '60-80']], form: 'liquid', ago: 17, rev: '2.0', fp: '>200 deg C', ph: 'Clear viscous liquid' },
  { k: 'epoxyB', t: 'Kestrel Two-Pack Epoxy Hardener (Part B)', s: 'kestrel', hz: 1, sig: 'Danger', pic: ['corrosive', 'exclamation'], H: ['H302', 'H314', 'H317'], tags: ['corr', 'sens'], ps: 'S6',
    dg: ['2735', '8', '', 'II', '2X', 'AMINES, LIQUID, CORROSIVE, N.O.S. (triethylenetetramine)'], cas: ['112-24-3'], comp: [['Triethylenetetramine', '112-24-3', '20-40']], form: 'liquid', ago: 17, rev: '2.0', fp: '>100 deg C', ph: 'Pale yellow liquid, amine odour' },
  // ---- hazardous, not dangerous goods ----------------------------------------------------
  { k: 'cement', t: 'Bluegum General Purpose Cement', s: 'blue', hz: 1, sig: 'Danger', pic: ['corrosive', 'exclamation'], H: ['H315', 'H317', 'H318', 'H335'], tags: ['dust'],
    dg: null, cas: ['65997-15-1', '14808-60-7'], comp: [['Portland cement', '65997-15-1', '90-100'], ['Crystalline silica (quartz)', '14808-60-7', '<1']], form: 'powder', ago: 35, rev: '4.0', fp: 'Not applicable', ph: 'Grey powder' },
  { k: 'plaster', t: 'Brightboard Plaster and Jointing Products (ten products)', s: 'bright', hz: 1, sig: 'Warning', pic: ['exclamation'], H: ['H319', 'H335'], tags: ['dust'],
    dg: null, cas: ['26499-65-0', '1317-65-3', '14808-60-7', '9004-65-3'], comp: [['Calcium sulfate hemihydrate', '26499-65-0', '40-80'], ['Limestone', '1317-65-3', '10-30'], ['Crystalline silica (quartz)', '14808-60-7', '<1'], ['Cellulose ether', '9004-65-3', '<1']], form: 'powder', ago: 19, rev: '3.0', fp: 'Not applicable', ph: 'White to cream powder' },
  { k: 'rustconv', t: 'Wattlebird Rust Converter', s: 'wattle', hz: 1, sig: 'Warning', pic: ['exclamation'], H: ['H290', 'H315', 'H319'], tags: ['irrit'],
    dg: null, cas: ['7664-38-2'], comp: [['Phosphoric acid', '7664-38-2', '10-20'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 59, rev: '1.0', fp: 'Not applicable', ph: 'Pale liquid' },
  { k: 'flux', t: 'Wattlebird Soldering Flux Paste', s: 'wattle', hz: 1, sig: 'Danger', pic: ['corrosive', 'exclamation'], H: ['H302', 'H314'], tags: ['corr'],
    dg: null, cas: ['7646-85-7', '12125-02-9'], comp: [['Zinc chloride', '7646-85-7', '10-30'], ['Ammonium chloride', '12125-02-9', '1-5']], form: 'paste', ago: 44, rev: '1.2', fp: 'Not applicable', ph: 'Grey paste' },
  { k: 'floorclean', t: 'Tidewater Multi-Purpose Floor Cleaner Concentrate', s: 'tide', hz: 1, sig: 'Warning', pic: ['exclamation'], H: ['H319'], tags: ['irrit'],
    dg: null, cas: ['68585-34-2'], comp: [['Sodium lauryl ether sulfate', '68585-34-2', '5-10'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 12, rev: '2.1', fp: 'Not applicable', ph: 'Blue liquid' },
  // ---- not hazardous ----------------------------------------------------------------
  { k: 'pva', t: 'Stickfast PVA Wood Glue', s: 'stick', hz: 0, tags: ['none'], dg: null, cas: ['9003-20-7', '7732-18-5'], comp: [['Polyvinyl acetate emulsion', '9003-20-7', '40-60'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 10, rev: '2.0', ph: 'White liquid' },
  { k: 'pvad4', t: 'Stickfast Weatherproof Wood Glue (D4)', s: 'stick', hz: 0, tags: ['none'], dg: null, cas: ['9003-20-7', '7732-18-5'], comp: [['Polyvinyl acetate emulsion', '9003-20-7', '40-60'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 10, rev: '2.0', ph: 'White liquid' },
  { k: 'acrylic', t: 'Kestrel Acrylic Paint Range (Interior, Exterior, Ceiling)', s: 'kestrel', hz: 0, tags: ['none'], dg: null, cas: ['13463-67-7', '7732-18-5'], comp: [['Acrylic polymer emulsion', '', '20-30'], ['Titanium dioxide', '13463-67-7', '10-20'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 8, rev: '6.0', ph: 'White to tinted liquid' },
  { k: 'floorfinish', t: 'Kestrel Water-Based Floor Finish', s: 'kestrel', hz: 0, tags: ['none'], dg: null, cas: ['7732-18-5'], comp: [['Polyurethane dispersion', '', '30-40'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 18, rev: '2.4', ph: 'Milky liquid' },
  { k: 'sealer', t: 'Fernhill Timber Sealer (water-based)', s: 'fern', hz: 0, tags: ['none'], dg: null, cas: ['7732-18-5'], comp: [['Acrylic polymer', '', '10-20'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 9, rev: '1.1', ph: 'Milky liquid' },
  { k: 'wax', t: 'Fernhill Beeswax Furniture Polish', s: 'fern', hz: 0, tags: ['none'], dg: null, cas: ['8042-47-5'], comp: [['Beeswax', '8012-89-3', '10-20'], ['White mineral oil', '8042-47-5', '40-60']], form: 'paste', ago: 64, rev: '1.0', ph: 'Cream paste' },
  { k: 'grease', t: 'Ironwood General Purpose Grease No. 2', s: 'iron', hz: 0, tags: ['none'], dg: null, cas: ['8042-47-5'], comp: [['White mineral oil', '8042-47-5', '75-90'], ['Lithium soap thickener', '', '5-15']], form: 'paste', ago: 58, rev: '3.2', ph: 'Amber grease' },
  { k: 'hydraulic', t: 'Ironwood Hydraulic Oil 46', s: 'iron', hz: 0, tags: ['none'], dg: null, cas: ['8042-47-5'], comp: [['White mineral oil', '8042-47-5', '>90']], form: 'liquid', ago: 30, rev: '2.0', ph: 'Pale oil' },
  { k: 'chainoil', t: 'Ironwood Bar and Chain Oil', s: 'iron', hz: 0, tags: ['none'], dg: null, cas: ['8042-47-5'], comp: [['White mineral oil', '8042-47-5', '>90']], form: 'liquid', ago: 14, rev: '1.4', ph: 'Tacky amber oil' },
  { k: 'engineoil', t: 'Ironwood 10W-40 Engine Oil', s: 'iron', hz: 0, tags: ['none'], dg: null, cas: ['8042-47-5'], comp: [['White mineral oil', '8042-47-5', '>80']], form: 'liquid', ago: 27, rev: '2.1', ph: 'Amber oil' },
  { k: 'silsealant', t: 'Wattlebird Neutral Cure Silicone Sealant', s: 'wattle', hz: 0, tags: ['none'], dg: null, cas: ['63148-62-9'], comp: [['Polydimethylsiloxane', '63148-62-9', '60-80'], ['Calcium carbonate', '471-34-1', '10-30']], form: 'paste', ago: 71, rev: '1.0', ph: 'White paste' },
  { k: 'handgel', t: 'Wattlebird Workshop Hand Cleaner Gel', s: 'wattle', hz: 0, tags: ['none'], dg: null, cas: ['56-81-5'], comp: [['Glycerol', '56-81-5', '1-5'], ['Water', '7732-18-5', 'to 100']], form: 'paste', noDate: true, rev: 'n/a', ph: 'Beige gel with pumice' },
  { k: 'dishwash', t: 'Tidewater Dishwashing Detergent', s: 'tide', hz: 0, tags: ['none'], dg: null, cas: ['68585-34-2'], comp: [['Sodium lauryl ether sulfate', '68585-34-2', '5-10'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 5, rev: '1.2', ph: 'Yellow liquid' },
  { k: 'glassclean', t: 'Tidewater Glass and Surface Cleaner', s: 'tide', hz: 0, tags: ['none'], dg: null, cas: ['67-63-0', '7732-18-5'], comp: [['Isopropanol', '67-63-0', '1-5'], ['Water', '7732-18-5', 'to 100']], form: 'liquid', ago: 5, rev: '1.0', ph: 'Blue liquid' },
];

// risk: n = not_significant, c = significant_controlled, x = significant_not_controlled, u = uncertain
// dec: 'h' | 'n' | null. null decision with an SDS = no decision yet. sds null = no SDS on file.
// locs: [location, quantity, unit, note]
const FC1 = 'Workshop - flammables cabinet 1';
const FC2 = 'Workshop - flammables cabinet 2';
const PAINT = 'Workshop - paint store';
const GAS = 'Gas cage (outdoor, fenced)';
const MS = 'Maintenance store room';
const VAN = 'Maintenance van 1';
const GEN = 'Generator shed';
const CLEAN = 'Cleaners cupboard';
const YARD = 'Yard shed';
const PLS = 'Plaster store';
const BENCH = 'Workshop - bench';

export const CHEMICALS = [
  { n: 'Marlow Acetone Solvent', sds: 'acetone', codes: 'MIS-ACE-5', syn: 'Acetone, propanone', use: 'Equipment and glue clean-up in the workshop', risk: 'c', locs: [[FC1, 10, 'L', '2 x 5 L cans'], [MS, 5, 'L', '1 x 5 L can']] },
  { n: 'Marlow Methylated Spirits', sds: 'metho', codes: 'MIS-MET-5', syn: 'Metho, denatured alcohol', use: 'Surface wipe before gluing and finishing', risk: 'c', locs: [[FC1, 20, 'L', '4 x 5 L cans'], [VAN, 5, 'L', '1 x 5 L can']], history: true },
  { n: 'Marlow Mineral Turpentine', sds: 'turps', codes: 'MIS-MT-4', syn: 'Mineral turps, white spirit', use: 'Thinning oil-based finishes and cleaning brushes', risk: 'c', locs: [[FC1, 16, 'L', '4 x 4 L cans'], [PAINT, 8, 'L', '2 x 4 L cans']] },
  { n: 'Marlow Lacquer Thinners', sds: 'thinners', codes: 'MIS-LT-4', syn: 'Thinners', use: 'Cleaning spray gun and thinning lacquer', risk: 'x', gap: 'Decanted into unlabelled bottles at the spray bench and used without local exhaust. Fix: label all bottles, use the booth extraction, review the SDS (it is overdue).', locs: [[FC2, 12, 'L', '3 x 4 L cans'], [BENCH, 1, 'L', 'decanted bottle']] },
  { n: 'Kestrel Oil Stain - Walnut', sds: 'stain', codes: 'KC-OS-WAL-1', syn: 'Oil-based stain', use: 'Staining joinery in the finishing room', risk: 'c', locs: [[PAINT, 8, 'L', '8 x 1 L tins']] },
  { n: 'Kestrel Oil Stain - Jarrah', sds: 'stain', codes: 'KC-OS-JAR-1', syn: 'Oil-based stain', use: 'Staining joinery in the finishing room', risk: 'c', locs: [[PAINT, 6, 'L', '6 x 1 L tins']] },
  { n: 'Kestrel Polyurethane Varnish Gloss', sds: 'varnish', codes: 'KC-PU-G-4', syn: 'Solvent-based varnish', use: 'Clear coat on doors and benchtops', risk: 'c', locs: [[PAINT, 12, 'L', '3 x 4 L tins']] },
  { n: 'Stickfast Contact Adhesive 500', sds: 'contact', codes: 'SF-CA500-5', syn: 'Contact cement', use: 'Laminate and veneer bonding', risk: 'c', locs: [[FC2, 10, 'L', '2 x 5 L tins'], [BENCH, 1, 'L', 'working tin']] },
  { n: 'Stickfast Grip Max Construction Adhesive 290 mL cartridge', sds: 'grip', codes: 'SF-GM-290', syn: 'Construction adhesive', use: 'Fixing timber and panels on site', risk: 'c', locs: [[VAN, 7, 'L', '24 x 290 mL cartridges']] },
  { n: 'Stickfast Grip Max Construction Adhesive 375 mL cartridge', sds: 'grip', codes: 'SF-GM-375', syn: 'Construction adhesive', use: 'Fixing timber and panels on site', risk: 'c', locs: [[MS, 9, 'L', '24 x 375 mL cartridges']] },
  { n: 'Stickfast Grip Max Construction Adhesive 600 mL sausage', sds: 'grip', codes: 'SF-GM-600', syn: 'Construction adhesive', use: 'Fixing timber and panels on site', risk: 'n', locs: [[MS, 3.6, 'L', '6 x 600 mL sausages']] },
  { n: 'Stickfast Grip Max Construction Adhesive 4 L pail', sds: 'grip', codes: 'SF-GM-4000', syn: 'Construction adhesive', use: 'Bulk adhesive for floor and panel work', risk: 'c', locs: [[MS, 8, 'L', '2 x 4 L pails']] },
  { n: 'Harbourlight Unleaded Petrol', sds: 'petrol', codes: 'HF-ULP', syn: 'Petrol, gasoline', use: 'Fuel for the portable generator and small engines', risk: 'c', locs: [[GEN, 20, 'L', '2 x 10 L approved jerry cans'], [VAN, 10, 'L', '1 x 10 L jerry can']] },
  { n: 'Harbourlight Diesel Fuel', sds: 'diesel', codes: 'HF-DSL', syn: 'Diesel', use: 'Fuel for the work ute and site generator', risk: 'n', locs: [[GEN, 200, 'L', '1 x 200 L drum, bunded'], [VAN, 60, 'L', 'ute auxiliary tank']] },
  { n: 'Harbourlight Two-Stroke Fuel Mix 50:1', sds: 'twostroke', codes: 'HF-2S-5', syn: 'Premix', use: 'Brushcutter and chainsaw fuel', dec: null, risk: 'u', blank: true, locs: [[YARD, 5, 'L', '1 x 5 L can']] },
  { n: 'Fernhill Brush Cleaner and Thinner', sds: 'brushclean', codes: 'FT-BC-2', syn: 'Brush cleaner', use: 'Cleaning brushes after oil-based finishes', risk: 'c', locs: [[PAINT, 4, 'L', '2 x 2 L cans']] },
  { n: 'Kestrel Spray Enamel Aerosol Gloss Black', sds: 'spayenamel', codes: 'KC-SE-GB', syn: 'Spray paint', use: 'Touch-up of metal fittings', risk: 'c', locs: [[FC2, 4.8, 'L', '12 x 400 mL aerosols']] },
  { n: 'Ironwood Penetrating Spray', sds: 'penetrant', codes: 'IL-PS-300', syn: 'Penetrating oil, freeing spray', use: 'Freeing rusted fasteners', risk: 'n', locs: [[MS, 3.6, 'L', '12 x 300 g aerosols'], [VAN, 0.6, 'L', '2 x 300 g aerosols']] },
  { n: 'Ironwood Silicone Lubricant Spray', sds: 'silicone', codes: 'IL-SL-300', syn: 'Silicone spray', use: 'Lubricating sliding doors, drawers and saw tables', risk: 'n', locs: [[BENCH, 1.8, 'L', '6 x 300 g aerosols']] },
  { n: 'Wattlebird Brake and Parts Cleaner Aerosol', sds: 'brakeclean', codes: 'WW-BPC-500', syn: 'Brake cleaner', use: 'Degreasing machine parts', risk: 'x', gap: 'Used indoors near the grinder with no ventilation. Fix: use outdoors or with local exhaust, keep away from ignition, update SDS (overdue).', locs: [[MS, 3, 'L', '6 x 500 mL aerosols']] },
  { n: 'Stickfast Spray Adhesive Aerosol', sds: 'sprayglue', codes: 'SF-SA-400', syn: 'Spray glue', use: 'Bonding foam and laminate offcuts', risk: 'c', locs: [[FC2, 2.4, 'L', '6 x 400 g aerosols']] },
  { n: 'Wattlebird Expanding Foam Gap Filler', sds: 'foam', codes: 'WW-EF-750', syn: 'Gap filling foam, PU foam', use: 'Sealing gaps around frames on site', risk: 'c', surv: 'Contains MDI, a respiratory sensitiser. Anyone with asthma should avoid use; ask a doctor about health surveillance.', locs: [[MS, 4.5, 'L', '6 x 750 mL cans']] },
  { n: 'Quillon LPG Cylinder 9 kg', sds: 'lpg', codes: 'QI-LPG-9', syn: 'LPG, propane', use: 'Gas heater and torch for site work', risk: 'c', locs: [[GAS, 18, 'kg', '2 x 9 kg cylinders'], [VAN, 9, 'kg', '1 x 9 kg cylinder']] },
  { n: 'Quillon Acetylene (dissolved gas)', sds: 'acetylene', codes: 'QI-C2H2-G', syn: 'Acetylene', use: 'Oxy-acetylene cutting and brazing', risk: 'c', locs: [[GAS, 6, 'kg', '1 x G size cylinder']] },
  { n: 'Quillon Oxygen (compressed)', sds: 'oxygen', codes: 'QI-O2-G', syn: 'Oxygen', use: 'Oxy-acetylene cutting and brazing', risk: 'c', locs: [[GAS, 8, 'kg', '1 x G size cylinder']] },
  { n: 'Quillon Welding Shielding Gas (Argon / Carbon Dioxide)', sds: 'shield', codes: 'QI-ARCO2-E', syn: 'Mig mix, argon CO2', use: 'MIG welding of steel brackets', risk: 'n', locs: [[GAS, 11, 'kg', '1 x E size cylinder']] },
  { n: 'Tidewater Hydrochloric Acid 32%', sds: 'hcl', codes: 'TC-HCL-5', syn: 'Spirit of salts, muriatic acid', use: 'Cleaning masonry and descaling', risk: 'c', locs: [[MS, 10, 'L', '2 x 5 L bottles in bunded tray']] },
  { n: 'Tidewater Caustic Soda Flakes', sds: 'caustic', codes: 'TC-NAOH-2', syn: 'Sodium hydroxide, lye', use: 'Stripping old paint from timber', risk: 'x', gap: 'Stored on an open shelf with no eyewash station nearby and no face shield. Fix: lockable cabinet, eyewash, face shield.', locs: [[MS, 5, 'kg', '2 x 2.5 kg tubs']] },
  { n: 'Tidewater Liquid Chlorine 12.5%', sds: 'bleach', codes: 'TC-NAOCL-20', syn: 'Sodium hypochlorite, liquid pool chlorine', use: 'Mould treatment and sanitising', risk: 'c', locs: [[CLEAN, 20, 'L', '1 x 20 L drum']] },
  { n: 'Tidewater Drain Unblocker Gel', sds: 'drain', codes: 'TC-DUG-1', syn: 'Drain cleaner', use: 'Clearing workshop sink drain', risk: 'c', locs: [[CLEAN, 4, 'L', '4 x 1 L bottles']] },
  { n: 'Wattlebird Battery Acid (Sulfuric Acid 35%)', sds: 'battery', codes: 'WW-BA-5', syn: 'Battery electrolyte', use: 'Topping up lead-acid batteries', risk: 'x', gap: 'Decanted with a plastic jug and no goggles or apron. Fix: dedicated funnel, goggles, apron, update SDS (overdue).', locs: [[MS, 5, 'L', '1 x 5 L bottle']] },
  { n: 'Tidewater Hydrogen Peroxide 35%', sds: 'peroxide', codes: 'TC-H2O2-5', syn: 'Peroxide', use: 'Mould and stain removal on timber', risk: 'c', locs: [[CLEAN, 5, 'L', '1 x 5 L bottle']] },
  { n: 'Kestrel Two-Pack Epoxy Resin (Part A)', sds: 'epoxyA', codes: 'KC-EPX-A-2', syn: 'Epoxy resin', use: 'Timber repair and bonding', risk: 'c', locs: [[PAINT, 3, 'L', '3 x 1 L tins']] },
  { n: 'Kestrel Two-Pack Epoxy Hardener (Part B)', sds: 'epoxyB', codes: 'KC-EPX-B-2', syn: 'Epoxy hardener', use: 'Timber repair and bonding', risk: 'c', locs: [[PAINT, 1.5, 'L', '3 x 500 mL tins']] },
  { n: 'Bluegum General Purpose Cement', sds: 'cement', codes: 'BG-GP-20', syn: 'Portland cement, GP cement', use: 'Footings and post setting', risk: 'c', locs: [[YARD, 100, 'kg', '5 x 20 kg bags']] },
  { n: 'Wattlebird Rust Converter', sds: 'rustconv', codes: 'WW-RC-1', syn: 'Rust treatment', use: 'Treating rusted brackets', risk: 'n', locs: [[MS, 2, 'L', '2 x 1 L bottles']] },
  { n: 'Wattlebird Soldering Flux Paste', sds: 'flux', codes: 'WW-SFP-100', syn: 'Flux', use: 'Soldering copper fittings', risk: 'u', locs: [[BENCH, 0.2, 'kg', '2 x 100 g tubs']] },
  { n: 'Tidewater Multi-Purpose Floor Cleaner Concentrate', sds: 'floorclean', codes: 'TC-MPFC-5', syn: 'Floor cleaner', use: 'Cleaning workshop and office floors', risk: 'n', locs: [[CLEAN, 5, 'L', '1 x 5 L bottle']] },
  // ---- Brightboard (ten products, one SDS)
  ...[
    ['Brightboard Base Coat Plaster 20 kg', 'BB-BCP-20', 20],
    ['Brightboard Finishing Plaster 20 kg', 'BB-FP-20', 20],
    ['Brightboard Set 20 Setting Compound', 'BB-SET20', 40],
    ['Brightboard Set 45 Setting Compound', 'BB-SET45', 40],
    ['Brightboard Set 90 Setting Compound', 'BB-SET90', 20],
    ['Brightboard Cornice Adhesive', 'BB-CORN-20', 20],
    ['Brightboard Patch and Repair Compound', 'BB-PATCH-5', 5],
    ['Brightboard Jointing Cement', 'BB-JC-10', 10],
    ['Brightboard Texture Coat Fine', 'BB-TXF-20', 20],
    ['Brightboard Lightweight Topping Compound', 'BB-LTC-15', 15],
  ].map(([n, code, kg], i) => ({ n, sds: 'plaster', codes: code, syn: 'Plaster product', use: 'Patching and finishing plasterboard walls', risk: i % 4 === 0 ? 'n' : 'c', locs: kg >= 20 ? [[PLS, kg, 'kg', Math.round(kg / 20) + ' x 20 kg bags']] : (i === 6 ? [] : [[PLS, kg, 'kg', '1 bag']]) })),
  // ---- not hazardous
  { n: 'Stickfast PVA Wood Glue', sds: 'pva', codes: 'SF-PVA-5', syn: 'White glue', use: 'Joinery assembly', risk: 'n', locs: [[BENCH, 5, 'L', '1 x 5 L pail']] },
  { n: 'Stickfast Weatherproof Wood Glue (D4)', sds: 'pvad4', codes: 'SF-D4-2', syn: 'Water-resistant PVA', use: 'Exterior joinery assembly', risk: 'n', locs: [[BENCH, 4, 'L', '2 x 2 L bottles']] },
  { n: 'Kestrel Acrylic Paint - Interior Warm White 10 L', sds: 'acrylic', codes: 'KC-AP-INT-10', syn: 'Water-based paint', use: 'Painting repairs inside', risk: 'n', locs: [[PAINT, 10, 'L', '1 x 10 L tin']] },
  { n: 'Kestrel Acrylic Paint - Exterior Surf 10 L', sds: 'acrylic', codes: 'KC-AP-EXT-10', syn: 'Water-based paint', use: 'Painting repairs outside', risk: 'n', locs: [[PAINT, 10, 'L', '1 x 10 L tin']] },
  { n: 'Kestrel Acrylic Paint - Ceiling White 10 L', sds: 'acrylic', codes: 'KC-AP-CEI-10', syn: 'Water-based paint', use: 'Ceiling repairs', risk: 'n', locs: [[PAINT, 10, 'L', '1 x 10 L tin']] },
  { n: 'Kestrel Water-Based Floor Finish', sds: 'floorfinish', codes: 'KC-WBF-4', syn: 'Floor coating', use: 'Finishing timber floors', risk: 'n', locs: [[PAINT, 8, 'L', '2 x 4 L tins']] },
  { n: 'Fernhill Timber Sealer (water-based)', sds: 'sealer', codes: 'FT-TS-4', syn: 'Sealer', use: 'Sealing raw timber before finishing', risk: 'n', locs: [[PAINT, 4, 'L', '1 x 4 L tin']] },
  { n: 'Fernhill Beeswax Furniture Polish', sds: 'wax', codes: 'FT-BW-500', syn: 'Wax polish', use: 'Final polish on furniture', risk: 'n', locs: [[BENCH, 0.5, 'L', '1 x 500 g tin']] },
  { n: 'Ironwood General Purpose Grease No. 2', sds: 'grease', codes: 'IL-GP2-450', syn: 'Grease', use: 'Greasing hinges and machine bearings', risk: 'n', locs: [[MS, 0.9, 'kg', '2 x 450 g cartridges']] },
  { n: 'Ironwood Hydraulic Oil 46', sds: 'hydraulic', codes: 'IL-HO46-20', syn: 'Hydraulic oil', use: 'Topping up the press and log splitter', risk: 'n', locs: [[MS, 20, 'L', '1 x 20 L drum']] },
  { n: 'Ironwood Bar and Chain Oil', sds: 'chainoil', codes: 'IL-BCO-5', syn: 'Chainsaw oil', use: 'Chainsaw lubrication', risk: 'n', locs: [[YARD, 5, 'L', '1 x 5 L can']] },
  { n: 'Ironwood 10W-40 Engine Oil', sds: 'engineoil', codes: 'IL-EO-5', syn: 'Engine oil', use: 'Servicing engines and generator', risk: 'n', locs: [[GEN, 10, 'L', '2 x 5 L cans']] },
  { n: 'Wattlebird Neutral Cure Silicone Sealant', sds: 'silsealant', codes: 'WW-NCS-300', syn: 'Silicone sealant', use: 'Sealing around windows and benchtops', risk: 'n', locs: [[MS, 3, 'L', '10 x 300 mL cartridges']] },
  { n: 'Wattlebird Workshop Hand Cleaner Gel', sds: 'handgel', codes: 'WW-HC-4', syn: 'Hand cleaner', use: 'Washing hands after workshop jobs', risk: 'u', locs: [[BENCH, 4, 'L', '1 x 4 L pump pack']] },
  { n: 'Tidewater Dishwashing Detergent', sds: 'dishwash', codes: 'TC-DD-5', syn: 'Detergent', use: 'Washing up in the crib room', risk: 'n', locs: [[CLEAN, 5, 'L', '1 x 5 L bottle']] },
  { n: 'Tidewater Glass and Surface Cleaner', sds: 'glassclean', codes: 'TC-GSC-750', syn: 'Spray and wipe', use: 'Cleaning windows and benches', risk: 'n', locs: [[CLEAN, 1.5, 'L', '2 x 750 mL trigger bottles']] },
  // ---- no SDS on file
  { n: 'Concrete Sealer (solvent-based, unlabelled tin)', sds: null, codes: '', syn: 'Masonry sealer', use: 'Sealing the yard slab (leftover tin, no SDS on file)', dec: 'h', note: 'Treated as hazardous until the SDS is obtained from the supplier.', risk: 'u', locs: [[YARD, 4, 'L', '1 x 4 L tin, label missing']] },
];

export const USERS = [
  { name: 'Demo Admin', email: 'demo-admin@example.invalid', role: 'admin', color: '#2E5E7E' },
  { name: 'Demo User', email: 'demo-user@example.invalid', role: 'user', color: '#D9822B' },
];

export const DEMO_PASSWORD = 'demo-Ezy-2026';
