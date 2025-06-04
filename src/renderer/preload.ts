import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 存储相关
  getStoreValue: (key: string) => ipcRenderer.invoke('store:get', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  
  // 对话框相关
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  showMessageBox: (options: any) => ipcRenderer.invoke('dialog:showMessageBox', options),
  
  // Chatlog API相关
  chatlogConfigure: (baseUrl: string) => ipcRenderer.invoke('chatlog:configure', baseUrl),
  chatlogCheckConnection: () => ipcRenderer.invoke('chatlog:checkConnection'),
  chatlogGetChatrooms: () => ipcRenderer.invoke('chatlog:getChatrooms'),
  chatlogGetContacts: () => ipcRenderer.invoke('chatlog:getContacts'),
  chatlogGetDailyMessages: (talker: string, date: string) => ipcRenderer.invoke('chatlog:getDailyMessages', talker, date),
  
  // 应用信息
  isElectron: true,
  platform: process.platform
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI); 