// 收集进度存储（localStorage）+ 导入/导出
const Store = {
  KEY: 'totk_progress_v1',
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch (e) { this.data = {}; }
    this.data.done = this.data.done || {};          // {cat:{id:true}}
    this.data.armorTiers = this.data.armorTiers || {}; // {aid:{tier:true}}
    this.data.quests = this.data.quests || {};        // {qid:true}
    this.data.korokNote = this.data.korokNote || {};  // {id:note}
    this.data.questNote = this.data.questNote || {};  // {id:{trigger,steps,reward}}
    return this.data;
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
  // 地图类（神庙/呀哈哈/怪物）勾选
  isDone(cat, id) { return !!(this.data.done[cat] && this.data.done[cat][id]); },
  toggle(cat, id) {
    this.data.done[cat] = this.data.done[cat] || {};
    this.data.done[cat][id] = !this.data.done[cat][id];
    this.save(); return this.data.done[cat][id];
  },
  doneCount(cat, ids) { let n = 0; ids.forEach(id => { if (this.isDone(cat, id)) n++; }); return n; },
  // 防具升级层级勾选
  armorTierDone(aid, tier) { return !!(this.data.armorTiers[aid] && this.data.armorTiers[aid][tier]); },
  toggleArmorTier(aid, tier) {
    this.data.armorTiers[aid] = this.data.armorTiers[aid] || {};
    this.data.armorTiers[aid][tier] = !this.data.armorTiers[aid][tier];
    this.save();
  },
  // 任务完成
  questDone(qid) { return !!this.data.quests[qid]; },
  toggleQuest(qid) { this.data.quests[qid] = !this.data.quests[qid]; this.save(); },
  // 呀哈哈备注
  getNote(id) { return this.data.korokNote[id] || ''; },
  setNote(id, t) { this.data.korokNote[id] = t; this.save(); },
  // 任务备注
  getQuestNote(id) { return this.data.questNote[id] || {}; },
  setQuestNote(id, obj) { this.data.questNote[id] = obj; this.save(); },
  export() { return JSON.stringify(this.data); },
  import(s) { this.data = JSON.parse(s); this.save(); }
};
Store.load();
