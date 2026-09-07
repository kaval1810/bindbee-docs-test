/*
 * Model Availability Matrix - model-level support per integration.
 *
 * Mintlify constraints this file works around (all verified against the local
 * preview, do not "tidy" them away):
 *   1. The file is inlined into the page module and its own import statements
 *      are stripped - so everything it needs must live in this one file.
 *   2. A capitalised JSX tag is always resolved from the MDX component scope,
 *      even when a component of that name is declared here. Helper components
 *      are therefore lowercase functions called as {helper(...)}.
 *   3. No npm packages, and no Fragment in scope - rows are flattened instead.
 *   4. React hooks (useState/useEffect/useMemo) are pre-injected by Mintlify.
 *
 * Data comes from the "Bindbee Docs - Models Matrix" Google Sheet, fetched live
 * as published CSV. See SHEET_BASE below for the layout and the publish steps.
 */

export const ModelSupportMatrix = () => {
  /*
   * Everything the component needs lives inside this function on purpose:
   * Mintlify extracts only the imported component from a .jsx snippet and
   * drops the rest of the module, so top-level consts would be undefined.
   */

  /*
   * SOURCE OF TRUTH: the "Bindbee Docs - Models Matrix" Google Sheet.
   *
   * SHEET_BASE is the "Publish to web" CSV link (File > Share > Publish to web >
   * Entire document > CSV). Publishing does NOT share the document itself - the
   * sheet stays restricted; only this read-only snapshot is fetchable.
   *
   * Each tab has its own gid, visible in the sheet's URL (#gid=...) when that
   * tab is selected. A category with no gid simply doesn't appear in the picker.
   */
  const SHEET_BASE =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTx0G0yItXlZKO4Zep8wstZuvvO7bgOxFXBVK_1vvQnxpG8H2hP9n9M8kmZMfIoo7ZO4e7_utrz3_XB/pub";

  const SHEET_GIDS = {
    HRIS: "0",
    ATS: "1962490874",
    LMS: "1106223511",
  };

  const CATEGORIES = [
    { key: "HRIS", label: "HRIS & Payroll" },
    { key: "ATS", label: "Recruiting (ATS)" },
    { key: "LMS", label: "Learning (LMS)" },
  ];

  const AVAILABLE = CATEGORIES.filter((c) => SHEET_GIDS[c.key]);

  /*
   * Expected tab layout - parsing is anchored on these column C labels rather
   * than on fixed row numbers, so inserting a row in the sheet can't break it:
   *
   *   A       B       C                 D onward
   *   ------------------------------------------------------
   *                   Logo link         logo URL per provider
   *   Write   Group   Model             provider display name
   *                   Connection Type   A (API) or S (SFTP)
   *   Y/N     group   model name        Y | B | N | blank
   *
   * Cells are three-state: Y supported, B supported but in beta, N/blank not.
   */
  const LOGO_ROW = "logo link";
  const HEADER_ROW = "model";
  const TYPE_ROW = "connection type";

  /* RFC 4180: quoted fields, "" escapes, embedded commas and newlines, CRLF. */
  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        quoted = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  };

  const cell = (row, i) => ((row && row[i]) || "").trim();

  /* "ADP Workforce Now" + S -> adp_workforce_now_sftp */
  const slugify = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const parseSheet = (csv) => {
    const rows = parseCsv(csv);
    const find = (label) => rows.find((r) => cell(r, 2).toLowerCase() === label);

    const header = find(HEADER_ROW);
    const types = find(TYPE_ROW);
    const logos = find(LOGO_ROW);
    if (!header || !types) {
      throw new Error("Sheet is missing its 'Model' or 'Connection Type' row");
    }

    /*
     * A column counts as a provider only when it has both a name and a
     * connection type. Names with no type yet are treated as not-ready and
     * skipped - filling in A or S is what makes a column appear.
     */
    const providers = [];
    for (let i = 3; i < header.length; i++) {
      const name = cell(header, i);
      const t = cell(types, i).toUpperCase();
      if (!name || (t !== "A" && t !== "S")) continue;
      const type = t === "S" ? "SFTP" : "API";
      providers.push({
        name,
        type,
        col: i,
        slug: slugify(name) + (type === "SFTP" ? "_sftp" : ""),
        logo: cell(logos, i),
      });
    }

    /* Groups come from column B in first-appearance order. */
    const groups = [];
    const byName = {};
    const cells = {};
    const headerRowIndex = rows.indexOf(header);

    rows.forEach((r, idx) => {
      if (idx <= headerRowIndex) return;
      const label = cell(r, 2);
      const groupName = cell(r, 1);
      if (!label || !groupName || label.toLowerCase() === TYPE_ROW) return;

      const key = slugify(label);
      if (!byName[groupName]) {
        byName[groupName] = { group: groupName, models: [] };
        groups.push(byName[groupName]);
      }
      const model = { key, label };
      if (cell(r, 0).toUpperCase() === "Y") model.write = true;
      byName[groupName].models.push(model);

      cells[key] = {};
      providers.forEach((p) => {
        const v = cell(r, p.col).toUpperCase();
        cells[key][p.slug] = v === "Y" || v === "B" ? v : "N";
      });
    });

    if (!providers.length || !groups.length) {
      throw new Error("Sheet has no usable providers or models");
    }
    return { providers, groups, cells };
  };

  const loadMatrix = async (category) => {
    const gid = SHEET_GIDS[category];
    if (!gid) throw new Error("No sheet tab configured for " + category);
    const url =
      SHEET_BASE + "?gid=" + encodeURIComponent(gid) + "&single=true&output=csv";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Sheet fetch failed (" + res.status + ")");
    return parseSheet(await res.text());
  };

  const CSS = `
  /* Greys are matched to the Mintlify theme: the light ground is a warm
     off-white (#fcfcfb), the dark ground is neutral (#090909). Anything with a
     blue cast reads as foreign against them. */
  .bb-mm {
    --bb-border: #e5e3df;
    --bb-border-strong: #d4d1cc;
    --bb-bg: #fcfcfb;
    --bb-bg-sub: #f5f4f3;
    --bb-text: #1c1b1a;
    --bb-text-dim: #6e6c68;
    --bb-accent: #f57e21;
    --bb-yes: #16a34a;
    --bb-chip: #eceae7;
    --bb-shadow: 0 1px 2px rgba(28, 27, 26, 0.05);
    font-size: 14px;
    color: var(--bb-text);
    margin: 1.25rem 0;
  }
  html.dark .bb-mm {
    --bb-border: #242424;
    --bb-border-strong: #333333;
    --bb-bg: #090909;
    --bb-bg-sub: #141414;
    --bb-text: #ededed;
    --bb-text-dim: #a1a1a1;
    --bb-chip: #1b1b1b;
    --bb-shadow: none;
  }

  .bb-mm-bar {
    position: relative;
    z-index: 40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 20px 0 12px;
  }
  .bb-mm-bar-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .bb-mm-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 12px;
    border: 1px solid var(--bb-border-strong);
    background: var(--bb-bg);
    color: var(--bb-text);
    border-radius: 4px;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.12s ease, color 0.12s ease;
  }
  .bb-mm-btn:hover { border-color: var(--bb-accent); }
  .bb-mm-btn[data-active="true"] {
    border-color: var(--bb-accent);
    color: var(--bb-accent);
  }
  /* Mintlify's <Icon> paints itself via a mask, so this makes it follow the
     button's own colour - including the orange it turns when a filter is on. */
  .bb-mm-btn .icon { background-color: currentColor !important; }
  .bb-mm-chevron { margin-left: -1px; opacity: 0.6; }

  .bb-mm-count {
    background: var(--bb-accent);
    color: #fff;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    min-width: 18px;
    text-align: center;
    padding: 2px 6px;
    line-height: 1.2;
  }

  /* Popover icons follow their row's colour, same trick as the buttons. */
  .bb-mm-pop .icon { background-color: currentColor !important; }

  .bb-mm-opt-btn {
    width: 100%;
    border: none;
    background: none;
    color: var(--bb-text);
    font-size: 13px;
    text-align: left;
  }
  .bb-mm-opt-btn .bb-mm-tick { opacity: 0; color: var(--bb-accent); display: inline-flex; }
  .bb-mm-opt-btn[data-selected="true"] { color: var(--bb-accent); font-weight: 500; }
  .bb-mm-opt-btn[data-selected="true"] .bb-mm-tick { opacity: 1; }

  .bb-mm-pop-wrap { position: relative; }
  .bb-mm-pop {
    position: absolute;
    z-index: 1;
    top: calc(100% + 6px);
    left: 0;
    color: var(--bb-text);
    width: max-content;
    min-width: 100%;
    max-width: 300px;
    max-height: 320px;
    overflow: auto;
    background: var(--bb-bg);
    border: 1px solid var(--bb-border-strong);
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 8px;
  }
  .bb-mm-pop[data-align="right"] { left: auto; right: 0; }
  /* The sticky element is the bar, not the bare input: a sticky input only
     covers its own box, so options scrolled through the popover's 8px padding
     above and beside it. The negative margins bleed the bar to the popover
     edges and top:-8px pins it over that padding. */
  .bb-mm-pop-head {
    position: sticky;
    top: -8px;
    z-index: 2;
    margin: -8px -8px 6px;
    padding: 8px;
    background: var(--bb-bg);
    border-bottom: 1px solid var(--bb-border);
  }
  .bb-mm-pop input[type="text"] {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-width: 200px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--bb-border-strong);
    border-radius: 4px;
    background: var(--bb-bg-sub);
    color: var(--bb-text);
    font-size: 13px;
  }
  .bb-mm-search { position: relative; display: block; }
  .bb-mm-search input[type="text"] { padding-right: 30px; }
  .bb-mm-search-clear {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: none;
    color: var(--bb-text-dim);
    cursor: pointer;
  }
  .bb-mm-search-clear:hover { color: var(--bb-accent); background: var(--bb-chip); }
  .bb-mm-search-clear .icon { background-color: currentColor !important; }
  .bb-mm-opt-empty {
    padding: 10px 6px;
    color: var(--bb-text-dim);
    font-size: 12px;
  }

  .bb-mm-pop input[type="text"]:focus {
    outline: none;
    border-color: var(--bb-accent);
  }

  /* Brand checkbox, replacing the browser default. */
  .bb-mm-opt input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    flex: none;
    position: relative;
    width: 15px;
    height: 15px;
    margin: 0;
    border: 1px solid var(--bb-border-strong);
    border-radius: 3px;
    background: var(--bb-bg);
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .bb-mm-opt:hover input[type="checkbox"] { border-color: var(--bb-accent); }
  .bb-mm-opt input[type="checkbox"]:checked {
    background: var(--bb-accent);
    border-color: var(--bb-accent);
  }
  .bb-mm-opt input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .bb-mm-opt input[type="checkbox"]:focus-visible {
    outline: 2px solid var(--bb-accent);
    outline-offset: 2px;
  }

  .bb-mm-opt {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
  }
  .bb-mm-opt:hover { background: var(--bb-bg-sub); }
  .bb-mm-opt-group {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--bb-text-dim);
    padding: 8px 6px 2px;
  }
  .bb-mm-pop-foot {
    position: sticky;
    bottom: -8px;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    background: var(--bb-bg);
    border-top: 1px solid var(--bb-border);
    margin: 6px -8px -8px;
    padding: 6px 8px 8px;
  }
  .bb-mm-link {
    background: none;
    border: none;
    color: var(--bb-accent);
    font-size: 14px;
    cursor: pointer;
    padding: 2px 4px;
  }

  /* "not-prose" on the scroll container is load-bearing: Mintlify's prose layer
     sets every table to display:block + overflow:auto, which breaks the table
     header group (so sticky th has nothing to stick to) and nests a second
     scrollport inside this one. The prose rules all opt out under not-prose. */
  .bb-mm-scroll {
    border: 1px solid var(--bb-border);
    border-radius: 4px;
    overflow-x: auto;
    background: var(--bb-bg);
    box-shadow: var(--bb-shadow);
  }
  .bb-mm table {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    min-width: 100%;
    margin: 0;
    font-size: 13px;
  }
  .bb-mm th, .bb-mm td {
    border: none;
    border-bottom: 1px solid var(--bb-border);
    padding: 0;
  }
  .bb-mm thead th {
    position: sticky;
    top: 0;
    z-index: 12;
    background: var(--bb-bg-sub);
    border-bottom: 1px solid var(--bb-border-strong);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    vertical-align: middle;
  }
  .bb-mm .bb-mm-sticky {
    position: sticky;
    left: 0;
    z-index: 10;
    background: var(--bb-bg);
    border-right: 1px solid var(--bb-border-strong);
    width: 240px;
    min-width: 240px;
  }
  .bb-mm thead .bb-mm-sticky {
    top: 0;
    left: 0;
    z-index: 30;
    background: var(--bb-bg-sub);
  }

  .bb-mm-prov {
    min-width: 164px;
    text-align: center;
  }
  /* Name row on top, connection-type badge centred beneath it. */
  .bb-mm-prov-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  /* Logo sits beside the name, not above it: only some providers have a logo
     and stacking it would make those columns taller than the rest. */
  .bb-mm-prov-top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }
  .bb-mm-logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 3px;
    flex: none;
  }
  .bb-mm-prov-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .bb-mm-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--bb-chip);
    color: var(--bb-text-dim);
  }
  .bb-mm-badge[data-type="API"] { color: var(--bb-accent); background: rgba(245, 126, 33, 0.12); }
  .bb-mm-badge[data-type="SFTP"] { color: #be185d; background: rgba(219, 39, 119, 0.12); }
  html.dark .bb-mm-badge[data-type="SFTP"] { color: #f472b6; background: rgba(236, 72, 153, 0.16); }
  .bb-mm-badge[data-write="true"] { color: #1d4ed8; background: rgba(37, 99, 235, 0.12); }
  html.dark .bb-mm-badge[data-write="true"] { color: #7ca9f7; background: rgba(59, 130, 246, 0.16); }
  .bb-mm-badge[data-beta="true"] { color: #6d28d9; background: rgba(109, 40, 217, 0.12); }
  html.dark .bb-mm-badge[data-beta="true"] { color: #b39bf5; background: rgba(139, 92, 246, 0.16); }

  .bb-mm tbody tr.bb-mm-group td {
    background: var(--bb-bg-sub);
    font-weight: 600;
    padding: 9px 16px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bb-text-dim);
  }
  .bb-mm-group .bb-mm-sticky { background: var(--bb-bg-sub); }

  .bb-mm td.bb-mm-model {
    padding: 11px 16px;
    vertical-align: middle;
  }
  .bb-mm-model-name {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  .bb-mm td.bb-mm-cell {
    text-align: center;
    padding: 11px 16px;
    vertical-align: middle;
  }
  .bb-mm-dash { color: var(--bb-border-strong); }
  /* Tailwind's preflight makes every svg display:block, which drops it out of
     the cell's text-align and pins it left. Put it back in the inline flow. */
  .bb-mm-check {
    color: var(--bb-yes);
    display: inline-block;
    vertical-align: middle;
  }
  .bb-mm-row:hover td { background: var(--bb-bg-sub); }
  .bb-mm-row:hover .bb-mm-sticky { background: var(--bb-bg-sub); }

  .bb-mm-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    margin-top: 12px;
    font-size: 12px;
    color: var(--bb-text-dim);
  }
  .bb-mm-foot span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bb-mm-empty { padding: 32px; text-align: center; color: var(--bb-text-dim); }

  .bb-mm-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 56px 32px;
    color: var(--bb-text-dim);
    font-size: 13px;
  }
  .bb-mm-spinner {
    width: 26px;
    height: 26px;
    border: 2.5px solid var(--bb-border);
    border-top-color: var(--bb-accent);
    border-radius: 50%;
    animation: bb-mm-spin 0.7s linear infinite;
  }
  @keyframes bb-mm-spin {
    to { transform: rotate(360deg); }
  }
  /* Keep a motion cue for anyone who asked for less of it, just a calmer one. */
  @media (prefers-reduced-motion: reduce) {
    .bb-mm-spinner { animation-duration: 2.4s; }
  }
  `;

  /* Helpers are lowercase and called as functions - see note 2 at the top. */
  const checkIcon = () => (
    <svg
      className="bb-mm-check"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm4.1 6.2-4.9 5a.9.9 0 0 1-1.3 0L5.9 10.7a.9.9 0 1 1 1.3-1.3l1.4 1.5 4.2-4.3a.9.9 0 1 1 1.3 1.2Z" />
    </svg>
  );

  const dashMark = () => <span className="bb-mm-dash">—</span>;

  const searchBox = ({ value, setValue, placeholder }) => (
    <div className="bb-mm-pop-head">
      <span className="bb-mm-search">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value ? (
          <button
            type="button"
            className="bb-mm-search-clear"
            aria-label="Clear search"
            onClick={() => setValue("")}
          >
            <Icon icon="x" size={13} />
          </button>
        ) : null}
      </span>
    </div>
  );

  const dropdown = ({ id, label, icon, align, open, setOpen, count, children }) => (
    <div className="bb-mm-pop-wrap">
      <button
        type="button"
        className="bb-mm-btn"
        data-active={count > 0}
        onClick={() => setOpen(open === id ? null : id)}
      >
        <Icon icon={icon} size={15} />
        <span>{label}</span>
        {count > 0 ? <span className="bb-mm-count">{count}</span> : null}
        <span className="bb-mm-chevron">
          <Icon icon={open === id ? "chevron-up" : "chevron-down"} size={14} />
        </span>
      </button>
      {open === id ? (
        <div className="bb-mm-pop" data-align={align || "left"}>
          {children}
        </div>
      ) : null}
    </div>
  );


  const [category, setCategory] = useState((AVAILABLE[0] || CATEGORIES[0]).key);
  const [providerSel, setProviderSel] = useState([]);
  const [typeSel, setTypeSel] = useState([]);
  const [modelSel, setModelSel] = useState([]);
  const [search, setSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});
  const [copied, setCopied] = useState(false);

  /* Read filters back out of the URL so a shared link restores the same view. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const cat = q.get("category");
    if (cat && AVAILABLE.some((c) => c.key === cat)) setCategory(cat);
    const split = (v) => (v ? v.split(",").filter(Boolean) : []);
    setProviderSel(split(q.get("providers")));
    setTypeSel(split(q.get("types")));
    setModelSel(split(q.get("models")));
  }, []);

  useEffect(() => {
    let live = true;
    setError(null);
    if (cache[category]) {
      setSheet(cache[category]);
      return;
    }
    setSheet(null);
    loadMatrix(category).then(
      (data) => {
        if (!live) return;
        setCache((c) => ({ ...c, [category]: data }));
        setSheet(data);
      },
      (err) => {
        if (live) setError(err.message || String(err));
      }
    );
    return () => {
      live = false;
    };
  }, [category, cache]);

  /* A click anywhere outside an open dropdown closes it. */
  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const close = (e) => {
      if (!e.target.closest(".bb-mm-pop-wrap")) setOpen(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const allProviders = (sheet && sheet.providers) || [];
  const groups = (sheet && sheet.groups) || [];
  const flatModels = () => groups.flatMap((g) => g.models);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const providers = useMemo(
    () =>
      allProviders.filter(
        (p) =>
          (providerSel.length === 0 || providerSel.includes(p.slug)) &&
          (typeSel.length === 0 || typeSel.includes(p.type))
      ),
    [allProviders, providerSel, typeSel]
  );

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          group: g.group,
          models: g.models.filter((m) => modelSel.length === 0 || modelSel.includes(m.key))
        }))
        .filter((g) => g.models.length > 0),
    [groups, modelSel]
  );

  /* One flat row list - there is no Fragment in scope to group header + rows. */
  const rows = useMemo(
    () =>
      visibleGroups.flatMap((g) => [
        { kind: "group", group: g.group },
        ...g.models.map((m) => ({ kind: "model", model: m })),
      ]),
    [visibleGroups]
  );

  const modelCount = rows.filter((r) => r.kind === "model").length;

  /* "Y" supported | "B" supported, in beta | "N" not supported */
  const cellState = (modelKey, slug) =>
    (sheet && sheet.cells[modelKey] && sheet.cells[modelKey][slug]) || "N";

  const copyLink = () => {
    const q = new URLSearchParams();
    q.set("category", category);
    if (providerSel.length) q.set("providers", providerSel.join(","));
    if (typeSel.length) q.set("types", typeSel.join(","));
    if (modelSel.length) q.set("models", modelSel.join(","));
    const url = window.location.origin + window.location.pathname + "?" + q.toString();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const downloadCsv = () => {
    const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const out = [
      ["Group", "Model", ...providers.map((p) => p.name)],
      ["", "Connection type", ...providers.map((p) => p.type)],
    ];
    let group = "";
    rows.forEach((row) => {
      if (row.kind === "group") {
        group = row.group;
        return;
      }
      out.push([
        group,
        row.model.label,
        ...providers.map((p) => {
          const v = cellState(row.model.key, p.slug);
          return v === "Y" ? "Yes" : v === "B" ? "Beta" : "No";
        }),
      ]);
    });
    const csv = out.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bindbee-model-availability-" + category.toLowerCase() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Groups with their models narrowed by the model search; empty groups drop out. */
  const modelOptions = groups
    .map((g) => ({
      group: g.group,
      models: g.models.filter((m) =>
        (m.label + " " + g.group).toLowerCase().includes(modelSearch.toLowerCase())
      ),
    }))
    .filter((g) => g.models.length > 0);

  const providerOptions = allProviders.filter((p) =>
    (p.name + " " + p.slug).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bb-mm">
      <style>{CSS}</style>

      {error ? (
        <Warning>
          <strong>Couldn't load the availability data.</strong> {error}. Check that the sheet is
          still published to the web and that the tab's gid is correct.
        </Warning>
      ) : null}

      <div className="bb-mm-bar">
        <div className="bb-mm-bar-group">
        {dropdown({
          id: "provider",
          label: "Integration",
          icon: "git-fork",
          open,
          setOpen,
          count: providerSel.length,
          children: (
            <>
              {searchBox({
                value: search,
                setValue: setSearch,
                placeholder: "Search integrations",
              })}
              {providerOptions.length === 0 ? (
                <div className="bb-mm-opt-empty">No integrations match “{search}”.</div>
              ) : null}
              {providerOptions.map((p) => (
                <label className="bb-mm-opt" key={p.slug}>
                  <input
                    type="checkbox"
                    checked={providerSel.includes(p.slug)}
                    onChange={() => toggle(providerSel, setProviderSel, p.slug)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
              <div className="bb-mm-pop-foot">
                <button type="button" className="bb-mm-link" onClick={() => setProviderSel([])}>
                  Clear
                </button>
                <button
                  type="button"
                  className="bb-mm-link"
                  onClick={() => setProviderSel(providerOptions.map((p) => p.slug))}
                >
                  Select all
                </button>
              </div>
            </>
          )
        })}

        {dropdown({
          id: "type",
          label: "Connection type",
          icon: "cable",
          open,
          setOpen,
          count: typeSel.length,
          children: (
            <>
              {["API", "SFTP"].map((t) => (
                <label className="bb-mm-opt" key={t}>
                  <input
                    type="checkbox"
                    checked={typeSel.includes(t)}
                    onChange={() => toggle(typeSel, setTypeSel, t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
              <div className="bb-mm-pop-foot">
                <button type="button" className="bb-mm-link" onClick={() => setTypeSel([])}>
                  Clear
                </button>
              </div>
            </>
          )
        })}

        {dropdown({
          id: "model",
          label: "Model",
          icon: "layers",
          open,
          setOpen,
          count: modelSel.length,
          children: (
            <>
              {searchBox({
                value: modelSearch,
                setValue: setModelSearch,
                placeholder: "Search models",
              })}
              {modelOptions.length === 0 ? (
                <div className="bb-mm-opt-empty">No models match “{modelSearch}”.</div>
              ) : null}
              {modelOptions.map((g) => (
                <div key={g.group}>
                  <div className="bb-mm-opt-group">{g.group}</div>
                  {g.models.map((m) => (
                    <label className="bb-mm-opt" key={m.key}>
                      <input
                        type="checkbox"
                        checked={modelSel.includes(m.key)}
                        onChange={() => toggle(modelSel, setModelSel, m.key)}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              ))}
              <div className="bb-mm-pop-foot">
                <button type="button" className="bb-mm-link" onClick={() => setModelSel([])}>
                  Clear
                </button>
                <button
                  type="button"
                  className="bb-mm-link"
                  onClick={() =>
                    setModelSel(modelOptions.flatMap((g) => g.models).map((m) => m.key))
                  }
                >
                  Select all
                </button>
              </div>
            </>
          )
        })}

        </div>

        <div className="bb-mm-bar-group">
          {dropdown({
            id: "category",
            label: (CATEGORIES.find((c) => c.key === category) || CATEGORIES[0]).label,
            icon: "table-2",
            align: "right",
            open,
            setOpen,
            count: 0,
            children: (
              <>
                {AVAILABLE.map((c) => (
                  <button
                    type="button"
                    className="bb-mm-opt bb-mm-opt-btn"
                    key={c.key}
                    data-selected={c.key === category}
                    onClick={() => {
                      setCategory(c.key);
                      setProviderSel([]);
                      setModelSel([]);
                      setOpen(null);
                    }}
                  >
                    <span className="bb-mm-tick">
                      <Icon icon="check" size={14} />
                    </span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </>
            ),
          })}

          <button type="button" className="bb-mm-btn" onClick={copyLink}>
            <Icon icon={copied ? "check" : "link"} size={15} />
          </button>
          <button type="button" className="bb-mm-btn" onClick={downloadCsv}>
            <Icon icon="download" size={15} />
          </button>
        </div>
      </div>

      <div className="bb-mm-scroll not-prose">
        {error ? (
          <div className="bb-mm-empty">No data to show.</div>
        ) : !sheet ? (
          <div className="bb-mm-loading" role="status">
            <span className="bb-mm-spinner" aria-hidden="true" />
            <span>Loading availability data…</span>
          </div>
        ) : providers.length === 0 || modelCount === 0 ? (
          <div className="bb-mm-empty">No providers or models match the current filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="bb-mm-sticky">Model</th>
                {providers.map((p) => (
                  <th className="bb-mm-prov" key={p.slug}>
                    <span className="bb-mm-prov-inner">
                      <span className="bb-mm-prov-top">
                        {p.logo ? (
                          <img
                            className="bb-mm-logo"
                            src={p.logo}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="bb-mm-prov-name" title={p.name}>
                          {p.name}
                        </span>
                      </span>
                      <span className="bb-mm-badge" data-type={p.type}>
                        {p.type}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                row.kind === "group" ? (
                  <tr className="bb-mm-group" key={"g:" + row.group}>
                    <td className="bb-mm-sticky">{row.group}</td>
                    <td colSpan={providers.length} />
                  </tr>
                ) : (
                  <tr className="bb-mm-row" key={"m:" + row.model.key}>
                    <td className="bb-mm-sticky bb-mm-model">
                      <span className="bb-mm-model-name">
                        {row.model.label}
                        {row.model.write ? (
                          <span className="bb-mm-badge" data-write="true">
                            WRITE
                          </span>
                        ) : null}
                      </span>
                    </td>
                    {providers.map((p) => (
                      <td className="bb-mm-cell" key={p.slug}>
                        {cellState(row.model.key, p.slug) === "Y" ? (
                          checkIcon()
                        ) : cellState(row.model.key, p.slug) === "B" ? (
                          <span className="bb-mm-badge" data-beta="true">
                            BETA
                          </span>
                        ) : (
                          dashMark()
                        )}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
