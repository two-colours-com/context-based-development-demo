// Brain Stolarni Dąb w przeglądarce: rama, router po adresie, ekrany i odświeżanie na żywo.
// Cała baza przychodzi z /api/baza, a każdy ekran liczy się od nowa z tych danych.
// Ekran zapisuje tylko zmiany szansy (przez serwer). Resztę zmienia agent w plikach.

const $ = (id) => document.getElementById(id);
const state = { db: {}, prev: {}, flash: new Set(), own: new Map(), drafts: new Map(), path: null, query: '' };

/* ---- Pomocnicze ---- */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const day = (iso) => String(iso ?? '').slice(0, 10);
// Formatery zwracają gotowy fragment HTML, więc same escapują wartości z plików (w polu daty może być dowolny tekst).
const fmtDate = (iso) => (iso ? esc(day(iso).split('-').reverse().join('.')) : '-');
const fmtStamp = (iso) => (String(iso ?? '').length > 10 ? `${fmtDate(iso)}, ${esc(String(iso).slice(11, 16))}` : fmtDate(iso));
const fmtLong = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = day(iso).split('-').map(Number);
  return esc(`${d} ${MONTHS[m - 1] ?? ''} ${y}`);
};
const money = (n) => (n == null ? '-' : esc(`${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} zł`));
const plural = (n, one, few, many) => (n === 1 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');
const initials = (name) => String(name ?? '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const avatar = (name, cls = '') => `<span class="avatar ${cls}">${esc(initials(name))}</span>`;

const ICONS = {
  dzis: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  szanse: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  organizacje: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  osoba: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  uwaga: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  telefon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  agent: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/>',
  wstecz: '<path d="m12 19-7-7 7-7M19 12H5"/>',
};
const icon = (name) => `<svg class="i" viewBox="0 0 24 24">${ICONS[name] ?? ''}</svg>`;

/* ---- Dostęp do danych ---- */

const list = (k) => (Array.isArray(state.db[k]) ? state.db[k] : []);
const find = (k, id) => (id == null ? null : (list(k).find((r) => r.id === id) ?? null));
const demo = () => (state.db.demo && !state.db.demo.blad ? state.db.demo : {});
// „Dziś” jest zamrożone w data/demo.json (dzień pokazu), żeby „Na dziś” zawsze wyglądało tak samo.
const today = () => demo().dzis ?? new Date().toLocaleDateString('sv-SE');
const me = () => demo().biezacy_uzytkownik ?? null;
const statuses = () => (Array.isArray(demo().statusy) ? demo().statusy : []);
const status = (id) => statuses().find((s) => s.id === id) ?? { id, nazwa: id ?? '-', kolor: '#737373', sekcja: 'aktywne' };
const isOpen = (s) => status(s.status).sekcja !== 'zamkniete';
const badge = (id) => `<span class="st-badge" style="--c:${esc(status(id).kolor)}">${esc(status(id).nazwa)}</span>`;
const users = () => list('uzytkownicy');
const userName = (id) => users().find((u) => u.id === id)?.imie_nazwisko ?? null;
const PRIORITIES = [['wysoki', 'Wysoki'], ['sredni', 'Średni'], ['niski', 'Niski']];
const prioName = (id) => PRIORITIES.find(([p]) => p === id)?.[1] ?? 'bez priorytetu';
const byDate = (a, b) => String(a?.data ?? '').localeCompare(String(b?.data ?? ''));
const dealsOf = (orgId) => list('szanse').filter((s) => !s.blad && s.organizacja === orgId);
const isPrivate = (o) => o?.typ === 'osoba prywatna';
// Podpis klienta w wierszu: firma z osobą kontaktową albo osoba prywatna.
const clientLine = (o) => (!o ? 'brak klienta' : isPrivate(o) ? `${o.nazwa} · osoba prywatna` : [o.nazwa, o.osoba_kontaktowa?.imie_nazwisko].filter(Boolean).join(' · '));

/* ---- Mignięcie rekordu, który przed chwilą zmienił się na dysku ---- */

const fl = (key) => (state.flash.has(key) ? ' flash' : '');
const before = (col, id) => {
  if (!state.flash.has(`${col}/${id}`)) return null;
  return (Array.isArray(state.prev[col]) ? state.prev[col] : []).find((r) => r.id === id) ?? {};
};
function changedFields(col, id) {
  const old = before(col, id);
  if (!old) return new Set();
  const now = find(col, id) ?? {};
  return new Set(Object.keys({ ...old, ...now }).filter((k) => JSON.stringify(old[k]) !== JSON.stringify(now[k])));
}
// Wpisy (aktywność, historia), których nie było przed ostatnią zmianą pliku.
function newEntries(col, id, ...fields) {
  const old = before(col, id);
  if (!old) return () => false;
  const seen = new Set(fields.flatMap((f) => (Array.isArray(old[f]) ? old[f] : [])).map((x) => JSON.stringify(x)));
  return (x) => !seen.has(JSON.stringify(x));
}

/* ---- Wspólne kawałki ekranów ---- */

const head = (title, sub) => `<header class="screen-head"><h1>${esc(title)}</h1>${sub ? `<p class="muted">${esc(sub)}</p>` : ''}</header>`;
const box = (title, count, body, cls = '') =>
  `<section class="box${cls}"><div class="box-head"><h2>${esc(title)}</h2>${count == null ? '' : `<span class="count">${count}</span>`}</div>${body}</section>`;
const empty = (text) => `<div class="empty-screen">${esc(text)}</div>`;
const back = (href, label) => `<a class="back" href="${esc(href)}">${icon('wstecz')} ${esc(label)}</a>`;
const broken = (r) => `<li class="row broken"><span class="id mono">${esc(r.id)}</span> Ten rekord ma błąd w danych.</li>`;
const fieldsList = (rows) =>
  `<dl class="fields">${rows.filter(([, v]) => v != null && v !== '').map(([k, v, hot]) => `<dt>${esc(k)}</dt><dd class="${hot ? 'flash' : ''}">${v}</dd>`).join('')}</dl>`;
const orgLink = (o) => (o ? `<a class="lnk" href="/organizacje/${esc(o.id)}">${esc(o.nazwa)}</a>` : 'brak klienta');

function overdue(s) {
  if (!isOpen(s) || !s.data) return '';
  const n = Math.round((Date.parse(today()) - Date.parse(day(s.data))) / 864e5);
  return n > 0 ? `<span class="warn">${icon('uwaga')}${n} ${plural(n, 'dzień', 'dni', 'dni')} po terminie</span>` : '';
}

function personBox(o, hot) {
  const p = o?.osoba_kontaktowa;
  if (!p) return '';
  return box('Osoba kontaktowa', null, `<div class="person">
    <div class="person-top">${avatar(p.imie_nazwisko)}<span class="person-name">${esc(p.imie_nazwisko)}</span>${p.stanowisko ? `<span class="tag">${esc(p.stanowisko)}</span>` : ''}</div>
    ${p.telefon ? `<p class="person-line">${icon('telefon')} ${esc(p.telefon)}</p>` : ''}${p.email ? `<p class="person-line">${icon('mail')} ${esc(p.email)}</p>` : ''}</div>`, hot ? ' flash' : '');
}

// Kontrolki szansy: każda zmiana od razu idzie do pliku (PATCH), a serwer dopisuje ślad w aktywności.
const opt = (value, label, current) => `<option value="${esc(value)}"${value === (current ?? '') ? ' selected' : ''}>${esc(label)}</option>`;
// Stałe `id` pola: render() oddaje mu fokus po przerysowaniu.
const patchAttr = (s, field) => `id="pole-szanse-${esc(s.id)}-${field}" data-patch="${esc(s.id)}" data-field="${field}"`;
const statusSelect = (s) =>
  `<select class="sel status-sel" style="--c:${esc(status(s.status).kolor)}" ${patchAttr(s, 'status')} aria-label="Status">${statuses().map((x) => opt(x.id, x.nazwa, s.status)).join('')}</select>`;
const prioSelect = (s) =>
  `<select class="sel prio p-${esc(s.priorytet ?? 'brak')}" ${patchAttr(s, 'priorytet')} aria-label="Priorytet">${opt('', 'bez priorytetu', s.priorytet)}${PRIORITIES.map(([id, n]) => opt(id, n, s.priorytet)).join('')}</select>`;
const dateInput = (s) => `<input class="sel" type="date" value="${esc(s.data ?? '')}" ${patchAttr(s, 'data')} aria-label="Termin">`;
const ownerSelect = (s) =>
  `<select class="sel" ${patchAttr(s, 'uzytkownik')} aria-label="Opiekun">${opt('', 'bez opiekuna', s.uzytkownik)}${users().map((u) => opt(u.id, u.imie_nazwisko, s.uzytkownik)).join('')}</select>`;
const takeButton = (s) => `<button type="button" class="btn primary" data-take="${esc(s.id)}">Przejmij</button>`;

/* ---- Na dziś ---- */

function viewToday() {
  const t = today();
  const open = list('szanse').filter((s) => !s.blad && isOpen(s)).sort(byDate);
  const mine = open.filter((s) => s.uzytkownik === me());
  return `${head('Na dziś', `Dziś jest ${fmtLong(t)}. Sprawa wraca tutaj w dniu swojego terminu.`)}
    <p class="eyebrow">Moje zadania</p>
    ${todaySection('Do zrobienia', 'Twoje sprawy z terminem na dziś i wcześniej.', mine.filter((s) => !s.data || s.data <= t))}
    ${todaySection('Przyszłe', 'Twoje sprawy z terminem w kolejnych dniach. Wrócą tu same.', mine.filter((s) => s.data > t))}
    ${todaySection('Nieprzypisane', 'Sprawy bez opiekuna. Widzą je wszyscy, dopóki ktoś ich nie weźmie.', open.filter((s) => !s.uzytkownik), true)}`;
}

function todaySection(title, sub, deals, pool = false) {
  const cls = `today-row${pool ? ' pool' : ''}`;
  const rows = deals.map(
    (s) => `<li class="${cls}${fl(`szanse/${s.id}`)}">
      <a class="today-main" href="/szanse/${esc(s.id)}"><span class="id mono">${esc(s.id)}</span><span class="main-col">
        <span class="title-line"><span class="title">${esc(s.nazwa)}</span>${overdue(s)}</span><span class="sub">${esc(clientLine(find('organizacje', s.organizacja)))}</span></span></a>
      ${statusSelect(s)}${prioSelect(s)}${dateInput(s)}${ownerSelect(s)}${pool ? takeButton(s) : ''}
    </li>`,
  );
  const cols = `<div class="${cls} cols"><span></span><span>Status</span><span>Priorytet</span><span>Termin</span><span>Opiekun</span>${pool ? '<span></span>' : ''}</div>`;
  return `<section class="box"><div class="box-head"><div><h2>${title}</h2><p class="muted xs">${sub}</p></div><span class="count">${deals.length}</span></div>
    ${deals.length ? `${cols}<ul class="rows">${rows.join('')}</ul>` : ''}</section>`;
}

/* ---- Szanse ---- */

function viewDeals() {
  const all = list('szanse');
  const open = all.filter((s) => s.blad || isOpen(s)).sort(byDate);
  const closed = all.filter((s) => !s.blad && !isOpen(s)).sort((a, b) => byDate(b, a));
  return `${head('Szanse', `${all.length} ${plural(all.length, 'szansa', 'szanse', 'szans')}, ${open.length} w grze.`)}
    <input class="inp search" id="szukaj" type="search" autocomplete="off" placeholder="Szukaj po numerze, nazwie albo kliencie" value="${esc(state.query)}">
    ${box('W grze', open.length, dealRows(open))}${box('Zamknięte', closed.length, dealRows(closed))}`;
}

function dealRows(deals) {
  const q = norm(state.query).trim();
  const rows = deals.map((s) => {
    if (s.blad) return broken(s);
    const o = find('organizacje', s.organizacja);
    const hay = norm([s.id, s.nazwa, o?.nazwa, o?.osoba_kontaktowa?.imie_nazwisko].join(' '));
    return `<li data-q="${esc(hay)}"${hay.includes(q) ? '' : ' hidden'}><a class="row${fl(`szanse/${s.id}`)}" href="/szanse/${esc(s.id)}">
      <span class="id mono">${esc(s.id)}</span><span class="main-col"><span class="title">${esc(s.nazwa)}</span><span class="sub">${esc(clientLine(o))}</span></span>
      <span class="cell c-status">${badge(s.status)}</span><span class="cell c-date">${fmtDate(s.data)} ${overdue(s)}</span>
      <span class="cell c-user muted">${esc(userName(s.uzytkownik) ?? 'bez opiekuna')}</span><span class="cell money">${money(s.wartosc)}</span></a></li>`;
  });
  return `<ul class="rows">${rows.join('') || '<li class="box-empty">Brak szans.</li>'}</ul>`;
}

function viewDeal(id) {
  const s = find('szanse', id);
  if (!s || s.blad) return `${back('/szanse', 'Szanse')}${empty(s ? `Szansa ${id} ma błąd w danych.` : `Szansa ${id} nie istnieje.`)}`;
  const o = find('organizacje', s.organizacja);
  const chg = changedFields('szanse', s.id);
  const hot = (f) => (chg.has(f) ? ' flash' : '');
  return `<div class="cshell">
    <div class="cs-main">
      <div class="cs-head">
        <nav class="crumbs"><a href="/szanse">${icon('wstecz')} Szanse</a><span>/</span><span class="mono">${esc(s.id)}</span>${badge(s.status)}</nav>
        <h1 class="cs-title${hot('nazwa')}">${esc(s.nazwa)}</h1>
        <p class="cs-sub${hot('organizacja')}">${icon(isPrivate(o) ? 'osoba' : 'organizacje')} ${orgLink(o)}${isPrivate(o) ? ' · osoba prywatna' : ''}</p>
      </div>
      <div class="cs-data">
        <div class="fields-grid">
          <label class="fld${hot('status')}"><span class="fld-label">Status</span>${statusSelect(s)}</label>
          <label class="fld${hot('priorytet')}"><span class="fld-label">Priorytet</span>${prioSelect(s)}</label>
          <div class="fld${hot('uzytkownik')}"><span class="fld-label">Opiekun</span><div class="fld-row">${ownerSelect(s)}${s.uzytkownik === me() ? '' : takeButton(s)}</div></div>
          <label class="fld${hot('data')}"><span class="fld-label">Termin następnego kroku</span>${dateInput(s)}${overdue(s)}</label>
        </div>
        ${box('Dane', null, fieldsList([
          ['Wartość netto', money(s.wartosc), chg.has('wartosc')],
          ['Klient', o ? `${orgLink(o)} <span class="muted">${esc(o.id)}, ${esc(o.typ ?? '')}</span>` : 'brak klienta', chg.has('organizacja')],
          ['Utworzono', fmtLong(s.utworzono)],
          ['W statusie od', fmtLong(Array.isArray(s.historia) ? s.historia.at(-1)?.data : s.utworzono), chg.has('historia')],
        ]))}
        ${personBox(o, state.flash.has(`organizacje/${o?.id}`))}
      </div>
    </div>
    <aside class="cs-aside">
      <div class="cs-aside-head"><span class="cs-label">Aktywność</span><span class="cs-hint">najstarsze u góry</span></div>
      <div class="cs-scroll" data-scroll="aktywnosc" data-bottom>${timeline(s)}</div>
      <form class="cs-foot" data-comment="${esc(s.id)}">${avatar(userName(me()))}<div class="grow">
        <textarea class="textarea" id="komentarz-${esc(s.id)}" maxlength="5000" placeholder="Dopisz, co się w sprawie stało.">${esc(state.drafts.get(`komentarz-${s.id}`) ?? '')}</textarea>
        <div class="foot-row"><button class="btn primary">Dodaj komentarz</button></div></div></form>
    </aside>
  </div>`;
}

// Oś czasu: najstarsze u góry. Wpisy osób i agenta z `aktywnosc`, zmiany statusu z `historia` jako wpisy systemowe.
function timeline(s) {
  const fresh = newEntries('szanse', s.id, 'aktywnosc', 'historia');
  const akt = Array.isArray(s.aktywnosc) ? s.aktywnosc : [];
  const hist = Array.isArray(s.historia) ? s.historia : [];
  // Zmiana statusu z ekranu ma już wpis osoby („zmiana”), więc ten krok historii nie powtarza się jako „System”.
  const covered = new Set(akt.flatMap((a) => (a.typ === 'zmiana' && Array.isArray(a.zmiany) ? a.zmiany : []).filter((c) => c.pole === 'status').map((c) => `${a.data}|${c.po}`)));
  const entries = [
    ...hist.map((h, i) => ({ data: h.data, html: covered.has(`${h.data}|${h.status}`) ? '' : systemEntry(h, hist[i - 1], fresh(h)) })),
    ...akt.map((a) => ({ data: a.data, html: activityEntry(a, fresh(a)) })),
  ].filter((e) => e.html);
  entries.sort(byDate);
  return entries.length ? `<ol class="tl">${entries.map((e) => e.html).join('')}</ol>` : '<p class="box-empty">Nic się tu jeszcze nie wydarzyło.</p>';
}

const systemEntry = (h, prev, fresh) => `<li class="${fresh ? 'flash' : ''}"><span class="avatar sys">SYS</span><div class="tl-body">
  <div class="tl-meta"><span class="tl-who">System</span><span>${fmtStamp(h.data)}</span></div>
  <p class="tl-changes">${prev ? `Status: <span class="was">${badge(prev.status)}</span> → ${badge(h.status)}` : `Utworzono ze statusem ${badge(h.status)}`}</p></div></li>`;

const TYPES = { notatka: 'notatka', telefon: 'telefon', spotkanie: 'spotkanie', mail: 'e-mail', zmiana: 'zmiana' };
const FIELDS = { status: 'Status', priorytet: 'Priorytet', uzytkownik: 'Opiekun', data: 'Termin' };

function activityEntry(a, fresh) {
  const agent = a.autor === 'agent';
  const name = agent ? 'Agent' : (userName(a.autor) ?? a.autor ?? '-');
  const show = (pole, v) =>
    pole === 'status' ? badge(v) : pole === 'uzytkownik' ? esc(userName(v) ?? 'bez opiekuna') : pole === 'data' ? fmtDate(v) : pole === 'priorytet' ? esc(prioName(v)) : esc(v ?? '-');
  const body =
    a.typ === 'zmiana'
      ? `<ul class="tl-changes">${(Array.isArray(a.zmiany) ? a.zmiany : []).map((c) => `<li><span class="muted">${esc(FIELDS[c.pole] ?? c.pole)}:</span> <span class="was">${show(c.pole, c.przed)}</span> → ${show(c.pole, c.po)}</li>`).join('')}</ul>`
      : `<p class="tl-text">${esc(a.tresc)}</p>`;
  return `<li class="${fresh ? 'flash' : ''}">${agent ? `<span class="avatar bot">${icon('agent')}</span>` : avatar(name)}<div class="tl-body">
    <div class="tl-meta"><span class="tl-who">${esc(name)}</span>${agent ? '<span class="pill agent">przez agenta</span>' : ''}<span class="pill">${esc(TYPES[a.typ] ?? a.typ)}</span><span>${fmtStamp(a.data)}</span></div>
    ${body}</div></li>`;
}

/* ---- Organizacje (tylko do odczytu) ---- */

function viewOrgs() {
  const all = list('organizacje');
  const rows = all.map((o) => {
    if (o.blad) return broken(o);
    const n = dealsOf(o.id).length;
    const sub = isPrivate(o) ? 'osoba prywatna' : [o.branza, o.osoba_kontaktowa?.imie_nazwisko].filter(Boolean).join(' · ');
    return `<li><a class="row${fl(`organizacje/${o.id}`)}" href="/organizacje/${esc(o.id)}"><span class="id mono">${esc(o.id)}</span>${avatar(o.nazwa)}
      <span class="main-col"><span class="title">${esc(o.nazwa)}</span><span class="sub">${esc(sub)}</span></span>
      <span class="cell c-city">${esc([o.miasto, o.dzielnica].filter(Boolean).join(', '))}</span><span class="cell c-count muted">${n} ${plural(n, 'szansa', 'szanse', 'szans')}</span></a></li>`;
  });
  const firms = all.filter((o) => o.typ === 'firma').length;
  return `${head('Organizacje', `${all.length} ${plural(all.length, 'klient', 'klientów', 'klientów')}: ${firms} ${plural(firms, 'firma', 'firmy', 'firm')} i ${all.length - firms} ${plural(all.length - firms, 'osoba prywatna', 'osoby prywatne', 'osób prywatnych')}.`)}
    ${box('Wszystkie', all.length, `<ul class="rows">${rows.join('') || '<li class="box-empty">Brak organizacji.</li>'}</ul>`)}`;
}

function viewOrg(id) {
  const o = find('organizacje', id);
  if (!o || o.blad) return `${back('/organizacje', 'Organizacje')}${empty(o ? 'Ten rekord ma błąd w danych.' : `Organizacja ${id} nie istnieje.`)}`;
  const chg = changedFields('organizacje', o.id);
  const deals = dealsOf(o.id).sort((a, b) => b.id.localeCompare(a.id));
  const dealList = deals.map((s) => `<li><a class="row${fl(`szanse/${s.id}`)}" href="/szanse/${esc(s.id)}"><span class="id mono">${esc(s.id)}</span>
    <span class="main-col"><span class="title">${esc(s.nazwa)}</span><span class="sub">${esc(userName(s.uzytkownik) ?? 'bez opiekuna')}</span></span>
    <span class="cell">${badge(s.status)}</span><span class="cell money">${money(s.wartosc)}</span></a></li>`);
  return `${back('/organizacje', 'Organizacje')}<div class="layout-2">
    <div class="stack"><section class="box"><div class="rh">${avatar(o.nazwa, 'lg')}<div><p class="kicker">Organizacja ${esc(o.id)}</p><h1 class="${chg.has('nazwa') ? 'flash' : ''}">${esc(o.nazwa)}</h1></div></div>
      ${fieldsList([
        ['Typ', esc(o.typ), chg.has('typ')],
        ['Branża', esc(o.branza), chg.has('branza')],
        ['Miasto', esc(o.miasto), chg.has('miasto')],
        ['Dzielnica', esc(o.dzielnica), chg.has('dzielnica')],
        ['Uwagi', esc(o.uwagi), chg.has('uwagi')],
        ['Dodano', fmtLong(o.dodano)],
      ])}</section>
      ${personBox(o, chg.has('osoba_kontaktowa'))}</div>
    ${box('Szanse', deals.length, `<ul class="rows">${dealList.join('') || '<li class="box-empty">Brak szans.</li>'}</ul>`)}</div>`;
}

/* ---- Dashboard (tylko do odczytu, karty z data/dashboard.json) ---- */

const cardDeals = (cfg) =>
  list('szanse').filter((s) => !s.blad && (!Array.isArray(cfg.statusy) || cfg.statusy.includes(s.status)) && (!cfg.uzytkownik || s.uzytkownik === cfg.uzytkownik));
const cardScope = (cfg) =>
  `${Array.isArray(cfg.statusy) ? cfg.statusy.map((id) => status(id).nazwa).join(', ') : 'Wszystkie statusy'} · ${cfg.uzytkownik ? (userName(cfg.uzytkownik) ?? cfg.uzytkownik) : 'wszyscy opiekunowie'}`;

const CARDS = {
  liczba(cfg) {
    const deals = cardDeals(cfg);
    if (cfg.miara !== 'suma') return `<p class="big num">${deals.length}</p><p class="muted">${plural(deals.length, 'szansa', 'szanse', 'szans')}</p>`;
    const priced = deals.filter((s) => Number.isFinite(s.wartosc));
    return `<p class="big num">${money(priced.reduce((sum, s) => sum + s.wartosc, 0))}</p><p class="muted">${priced.length} z ${deals.length} z kwotą</p>`;
  },
  statusy(cfg) {
    const deals = cardDeals(cfg);
    const counts = (Array.isArray(cfg.statusy) ? cfg.statusy : statuses().map((s) => s.id)).map((id) => [status(id), deals.filter((s) => s.status === id).length]);
    const max = Math.max(1, ...counts.map(([, n]) => n));
    return `<ul class="bars">${counts.map(([st, n]) => `<li style="--c:${esc(st.kolor)}"><span class="dot"></span><span>${esc(st.nazwa)}</span><span class="bar"><i style="width:${(n / max) * 100}%"></i></span><span class="num">${n}</span></li>`).join('')}</ul>
      <p class="muted xs">Razem ${deals.length} ${plural(deals.length, 'szansa', 'szanse', 'szans')}</p>`;
  },
  lista(cfg) {
    const deals = cardDeals(cfg).filter((s) => Number.isFinite(s.wartosc)).sort((a, b) => b.wartosc - a.wartosc).slice(0, Number(cfg.limit) || 5);
    return `<ul class="rows">${deals.map((s) => `<li><a class="row" href="/szanse/${esc(s.id)}"><span class="id mono">${esc(s.id)}</span>
      <span class="main-col"><span class="title">${esc(s.nazwa)}</span><span class="sub">${esc(clientLine(find('organizacje', s.organizacja)))}</span></span>
      <span class="cell">${badge(s.status)}</span><span class="cell money">${money(s.wartosc)}</span></a></li>`).join('') || '<li class="box-empty">Brak szans z kwotą.</li>'}</ul>`;
  },
};

function viewDashboard() {
  const d = state.db.dashboard;
  const cards = Array.isArray(d?.karty) ? d.karty : [];
  // Karta dopisana albo zmieniona w pliku miga.
  const old = state.flash.has('dashboard') ? (state.prev.dashboard?.karty ?? []).map((c) => JSON.stringify(c)) : null;
  const html = cards.map((c) => {
    const cfg = c?.cfg && typeof c.cfg === 'object' ? c.cfg : {};
    const span = Math.min(12, Math.max(2, Math.round(Number(c?.szer)) || 4));
    const body = CARDS[c?.typ] ? CARDS[c.typ](cfg) : `<p class="error">Nieznany typ karty „${esc(c?.typ)}”. Dostępne: ${Object.keys(CARDS).join(', ')}.</p>`;
    return `<section class="box dcard${old && !old.includes(JSON.stringify(c)) ? ' flash' : ''}" style="grid-column: span ${span}">
      <div class="dcard-head"><h2>${esc(c?.tytul ?? c?.id)}</h2><p class="muted xs">${esc(cardScope(cfg))}</p></div><div class="dcard-body">${body}</div></section>`;
  });
  return `${head('Dashboard', `Stan na ${fmtLong(today())}.`)}${d?.blad ? '<p class="error">Plik dashboardu ma błąd w danych.</p>' : ''}
    <div class="dash">${html.join('') || '<p class="empty-screen">Brak kart.</p>'}</div>`;
}

/* ---- Rama i router ---- */

const NAV = [['/', 'Na dziś', 'dzis'], ['/szanse', 'Szanse', 'szanse'], ['/organizacje', 'Organizacje', 'organizacje'], ['/dashboard', 'Dashboard', 'dashboard']];
const ROUTES = [
  [/^\/$/, viewToday],
  [/^\/szanse$/, viewDeals],
  [/^\/szanse\/([^/]+)$/, viewDeal],
  [/^\/organizacje$/, viewOrgs],
  [/^\/organizacje\/([^/]+)$/, viewOrg],
  [/^\/dashboard$/, viewDashboard],
];

function renderFrame(path) {
  const firma = demo().firma ?? {};
  $('firma').textContent = firma.nazwa ?? 'Brain';
  document.title = firma.nazwa ? `Brain · ${firma.nazwa}` : 'Brain';
  $('podpis').textContent = firma.podpis ?? '';
  $('nav').innerHTML = NAV.map(([href, name, ic]) => {
    const current = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
    return `<a class="nav-link" href="${href}"${current ? ' aria-current="page"' : ''}>${icon(ic)}${name}</a>`;
  }).join('');
  const u = users().find((x) => x.id === me());
  $('me').innerHTML = u ? `${avatar(u.imie_nazwisko)}<span><b>${esc(u.imie_nazwisko)}</b><span class="muted xs">${esc(u.rola ?? '')}</span></span>` : '';
}

// Przerysowanie zabrałoby spod kursora to, czego użytkownik właśnie używa: wciśnięty przycisk albo odnośnik
// (kliknięcie by przepadło), termin w trakcie pisania (zapisałaby się niedokończona data) i otwartą listę.
// Wtedy render() czeka, a zaległy widok rysuje się po puszczeniu przycisku myszy albo po wyjściu z pola.
const hold = { pressed: false, stale: false };
function busy() {
  if (hold.pressed || document.activeElement?.matches?.('input[type="date"][data-patch]')) return true;
  try {
    return !!document.querySelector('select:open'); // fokus może być już na pozycji listy, nie na samej liście
  } catch {
    return false; // przeglądarka bez :open
  }
}

function render() {
  let path = location.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {}
  path = path.replace(/(.)\/+$/, '$1');
  const same = path === state.path;
  if (same && busy()) {
    hold.stale = true;
    return;
  }
  hold.stale = false;
  delete document.activeElement?.dataset?.typing; // termin znika z ekranu w trakcie pisania: bez zapisu
  // Odświeżenie na żywo nie zabiera użytkownikowi fokusu ani przewinięcia panelu.
  const focus = document.activeElement?.id;
  const scrolls = new Map([...document.querySelectorAll('[data-scroll]')].map((el) => [el.dataset.scroll, el.scrollTop]));
  renderFrame(path);
  const [re, view] = ROUTES.find(([r]) => r.test(path)) ?? [];
  $('view').innerHTML = state.db.demo?.blad ? empty('Plik ustawień ma błąd w danych.') : view ? view(...path.match(re).slice(1)) : empty('Nie ma takiego ekranu.');
  for (const el of $('view').querySelectorAll('[data-scroll]')) {
    if (same && scrolls.has(el.dataset.scroll)) el.scrollTop = scrolls.get(el.dataset.scroll);
    else if ('bottom' in el.dataset) el.scrollTop = el.scrollHeight;
  }
  if (!same) $('scroll').scrollTop = 0;
  const el = same && focus ? document.getElementById(focus) : null;
  if (el) {
    el.focus();
    try {
      el.setSelectionRange(el.value.length, el.value.length);
    } catch {}
  }
  $('view').querySelector('.tl .flash')?.scrollIntoView({ block: 'nearest' });
  state.path = path;
}

/* ---- Zapis i na żywo ---- */

async function loadDb() {
  const res = await fetch('/api/baza', { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3500);
}

async function patchDeal(id, payload) {
  state.own.set(`szanse/${id}`, Date.now());
  try {
    const res = await fetch(`/api/szanse/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor: me(), ...payload }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.blad ?? 'Nie udało się zapisać.');
    if (out.rekord) state.db.szanse = list('szanse').map((r) => (r.id === id ? { ...out.rekord, id } : r));
    toast('Zapisano.');
    return true;
  } catch (error) {
    toast(error instanceof TypeError ? 'Brak połączenia z serwerem.' : error.message);
    return false;
  } finally {
    render();
  }
}

const NOUNS = { szanse: 'szansa', organizacje: 'organizacja', dashboard: 'dashboard', demo: 'ustawienia', uzytkownicy: 'użytkownicy' };
function describe(keys) {
  const [col, id] = keys[0].split('/');
  const now = id ? find(col, id) : state.db[col];
  const old = id ? (Array.isArray(state.prev[col]) ? state.prev[col] : []).find((r) => r.id === id) : state.prev[col];
  const name = (now ?? old)?.nazwa ?? '';
  return `${!old ? 'Dodano' : !now ? 'Usunięto' : 'Zmieniono'}: ${NOUNS[col] ?? col}${id ? ` ${id}` : ''}${name ? ` · ${name}` : ''}${keys.length > 1 ? ` (+${keys.length - 1})` : ''}`;
}

function connect() {
  let lost = false;
  const events = new EventSource('/api/zdarzenia');
  events.onopen = async () => {
    $('live').classList.add('on');
    if (!lost) return;
    lost = false;
    state.db = await loadDb(); // po przerwie pliki mogły się zmienić
    render();
  };
  events.onerror = () => {
    $('live').classList.remove('on');
    lost = true;
  };
  events.onmessage = async (event) => {
    const keys = (JSON.parse(event.data).pliki ?? []).map((p) => p.replace(/\.json$/, ''));
    // Własny zapis z ekranu nie miga i nie daje komunikatu: widz już widzi swoją zmianę.
    const theirs = keys.filter((k) => Date.now() - (state.own.get(k) ?? 0) > 2000);
    state.prev = state.db;
    state.db = await loadDb();
    state.flash = new Set(theirs);
    render();
    if (theirs.length) toast(describe(theirs));
    clearTimeout(state.flashTimer);
    state.flashTimer = setTimeout(() => state.flash.clear(), 2600);
  };
}

/* ---- Zdarzenia ---- */

document.addEventListener('click', (event) => {
  const a = event.target.closest('a[href]');
  if (a && a.origin === location.origin && !a.target && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    event.preventDefault();
    if (a.href !== location.href) history.pushState(null, '', a.href);
    render();
    return;
  }
  const take = event.target.closest('[data-take]');
  if (take) patchDeal(take.dataset.take, { zmiany: { uzytkownik: me() } });
});

// Zapis pola z ekranu. Termin to pełny dzień z lat 2000-2099 (jak w serwerze) albo puste pole (null).
// Niepełna data albo rok spoza zakresu nie idzie do pliku: pole wraca do zapisanego terminu.
// Zwraca true, gdy zmiana poszła do serwera.
function saveField(el) {
  if (el.type === 'date') {
    if (el.validity.badInput || (el.value && !/^20\d{2}-\d{2}-\d{2}$/.test(el.value))) {
      el.value = el.defaultValue;
      toast('Nie zapisano terminu: wpisz pełną datę z lat 2000-2099.');
      return false;
    }
    if (el.value === el.defaultValue) return false;
  }
  patchDeal(el.dataset.patch, { zmiany: { [el.dataset.field]: el.value || null } });
  return true;
}

// Chrome zgłasza zmianę terminu po każdej cyfrze (rok „2” to już data 0002-10-28), a zapis przerysowuje ekran.
// Dlatego termin wpisywany z klawiatury zapisujemy po wyjściu z pola albo po Enterze. Wybór z kalendarza od razu.
document.addEventListener('change', (event) => {
  const el = event.target.closest('[data-patch]');
  if (el && !el.dataset.typing) saveField(el);
});

document.addEventListener('keydown', (event) => {
  const el = event.target;
  if (!el.matches('input[type="date"][data-patch]')) return;
  if (event.key === 'Enter') el.blur();
  else if (/^(\d|Backspace|Delete|ArrowUp|ArrowDown)$/.test(event.key)) el.dataset.typing = '1';
});

// Wciśnięty przycisk myszy wstrzymuje przerysowanie (busy). Zaległy widok rysujemy po puszczeniu, już po obsłudze `click`.
// Ruch myszy bez wciśniętego przycisku też kończy wstrzymanie, gdyby przeglądarka nie zgłosiła puszczenia.
const flush = () => setTimeout(() => hold.stale && render(), 0);
document.addEventListener('pointerdown', (event) => {
  if (event.button === 0) hold.pressed = true;
});
for (const type of ['pointerup', 'pointercancel', 'pointermove']) {
  document.addEventListener(type, (event) => {
    if (!hold.pressed || (type === 'pointermove' && event.buttons)) return;
    hold.pressed = false;
    flush();
  });
}

// Termin wpisany z klawiatury zapisuje się od razu przy wyjściu z pola, także kliknięciem. Czeka tylko przerysowanie.
document.addEventListener('focusout', (event) => {
  const el = event.target;
  if (el.dataset?.typing) {
    if (!document.hasFocus()) return; // okno straciło fokus w trakcie pisania (Cmd+Tab): zapis przy wyjściu z pola po powrocie
    delete el.dataset.typing;
    if (saveField(el)) return; // ekran przerysuje odpowiedź serwera
  }
  flush(); // np. po zamknięciu listy albo terminie bez zmiany
});

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.matches('textarea[id]')) state.drafts.set(el.id, el.value);
  if (el.id !== 'szukaj') return;
  state.query = el.value;
  const q = norm(el.value).trim();
  document.querySelectorAll('[data-q]').forEach((li) => (li.hidden = !li.dataset.q.includes(q)));
});

document.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const area = form.querySelector('textarea');
  const text = area?.value.trim();
  if (!text || !form.dataset.comment) return;
  form.querySelector('button').disabled = true;
  state.drafts.delete(area.id);
  if (!(await patchDeal(form.dataset.comment, { komentarz: text }))) {
    state.drafts.set(area.id, text); // nieudany zapis nie kasuje wpisanego tekstu
    render();
  }
});

window.addEventListener('popstate', render);

try {
  state.db = await loadDb();
  render();
} catch {
  $('view').innerHTML = empty('Nie udało się wczytać danych. Czy serwer działa?');
}
connect();
