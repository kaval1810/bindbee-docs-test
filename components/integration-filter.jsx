/*
 * Integration Filter - search and category chips for the tables on
 * /get-started/integrations.
 *
 * This component renders NO integration data. The tables are static MDX,
 * generated from the sheet by scripts/gen-integrations.py, and this only hides
 * and shows rows that are already in the page.
 *
 * That split is deliberate. Mintlify does not server-render MDX components -
 * their output lives only inside <script> as compiled _jsx() calls - so a
 * component that rendered the list itself would take all 70 vendor names and
 * slugs out of the indexable HTML, on the one page people reach by searching a
 * vendor name. Filtering the rendered DOM keeps the content in the markup and
 * still gives search. With JS off, the full tables are simply all there.
 *
 * Contract with the generator: each category sits in
 *   <div className="bb-int-section" data-category="HRIS">
 * wrapping its H2, base-path line and table.
 */

export const IntegrationFilter = () => {
  const CATEGORIES = [
    { key: "HRIS", label: "HRIS & Payroll" },
    { key: "ATS", label: "Recruiting (ATS)" },
    { key: "LMS", label: "Learning (LMS)" },
  ];

  const CSS = `
  .bb-if {
    --bb-border: #e5e3df;
    --bb-border-strong: #d4d1cc;
    --bb-bg: #fcfcfb;
    --bb-bg-sub: #f5f4f3;
    --bb-text: #1c1b1a;
    --bb-text-dim: #6e6c68;
    --bb-accent: #f57e21;
    font-size: 14px;
    color: var(--bb-text);
    margin: 1.25rem 0 1.5rem;
  }
  html.dark .bb-if {
    --bb-border: #242424;
    --bb-border-strong: #333333;
    --bb-bg: #090909;
    --bb-bg-sub: #141414;
    --bb-text: #ededed;
    --bb-text-dim: #a1a1a1;
  }

  .bb-if-bar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .bb-if-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .bb-if-search { position: relative; display: block; width: 100%; }
  .bb-if-search input {
    box-sizing: border-box;
    width: 100%;
    height: 46px;
    padding: 0 40px 0 42px;
    border: 1px solid var(--bb-border-strong);
    border-radius: 6px;
    background: var(--bb-bg);
    color: var(--bb-text);
    font-size: 15px;
  }
  .bb-if-search input:focus { outline: none; border-color: var(--bb-accent); }
  .bb-if-search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    color: var(--bb-text-dim);
    pointer-events: none;
  }
  .bb-if-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: none;
    color: var(--bb-text-dim);
    cursor: pointer;
  }
  .bb-if-search-clear:hover { color: var(--bb-accent); background: var(--bb-bg-sub); }
  .bb-if .icon { background-color: currentColor !important; }

  .bb-if-chip {
    height: 34px;
    padding: 0 12px;
    border: 1px solid var(--bb-border-strong);
    border-radius: 4px;
    background: var(--bb-bg);
    color: var(--bb-text);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.12s ease, color 0.12s ease;
  }
  .bb-if-chip:hover { border-color: var(--bb-accent); }
  .bb-if-chip[data-active="true"] {
    border-color: var(--bb-accent);
    color: var(--bb-accent);
    font-weight: 500;
  }

  /* Row logos live in the generated tables, not in this component, but the
     tables are plain MDX with nowhere to carry styles - so their one rule
     rides along here, on the page this component is always present on.
     Every declaration is !important because Mintlify's prose layer styles
     content images as blocks with their own margins - left alone, the logo
     lands on its own line and doubles the row height. */
  img.bb-int-logo {
    display: inline-block !important;
    width: 22px !important;
    height: 22px !important;
    margin: 0 5px 0 0 !important;
    vertical-align: middle !important;
    object-fit: contain;
    border-radius: 3px;
  }

  .bb-if-status {
    margin-top: 9px;
    font-size: 12.5px;
    color: var(--bb-text-dim);
  }
  .bb-if-status a { color: var(--bb-accent); text-decoration: none; }
  .bb-if-status a:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .bb-if-search input { height: 42px; font-size: 14px; }
    .bb-if-chip { height: 32px; padding: 0 10px; font-size: 12px; }
  }
  `;

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("ALL");
  const [shown, setShown] = useState(null);

  /* Row text is read once - the tables never change after render, and reading
     textContent on every keystroke is wasted work. */
  const readRows = () => {
    if (typeof document === "undefined") return [];
    const out = [];
    document.querySelectorAll(".bb-int-section").forEach((section) => {
      const key = section.getAttribute("data-category") || "";
      section.querySelectorAll("tbody tr").forEach((tr) => {
        out.push({ tr, section, key, text: (tr.textContent || "").toLowerCase() });
      });
    });
    return out;
  };

  const [rows, setRows] = useState(null);

  useEffect(() => {
    const found = readRows();
    setRows(found);
    return () => {
      /* Leave the page as we found it on navigate-away. */
      found.forEach((r) => {
        r.tr.style.removeProperty("display");
        r.section.style.removeProperty("display");
      });
    };
  }, []);

  useEffect(() => {
    if (!rows) return;
    const q = query.trim().toLowerCase();
    const perSection = new Map();

    rows.forEach((r) => {
      const hit = (cat === "ALL" || r.key === cat) && (!q || r.text.includes(q));
      r.tr.style.display = hit ? "" : "none";
      perSection.set(r.section, (perSection.get(r.section) || 0) + (hit ? 1 : 0));
    });

    let total = 0;
    perSection.forEach((n, section) => {
      total += n;
      section.style.display = n ? "" : "none";
    });
    setShown(total);
  }, [rows, query, cat]);

  const total = rows ? rows.length : 0;

  return (
    <div className="bb-if">
      <style>{CSS}</style>

      <div className="bb-if-bar">
        <span className="bb-if-search">
          <span className="bb-if-search-icon">
            <Icon icon="search" size={17} />
          </span>
          <input
            type="text"
            value={query}
            placeholder="Search integrations or slugs"
            aria-label="Search integrations or slugs"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="bb-if-search-clear"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <Icon icon="x" size={15} />
            </button>
          ) : null}
        </span>

        <div className="bb-if-chips">
          <button
            type="button"
            className="bb-if-chip"
            data-active={cat === "ALL"}
            onClick={() => setCat("ALL")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              className="bb-if-chip"
              key={c.key}
              data-active={cat === c.key}
              onClick={() => setCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {shown === 0 ? (
        <div className="bb-if-status">
          No integration matches “{query}”. New connectors are added on request -{" "}
          <a href="mailto:support@bindbee.dev?subject=Integration request">ask Bindbee</a>.
        </div>
      ) : query || cat !== "ALL" ? (
        <div className="bb-if-status">
          Showing {shown} of {total} integrations.
        </div>
      ) : null}
    </div>
  );
};
