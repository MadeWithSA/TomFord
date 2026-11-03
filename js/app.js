(function () {
  'use strict';
  const CFG = window.TF_CONFIG, P = window.TF_PRODUCTS, I18N = window.TF_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem('tf_' + k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tf_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const state = {
    lang: LS.get('lang', 'ru'),
    theme: LS.get('theme', 'dark'),
    cart: LS.get('cart', []),       // {id,size,qty}
    favs: LS.get('favs', []),
    orders: LS.get('orders', []),
    user: LS.get('user', { name: '', phone: '', address: '' })
  };
  const t = k => (I18N[state.lang] && I18N[state.lang][k]) || I18N.ru[k] || k;
  const money = n => n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ' + CFG.CURRENCY;
  const price = (p, s) => s === 100 ? p.price100 : p.price50;
  const byId = id => P.find(p => p.id === id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- bottle illustration (SVG, no external photos) ---------- */
  function bottle(p, px) {
    const w = px || 240, h = Math.round(w * 1.25), id = 'b' + p.id + (px ? 'x' : '');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 240 300">
<defs>
<linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="${p.dark}"/><stop offset=".5" stop-color="${p.liquid}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
<linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#1a1410"/><stop offset=".45" stop-color="#4a3a2a"/><stop offset="1" stop-color="#14100c"/></linearGradient>
<radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<rect width="240" height="300" fill="#16110d"/>
<ellipse cx="120" cy="268" rx="78" ry="10" fill="url(#${id}s)"/>
<rect x="84" y="30" width="72" height="44" rx="4" fill="url(#${id}c)" stroke="#8a6a3a" stroke-width="1"/>
<rect x="104" y="74" width="32" height="14" fill="#2a2018"/>
<rect x="52" y="88" width="136" height="172" rx="8" fill="url(#${id}g)" stroke="#c9a15a" stroke-width="1.5"/>
<rect x="60" y="96" width="14" height="156" rx="6" fill="#fff" opacity=".1"/>
<rect x="82" y="140" width="76" height="62" fill="#e8c27a" opacity=".92"/>
<text x="120" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="9" letter-spacing="1.5" fill="#1a120a">TOM FORD</text>
<text x="120" y="178" text-anchor="middle" font-family="Georgia,serif" font-size="${p.name.length > 14 ? 8 : 10}" font-weight="bold" fill="#1a120a">${esc(p.name.toUpperCase())}</text>
<text x="120" y="193" text-anchor="middle" font-family="Georgia,serif" font-size="6" letter-spacing="1" fill="#3a2a16">EAU DE PARFUM</text>
</svg>`;
  }
  async function svgToPng(svg, size) {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas'); c.width = size; c.height = Math.round(size * 1.25);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return new Promise(r => c.toBlob(r, 'image/png'));
  }

  /* ---------- layout: header + footer + loader + transitions ---------- */
  const PAGES = [['index.html', 'nav_home'], ['catalog.html', 'nav_catalog'], ['favorites.html', 'nav_fav'], ['cart.html', 'nav_cart'], ['profile.html', 'nav_profile']];
  function buildLayout() {
    const cur = (location.pathname.split('/').pop() || 'index.html');
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
<a class="logo" href="index.html">Tom<span>Ford</span></a>
<nav class="nav" id="nav">${PAGES.map(([h, k]) => `<a href="${h}" class="${h === cur ? 'on' : ''}" data-i18n="${k}"></a>`).join('')}</nav>
<div class="tools">
  <a class="icon-btn" href="favorites.html" title="♥">♥<b class="badge" id="favCount"></b></a>
  <a class="icon-btn" href="cart.html" title="cart">🛍<b class="badge" id="cartCount"></b></a>
  <div class="lang" id="lang">${['ru', 'uz', 'en'].map(l => `<button data-l="${l}">${l.toUpperCase()}</button>`).join('')}</div>
  <button class="icon-btn" id="themeBtn" title="theme">◐</button>
  <button class="burger" id="burger" aria-label="menu"><i></i><i></i></button>
</div>`;
    document.body.prepend(header);
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `<div class="logo">Tom<span>Ford</span></div><p data-i18n="footer"></p><small>© ${new Date().getFullYear()} TomFord</small>`;
    document.body.appendChild(footer);
    const loader = document.createElement('div');
    loader.className = 'loader'; loader.id = 'loader';
    loader.innerHTML = '<div class="loader-logo">Tom<span>Ford</span></div><div class="loader-line"><i></i></div>';
    document.body.appendChild(loader);
    const curtain = document.createElement('div');
    curtain.className = 'curtain'; curtain.id = 'curtain';
    document.body.appendChild(curtain);
    const toast = document.createElement('div'); toast.className = 'toast'; toast.id = 'toast';
    document.body.appendChild(toast);

    $('#burger').onclick = () => $('#nav').classList.toggle('open');
    $('#themeBtn').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; LS.set('theme', state.theme); applyTheme(); };
    $$('#lang button').forEach(b => b.onclick = () => setLang(b.dataset.l));

    // page transitions
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target || e.metaKey || e.ctrlKey) return;
      const h = a.getAttribute('href');
      if (!h || h.startsWith('#') || /^(https?:|mailto:|tel:)/.test(h)) return;
      e.preventDefault();
      curtain.classList.add('in');
      setTimeout(() => { location.href = h; }, 480);
    });
    window.addEventListener('pageshow', () => curtain.classList.remove('in'));
    window.addEventListener('load', () => setTimeout(() => loader.classList.add('done'), 900));
    setTimeout(() => loader.classList.add('done'), 3000);
  }
  function applyTheme() { document.documentElement.setAttribute('data-theme', state.theme); }
  function applyLang() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('#lang button').forEach(b => b.classList.toggle('on', b.dataset.l === state.lang));
  }
  function setLang(l) {
    state.lang = l; LS.set('lang', l); applyLang();
    document.dispatchEvent(new Event('langchange'));
  }
  function counts() {
    const c = state.cart.reduce((s, i) => s + i.qty, 0), f = state.favs.length;
    const cc = $('#cartCount'), fc = $('#favCount');
    if (cc) { cc.textContent = c || ''; cc.classList.toggle('show', !!c); }
    if (fc) { fc.textContent = f || ''; fc.classList.toggle('show', !!f); }
  }
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function saveCart() { LS.set('cart', state.cart); counts(); }
  function saveFavs() { LS.set('favs', state.favs); counts(); }
  function addToCart(id, size) {
    const it = state.cart.find(i => i.id === id && i.size === size);
    if (it) it.qty++; else state.cart.push({ id, size, qty: 1 });
    saveCart(); toast('✓ ' + t('added'));
  }
  function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
    saveFavs();
    return i < 0;
  }

  /* ---------- product card ---------- */
  function card(p) {
    const fav = state.favs.includes(p.id);
    return `<article class="card" data-id="${p.id}" data-size="50">
  <button class="heart ${fav ? 'on' : ''}" data-act="fav" aria-label="favorite">♥</button>
  <div class="card-img">${bottle(p)}</div>
  <div class="card-body">
    <span class="tag">${t('fam_' + p.family)} · ${t('f_' + p.gender)}</span>
    <h3>${esc(p.name)}</h3>
    <p class="desc">${t('d_' + p.family)}</p>
    <p class="notes">${p.notes.map(esc).join(' · ')}</p>
    <div class="sizes"><button class="on" data-act="size" data-s="50">50 ${t('ml')}</button><button data-act="size" data-s="100">100 ${t('ml')}</button></div>
    <div class="buy"><b class="price">${money(p.price50)}</b><button class="btn" data-act="add">${t('add')}</button></div>
  </div>
</article>`;
  }
  function bindCards(root) {
    root.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const c = b.closest('.card'), id = +c.dataset.id, p = byId(id);
      if (b.dataset.act === 'size') {
        c.dataset.size = b.dataset.s;
        $$('.sizes button', c).forEach(x => x.classList.toggle('on', x === b));
        $('.price', c).textContent = money(price(p, +b.dataset.s));
      } else if (b.dataset.act === 'add') {
        addToCart(id, +c.dataset.size);
        b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 400);
      } else if (b.dataset.act === 'fav') {
        const on = toggleFav(id); b.classList.toggle('on', on);
        if (document.body.dataset.page === 'favorites') renderFavs();
      }
    };
  }
  function observeReveal() {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('seen'); io.unobserve(en.target); } }), { threshold: .12 });
    $$('.reveal:not(.seen), .card:not(.seen)').forEach(el => io.observe(el));
  }

  /* ---------- pages ---------- */
  function pageHome() {
    const g = $('#hits'); if (!g) return;
    const draw = () => { g.innerHTML = P.filter(p => p.hit).slice(0, 4).map(card).join(''); observeReveal(); };
    draw(); bindCards(g); document.addEventListener('langchange', draw);
  }
  function pageCatalog() {
    const g = $('#grid'), q = $('#q'), sort = $('#sort'), chips = $('#chips');
    let gender = 'all';
    const draw = () => {
      const s = q.value.trim().toLowerCase();
      let list = P.filter(p => (gender === 'all' || p.gender === gender) && (!s || (p.name + ' ' + p.notes.join(' ')).toLowerCase().includes(s)));
      if (sort.value === 'asc') list.sort((a, b) => a.price50 - b.price50);
      if (sort.value === 'desc') list.sort((a, b) => b.price50 - a.price50);
      if (sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
      g.innerHTML = list.length ? list.map(card).join('') : `<p class="empty">${t('nothing')}</p>`;
      observeReveal();
    };
    chips.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      gender = b.dataset.g; $$('button', chips).forEach(x => x.classList.toggle('on', x === b)); draw();
    };
    q.oninput = draw; sort.onchange = draw;
    $('#sort').innerHTML = [['def', 'sort_def'], ['asc', 'sort_asc'], ['desc', 'sort_desc'], ['name', 'sort_name']].map(([v, k]) => `<option value="${v}" data-i18n="${k}">${t(k)}</option>`).join('');
    bindCards(g); draw();
    document.addEventListener('langchange', () => { $$('#sort option').forEach(o => o.textContent = t(o.dataset.i18n)); draw(); });
  }
  function renderFavs() {
    const g = $('#grid');
    const list = P.filter(p => state.favs.includes(p.id));
    g.innerHTML = list.length ? list.map(card).join('') : `<div class="empty"><p>${t('fav_empty')}</p><a class="btn" href="catalog.html">${t('to_catalog')}</a></div>`;
    observeReveal();
  }
  function pageFavs() { bindCards($('#grid')); renderFavs(); document.addEventListener('langchange', renderFavs); }

  function cartTotal() { return state.cart.reduce((s, i) => s + price(byId(i.id), i.size) * i.qty, 0); }
  function pageCart() {
    const list = $('#cartList'), sum = $('#cartSum'), form = $('#orderForm'), msg = $('#orderMsg');
    const u = state.user; form.name.value = u.name || ''; form.phone.value = u.phone || ''; form.address.value = u.address || '';
    const draw = () => {
      if (!state.cart.length) {
        list.innerHTML = `<div class="empty"><p>${t('cart_empty')}</p><a class="btn" href="catalog.html">${t('to_catalog')}</a></div>`;
        sum.innerHTML = ''; form.classList.add('hide'); return;
      }
      form.classList.remove('hide');
      list.innerHTML = state.cart.map((i, idx) => {
        const p = byId(i.id);
        return `<div class="row" data-i="${idx}">
  <div class="row-img">${bottle(p, 90)}</div>
  <div class="row-info"><h4>${esc(p.name)}</h4><small>${i.size} ${t('ml')}</small><b>${money(price(p, i.size))}</b></div>
  <div class="qty"><button data-a="minus">−</button><span>${i.qty}</span><button data-a="plus">+</button></div>
  <button class="del" data-a="del" title="${t('remove')}">✕</button>
</div>`;
      }).join('');
      sum.innerHTML = `<div><span>${t('delivery')}</span><b>${t('free')}</b></div><div class="grand"><span>${t('total')}</span><b>${money(cartTotal())}</b></div>`;
    };
    list.onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const i = +b.closest('.row').dataset.i, it = state.cart[i];
      if (b.dataset.a === 'plus') it.qty++;
      if (b.dataset.a === 'minus') it.qty = Math.max(1, it.qty - 1);
      if (b.dataset.a === 'del') state.cart.splice(i, 1);
      saveCart(); draw();
    };
    form.onsubmit = async e => {
      e.preventDefault();
      const d = { name: form.name.value.trim(), phone: form.phone.value.trim(), address: form.address.value.trim(), comment: form.comment.value.trim() };
      msg.className = 'msg';
      if (!d.name || !d.phone || !d.address) { msg.textContent = t('fill_all'); msg.classList.add('err'); return; }
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = t('sending');
      const order = {
        id: 'TF-' + Date.now().toString().slice(-6), created: Date.now(), total: cartTotal(), customer: d,
        items: state.cart.map(i => ({ id: i.id, name: byId(i.id).name, size: i.size, qty: i.qty, price: price(byId(i.id), i.size) }))
      };
      let res;
      try { res = await sendOrderToBot(order); } catch (err) { res = { ok: false }; }
      btn.disabled = false; btn.textContent = t('send_order');
      if (res.ok || res.demo) {
        state.orders.unshift(order); LS.set('orders', state.orders);
        state.user = { name: d.name, phone: d.phone, address: d.address }; LS.set('user', state.user);
        state.cart = []; saveCart(); draw();
        msg.textContent = res.demo ? t('order_demo') : t('order_ok'); msg.classList.add('ok');
        list.innerHTML = `<div class="empty ok-big"><div class="check">✓</div><p>${esc(order.id)}</p><a class="btn" href="profile.html">${t('nav_profile')}</a></div>`;
      } else { msg.textContent = t('order_err'); msg.classList.add('err'); }
    };
    draw(); document.addEventListener('langchange', draw);
  }

  /* ---------- Telegram bot ---------- */
  async function sendOrderToBot(o) {
    const tok = CFG.BOT_TOKEN, chat = CFG.CHAT_ID;
    if (!tok || /PASTE/.test(tok) || !chat || /PASTE/.test(chat)) return { demo: true };
    const api = m => `https://api.telegram.org/bot${tok}/${m}`;
    const lines = o.items.map((i, n) => `${n + 1}. <b>${esc(i.name)}</b> — ${i.size} мл × ${i.qty} = ${money(i.price * i.qty)}`);
    const text = `🛍 <b>Новый заказ ${o.id}</b>\n\n` + lines.join('\n') +
      `\n\n💰 <b>Итого: ${money(o.total)}</b>\n\n👤 ${esc(o.customer.name)}\n📞 ${esc(o.customer.phone)}\n📍 ${esc(o.customer.address)}` +
      (o.customer.comment ? `\n💬 ${esc(o.customer.comment)}` : '') + `\n🕒 ${new Date(o.created).toLocaleString('ru-RU')}`;
    // 1) фото первого товара (сгенерированный флакон) — как при заказах с фото товара
    try {
      const p = byId(o.items[0].id);
      const png = await svgToPng(bottle(p, 480), 600);
      const fd = new FormData();
      fd.append('chat_id', chat); fd.append('photo', png, 'tomford.png');
      fd.append('caption', `🛍 Заказ ${o.id} · ${o.items.map(i => i.name).slice(0, 3).join(', ')}${o.items.length > 3 ? '…' : ''}`);
      await fetch(api('sendPhoto'), { method: 'POST', body: fd });
    } catch (e) { /* фото не критично */ }
    // 2) полный текст заказа
    const r = await fetch(api('sendMessage'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' })
    });
    const j = await r.json();
    return { ok: !!j.ok };
  }

  /* ---------- profile ---------- */
  function stageOf(o) {
    const h = (Date.now() - o.created) / 36e5, total = CFG.DELIVERY_DAYS * 24;
    if (h >= total) return 4; if (h >= total * 0.4) return 3; if (h >= 0.5) return 2; return 1;
  }
  function pageProfile() {
    const f = $('#profForm'), box = $('#orders'), m = $('#profMsg');
    f.name.value = state.user.name || ''; f.phone.value = state.user.phone || ''; f.address.value = state.user.address || '';
    f.onsubmit = e => {
      e.preventDefault();
      state.user = { name: f.name.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim() }; LS.set('user', state.user);
      m.textContent = '✓ ' + t('saved'); setTimeout(() => m.textContent = '', 2000);
    };
    const draw = () => {
      if (!state.orders.length) { box.innerHTML = `<div class="empty"><p>${t('no_orders')}</p><a class="btn" href="catalog.html">${t('to_catalog')}</a></div>`; return; }
      box.innerHTML = state.orders.map(o => {
        const st = stageOf(o), eta = new Date(o.created + CFG.DELIVERY_DAYS * 864e5);
        const locale = state.lang === 'en' ? 'en-GB' : 'ru-RU';
        return `<div class="order">
  <div class="order-head"><b>${t('order')} ${esc(o.id)}</b><span>${new Date(o.created).toLocaleDateString(locale)}</span><b class="grand">${money(o.total)}</b></div>
  <div class="track">${[1, 2, 3, 4].map(n => `<div class="step ${n <= st ? 'done' : ''} ${n === st ? 'now' : ''}"><i>${n < st ? '✓' : n}</i><span>${t('st_' + n)}</span></div>`).join('')}</div>
  <div class="order-foot"><span>${t('eta')}: <b>${eta.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</b></span>
  <span class="its">${o.items.map(i => esc(i.name) + ' ' + i.size + t('ml') + ' ×' + i.qty).join(', ')}</span></div>
</div>`;
      }).join('') + `<button class="link" id="clr">${t('clear_orders')}</button>`;
      const c = $('#clr'); if (c) c.onclick = () => { state.orders = []; LS.set('orders', []); draw(); };
    };
    draw(); document.addEventListener('langchange', draw);
    setInterval(draw, 60000);
  }

  /* ---------- init ---------- */
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    buildLayout(); applyLang(); counts();
    const page = document.body.dataset.page;
    ({ home: pageHome, catalog: pageCatalog, favorites: pageFavs, cart: pageCart, profile: pageProfile }[page] || (() => {}))();
    observeReveal();
  });
})();
