#!/bin/bash

# 微信群聊日报生成器官网下载链接更新脚本
# 自动从GitHub Release获取最新的下载链接并更新到官网

set -e

VERSION="v1.0.0"
REPO="mengjian-github/wechat-daily-report"

echo "🔄 开始更新官网下载链接..."

# 检查是否安装了GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 错误: 未安装 GitHub CLI"
    echo "请访问 https://cli.github.com/ 安装 GitHub CLI"
    exit 1
fi

# 检查是否在website目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在website目录下运行此脚本"
    exit 1
fi

# 获取最新的下载链接
echo "📡 从GitHub Release获取下载链接..."

# 获取下载链接
MAC_INTEL_URL=$(gh release view $VERSION --repo $REPO --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0.dmg") and (.name | contains("arm64") | not)) | .browser_download_url')
MAC_ARM_URL=$(gh release view $VERSION --repo $REPO --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0-arm64.dmg")) | .browser_download_url')
WINDOWS_URL=$(gh release view $VERSION --repo $REPO --json assets -q '.assets[] | select(.name | contains("微信群聊日报 Setup 1.0.0.exe")) | .browser_download_url')
LINUX_URL=$(gh release view $VERSION --repo $REPO --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0.AppImage")) | .browser_download_url')

# 检查是否成功获取到链接
if [ -z "$MAC_INTEL_URL" ] || [ -z "$MAC_ARM_URL" ] || [ -z "$WINDOWS_URL" ] || [ -z "$LINUX_URL" ]; then
    echo "❌ 错误: 无法获取完整的下载链接"
    echo "请确保GitHub Release $VERSION 存在且包含所有平台的安装包"
    exit 1
fi

echo "✅ 成功获取所有下载链接"
echo "📋 下载链接："
echo "  macOS Intel: $MAC_INTEL_URL"
echo "  macOS Apple Silicon: $MAC_ARM_URL"
echo "  Windows: $WINDOWS_URL"
echo "  Linux: $LINUX_URL"

# 备份原始文件
echo "💾 备份原始HTML文件..."
cp index.html index.html.backup

# 更新下载链接
echo "🔄 更新HTML文件中的下载链接..."

# 使用sed更新下载链接
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.dmg|$MAC_INTEL_URL|g" index.html
    sed -i '' "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0-arm64.dmg|$MAC_ARM_URL|g" index.html
    sed -i '' "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.exe|$WINDOWS_URL|g" index.html
    sed -i '' "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.AppImage|$LINUX_URL|g" index.html
else
    # Linux
    sed -i "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.dmg|$MAC_INTEL_URL|g" index.html
    sed -i "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0-arm64.dmg|$MAC_ARM_URL|g" index.html
    sed -i "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.exe|$WINDOWS_URL|g" index.html
    sed -i "s|https://github.com/mengjian-github/wechat-daily-report/releases/latest/download/微信群聊日报-1.0.0.AppImage|$LINUX_URL|g" index.html
fi

echo "✅ 下载链接更新完成"

# 验证更新
echo "🔍 验证更新结果..."
if grep -q "$MAC_INTEL_URL" index.html && \
   grep -q "$MAC_ARM_URL" index.html && \
   grep -q "$WINDOWS_URL" index.html && \
   grep -q "$LINUX_URL" index.html; then
    echo "✅ 验证成功：所有下载链接已正确更新"
else
    echo "❌ 验证失败：部分链接可能未正确更新"
    echo "正在恢复备份文件..."
    mv index.html.backup index.html
    exit 1
fi

# 清理备份文件
rm -f index.html.backup

# 生成更新后的下载页面预览
echo ""
echo "📄 更新后的下载链接预览："
echo "macOS Intel: $MAC_INTEL_URL"
echo "macOS Apple Silicon: $MAC_ARM_URL"
echo "Windows: $WINDOWS_URL"  
echo "Linux: $LINUX_URL"

echo ""
echo "🎉 官网下载链接更新完成！"
echo ""
echo "📝 后续步骤："
echo "1. 测试网站功能：./deploy.sh --serve"
echo "2. 部署到服务器：./deploy.sh"
echo "3. 或部署到GitHub Pages：./deploy.sh --github-pages"

# 显示变更摘要
echo ""
echo "📊 变更摘要："
echo "- ✅ macOS Intel 下载链接已更新"
echo "- ✅ macOS Apple Silicon 下载链接已更新"  
echo "- ✅ Windows 下载链接已更新"
echo "- ✅ Linux 下载链接已更新"
echo "- 📁 备份文件已清理"

echo ""
echo "💡 提示：如需回滚，请从git恢复文件或重新运行脚本" 