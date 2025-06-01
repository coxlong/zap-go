import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      resizeWindow: (width: number, height: number) => void
    }
  }
}
