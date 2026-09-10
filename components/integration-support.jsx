/*
 * Integration Support - which integrations support one model, for an endpoint page.
 *
 * Reads the same "Bindbee Docs - Models Matrix" sheet as the full matrix on
 * /get-started/model-availability, so the two can never disagree.
 *
 * Usage on an operation page, under the openapi frontmatter:
 *   <IntegrationSupport category="HRIS" model="Employee" />
 *   <IntegrationSupport category="HRIS" model="Employee" direction="write" />
 *
 * The same Mintlify constraints as model-support-matrix.jsx apply, and are the
 * reason the sheet parsing is duplicated here rather than shared:
 *   1. Imports are stripped, so everything must live in this one file.
 *   2. Capitalised JSX tags resolve from MDX scope - helpers stay lowercase.
 *   3. Hooks are pre-injected by Mintlify.
 *
 * Read and write are separate tabs in the sheet - "HRIS (read)" and
 * "HRIS (write)" - so direction picks the tab rather than reinterpreting one.
 *
 * Renders nothing when the model has no row in the tab for that direction, so a
 * page can carry the tag before the sheet does: a model absent from the write
 * tab is unassessed, which is not the same answer as "nothing writes it".
 */

export const IntegrationSupport = ({
  category = "HRIS",
  model,
  direction = "read",
}) => {
  const SHEET_BASE =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTx0G0yItXlZKO4Zep8wstZuvvO7bgOxFXBVK_1vvQnxpG8H2hP9n9M8kmZMfIoo7ZO4e7_utrz3_XB/pub";

  const SHEET_GIDS = {
    HRIS: { read: "0", write: "1626747715" },
    ATS: { read: "1962490874" },
    LMS: { read: "1106223511" },
  };

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

  const parseSheet = (csv, wanted) => {
    const rows = parseCsv(csv);

    /* The "Model" cell anchors both the header row and the label column: the
       read tab carries a leading Write column and the write tab does not, so
       the labels sit in a different column in each. Matches the matrix. */
    let header = null;
    let labelCol = -1;
    rows.slice(0, 12).forEach((r) => {
      if (header) return;
      for (let i = 0; i < Math.min(r.length, 6); i++) {
        if (cell(r, i).toLowerCase() === HEADER_ROW) {
          header = r;
          labelCol = i;
          return;
        }
      }
    });

    const find = (label) =>
      rows.find((r) => cell(r, labelCol).toLowerCase() === label);
    const types = header ? find(TYPE_ROW) : null;
    const logos = header ? find(LOGO_ROW) : null;
    if (!header || !types) return null;

    /* A column is a provider only once it has both a name and A or S. */
    const providers = [];
    for (let i = labelCol + 1; i < header.length; i++) {
      const name = cell(header, i);
      const t = cell(types, i).toUpperCase();
      if (!name || (t !== "A" && t !== "S")) continue;
      providers.push({
        name,
        type: t === "S" ? "SFTP" : "API",
        col: i,
        /* Two columns can name the same vendor, so name+type is not a safe key. */
        uid: name + "#" + i,
        logo: cell(logos, i),
      });
    }

    const target = String(wanted || "").toLowerCase();
    const row = rows.find((r) => cell(r, labelCol).toLowerCase() === target);
    /*
     * No row for this model in this tab means unassessed, and silence is the
     * only safe answer - "nobody writes this" and "nobody has checked" look
     * identical on the page but only one of them is true. A model that is
     * genuinely read-only simply has no row in the write tab.
     */
    if (!providers.length || !row) return null;

    /* Sheet column order is kept so this list reads in the same order as the
       matrix page's columns. */
    const pool = providers;
    const supported = [];
    pool.forEach((p) => {
      const v = cell(row, p.col).toUpperCase();
      if (v === "Y" || v === "B") supported.push({ ...p, beta: v === "B" });
    });

    /* A model in the sheet that nothing supports yet is a real answer, not a
       gap - it gets the same treatment as an explicit N. */
    if (!supported.length) return { none: true };

    return { total: pool.length, supported };
  };

  const CSS = `
  .bb-is {
    --bb-border: #e5e3df;
    --bb-border-strong: #d4d1cc;
    --bb-bg: #fcfcfb;
    --bb-bg-sub: #f5f4f3;
    --bb-text: #1c1b1a;
    --bb-text-dim: #6e6c68;
    --bb-accent: #f57e21;
    --bb-chip: #eceae7;
    font-size: 14px;
    color: var(--bb-text);
    border: 1px solid var(--bb-border);
    border-radius: 6px;
    background: var(--bb-bg);
    margin: 1.5rem 0;
    overflow: hidden;
  }
  html.dark .bb-is {
    --bb-border: #242424;
    --bb-border-strong: #333333;
    --bb-bg: #090909;
    --bb-bg-sub: #141414;
    --bb-text: #ededed;
    --bb-text-dim: #a1a1a1;
    --bb-chip: #1b1b1b;
  }

  .bb-is-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding: 11px 14px;
    background: var(--bb-bg-sub);
    border-bottom: 1px solid var(--bb-border);
  }
  .bb-is-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 600;
    font-size: 16px;
  }
  /* Mintlify's <Icon> paints itself via a mask, so this makes it take the
     title's colour instead of staying its own. */
  .bb-is-title .icon { background-color: currentColor !important; }
  .bb-is-count {
    font-size: 12px;
    color: var(--bb-text-dim);
  }

  .bb-is-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 14px;
  }
  .bb-is-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border: 1px solid var(--bb-border);
    border-radius: 999px;
    background: var(--bb-bg-sub);
    font-size: 12.5px;
    line-height: 1.4;
    white-space: nowrap;
  }
  .bb-is-logo {
    width: 15px;
    height: 15px;
    object-fit: contain;
    border-radius: 3px;
    flex: none;
  }
  .bb-is-badge {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--bb-chip);
    color: var(--bb-text-dim);
  }
  .bb-is-badge[data-beta="true"] { color: #6d28d9; background: rgba(109, 40, 217, 0.12); }
  html.dark .bb-is-badge[data-beta="true"] { color: #b39bf5; background: rgba(139, 92, 246, 0.16); }
  .bb-is-badge[data-type="SFTP"] { color: #be185d; background: rgba(219, 39, 119, 0.12); }
  html.dark .bb-is-badge[data-type="SFTP"] { color: #f472b6; background: rgba(236, 72, 153, 0.16); }

  .bb-is-foot {
    padding: 9px 14px;
    border-top: 1px solid var(--bb-border);
    font-size: 14px;
    color: var(--bb-text-dim);
  }
  .bb-is-foot a { color: var(--bb-accent); text-decoration: none; }
  .bb-is-foot a:hover { text-decoration: underline; }

  .bb-is-none {
    padding: 16px 14px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--bb-text-dim);
  }
  .bb-is-none a { color: var(--bb-accent); text-decoration: none; }
  .bb-is-none a:hover { text-decoration: underline; }

  .bb-is-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 28px 14px;
    font-size: 12.5px;
    color: var(--bb-text-dim);
  }
  .bb-is-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--bb-border);
    border-top-color: var(--bb-accent);
    border-radius: 50%;
    animation: bb-is-spin 0.7s linear infinite;
    flex: none;
  }
  @keyframes bb-is-spin {
    to { transform: rotate(360deg); }
  }
  /* Keep a motion cue for anyone who asked for less of it, just a calmer one. */
  @media (prefers-reduced-motion: reduce) {
    .bb-is-spinner { animation-duration: 2.4s; }
  }
  `;

  const [data, setData] = useState(null);

  useEffect(() => {
    let live = true;
    /* direction picks the tab. A category with no tab for it renders nothing,
       the same silence as a model the sheet hasn't reached yet. */
    const tabs = SHEET_GIDS[category] || {};
    const gid = tabs[direction];
    if (!gid) return;
    /* The trailing timestamp makes the URL unique per load. `cache: "no-store"`
       instructs this browser only - a proxy or CDN in between can still answer
       from a saved copy, and an unseen URL defeats all of them. Google's own
       snapshot is served with `private, max-age=300`; that 5-minute floor
       stays whatever the URL says. */
    const url =
      SHEET_BASE +
      "?gid=" +
      encodeURIComponent(gid) +
      "&single=true&output=csv&_=" +
      Date.now();
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((text) => {
        if (live) setData(parseSheet(text, model) || { hide: true });
      })
      .catch(() => {
        if (live) setData({ hide: true });
      });
    return () => {
      live = false;
    };
  }, [category, model, direction]);

  /* Silent when the sheet has no row for this model, so an endpoint page can
     carry the tag before the sheet catches up. A failed fetch lands here too -
     better to show nothing than to claim nothing is supported. */
  if (data && data.hide) return null;

  const none = !!(data && data.none);
  const verb = direction === "write" ? "writing" : "reading";
  const mailto =
    "mailto:support@bindbee.dev?subject=" +
    encodeURIComponent("Integration request: " + verb + " " + model + " (" + category + ")");

  const betaCount = data && !none ? data.supported.filter((p) => p.beta).length : 0;
  const liveCount = data && !none ? data.supported.length - betaCount : 0;

  return (
    <div className="bb-is not-prose">
      <style>{CSS}</style>
      <div className="bb-is-head">
        <span className="bb-is-title">
          <Icon icon="git-fork" size={15} />
          Supported integrations
        </span>
        {data && !none ? (
          <span className="bb-is-count">
            {liveCount} {category}
            {betaCount ? " + " + betaCount + " BETA" : ""}
          </span>
        ) : null}
      </div>

      {!data ? (
        <div className="bb-is-loading" role="status">
          <span className="bb-is-spinner" aria-hidden="true" />
          <span>Loading integration support…</span>
        </div>
      ) : none ? (
        <div className="bb-is-none">
          No integration supports {verb} {model} yet.{" "}
          <a href={mailto}>Tell us which one you need</a>
        </div>
      ) : (
        <div className="bb-is-chips">
          {data.supported.map((p) => (
            <span className="bb-is-chip" key={p.uid}>
              {p.logo ? (
                <img
                  className="bb-is-logo"
                  src={p.logo}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span>{p.name}</span>
              {p.type === "SFTP" ? (
                <span className="bb-is-badge" data-type="SFTP">
                  SFTP
                </span>
              ) : null}
              {p.beta ? (
                <span className="bb-is-badge" data-beta="true">
                  BETA
                </span>
              ) : null}
            </span>
          ))}
        </div>
      )}

      <div className="bb-is-foot">
        Coverage varies by integrations {" "}
        <a href="/get-started/model-availability">See the full availability matrix</a>
      </div>
    </div>
  );
};
