// Service Worker for 観音台コミュニティ情報 PWA
const CACHE_NAME = 'kannondai-community-v2'; // バージョン更新: 2026-07-28
const urlsToCache = [
  '/kannondai-community/',
  '/kannondai-community/top.html',
  '/kannondai-community/hall-reserve.html',
  '/kannondai-community/about_this_site.html',
  '/kannondai-community/styles/top.css',
  '/kannondai-community/styles/hall-reserve.css',
  '/kannondai-community/scripts/hall-reserve.js',
  '/kannondai-community/scripts/japanese-holidays.min.js',
  '/kannondai-community/scripts/core-min.js',
  '/kannondai-community/scripts/sha256-min.js',
  '/kannondai-community/scripts/cache-buster.js',
  '/kannondai-community/scripts/checkpw.js'
];

// インストール時：基本ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // 新しいService Workerを即座に有効化
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // すべてのクライアントを即座に制御
});

// フェッチ時：HTMLはネットワークファースト、その他はキャッシュファースト
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // HTMLファイルはネットワークファースト（常に最新版を取得）
  if (event.request.method === 'GET' && 
      (event.request.headers.get('accept').includes('text/html') || 
       url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 成功したらキャッシュも更新
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから返す
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/kannondai-community/');
          });
        })
    );
    return;
  }
  
  // その他のリソース（CSS, JS, 画像等）はキャッシュファースト
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request).then((response) => {
          // レスポンスが有効でない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // ネットワークもキャッシュも失敗した場合
        return caches.match('/kannondai-community/');
      })
  );
});
