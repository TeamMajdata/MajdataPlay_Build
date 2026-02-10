#!/usr/bin/env python3

import hashlib
import json
from pathlib import Path

# 输出文件
OUTPUT_FILE = "hashes.json"
OUTPUT_FILE2 = "smallest_hashes.json"
README_FILE = "README.md"


# 要排除的文件
EXCLUDE_FILES = {OUTPUT_FILE, OUTPUT_FILE2, README_FILE, "hash.ts", "package.json", "pnpm-lock.yaml", "tsconfig.json", ".gitignore"}

# 根目录（仓库根）
ROOT = Path(".").resolve()


def calculate_sha256(file_path):
    """计算文件的 SHA256 哈希值"""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()


def main():
    hashes = []

    # 遍历所有文件（递归）
    for file_path in ROOT.rglob("*"):
        # 跳过目录和非文件
        if not file_path.is_file():
            continue

        if ".git" in file_path.parts or ".github" in file_path.parts or "node_modules" in file_path.parts:
            continue

        # 跳过排除的文件
        if file_path.name in EXCLUDE_FILES:
            continue

        # 相对路径（相对于仓库根）
        rel_path = file_path.relative_to(ROOT)
        name = file_path.name

        # 计算 SHA256
        try:
            sha256 = calculate_sha256(file_path)
        except Exception as e:
            print(f"⚠️ 跳过文件 {rel_path}: {e}")
            continue

        # 添加到列表
        hashes.append(
            {
                "Name": name,
                "SHA256": sha256,
                "RelativePath": str(rel_path).replace(
                    "\\", "/"
                ),  # 统一使用 /（兼容 Windows）
            }
        )

    # 按 RelativePath 排序，确保结果一致
    hashes.sort(key=lambda x: x["RelativePath"])

    # 写入 hashes.json
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(hashes, f, indent=2, ensure_ascii=False)

    print(f"✅ 已生成 {OUTPUT_FILE}，共 {len(hashes)} 个文件。")


if __name__ == "__main__":
    main()
