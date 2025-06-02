import { app, shell, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import icon25 from '../../resources/icon25.png?asset'
import { promises as fs } from 'fs'
import { homedir } from 'os'

function createSearchWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  const searchWindow = new BrowserWindow({
    width: 600, // 调整为更合适的宽度
    height: 380, // 初始高度
    // minHeight: 80,
    // maxHeight: 500, // 最大高度限制
    useContentSize: true,
    frame: false, // 无边框
    transparent: false, // 透明背景
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true, // 不在任务栏显示
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    focusable: true,
    autoHideMenuBar: true,
    x: Math.round((screenWidth - 600) / 2),
    y: Math.round(screenHeight * 0.25),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  let tray: Tray | null = null
  const createTray = (): void => {
    tray = new Tray(icon25)
    tray.setToolTip('Zap Go - 快速启动器')
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          showSearchWindow()
        }
      },
      {
        label: '打开配置',
        click: () => {
          createConfigWindow()
        }
      },
      { type: 'separator' },
      {
        label: '关于',
        click: () => {}
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          globalShortcut.unregisterAll()
          app.quit()
        }
      }
    ])
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => {
      showSearchWindow()
    })

    if (process.platform !== 'darwin') {
      tray.on('click', () => {
        showSearchWindow()
      })
    }
  }

  // 创建配置窗口
  let configWindow: BrowserWindow | null = null

  const createConfigWindow = (): void => {
    if (configWindow) {
      configWindow.focus()
      return
    }

    configWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      show: false,
      focusable: true,
      autoHideMenuBar: true,
      center: true,
      title: 'Zap Go - 配置设置',
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    configWindow.on('ready-to-show', () => {
      configWindow?.show()
    })

    configWindow.on('focus', () => {
      const devToolsShortcut = globalShortcut.register('F12', () => {
        if (configWindow && configWindow.webContents) {
          if (configWindow.webContents.isDevToolsOpened()) {
            configWindow.webContents.closeDevTools()
          } else {
            configWindow.webContents.openDevTools({ mode: 'detach' })
          }
        }
      })

      if (!devToolsShortcut) {
        console.error(
          '[Shortcut Registration Failed] F12 shortcut not registered for config window'
        )
      }
    })

    configWindow.on('blur', () => {
      globalShortcut.unregister('F12')
    })

    configWindow.on('closed', () => {
      globalShortcut.unregister('F12')
      configWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      configWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/config.html`)
    } else {
      configWindow.loadFile(join(__dirname, '../renderer/config.html'))
    }
  }

  const showSearchWindow = (): void => {
    // 重新居中窗口
    const { width: currentScreenWidth } = screen.getPrimaryDisplay().workAreaSize
    const [windowWidth] = searchWindow.getSize()
    searchWindow.setPosition(
      Math.round((currentScreenWidth - windowWidth) / 2),
      Math.round(screenHeight * 0.25)
    )

    searchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    searchWindow.show()
    searchWindow.focus()
  }

  const hideSearchWindow = (): void => {
    searchWindow.hide()
  }

  const toggleSearchWindow = (): void => {
    if (searchWindow.isVisible()) {
      hideSearchWindow()
    } else {
      showSearchWindow()
    }
  }

  // 监听来自渲染进程的高度调整请求
  ipcMain.on('resize-window', (_, __, newHeight: number) => {
    const [currentWidth] = searchWindow.getSize()
    const maxHeight = 500
    const minHeight = 80

    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

    searchWindow.setSize(currentWidth, clampedHeight)

    const { width: currentScreenWidth } = screen.getPrimaryDisplay().workAreaSize
    searchWindow.setPosition(
      Math.round((currentScreenWidth - currentWidth) / 2),
      Math.round(screenHeight * 0.25)
    )
  })

  ipcMain.on('open-config-window', () => {
    createConfigWindow()
  })

  const configDir = join(homedir(), '.zapgo')
  const configPath = join(configDir, 'config.json')
  const ensureConfigDir = async (): Promise<void> => {
    try {
      await fs.mkdir(configDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create config directory:', error)
    }
  }

  ipcMain.handle('load-config', async () => {
    try {
      await ensureConfigDir()
      const data = await fs.readFile(configPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.log('Config file not found or invalid, using default config', error)
      return null
    }
  })

  ipcMain.handle('save-config', async (_, config) => {
    try {
      await ensureConfigDir()
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  })

  searchWindow.on('ready-to-show', () => {
    // 创建系统托盘
    createTray()

    const toggleShortcutKeys = process.platform === 'darwin' ? 'Option+Space' : 'Alt+Space'

    const toggleSearchShortcut = globalShortcut.register(toggleShortcutKeys, () => {
      setTimeout(() => {
        toggleSearchWindow()
      }, 0)
    })

    if (!toggleSearchShortcut) {
      console.error(
        `[Shortcut Registration Failed] Toggle search window shortcut not registered: ${toggleShortcutKeys}`
      )
    }

    if (!app.isPackaged) {
      searchWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  searchWindow.on('focus', () => {
    const hideShortcutKeys = 'Escape'
    const hideSearchShortcut = globalShortcut.register(hideShortcutKeys, () => {
      hideSearchWindow()
    })

    if (!hideSearchShortcut) {
      console.error(
        `[Shortcut Registration Failed] Hide search window shortcut not registered: ${hideShortcutKeys}`
      )
    }
  })

  // 在搜索窗口失去焦点时取消注册 Escape 快捷键
  searchWindow.on('blur', () => {
    globalShortcut.unregister('Escape')
    hideSearchWindow()
  })

  searchWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    searchWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    searchWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.zapgo')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createSearchWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createSearchWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
