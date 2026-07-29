// ===== 全局 =====
const DATA = {};
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function imgTag(p, cls) { return p ? `<img src="${esc(p)}" class="${cls || ''}" loading="lazy" onerror="this.style.display='none'">` : `<div class="no-img ${cls || ''}">无图</div>`; }

async function loadAll() {
  const files = ['shrines', 'koroks', 'high_tier_monsters', 'monsters', 'materials', 'equipment', 'armors', 'quests', 'locations', 'meta'];
  await Promise.all(files.map(f => fetch('data/' + f + '.json').then(r => r.json()).then(j => DATA[f] = j)));
}

// ===== 路由 =====
const routes = {
  '': viewHome, 'home': viewHome,
  'guide': viewGuide,
  'map-shrine': () => viewMap('shrine'),
  'map-korok': () => viewMap('korok'),
  'map-monster': () => viewMap('monster'),
  'bestiary': viewBestiary, 'monster': viewMonsterDetail, 'material': viewMaterialDetail,
  'armor': viewArmor, 'armord': viewArmorDetail,
  'weapons': viewWeapons, 'weapon': viewWeaponDetail,
  'quests': viewQuests, 'quest': viewQuestDetail
};
function router() {
  try { MapEngine.destroy(); } catch (e) { /* 地图销毁失败不影响切换 */ }
  const hash = location.hash.replace(/^#/, '');
  const [seg, param] = hash.split('/');
  const fn = routes[seg] || viewHome;
  setActiveNav(seg);
  try { if (param) fn(param); else fn(); }
  catch (e) {
    console.error('route render error:', e);
    $('#view').innerHTML = '<p class="err">该页面渲染出错：' + (e && e.message || e) + '</p>';
  }
}
window.addEventListener('hashchange', router);

function setActiveNav(seg) {
  $$('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('data-route') === seg.split('-')[0] || a.getAttribute('data-route') === seg));
}

// ===== 首页 =====
function viewHome() {
  const m = DATA.meta.counts;
  const cards = [
    ['guide', '🗺️ 地图指引', m.shrines + m.koroks + m.high_tier_monsters, '神庙/呀哈哈/怪物/洞窟/水井/鸟望台', 'red'],
    ['bestiary', '📖 怪物图鉴', m.monsters, '+ 素材 ' + m.materials + ' 种', 'green'],
    ['armor', '🛡️ 服装图鉴', m.armors, '含升级材料计算器', 'blue'],
    ['weapons', '⚔️ 武器大全', m.equipment, '武器/弓/盾', 'gray'],
    ['quests', '📜 任务指引', m.quests, '主线/小冒险/支线/神庙', 'orange']
  ];
  $('#view').innerHTML = `<div class="home">
    <h1>塞尔达传说 · 王国之泪 · 全攻略</h1>
    <p class="sub">自用离线攻略站 ｜ 数据获取率 ~85% ｜ 收集进度自动保存</p>
    <div class="home-grid">${cards.map(c => `
      <a class="home-card ${c[4]}" href="#${c[0]}">
        <div class="hc-title">${c[1]}</div>
        <div class="hc-num">${c[2]}</div>
        <div class="hc-sub">${c[3]}</div>
      </a>`).join('')}</div>
    <div class="home-note">提示：地图支持分层切换与点击标记收集（呀哈哈仅存在于地表/天空，共 900 个点位＝1000 颗种子）；呀哈哈地图可按解谜类型筛选；服装页可勾选已升级层级并汇总所需材料。</div>
  </div>`;
}

// ===== 地图视图 =====
const MAP_CFG = {
  shrine: {
    data: () => DATA.shrines, progressCat: 'shrines', radius: 4,
    colorFn: () => '#27ae60', layerOptions: ['surface', 'sky'], layerLabels: { surface: '地表', sky: '天空' },
    popupSub: m => `<br><small>层级：${m.layer === 'sky' ? '天空' : '地表'} ｜ ${esc(m.id)}</small>`,
    detailFn: 'viewShrineDetail'
  },
  korok: {
    data: () => DATA.koroks, progressCat: 'koroks', radius: 3,
    colorFn: () => '#f1c40f', layerOptions: ['surface', 'sky'], layerLabels: { surface: '地表', sky: '天空' },
    typeFilter: {
      field: 'ptype',
      options: ['rock_lift', 'fly', 'carry', 'race', 'ground', 'silhouette', 'pot', 'flower_trail', 'roof', 'pinwheel', 'catch', 'stone_circle', 'plug', 'target'],
      labels: { rock_lift: '搬石头', fly: '隐匿(空中)', carry: '护送同伴', race: '竞速', ground: '隐匿(地面)', silhouette: '方块拼图', pot: '陶罐', flower_trail: '追花', roof: '树洞/高处', pinwheel: '风车', catch: '接种子', stone_circle: '石阵', plug: '拔栓塞', target: '射靶' }
    },
    popupSub: m => `<br><small>呀哈哈 ｜ ${esc(m.ptype_zh || '')} ｜ ${esc(m.id)}</small>`
  },
  monster: {
    data: () => DATA.high_tier_monsters, progressCat: 'monsters', radius: 4,
    colorFn: m => ({ silver: '#e74c3c', lynel: '#00ff00', gleeok: '#000fff', talus: '#b9770e', frox: '#e91e8c', flux: '#16a085', molduga: '#6d4c41' }[m.cat] || '#888'),
    layerOptions: ['surface', 'sky', 'depths'], layerLabels: { surface: '地表', sky: '天空', depths: '地底' },
    typeFilter: { field: 'cat', options: ['silver', 'lynel', 'gleeok', 'talus', 'frox', 'flux', 'molduga'], labels: { silver: '白银级', lynel: '人马', gleeok: '三头龙', talus: '岩石巨人', frox: '巨霸迦马', flux: '方块魔像', molduga: '莫尔德拉吉克' } },
    popupSub: m => `<br><small>${esc(m.type_zh)} ｜ ${esc(m.layer)}</small>`
  }
};
function viewMap(kind) {
  const cfg = MAP_CFG[kind];
  $('#view').innerHTML = `<div class="map-view">
    <div class="map-toolbar">
      <div id="layerBar" class="bar"></div>
      <div id="typeBar" class="bar"></div>
      <div class="count" id="mapCount"></div>
      <button class="ghost-btn" onclick="App.exportProgress()">导出进度</button>
      <button class="ghost-btn" onclick="App.importProgress()">导入进度</button>
    </div>
    <div id="map" class="map-canvas"></div>
  </div>`;
  // 等容器渲染后再建地图
  setTimeout(() => {
    MapEngine.build('map', Object.assign({ layerBarId: 'layerBar', typeFilterBarId: 'typeBar', countEl: 'mapCount' }, cfg, { data: cfg.data() }));
  }, 30);
}

// ===== 地图指引（多图层复合地图）=====
const GUIDE_STATE = { shrine: true, korok: false, monster_silver: false, monster_lynel: false, monster_gleeok: false, monster_talus: false, monster_frox: false, monster_flux: false, monster_molduga: false, cave: true, well: true, tower: true };
const MONSTER_SUBS = [
  ['monster_silver', 'silver', '白银级怪物', '#e74c3c'],
  ['monster_lynel', 'lynel', '莱尼尔', '#00b34d'],
  ['monster_gleeok', 'gleeok', '古栗欧克', '#3355ff'],
  ['monster_talus', 'talus', '岩石巨人', '#b9770e'],
  ['monster_frox', 'frox', '巨霸迦马', '#e91e8c'],
  ['monster_flux', 'flux', '方块魔像', '#16a085'],
  ['monster_molduga', 'molduga', '莫尔德拉吉克', '#6d4c41']
];
function guideSources() {
  const monsterSrcs = MONSTER_SUBS.map(([key, cat, label, color]) => ({
    key, label, color, radius: 4, sub: 'monster',
    data: DATA.high_tier_monsters.filter(m => m.cat === cat), progressCat: 'monsters',
    popupSub: m => `<br><small>${esc(m.name_zh || m.type_zh || '')} ｜ ${esc(m.layer)}</small>`
  }));
  return [
    { key: 'shrine', label: '神庙', color: '#27ae60', radius: 4, data: DATA.shrines, progressCat: 'shrines',
      popupSub: m => `<br><small>神庙 ｜ ${m.layer === 'sky' ? '天空' : '地表'} ｜ ${esc(m.id)}</small>`, detailFn: 'viewShrineDetail' },
    { key: 'korok', label: '呀哈哈', color: '#f1c40f', radius: 3, data: DATA.koroks, progressCat: 'koroks',
      popupSub: m => `<br><small>呀哈哈 ｜ ${esc(m.ptype_zh || '')} ｜ ${esc(m.id)}</small>` },
    ...monsterSrcs,
    { key: 'cave', label: '洞窟', color: '#8e44ad', radius: 4, data: DATA.locations.caves, progressCat: 'caves',
      popupSub: m => `<br><small>洞窟${m.entrances ? ' ｜ 入口 ×' + m.entrances.length : ''} ｜ ${esc(m.name)}</small>` },
    { key: 'well', label: '水井', color: '#3498db', radius: 4, data: DATA.locations.wells, progressCat: 'wells',
      popupSub: m => `<br><small>水井 ｜ ${esc(m.name)}</small>` },
    { key: 'tower', label: '鸟望台', color: '#e67e22', radius: 6, data: DATA.locations.towers, progressCat: 'towers',
      popupSub: m => `<br><small>鸟望台 ｜ ${esc(m.name)}</small>` }
  ];
}
function viewGuide() {
  const srcs = guideSources();
  const byKey = k => srcs.find(s => s.key === k);
  const itemHtml = (s, cls) => `
        <label class="gs-item${cls ? ' ' + cls : ''}">
          <input type="checkbox" data-k="${s.key}" ${GUIDE_STATE[s.key] ? 'checked' : ''}>
          <span class="dot" style="background:${s.color || '#e74c3c'}"></span>
          <span>${s.label}</span>
          <span class="gs-count" id="gc-${s.key}">—</span>
        </label>`;
  const monsterSrcs = srcs.filter(s => s.sub === 'monster');
  $('#view').innerHTML = `<div class="guide-view">
    <aside class="guide-side">
      <h3>图层选项</h3>
      ${itemHtml(byKey('shrine'))}
      ${itemHtml(byKey('korok'))}
      <label class="gs-item gs-parent">
        <input type="checkbox" id="gs-monster-all">
        <span class="dot" style="background:#e74c3c"></span>
        <span>高阶怪物</span>
        <span class="gs-count" id="gc-monster-all">—</span>
      </label>
      <div class="gs-children">
        ${monsterSrcs.map(s => itemHtml(s)).join('')}
      </div>
      ${itemHtml(byKey('cave'))}
      ${itemHtml(byKey('well'))}
      ${itemHtml(byKey('tower'))}
      <div class="gs-note">数量为「当前地图层显示数 / 总数」。点击地图标记可弹出详情并标记收集。</div>
      <div class="gs-actions">
        <button class="ghost-btn" onclick="App.exportProgress()">导出进度</button>
        <button class="ghost-btn" onclick="App.importProgress()">导入进度</button>
      </div>
    </aside>
    <div class="guide-main">
      <div class="map-toolbar"><div id="layerBar" class="bar"></div></div>
      <div id="map" class="map-canvas"></div>
    </div>
  </div>`;
  const monsterKeys = monsterSrcs.map(s => s.key);
  const parentCb = document.getElementById('gs-monster-all');
  const syncParent = () => {
    const on = monsterKeys.filter(k => GUIDE_STATE[k]).length;
    parentCb.checked = on === monsterKeys.length;
    parentCb.indeterminate = on > 0 && on < monsterKeys.length;
  };
  $$('.gs-item input[data-k]').forEach(cb => {
    cb.onchange = () => {
      GUIDE_STATE[cb.dataset.k] = cb.checked;
      MapEngine.setSourceEnabled(cb.dataset.k, cb.checked);
      if (monsterKeys.includes(cb.dataset.k)) syncParent();
    };
  });
  parentCb.onchange = () => {
    monsterKeys.forEach(k => {
      GUIDE_STATE[k] = parentCb.checked;
      const cb = document.querySelector(`.gs-item input[data-k="${k}"]`);
      if (cb) cb.checked = parentCb.checked;
      MapEngine.setSourceEnabled(k, parentCb.checked);
    });
    syncParent();
  };
  syncParent();
  setTimeout(() => {
    MapEngine.buildMulti('map', {
      layerBarId: 'layerBar',
      layerOptions: ['surface', 'sky', 'depths'],
      layerLabels: { surface: '地表', sky: '天空', depths: '地底' },
      sources: srcs.map(s => Object.assign({ enabled: !!GUIDE_STATE[s.key] }, s)),
      onCounts: counts => {
        let mShown = 0, mTotal = 0;
        Object.entries(counts).forEach(([k, c]) => {
          const el = document.getElementById('gc-' + k);
          if (el) el.textContent = `${c.shown}/${c.total}`;
          if (monsterKeys.includes(k)) { mShown += c.shown; mTotal += c.total; }
        });
        const mEl = document.getElementById('gc-monster-all');
        if (mEl) mEl.textContent = `${mShown}/${mTotal}`;
      }
    });
  }, 30);
}

// ===== 怪物 / 素材 =====
function descHtml(m) {
  const zh = m.description_zh, en = m.description;
  let h = '';
  if (zh) h += `<p>${esc(zh)}</p>`;
  if (en) h += `<p class="en">${esc(en)}</p>`;
  return h || '<p>—</p>';
}
const BS_STATE = { q: '', sort: 'default' };   // 记住搜索词与排序，详情弹窗重建页面后恢复
function viewBestiary(initialTab) {
  const tab = initialTab || 'mon';
  $('#view').innerHTML = `<div class="list-view">
    <div class="tabs">
      <button class="tab" data-t="mon">怪物 (${DATA.monsters.length})</button>
      <button class="tab" data-t="mat">素材 (${DATA.materials.length})</button>
      <span id="mat-sort-wrap" class="sort-wrap" style="display:none">
        <select id="mat-sort" class="sort-sel">
          <option value="default">排序：默认</option>
          <option value="fuse">按余料攻击加成↓</option>
        </select>
      </span>
      <input id="bs-search" class="search" placeholder="搜索名称 / 介绍…">
    </div>
    <div id="bs-list" class="card-grid"></div>
  </div>`;
  const search = $('#bs-search');
  const sortSel = $('#mat-sort');
  // 恢复上次的搜索词与排序（点开详情会重建本页，不恢复的话排序/搜索会被重置）
  search.value = BS_STATE.q;
  sortSel.value = BS_STATE.sort;
  const setActive = t => { $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.t === t)); const w = $('#mat-sort-wrap'); if (w) w.style.display = t === 'mat' ? '' : 'none'; };
  $$('.tab').forEach(t => t.onclick = () => { setActive(t.dataset.t); search.value = ''; BS_STATE.q = ''; renderBS(t.dataset.t, '', sortSel.value); });
  sortSel.onchange = () => { BS_STATE.sort = sortSel.value; renderBS('mat', search.value, sortSel.value); };
  search.oninput = () => { BS_STATE.q = search.value; renderBS($('.tab.active').dataset.t, search.value, sortSel.value); };
  setActive(tab);
  renderBS(tab, search.value, sortSel.value);
}
function renderBS(tab, q, sort) {
  const list = $('#bs-list');
  const kw = q.trim().toLowerCase();
  if (tab === 'mon') {
    const items = DATA.monsters.filter(m => !kw || (m.name_zh + ' ' + m.name + ' ' + (m.description_zh || '') + ' ' + (m.description || '')).toLowerCase().includes(kw));
    list.innerHTML = items.map(m => `<div class="card" onclick="location.hash='#monster/${esc(m.id)}'">
      ${imgTag(m.img, 'card-img')}
      <div class="card-name">${esc(m.name_zh || m.name)}</div>
      <div class="card-sub">${esc(m.name)}</div>
      <div class="card-sub">掉落 ${m.drops.length} 种</div></div>`).join('') || '<p>无结果</p>';
  } else {
    let items = DATA.materials.filter(m => !kw || (m.name_zh + ' ' + m.name + ' ' + (m.description_zh || '')).toLowerCase().includes(kw));
    if (sort === 'fuse') items = items.slice().sort((a, b) => (b.fuse_attack_power || 0) - (a.fuse_attack_power || 0));
    list.innerHTML = items.map(m => `<div class="card" onclick="location.hash='#material/${esc(m.id)}'">
      ${imgTag(m.img, 'card-img')}
      <div class="card-name">${esc(m.name_zh || m.name)}</div>
      <div class="card-sub">余料+${m.fuse_attack_power || 0}</div>
      <div class="card-sub">${esc(m.cooking_effect || '—')}</div></div>`).join('') || '<p>无结果</p>';
  }
}
function viewMonsterDetail(id) {
  viewBestiary('mon');
  const m = DATA.monsters.find(x => String(x.id) === String(id)); if (!m) return;
  const drops = m.drops.map(d => `<tr><td>${imgTag(d.img, 'mini')}</td><td>${esc(d.name_zh || d.name)}</td>
    <td class="num">+${d.fuse_attack_power || 0}</td><td>${esc(d.cooking_effect || '—')}</td></tr>`).join('') || '<tr><td colspan="4">无</td></tr>';
  showModal(`<h2>${esc(m.name_zh || m.name)} <small>${esc(m.name)}</small></h2>
    <div class="detail-flex">${imgTag(m.img, 'detail-img')}
      <div><p>${descHtml(m)}</p>
      <p><b>出没：</b>${esc((m.common_locations || []).join('、') || '—')}</p></div></div>
    <h3>掉落物（含余料加成 / 料理效果）</h3>
    <table class="dt"><tr><th></th><th>名称</th><th>余料加成</th><th>料理效果</th></tr>${drops}</table>`);
}
function viewMaterialDetail(id) {
  viewBestiary('mat');
  const m = DATA.materials.find(x => String(x.id) === String(id)); if (!m) return;
  const dropBy = (m.dropped_by || []).join('、') || '—';
  showModal(`<h2>${esc(m.name_zh || m.name)} <small>${esc(m.name)}</small></h2>
    <div class="detail-flex">${imgTag(m.img, 'detail-img')}
      <div><p>${descHtml(m)}</p>
      <p><b>余料攻击加成：</b>+${m.fuse_attack_power || 0}</p>
      <p><b>料理效果：</b>${esc(m.cooking_effect || '—')}</p>
      <p><b>回血量：</b>${m.hearts_recovered || '—'}</p>
      <p><b>出没：</b>${esc((m.common_locations || []).join('、') || '—')}</p>
      <p><b>掉落自：</b>${esc(dropBy)}</p></div></div>`);
}

// ===== 服装 =====
function viewArmor() {
  const sets = {};
  DATA.armors.forEach(a => { const k = a.set && a.set !== 'None' ? a.set : '单件 / 其他'; (sets[k] = sets[k] || []).push(a); });
  const order = Object.keys(sets).sort();
  $('#view').innerHTML = `<div class="list-view">
    <div class="tabs"><input id="ar-search" class="search" placeholder="搜索防具名称…">
      <button class="ghost-btn" onclick="App.computeArmor()">📦 汇总未升级材料</button></div>
    <div id="ar-out"></div></div>`;
  const render = () => {
    const kw = $('#ar-search').value.trim().toLowerCase();
    let html = '';
    order.forEach(s => {
      const items = sets[s].filter(a => !kw || (a.name_zh + a.name).toLowerCase().includes(kw));
      if (!items.length) return;
      html += `<div class="set-block"><h3 class="set-title">${esc(s)}</h3><div class="card-grid set-grid">` + items.map(a => `
        <div class="card" onclick="location.hash='#armord/${esc(encodeURIComponent(a.name))}'">
          ${imgTag(a.img, 'card-img')}
          <div class="card-name">${esc(a.name_zh || a.name)}</div>
          <div class="card-sub">${esc(a.name)}</div>
          <div class="card-sub">防御 ${a.defense[0] || '?'}→${a.defense[a.defense.length - 1] || '?'}</div>
        </div>`).join('') + '</div></div>';
    });
    $('#ar-out').innerHTML = html ? `<div class="set-cols">${html}</div>` : '<p>无结果</p>';
  };
  $('#ar-search').oninput = render;
  render();
}
function viewArmorDetail(name) {
  viewArmor();
  const a = DATA.armors.find(x => x.name === decodeURIComponent(name)); if (!a) return;
  const tiers = a.upgrade.map(t => {
    const done = Store.armorTierDone(a.name, t.level);
    const mats = t.materials.map(mm => `<li>${esc(mm.name_zh || mm.name)} ×${mm.qty}</li>`).join('');
    return `<tr class="${done ? 'done' : ''}"><td>★${t.level}</td><td class="num">防御 ${t.defense}</td>
      <td class="num">💰${t.cost}</td><td><ul class="mats">${mats}</ul></td>
      <td><input type="checkbox" ${done ? 'checked' : ''} onchange="App.toggleTier('${esc(a.name)}',${t.level})"></td></tr>`;
  }).join('');
  showModal(`<h2>${esc(a.name_zh || a.name)} <small>${esc(a.name)}</small></h2>
    <div class="detail-flex">${imgTag(a.img, 'detail-img')}
      <div><p>${descHtml(a)}</p>
      <p><b>部位：</b>${esc({ head: '头部', body: '身体', legs: '腿部' }[a.slot] || a.slot)}</p>
      <p><b>套装：</b>${esc(a.set || '—')} ｜ <b>效果：</b>${esc(a.effect || '—')}</p>
      <p><b>套装效果：</b>${esc(a.set_effect || '—')}</p>
      <p><b>获得方式：</b>${esc(a.obtained_zh || a.obtained || '待补充')}</p></div></div>
    <h3>升级材料（勾选已升级层级）</h3>
    <table class="dt"><tr><th>等级</th><th>防御</th><th>费用</th><th>材料</th><th>已升级</th></tr>${tiers}</table>`);
}
function computeArmorTotals() {
  const totals = {};
  DATA.armors.forEach(a => a.upgrade.forEach(t => {
    if (Store.armorTierDone(a.name, t.level)) return;
    t.materials.forEach(mm => { const key = mm.name_zh || mm.name; totals[key] = (totals[key] || 0) + mm.qty; });
  }));
  return totals;
}

// ===== 武器大全 =====
const WP_STATE = { q: '', sort: 'default' };   // 记住搜索词与排序，详情弹窗重建页面后恢复
function viewWeapons(initialTab) {
  const tab = initialTab || 'weapon';
  $('#view').innerHTML = `<div class="list-view">
    <div class="tabs">
      <button class="tab" data-t="weapon">武器</button>
      <button class="tab" data-t="bow">弓</button>
      <button class="tab" data-t="shield">盾牌</button>
      <span id="wp-sort-wrap" class="sort-wrap">
        <select id="wp-sort" class="sort-sel">
          <option value="default">排序：默认</option>
          <option value="attack">按攻击力↓</option>
          <option value="cat">按分类（单手/双手/枪）</option>
        </select>
      </span>
      <input id="wp-search" class="search" placeholder="搜索名称 / 介绍…">
    </div><div id="wp-list" class="card-grid"></div></div>`;
  const search = $('#wp-search');
  const sortSel = $('#wp-sort');
  // 恢复上次的搜索词与排序（点开详情会重建本页，不恢复的话排序/搜索会被重置）
  search.value = WP_STATE.q;
  sortSel.value = WP_STATE.sort;
  const setActive = t => { $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.t === t)); };
  $$('.tab').forEach(t => t.onclick = () => { setActive(t.dataset.t); search.value = ''; WP_STATE.q = ''; renderWP(t.dataset.t, '', sortSel.value); });
  sortSel.onchange = () => { WP_STATE.sort = sortSel.value; renderWP($('.tab.active').dataset.t, search.value, sortSel.value); };
  search.oninput = () => { WP_STATE.q = search.value; renderWP($('.tab.active').dataset.t, search.value, sortSel.value); };
  setActive(tab);
  renderWP(tab, search.value, sortSel.value);
}
const WP_CAT_ORDER = { 'one-handed': 0, 'two-handed': 1, 'spear': 2, '': 3 };
const WP_CAT_ZH = { 'one-handed': '单手', 'two-handed': '双手', 'spear': '枪' };
function renderWP(type, q, sort) {
  const kw = q.trim().toLowerCase();
  let items = DATA.equipment.filter(e => e.type === type && (!kw || (e.name_zh + ' ' + e.name + ' ' + (e.description_zh || '')).toLowerCase().includes(kw)));
  if (sort === 'attack') items = items.slice().sort((a, b) => (b.attack || 0) - (a.attack || 0));
  else if (sort === 'cat') items = items.slice().sort((a, b) => (WP_CAT_ORDER[a.subtype] ?? 9) - (WP_CAT_ORDER[b.subtype] ?? 9) || (b.attack || 0) - (a.attack || 0));
  $('#wp-list').innerHTML = items.map(e => `<div class="card" onclick="location.hash='#weapon/${esc(e.id)}'">
    ${imgTag(e.img, 'card-img')}<div class="card-name">${esc(e.name_zh || e.name)}</div>
    <div class="card-sub">${esc(e.name)}</div>
    <div class="card-sub">攻 ${e.attack || '?'} ｜ 防 ${e.defense || '?'}${e.subtype ? ' ｜ ' + (WP_CAT_ZH[e.subtype] || e.subtype) : ''}</div></div>`).join('') || '<p>无结果</p>';
}
function viewWeaponDetail(id) {
  const e = DATA.equipment.find(x => String(x.id) === String(id)); if (!e) return;
  viewWeapons(e.type);
  showModal(`<h2>${esc(e.name_zh || e.name)} <small>${esc(e.name)}</small></h2>
    <div class="detail-flex">${imgTag(e.img, 'detail-img')}
      <div><p>${descHtml(e)}</p>
      <p><b>类型：</b>${esc({ weapon: '武器', bow: '弓', shield: '盾牌' }[e.type])}${e.subtype ? '（' + (WP_CAT_ZH[e.subtype] || e.subtype) + '）' : ''}</p>
      <p><b>攻击：</b>${e.attack || '?'} ｜ <b>防御：</b>${e.defense || '?'}</p>
      <p><b>附加：</b>${esc(e.effect || '—')}</p>
      <p><b>获取区域：</b>${esc((e.common_locations || []).join('、') || '—')}</p></div></div>`);
}

// ===== 任务 =====
const QUEST_CATS = [
  ['main', '主线任务', null],
  ['side_adventure', '小冒险'],
  ['side_quest', '支线任务'],
  ['shrine_quest', '神庙挑战']
];
function viewQuests() {
  const tabs = [['main', '主线(精)'], ['side_adventure', '小冒险(精)'], ['side_quest', '支线'], ['shrine_quest', '神庙']];
  $('#view').innerHTML = `<div class="list-view">
    <div class="tabs">${tabs.map(t => `<button class="tab" data-c="${t[0]}">${t[1]}</button>`).join('')}
      <input id="qs-search" class="search" placeholder="搜索任务…"></div>
    <div id="qs-list"></div></div>`;
  const show = c => { const kw = ($('#qs-search').value || '').trim().toLowerCase(); renderQuests(c, kw); };
  $$('.tab').forEach(t => t.onclick = () => { $$('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); show(t.dataset.c); });
  $('#qs-search').oninput = () => show($('.tab.active') ? $('.tab.active').dataset.c : 'main');
  $$('.tab')[0].classList.add('active'); show('main');
}
function renderQuests(cat, kw) {
  const items = DATA.quests.filter(q => q.category === cat && (!kw || (q.name_zh + q.name_en).toLowerCase().includes(kw)));
  const done = items.filter(q => Store.questDone(q.id)).length;
  $('#qs-list').innerHTML = `<div class="qs-head">共 ${items.length} 项 ｜ 已完成 ${done}
    ${cat === 'main' || cat === 'side_adventure' ? '｜ <span class="badge">详细版</span>' : '｜ <span class="badge light">简版</span>'}</div>` +
    (items.map(q => {
      const d = Store.questDone(q.id);
      const note = Store.getQuestNote(q.id) || {};
      const ov = q.overview_zh || q.overview_en || '';
      const body = q.detail_level === 'detailed'
        ? `<div class="qs-body">说明：${esc(ov || '待补充')}</div>
           <div class="qs-body">触发：${esc(note.trigger || q.trigger || '待补充')}</div>
           <div class="qs-body">步骤：${esc(note.steps || q.steps?.join('；') || '待补充')}</div>
           <div class="qs-body">奖励：${esc(note.reward || q.reward || '待补充')}</div>`
        : `<div class="qs-body">说明：${esc(ov || note.trigger || '一句话说明 + 触发坐标，待补充')}</div>`;
      return `<div class="qs-item ${d ? 'done' : ''}" data-id="${esc(q.id)}" onclick="App.toggleQuest('${esc(q.id)}', this)">
        <input type="checkbox" ${d ? 'checked' : ''} onclick="event.stopPropagation();App.toggleQuest('${esc(q.id)}', this.closest('.qs-item'))">
        <div class="qs-main"><div class="qs-name">${esc(q.name_zh || q.name_en)}</div>${body}</div></div>`;
    }).join('') || '<p>无结果</p>');
}
function viewQuestDetail(id) {
  viewQuests();
  const q = DATA.quests.find(x => x.id === id); if (!q) return;
  const note = Store.getQuestNote(q.id) || {};
  showModal(`<h2>${esc(q.name_zh || q.name_en)} <small>${esc(q.name_en)}</small></h2>
    <p><b>任务背景：</b>${esc(q.overview_zh || q.overview_en || '待补充')}</p>
    <p><b>分类：</b>${esc(q.category_zh)} ｜ <b>模式：</b>${q.detail_level === 'detailed' ? '详细' : '简版'}</p>
    <label>触发点：<input id="qn-trigger" class="note-in" value="${esc(note.trigger || '')}"></label>
    <label>步骤要点：<textarea id="qn-steps" class="note-ta">${esc(note.steps || '')}</textarea></label>
    <label>奖励：<input id="qn-reward" class="note-in" value="${esc(note.reward || '')}"></label>
    <button class="ghost-btn" onclick="App.saveQuest('${esc(q.id)}')">保存备注</button>`);
}
function viewShrineDetail(id) {
  const s = DATA.shrines.find(x => x.id === id); if (!s) return;
  const sol = s.solution_zh || s.solution_en || '待补充';
  showModal(`<h2>${esc(s.name_zh || s.name)} <small>${esc(s.name)}</small></h2>
    <p><b>层级：</b>${s.layer === 'sky' ? '天空' : '地表'} ｜ <b>编号：</b>${esc(s.id)}</p>
    <h3>解谜要点</h3>
    <div class="sol-body">${esc(sol)}</div>`);
}

// ===== 通用：弹窗 / 进度导入导出 =====
function showModal(html) {
  let m = $('#modal');
  if (!m) { m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-mask'; document.body.appendChild(m); }
  m.innerHTML = `<div class="modal-box"><button class="modal-close" onclick="closeModal()">×</button>${html}</div>`;
  m.style.display = 'flex';
  m.onclick = e => { if (e.target === m) closeModal(); };
}
function closeModal() { const m = $('#modal'); if (m) m.style.display = 'none'; }
const App = {
  toggleTier(name, lvl) { Store.toggleArmorTier(name, lvl); },
  viewShrineDetail(id) { viewShrineDetail(id); },
  toggleQuest(id, el) { Store.toggleQuest(id); el.classList.toggle('done'); const c = el.querySelector('input'); if (c) c.checked = !c.checked; },
  saveQuest(id) {
    Store.setQuestNote(id, { trigger: $('#qn-trigger').value, steps: $('#qn-steps').value, reward: $('#qn-reward').value });
    closeModal(); const t = $('.tab.active'); if (t) renderQuests(t.dataset.c, '');
  },
  computeArmor() {
    const totals = computeArmorTotals();
    const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><b>${esc(k)}</b> × ${v}</li>`).join('') || '<li>全部已升级 ✅</li>';
    showModal(`<h2>📦 升级材料汇总（未升级层级）</h2><ul class="mats totals">${rows}</ul>
      <p class="sub">已勾选的层级不计入。前往各防具详情勾选已升级层级即可实时更新。</p>`);
  },
  exportProgress() {
    const blob = new Blob([Store.export()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'totk_progress.json'; a.click();
  },
  importProgress() {
    const inp = document.createElement('input'); inp.type = 'file';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { Store.import(r.result); alert('导入成功，刷新页面生效'); location.reload(); } catch (e) { alert('导入失败：文件格式错误'); } }; r.readAsText(f); };
    inp.click();
  }
};
window.App = App; window.closeModal = closeModal;

// ===== 全局搜索 =====
function initSearch() {
  const box = $('#global-search');
  box.oninput = () => {
    const q = box.value.trim().toLowerCase(); const dd = $('#search-dd');
    if (q.length < 1) { dd.style.display = 'none'; return; }
    const res = [];
    DATA.monsters.forEach(m => { if ((m.name_zh + ' ' + m.name + ' ' + (m.description_zh || '')).toLowerCase().includes(q)) res.push(['monster/' + m.id, m.name_zh || m.name, '怪物']); });
    DATA.materials.forEach(m => { if ((m.name_zh + ' ' + m.name + ' ' + (m.description_zh || '')).toLowerCase().includes(q)) res.push(['material/' + m.id, m.name_zh || m.name, '素材']); });
    DATA.armors.forEach(a => { if ((a.name_zh + ' ' + a.name + ' ' + (a.description_zh || '')).toLowerCase().includes(q)) res.push(['armord/' + encodeURIComponent(a.name), a.name_zh || a.name, '防具']); });
    DATA.equipment.forEach(e => { if ((e.name_zh + ' ' + e.name + ' ' + (e.description_zh || '')).toLowerCase().includes(q)) res.push(['weapon/' + e.id, e.name_zh || e.name, '装备']); });
    DATA.quests.forEach(qu => { if ((qu.name_zh + ' ' + qu.name_en).toLowerCase().includes(q)) res.push(['quest/' + qu.id, qu.name_zh || qu.name_en, '任务']); });
    dd.innerHTML = res.slice(0, 12).map(r => `<div class="dd-item" onclick="location.hash='#${r[0]}';document.getElementById('search-dd').style.display='none'">${esc(r[1])} <span class="dd-cat">${r[2]}</span></div>`).join('') || '<div class="dd-item">无结果</div>';
    dd.style.display = 'block';
  };
}

// ===== 启动 =====
(async function () {
  try { await loadAll(); } catch (e) { $('#view').innerHTML = '<p class="err">数据加载失败，请通过本地服务器（如 http-server）打开本页，勿用 file:// 直接打开。</p>'; return; }
  $('#nav').innerHTML = [
    ['home', '首页'], ['guide', '地图指引'],
    ['bestiary', '图鉴'], ['armor', '服装'], ['weapons', '武器'], ['quests', '任务']
  ].map(n => `<a href="#${n[0]}" data-route="${n[0]}">${n[1]}</a>`).join('');
  initSearch();
  router();
})();
