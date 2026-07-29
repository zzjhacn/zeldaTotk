# 王国之泪 · 全攻略（离线资料站）

> 本系统全部由WorkBuddy生成

一个纯静态、可离线运行的《塞尔达传说：王国之泪》（*The Legend of Zelda: Tears of the Kingdom*）个人攻略资料站。无需后端、无需构建，所有数据以 JSON 形式随站分发，进度保存在浏览器本地。

> 这是一个**非商业的粉丝向**（fan-made）参考工具，与任天堂（Nintendo）无任何隶属或背书关系。详见文末「数据与版权声明」。

## 功能特性

- **地图指引**：基于 Leaflet 的分层交互地图，覆盖地表（surface）/ 空域（sky）/ 地底（depths）三层。可勾选叠加的图层包括：
  - 神庙 ×152、呀哈哈 ×900、高阶怪物 ×1602
  - 洞窟 ×148、井 ×59、鸟望台 ×15
  - 左侧勾选框实时显示「当前已标记 / 总数」进度
- **图鉴**：怪物 ×110、素材 ×126，含中文名称与说明。
- **服装**：防具套装 ×135，含获得方式、升级层级打卡。
- **武器**：装备 / 武器 ×175。
- **任务**：主线与支线任务 ×253，含任务说明与完成打卡。
- **全局搜索**：右上角搜索框，支持按怪物 / 素材 / 防具 / 武器 / 任务中文名即时检索并跳转详情。

进度（神庙、呀哈哈、怪物、防具升级、任务完成等）通过 `localStorage` 保存在本机，并支持导入 / 导出备份。

## 目录结构

```
site/
├── index.html          # 入口页面
├── LICENSE             # MIT 许可证（仅覆盖本仓库中的原创代码）
├── README.md           # 本文件
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── app.js          # 路由、视图渲染、搜索、进度交互
│   ├── map.js          # Leaflet 地图引擎封装（build / buildMulti）
│   └── store.js        # 进度存储（localStorage）+ 导入导出
├── data/               # 全部站点数据（JSON）
│   ├── meta.json       # 数据统计与生成信息
│   ├── shrines.json    # 神庙
│   ├── koroks.json     # 呀哈哈
│   ├── high_tier_monsters.json  # 高阶怪物点位
│   ├── monsters.json   # 怪物图鉴
│   ├── materials.json  # 素材图鉴
│   ├── armors.json     # 服装 / 防具
│   ├── equipment.json  # 武器 / 装备
│   ├── quests.json     # 任务
│   └── locations.json  # 洞窟 / 井 / 鸟望台
├── assets/
│   ├── img/            # 图标与图鉴图片（compendium / icons）
│   └── maps/           # 三层地图底图（surface.jpg / sky.jpg / depths.jpg）
└── vendor/
    ├── leaflet.js      # Leaflet 地图库（BSD-2-Clause，随仓库分发）
    └── leaflet.css
```

## 本地运行

站点通过 `fetch()` 加载 `data/*.json`，因此**必须通过 HTTP 服务访问**，直接用浏览器打开 `index.html`（`file://`）会因 CORS 限制而加载失败。

任选一种方式启动本地静态服务器（在 `site/` 目录下执行）：

```bash
# 方式一：Python（最常用）
python3 -m http.server 8000

# 方式二：Node
npx serve .

# 方式三：PHP
php -S localhost:8000
```

然后浏览器打开 <http://localhost:8000> 即可。

![首页图](overview.png)

## 技术栈

- 原生 HTML / CSS / JavaScript，**无构建步骤、无框架依赖**
- [Leaflet](https://leafletjs.com/)（BSD-2-Clause）用于交互地图，已随仓库置于 `vendor/`
- 数据：纯 JSON，前端 `fetch` 加载
- 进度持久化：`localStorage`

## 数据与版权声明

### 代码许可

本仓库中的**原创代码与结构**——包括 `index.html`、`css/style.css`、`js/*.js`、`README.md`——以 **MIT 许可证**发布，详见 `LICENSE`。

### 第三方组件

- **Leaflet** 由 Vladimir Agafonkin 及贡献者以 BSD-2-Clause 许可发布，版权声明随其源码保留于 `vendor/leaflet.js`。

### 游戏数据与内容

本站所收录的游戏数据、中文译名、地图底图与图标，其底层内容均来源于《塞尔达传说：王国之泪》这款受版权保护的作品，**版权归 Nintendo 所有**。具体数据整合自以下社区开源项目：

- **地图点位与坐标**（洞窟 / 井 / 鸟望台 / 高阶怪物）— 基于 [vetyst/TotK-Object-Map](https://github.com/vetyst/TotK-Object-Map) 及其社区地图数据。
- **中文名称与说明**（怪物 / 素材 / 防具 / 武器）— 基于 [tingod/totk](https://github.com/tingod/totk) 提供的中文本地化数据。
- **防具获得方式与任务日志** — 整理自 [Zelda Wiki](https://zelda.fandom.com/wiki/Zelda_Wiki)。

上述来源各自遵循其原有的许可条款。请在使用、转载或二次分发本站数据时，遵守 Nintendo 及上述社区项目的相关规定。

> ⚠️ 本项目为**个人非商业用途的粉丝作品**，仅作学习与交流参考，不用于任何盈利目的，亦未获得任天堂授权或背书。如权利方对本站内容有异议，请联系作者下架。

## License

Code in this repository (original HTML/CSS/JS and documentation) is licensed under the **MIT License** — see [`LICENSE`](./LICENSE). Game data, map imagery, and derived content remain the property of their respective rights holders (Nintendo and the community sources cited above).
