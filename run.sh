#!/bin/bash
# 启动脚本

echo "=========================================="
echo "电商数据可视化看板启动脚本"
echo "=========================================="

# 启动 FastAPI 后端
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

echo "[1/2] 安装后端依赖..."
cd backend || exit 1
pip3 install -r requirements.txt

if [ ! -f "../archive/events_with_category.csv" ] && [ ! -f "../cache/events_with_category.parquet" ]; then
    echo "警告: 找不到数据文件，请将 events_with_category.csv 放入 archive/ 目录"
fi

echo "[2/2] 启动 FastAPI (CTRL+C 退出)"
uvicorn app.main:app --reload --port 8000

