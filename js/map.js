// 地图引擎：Leaflet + L.CRS.Simple + 三层底图 + 高性能 circleMarker
const MapEngine = (function () {
  let map = null;
  let cfg = null;

  function destroy() { if (map) { map.remove(); map = null; } }

  function build(containerId, config) {
    destroy();
    cfg = config;
    map = L.map(containerId, {
      crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomControl: true,
      attributionControl: false, preferCanvas: true, maxBoundsViscosity: 1.0
    });
    // 参考 vetyst/TotK-Object-Map 的坐标变换：图像空间 = 游戏坐标空间
    const b1 = map.unproject([-6000, 5000], 0);
    const b2 = map.unproject([6000, -5000], 0);
    const bounds = L.latLngBounds(b1, b2);
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
    // 最小缩放锁定为「铺满视口」(cover) 级别：缩到最小时地图刚好填满主窗口，无灰底、无多余拖动空间
    const coverZoom = map.getBoundsZoom(bounds, false);
    map.setMinZoom(coverZoom);
    if (map.getZoom() < coverZoom) map.setZoom(coverZoom);
    map.on('resize', () => {
      const cz = map.getBoundsZoom(bounds, false);
      map.setMinZoom(cz);
      if (map.getZoom() < cz) map.setZoom(cz);
    });

    const baseImgs = { surface: 'assets/maps/surface.jpg', sky: 'assets/maps/sky.jpg', depths: 'assets/maps/depths.jpg' };
    let activeLayer = config.layerOptions[0];
    const baseLayer = L.imageOverlay(baseImgs[activeLayer], bounds).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    function layerVisible(m) {
      if (m.layer === activeLayer) return true;
      if (activeLayer === 'surface' && m.layer === 'cave') return true; // 洞窟归属地表层显示
      return false;
    }
    function render() {
      markersLayer.clearLayers();
      const total = cfg.data.length;
      let shown = 0;
      cfg.data.forEach(m => {
        if (cfg.typeFilter && cfg.typeFilter.value && m[cfg.typeFilter.field] !== cfg.typeFilter.value) return;
        if (!layerVisible(m)) return;
        shown++;
        const done = Store.isDone(cfg.progressCat, m.id);
        const c = cfg.colorFn(m);
        const mk = L.circleMarker([m.x, m.y], {
          radius: cfg.radius || 4, color: done ? '#9aa' : c, weight: 1,
          fillColor: done ? '#cdd' : c, fillOpacity: done ? 0.35 : 0.9
        });
        mk.bindPopup(popupHtml(m, done));
        markersLayer.addLayer(mk);
      });
      updateCount(shown);
    }
    function popupHtml(m, done) {
      const name = m.name_zh || m.name || m.id || '';
      const sub = cfg.popupSub ? cfg.popupSub(m) : '';
      const btn = `<button class="pop-btn" onclick="MapEngine._toggle('${cfg.progressCat}','${m.id}')">${done ? '✓ 已收集（点此取消）' : '标记为已收集'}</button>`;
      const detailBtn = cfg.detailFn ? `<button class="pop-btn" onclick="App.${cfg.detailFn}('${m.id}')">查看解谜要点</button>` : '';
      return `<div class="map-pop"><b>${name}</b>${sub}<div class="pop-btns">${btn}${detailBtn}</div></div>`;
    }
    function updateCount(shown) {
      const ids = cfg.data.map(m => m.id);
      const done = Store.doneCount(cfg.progressCat, ids);
      const el = document.getElementById(cfg.countEl);
      if (el) el.textContent = `已收集 ${done} / ${cfg.data.length}` + (shown !== cfg.data.length ? `（本层显示 ${shown}）` : '');
    }
    MapEngine._toggle = function (cat, id) {
      Store.toggle(cat, id);
      render();
      if (cfg.onToggle) cfg.onToggle();
    };
    // 层级切换
    const layerBar = document.getElementById(cfg.layerBarId);
    if (layerBar) {
      layerBar.innerHTML = '';
      cfg.layerOptions.forEach(l => {
        const b = document.createElement('button');
        b.textContent = cfg.layerLabels ? cfg.layerLabels[l] : l;
        b.className = 'layer-btn' + (l === activeLayer ? ' active' : '');
        b.onclick = () => {
          activeLayer = l; baseLayer.setUrl(baseImgs[l]);
          [...layerBar.children].forEach(x => x.classList.remove('active'));
          b.classList.add('active'); render();
        };
        layerBar.appendChild(b);
      });
    }
    // 类型筛选
    if (cfg.typeFilter && cfg.typeFilterBarId) {
      const bar = document.getElementById(cfg.typeFilterBarId);
      if (bar) {
        bar.innerHTML = '';
        const all = document.createElement('button');
        all.textContent = '全部'; all.className = 'filter-btn active';
        all.onclick = () => { cfg.typeFilter.value = null; [...bar.children].forEach(x => x.classList.remove('active')); all.classList.add('active'); render(); };
        bar.appendChild(all);
        cfg.typeFilter.options.forEach(o => {
          const b = document.createElement('button');
          b.textContent = cfg.typeFilter.labels[o]; b.className = 'filter-btn';
          b.onclick = () => { cfg.typeFilter.value = o; [...bar.children].forEach(x => x.classList.remove('active')); b.classList.add('active'); render(); };
          bar.appendChild(b);
        });
      }
    }
    render();
  }

  // ===== 多源图层模式（地图指引页）=====
  // config: { layerOptions, layerLabels, layerBarId, sources:[{key,label,color|colorFn,radius,data,progressCat,popupSub,detailFn,enabled}], onCounts }
  let mcfg = null;
  function buildMulti(containerId, config) {
    destroy();
    mcfg = config;
    map = L.map(containerId, {
      crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomControl: true,
      attributionControl: false, preferCanvas: true, maxBoundsViscosity: 1.0
    });
    const b1 = map.unproject([-6000, 5000], 0);
    const b2 = map.unproject([6000, -5000], 0);
    const bounds = L.latLngBounds(b1, b2);
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
    // 最小缩放锁定为「铺满视口」(cover) 级别：缩到最小时地图刚好填满主窗口，无灰底、无多余拖动空间
    const coverZoom = map.getBoundsZoom(bounds, false);
    map.setMinZoom(coverZoom);
    if (map.getZoom() < coverZoom) map.setZoom(coverZoom);
    map.on('resize', () => {
      const cz = map.getBoundsZoom(bounds, false);
      map.setMinZoom(cz);
      if (map.getZoom() < cz) map.setZoom(cz);
    });
    const baseImgs = { surface: 'assets/maps/surface.jpg', sky: 'assets/maps/sky.jpg', depths: 'assets/maps/depths.jpg' };
    let activeLayer = config.layerOptions[0];
    const baseLayer = L.imageOverlay(baseImgs[activeLayer], bounds).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    function layerVisible(m) {
      if (m.layer === activeLayer) return true;
      if (activeLayer === 'surface' && m.layer === 'cave') return true;
      return false;
    }
    function popupHtml(src, m, done) {
      const name = m.name_zh || m.name || m.id || '';
      const sub = src.popupSub ? src.popupSub(m) : '';
      const btn = `<button class="pop-btn" onclick="MapEngine._toggleM('${src.progressCat}','${m.id}')">${done ? '✓ 已收集（点此取消）' : '标记为已收集'}</button>`;
      const detailBtn = src.detailFn ? `<button class="pop-btn" onclick="App.${src.detailFn}('${m.id}')">查看解谜要点</button>` : '';
      return `<div class="map-pop"><b>${name}</b>${sub}<div class="pop-btns">${btn}${detailBtn}</div></div>`;
    }
    function render() {
      markersLayer.clearLayers();
      const counts = {};
      mcfg.sources.forEach(src => {
        let shown = 0;
        if (src.enabled) {
          src.data.forEach(m => {
            if (!layerVisible(m)) return;
            shown++;
            const done = Store.isDone(src.progressCat, m.id);
            const c = src.colorFn ? src.colorFn(m) : src.color;
            const mk = L.circleMarker([m.x, m.y], {
              radius: src.radius || 4, color: done ? '#9aa' : c, weight: 1,
              fillColor: done ? '#cdd' : c, fillOpacity: done ? 0.35 : 0.9
            });
            mk.bindPopup(popupHtml(src, m, done));
            markersLayer.addLayer(mk);
          });
        } else {
          src.data.forEach(m => { if (layerVisible(m)) shown++; });
        }
        counts[src.key] = { shown, total: src.data.length, layer: activeLayer };
      });
      if (mcfg.onCounts) mcfg.onCounts(counts);
    }
    MapEngine._toggleM = function (cat, id) { Store.toggle(cat, id); render(); };
    MapEngine.setSourceEnabled = function (key, on) {
      const s = mcfg.sources.find(x => x.key === key);
      if (s) { s.enabled = on; render(); }
    };
    // 层级切换
    const layerBar = document.getElementById(config.layerBarId);
    if (layerBar) {
      layerBar.innerHTML = '';
      config.layerOptions.forEach(l => {
        const b = document.createElement('button');
        b.textContent = config.layerLabels ? config.layerLabels[l] : l;
        b.className = 'layer-btn' + (l === activeLayer ? ' active' : '');
        b.onclick = () => {
          activeLayer = l; baseLayer.setUrl(baseImgs[l]);
          [...layerBar.children].forEach(x => x.classList.remove('active'));
          b.classList.add('active'); render();
        };
        layerBar.appendChild(b);
      });
    }
    render();
  }
  return { build, buildMulti, destroy };
})();
