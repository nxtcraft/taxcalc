// Generates long-tail landing pages for TaxCalc (tax by salary) and Gratuity (by years of service).
// All numbers come from taxcalc/js/tax.js so pages always match the calculator.
import fs from 'fs'; import vm from 'vm'; import path from 'path';
const ROOT = process.env.HOME + '/vscode-code';
const SITE = 'https://nxtcraft.github.io';
const TODAY = '2026-11-16';

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(ROOT + '/taxcalc/js/tax.js', 'utf8') + ';this.T=taxOnTaxable;', ctx);
const tax = (ti, r) => ctx.T(Math.max(0, ti), r, '2627');

const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lakhLabel = n => n >= 1e7 ? `${n / 1e7} Crore` : `${+(n / 1e5).toFixed(2)} Lakh`;
const pct = x => (Math.round(x * 10) / 10).toFixed(1) + '%';

const CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f8fafc;--card:#fff;--text:#1e293b;--muted:#64748b;--body:#374151;--line:#e2e8f0;--soft:#f1f5f9;--accent:#d97706;--hl:#fef3c7;--good:#16a34a;--blue:#1d4ed8}
[data-theme="dark"]{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--body:#cbd5e1;--line:#334155;--soft:#1e293b;--hl:#422006;--good:#4ade80;--blue:#93c5fd}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7}
nav{background:var(--accent);color:#fff;padding:.75rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}.brand{font-weight:800;text-decoration:none;color:#fff}.nav-links a{color:rgba(255,255,255,.88);font-size:.85rem;text-decoration:none;margin-left:1rem}
main{max-width:820px;margin:0 auto;padding:1.5rem 16px 2rem}.breadcrumb{font-size:.8rem;color:var(--muted);margin-bottom:1.25rem}.breadcrumb a{color:var(--muted);text-decoration:none}
h1{font-size:1.65rem;font-weight:800;margin-bottom:.5rem;line-height:1.3}.sub{color:var(--muted);margin-bottom:1.5rem}h2{font-size:1.2rem;font-weight:700;margin:2rem 0 .75rem}
p{margin-bottom:1rem;color:var(--body)}ul,ol{padding-left:1.4rem;margin-bottom:1rem}li{margin-bottom:.35rem;color:var(--body)}a{color:var(--accent)}
.answer{background:var(--card);border:2px solid var(--accent);border-radius:14px;padding:1.1rem 1.25rem;margin:1rem 0 1.5rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.9rem}
.answer div{min-width:0}.answer .k{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.answer .v{font-size:1.45rem;font-weight:800;font-variant-numeric:tabular-nums}
.tw{overflow-x:auto;margin-bottom:1.25rem}table{width:100%;border-collapse:collapse;font-size:.9rem;background:var(--card)}th,td{padding:.55rem .7rem;border:1px solid var(--line);text-align:left}th{background:var(--soft);font-weight:700}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
tr.me td{background:var(--hl);font-weight:700}.highlight{background:var(--hl);border-left:3px solid var(--accent);padding:.75rem 1rem;border-radius:0 8px 8px 0;margin-bottom:1rem}
.win{color:var(--good);font-weight:700}.cta{background:var(--accent);border-radius:12px;padding:1.25rem;text-align:center;margin:1.75rem 0}.cta p{color:#fff;margin-bottom:.6rem}.btn{display:inline-block;background:#fff;color:#b45309;padding:.6rem 1.4rem;border-radius:8px;font-weight:700;text-decoration:none}
.faq-item{border-bottom:1px solid var(--line);padding:.9rem 0}.faq-q{font-weight:700;margin-bottom:.3rem}
.chips{display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:1rem}.chips a{padding:.3rem .8rem;border-radius:20px;background:var(--card);border:1px solid var(--line);color:var(--body);font-size:.84rem;font-weight:600;text-decoration:none}.chips a.cur{background:var(--accent);color:#fff;border-color:var(--accent)}
footer{text-align:center;padding:2rem 16px;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line);margin-top:2.5rem}`;

function page({ url, title, desc, h1, sub, body, faqs, crumbs, brand, brandUrl, tool }) {
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u })) },
    faqs.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ].filter(Boolean).map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<script>!function(){try{var t=localStorage.getItem('nc_theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}}()</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-R9EW10BJGW"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-R9EW10BJGW');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article"><meta property="og:url" content="${SITE}${url}"><meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@nxtcraft">
${ld}
<style>${CSS}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9027849237070207" crossorigin="anonymous"></script>
</head>
<body>
<nav><a class="brand" href="${brandUrl}">${brand}</a><div class="nav-links"><a href="${SITE}/">All Tools</a><a href="${brandUrl}">${tool}</a></div></nav>
<main>
<div class="breadcrumb">${crumbs.map(([n, u], i) => i < crumbs.length - 1 ? `<a href="${u}">${esc(n)}</a>` : esc(n)).join(' › ')}</div>
<h1>${h1}</h1>
<p class="sub">${sub}</p>
${body}
${faqs.length ? '<h2>Frequently Asked Questions</h2>\n' + faqs.map(([q, a]) => `<div class="faq-item"><div class="faq-q">${esc(q)}</div><p>${esc(a)}</p></div>`).join('\n') : ''}
</main>
<footer><p>© 2026 <a href="${SITE}/">NxtCraft</a> — Free Online Tools. Estimates for guidance only; not tax or legal advice.</p></footer>
<script src="/assets/nc-theme.js" defer></script>
</body></html>
`;
}
const table = (head, rows, numCols = []) => `<div class="tw"><table><tr>${head.map((h, i) => `<th${numCols.includes(i) ? ' class="n"' : ''}>${h}</th>`).join('')}</tr>\n${rows.map(r => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.cells.map((c, i) => `<td${numCols.includes(i) ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('\n')}</table></div>`;
const write = (rel, html) => { const f = path.join(ROOT, rel, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

// ---------------- TaxCalc: income tax by salary ----------------
const SAL = [500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000, 1275000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 2000000, 2200000, 2400000, 2500000, 2800000, 3000000, 3500000, 4000000, 4500000, 5000000, 6000000, 7500000, 10000000];
const slug = g => g >= 1e7 ? `${g / 1e7}-crore` : `${String(+(g / 1e5).toFixed(2)).replace('.', '-')}-lakh`;
const OLD_SETS = [['80C only (₹1.5L)', 150000], ['80C + 80D ₹25K + NPS ₹50K', 225000], ['+ home loan interest ₹2L', 425000]];

function calcSalary(g) {
  const nw = tax(g - 75000, 'new');
  const old = OLD_SETS.map(([l, d]) => [l, d, tax(g - 50000 - d, 'old')]);
  let be = null; for (let d = 0; d <= 2500000; d += 5000) if (tax(g - 50000 - d, 'old').totalTax <= nw.totalTax) { be = d; break; }
  const basic = g * 0.5, epf = Math.min(basic, 1e12) * 0.12, pt = 2500;
  const inhand = (g - nw.totalTax - epf - pt) / 12;
  const ti = g - 75000, marg = (tax(ti + 10000, 'new').totalTax - nw.totalTax) / 10000 * 100;
  const npsDed = basic * 0.14, withNps = tax(g - 75000 - npsDed, 'new');
  return { g, nw, old, be, epf, pt, inhand, marg, npsDed, npsSave: nw.totalTax - withNps.totalTax };
}
const S = SAL.map(calcSalary);

S.forEach((c, i) => {
  const { g, nw } = c; const L = lakhLabel(g); const url = `/taxcalc/salary/${slug(g)}/`;
  const eff = nw.totalTax / g * 100;
  const bestOld = c.old[2][2].totalTax;
  const verdict = c.be === null ? `The new regime wins at ₹${L} unless your old-regime deductions exceed ₹25 lakh.`
    : c.be === 0 ? `Both regimes give zero tax at ₹${L}, so the new regime is simpler — no proofs or investments needed.`
    : nw.totalTax === 0 ? `You pay zero tax in the new regime, so the old regime can at best tie (it needs about ${inr(c.be)} of deductions to reach zero).`
    : `The old regime only wins if your deductions (excluding the ₹50,000 standard deduction) exceed about ${inr(c.be)}.`;
  const rows = nw.breakdown.filter(b => b.taxable > 0).map(b => ({ cells: [`${inr(b.min)} – ${b.max === Infinity ? 'above' : inr(b.max)}`, b.rate + '%', inr(b.taxable), inr(b.slabTax)] }));
  if (nw.rebate) rows.push({ cells: ['Section 87A rebate', '', '', '− ' + inr(nw.rebate)] });
  if (nw.marginalRelief) rows.push({ cells: ['Marginal relief (income just above ₹12L)', '', '', '− ' + inr(nw.marginalRelief)] });
  if (nw.surcharge) rows.push({ cells: ['Surcharge', '', '', inr(nw.surcharge)] });
  rows.push({ cells: ['Health & education cess (4%)', '', '', inr(nw.cess)] });
  rows.push({ cls: 'me', cells: ['<strong>Total tax</strong>', '', '', inr(nw.totalTax)] });
  const near = S.slice(Math.max(0, i - 3), i + 4);
  const body = `
<div class="answer"><div><div class="k">Tax (new regime)</div><div class="v">${inr(nw.totalTax)}</div></div><div><div class="k">Effective rate</div><div class="v">${pct(eff)}</div></div><div><div class="k">In-hand / month*</div><div class="v">${inr(c.inhand)}</div></div><div><div class="k">Best old regime**</div><div class="v">${inr(bestOld)}</div></div></div>
<p style="font-size:.85rem;color:var(--muted)">* After tax, employee EPF (12% of basic, basic = 50% of salary) and ₹2,500/yr professional tax. ** With ₹4.25L of deductions (80C, 80D, NPS, home loan).</p>
<div class="cta"><p>Have HRA, a home loan or employer NPS? Get your exact number.</p><a class="btn" href="/taxcalc/?gross=${g}">Calculate for ${inr(g)} →</a></div>

<h2>New Regime Tax on ₹${L}: Slab-by-Slab (FY 2026-27)</h2>
<p>Taxable income = ${inr(g)} − ₹75,000 standard deduction = <strong>${inr(g - 75000)}</strong>.</p>
${table(['Slab', 'Rate', 'Income in slab', 'Tax'], rows, [2, 3])}
${nw.marginalRelief ? `<div class="highlight">At ₹${L} you are just above the ₹12 lakh rebate limit, so <strong>marginal relief</strong> applies: your tax cannot exceed the income above ₹12 lakh (${inr(g - 75000 - 1200000)}). That saves you ${inr(nw.marginalRelief)}.</div>` : ''}
<p>Your marginal rate is about <strong>${pct(c.marg)}</strong> — the tax on each extra ₹100 you earn${c.marg > 40 ? ' (high because marginal relief is being withdrawn)' : ''}.</p>

<h2>Old Regime vs New Regime at ₹${L}</h2>
${table(['Old-regime deductions', 'Old regime tax', 'New regime tax'], c.old.map(([l, d, t]) => ({ cells: [`${l} — ${inr(d)}`, t.totalTax < nw.totalTax ? `<span class="win">${inr(t.totalTax)} ✓</span>` : inr(t.totalTax), t.totalTax < nw.totalTax ? inr(nw.totalTax) : `<span class="win">${inr(nw.totalTax)} ✓</span>`] })), [1, 2])}
<div class="highlight"><strong>Verdict:</strong> ${verdict}</div>

<h2>Monthly In-Hand Salary on ₹${L}</h2>
${table(['Component', 'Yearly', 'Monthly'], [
    { cells: ['Gross salary', inr(g), inr(g / 12)] },
    { cells: ['Income tax (new regime)', '− ' + inr(nw.totalTax), '− ' + inr(nw.totalTax / 12)] },
    { cells: ['Employee EPF (12% of basic)', '− ' + inr(c.epf), '− ' + inr(c.epf / 12)] },
    { cells: ['Professional tax (most states)', '− ' + inr(c.pt), '− ' + inr(c.pt / 12)] },
    { cls: 'me', cells: ['In-hand', inr(c.inhand * 12), inr(c.inhand)] }], [1, 2])}
<p>Assumes basic pay is 50% of salary, which the new Labour Codes require for most employers. If your EPF is capped at ₹1,800/month, in-hand will be higher. <a href="/taxcalc/take-home/">Take-home calculator →</a></p>

<h2>How to Pay Less Tax on ₹${L}</h2>
<ul>
<li><strong>Employer NPS (80CCD(2)):</strong> ask HR to route 14% of basic (${inr(c.npsDed)}/yr) to NPS. It is deductible even in the new regime and would cut your tax by about <strong>${inr(c.npsSave)}</strong>.</li>
<li><strong>Check the old regime</strong> if you pay rent in a metro and have a home loan — enter both in the <a href="/taxcalc/?gross=${g}">calculator</a>.</li>
<li><strong>Claim HRA and LTA only under the old regime</strong>; they are not available in the new one. <a href="/taxcalc/hra/">HRA calculator →</a></li>
</ul>

<h2>Tax at Nearby Salaries</h2>
${table(['Salary', 'New regime tax', 'In-hand / month'], near.map(n => ({ cls: n.g === g ? 'me' : '', cells: [n.g === g ? inr(n.g) : `<a href="/taxcalc/salary/${slug(n.g)}/">${inr(n.g)}</a>`, inr(n.nw.totalTax), inr(n.inhand)] })), [1, 2])}
<p><a href="/taxcalc/salary/">See tax for every salary from ₹5 lakh to ₹1 crore →</a> · <a href="/taxcalc/guide/">Old vs new regime guide →</a></p>`;
  const faqs = [
    [`How much income tax is payable on ₹${L} salary in FY 2026-27?`, `Under the new regime, tax on ₹${L} salary is ${inr(nw.totalTax)} (effective ${pct(eff)}), after the ₹75,000 standard deduction${nw.rebate ? ' and the Section 87A rebate' : ''}${nw.marginalRelief ? ' and marginal relief' : ''}, including 4% cess. Under the old regime with ₹4.25 lakh of deductions it is ${inr(bestOld)}.`],
    [`What is the in-hand salary for ₹${L} per annum?`, `Roughly ${inr(c.inhand)} per month after new-regime tax, 12% employee EPF on a basic of 50% and ₹2,500 a year professional tax.`],
    [`Which tax regime is better for ₹${L} salary?`, verdict],
  ];
  if (g <= 1275000) faqs.push([`Is ₹${L} salary tax-free in FY 2026-27?`, nw.totalTax === 0 ? `Yes. Taxable income after the ₹75,000 standard deduction is ${inr(g - 75000)}, which is within the ₹12 lakh limit for the full Section 87A rebate, so new-regime tax is zero.` : `No.`]);
  write(`taxcalc/salary/${slug(g)}`, page({
    url, brand: '💰 TaxCalc', brandUrl: '/taxcalc/', tool: 'Calculator',
    title: `Income Tax on ₹${L} Salary FY 2026-27 — New vs Old`,
    desc: `Tax on ₹${L} salary in FY 2026-27: ${inr(nw.totalTax)} in the new regime (${pct(eff)}). Slab-wise breakdown, old vs new comparison and monthly in-hand of ${inr(c.inhand)}.`,
    h1: `Income Tax on ₹${L} Salary — FY 2026-27`,
    sub: `New vs old regime, slab-wise calculation and in-hand salary for ${inr(g)} a year, under Budget 2026 rules (Tax Year 2026-27).`,
    body, faqs, crumbs: [['Home', '/'], ['TaxCalc', '/taxcalc/'], ['Tax by Salary', '/taxcalc/salary/'], [`₹${L}`, url]],
  }));
});

// TaxCalc hub
write('taxcalc/salary', page({
  url: '/taxcalc/salary/', brand: '💰 TaxCalc', brandUrl: '/taxcalc/', tool: 'Calculator',
  title: 'Income Tax by Salary FY 2026-27 — ₹5 Lakh to ₹1 Crore',
  desc: 'Income tax for every salary from ₹5 lakh to ₹1 crore in FY 2026-27: new vs old regime tax, effective rate and monthly in-hand salary in one table.',
  h1: 'Income Tax by Salary — FY 2026-27 Table',
  sub: 'Tax under the new and old regimes, effective rate and monthly in-hand for common salaries, under Budget 2026 rules. Click a salary for the full breakdown.',
  body: `<div class="cta"><p>Your salary isn't listed? Enter any amount.</p><a class="btn" href="/taxcalc/">Open Tax Calculator →</a></div>
${table(['Salary', 'New regime', 'Effective', 'Old regime*', 'In-hand / month'], S.map(c => ({ cells: [`<a href="/taxcalc/salary/${slug(c.g)}/">${inr(c.g)}</a>`, inr(c.nw.totalTax), pct(c.nw.totalTax / c.g * 100), inr(c.old[2][2].totalTax), inr(c.inhand)] })), [1, 2, 3, 4])}
<p style="font-size:.85rem;color:var(--muted)">* Old regime with ₹4.25 lakh of deductions (80C ₹1.5L, 80D ₹25K, NPS ₹50K, home loan interest ₹2L). In-hand assumes basic = 50% of salary, 12% employee EPF and ₹2,500 professional tax.</p>
<div class="highlight">Salary up to <strong>₹12.75 lakh</strong> is tax-free in the new regime for FY 2026-27. Between ₹12.75L and about ₹13.5L, marginal relief keeps the tax small.</div>`,
  faqs: [['Up to what salary is there no income tax in FY 2026-27?', 'Under the new regime, salary up to ₹12.75 lakh pays no income tax: the ₹75,000 standard deduction brings taxable income to ₹12 lakh, which is fully covered by the ₹60,000 Section 87A rebate.'],
    ['Did Budget 2026 change the tax slabs?', 'No. FY 2026-27 uses the same new-regime slabs as FY 2025-26: 0% up to ₹4L, 5% to ₹8L, 10% to ₹12L, 15% to ₹16L, 20% to ₹20L, 25% to ₹24L and 30% above.']],
  crumbs: [['Home', '/'], ['TaxCalc', '/taxcalc/'], ['Tax by Salary', '/taxcalc/salary/']],
}));

// ---------------- Gratuity: by years of service ----------------
const YRS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30];
const BASICS = [15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 150000, 200000];
const CAP = 2000000;
const grat = (b, y, div = 26) => b * 15 / div * y;
YRS.forEach((y, i) => {
  const url = `/gratuity/years/${y}-year${y > 1 ? 's' : ''}/`; const yl = `${y} Year${y > 1 ? 's' : ''}`;
  const perm = y >= 5;
  const capBasic = CAP * 26 / (15 * y);
  const rows = BASICS.map(b => { const a = grat(b, y), n = grat(b, y, 30); return { cells: [inr(b), inr(a), inr(n), a > CAP ? `${inr(CAP)} (taxable ${inr(a - CAP)})` : 'Fully tax-free'] }; });
  const near = YRS.slice(Math.max(0, i - 3), i + 4);
  const elig = perm
    ? `<div class="highlight"><strong>Eligible.</strong> Permanent employees qualify for gratuity after 5 years of continuous service, so ${y} years qualifies. Fixed-term contract employees qualify too (after 1 year).</div>`
    : `<div class="highlight"><strong>Permanent employees: not yet eligible</strong> — the Payment of Gratuity Act and the Code on Social Security require 5 years of continuous service (except on death or disability)${y === 4 ? '. Some High Courts have counted 4 years and 240 working days in the fifth year as 5 years — if you are close, check with your employer or a labour lawyer' : ''}.<br><strong>Fixed-term contract employees: eligible.</strong> Since 21 Nov 2025, the Code on Social Security gives fixed-term employees pro-rata gratuity after 1 year, so the amounts below apply to them.</div>`;
  const body = `${elig}
<p><strong>Formula:</strong> Gratuity = last drawn (Basic + DA) × 15 / 26 × years of service. For ${y} year${y > 1 ? 's' : ''}: Basic + DA × <strong>${(15 * y / 26).toFixed(3)}</strong>. ${perm ? `A final part-year of 6 months or more counts as a full year, so ${y} years 6 months is paid as ${y + 1} years.` : ''}</p>
<div class="cta"><p>Enter your exact Basic + DA and service period.</p><a class="btn" href="/gratuity/?years=${y}${perm ? '' : '&type=fixed'}">Calculate gratuity for ${yl} →</a></div>
<h2>Gratuity for ${yl} by Monthly Basic + DA</h2>
${table(['Basic + DA / month', 'Gratuity (Act applies)', 'Not covered by Act (÷30)', 'Tax (private sector)'], rows, [1, 2])}
<p>"Act applies" means the employer has 10 or more employees. Smaller employers that pay gratuity voluntarily often use 30 days instead of 26. Government employees' gratuity is fully tax-free.</p>
<h2>When Does the ₹20 Lakh Tax-Free Limit Kick In?</h2>
<p>For private-sector employees, gratuity up to <strong>₹20 lakh</strong> over a career is tax-free. With ${yl} of service, you reach that limit at a Basic + DA of about <strong>${inr(capBasic)}/month</strong>. Anything above is added to your income and taxed at your slab rate.</p>
<h2>New Labour Code Changes (2025)</h2>
<ul>
<li><strong>Fixed-term employees</strong> get pro-rata gratuity after 1 year instead of 5.</li>
<li><strong>Wages:</strong> if allowances exceed 50% of total pay, the excess is added to Basic + DA for gratuity — so many people's gratuity goes up.</li>
<li><strong>Payment</strong> must be made within 30 days of leaving, or interest is payable.</li>
</ul>
<h2>Gratuity for Other Service Periods</h2>
<div class="chips">${near.map(n => `<a${n === y ? ' class="cur"' : ''} href="/gratuity/years/${n}-year${n > 1 ? 's' : ''}/">${n} yr${n > 1 ? 's' : ''}</a>`).join('')}</div>
<p><a href="/gratuity/years/">Gratuity table for every service period →</a> · <a href="/gratuity/guide/">Gratuity rules guide →</a> · <a href="/gratuity/fnf/">Full &amp; final settlement calculator →</a></p>`;
  const ex = 30000;
  const faqs = [
    [`How much gratuity will I get for ${yl} of service?`, `Gratuity = Basic + DA × 15/26 × ${y}. For example, with a last drawn Basic + DA of ${inr(ex)}/month, gratuity for ${yl} is ${inr(grat(ex, y))}${perm ? '' : ' — payable to fixed-term contract employees; permanent employees need 5 years'}.`],
    [`Am I eligible for gratuity after ${yl}?`, perm ? `Yes. ${y} years meets the 5-year minimum for permanent employees, and fixed-term employees qualify after 1 year.` : `Permanent employees need 5 years of continuous service, so ${yl} does not qualify unless the exit is due to death or disability. Fixed-term contract employees qualify for pro-rata gratuity after 1 year under the Code on Social Security (in force since 21 Nov 2025).`],
    [`Is gratuity for ${yl} taxable?`, `For private-sector employees, gratuity up to ₹20 lakh is tax-free. With ${yl} of service you only exceed that if your Basic + DA is above about ${inr(capBasic)} a month. Government employees' gratuity is fully exempt.`],
  ];
  write(`gratuity/years/${y}-year${y > 1 ? 's' : ''}`, page({
    url, brand: '🎁 Gratuity Calculator', brandUrl: '/gratuity/', tool: 'Calculator',
    title: `Gratuity for ${yl} of Service — Amount Table (2026)`,
    desc: `Gratuity for ${yl} of service: ${perm ? 'eligible' : 'eligibility for permanent vs fixed-term employees'}, formula and amounts for Basic + DA from ₹15,000 to ₹2 lakh. Updated for the 2025 Labour Codes.`,
    h1: `Gratuity for ${yl} of Service — Calculation &amp; Table`,
    sub: `Eligibility, formula and gratuity amounts for ${y} year${y > 1 ? "s" : ""} of service, updated for the Code on Social Security (2025) and the ₹20 lakh tax-free limit.`,
    body, faqs, crumbs: [['Home', '/'], ['Gratuity', '/gratuity/'], ['By Years', '/gratuity/years/'], [yl, url]],
  }));
});
write('gratuity/years', page({
  url: '/gratuity/years/', brand: '🎁 Gratuity Calculator', brandUrl: '/gratuity/', tool: 'Calculator',
  title: 'Gratuity Table by Years of Service — 1 to 30 Years (2026)',
  desc: 'Gratuity amount for 1 to 30 years of service at common Basic + DA levels. Covers 5-year eligibility, fixed-term 1-year rule (Labour Codes 2025) and ₹20 lakh tax-free limit.',
  h1: 'Gratuity Table by Years of Service',
  sub: 'Gratuity for 1–30 years at common monthly Basic + DA, using 15/26 × years. Rows under 5 years apply to fixed-term contract employees only.',
  body: `<div class="cta"><p>Enter your exact salary and service.</p><a class="btn" href="/gratuity/">Open Gratuity Calculator →</a></div>
${table(['Years', ...[20000, 30000, 50000, 75000, 100000].map(b => inr(b))], YRS.map(y => ({ cells: [`<a href="/gratuity/years/${y}-year${y > 1 ? 's' : ''}/">${y} yr${y > 1 ? 's' : ''}${y < 5 ? ' †' : ''}</a>`, ...[20000, 30000, 50000, 75000, 100000].map(b => inr(grat(b, y)))] })), [1, 2, 3, 4, 5])}
<p style="font-size:.85rem;color:var(--muted)">Column headings are monthly Basic + DA. † Under 5 years: payable to fixed-term contract employees (pro-rata after 1 year) and on death or disability; permanent employees need 5 years.</p>
<div class="highlight">Private-sector gratuity is tax-free up to <strong>₹20 lakh</strong>; government employees' gratuity is fully exempt.</div>`,
  faqs: [['What is the formula for gratuity?', 'Gratuity = last drawn Basic + DA × 15/26 × completed years of service, where a final part-year of 6 months or more counts as a full year. Employers not covered by the Act often use 30 instead of 26.'],
    ['Who gets gratuity after 1 year?', 'Fixed-term contract employees, under the Code on Social Security, 2020 (in force since 21 Nov 2025). Permanent employees still need 5 years of continuous service.']],
  crumbs: [['Home', '/'], ['Gratuity', '/gratuity/'], ['By Years', '/gratuity/years/']],
}));

const urls = [...S.map(c => `/taxcalc/salary/${slug(c.g)}/`), '/taxcalc/salary/', ...YRS.map(y => `/gratuity/years/${y}-year${y > 1 ? 's' : ''}/`), '/gratuity/years/'];
fs.writeFileSync(process.env.OUT || 'urls.json', JSON.stringify(urls));
console.log('pages', urls.length);
