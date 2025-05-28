# 微信群聊日报生成器

基于Electron的桌面应用，使用AI技术智能分析微信群聊内容，生成精美的日报。

![产品截图](public/images/product.png)

## ✨ 主要功能

- 🧠 **AI智能分析**：基于先进的AI技术分析群聊内容，自动识别重要信息
- 🎯 **话题精华提取**：智能识别讨论中的重要话题，生成详细摘要  
- 💬 **群友金句收集**：自动提取群聊中的精彩言论和有价值观点
- 📋 **跟进事项识别**：智能识别需要跟进的任务、决策和重要事项
- 🎨 **精美日报生成**：生成美观的图片格式日报，支持导出分享
- 💻 **跨平台支持**：支持 macOS、Windows、Linux 三大操作系统

## 📦 下载安装

### 获取最新版本

从 [GitHub Releases](https://github.com/mengjian-github/wechat-daily-report/releases/latest) 下载最新版本。

### 文件命名规则

- **macOS Intel**: `WeChatDailyReport-{version}-x64.dmg`
- **macOS Apple Silicon**: `WeChatDailyReport-{version}-arm64.dmg`
- **Windows**: `WeChatDailyReport-Setup-{version}.exe`
- **Linux**: `WeChatDailyReport-{version}-x64.AppImage`

### 系统要求

- **macOS**: macOS 10.15 或更高版本
- **Windows**: Windows 10 或更高版本
- **Linux**: 支持AppImage的现代Linux发行版

## 🚀 快速开始

### 安装配置

1. 下载对应平台的安装包并安装
2. 启动应用，首次使用需要配置以下服务：

#### AI 服务配置
- **API 提供商**：[OpenRouter](https://openrouter.ai/) (推荐) 或 OpenAI
- **OpenRouter 优势**：统一接口访问 300+ 模型，更好的价格和可用性，无需订阅
- **API 密钥**：从 [OpenRouter](https://openrouter.ai/) 或 OpenAI 平台获取
- **模型选择**：默认 `openai/gpt-4o-mini`，支持 GPT-4、Gemini 等多种模型

#### Chatlog 服务配置
- **Chatlog 项目**：[sjzar/chatlog](https://github.com/sjzar/chatlog) - 聊天记录工具，轻松使用自己的聊天数据
- **安装方式**：`go install github.com/sjzar/chatlog@latest` 或从 [Releases](https://github.com/sjzar/chatlog/releases) 下载
- **启动服务**：运行 `chatlog` 并选择"开启 HTTP 服务"，默认地址为 `http://127.0.0.1:5030`
- **基础 URL**：在应用中配置为 Chatlog 服务的访问地址（如：`http://127.0.0.1:5030`）
- 确保 Chatlog 服务正常运行并可访问

### 使用流程

1. **选择群聊**：从下拉列表中选择要分析的群聊
2. **选择日期**：选择要分析的具体日期
3. **生成日报**：点击"生成日报"按钮开始分析
4. **导出分享**：生成的日报可以保存为图片或查看文本版本

## 📖 详细使用指南

除了上述基本流程，我们还为您准备了更详细的使用指南：

- 📝 **完整使用教程**：[微信群聊日报生成器：AI驱动的智能群聊分析工具详细使用指南](https://mp.weixin.qq.com/s/PRI1mo4OV4VnVVmeBT-lUw)

这篇详细指南包含了：
- 完整的安装配置步骤
- 各种使用场景和技巧
- 常见问题解答
- 最佳实践建议

## 🛠️ 开发指南

### 环境要求

- Node.js 16+ 
- npm 或 yarn

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
```

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建生产版本
npm run build

# 打包应用
npm run pack

# 构建分发版本
npm run dist

# 构建所有平台
npm run dist:all

# 构建特定平台
npm run dist:mac    # macOS
npm run dist:win    # Windows  
npm run dist:linux  # Linux

# 清理构建文件
npm run clean
```

### 技术栈

- **框架**: Electron + React + TypeScript
- **UI 库**: Ant Design
- **打包工具**: Webpack + electron-builder
- **状态管理**: React Hooks
- **样式**: CSS Modules + CSS-in-JS
- **动画**: Framer Motion

## 🚀 自动化发布

本项目已配置完全自动化的版本发布流程！详细说明请查看 [RELEASE.md](RELEASE.md)。

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

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## ⚠️ 免责声明

**重要提示：使用本项目前，请务必阅读并理解完整的 [免责声明](DISCLAIMER.md)。**

本项目仅供学习、研究和个人合法使用，禁止用于任何非法目的或未授权访问他人数据。下载、安装或使用本工具即表示您同意遵守免责声明中的所有条款，并自行承担使用过程中的全部风险和法律责任。

### 使用限制

- ✅ 仅限处理您自己合法拥有的聊天数据或已获授权的数据
- ❌ 严禁用于未经授权获取、查看或分析他人聊天记录  
- ⚠️ 使用第三方AI服务时，您应遵守这些服务的使用条款和隐私政策
- 🔒 开发者不对使用本工具可能导致的任何损失承担责任

**本项目完全免费开源，任何以本项目名义收费的行为均与本项目无关。**

如有疑问或发现滥用行为，请通过 [GitHub Issues](https://github.com/mengjian-github/wechat-daily-report/issues) 联系我们。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- 📖 [使用文档](https://github.com/mengjian-github/wechat-daily-report#readme)
- 📝 [详细使用指南](https://mp.weixin.qq.com/s/PRI1mo4OV4VnVVmeBT-lUw)
- 🐛 [问题反馈](https://github.com/mengjian-github/wechat-daily-report/issues)
- 💬 [讨论区](https://github.com/mengjian-github/wechat-daily-report/discussions)
- 🌐 [官方网站](https://www.wechatdaily.online/)

## 📞 联系作者

如果在使用过程中遇到问题或有功能建议，欢迎联系：

- 🔗 **GitHub**: [mengjian-github](https://github.com/mengjian-github)
- 💬 **微信**: 扫描应用内二维码添加
- 📧 **邮箱**: 通过微信获取

## ⭐ Star History

如果这个项目对你有帮助，请给我们一个Star！

[![Star History Chart](https://api.star-history.com/svg?repos=mengjian-github/wechat-daily-report&type=Date)](https://star-history.com/#mengjian-github/wechat-daily-report&Date)
