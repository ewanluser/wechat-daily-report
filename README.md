# 🗞️ 微信群聊日报生成器

一个基于 Electron 的桌面应用，用于分析微信群聊记录并生成 AI 日报摘要。

## ✨ 功能特色

- 📊 **智能分析**：基于 AI 分析群聊内容，提取话题精华
- 🎯 **话题精华**：自动识别重要讨论话题，生成详细摘要
- 💬 **群友金句**：提取有价值的对话内容
- 📋 **跟进事项**：智能识别需要跟进的任务和决策
- 🎨 **美观日报**：生成精美的图片日报，支持导出和分享
- 📱 **跨平台**：支持 macOS、Windows、Linux

## 🚀 安装使用

### 直接下载安装包

1. 前往 [Releases](https://github.com/mengjian-github/wechat-daily-report/releases) 页面
2. 下载对应平台的安装包：
   - **macOS**: `微信群聊日报-1.0.0.dmg` (Intel) 或 `微信群聊日报-1.0.0-arm64.dmg` (Apple Silicon)
   - **Windows**: `微信群聊日报-1.0.0.exe`
   - **Linux**: `微信群聊日报-1.0.0.AppImage`
3. 双击安装包完成安装

### 本地构建

```bash
# 克隆项目
git clone https://github.com/mengjian-github/wechat-daily-report.git
cd wechat-daily-report

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建应用
npm run build

# 打包应用
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

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

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**💡 小贴士**: 首次使用建议先配置好 AI 服务和 Chatlog 连接，确保服务正常后再开始生成日报。
