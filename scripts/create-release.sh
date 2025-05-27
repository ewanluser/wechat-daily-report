#!/bin/bash

# 微信群聊日报生成器 GitHub Release 发布脚本
# 使用GitHub CLI创建发布并上传所有平台的安装包

set -e

VERSION="v1.0.0"
RELEASE_TITLE="微信群聊日报生成器 v1.0.0"
RELEASE_NOTES="## 🎉 微信群聊日报生成器 v1.0.0 正式发布

### ✨ 主要功能
- 🧠 **AI智能分析**：基于先进的AI技术分析群聊内容，自动识别重要信息
- 🎯 **话题精华提取**：智能识别讨论中的重要话题，生成详细摘要  
- 💬 **群友金句收集**：自动提取群聊中的精彩言论和有价值观点
- 📋 **跟进事项识别**：智能识别需要跟进的任务、决策和重要事项
- 🎨 **精美日报生成**：生成美观的图片格式日报，支持导出分享
- 💻 **跨平台支持**：支持 macOS、Windows、Linux 三大操作系统

### 🔧 技术栈
- Electron + React + TypeScript
- Ant Design UI组件库  
- AI/OpenAI API支持
- 现代化webpack构建

### 📦 安装包说明
- **macOS Intel**: 适用于Intel芯片的Mac设备
- **macOS Apple Silicon**: 适用于M1/M2芯片的Mac设备
- **Windows**: 适用于Windows 10及以上版本
- **Linux**: AppImage格式，免安装直接运行

### 🚀 快速开始
1. 下载对应平台的安装包
2. 安装应用并启动
3. 配置AI服务和Chatlog连接
4. 选择群聊和日期范围
5. 一键生成精美日报

### 📝 更新日志
- 🎉 首次正式发布
- ✅ 完整功能实现
- 🔧 跨平台支持
- 📱 现代化UI设计
- ⚡ 性能优化

### 🐛 已知问题
- 首次使用需要配置AI服务，请参考使用文档
- 部分杀毒软件可能误报，请添加信任

### 🔗 相关链接
- 📖 [使用文档](https://github.com/mengjian-github/wechat-daily-report#readme)
- 🐛 [问题反馈](https://github.com/mengjian-github/wechat-daily-report/issues)
- 💬 [讨论区](https://github.com/mengjian-github/wechat-daily-report/discussions)

感谢所有用户的支持！如有问题请通过GitHub Issues反馈。"

echo "🚀 开始创建 GitHub Release..."

# 检查是否安装了GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 错误: 未安装 GitHub CLI"
    echo "请访问 https://cli.github.com/ 安装 GitHub CLI"
    exit 1
fi

# 检查是否已登录GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ 错误: 未登录 GitHub"
    echo "请运行 'gh auth login' 进行登录"
    exit 1
fi

# 检查是否在git仓库中（支持子模块）
if [ ! -d ".git" ] && [ ! -f ".git" ]; then
    echo "❌ 错误: 不在git仓库中"
    exit 1
fi

# 检查release目录是否存在
if [ ! -d "release" ]; then
    echo "❌ 错误: release目录不存在，请先运行打包命令"
    exit 1
fi

# 检查必要的安装包文件是否存在
required_files=(
    "release/微信群聊日报-1.0.0.dmg"
    "release/微信群聊日报-1.0.0-arm64.dmg"
    "release/微信群聊日报 Setup 1.0.0.exe"
    "release/微信群聊日报-1.0.0.AppImage"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 错误: 缺少安装包文件 $file"
        echo "请先运行 'npm run dist:all' 生成所有平台的安装包"
        exit 1
    fi
done

echo "✅ 所有安装包文件检查完成"

# 创建临时的release notes文件
echo "$RELEASE_NOTES" > /tmp/release_notes.md

# 创建GitHub Release
echo "📝 创建 GitHub Release..."
gh release create "$VERSION" \
    --title "$RELEASE_TITLE" \
    --notes-file /tmp/release_notes.md \
    --draft=false \
    --prerelease=false

echo "✅ GitHub Release 创建成功"

# 上传安装包文件
echo "📦 上传安装包文件..."

echo "⬆️ 上传 macOS Intel 版本..."
gh release upload "$VERSION" "release/微信群聊日报-1.0.0.dmg" --clobber

echo "⬆️ 上传 macOS Apple Silicon 版本..."
gh release upload "$VERSION" "release/微信群聊日报-1.0.0-arm64.dmg" --clobber

echo "⬆️ 上传 Windows 版本..."
gh release upload "$VERSION" "release/微信群聊日报 Setup 1.0.0.exe" --clobber

echo "⬆️ 上传 Linux 版本..."
gh release upload "$VERSION" "release/微信群聊日报-1.0.0.AppImage" --clobber

# 清理临时文件
rm -f /tmp/release_notes.md

echo "🎉 GitHub Release 发布完成！"
echo "🌐 访问地址: $(gh release view $VERSION --web --json url -q .url)"

# 获取下载链接
echo ""
echo "📋 下载链接："
echo "macOS Intel: $(gh release view $VERSION --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0.dmg")) | .browser_download_url')"
echo "macOS Apple Silicon: $(gh release view $VERSION --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0-arm64.dmg")) | .browser_download_url')"  
echo "Windows: $(gh release view $VERSION --json assets -q '.assets[] | select(.name | contains("微信群聊日报 Setup 1.0.0.exe")) | .browser_download_url')"
echo "Linux: $(gh release view $VERSION --json assets -q '.assets[] | select(.name | contains("微信群聊日报-1.0.0.AppImage")) | .browser_download_url')"

echo ""
echo "💡 提示: 现在可以运行官网更新脚本来更新下载链接"
echo "💡 命令: cd website && ./update-download-links.sh" 