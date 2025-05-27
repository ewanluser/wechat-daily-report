#!/bin/bash

# 微信群聊日报生成器 - macOS安全问题修复脚本
# 解决"应用已损坏，无法打开"的问题

set -e

echo "🔧 微信群聊日报生成器 - macOS 安全问题修复工具"
echo "================================================"
echo ""

# 检查是否在正确的目录
if [ ! -d "release" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 查找应用文件
MAC_APP=$(find ./release -name "微信群聊日报.app" -type d | head -1)
if [ -z "$MAC_APP" ]; then
    echo "❌ 错误: 未找到应用文件"
    echo "请确保已经运行过 'npm run dist:all' 生成应用"
    exit 1
fi

echo "📱 找到应用文件: $MAC_APP"
echo ""

echo "🔄 正在修复 macOS 安全限制..."
echo "这个问题是因为应用未通过苹果代码签名认证导致的"
echo ""

# 移除隔离属性
echo "1️⃣ 移除隔离属性..."
sudo xattr -cr "$MAC_APP"
echo "✅ 完成"

# 处理所有找到的应用
ALL_APPS=$(find ./release -name "微信群聊日报.app" -type d)
if [ $(echo "$ALL_APPS" | wc -l) -gt 1 ]; then
    echo ""
    echo "2️⃣ 处理其他版本..."
    for app in $ALL_APPS; do
        if [ "$app" != "$MAC_APP" ]; then
            echo "   处理: $app"
            sudo xattr -cr "$app"
        fi
    done
    echo "✅ 完成"
fi

echo ""
echo "🔍 验证修复结果..."
if xattr -l "$MAC_APP" | grep -q "com.apple.quarantine"; then
    echo "❌ 修复失败，隔离属性仍然存在"
    exit 1
else
    echo "✅ 修复成功！隔离属性已移除"
fi

echo ""
echo "🎉 修复完成！现在您可以正常运行应用了"
echo ""
echo "📋 其他解决方案（如果上述方法不生效）："
echo "1. 右键点击应用 → 选择'打开'"
echo "2. 在弹出的对话框中点击'打开'"
echo "3. 系统偏好设置 → 安全性与隐私 → 点击'仍要打开'"
echo ""
echo "🔗 更多信息："
echo "- 这是 macOS 对未签名应用的安全保护"
echo "- 开源软件通常没有苹果的代码签名证书"
echo "- 此操作是安全的，只是移除了系统的隔离标记"
echo ""
echo "💡 提示: 如果问题仍然存在，请查看项目 README 获取更多帮助" 