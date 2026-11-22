/* 提示词模板 — 按 FrameThrower 官方写法提炼（详见 ../prompt-craft-study.md）。
 *
 * 官方 prompt 是固定模板拼出来的（41 帧样本验证，结构完全一致）：
 *   场景描述(2句) + 人物块 + 主体动作句 + 场景时间句 + 灯光句 + 色彩句 + 风格情绪句
 *
 * - buildEN：有官方 prompt 就直接用（最准）；没有时按同一模板用元数据拼。
 * - buildCN：按同一槽位顺序生成中文提示词。
 * - buildFullText：一帧的全部信息（影片、场景、人物、镜头、灯光、色彩、标签、双语提示词）
 *   拼成一块可一键复制的文本。
 * - extractTags：从查询文本里按词典提取 Shot.Cafe 风格的英文标签（多词标签内空格转 +）。
 *
 * 纯函数，不碰 DOM。node 可直接测试（见 ../test_prompt_template.js）。
 */
(function (root) {
  "use strict";

  // API 枚举值 → 中文（只覆盖接口实际返回过的值）
  var API_CN = {
    eye_level: "平视", low_angle: "仰拍", high_angle: "俯拍",
    side_profile: "侧面", three_quarter: "四分之三侧面", frontal: "正面",
    spherical: "球面镜头", anamorphic: "变形宽银幕", vintage_soft: "复古柔焦",
    shallow: "浅景深", deep: "深焦",
    golden_hour: "黄金时刻", blue_hour: "蓝调时刻", night: "夜晚", day: "白天",
    dawn: "黎明", dusk: "黄昏", midday: "正午", morning: "清晨",
    afternoon: "下午", evening: "傍晚",
    exterior: "户外", interior: "室内",
    natural: "自然光", low_key: "低调光", high_key: "高调光",
    soft: "柔光", hard: "硬光", mixed: "混合光",
    neutral: "中性", lonely: "孤独", tense: "紧张", warm: "温暖",
    melancholic: "忧郁", eerie: "诡异", hopeful: "希望", somber: "凝重",
    contemporary: "当代", live_action: "实拍",
    "1920s": "1920年代", "1930s": "1930年代", "1940s": "1940年代",
    "1950s": "1950年代", "1960s": "1960年代", "1970s": "1970年代",
    "1980s": "1980年代", "1990s": "1990年代", "2000s": "2000年代",
    "2010s": "2010年代", "2020s": "2020年代",
  };

  // 常见画面物品 → 中文（没覆盖的保留英文原词，不丢信息）
  var OBJECT_CN = {
    man: "男人", woman: "女人", child: "孩子", soldier: "士兵",
    "young man": "年轻男子", "young woman": "年轻女子",
    car: "汽车", sedan: "轿车", candle: "蜡烛", "candle flame": "烛光",
    "candle holder": "烛台", "sand dune": "沙丘", "sand dunes": "沙丘",
    "neon sign": "霓虹灯招牌", pedestrian: "行人", pedestrians: "行人",
    building: "建筑", "building facade": "建筑立面", pavement: "人行道",
    street: "街道", face: "脸", hair: "头发", eyes: "眼睛", skin: "皮肤",
    beach: "沙滩", forest: "森林", desert: "沙漠", sea: "大海",
    footprints: "脚印", smoke: "烟", "car door": "车门",
    "fruit display stand": "水果摊", "dark fabric": "深色织物",
    "utility pole": "电线杆",
  };

  function clean(s) {
    return String(s == null ? "" : s).replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
  }
  function txt(v) {
    if (v == null) return "";
    if (typeof v === "string") return clean(v);
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return v.map(txt).filter(Boolean).join("、");
    if (typeof v === "object") return txt(v.value || v.name || v.text);
    return "";
  }
  function arr(v) {
    if (Array.isArray(v)) return v;
    if (v == null || v === "") return [];
    return [v];
  }
  function moodsOf(m) {
    var v = m && m.moods;
    if (v && typeof v === "object" && !Array.isArray(v)) return arr(v.value);
    return arr(v);
  }
  function cn(v) {
    var key = String(v == null ? "" : v).toLowerCase().trim();
    if (!key) return "";
    return API_CN[key] || String(v);
  }
  function cnObj(v) {
    var key = String(v == null ? "" : v).toLowerCase().trim();
    if (!key) return "";
    return OBJECT_CN[key] || String(v);
  }
  function sent(s) {
    s = clean(s).trim();
    if (!s) return "";
    if (!/[.!?。！？]$/.test(s)) s += ".";
    return s;
  }

  /* 英文：官方 prompt 优先；没有时按官方模板的槽位顺序拼。 */
  function buildEN(frame) {
    frame = frame || {};
    var m = frame.metadata || {};
    if (frame.prompt) return clean(frame.prompt).trim();
    var parts = [];
    var desc = txt(m.sceneDescription);
    if (desc) parts.push(sent(desc));
    var settingBits = [txt(m.setting), txt(m.timeOfDay)].filter(Boolean);
    if (settingBits.length) parts.push("Set in " + settingBits.join(", ") + ".");
    var light = txt(m.lightingDescription);
    if (light) parts.push(sent(light));
    var color = txt(m.colorDescription);
    if (color) parts.push(sent(color));
    var cam = [];
    if (txt(m.lensCharacter)) cam.push(txt(m.lensCharacter) + " lens");
    if (txt(m.depthOfField)) cam.push(txt(m.depthOfField) + " depth of field");
    if (txt(m.cameraAngle)) cam.push(txt(m.cameraAngle));
    if (cam.length) parts.push(cam.join(", ") + ".");
    var moods = moodsOf(m).map(txt).filter(Boolean);
    var style = txt(m.visualStyle);
    if (style || moods.length) {
      parts.push((style ? style + " style" : "Live action style") +
        (moods.length ? " with a " + moods.join(", ") + " mood" : "") + ".");
    }
    return parts.join(" ");
  }

  /* 中文：按官方模板的槽位顺序生成——定场 → 画面 → 场景描述 → 灯光 → 色彩 → 镜头 → 氛围 → 参考。 */
  function buildCN(frame) {
    frame = frame || {};
    var m = frame.metadata || {};
    var f = frame.film || {};
    var segs = [];
    var where = [cn(m.timeOfDay), cn(m.setting)].filter(Boolean).join("的");
    if (where) segs.push(where + "。");
    if (cn(m.era)) segs.push(cn(m.era) + "。");
    var objs = arr(m.objects).map(cnObj).filter(Boolean);
    if (objs.length) segs.push("画面里有" + objs.join("、") + "。");
    var desc = txt(m.sceneDescription);
    if (desc) segs.push(sent(desc));
    var lightKey = [cn(m.lightingKey), (m.lightingQuality && cn(m.lightingQuality.value))].filter(Boolean).join("");
    if (lightKey) segs.push("灯光" + lightKey + "。");
    var lightDesc = txt(m.lightingDescription);
    if (lightDesc) segs.push(sent(lightDesc));
    var colorDesc = txt(m.colorDescription);
    if (colorDesc) segs.push(sent(colorDesc));
    var palette = arr(m.colorPalette || m.palette).map(txt).filter(Boolean);
    if (palette.length) segs.push("色板：" + palette.join(" ") + "。");
    var camCN = [cn(m.lensCharacter), cn(m.depthOfField), cn(m.cameraAngle)].filter(Boolean);
    if (camCN.length) segs.push("镜头：" + camCN.join("，") + "。");
    var moods = moodsOf(m).map(cn).filter(Boolean);
    if (moods.length) segs.push("氛围：" + moods.join("、") + "。");
    var ref = [];
    if (f.title) ref.push("《" + f.title + "》" + (f.year ? "（" + f.year + "）" : ""));
    var director = txt(f.director).replace(/[,，\s]+$/, "");
    if (director) ref.push("导演" + director);
    var dp = txt(f.dp || f.DP).replace(/[,，\s]+$/, "");
    if (dp) ref.push("摄影指导" + dp);
    if (ref.length) segs.push("参考：" + ref.join("，") + "。");
    return segs.join(" ");
  }

  /* 一键复制全部信息：把一帧的所有字段拼成一块文本，空的段落自动跳过。 */
  function buildFullText(frame) {
    frame = frame || {};
    var m = frame.metadata || {};
    var f = frame.film || {};
    var lines = [];

    var filmBits = [];
    if (txt(f.title)) filmBits.push("《" + txt(f.title) + "》" + (f.year ? "（" + f.year + "）" : ""));
    var director = txt(f.director).replace(/[,，\s]+$/, "");
    if (director) filmBits.push("导演：" + director);
    var dp = txt(f.dp || f.DP).replace(/[,，\s]+$/, "");
    if (dp) filmBits.push("摄影指导：" + dp);
    var genres = arr(f.genres).map(txt).filter(Boolean);
    if (genres.length) filmBits.push("类型：" + genres.join(" / "));
    if (filmBits.length) lines.push(filmBits.join("\n"));

    function section(title, body) {
      body = (body || "").trim();
      if (!body) return;
      lines.push("", "【" + title + "】", body);
    }
    // 英文枚举值后附中文注释（如 eye_level（平视）），词典里没有的原样保留
    function gloss(v) {
      var s = txt(v);
      if (!s) return "";
      var c = cn(s);
      return c !== s ? s + "（" + c + "）" : s;
    }

    section("场景描述", txt(m.sceneDescription));
    if (txt(m.summary)) section("一句话梗概", txt(m.summary));

    var chars = arr(frame.characters || m.characters).map(function (c) {
      if (typeof c === "string") return txt(c);
      if (!c || typeof c !== "object") return "";
      var head = [txt(c.age), txt(c.sex || c.gender), txt(c.ethnicity), txt(c.build)].filter(Boolean).join(" · ");
      var bits = [txt(c.appearance), txt(c.description), txt(c.clothing)];
      if (txt(c.mood)) bits.push("情绪：" + txt(c.mood));
      var body = bits.filter(Boolean).join("；");
      var doing = txt(c.doing);
      return [head, body, doing ? "DOING：" + doing : ""].filter(Boolean).join("；");
    }).filter(Boolean);
    section("人物", chars.join("\n"));

    var cam = [];
    if (txt(m.shotType)) cam.push("景别 " + gloss(m.shotType));
    if (txt(m.cameraAngle)) cam.push("机位 " + gloss(m.cameraAngle));
    if (txt(m.lensCharacter)) cam.push("镜头 " + gloss(m.lensCharacter));
    else if (txt(m.lens)) cam.push("镜头 " + gloss(m.lens));
    if (txt(m.depthOfField)) cam.push("景深 " + gloss(m.depthOfField));
    if (txt(m.composition)) cam.push("构图 " + gloss(m.composition));
    if (txt(m.aspectRatio)) cam.push("画幅 " + txt(m.aspectRatio));
    section("镜头摄影", cam.join("；"));

    var light = [];
    var lk = gloss(m.lightingKey);
    var lq = m.lightingQuality && gloss(m.lightingQuality.value);
    if (lk || lq) light.push("光型：" + [lk, lq].filter(Boolean).join(" / "));
    if (txt(m.lightingDescription)) light.push(txt(m.lightingDescription));
    else if (txt(m.lighting)) light.push(txt(m.lighting));
    section("灯光", light.join("\n"));

    var color = [];
    if (txt(m.colorDescription)) color.push(txt(m.colorDescription));
    var palette = arr(m.colorPalette || m.palette).map(txt).filter(Boolean);
    if (palette.length) color.push("色板：" + palette.join(" "));
    if (txt(m.contrastLevel)) color.push("对比：" + gloss(m.contrastLevel));
    section("色彩", color.join("\n"));

    var setting = [];
    if (txt(m.setting)) setting.push("地点：" + gloss(m.setting));
    if (txt(m.timeOfDay)) setting.push("时间：" + gloss(m.timeOfDay));
    if (txt(m.era)) setting.push("年代：" + gloss(m.era));
    if (txt(m.visualStyle)) setting.push("风格：" + gloss(m.visualStyle));
    var objs = arr(m.objects).map(function (o) {
      var s = txt(o);
      if (!s) return "";
      var c = cnObj(s);
      return c !== s ? s + "（" + c + "）" : s;
    }).filter(Boolean);
    if (objs.length) setting.push("画面物品：" + objs.join("、"));
    section("场景", setting.join("\n"));

    var moods = moodsOf(m).map(gloss).filter(Boolean);
    section("氛围", moods.join("、"));

    var tagBits = [];
    var tg = m.tags;
    if (Array.isArray(tg)) tagBits = tg.map(txt).filter(Boolean);
    else if (tg && typeof tg === "object") {
      Object.keys(tg).forEach(function (k) {
        arr(tg[k]).map(txt).filter(Boolean).forEach(function (v) { tagBits.push(v); });
      });
    }
    section("标签", tagBits.join("、"));

    var kw = arr(m.keywords || m.movieKeywords).map(txt).filter(Boolean);
    section("影片关键词", kw.join("、"));

    section("英文提示词", buildEN(frame));
    section("中文提示词", buildCN(frame));

    if (frame.deepLink) lines.push("", "来源：" + frame.deepLink);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  /* 从查询文本里提取 Shot.Cafe 风格的英文标签：先按词典把中文词换成英文，
   * 再在英文文本里按词典做整词匹配；多词标签内空格转 +，最多 6 个。 */
  function extractTags(text, dict) {
    var matched = [];
    var work = clean(text || "");
    if (!work || !dict || !dict.length) return matched;
    function normTag(en) {
      var t = String(en || "").toLowerCase().trim().replace(/\s+/g, "+");
      if (!/^[a-z0-9+\-]+$/.test(t)) return "";
      return t;
    }
    function add(en) {
      var t = normTag(en);
      if (t && matched.indexOf(t) === -1 && matched.length < 6) matched.push(t);
    }
    var sorted = dict.slice().sort(function (a, b) { return b.cn.length - a.cn.length; });
    var cnHits = [];
    sorted.forEach(function (d) {
      var pos = work.indexOf(d.cn);
      if (pos !== -1) {
        cnHits.push({ en: d.en, pos: pos });
        work = work.split(d.cn).join(" ");
      }
    });
    cnHits.sort(function (a, b) { return a.pos - b.pos; }).forEach(function (h) { add(h.en); });
    var workLower = " " + work.toLowerCase().replace(/[^a-z0-9'+\- ]+/g, " ").replace(/\s+/g, " ") + " ";
    var enSorted = dict.slice().sort(function (a, b) { return b.en.length - a.en.length; });
    var enHits = [];
    enSorted.forEach(function (d) {
      var needle = " " + d.en.toLowerCase().trim() + " ";
      var pos = workLower.indexOf(needle);
      if (pos !== -1) {
        enHits.push({ en: d.en, pos: pos });
        workLower = workLower.split(needle).join(" ");
      }
    });
    enHits.sort(function (a, b) { return a.pos - b.pos; }).forEach(function (h) { add(h.en); });
    return matched;
  }

  /* ============ 剧本模式：把一段中文剧本拆成场景要素，再拼成英文搜索 ============ */
  var SCRIPT_WORDS = [
    { cat: "time", cn: "黄金时刻", en: "golden hour" },
    { cat: "time", cn: "蓝调时刻", en: "blue hour" },
    { cat: "time", cn: "深夜", en: "late night" },
    { cat: "time", cn: "清晨", en: "early morning" },
    { cat: "time", cn: "正午", en: "midday" },
    { cat: "time", cn: "黎明", en: "dawn" },
    { cat: "time", cn: "黄昏", en: "dusk" },
    { cat: "time", cn: "夜晚", en: "night" },
    { cat: "time", cn: "白天", en: "daytime" },
    { cat: "time", cn: "下午", en: "afternoon" },
    { cat: "time", cn: "傍晚", en: "evening" },
    { cat: "place", cn: "街道", en: "street" },
    { cat: "place", cn: "小巷", en: "alley" },
    { cat: "place", cn: "沙滩", en: "beach" },
    { cat: "place", cn: "海边", en: "seaside" },
    { cat: "place", cn: "沙漠", en: "desert" },
    { cat: "place", cn: "森林", en: "forest" },
    { cat: "place", cn: "雪山", en: "snowy mountain" },
    { cat: "place", cn: "办公室", en: "office" },
    { cat: "place", cn: "咖啡馆", en: "cafe" },
    { cat: "place", cn: "酒吧", en: "bar" },
    { cat: "place", cn: "教堂", en: "church" },
    { cat: "place", cn: "车站", en: "train station" },
    { cat: "place", cn: "机场", en: "airport" },
    { cat: "place", cn: "医院", en: "hospital" },
    { cat: "place", cn: "学校", en: "school" },
    { cat: "place", cn: "废墟", en: "ruins" },
    { cat: "place", cn: "屋顶", en: "rooftop" },
    { cat: "place", cn: "室内", en: "interior" },
    { cat: "place", cn: "室外", en: "exterior" },
    { cat: "place", cn: "城市", en: "city" },
    { cat: "place", cn: "乡村", en: "countryside" },
    { cat: "weather", cn: "暴风雨", en: "storm" },
    { cat: "weather", cn: "雨夜", en: "rainy night" },
    { cat: "weather", cn: "雨天", en: "rainy day" },
    { cat: "weather", cn: "下雨", en: "rain" },
    { cat: "weather", cn: "下雪", en: "snow" },
    { cat: "weather", cn: "大雾", en: "heavy fog" },
    { cat: "weather", cn: "晴天", en: "sunny" },
    { cat: "weather", cn: "阴天", en: "overcast" },
    { cat: "weather", cn: "雾", en: "fog" },
    { cat: "weather", cn: "雨", en: "rain" },
    { cat: "weather", cn: "雪", en: "snow" },
    { cat: "character", cn: "年轻男子", en: "young man" },
    { cat: "character", cn: "年轻女子", en: "young woman" },
    { cat: "character", cn: "老人", en: "elderly person" },
    { cat: "character", cn: "孩子", en: "child" },
    { cat: "character", cn: "小孩", en: "child" },
    { cat: "character", cn: "男人", en: "man" },
    { cat: "character", cn: "女人", en: "woman" },
    { cat: "character", cn: "男女", en: "man and woman" },
    { cat: "character", cn: "男孩", en: "boy" },
    { cat: "character", cn: "女孩", en: "girl" },
    { cat: "character", cn: "士兵", en: "soldier" },
    { cat: "character", cn: "警察", en: "police officer" },
    { cat: "character", cn: "医生", en: "doctor" },
    { cat: "character", cn: "舞者", en: "dancer" },
    { cat: "character", cn: "宇航员", en: "astronaut" },
    { cat: "character", cn: "司机", en: "driver" },
    { cat: "character", cn: "军人", en: "soldier" },
    { cat: "character", cn: "特工", en: "secret agent" },
    { cat: "character", cn: "一群人", en: "group of people" },
    { cat: "character", cn: "人群", en: "crowd" },
    { cat: "action", cn: "追逐", en: "chase" },
    { cat: "action", cn: "打斗", en: "fight" },
    { cat: "action", cn: "拥抱", en: "embrace" },
    { cat: "action", cn: "接吻", en: "kiss" },
    { cat: "action", cn: "奔跑", en: "running" },
    { cat: "action", cn: "行走", en: "walking" },
    { cat: "action", cn: "对峙", en: "standoff" },
    { cat: "action", cn: "潜伏", en: "lurking" },
    { cat: "action", cn: "跳舞", en: "dancing" },
    { cat: "action", cn: "开车", en: "driving" },
    { cat: "action", cn: "射击", en: "shooting" },
    { cat: "action", cn: "爆炸", en: "explosion" },
    { cat: "action", cn: "游泳", en: "swimming" },
    { cat: "action", cn: "抽烟", en: "smoking" },
    { cat: "action", cn: "喝酒", en: "drinking" },
    { cat: "action", cn: "哭泣", en: "crying" },
    { cat: "action", cn: "大笑", en: "laughing" },
    { cat: "action", cn: "争吵", en: "arguing" },
    { cat: "action", cn: "逃跑", en: "fleeing" },
    { cat: "action", cn: "追赶", en: "chasing" },
    { cat: "action", cn: "骑马", en: "horseback riding" },
    { cat: "action", cn: "决斗", en: "duel" },
    { cat: "action", cn: "告别", en: "farewell" },
    { cat: "action", cn: "相遇", en: "encounter" },
    { cat: "action", cn: "等待", en: "waiting" },
    { cat: "action", cn: "凝视", en: "gazing" },
    { cat: "action", cn: "独自行走", en: "walking alone" },
    { cat: "action", cn: "独自走", en: "walking alone" },
    { cat: "mood", cn: "孤独", en: "lonely" },
    { cat: "mood", cn: "紧张", en: "tense" },
    { cat: "mood", cn: "温暖", en: "warm" },
    { cat: "mood", cn: "压抑", en: "oppressive" },
    { cat: "mood", cn: "浪漫", en: "romantic" },
    { cat: "mood", cn: "悲伤", en: "sad" },
    { cat: "mood", cn: "恐惧", en: "fearful" },
    { cat: "mood", cn: "愤怒", en: "angry" },
    { cat: "mood", cn: "绝望", en: "desperate" },
    { cat: "mood", cn: "希望", en: "hopeful" },
    { cat: "mood", cn: "宁静", en: "serene" },
    { cat: "mood", cn: "诡异", en: "eerie" },
    { cat: "mood", cn: "忧郁", en: "melancholic" },
    { cat: "mood", cn: "肃杀", en: "grim" },
    { cat: "mood", cn: "荒凉", en: "desolate" },
    { cat: "mood", cn: "迷茫", en: "lost" },
    { cat: "mood", cn: "警觉", en: "alert" },
    { cat: "shot", cn: "大远景", en: "extreme wide shot" },
    { cat: "shot", cn: "远景", en: "wide shot" },
    { cat: "shot", cn: "全景", en: "full shot" },
    { cat: "shot", cn: "中远景", en: "medium wide shot" },
    { cat: "shot", cn: "中景", en: "medium shot" },
    { cat: "shot", cn: "中近景", en: "medium close-up" },
    { cat: "shot", cn: "近景", en: "close-up" },
    { cat: "shot", cn: "特写", en: "extreme close-up" },
    { cat: "shot", cn: "俯拍", en: "high angle" },
    { cat: "shot", cn: "仰拍", en: "low angle" },
    { cat: "shot", cn: "逆光", en: "backlight" },
    { cat: "shot", cn: "航拍", en: "aerial shot" },
  ];

  var SCRIPT_SORTED = SCRIPT_WORDS.slice().sort(function (a, b) { return b.cn.length - a.cn.length; });

  function buildScriptQueries(found) {
    function wordsOf(list) { return list.map(function (w) { return w.en; }); }
    var qs = [];
    function add(parts, label, minParts) {
      var list = parts.filter(Boolean);
      if (list.length < (minParts || 1)) return;
      var en = list.join(", ");
      if (qs.some(function (q) { return q.en === en; })) return;
      qs.push({ en: en, label: label });
    }
    var chars = wordsOf(found.character || []);
    var acts = wordsOf(found.action || []);
    var place = wordsOf(found.place || []);
    var time = wordsOf(found.time || []);
    var weather = wordsOf(found.weather || []);
    var mood = wordsOf(found.mood || []);
    var shot = wordsOf(found.shot || []);
    add(chars.concat(acts, place, time, weather, mood).slice(0, 8), "完整场景", 1);
    add(place.concat(time, weather, mood).slice(0, 6), "场景 + 时间 + 氛围", 2);
    add(chars.concat(acts, shot).slice(0, 6), "人物 + 动作 + 景别", 2);
    return qs.slice(0, 3);
  }

  function parseScript(text) {
    var found = { time: [], place: [], weather: [], character: [], action: [], mood: [], shot: [] };
    var work = clean(text || "");
    SCRIPT_SORTED.forEach(function (w) {
      if (!work) return;
      if (work.indexOf(w.cn) !== -1) {
        if (found[w.cat].indexOf(w) === -1) found[w.cat].push(w);
        work = work.split(w.cn).join(" ");
      }
    });
    return { elements: found, queries: buildScriptQueries(found) };
  }

  var api = { buildEN: buildEN, buildCN: buildCN, buildFullText: buildFullText, extractTags: extractTags, clean: clean, cn: cn, parseScript: parseScript, buildScriptQueries: buildScriptQueries };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.JTKPrompt = api;
})(typeof window !== "undefined" ? window : globalThis);
