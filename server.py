#!/usr/bin/env python3
"""截图库 — 本地检索程序（调用 FrameThrower 官方 API）

Python 3 标准库 only，无任何 pip 依赖。
启动：python3 server.py，或在 Mac 上双击 start.command
访问：http://127.0.0.1:8765/

说明：
- API token 由用户在界面里粘贴一次，保存在本目录的 .token 文件（权限 600），
  服务端只用它调接口，永远不会把它返回给前端、写进日志或别的任何文件。
- 收藏保存在本目录的 collection.json，只存元数据、缩略图 URL 和原站链接，
  不下载、不复制任何剧照图片文件。
- 只监听本机 127.0.0.1，不对外提供服务。
"""
import json
import os
import threading
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(APP_DIR, ".token")
COLLECTION_FILE = os.path.join(APP_DIR, "collection.json")
HOST = "127.0.0.1"
PORT = 8765
API_BASE = "https://framethrower.ai/api/v1"
USER_AGENT = "JieTuKu/1.0 (local app)"
REQUEST_TIMEOUT = 30

# 最近一次 API 返回的点数（只在内存里，不落盘）
_last_credits = {"remaining": None, "cost": None}
_credits_lock = threading.Lock()
_collection_lock = threading.Lock()

STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/app.js": ("app.js", "application/javascript; charset=utf-8"),
    "/prompt-template.js": ("prompt-template.js", "application/javascript; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
}


class ApiError(Exception):
    """面向用户的人话错误。"""

    def __init__(self, message, code="api_error"):
        super().__init__(message)
        self.message = message
        self.code = code


# ---------- token ----------

def load_token():
    try:
        with open(TOKEN_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""
    except OSError:
        return ""


def save_token(token):
    """把 token 写进 .token，权限 600（只有本机当前用户可读）。"""
    fd = os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        os.write(fd, (token.strip() + "\n").encode("utf-8"))
    finally:
        os.close(fd)
    try:
        os.chmod(TOKEN_FILE, 0o600)
    except OSError:
        pass


def delete_token():
    try:
        os.remove(TOKEN_FILE)
    except FileNotFoundError:
        pass
    with _credits_lock:
        _last_credits["remaining"] = None
        _last_credits["cost"] = None


# ---------- FrameThrower API ----------

def _remember_credits(headers):
    remaining = headers.get("X-Credits-Remaining")
    cost = headers.get("X-Credits-Cost")
    with _credits_lock:
        if remaining is not None:
            _last_credits["remaining"] = remaining
        if cost is not None:
            _last_credits["cost"] = cost
    return remaining, cost


# API 返回的文本里混有零宽字符（水印），展示和复制前要去掉
_ZERO_WIDTH = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff"))


def _clean_obj(value):
    if isinstance(value, str):
        return value.translate(_ZERO_WIDTH)
    if isinstance(value, list):
        return [_clean_obj(item) for item in value]
    if isinstance(value, dict):
        return {key: _clean_obj(item) for key, item in value.items()}
    return value


def ft_request(method, path, payload=None):
    """调一次 FrameThrower API，返回 (body_dict, cost, remaining)。"""
    token = load_token()
    if not token:
        raise ApiError("还没设置 API token，请先点右上角「设置」，粘贴你的 FrameThrower API token。", "no_token")
    url = API_BASE + path
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            remaining, cost = _remember_credits(resp.headers)
            raw = resp.read().decode("utf-8")
            try:
                body = _clean_obj(json.loads(raw)) if raw else {}
            except json.JSONDecodeError:
                body = {}
            return body, cost, remaining
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8", "replace")
        except Exception:
            detail = ""
        server_msg = ""
        try:
            server_msg = (json.loads(detail) or {}).get("error", "")
        except (json.JSONDecodeError, AttributeError):
            pass
        if e.code == 401:
            raise ApiError("Token 无效或已过期，请检查后重新设置。", "unauthorized")
        if e.code == 402:
            raise ApiError("点数不足了，请到 FrameThrower 官网充值（$1 = 1000 点，1 点≈一次搜索的一小半）。", "no_credits")
        if e.code == 404:
            raise ApiError("没找到这帧，可能已被移除。", "not_found")
        if e.code == 429:
            raise ApiError("请求太频繁了，稍等片刻再试。", "rate_limited")
        if e.code == 400:
            raise ApiError("请求有问题（%s），换个说法再试试。" % (server_msg or "参数不对"), "bad_request")
        raise ApiError("FrameThrower 服务端出错（HTTP %s），请稍后再试。" % e.code, "upstream_error")
    except urllib.error.URLError:
        raise ApiError("连不上 FrameThrower，请检查网络连接，再试一次。", "network_error")
    except TimeoutError:
        raise ApiError("请求超时了，请检查网络连接，再试一次。", "network_error")


# ---------- 收藏（本地 JSON） ----------

def load_collection():
    try:
        with open(COLLECTION_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return data["items"]
    except FileNotFoundError:
        pass
    except (json.JSONDecodeError, OSError):
        pass
    return []


def save_collection(items):
    tmp = COLLECTION_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, ensure_ascii=False, indent=2)
    os.replace(tmp, COLLECTION_FILE)


def build_export_markdown(items):
    lines = [
        "# 截图库收藏 — 提示词导出",
        "",
        "导出时间：%s（共 %d 帧）" % (
            datetime.now().astimezone().strftime("%Y-%m-%d %H:%M"), len(items)),
        "",
        "提示：剧照只作参考，分享时请注明影片与原站链接。",
        "",
    ]
    for i, item in enumerate(items, 1):
        film = item.get("film") or {}
        title = film.get("title", "未知影片")
        year = film.get("year", "")
        meta = item.get("metadata") or {}
        lines.append("## %d. %s（%s）" % (i, title, year))
        lines.append("")
        if film.get("director"):
            lines.append("- 导演：%s" % film.get("director"))
        if film.get("dp") or film.get("DP"):
            lines.append("- 摄影指导：%s" % (film.get("dp") or film.get("DP")))
        if meta.get("shotType"):
            lines.append("- 景别：%s" % meta.get("shotType"))
        if item.get("project"):
            lines.append("- 项目：%s" % item.get("project"))
        if item.get("userTags"):
            lines.append("- 标签：%s" % "、".join(item.get("userTags")))
        if item.get("deepLink"):
            lines.append("- 原站链接：%s" % item.get("deepLink"))
        lines.append("")
        if item.get("promptCN"):
            lines.append("**中文提示词**")
            lines.append("")
            lines.append(item["promptCN"])
            lines.append("")
        if item.get("promptEN") or item.get("prompt"):
            lines.append("**英文提示词**")
            lines.append("")
            lines.append(item.get("promptEN") or item.get("prompt") or "")
            lines.append("")
        if item.get("note"):
            lines.append("**备注**：%s" % item.get("note"))
            lines.append("")
    return "\n".join(lines)


# ---------- HTTP 服务 ----------

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # 不打访问日志（避免把查询词写进日志）
        pass

    # -- 小工具 --
    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text, content_type, status=200, filename=None):
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        if filename:
            self.send_header(
                "Content-Disposition",
                'attachment; filename="%s"' % filename,
            )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8", "replace")
        try:
            data = json.loads(raw)
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}

    def _credits_snapshot(self):
        with _credits_lock:
            return dict(_last_credits)

    # -- 路由 --
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in STATIC_FILES:
            filename, content_type = STATIC_FILES[path]
            full = os.path.join(APP_DIR, filename)
            try:
                with open(full, "rb") as f:
                    body = f.read()
            except OSError:
                self.send_error(404, "not found")
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/status":
            self._send_json({
                "ok": True,
                "has_token": bool(load_token()),
                "credits_remaining": self._credits_snapshot()["remaining"],
            })
            return

        if path == "/api/frame":
            frame_id = (query.get("id") or [""])[0].strip()
            if not frame_id:
                self._send_json({"ok": False, "error": "缺少帧编号。", "code": "bad_request"}, 400)
                return
            try:
                body, cost, remaining = ft_request(
                    "GET", "/frames?id=" + urllib.parse.quote(frame_id))
            except ApiError as e:
                self._send_json({"ok": False, "error": e.message, "code": e.code})
                return
            self._send_json({
                "ok": True, "data": body.get("data"), "meta": body.get("meta"),
                "credits_cost": cost, "credits_remaining": remaining,
            })
            return

        if path == "/api/collection":
            self._send_json({"ok": True, "items": load_collection()})
            return

        if path == "/api/export":
            items = load_collection()
            md = build_export_markdown(items)
            stamp = datetime.now().strftime("%Y%m%d-%H%M")
            self._send_text(md, "text/markdown; charset=utf-8",
                            filename="jietuku-prompts-%s.md" % stamp)
            return

        self.send_error(404, "not found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/token":
            payload = self._read_json()
            token = (payload.get("token") or "").strip()
            if not token:
                self._send_json({"ok": False, "error": "Token 不能为空，请粘贴从 FrameThrower 设置里创建的 API token。", "code": "bad_request"}, 400)
                return
            try:
                save_token(token)
            except OSError:
                self._send_json({"ok": False, "error": "保存失败：写不进本目录的 .token 文件，请检查文件夹权限。", "code": "io_error"}, 500)
                return
            self._send_json({"ok": True, "has_token": True})
            return

        if path == "/api/search":
            payload = self._read_json()
            query_text = (payload.get("query") or "").strip()
            if not query_text:
                self._send_json({"ok": False, "error": "请先输入要找的画面描述，或点下面的术语拼一句查询。", "code": "bad_request"}, 400)
                return
            try:
                limit = int(payload.get("limit") or 20)
            except (TypeError, ValueError):
                limit = 20
            limit = max(1, min(limit, 24))
            mode = payload.get("mode") or "hybrid"
            if mode not in ("hybrid", "semantic", "description"):
                mode = "hybrid"
            try:
                body, cost, remaining = ft_request(
                    "POST", "/search",
                    {"query": query_text, "limit": limit, "mode": mode})
            except ApiError as e:
                self._send_json({"ok": False, "error": e.message, "code": e.code})
                return
            self._send_json({
                "ok": True, "data": body.get("data") or [], "meta": body.get("meta") or {},
                "credits_cost": cost, "credits_remaining": remaining,
            })
            return

        if path == "/api/similar":
            payload = self._read_json()
            frame_id = (payload.get("id") or "").strip()
            if not frame_id:
                self._send_json({"ok": False, "error": "缺少帧编号。", "code": "bad_request"}, 400)
                return
            try:
                limit = int(payload.get("limit") or 20)
            except (TypeError, ValueError):
                limit = 20
            limit = max(1, min(limit, 24))
            try:
                body, cost, remaining = ft_request(
                    "POST", "/similar", {"frameId": frame_id, "limit": limit})
            except ApiError as e:
                self._send_json({"ok": False, "error": e.message, "code": e.code})
                return
            self._send_json({
                "ok": True, "data": body.get("data") or [], "meta": body.get("meta") or {},
                "credits_cost": cost, "credits_remaining": remaining,
            })
            return

        if path == "/api/collection":
            payload = self._read_json()
            frame_id = (payload.get("id") or "").strip()
            if not frame_id:
                self._send_json({"ok": False, "error": "这帧没有编号，保存失败。", "code": "bad_request"}, 400)
                return
            now = datetime.now(timezone.utc).isoformat(timespec="seconds")
            with _collection_lock:
                items = load_collection()
                existing = next((it for it in items if it.get("id") == frame_id), None)
                if existing:
                    # 已收藏：只更新标签/项目/备注
                    for key in ("userTags", "project", "note"):
                        if key in payload:
                            existing[key] = payload[key]
                    existing["updatedAt"] = now
                    save_collection(items)
                    self._send_json({"ok": True, "item": existing, "updated": True})
                    return
                item = {
                    "id": frame_id,
                    "source": "FrameThrower",
                    "thumbUrl": payload.get("thumbUrl") or "",
                    "deepLink": payload.get("deepLink") or "",
                    "film": payload.get("film") or {},
                    "metadata": payload.get("metadata") or {},
                    "characters": payload.get("characters") or [],
                    "prompt": payload.get("prompt") or "",
                    "promptEN": payload.get("promptEN") or "",
                    "promptCN": payload.get("promptCN") or "",
                    "userTags": payload.get("userTags") or [],
                    "project": payload.get("project") or "",
                    "note": payload.get("note") or "",
                    "savedAt": now,
                }
                items.insert(0, item)
                save_collection(items)
            self._send_json({"ok": True, "item": item, "updated": False})
            return

        self.send_error(404, "not found")

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/collection":
            self.send_error(404, "not found")
            return
        payload = self._read_json()
        frame_id = (payload.get("id") or "").strip()
        if not frame_id:
            self._send_json({"ok": False, "error": "缺少帧编号。", "code": "bad_request"}, 400)
            return
        with _collection_lock:
            items = load_collection()
            target = next((it for it in items if it.get("id") == frame_id), None)
            if not target:
                self._send_json({"ok": False, "error": "收藏里没有这一帧。", "code": "not_found"}, 404)
                return
            for key in ("userTags", "project", "note"):
                if key in payload:
                    target[key] = payload[key]
            target["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            save_collection(items)
        self._send_json({"ok": True, "item": target})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/token":
            delete_token()
            self._send_json({"ok": True, "has_token": False})
            return

        if path == "/api/collection":
            frame_id = (query.get("id") or [""])[0].strip()
            if not frame_id:
                self._send_json({"ok": False, "error": "缺少帧编号。", "code": "bad_request"}, 400)
                return
            with _collection_lock:
                items = load_collection()
                kept = [it for it in items if it.get("id") != frame_id]
                if len(kept) == len(items):
                    self._send_json({"ok": False, "error": "收藏里没有这一帧。", "code": "not_found"}, 404)
                    return
                save_collection(kept)
            self._send_json({"ok": True, "removed": True})
            return

        self.send_error(404, "not found")


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("截图库已启动：http://%s:%d/" % (HOST, PORT))
    print("按 Ctrl+C 停止（或直接关闭这个终端窗口）。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        print("截图库已停止。")


if __name__ == "__main__":
    main()
