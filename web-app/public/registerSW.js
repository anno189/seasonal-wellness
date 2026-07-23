/**
 * PWA Service Worker Registration
 * 手动注册，替代 vite-plugin-pwa
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker 注册成功:', registration)
        
        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] 新版本已安装，刷新页面生效')
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[PWA] Service Worker 注册失败:', error)
      })
  })
}
