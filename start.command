#!/bin/bash
# 截图库 — 双击启动（Mac）
# 会在本机启动服务，并自动在浏览器打开 http://127.0.0.1:8765/
# 关闭这个终端窗口即可停止服务。
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "没找到 python3，请先安装 Python 3（https://www.python.org/downloads/macos/）。"
  echo "按任意键关闭。"
  read -n 1 -s
  exit 1
fi

(sleep 1.5; open "http://127.0.0.1:8765/") &
exec python3 server.py
