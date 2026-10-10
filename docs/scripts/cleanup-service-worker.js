if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      const siteScope = new URL('/kannondai-community/', window.location.origin).href;
      registrations
        .filter(registration => registration.scope === siteScope)
        .forEach(registration => {
          registration.update().catch(error => {
            console.error('[Service Worker] 更新確認に失敗しました:', error);
          });
        });
    })
    .catch(error => {
      console.error('[Service Worker] 登録確認に失敗しました:', error);
    });
}
