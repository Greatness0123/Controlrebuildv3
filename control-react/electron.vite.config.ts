import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['fs-extra', 'dotenv'] })],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.js'),
        formats: ['cjs']
      },
      rollupOptions: {
        external: [
          'electron',
          'path',
          'fs',
          'os',
          'child_process',
          'util',
          'events',
          'crypto',
          'http',
          'https',
          'url',
          'net',
          'dns',
          'sharp',
          'vosk',
          'edge-tts',
          'node-global-key-listener',
          'screenshot-desktop',
          'imagescript',
          'jimp',
          'python-shell',
          '@picovoice/porcupine-node',
          '@picovoice/pvrecorder-node',
          '@computer-use/nut-js',
          '@supabase/supabase-js',
          '@google/generative-ai',
          'ws',
          'uuid'
        ],
        input: {
            main: resolve(__dirname, 'electron/main.js'),
            'window-manager': resolve(__dirname, 'electron/window-manager.js'),
            'hotkey-manager': resolve(__dirname, 'electron/hotkey-manager.js'),
            'security-manager-fixed': resolve(__dirname, 'electron/security-manager-fixed.js'),
            'backend-manager-fixed': resolve(__dirname, 'electron/backend-manager-fixed.js'),
            'wakeword-manager': resolve(__dirname, 'electron/wakeword-manager.js'),
            'edge-tts': resolve(__dirname, 'electron/edge-tts.js'),
            'vosk-server-manager': resolve(__dirname, 'electron/vosk-server-manager.js'),
            'settings-manager': resolve(__dirname, 'electron/settings-manager.js'),
            'supabase-service': resolve(__dirname, 'electron/supabase-service.js'),
            'remote-desktop-manager': resolve(__dirname, 'electron/remote-desktop-manager.js'),
            'workflow-manager': resolve(__dirname, 'electron/workflow-manager.js'),
            'app-utils': resolve(__dirname, 'electron/app-utils.js'),
            'electron-browser-manager': resolve(__dirname, 'electron/electron-browser-manager.js'),
            'tool-executor': resolve(__dirname, 'electron/tool-executor.js'),
            'tool-registry': resolve(__dirname, 'electron/tool-registry.js'),
            'storage-manager': resolve(__dirname, 'electron/storage-manager.js'),
            'device-manager': resolve(__dirname, 'electron/device-manager.js'),
            'prompt-manager': resolve(__dirname, 'electron/prompt-manager.js'),
            'search-manager': resolve(__dirname, 'electron/search-manager.js'),
            'backends/act-backend': resolve(__dirname, 'electron/backends/act-backend.js'),
            'backends/ask-backend': resolve(__dirname, 'electron/backends/ask-backend.js'),
            'backends/click-backend': resolve(__dirname, 'electron/backends/click-backend.js'),
            'backends/wakeword-helper': resolve(__dirname, 'electron/backends/wakeword-helper.js')
        },
        output: {
            entryFileNames: '[name].js'
        }
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
