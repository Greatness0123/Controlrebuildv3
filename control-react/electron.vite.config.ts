import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.js')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          'chat-preload': resolve(__dirname, 'electron/preload/chat.ts'),
          'entry-preload': resolve(__dirname, 'electron/preload/entry.ts'),
          'settings-preload': resolve(__dirname, 'electron/preload/settings.ts'),
          'workflow-preload': resolve(__dirname, 'electron/preload/workflow.ts'),
          'lite-preload': resolve(__dirname, 'electron/preload/lite.ts'),
          'overlay-preload': resolve(__dirname, 'electron/preload/overlay.ts'),
          'ghost-cursor-preload': resolve(__dirname, 'electron/preload/ghost-cursor.ts')
        },
        output: {
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    root: 'src/windows',
    build: {
      rollupOptions: {
        input: {
          chat: resolve(__dirname, 'src/windows/chat/index.html'),
          entry: resolve(__dirname, 'src/windows/entry/index.html'),
          settings: resolve(__dirname, 'src/windows/settings/index.html'),
          overlay: resolve(__dirname, 'src/windows/overlay/index.html'),
          'ghost-cursor': resolve(__dirname, 'src/windows/ghost-cursor/index.html'),
          lite: resolve(__dirname, 'src/windows/lite/index.html'),
          workflow: resolve(__dirname, 'src/windows/workflow/index.html')
        }
      }
    }
  }
})
