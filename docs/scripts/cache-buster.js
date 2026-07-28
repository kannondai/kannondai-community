// 現在の日付を基にキャッシュバスターを生成する関数
function generateCacheBuster() {
  const today = new Date();
  return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
}

// キャッシュバスターをURLに追加する関数
function addCacheBusterToElement(id, attribute = 'src', extra = '') {
  const element = document.getElementById(id);
  if (element) {
    const originalUrl = element.getAttribute(attribute);
    if (originalUrl) {
      const cleanUrl = originalUrl.split('?')[0]; // 既存のクエリパラメータを削除
      element.setAttribute(attribute, `${cleanUrl}?v=${generateCacheBuster()}${extra}`);
    }
  }
}

/**
 * 指定されたリンクにキャッシュバスターを付ける
 * @param {string[]} links - キャッシュバスターを付けたいリンクの配列
 */
function addCacheBusterToLinks(links, extra = '') {
  links.forEach(link => {
    const anchor = document.querySelector(`a[href="${link}"]`);
    if (anchor) {
      anchor.href = `${link}?v=${generateCacheBuster()}${extra}`;
    }
  });
}

// キャッシュバスターを追加してスクリプトを読み込む
function addScriptWithCacheBuster(id, src, extra = "") {
  const script = document.createElement('script');
  script.id = id;
  script.src = `${src}?v=${generateCacheBuster()}${extra}`;
  document.head.appendChild(script);
}

/**
 * description内の相対リンクにキャッシュバスターを自動追加
 * @param {string} description - HTMLを含む文字列
 * @returns {string} - キャッシュバスター付きのHTML文字列
 */
function addCacheBusterToDescription(description) {
  const cacheBuster = generateCacheBuster();
  
  // <a href="..."> のパターンを検出（外部リンクは除外）
  return description.replace(/href="([^"]+)"/g, (match, url) => {
    // 外部リンク（http/https）はそのまま
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return match;
    }
    
    // 既にクエリパラメータがある場合は置き換え、ない場合は追加
    if (url.includes('?')) {
      // 既存のv=パラメータを置き換え
      const newUrl = url.replace(/([?&])v=[^&]*/, `$1v=${cacheBuster}`);
      // v=パラメータがなかった場合は追加
      if (newUrl === url) {
        return `href="${url}&v=${cacheBuster}"`;
      }
      return `href="${newUrl}"`;
    } else {
      return `href="${url}?v=${cacheBuster}"`;
    }
  });
}