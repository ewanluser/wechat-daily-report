#!/bin/bash

# 微信群聊日报生成器官网部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署微信群聊日报生成器官网..."

# 检查必要文件是否存在
check_files() {
    local files=("index.html" "styles.css" "script.js")
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ 错误: 缺少必要文件 $file"
            exit 1
        fi
    done
    echo "✅ 所有必要文件检查完成"
}

# 创建构建目录
create_build_dir() {
    echo "📁 创建构建目录..."
    rm -rf dist
    mkdir -p dist
    echo "✅ 构建目录创建完成"
}

# 复制文件到构建目录
copy_files() {
    echo "📋 复制文件到构建目录..."
    cp index.html dist/
    cp styles.css dist/
    cp script.js dist/
    cp favicon.ico dist/ 2>/dev/null || echo "⚠️ favicon.ico 不存在，跳过复制"
    cp README.md dist/ 2>/dev/null || echo "⚠️ README.md 不存在，跳过复制"
    
    # 复制项目图片资源
    if [ -d "./images" ]; then
        mkdir -p dist/images
        cp -r ./images/* dist/images/
        echo "✅ 图片资源复制完成"
    else
        echo "⚠️ 图片目录不存在，请确保项目图片正确放置"
    fi
    
    echo "✅ 文件复制完成"
}

# 优化CSS和JS（可选）
optimize_files() {
    echo "⚡ 开始文件优化..."
    
    # 如果安装了相关工具，可以进行压缩
    if command -v uglifycss &> /dev/null; then
        uglifycss dist/styles.css > dist/styles.min.css
        mv dist/styles.min.css dist/styles.css
        echo "✅ CSS压缩完成"
    else
        echo "ℹ️ uglifycss 未安装，跳过CSS压缩"
    fi
    
    if command -v uglifyjs &> /dev/null; then
        uglifyjs dist/script.js -o dist/script.min.js
        mv dist/script.min.js dist/script.js
        echo "✅ JS压缩完成"
    else
        echo "ℹ️ uglifyjs 未安装，跳过JS压缩"
    fi
}

# 更新HTML中的图片路径
update_image_paths() {
    echo "🔄 更新图片路径..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|./images/|./images/|g' dist/index.html
    else
        # Linux
        sed -i 's|./images/|./images/|g' dist/index.html
    fi
    echo "✅ 图片路径更新完成"
}

# 生成sitemap.xml
generate_sitemap() {
    echo "🗺️ 生成sitemap.xml..."
    cat > dist/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://your-domain.com/</loc>
        <lastmod>$(date +%Y-%m-%d)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>
EOF
    echo "✅ sitemap.xml 生成完成"
}

# 生成robots.txt
generate_robots() {
    echo "🤖 生成robots.txt..."
    cat > dist/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
EOF
    echo "✅ robots.txt 生成完成"
}

# GitHub Pages部署
deploy_github_pages() {
    if [ "$1" == "--github-pages" ]; then
        echo "🐙 部署到GitHub Pages..."
        
        # 检查是否在git仓库中
        if [ ! -d "../.git" ]; then
            echo "❌ 错误: 不在git仓库中"
            exit 1
        fi
        
        # 切换到项目根目录
        cd ..
        
        # 创建或切换到gh-pages分支
        git checkout -B gh-pages
        
        # 清空当前内容并复制网站文件
        rm -rf * 2>/dev/null || true
        cp -r website/dist/* .
        
        # 添加和提交
        git add .
        git commit -m "Deploy website - $(date '+%Y-%m-%d %H:%M:%S')"
        
        # 推送到GitHub
        git push -f origin gh-pages
        
        # 切换回主分支
        git checkout main
        
        echo "✅ GitHub Pages部署完成"
        echo "🌐 访问地址: https://[username].github.io/[repository-name]"
    fi
}

# 本地服务器测试
local_server() {
    if [ "$1" == "--serve" ]; then
        echo "🌐 启动本地服务器..."
        cd dist
        
        if command -v python3 &> /dev/null; then
            echo "📡 服务器运行在: http://localhost:8000"
            python3 -m http.server 8000
        elif command -v python &> /dev/null; then
            echo "📡 服务器运行在: http://localhost:8000"
            python -m SimpleHTTPServer 8000
        elif command -v npx &> /dev/null; then
            echo "📡 服务器运行在: http://localhost:3000"
            npx serve -p 3000
        else
            echo "❌ 未找到可用的服务器，请手动启动"
        fi
    fi
}

# 显示帮助信息
show_help() {
    echo "微信群聊日报生成器官网部署脚本"
    echo ""
    echo "使用方法:"
    echo "  ./deploy.sh                    构建网站到dist目录"
    echo "  ./deploy.sh --serve            构建并启动本地服务器"
    echo "  ./deploy.sh --github-pages     构建并部署到GitHub Pages"
    echo "  ./deploy.sh --help             显示此帮助信息"
    echo ""
}

# 主程序
main() {
    case "$1" in
        --help)
            show_help
            exit 0
            ;;
        --serve)
            check_files
            create_build_dir
            copy_files
            update_image_paths
            optimize_files
            generate_sitemap
            generate_robots
            local_server --serve
            ;;
        --github-pages)
            check_files
            create_build_dir
            copy_files
            update_image_paths
            optimize_files
            generate_sitemap
            generate_robots
            deploy_github_pages --github-pages
            ;;
        *)
            check_files
            create_build_dir
            copy_files
            update_image_paths
            optimize_files
            generate_sitemap
            generate_robots
            echo "🎉 构建完成！文件已生成到 dist/ 目录"
            echo "💡 使用 './deploy.sh --serve' 启动本地服务器预览"
            echo "💡 使用 './deploy.sh --github-pages' 部署到GitHub Pages"
            ;;
    esac
}

# 运行主程序
main "$@" 