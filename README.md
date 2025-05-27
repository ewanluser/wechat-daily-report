# 微信群聊日报生成器

基于 Electron 的桌面应用程序，可以连接 Chatlog 服务获取微信群聊记录，并使用 AI 生成结构化的日报摘要。

## 技术栈

- **桌面框架**: Electron 32.x
- **前端框架**: React 19 + TypeScript
- **UI 组件库**: Ant Design 5.x (暗色主题)
- **构建工具**: Webpack 5
- **AI 服务**: OpenAI API / OpenRouter
- **数据源**: Chatlog HTTP API
- **本地存储**: electron-store
- **动画**: Framer Motion
- **图表**: html2canvas (卡片导出)

## 项目结构

```
wechat-daily-report/
├── src/
│   ├── main/                    # 主进程
│   │   └── main.ts             # Electron 主进程入口
│   ├── renderer/               # 渲染进程
│   │   ├── components/         # React 组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # 服务层
│   │   ├── styles/            # 样式文件
│   │   ├── App.tsx            # React 应用入口
│   │   ├── index.tsx          # 渲染进程入口
│   │   ├── index.html         # HTML 模板
│   │   └── preload.ts         # 预加载脚本
│   └── shared/                # 共享类型定义
│       └── types.ts
├── dist/                      # 构建输出目录
│   ├── main/                  # 主进程构建文件
│   └── renderer/              # 渲染进程构建文件
├── webpack.main.config.js     # 主进程 Webpack 配置
├── webpack.renderer.config.js # 渲染进程 Webpack 配置
├── webpack.preload.config.js  # 预加载脚本 Webpack 配置
├── tsconfig.json             # 主项目 TypeScript 配置
├── tsconfig.renderer.json    # 渲染进程 TypeScript 配置
└── package.json
```

## 系统要求

- **操作系统**: macOS 10.15+, Windows 10+, Linux (Ubuntu 18.04+)
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 4GB RAM
- **存储**: 至少 500MB 可用空间

## 快速开始

### 前置条件
1. 安装并启动 Chatlog 服务
2. 准备 AI API 密钥 (推荐使用 OpenRouter)

### 快速启动
```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 构建应用
npm run build

# 3. 启动应用
npm start
```

### 首次使用
1. 点击右上角"设置"按钮
2. 配置 AI 服务 (推荐 OpenRouter + gpt-3.5-turbo)
3. 配置 Chatlog 连接 (默认: http://127.0.0.1:5030)
4. 选择群聊和日期，点击"生成日报"

## 安装与运行

### 开发环境

1. **克隆项目**
   ```bash
   git clone [repository-url]
   cd wechat-daily-report
   ```

2. **安装依赖**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **启动开发环境**
   ```bash
   npm run dev
   ```
   这将同时启动：
   - Webpack Dev Server (端口 3000) - 渲染进程热重载
   - 主进程监听模式
   - 预加载脚本监听模式

### 生产构建

1. **构建所有模块**
   ```bash
   npm run build
   ```

2. **启动应用**
   ```bash
   npm start
   ```

### 打包分发

```bash
# 打包为不同平台
npm run dist:mac    # macOS DMG
npm run dist:win    # Windows NSIS
npm run dist:linux  # Linux AppImage

# 或者打包当前平台
npm run dist
```

## 使用说明

### 首次配置

1. **启动 Chatlog 服务**
   
   确保已安装并启动 Chatlog：
   ```bash
   chatlog server
   ```
   默认运行在 `http://127.0.0.1:5030`

2. **配置 AI 服务**
   
   点击应用右上角的"设置"按钮，配置：
   - AI 服务提供商（推荐 OpenRouter）
   - API 密钥
   - 模型名称（如 `gpt-3.5-turbo`）

3. **配置 Chatlog 连接**
   
   在设置页面的"Chatlog连接"选项卡中：
   - 输入 Chatlog 服务地址
   - 点击"测试连接"验证

### 生成日报

1. **选择群聊**: 从下拉列表中选择要分析的微信群
2. **选择日期**: 选择要生成日报的日期
3. **生成日报**: 点击"生成日报"按钮
4. **查看结果**: 系统将显示结构化的日报卡片
5. **导出日报**: 可以保存为图片或查看文本版本

### 功能特性

- **智能摘要**: AI 自动提取关键话题和重要信息
- **活动统计**: 分析消息数量、活跃用户、时段分布
- **群友金句**: 筛选出有趣或有价值的发言
- **待跟进事项**: 识别需要后续处理的任务
- **卡片导出**: 生成精美的日报卡片图片
- **文本导出**: 生成 Markdown 格式的详细报告

## 开发指南

### 添加新功能

1. **渲染进程** (前端功能)
   - 组件: `src/renderer/components/`
   - 页面: `src/renderer/pages/`
   - 服务: `src/renderer/services/`

2. **主进程** (系统功能)
   - 修改: `src/main/main.ts`
   - 添加 IPC 处理器

3. **共享类型**
   - 更新: `src/shared/types.ts`

### 构建脚本

```bash
# 开发模式
npm run dev:main       # 主进程开发模式
npm run dev:renderer   # 渲染进程开发模式
npm run dev:preload    # 预加载脚本开发模式

# 生产构建
npm run build:main     # 构建主进程
npm run build:renderer # 构建渲染进程
npm run build:preload  # 构建预加载脚本

# 清理
npm run clean         # 清理构建文件
```

## 故障排除

### 常见问题

1. **应用启动失败**
   - 检查 Node.js 版本 (需要 18+)
   - 重新安装依赖: `rm -rf node_modules && npm install --legacy-peer-deps`

2. **Chatlog 连接失败**
   - 确认 Chatlog 服务是否运行
   - 检查防火墙设置
   - 验证服务地址是否正确

3. **AI 服务错误**
   - 检查 API 密钥是否有效
   - 确认模型名称是否正确
   - 检查网络连接

4. **构建错误**
   - 清理构建缓存: `npm run clean`
   - 重新构建: `npm run build`

### 日志调试

开发模式下，应用会在控制台输出详细日志：
- 主进程日志: 终端输出
- 渲染进程日志: 开发者工具 Console

## 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0 (当前版本)
- ✅ 重构为纯 Electron 应用
- ✅ 支持 Chatlog API 集成
- ✅ 集成 AI 日报生成 (OpenAI/OpenRouter)
- ✅ 支持卡片和文本导出 (HTML2Canvas + Markdown)
- ✅ 暗色主题 UI (Ant Design Dark)
- ✅ 完整的设置管理 (AI配置 + Chatlog连接)
- ✅ 群聊列表自动获取
- ✅ 日期选择和聊天记录分析
- ✅ 结构化日报生成 (话题精华、群友金句、待跟进事项)
- ✅ 活动统计和可视化展示
- ✅ 响应式设计和动画效果 (Framer Motion)
