# 微信群聊日报生成器

基于Electron的桌面应用，使用AI技术智能分析微信群聊内容，生成精美的日报。

## 🖼️ 产品截图

![产品截图](public/images/product.png)

## ✨ 主要功能

- 🧠 **AI智能分析**：基于先进的AI技术分析群聊内容，自动识别重要信息
- 🎯 **话题精华提取**：智能识别讨论中的重要话题，生成详细摘要  
- 💬 **群友金句收集**：自动提取群聊中的精彩言论和有价值观点
- 📋 **跟进事项识别**：智能识别需要跟进的任务、决策和重要事项
- 🎨 **精美日报生成**：生成美观的图片格式日报，支持导出分享
- 💻 **跨平台支持**：支持 macOS、Windows、Linux 三大操作系统

## 📦 下载安装

### 最新版本

从 [GitHub Releases](https://github.com/mengjian-github/wechat-daily-report/releases/latest) 下载最新版本：

#### 文件命名规则

为了解决GitHub Release中文文件名显示问题，我们采用了英文文件命名规则：

- **macOS Intel**: `WeChatDailyReport-{version}-x64.dmg`
- **macOS Apple Silicon**: `WeChatDailyReport-{version}-arm64.dmg`
- **Windows**: `WeChatDailyReport-Setup-{version}.exe`
- **Linux**: `WeChatDailyReport-{version}-x64.AppImage`

#### 系统要求

- **macOS**: macOS 10.15 或更高版本
- **Windows**: Windows 10 或更高版本
- **Linux**: 支持AppImage的现代Linux发行版

## 🚀 快速开始

1. 下载对应平台的安装包
2. 安装应用并启动
3. 配置AI服务设置（支持OpenAI、DeepSeek等）
4. 选择群聊和日期范围
5. 一键生成精美日报

## 🛠️ 开发指南

### 环境要求

- Node.js 16+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建所有平台
npm run dist:all

# 构建特定平台
npm run dist:mac    # macOS
npm run dist:win    # Windows  
npm run dist:linux  # Linux
```

### 文件命名配置

项目使用 `electron-builder` 的 `artifactName` 配置来控制生成文件的命名：

```json
{
  "build": {
    "productName": "微信群聊日报",
    "mac": {
      "artifactName": "WeChatDailyReport-${version}-${arch}.${ext}"
    },
    "win": {
      "artifactName": "WeChatDailyReport-Setup-${version}.${ext}"
    },
    "linux": {
      "artifactName": "WeChatDailyReport-${version}-${arch}.${ext}"
    }
  }
}
```

这样配置的好处：
- ✅ 避免GitHub Release中文文件名显示问题
- ✅ 保持应用内显示的中文名称不变
- ✅ 文件名清晰标识平台和架构
- ✅ 符合国际化命名规范

## 🔧 技术栈

- **框架**: Electron
- **前端**: React + TypeScript
- **UI库**: Ant Design
- **构建工具**: Webpack
- **打包工具**: electron-builder
- **AI服务**: OpenAI API / DeepSeek API

## 📝 更新日志

### v1.0.1
- 🔧 优化文件命名规则，解决GitHub Release中文显示问题
- 📦 改进打包配置，使用英文文件名
- 🌐 保持应用内中文显示不变

### v1.0.0
- 🎉 首次发布
- ✨ 基础AI分析功能
- 🎨 日报生成和导出
- 💻 跨平台支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- 📖 [使用文档](https://github.com/mengjian-github/wechat-daily-report#readme)
- 🐛 [问题反馈](https://github.com/mengjian-github/wechat-daily-report/issues)
- 💬 [讨论区](https://github.com/mengjian-github/wechat-daily-report/discussions)
- 🌐 [官方网站](https://mengjian-github.github.io/wechat-daily-report)

## ⭐ Star History

如果这个项目对你有帮助，请给我们一个Star！

[![Star History Chart](https://api.star-history.com/svg?repos=mengjian-github/wechat-daily-report&type=Date)](https://star-history.com/#mengjian-github/wechat-daily-report&Date)

## 🔧 配置说明

首次使用需要配置以下服务：

### 1. AI 服务配置
- **API 提供商**：OpenRouter (推荐) 或 OpenAI
- **API 密钥**：从对应平台获取
- **模型选择**：默认 `anthropic/claude-3-sonnet`

### 2. Chatlog 服务配置
- **基础 URL**：Chatlog 服务的访问地址
- 确保 Chatlog 服务正常运行并可访问

## 📖 使用指南

1. **启动应用**：打开应用后首先进行服务配置
2. **选择群聊**：从下拉列表中选择要分析的群聊
3. **选择日期**：选择要分析的具体日期
4. **生成日报**：点击"生成日报"按钮开始分析
5. **导出分享**：生成的日报可以保存为图片或查看文本版本

## 🚀 自动化发布

本项目已配置完全自动化的版本发布流程！详细说明请查看 [RELEASE.md](RELEASE.md)。

### 快速开始
只需要按照约定的格式提交代码，推送到主分支即可自动发布：

```bash
# 新功能 (次版本更新)
git commit -m "feat: 添加新的AI分析功能"

# 修复bug (补丁版本更新)  
git commit -m "fix: 修复导出功能问题"

# 重大更新 (主版本更新)
git commit -m "BREAKING: 重构整个UI界面"

# 推送到主分支触发自动发布
git push origin main
```

系统会自动：
- ✅ 更新版本号
- ✅ 构建所有平台安装包
- ✅ 创建GitHub Release
- ✅ 更新官网下载链接

## 🛠️ 开发指南

### 项目结构

```
src/
├── main/           # 主进程代码
│   └── main.ts     # Electron 主进程入口
├── renderer/       # 渲染进程代码
│   ├── components/ # React 组件
│   ├── pages/      # 页面组件
│   ├── services/   # 服务接口
│   └── styles/     # 样式文件
├── shared/         # 共享类型定义
└── preload.ts      # 预加载脚本

webpack配置文件:
├── webpack.main.config.js      # 主进程打包配置
├── webpack.renderer.config.js  # 渲染进程打包配置
└── webpack.preload.config.js   # 预加载脚本打包配置
```

### 开发脚本

```bash
npm run dev          # 启动开发环境
npm run build        # 构建生产版本
npm run pack         # 打包为未分发的应用
npm run dist         # 打包为分发版本
npm run clean        # 清理构建文件
```

### 技术栈

- **框架**: Electron + React + TypeScript
- **UI 库**: Ant Design
- **打包工具**: Webpack + electron-builder
- **状态管理**: React Hooks
- **样式**: CSS Modules + CSS-in-JS
- **动画**: Framer Motion

## 📞 联系作者

如果在使用过程中遇到问题或有功能建议，欢迎联系：

- 🔗 **GitHub**: [mengjian-github](https://github.com/mengjian-github)
- 💬 **微信**: 扫描应用内二维码添加
- 📧 **邮箱**: 通过微信获取
