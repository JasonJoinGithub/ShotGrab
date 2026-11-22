/* ShotGrab 网页版前端 — 直接调用 FrameThrower 官方接口。
   token 只保存在浏览器本地存储里（localStorage），只在调接口时发给
   framethrower.ai；收藏也存在浏览器本地存储里。这个页面没有服务器。 */
(function () {
  "use strict";

  /* ============ 中英摄影术语词典 ============ */
  var DICT = [
    // 景别
    { cn: "大远景", en: "extreme wide shot", cat: "景别" },
    { cn: "远景", en: "wide shot", cat: "景别" },
    { cn: "全景", en: "full shot", cat: "景别" },
    { cn: "中远景", en: "medium wide shot", cat: "景别" },
    { cn: "中景", en: "medium shot", cat: "景别" },
    { cn: "中近景", en: "medium close-up", cat: "景别" },
    { cn: "近景", en: "close-up", cat: "景别" },
    { cn: "特写", en: "extreme close-up", cat: "景别" },
    { cn: "大特写", en: "extreme close-up", cat: "景别" },
    { cn: "全身镜头", en: "full body shot", cat: "景别" },
    { cn: "七分身", en: "cowboy shot", cat: "景别" },
    { cn: "双人镜头", en: "two-shot", cat: "景别" },
    { cn: "群像镜头", en: "group shot", cat: "景别" },
    { cn: "定场镜头", en: "establishing shot", cat: "景别" },
    // 机位角度
    { cn: "平视", en: "eye level", cat: "机位角度" },
    { cn: "俯拍", en: "high angle", cat: "机位角度" },
    { cn: "仰拍", en: "low angle", cat: "机位角度" },
    { cn: "顶拍", en: "overhead shot", cat: "机位角度" },
    { cn: "鸟瞰", en: "bird's-eye view", cat: "机位角度" },
    { cn: "荷兰角", en: "dutch angle", cat: "机位角度" },
    { cn: "四分之三侧面", en: "three quarter", cat: "机位角度" },
    { cn: "正面", en: "front view", cat: "机位角度" },
    { cn: "侧面", en: "side view", cat: "机位角度" },
    { cn: "背面", en: "back view", cat: "机位角度" },
    { cn: "主观镜头", en: "POV shot", cat: "机位角度" },
    { cn: "过肩镜头", en: "over-the-shoulder shot", cat: "机位角度" },
    { cn: "低机位", en: "low camera", cat: "机位角度" },
    { cn: "高机位", en: "high camera", cat: "机位角度" },
    // 镜头
    { cn: "变形宽银幕", en: "anamorphic", cat: "镜头" },
    { cn: "球面镜头", en: "spherical lens", cat: "镜头" },
    { cn: "长焦", en: "telephoto lens", cat: "镜头" },
    { cn: "广角", en: "wide-angle lens", cat: "镜头" },
    { cn: "鱼眼", en: "fisheye lens", cat: "镜头" },
    { cn: "微距", en: "macro lens", cat: "镜头" },
    { cn: "浅景深", en: "shallow depth of field", cat: "镜头" },
    { cn: "深焦", en: "deep focus", cat: "镜头" },
    { cn: "复古柔焦", en: "vintage soft lens", cat: "镜头" },
    { cn: "柔焦", en: "soft focus", cat: "镜头" },
    { cn: "移轴", en: "tilt-shift", cat: "镜头" },
    { cn: "镜头光晕", en: "lens flare", cat: "镜头" },
    // 光感
    { cn: "逆光", en: "backlight", cat: "光感" },
    { cn: "侧光", en: "side light", cat: "光感" },
    { cn: "顶光", en: "top light", cat: "光感" },
    { cn: "底光", en: "underlight", cat: "光感" },
    { cn: "柔光", en: "soft light", cat: "光感" },
    { cn: "硬光", en: "hard light", cat: "光感" },
    { cn: "直射阳光", en: "direct sunlight", cat: "光感" },
    { cn: "自然光", en: "natural light", cat: "光感" },
    { cn: "低调", en: "low-key lighting", cat: "光感" },
    { cn: "高调", en: "high-key lighting", cat: "光感" },
    { cn: "霓虹灯", en: "neon light", cat: "光感" },
    { cn: "烛光", en: "candlelight", cat: "光感" },
    { cn: "窗户光", en: "window light", cat: "光感" },
    { cn: "月光", en: "moonlight", cat: "光感" },
    { cn: "轮廓光", en: "rim light", cat: "光感" },
    { cn: "伦勃朗光", en: "Rembrandt lighting", cat: "光感" },
    { cn: "丁达尔效应", en: "volumetric light", cat: "光感" },
    { cn: "实用光源", en: "practical light", cat: "光感" },
    // 时间
    { cn: "黄金时刻", en: "golden hour", cat: "时间" },
    { cn: "蓝调时刻", en: "blue hour", cat: "时间" },
    { cn: "正午", en: "midday sun", cat: "时间" },
    { cn: "黎明", en: "dawn", cat: "时间" },
    { cn: "黄昏", en: "dusk", cat: "时间" },
    { cn: "夜晚", en: "night", cat: "时间" },
    { cn: "深夜", en: "midnight", cat: "时间" },
    { cn: "午夜", en: "midnight", cat: "时间" },
    { cn: "黑夜", en: "night", cat: "时间" },
    { cn: "夜色", en: "night", cat: "时间" },
    { cn: "夜空", en: "night sky", cat: "时间" },
    { cn: "夜", en: "night", cat: "时间" },
    { cn: "清晨", en: "early morning", cat: "时间" },
    { cn: "下午", en: "late afternoon", cat: "时间" },
    { cn: "白天", en: "daytime", cat: "时间" },
    // 场景
    { cn: "室内", en: "interior", cat: "场景" },
    { cn: "室外", en: "exterior", cat: "场景" },
    { cn: "街道", en: "street", cat: "场景" },
    { cn: "小巷", en: "alley", cat: "场景" },
    { cn: "海滩", en: "beach", cat: "场景" },
    { cn: "森林", en: "forest", cat: "场景" },
    { cn: "沙漠", en: "desert", cat: "场景" },
    { cn: "雪山", en: "snowy mountain", cat: "场景" },
    { cn: "城市夜景", en: "city at night", cat: "场景" },
    { cn: "乡村", en: "countryside", cat: "场景" },
    { cn: "办公室", en: "office", cat: "场景" },
    { cn: "咖啡馆", en: "cafe", cat: "场景" },
    { cn: "车站", en: "train station", cat: "场景" },
    { cn: "机场", en: "airport", cat: "场景" },
    { cn: "酒吧", en: "bar", cat: "场景" },
    { cn: "教堂", en: "church", cat: "场景" },
    { cn: "废墟", en: "ruins", cat: "场景" },
    { cn: "未来都市", en: "futuristic city", cat: "场景" },
    // 人物
    { cn: "独角", en: "solo", cat: "人物" },
    { cn: "双人", en: "two people", cat: "人物" },
    { cn: "群像", en: "group of people", cat: "人物" },
    { cn: "剪影人物", en: "silhouette figure", cat: "人物" },
    { cn: "背影", en: "person from behind", cat: "人物" },
    { cn: "儿童", en: "child", cat: "人物" },
    { cn: "老人", en: "elderly person", cat: "人物" },
    { cn: "女人", en: "woman", cat: "人物" },
    { cn: "男人", en: "man", cat: "人物" },
    { cn: "士兵", en: "soldier", cat: "人物" },
    { cn: "警察", en: "police officer", cat: "人物" },
    { cn: "舞者", en: "dancer", cat: "人物" },
    { cn: "宇航员", en: "astronaut", cat: "人物" },
    // 色彩
    { cn: "暖色调", en: "warm tones", cat: "色彩" },
    { cn: "冷色调", en: "cool tones", cat: "色彩" },
    { cn: "高饱和", en: "vivid colors", cat: "色彩" },
    { cn: "低饱和", en: "muted colors", cat: "色彩" },
    { cn: "黑白", en: "black and white", cat: "色彩" },
    { cn: "青橙色调", en: "teal and orange", cat: "色彩" },
    { cn: "复古色调", en: "vintage color", cat: "色彩" },
    { cn: "单色", en: "monochrome", cat: "色彩" },
    { cn: "高对比", en: "high contrast", cat: "色彩" },
    { cn: "低对比", en: "low contrast", cat: "色彩" },
    { cn: "胶片感", en: "filmic look", cat: "色彩" },
    // 情绪风格
    { cn: "紧张", en: "tense", cat: "情绪风格" },
    { cn: "孤独", en: "lonely", cat: "情绪风格" },
    { cn: "浪漫", en: "romantic", cat: "情绪风格" },
    { cn: "梦幻", en: "dreamy", cat: "情绪风格" },
    { cn: "压抑", en: "oppressive", cat: "情绪风格" },
    { cn: "忧郁", en: "melancholic", cat: "情绪风格" },
    { cn: "史诗", en: "epic", cat: "情绪风格" },
    { cn: "黑色电影", en: "film noir", cat: "情绪风格" },
    { cn: "恐怖", en: "horror", cat: "情绪风格" },
    { cn: "科幻", en: "sci-fi", cat: "情绪风格" },
    { cn: "悬疑", en: "suspenseful", cat: "情绪风格" },
    { cn: "温馨", en: "warm and cozy", cat: "情绪风格" },
    { cn: "孤寂", en: "desolate", cat: "情绪风格" },
    { cn: "壮丽", en: "majestic", cat: "情绪风格" },
    // 天气氛围
    { cn: "雨", en: "rain", cat: "天气氛围" },
    { cn: "暴雨", en: "heavy rain", cat: "天气氛围" },
    { cn: "雪", en: "snow", cat: "天气氛围" },
    { cn: "雾", en: "fog", cat: "天气氛围" },
    { cn: "雾霾", en: "haze", cat: "天气氛围" },
    { cn: "雷暴", en: "thunderstorm", cat: "天气氛围" },
    { cn: "阴天", en: "overcast", cat: "天气氛围" },
    { cn: "晴天", en: "clear sky", cat: "天气氛围" },
    { cn: "晚霞", en: "sunset clouds", cat: "天气氛围" },
  ];

  // 英→中反查（详情面板的英文术语旁显示中文）
  var EN2CN = {};
  DICT.forEach(function (d) {
    var key = d.en.toLowerCase();
    if (!EN2CN[key]) EN2CN[key] = d.cn;
  });
  // 补充 API 常回的英文词
  [
    ["medium shot", "中景"], ["close-up", "中近景/近景"], ["wide shot", "远景"],
    ["eye level", "平视"], ["low angle", "仰拍"], ["high angle", "俯拍"],
    ["overhead", "顶拍"], ["shallow", "浅景深"], ["group", "群像"],
    ["clean single", "干净单人镜头"], ["three quarter", "四分之三侧面"],
    ["natural", "自然光"], ["soft", "柔光"], ["sun", "阳光"], ["mixed", "混合光"],
    ["exterior", "室外"], ["interior", "室内"], ["day", "白天"], ["night", "夜晚"],
    ["golden hour", "黄金时刻"], ["blue hour", "蓝调时刻"],
    ["spherical", "球面"], ["anamorphic", "变形宽银幕"],
    ["vintage soft", "复古柔焦"], ["live action", "实拍"],
    ["solo", "独角"], ["silhouette", "剪影"],
  ].forEach(function (pair) {
    if (!EN2CN[pair[0]]) EN2CN[pair[0]] = pair[1];
  });

  var CATS = ["景别", "机位角度", "镜头", "光感", "时间", "场景", "人物", "色彩", "情绪风格", "天气氛围"];

  var PLACEHOLDER_IMG =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="#1c1c1c"/><text x="50%" y="50%" fill="#9a978f" font-size="16" text-anchor="middle" font-family="sans-serif">缩略图已过期，请点「在原站打开」查看</text></svg>'
    );

  /* ============ 工具 ============ */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.add("hidden"); }, 2600);
  }
  function copyText(text, okMsg) {
    function done() { toast(okMsg || "已复制"); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text); done();
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* 忽略 */ }
    document.body.removeChild(ta);
  }
  function asArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null || v === "") return [];
    return [v];
  }
  function asText(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return v.map(asText).filter(Boolean).join("、");
    if (typeof v === "object") return v.name || v.label || v.text || "";
    return "";
  }
  function cnOf(enTerm) {
    var hit = EN2CN[String(enTerm).toLowerCase().trim()];
    return hit ? hit + " · " + enTerm : String(enTerm);
  }
  function moodsOf(m) {
    // 实测 API 的 moods 是 {value: [...], confidence} 对象，不是平铺数组
    var v = m && m.moods;
    if (v && typeof v === "object" && !Array.isArray(v)) return asArray(v.value);
    return asArray(v);
  }
  function hasCJK(s) { return /[\u4e00-\u9fff]/.test(s); }

  /* ============ 状态 ============ */
  var state = {
    hasToken: false,
    credits: null,
    results: {},       // id -> frame（搜索结果）
    similar: {},       // id -> frame（相似结果）
    collection: [],    // 收藏列表
    savedIds: {},      // id -> true
    currentFrame: null,
    currentSimilar: [],
    scriptQueries: [],
  };

  /* ============ 网页版：直连 FrameThrower 官方接口 ============ */
  var API_BASE = "https://framethrower.ai/api/v1";
  var TOKEN_KEY = "shotgrab_token";
  var COLLECTION_KEY = "shotgrab_collection_v1";
  // 搜索 / 详情 / 找相似都是固定 2 点（官方定价），响应头读不到时用这个数
  var KNOWN_COST = 2;

  function getToken() {
    try { return (window.localStorage.getItem(TOKEN_KEY) || "").trim(); }
    catch (e) { return ""; }
  }
  function setToken(token) {
    try { window.localStorage.setItem(TOKEN_KEY, token); return true; }
    catch (e) { return false; }
  }
  function clearToken() {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    state.credits = null;
  }
  function loadCollectionLS() {
    try {
      var raw = window.localStorage.getItem(COLLECTION_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }
  function saveCollectionLS(items) {
    try {
      window.localStorage.setItem(COLLECTION_KEY, JSON.stringify({ items: items }));
      return true;
    } catch (e) { return false; }
  }

  // API 返回的文本里混有零宽字符（水印），展示和复制前要去掉
  // 按码点过滤零宽字符（不用正则转义，避免不可见字符进源码）
  var ZERO_WIDTH_CODES = { 0x200B: 1, 0x200C: 1, 0x200D: 1, 0x2060: 1, 0xFEFF: 1 };
  function stripZeroWidth(str) {
    var out = "";
    for (var i = 0; i < str.length; i++) {
      if (!ZERO_WIDTH_CODES[str.charCodeAt(i)]) out += str.charAt(i);
    }
    return out;
  }
  function cleanObj(value) {
    if (typeof value === "string") return stripZeroWidth(value);
    if (Array.isArray(value)) return value.map(cleanObj);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = cleanObj(value[k]); });
      return out;
    }
    return value;
  }

  function ftError(status, serverMsg) {
    if (status === 401) return { message: "Token 无效或已过期，请检查后重新设置。", code: "unauthorized" };
    if (status === 402) return { message: "点数不足了，请到 FrameThrower 官网充值（$1 = 1000 点，1 点≈一次搜索的一小半）。", code: "no_credits" };
    if (status === 403) return { message: "没有权限，请检查 token 或账号状态。", code: "forbidden" };
    if (status === 404) return { message: "没找到这帧，可能已被移除。", code: "not_found" };
    if (status === 429) return { message: "请求太频繁了，稍等片刻再试。", code: "rate_limited" };
    if (status === 400) return { message: "请求有问题（" + (serverMsg || "参数不对") + "），换个说法再试试。", code: "bad_request" };
    return { message: "FrameThrower 服务端出错（HTTP " + status + "），请稍后再试。", code: "upstream_error" };
  }

  // 从响应里找余额：响应头优先，其次是返回体里的 meta / balance 字段
  // （浏览器跨域时响应头通常读不到，点数不足的 402 返回体里自带 balance）
  function pickRemaining(resp, body) {
    try {
      var h = resp.headers.get("X-Credits-Remaining");
      if (h != null) return h;
    } catch (e) {}
    var meta = (body && body.meta) || {};
    if (meta.credits_remaining != null) return meta.credits_remaining;
    if (meta.creditsRemaining != null) return meta.creditsRemaining;
    if (body && body.balance != null) return body.balance;
    return null;
  }

  function ftRequest(method, path, payload) {
    var token = getToken();
    if (!token) {
      return Promise.resolve({ ok: false, error: "还没设置 API token，请先按页面上方的引导粘贴 token。", code: "no_token" });
    }
    var init = {
      method: method,
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };
    if (payload !== undefined) init.body = JSON.stringify(payload);
    return fetch(API_BASE + path, init).then(function (resp) {
      return resp.json().then(function (body) {
        body = cleanObj(body || {});
        var remaining = pickRemaining(resp, body);
        var cost = null;
        try { cost = resp.headers.get("X-Credits-Cost"); } catch (e) {}
        if (cost == null) cost = KNOWN_COST;
        if (!resp.ok) {
          var err = ftError(resp.status, body.error);
          return { ok: false, error: err.message, code: err.code, credits_remaining: remaining };
        }
        return { ok: true, data: body.data, meta: body.meta || {}, credits_cost: cost, credits_remaining: remaining };
      }, function () {
        return { ok: false, error: "FrameThrower 返回了无法识别的内容，请稍后再试。", code: "upstream_error" };
      });
    }, function () {
      return { ok: false, error: "连不上 FrameThrower，请检查网络连接，再试一次。", code: "network_error" };
    });
  }

  function collectionOp(path, method, opts) {
    var items = loadCollectionLS();
    if (method === "GET") return { ok: true, items: items };
    if (method === "POST") {
      var payload = {};
      try { payload = JSON.parse(opts.body || "{}"); } catch (e) {}
      var frameId = (payload.id || "").trim();
      if (!frameId) return { ok: false, error: "这帧没有编号，保存失败。", code: "bad_request" };
      var now = new Date().toISOString();
      var existing = null;
      items.forEach(function (it) { if (it.id === frameId) existing = it; });
      if (existing) {
        ["userTags", "project", "note"].forEach(function (key) {
          if (key in payload) existing[key] = payload[key];
        });
        existing.updatedAt = now;
        if (!saveCollectionLS(items)) return { ok: false, error: "保存失败：浏览器存储空间满了，请清理后再试。", code: "io_error" };
        return { ok: true, item: existing, updated: true };
      }
      var item = {
        id: frameId, source: "FrameThrower",
        thumbUrl: payload.thumbUrl || "", deepLink: payload.deepLink || "",
        film: payload.film || {}, metadata: payload.metadata || {},
        characters: payload.characters || [],
        prompt: payload.prompt || "", promptEN: payload.promptEN || "", promptCN: payload.promptCN || "",
        userTags: payload.userTags || [], project: payload.project || "", note: payload.note || "",
        savedAt: now,
      };
      items.unshift(item);
      if (!saveCollectionLS(items)) return { ok: false, error: "保存失败：浏览器存储空间满了，请清理后再试。", code: "io_error" };
      return { ok: true, item: item, updated: false };
    }
    if (method === "DELETE") {
      var m = /[?&]id=([^&]*)/.exec(path);
      var delId = m ? decodeURIComponent(m[1]) : "";
      if (!delId) return { ok: false, error: "缺少帧编号。", code: "bad_request" };
      var kept = items.filter(function (it) { return it.id !== delId; });
      if (kept.length === items.length) return { ok: false, error: "收藏里没有这一帧。", code: "not_found" };
      if (!saveCollectionLS(kept)) return { ok: false, error: "删除失败：浏览器存储空间满了。", code: "io_error" };
      return { ok: true, removed: true };
    }
    return { ok: false, error: "未知请求。", code: "bad_request" };
  }

  function trackCredits(body) {
    if (body && body.credits_remaining != null) updateCredits(body.credits_remaining);
    return body;
  }

  // 和本地版同样的调用口子，内部改成直连接口 / 本地存储
  function api(path, opts) {
    opts = opts || {};
    var method = (opts.method || "GET").toUpperCase();
    if (path === "/api/status") {
      return Promise.resolve({ ok: true, has_token: !!getToken(), credits_remaining: state.credits });
    }
    if (path === "/api/token") {
      if (method === "POST") {
        var token = "";
        try { token = (JSON.parse(opts.body || "{}").token || "").trim(); } catch (e) {}
        if (!token) return Promise.resolve({ ok: false, error: "Token 不能为空，请粘贴从 FrameThrower 设置里创建的 API token。", code: "bad_request" });
        if (!setToken(token)) return Promise.resolve({ ok: false, error: "保存失败：浏览器存储空间满了，请清理后再试。", code: "io_error" });
        return Promise.resolve({ ok: true, has_token: true });
      }
      if (method === "DELETE") {
        clearToken();
        return Promise.resolve({ ok: true, has_token: false });
      }
      return Promise.resolve({ ok: false, error: "未知请求。", code: "bad_request" });
    }
    if (path === "/api/collection" || path.indexOf("/api/collection?") === 0) {
      return Promise.resolve(collectionOp(path, method, opts));
    }
    if (path === "/api/search" && method === "POST") {
      var q = {};
      try { q = JSON.parse(opts.body || "{}"); } catch (e) {}
      var queryText = (q.query || "").trim();
      if (!queryText) return Promise.resolve({ ok: false, error: "请先输入要找的画面描述，或点下面的术语拼一句查询。", code: "bad_request" });
      var limit = parseInt(q.limit, 10);
      if (isNaN(limit)) limit = 20;
      limit = Math.max(1, Math.min(limit, 24));
      var mode = q.mode || "hybrid";
      if (mode !== "hybrid" && mode !== "semantic" && mode !== "description") mode = "hybrid";
      return ftRequest("POST", "/search", { query: queryText, limit: limit, mode: mode }).then(trackCredits);
    }
    if (path.indexOf("/api/frame") === 0) {
      var fm = /[?&]id=([^&]*)/.exec(path);
      var frameId = fm ? decodeURIComponent(fm[1]) : "";
      if (!frameId) return Promise.resolve({ ok: false, error: "缺少帧编号。", code: "bad_request" });
      return ftRequest("GET", "/frames?id=" + encodeURIComponent(frameId)).then(trackCredits);
    }
    if (path === "/api/similar" && method === "POST") {
      var s = {};
      try { s = JSON.parse(opts.body || "{}"); } catch (e) {}
      var sid = (s.id || "").trim();
      if (!sid) return Promise.resolve({ ok: false, error: "缺少帧编号。", code: "bad_request" });
      var slimit = parseInt(s.limit, 10);
      if (isNaN(slimit)) slimit = 20;
      slimit = Math.max(1, Math.min(slimit, 24));
      return ftRequest("POST", "/similar", { frameId: sid, limit: slimit }).then(trackCredits);
    }
    return Promise.resolve({ ok: false, error: "未知请求。", code: "bad_request" });
  }
  function updateCredits(value) {
    state.credits = value;
    var badge = $("creditsBadge");
    badge.textContent = "点数：" + value;
    var n = parseInt(value, 10);
    badge.classList.toggle("low", !isNaN(n) && n < 20);
    $("settingsCredits").textContent = "余额：" + value + " 点";
  }

  function refreshStatus() {
    return api("/api/status").then(function (body) {
      state.hasToken = !!(body && body.has_token);
      if (body && body.credits_remaining != null) updateCredits(body.credits_remaining);
      $("setupGuide").classList.toggle("hidden", state.hasToken);
      $("tokenState").textContent = state.hasToken
        ? "已设置 token（只保存在你的浏览器里，这里不显示它的值）。"
        : "还没设置 token。";
      return state.hasToken;
    });
  }

  /* ============ 术语 chips ============ */
  function renderChips() {
    var wrap = $("chipsContainer");
    wrap.innerHTML = "";
    CATS.forEach(function (cat) {
      var terms = DICT.filter(function (d) { return d.cat === cat; });
      if (!terms.length) return;
      var group = document.createElement("div");
      group.className = "chip-group";
      var title = document.createElement("p");
      title.className = "chip-group-title";
      title.textContent = cat;
      group.appendChild(title);
      terms.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.innerHTML = esc(d.cn) + '<span class="en">' + esc(d.en) + "</span>";
        b.addEventListener("click", function () {
          var input = $("queryInput");
          var cur = input.value.trim();
          input.value = cur ? cur + "， " + d.en : d.en;
          input.focus();
          updateQueryPreview();
          updateMultisiteLinks();
        });
        group.appendChild(b);
      });
      wrap.appendChild(group);
    });
  }

  /* 中文描述 → 英文查询：把词典里的中文词换成英文，剩下原样保留 */
  var DICT_SORTED = DICT.slice().sort(function (a, b) { return b.cn.length - a.cn.length; });
  function toEnglishQuery(text) {
    var out = text;
    DICT_SORTED.forEach(function (d) {
      if (out.indexOf(d.cn) !== -1) out = out.split(d.cn).join(" " + d.en + " ");
    });
    return out.replace(/[，、；;]+/g, ", ").replace(/\s+/g, " ").trim().replace(/^,|,$/g, "").trim();
  }
  function updateQueryPreview() {
    var raw = $("queryInput").value.trim();
    var preview = $("queryPreview");
    if (!raw) { preview.classList.add("hidden"); return; }
    if (!hasCJK(raw)) { preview.classList.add("hidden"); return; }
    var en = toEnglishQuery(raw);
    var leftover = en.replace(/[A-Za-z0-9 ,.'\-()]/g, "").trim();
    var html = "将按以下英文查询搜索：<b>" + esc(en) + "</b>";
    if (leftover) html += "（其中「" + esc(leftover) + "」词典里没有，已原样保留，建议换成上面的术语再搜）";
    preview.innerHTML = html;
    preview.classList.remove("hidden");
  }

  /* ============ 多站跳转 ============ */
  function setJumpLink(el, href, enabled) {
    if (!el) return;
    if (enabled) {
      el.href = href;
      el.classList.remove("disabled");
      el.removeAttribute("aria-disabled");
    } else {
      el.href = "#";
      el.classList.add("disabled");
      el.setAttribute("aria-disabled", "true");
    }
  }
  function updateMultisiteLinks() {
    var raw = $("queryInput").value.trim();
    setJumpLink($("msFilmGrab"), "https://film-grab.com/?s=" + encodeURIComponent(raw), !!raw);
    setJumpLink($("msMovieStills"), "https://www.moviestillsdb.com/search?query=" + encodeURIComponent(raw), !!raw);
    var tags = extractTags(raw);
    var cafe = $("msShotCafe");
    if (tags.length) {
      setJumpLink(cafe, "https://shot.cafe/tag/" + tags.join(","), true);
      cafe.textContent = "Shot.Cafe · 按标签（" + tags.join(", ") + "）";
    } else {
      setJumpLink(cafe, "#", false);
      cafe.textContent = "Shot.Cafe · 按标签（先输入带摄影术语的描述）";
    }
    var hint = $("multisiteHint");
    if (hint) {
      hint.textContent = raw
        ? "上面三个带查询词跳转（免费，不花点；片名用英文效果最好）。下面五个只能点开手动搜。"
        : "在上面输入片名或描述后，这里自动带上你的查询词（免费，不花点；片名用英文效果最好）。";
    }
  }

  /* ============ 搜索 ============ */
  function doSearch() {
    var raw = $("queryInput").value.trim();
    if (!raw) {
      $("searchStatus").textContent = "请先输入要找的画面描述，或点下面的术语拼一句查询。";
      $("searchStatus").classList.add("err");
      return;
    }
    if (!state.hasToken) {
      $("searchStatus").textContent = "还没设置 API token，请先按页面上方的引导粘贴 token。";
      $("searchStatus").classList.add("err");
      $("setupGuide").scrollIntoView({ behavior: "smooth" });
      return;
    }
    var query = toEnglishQuery(raw);
    var status = $("searchStatus");
    status.classList.remove("err");
    status.textContent = "正在搜索「" + query + "」…（花 2 点）";
    $("searchBtn").disabled = true;
    api("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, limit: 20, mode: "hybrid" }),
    }).then(function (body) {
      $("searchBtn").disabled = false;
      if (!body || !body.ok) {
        status.textContent = (body && body.error) || "搜索失败了，请再试一次。";
        status.classList.add("err");
        return;
      }
      var frames = body.data || [];
      state.results = {};
      frames.forEach(function (f) { if (f && f.id) state.results[f.id] = f; });
      renderGrid($("resultsGrid"), frames, "search");
      var total = body.meta && body.meta.total != null ? body.meta.total : frames.length;
      status.textContent = frames.length
        ? "找到 " + total + " 帧，显示 " + frames.length + " 帧。点一张看完整信息。"
        : "没有找到匹配的帧。试试换个说法，或少用几个限定词再搜一次。";
      if (body.credits_cost != null && body.credits_remaining != null) {
        status.textContent += "（本次花 " + body.credits_cost + " 点，余额 " + body.credits_remaining + " 点）";
      } else if (body.credits_cost != null) {
        status.textContent += "（本次花 " + body.credits_cost + " 点）";
      }
    }).catch(function () {
      $("searchBtn").disabled = false;
      status.textContent = "连不上 FrameThrower，请检查网络连接，再试一次。";
      status.classList.add("err");
    });
  }

  /* ============ 剧本模式 ============ */
  var SCRIPT_CAT_LABELS = { time: "时间", place: "地点", weather: "天气", character: "人物", action: "动作", mood: "情绪", shot: "景别/镜头" };
  function parseScriptUI() {
    var raw = $("scriptInput").value.trim();
    var status = $("scriptStatus");
    var box = $("scriptParsed");
    if (!raw) {
      status.textContent = "请先粘一段剧本。";
      status.classList.add("err");
      return;
    }
    if (!window.JTKPrompt) {
      status.textContent = "提示词模块没加载出来，刷新页面再试。";
      status.classList.add("err");
      return;
    }
    var result = window.JTKPrompt.parseScript(raw);
    state.scriptQueries = result.queries || [];
    var cats = ["time", "place", "weather", "character", "action", "mood", "shot"];
    var rows = "";
    cats.forEach(function (cat) {
      var items = (result.elements[cat] || []).map(function (w) { return w.cn + " · " + w.en; });
      if (items.length) rows += tagRowHTML(SCRIPT_CAT_LABELS[cat], items);
    });
    var html = "";
    if (rows) {
      html += "<h3>拆出的场景要素（免费，不花点）</h3>" + rows;
    } else {
      html += '<p class="muted">这段里没找到能认出的场景词（时间、地点、人物、动作、情绪、景别），试试加一句场景描写，比如“深夜雨夜的街道”。</p>';
    }
    if (state.scriptQueries.length) {
      html += "<h3>将按以下查询去电影里找（每组花 2 点）</h3>";
      state.scriptQueries.forEach(function (q, i) {
        html += '<p class="script-query">第 ' + (i + 1) + " 组（" + esc(q.label) + "）：<b>" + esc(q.en) + "</b></p>";
      });
      html += '<p class="muted">共 ' + state.scriptQueries.length + " 组，最多花 " + (state.scriptQueries.length * 2) + " 点。</p>";
    }
    box.innerHTML = html;
    box.classList.remove("hidden");
    $("scriptSearchBtn").disabled = !state.scriptQueries.length;
    status.classList.remove("err");
    status.textContent = state.scriptQueries.length
      ? "拆解完成，确认无误就点「按拆解结果去搜」。"
      : "没拆出可用的查询，先补一句场景描写再试。";
  }
  function searchScript() {
    if (!state.scriptQueries.length) return;
    if (!state.hasToken) {
      $("scriptStatus").textContent = "还没设置 API token，请先按页面上方的引导粘贴 token。";
      $("scriptStatus").classList.add("err");
      $("setupGuide").scrollIntoView({ behavior: "smooth" });
      return;
    }
    var btn = $("scriptSearchBtn");
    var status = $("scriptStatus");
    btn.disabled = true;
    status.classList.remove("err");
    var merged = [];
    var seen = {};
    var totalCost = 0;
    var chain = Promise.resolve();
    state.scriptQueries.forEach(function (q, qi) {
      chain = chain.then(function () {
        status.textContent = "正在搜第 " + (qi + 1) + " 组「" + q.en + "」…";
        return api("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.en, limit: 12, mode: "hybrid" }),
        }).then(function (body) {
          if (!body || !body.ok) throw new Error((body && body.error) || "搜索失败了");
          totalCost += parseInt(body.credits_cost || 0, 10) || 0;
          (body.data || []).forEach(function (f) {
            if (f && f.id && !seen[f.id]) { seen[f.id] = true; merged.push(f); state.results[f.id] = f; }
          });
        });
      });
    });
    chain.then(function () {
      btn.disabled = false;
      renderGrid($("scriptGrid"), merged, "search");
      status.textContent = merged.length
        ? "共找到 " + merged.length + " 帧（已去重）。点一张看完整信息和现成提示词。"
        : "没有找到匹配的帧。试试少用几个限定词，或换个说法再搜一次。";
      if (totalCost) status.textContent += "（本次花 " + totalCost + " 点，余额 " + (state.credits != null ? state.credits : "—") + " 点）";
    }).catch(function (err) {
      btn.disabled = false;
      status.textContent = (err && err.message) || "搜索失败了，请再试一次。";
      status.classList.add("err");
    });
  }

  function shotTypeOf(frame) {
    var m = (frame && frame.metadata) || {};
    return asText(m.shotType) || "";
  }
  function filmLine(frame) {
    var f = (frame && frame.film) || {};
    var parts = [];
    if (f.title) parts.push(f.title);
    if (f.year) parts.push("(" + f.year + ")");
    return parts.join(" ") || "未知影片";
  }
  function cardHTML(frame) {
    var m = (frame && frame.metadata) || {};
    var desc = asText(m.sceneDescription) || asText(m.summary) || "";
    var tags = [];
    if (shotTypeOf(frame)) tags.push(cnOf(shotTypeOf(frame)));
    if (asText(m.timeOfDay)) tags.push(cnOf(asText(m.timeOfDay)));
    if (asText(m.cameraAngle)) tags.push(cnOf(asText(m.cameraAngle)));
    var savedMark = state.savedIds[frame.id] ? " ★已收藏" : "";
    return (
      '<img src="' + esc(frame.thumbUrl || "") + '" alt="" loading="lazy" onerror="window.__thumbFailed(this)">' +
      '<div class="card-body">' +
      '<div class="card-title">' + esc(filmLine(frame)) + esc(savedMark) + "</div>" +
      '<div class="card-meta">' + esc([asText((frame.film || {}).director), asText((frame.film || {}).dp || (frame.film || {}).DP)].filter(Boolean).join(" · ")) + "</div>" +
      (desc ? '<div class="card-desc">' + esc(desc) + "</div>" : "") +
      (tags.length ? '<div class="card-tags">' + tags.map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
      "</div>"
    );
  }
  window.__thumbFailed = function (img) {
    img.onerror = null;
    img.src = PLACEHOLDER_IMG;
  };

  function renderGrid(container, frames, origin) {
    container.innerHTML = "";
    frames.forEach(function (frame) {
      if (!frame || !frame.id) return;
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.innerHTML = cardHTML(frame);
      card.addEventListener("click", function () { openDetail(frame.id, origin); });
      container.appendChild(card);
    });
  }

  /* ============ 提示词生成 ============ */
  function buildPromptEN(frame) {
    if (window.JTKPrompt) return window.JTKPrompt.buildEN(frame);
    if (frame.prompt) return frame.prompt;
    var m = frame.metadata || {};
    var parts = [];
    if (asText(m.sceneDescription)) parts.push(asText(m.sceneDescription));
    if (asText(m.shotType)) parts.push(asText(m.shotType));
    if (asText(m.cameraAngle)) parts.push(asText(m.cameraAngle));
    if (asText(m.lensCharacter || m.lens)) parts.push(asText(m.lensCharacter || m.lens) + " lens");
    var lightEN = asText(m.lightingDescription) || asText(m.lightingKey) || asText(m.lighting);
    if (lightEN) parts.push(lightEN);
    if (asText(m.setting)) parts.push(asText(m.setting));
    if (asText(m.timeOfDay)) parts.push(asText(m.timeOfDay));
    moodsOf(m).forEach(function (x) { parts.push(asText(x)); });
    return parts.filter(Boolean).join(", ");
  }
  function buildPromptCN(frame) {
    if (window.JTKPrompt) return window.JTKPrompt.buildCN(frame);
    var m = frame.metadata || {};
    var f = frame.film || {};
    var segs = [];
    var scene = [asText(m.setting), asText(m.timeOfDay), asText(m.era)].filter(Boolean).join("，");
    if (scene) segs.push("场景：" + scene);
    var chars = getCharacters(frame);
    if (chars.length) {
      segs.push("人物：" + chars.map(function (c) {
        return [c.head, c.doing].filter(Boolean).join("，");
      }).join("；"));
    }
    var cam = [asText(m.shotType), asText(m.cameraAngle), asText(m.lensCharacter || m.lens), asText(m.depthOfField), asText(m.composition)]
      .filter(Boolean).map(cnOf).join("，");
    if (cam) segs.push("镜头：" + cam);
    var lightCN = asText(m.lightingDescription) || asText(m.lightingKey) || asText(m.lighting);
    if (lightCN) segs.push("灯光：" + lightCN);
    var palette = getPalette(frame).map(function (p) { return p.name || p.hex; }).filter(Boolean).join("、");
    if (palette) segs.push("色调：" + palette);
    if (asText(m.colorDescription || m.color)) segs.push("色彩：" + asText(m.colorDescription || m.color));
    var moods = moodsOf(m).map(asText).filter(Boolean).map(cnOf).join("、");
    if (moods) segs.push("氛围：" + moods);
    if (asText(m.sceneDescription)) segs.push("画面：" + asText(m.sceneDescription));
    var ref = [];
    if (f.title) ref.push("《" + f.title + "》" + (f.year ? "（" + f.year + "）" : ""));
    if (f.director) ref.push("导演 " + f.director);
    var dpCN = f.dp || f.DP;
    if (dpCN) ref.push("摄影指导 " + dpCN);
    if (ref.length) segs.push("参考影片：" + ref.join("，"));
    return segs.join("；") + "。";
  }

  /* 一键复制全部信息：影片、场景、人物、镜头、灯光、色彩、标签、双语提示词拼成一块文本 */
  function buildFullText(frame) {
    if (window.JTKPrompt && window.JTKPrompt.buildFullText) return window.JTKPrompt.buildFullText(frame);
    var parts = [filmLine(frame), asText((frame.metadata || {}).sceneDescription), buildPromptCN(frame), buildPromptEN(frame)];
    return parts.filter(Boolean).join("\n\n");
  }
  function extractTags(raw) {
    if (window.JTKPrompt && window.JTKPrompt.extractTags) return window.JTKPrompt.extractTags(raw, DICT);
    return [];
  }

  /* ============ 详情字段解析（兼容 API 各种返回形状） ============ */
  function getTags(frame) {
    var m = (frame && frame.metadata) || {};
    var t = m.tags;
    if (Array.isArray(t)) return { flat: t.map(asText).filter(Boolean) };
    if (t && typeof t === "object") {
      var out = {};
      Object.keys(t).forEach(function (k) { out[k.toLowerCase()] = asArray(t[k]).map(asText).filter(Boolean); });
      return out;
    }
    return {};
  }
  function pickRow(tags, keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      if (tags[keys[i]] && tags[keys[i]].length) return tags[keys[i]];
    }
    return fallback || [];
  }
  function getPalette(frame) {
    var m = (frame && frame.metadata) || {};
    return asArray(m.colorPalette || m.palette).map(function (p) {
      if (typeof p === "string") {
        var hex = /^#?[0-9a-fA-F]{6}$/.test(p.trim()) ? (p[0] === "#" ? p : "#" + p) : "";
        return { name: hex ? "" : p, hex: hex };
      }
      if (p && typeof p === "object") {
        var h = p.hex || p.color || p.value || "";
        return { name: p.name || p.label || "", hex: h };
      }
      return { name: "", hex: "" };
    }).filter(function (p) { return p.name || p.hex; });
  }
  function getCharacters(frame) {
    var list = frame.characters || (frame.metadata && frame.metadata.characters) || [];
    return asArray(list).map(function (c) {
      if (typeof c === "string") return { head: "", text: c, doing: "" };
      if (!c || typeof c !== "object") return null;
      var headParts = [c.age, c.sex || c.gender, c.ethnicity, c.build]
        .map(asText).filter(Boolean);
      var head = headParts.join(" · ") || asText(c.label) || asText(c.name) || "";
      var textParts = [c.appearance, c.description, c.clothing, c.mood ? ("情绪：" + asText(c.mood)) : ""]
        .map(asText).filter(Boolean);
      return { head: head, text: textParts.join("；"), doing: asText(c.doing) };
    }).filter(Boolean);
  }
  function getNotes(frame) {
    var m = (frame && frame.metadata) || {};
    var n = m.cinematographyNotes || m.notes || {};
    return {
      lens: asText(m.lensCharacter) || asText(m.lens) || asText(n.lens) || "",
      lighting: asText(m.lightingDescription) || asText(m.lightingKey) || asText(m.lighting) || asText(n.lighting) || "",
      color: asText(m.colorDescription) || asText(m.color) || asText(m.colour) || asText(n.color) || asText(n.colour) || "",
    };
  }

  /* ============ 详情弹窗 ============ */
  function openDetail(frameId, origin) {
    var cached = null;
    if (origin === "collection") {
      cached = state.collection.filter(function (it) { return it.id === frameId; })[0];
      if (cached) { renderDetail(cached, true); return; }
    } else {
      cached = state.results[frameId] || state.similar[frameId];
    }
    // 先用已有的摘要渲染一版，再调详情接口取完整元数据
    if (cached) renderDetail(cached, false);
    else {
      $("detailContent").innerHTML = '<p class="status">正在取完整信息…</p>';
      $("detailModal").classList.remove("hidden");
    }
    if (!state.hasToken) return;
    api("/api/frame?id=" + encodeURIComponent(frameId)).then(function (body) {
      if (!body || !body.ok) {
        toast((body && body.error) || "取详情失败了");
        return;
      }
      var data = body.data;
      var frame = Array.isArray(data) ? data[0] : data;
      if (!frame || !frame.id) { toast("没取到这帧的完整信息"); return; }
      frame.id = frame.id || frameId;
      state.results[frame.id] = frame;
      renderDetail(frame, false);
    }).catch(function () { toast("连不上 FrameThrower，请检查网络连接，再试一次。"); });
  }

  function tagRowHTML(label, items) {
    if (!items || !items.length) return "";
    return (
      '<div class="tag-row"><span class="tag-row-label">' + esc(label) + "</span>" +
      items.map(function (t) { return '<span class="tag">' + esc(cnOf(t)) + "</span>"; }).join("") +
      "</div>"
    );
  }

  function renderDetail(frame, fromCollection) {
    state.currentFrame = frame;
    state.currentSimilar = [];
    var m = frame.metadata || {};
    var f = frame.film || {};
    var tags = getTags(frame);
    var notes = getNotes(frame);
    var palette = getPalette(frame);
    var chars = getCharacters(frame);
    var promptEN = buildPromptEN(frame);
    var promptCN = buildPromptCN(frame);
    var isSaved = !!state.savedIds[frame.id];

    var filmMeta = [];
    if (asArray(f.genres).length) filmMeta.push(asArray(f.genres).map(asText).join(" / "));
    if (f.director) filmMeta.push("导演 " + f.director);
    var dpDetail = f.dp || f.DP;
    if (dpDetail) filmMeta.push("摄影指导 " + dpDetail);
    var cast = asArray(f.cast).map(asText).filter(Boolean);
    if (cast.length) filmMeta.push("主演 " + cast.join("、"));

    var rows = "";
    rows += tagRowHTML("CAMERA · 摄影机", pickRow(tags, ["camera"], [asText(m.shotType), asText(m.cameraAngle), asText(m.lensCharacter), asText(m.depthOfField), asText(m.composition)].filter(Boolean)));
    var lightTags = [asText(m.lightingKey), m.lightingQuality && asText(m.lightingQuality.value), asText(m.lighting)].filter(Boolean);
    rows += tagRowHTML("LIGHTING · 灯光", pickRow(tags, ["lighting", "light"], lightTags));
    rows += tagRowHTML("SETTING · 场景", pickRow(tags, ["setting"], [asText(m.setting), asText(m.timeOfDay), asText(m.era)].filter(Boolean)));
    rows += tagRowHTML("SUBJECTS & OBJECTS · 人物与物品", pickRow(tags, ["subjects", "subjects & objects", "objects"], asArray(m.objects).map(asText).filter(Boolean)));
    rows += tagRowHTML("STYLE & MOOD · 风格情绪", pickRow(tags, ["style", "style & mood", "mood"], moodsOf(m).map(asText).filter(Boolean)));
    if (tags.flat && tags.flat.length) rows += tagRowHTML("全部标签", tags.flat);

    var paletteHTML = palette.length
      ? '<div class="palette">' + palette.map(function (p) {
          return '<span class="swatch">' +
            (p.hex ? '<span class="swatch-dot" style="background:' + esc(p.hex) + '"></span>' : "") +
            esc([p.name, p.hex].filter(Boolean).join(" ")) + "</span>";
        }).join("") + "</div>"
      : '<p class="muted">无色板信息</p>';

    var charsHTML = chars.length
      ? '<div class="char-grid">' + chars.map(function (c) {
          return '<div class="char-card">' +
            (c.head ? "<h4>" + esc(c.head) + "</h4>" : "") +
            (c.text ? "<p>" + esc(c.text) + "</p>" : "") +
            (c.doing ? "<p><span class=\"muted\">DOING </span>" + esc(c.doing) + "</p>" : "") +
            "</div>";
        }).join("") + "</div>"
      : (frame.prompt ? '<p class="muted">API 不返回人物分项，人物信息包含在下面的官方英文提示词里；原站页面有完整人物卡片。</p>' : '<p class="muted">无人物信息</p>');

    var keywords = pickRow(tags, ["keywords", "movie keywords"], asArray(m.keywords || m.movieKeywords).map(asText).filter(Boolean));

    var html = "";
    if (frame.thumbUrl) {
      html += '<img class="detail-img" src="' + esc(frame.thumbUrl) + '" alt="" onerror="window.__thumbFailed(this)">';
    }
    html += '<div class="detail-film"><h2>' + esc(filmLine(frame)) + "</h2>";
    if (filmMeta.length) html += "<p>" + esc(filmMeta.join("　·　")) + "</p>";
    html += "</div>";

    html += '<div class="detail-actions">' +
      '<button class="btn btn-primary" type="button" id="btnCopyAll">一键复制全部信息</button>' +
      '<button class="btn" type="button" id="btnCopyPrompt">只复制英文提示词</button>' +
      '<button class="btn" type="button" id="btnCopySummary">只复制场景描述</button>' +
      '<button class="btn" type="button" id="btnSimilar">找相似</button>' +
      (isSaved
        ? '<button class="btn btn-danger" type="button" id="btnUnsave">从收藏删除</button>'
        : '<button class="btn" type="button" id="btnSave">保存到收藏</button>') +
      (frame.deepLink ? '<a class="btn btn-ghost" href="' + esc(frame.deepLink) + '" target="_blank" rel="noopener">在原站打开</a>' : "") +
      "</div>";

    if (rows) html += '<div class="detail-section"><h3>标签</h3>' + rows + "</div>";
    html += '<div class="detail-section"><h3>PALETTE · 色板</h3>' + paletteHTML + "</div>";

    if (asText(m.sceneDescription) || asText(m.summary)) {
      html += '<div class="detail-section"><h3>SCENE DESCRIPTION · 场景描述</h3>';
      if (asText(m.sceneDescription)) html += '<p class="desc-text">' + esc(asText(m.sceneDescription)) + "</p>";
      if (asText(m.summary)) html += '<p class="summary-text">SUMMARY：' + esc(asText(m.summary)) + "</p>";
      html += "</div>";
    }
    html += '<div class="detail-section"><h3>CHARACTERS · 人物</h3>' + charsHTML + "</div>";

    if (notes.lens || notes.lighting || notes.color) {
      html += '<div class="detail-section"><h3>CINEMATOGRAPHY NOTES · 摄影笔记</h3><dl class="notes-list">';
      if (notes.lens) html += "<dt>LENS · 镜头</dt><dd>" + esc(cnOf(notes.lens)) + "</dd>";
      if (notes.lighting) html += "<dt>LIGHTING · 灯光</dt><dd>" + esc(notes.lighting) + "</dd>";
      if (notes.color) html += "<dt>COLOR · 色彩</dt><dd>" + esc(notes.color) + "</dd>";
      html += "</dl></div>";
    }
    if (keywords.length) {
      html += '<div class="detail-section"><h3>MOVIE KEYWORDS · 影片关键词</h3>' +
        keywords.map(function (k) { return '<span class="tag">' + esc(k) + "</span>"; }).join(" ") + "</div>";
    }
    html += '<div class="detail-section"><h3>提示词</h3>' +
      '<p class="muted">中文提示词是按这帧的元数据自动拼的，可直接改着用；英文提示词优先用官方给出的版本。</p>' +
      '<div class="prompt-box" id="promptCNBox">' + esc(promptCN) + "</div>" +
      '<div class="prompt-box" id="promptENBox">' + esc(promptEN) + "</div></div>";

    html += '<div class="detail-section hidden" id="similarSection"><h3>相似帧</h3><div id="similarGrid" class="grid similar-grid"></div></div>';

    $("detailContent").innerHTML = html;
    $("detailModal").classList.remove("hidden");

    $("btnCopyAll").addEventListener("click", function () {
      copyText(buildFullText(frame), "全部信息已复制：影片、场景、人物、镜头、灯光、色彩、提示词都在里面");
    });
    $("btnCopyPrompt").addEventListener("click", function () {
      copyText(promptEN, "英文提示词已复制");
    });
    $("btnCopySummary").addEventListener("click", function () {
      var text = asText(m.sceneDescription) || asText(m.summary) || promptCN;
      copyText(text, "场景描述已复制");
    });
    $("btnSimilar").addEventListener("click", function () { findSimilar(frame.id); });
    var btnSave = $("btnSave");
    if (btnSave) btnSave.addEventListener("click", function () { openSaveModal(frame, promptEN, promptCN); });
    var btnUnsave = $("btnUnsave");
    if (btnUnsave) btnUnsave.addEventListener("click", function () { removeFromCollection(frame.id, true); });
  }

  function findSimilar(frameId) {
    if (!state.hasToken) { toast("还没设置 API token"); return; }
    var section = $("similarSection");
    var grid = $("similarGrid");
    section.classList.remove("hidden");
    grid.innerHTML = '<p class="status">正在找相似帧…</p>';
    api("/api/similar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: frameId, limit: 12 }),
    }).then(function (body) {
      if (!body || !body.ok) {
        grid.innerHTML = '<p class="status err">' + esc((body && body.error) || "找相似失败了") + "</p>";
        return;
      }
      var frames = (body.data || []).filter(function (f) { return f && f.id && f.id !== frameId; });
      frames.forEach(function (f) { state.similar[f.id] = f; });
      state.currentSimilar = frames;
      if (!frames.length) {
        grid.innerHTML = '<p class="status">没有找到相似帧。</p>';
        return;
      }
      renderGrid(grid, frames, "similar");
    }).catch(function () {
      grid.innerHTML = '<p class="status err">连不上 FrameThrower，请检查网络连接，再试一次。</p>';
    });
  }

  function closeDetail() { $("detailModal").classList.add("hidden"); }

  /* ============ 收藏 ============ */
  function loadCollection() {
    return api("/api/collection").then(function (body) {
      var items = (body && body.items) || [];
      state.collection = items;
      state.savedIds = {};
      items.forEach(function (it) { state.savedIds[it.id] = true; });
      $("collectionCount").textContent = items.length;
      renderCollection();
      var projects = [];
      items.forEach(function (it) {
        if (it.project && projects.indexOf(it.project) === -1) projects.push(it.project);
      });
      var sel = $("projectFilter");
      var cur = sel.value;
      sel.innerHTML = '<option value="">全部项目</option>';
      projects.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p; opt.textContent = p;
        sel.appendChild(opt);
      });
      sel.value = cur;
      var dl = $("projectList");
      dl.innerHTML = "";
      projects.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p;
        dl.appendChild(opt);
      });
    }).catch(function () {
      $("collectionStatus").textContent = "收藏加载失败了，请刷新页面再试。";
    });
  }

  function filteredCollection() {
    var project = $("projectFilter").value;
    var tagQ = $("tagFilter").value.trim();
    var q = $("collectionSearch").value.trim().toLowerCase();
    return state.collection.filter(function (it) {
      if (project && it.project !== project) return false;
      if (tagQ) {
        var tags = (it.userTags || []).join(" ");
        if (tags.indexOf(tagQ) === -1) return false;
      }
      if (q) {
        var hay = [
          filmLine(it), asText((it.metadata || {}).sceneDescription),
          asText((it.metadata || {}).summary), it.promptCN || "", it.promptEN || "",
          it.note || "", (it.userTags || []).join(" "),
        ].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderCollection() {
    var items = filteredCollection();
    $("collectionStatus").textContent = state.collection.length
      ? ("共 " + state.collection.length + " 帧，显示 " + items.length + " 帧。")
      : "收藏还是空的。搜到喜欢的帧，点开详情，选「保存到收藏」。";
    renderGrid($("collectionGrid"), items, "collection");
  }

  function buildExportMarkdown(items) {
    var now = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var stamp = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
      " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
    var lines = [
      "# ShotGrab 收藏 — 提示词导出",
      "",
      "导出时间：" + stamp + "（共 " + items.length + " 帧）",
      "",
      "提示：剧照只作参考，分享时请注明影片与原站链接。",
      "",
    ];
    items.forEach(function (item, i) {
      var film = item.film || {};
      var meta = item.metadata || {};
      lines.push("## " + (i + 1) + ". " + (film.title || "未知影片") + "（" + (film.year || "") + "）", "");
      if (film.director) lines.push("- 导演：" + film.director);
      var dp = film.dp || film.DP;
      if (dp) lines.push("- 摄影指导：" + dp);
      if (meta.shotType) lines.push("- 景别：" + meta.shotType);
      if (item.project) lines.push("- 项目：" + item.project);
      if (item.userTags && item.userTags.length) lines.push("- 标签：" + item.userTags.join("、"));
      if (item.deepLink) lines.push("- 原站链接：" + item.deepLink);
      lines.push("");
      if (item.promptCN) lines.push("**中文提示词**", "", item.promptCN, "");
      var en = item.promptEN || item.prompt || "";
      if (en) lines.push("**英文提示词**", "", en, "");
      if (item.note) lines.push("**备注**：" + item.note, "");
    });
    return lines.join("\n");
  }
  function downloadExport() {
    if (!state.collection.length) { toast("收藏还是空的，没有可导出的内容"); return; }
    var md = buildExportMarkdown(state.collection);
    var now = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes());
    var blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "shotgrab-prompts-" + stamp + ".md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var pendingSave = null;
  function openSaveModal(frame, promptEN, promptCN) {
    pendingSave = { frame: frame, promptEN: promptEN, promptCN: promptCN };
    $("saveFrameTitle").textContent = filmLine(frame);
    var existing = state.collection.filter(function (it) { return it.id === frame.id; })[0];
    $("saveProject").value = existing ? (existing.project || "") : "";
    $("saveTags").value = existing ? (existing.userTags || []).join("，") : "";
    $("saveNote").value = existing ? (existing.note || "") : "";
    $("saveMsg").textContent = "";
    $("saveMsg").className = "msg";
    $("saveModal").classList.remove("hidden");
  }
  function confirmSave() {
    if (!pendingSave) return;
    var frame = pendingSave.frame;
    var tags = $("saveTags").value.split(/[,，、]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var payload = {
      id: frame.id,
      thumbUrl: frame.thumbUrl || "",
      deepLink: frame.deepLink || "",
      film: frame.film || {},
      metadata: frame.metadata || {},
      characters: frame.characters || (frame.metadata && frame.metadata.characters) || [],
      prompt: frame.prompt || "",
      promptEN: pendingSave.promptEN,
      promptCN: pendingSave.promptCN,
      userTags: tags,
      project: $("saveProject").value.trim(),
      note: $("saveNote").value.trim(),
    };
    api("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (body) {
      if (!body || !body.ok) {
        $("saveMsg").textContent = (body && body.error) || "保存失败了";
        $("saveMsg").className = "msg err";
        return;
      }
      state.savedIds[frame.id] = true;
      loadCollection().then(function () {
        $("saveModal").classList.add("hidden");
        toast("已保存到收藏");
        renderDetail(frame, false); // 刷新详情里的按钮状态
      });
    }).catch(function () {
      $("saveMsg").textContent = "保存失败了，请再试一次。";
      $("saveMsg").className = "msg err";
    });
  }
  function removeFromCollection(frameId, fromDetail) {
    api("/api/collection?id=" + encodeURIComponent(frameId), { method: "DELETE" })
      .then(function (body) {
        if (!body || !body.ok) { toast((body && body.error) || "删除失败了"); return; }
        delete state.savedIds[frameId];
        loadCollection().then(function () {
          toast("已从收藏删除");
          if (fromDetail && state.currentFrame && state.currentFrame.id === frameId) {
            renderDetail(state.currentFrame, false);
          }
        });
      }).catch(function () { toast("删除失败了，请再试一次。"); });
  }

  /* ============ token 设置 ============ */
  function saveToken(inputEl, msgEl) {
    var token = inputEl.value.trim();
    if (!token) {
      msgEl.textContent = "请先粘贴 token。";
      msgEl.className = "msg err";
      return;
    }
    msgEl.textContent = "正在保存…";
    msgEl.className = "msg";
    api("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
    }).then(function (body) {
      inputEl.value = ""; // 立刻清空输入框，不留 token
      if (!body || !body.ok) {
        msgEl.textContent = (body && body.error) || "保存失败了";
        msgEl.className = "msg err";
        return;
      }
      msgEl.textContent = "已保存。可以开始搜索了。";
      msgEl.className = "msg ok";
      refreshStatus().then(function () {
        $("settingsModal").classList.add("hidden");
        toast("token 已保存，可以开始搜索了");
      });
    }).catch(function () {
      inputEl.value = "";
      msgEl.textContent = "保存失败了，请再试一次。";
      msgEl.className = "msg err";
    });
  }

  /* ============ 页签与弹窗 ============ */
  function showTab(which) {
    $("tabSearch").classList.toggle("active", which === "search");
    $("tabScript").classList.toggle("active", which === "script");
    $("tabCollection").classList.toggle("active", which === "collection");
    $("searchPage").classList.toggle("hidden", which !== "search");
    $("scriptPage").classList.toggle("hidden", which !== "script");
    $("collectionPage").classList.toggle("hidden", which !== "collection");
    if (which === "collection") loadCollection();
  }

  /* ============ 初始化 ============ */
  renderChips();
  $("queryInput").addEventListener("input", updateQueryPreview);
  $("queryInput").addEventListener("input", updateMultisiteLinks);
  updateMultisiteLinks();
  $("queryInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") doSearch();
  });
  $("searchBtn").addEventListener("click", doSearch);
  $("setupTokenSave").addEventListener("click", function () {
    saveToken($("setupTokenInput"), $("setupTokenMsg"));
  });
  $("setupTokenInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveToken($("setupTokenInput"), $("setupTokenMsg"));
  });
  $("settingsBtn").addEventListener("click", function () {
    $("settingsTokenInput").value = "";
    $("settingsTokenMsg").textContent = "";
    $("settingsModal").classList.remove("hidden");
  });
  $("settingsClose").addEventListener("click", function () { $("settingsModal").classList.add("hidden"); });
  $("settingsBackdrop").addEventListener("click", function () { $("settingsModal").classList.add("hidden"); });
  $("settingsTokenSave").addEventListener("click", function () {
    saveToken($("settingsTokenInput"), $("settingsTokenMsg"));
  });
  $("settingsTokenClear").addEventListener("click", function () {
    api("/api/token", { method: "DELETE" }).then(function () {
      refreshStatus();
      toast("token 已清除");
    });
  });
  $("detailClose").addEventListener("click", closeDetail);
  $("detailBackdrop").addEventListener("click", closeDetail);
  $("saveClose").addEventListener("click", function () { $("saveModal").classList.add("hidden"); });
  $("saveBackdrop").addEventListener("click", function () { $("saveModal").classList.add("hidden"); });
  $("saveConfirm").addEventListener("click", confirmSave);
  $("tabSearch").addEventListener("click", function () { showTab("search"); });
  $("tabScript").addEventListener("click", function () { showTab("script"); });
  $("tabCollection").addEventListener("click", function () { showTab("collection"); });
  $("scriptParseBtn").addEventListener("click", parseScriptUI);
  $("scriptSearchBtn").addEventListener("click", searchScript);
  $("projectFilter").addEventListener("change", renderCollection);
  $("tagFilter").addEventListener("input", renderCollection);
  $("collectionSearch").addEventListener("input", renderCollection);
  $("exportBtn").addEventListener("click", downloadExport);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDetail();
      $("settingsModal").classList.add("hidden");
      $("saveModal").classList.add("hidden");
    }
  });

  refreshStatus();
  loadCollection();
})();
