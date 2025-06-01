import { app, shell, BrowserWindow, ipcMain, globalShortcut, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
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

    // 限制高度在合理范围内
    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
    console.log('### sssize', newHeight, clampedHeight)

    searchWindow.setSize(currentWidth, clampedHeight)

    // 保持窗口居中
    const { width: currentScreenWidth } = screen.getPrimaryDisplay().workAreaSize
    searchWindow.setPosition(
      Math.round((currentScreenWidth - currentWidth) / 2),
      Math.round(screenHeight * 0.25)
    )
  })

  searchWindow.on('ready-to-show', () => {
    const toggleShortcutKeys = process.platform === 'darwin' ? 'Option+Space' : 'Alt+Space'
    const hideShortcutKeys = 'Escape'

    const toggleSearchShortcut = globalShortcut.register(toggleShortcutKeys, () => {
      setTimeout(() => {
        toggleSearchWindow()
      }, 0)
    })

    const hideSearchShortcut = globalShortcut.register(hideShortcutKeys, () => {
      if (searchWindow.isFocused()) {
        hideSearchWindow()
      }
    })

    if (!toggleSearchShortcut) {
      console.error(
        `[Shortcut Registration Failed] Toggle search window shortcut not registered: ${toggleShortcutKeys}`
      )
    }

    if (!hideSearchShortcut) {
      console.error(
        `[Shortcut Registration Failed] Hide search window shortcut not registered: ${hideShortcutKeys}`
      )
    }
    if (!app.isPackaged) {
      searchWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  searchWindow.on('blur', () => hideSearchWindow())

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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
