import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import axios, { AxiosInstance } from 'axios';

let store: any;
let mainWindow: BrowserWindow | null = null;
let chatlogApi: AxiosInstance | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

// 初始化存储
async function initializeStore() {
  try {
    // 使用require方式导入electron-store 8.x版本
    const Store = require('electron-store');
    store = new Store();
    console.log('Store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize store:', error);
    // 如果electron-store导入失败，使用内存存储作为备选方案
    const memoryStore = new Map();
    store = {
      get: (key: string) => memoryStore.get(key),
      set: (key: string, value: any) => memoryStore.set(key, value)
    };
  }
}

// 初始化Chatlog API
function initializeChatlogApi(baseUrl: string) {
  chatlogApi = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// 创建主窗口
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '微信群聊日报生成器',
    show: false,
  });

  const url = isDevelopment
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(url);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App 事件处理
app.whenReady().then(async () => {
  await initializeStore();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC 处理器
// 存储相关
ipcMain.handle('store:get', (_, key: string) => {
  try {
    console.log('Getting store value for key:', key);
    const value = store?.get(key) || null;
    console.log('Store get result:', { key, value });
    return value;
  } catch (error) {
    console.error('Error getting store value:', error);
    return null;
  }
});

ipcMain.handle('store:set', (_, key: string, value: any) => {
  try {
    console.log('Setting store value:', { key, value });
    if (store) {
      store.set(key, value);
      console.log('Store set successful');
      return true;
    }
    console.warn('Store not available');
    return false;
  } catch (error) {
    console.error('Error setting store value:', error);
    return false;
  }
});

// 对话框相关
ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('dialog:showMessageBox', async (_, options) => {
  if (!mainWindow) return null;
  return await dialog.showMessageBox(mainWindow, options);
});

// Chatlog API 相关
ipcMain.handle('chatlog:configure', (_, baseUrl: string) => {
  try {
    initializeChatlogApi(baseUrl);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('chatlog:checkConnection', async () => {
  if (!chatlogApi) {
    return { success: false, error: 'Chatlog API not initialized' };
  }

  try {
    const response = await chatlogApi.get('/api/v1/session', {
      params: { limit: 1, format: 'json' }
    });
    return { success: true, connected: response.status === 200 };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('chatlog:getChatrooms', async () => {
  if (!chatlogApi) {
    return { success: false, error: 'Chatlog API not initialized' };
  }

  try {
    const response = await chatlogApi.get('/api/v1/chatroom', {
      params: { format: 'json' }
    });

    // Chatlog返回的是items数组或直接数组
    const rawData = response.data.items || response.data || [];
    const chatrooms = Array.isArray(rawData) ? rawData
      .filter((room: any) => {
        // 更宽松的群聊过滤条件
        return room.name && (
          room.name.includes('@chatroom') || 
          room.nickName || 
          room.remark ||
          (room.users && room.users.length > 2) // 有多个用户的聊天室
        );
      })
      // 移除数量限制，显示所有群聊
      .map((room: any) => ({
        name: room.name,
        nickName: room.nickName || room.remark || room.name,
        username: room.name,
        nickname: room.nickName || room.remark || room.name
      })) : [];

    console.log(`获取到 ${chatrooms.length} 个群聊`);

    return { success: true, data: chatrooms };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('chatlog:getDailyMessages', async (_, talker: string, date: string) => {
  if (!chatlogApi) {
    return { success: false, error: 'Chatlog API not initialized' };
  }

  try {
    console.log('📡 主进程开始获取消息:', { talker, date });
    
    const response = await chatlogApi.get('/api/v1/chatlog', {
      params: {
        talker,
        time: date, // 直接使用日期格式，如 2025-05-27
        limit: 1000,
        format: 'json'
      }
    });

    console.log('📡 主进程API响应状态:', response.status);
    console.log('📡 主进程API响应数据类型:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    
    // Chatlog API直接返回数组
    const messages = Array.isArray(response.data) ? response.data : (response.data.items || response.data.data || []);
    
    console.log('📡 主进程解析到消息数量:', messages.length);
    return { success: true, data: messages };
  } catch (error) {
    console.error('📡 主进程API调用失败:', error);
    return { success: false, error: (error as Error).message };
  }
}); 