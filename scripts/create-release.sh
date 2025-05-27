#!/bin/bash

# 创建GitHub Release的脚本
VERSION="1.0.0"
REPO="mengjian-github/wechat-daily-report"

echo "🚀 准备创建 GitHub Release v${VERSION}"

# 检查release目录是否存在
if [ ! -d "release" ]; then
    echo "❌ release目录不存在，请先运行打包命令"
    exit 1
fi

echo "📦 检查安装包文件..."

# 检查必要的文件是否存在
FILES=(
    "release/微信群聊日报-1.0.0.dmg"
    "release/微信群聊日报-1.0.0-arm64.dmg"
    "release/微信群聊日报 Setup 1.0.0.exe"
    "release/微信群聊日报-1.0.0.AppImage"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ 找到文件: $file"
    else
        echo "❌ 缺少文件: $file"
        exit 1
    fi
done

echo ""
echo "📝 Release 信息:"
echo "版本: v${VERSION}"
echo "仓库: ${REPO}"
echo ""

# 显示文件大小
echo "📊 安装包大小:"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "  - $(basename "$file"): $size"
    fi
done

echo ""
echo "🎯 接下来的步骤:"
echo "1. 前往 https://github.com/${REPO}/releases/new"
echo "2. 创建新的 tag: v${VERSION}"
echo "3. 填写 Release 标题: 微信群聊日报 v${VERSION}"
echo "4. 上传以下文件:"
for file in "${FILES[@]}"; do
    echo "   - $(basename "$file")"
done

echo ""
echo "📄 建议的 Release 描述："
cat << 'EOF'

## 🗞️ 微信群聊日报生成器 v1.0.0

### ✨ 新功能
- 🚀 全新的 Electron 桌面应用
- 🎨 现代化的用户界面设计
- 📊 AI 智能分析群聊内容
- 💬 自动提取话题精华和群友金句
- 📋 智能识别待跟进事项
- 🎯 支持多种 AI 模型（OpenAI、OpenRouter）
- 📱 跨平台支持（macOS、Windows、Linux）

### 📦 安装包下载

| 平台 | 文件 | 大小 |
|------|------|------|
| macOS (Intel) | 微信群聊日报-1.0.0.dmg | ~101MB |
| macOS (Apple Silicon) | 微信群聊日报-1.0.0-arm64.dmg | ~97MB |
| Windows | 微信群聊日报 Setup 1.0.0.exe | ~79MB |
| Linux | 微信群聊日报-1.0.0.AppImage | ~108MB |

### 🔧 使用说明

1. 下载对应平台的安装包
2. 双击安装包完成安装
3. 启动应用后进行 AI 服务和 Chatlog 配置
4. 选择群聊和日期，生成精美的日报

### 📋 系统要求

- **macOS**: 10.15 或更高版本
- **Windows**: Windows 10 或更高版本  
- **Linux**: Ubuntu 18.04 或同等版本

### 🔗 相关链接

- 📖 [使用文档](https://github.com/mengjian-github/wechat-daily-report#readme)
- 🐛 [问题反馈](https://github.com/mengjian-github/wechat-daily-report/issues)
- 💬 [联系作者](https://github.com/mengjian-github/wechat-daily-report#联系作者)

### 🙏 致谢

感谢所有测试用户的反馈和建议！

---

**首次使用？** 建议先查看 [README 文档](https://github.com/mengjian-github/wechat-daily-report#readme) 了解详细的配置和使用方法。

EOF

echo ""
echo "✅ 准备工作完成！现在可以创建 GitHub Release 了。" 