// デバイスがタッチデバイスかどうかを判定
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// GAS Web API エンドポイント（予約作成・削除・削除後の最新データ取得用）
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby5deijDza0ky3NHDmH555-0IiPEliRyRMCYLQmzmWtpf_uWOaWYiSL09oKMFNi-aRd/exec';

// URL パラメータからトークンを取得
const urlParams = new URLSearchParams(window.location.search);
const userToken = urlParams.get('token');

// グローバルスコープで `today` を定義
const today = new Date();

// グローバルスコープでメッセージを定義
const DEFAULT_RESERVATION_MESSAGE = `日付を${isTouchDevice ? "タップ" : "クリック"}すると予約内容が表示されます。`;

// ========================================

// ========================================
// 既存のコード
// ========================================

// 昨日の日付を計算して挿入
// キャッシュバスターを適用
function applyCacheBuster() {
  addCacheBusterToElement('js-core-min');
  addCacheBusterToElement('js-hall-reserve');
  addCacheBusterToElement('js-checkpw');
}

// 予約内容に基づいてアイコンを取得する関数
function getReservationIcon(reservation) {
  const keywordsToIcons = {
    "サロン": "🪑", // サロンのアイコン
    "クラブ": "🌺", // クラブのアイコン
    "体操": "👭", // 体操のアイコン
    "カフェ": "🍵", // カフェのアイコン
    "イベント": "🎉", // イベントのアイコン
  };

  // 予約内容が配列の場合、最初の一致するアイコンを返す
  if (Array.isArray(reservation)) {
    for (const item of reservation) {
      for (const [keyword, icon] of Object.entries(keywordsToIcons)) {
        if (item.includes(keyword)) {
          return icon;
        }
      }
    }
  }

  // 予約内容がオブジェクトの場合、値をチェック
  if (typeof reservation === "object" && reservation !== null) {
    for (const value of Object.values(reservation)) {
      for (const [keyword, icon] of Object.entries(keywordsToIcons)) {
        if (value.includes(keyword)) {
          return icon;
        }
      }
    }
  }

  // 予約内容が文字列の場合、キーワードに一致するアイコンを返す
  if (typeof reservation === "string") {
    for (const [keyword, icon] of Object.entries(keywordsToIcons)) {
      if (reservation.includes(keyword)) {
        return icon;
      }
    }
  }

  // デフォルトのアイコン
  return "✏️";
}

// カレンダーの初期化
function initializeCalendar() { 
  // サンプル予約データ
  let sampleReservations = {};

  // 静的JSONファイルから予約データを取得（高速）
  console.log('[データ取得] JSONファイルからデータ取得開始');
  fetch('scripts/calendar-reservations.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('[データ取得] 取得成功:', Object.keys(data).length, '日分');
      sampleReservations = data;
      renderCalendar(currentYear, currentMonth);
      showReservationDetailForDate(today);
      
      // トークンがある場合、予約フォームを表示
      if (userToken) {
        console.log('[認証] トークン検出 - 予約フォームを有効化');
        const reservationForm = document.getElementById('reservationForm');
        if (reservationForm) {
          // フォームを表示可能状態にする（実際の表示は空きセルクリック時）
          reservationForm.dataset.enabled = 'true';
        }
      } else {
        console.log('[認証] トークンなし - 閲覧モード');
      }
    })
    .catch(err => {
      console.error('[データ取得] エラー:', err);
      alert('予約データの取得に失敗しました。しばらくしてから再度お試しください。');
    });

  const minDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 1);

  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  let detailMode = false; // 詳細表示モードのフラグ
  let selectedDate = new Date(today); // 初期値は今日

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  function showReservationDetailForDate(date) {
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const res = sampleReservations[dateStr];
    // Pending 予約は GAS 方式では不要
    
    let detail = `<strong>${dateStr}</strong><br>`;
    
    // 時刻を表示用に変換（00:00 - 23:59 → 終日）
    const formatTime = (time) => {
      return (time === '00:00 - 23:59') ? '終日' : time;
    };
    
    // 確定予約（Confirmed）
    if (res) {
      detail += '<div style="margin-top: 10px;"><strong>🟢 予約</strong></div>';
      if (Array.isArray(res)) {
        detail += res.map(item => `<div>${item}</div>`).join('');
      } else if (typeof res === 'object' && res !== null) {
        detail += Object.entries(res).map(
          ([time, val]) => {
            // トークンがある場合のみ変更・削除ボタンを表示
            const buttons = userToken
              ? `<button class="modify-btn" data-date="${dateStr}" data-time="${time}" data-group="${val}" style="padding:2px 8px;font-size:0.85em;background:#4CAF50;color:white;border:none;border-radius:3px;cursor:pointer;margin-right:4px;">変更</button>
                 <button class="delete-btn" data-date="${dateStr}" data-time="${time}" data-group="${val}" style="padding:2px 8px;font-size:0.85em;background:#f44336;color:white;border:none;border-radius:3px;cursor:pointer;">削除</button>`
              : '';
            return `<div style="display:flex;gap:0.5em;align-items:center;">
             <span style="min-width:3em;font-weight:bold;text-align:left;">${formatTime(time)}</span>
             <span style="flex:1;text-align:left;">${val}</span>
             ${buttons}
           </div>`;
          }
        ).join('');
      } else if (typeof res === 'string') {
        detail += `<div>${res}</div>`;
      }
    }
    
    if (!res) {
      detail += '<div>予約はありません。</div>';
    }
    
    document.getElementById('reserveDetail').innerHTML = detail;
    
    // 変更・削除ボタンにイベントリスナーを追加
    document.querySelectorAll('.modify-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.target.dataset.date;
        const time = e.target.dataset.time;
        const group = e.target.dataset.group;
        openModifyForm(date, time, group);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.target.dataset.date;
        const time = e.target.dataset.time;
        const group = e.target.dataset.group;
        confirmDelete(date, time, group);
      });
    });
  }

  function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // その月の1日を含む週の日曜日を計算（表示開始日）
    const calendarStartDate = new Date(firstDay);
    calendarStartDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // その月の末日を含む週の土曜日を計算（表示終了日）
    const calendarEndDate = new Date(lastDay);
    calendarEndDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;

    const tbody = document.getElementById('calendarTable').querySelector('tbody');
    tbody.innerHTML = '';
    let tr = document.createElement('tr');
    
    // 表示開始日から終了日まで1日ずつループ
    const currentDate = new Date(calendarStartDate);
    let dayCount = 0;
    
    while (currentDate <= calendarEndDate) {
      const dateObj = new Date(currentDate);
      const dateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
      const isOtherMonth = dateObj.getMonth() !== month;
      const td = renderDayCell(dateObj, dateStr, isOtherMonth);
      tr.appendChild(td);
      
      dayCount++;
      if (dayCount % 7 === 0) {
        tbody.appendChild(tr);
        tr = document.createElement('tr');
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 最後の行が未完成の場合は追加
    if (tr.childElementCount > 0) {
      tbody.appendChild(tr);
    }
  }

  function renderDayCell(date, dateStr, isOtherMonth = false) {
    const td = document.createElement('td');
    const holidayName = JapaneseHolidays.isHoliday(date);
    const res = sampleReservations[dateStr];
    // Pending 予約は GAS 方式では不要（即座に反映されるため）
    const isReserved = !!res;
    
    // 他の月の日付にクラスを追加
    if (isOtherMonth) {
      td.classList.add('other-month');
    }

    if (!detailMode) {
      if (holidayName) {
        td.classList.add(isReserved ? 'holiday-reserved' : 'holiday');
        td.title = isReserved
          ? `${holidayName}／予約あり`
          : holidayName;
        td.innerHTML = `${date.getDate()}<br>
        <span>${holidayName}</span>`;
        if (isReserved) {
          td.innerHTML += `<br><span class="icon">${getReservationIcon(res)}</span>`;
        }
      } else if (isReserved) {
        td.classList.add('reserved');
        td.title = "予約あり";
        let icons = getReservationIcon(res);
        td.innerHTML = `${date.getDate()}<br><span class="icon">${icons}</span>`;
      } else {
        td.textContent = date.getDate();
      }
    } else {
      let reservationHtml = '';
      if (res) {
        if (Array.isArray(res)) {
          reservationHtml = res.join('<br>');
        } else if (typeof res === 'object') {
          reservationHtml = Object.entries(res)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
        } else {
          reservationHtml = res;
        }
      }

      if (holidayName) {
        td.classList.add(isReserved ? 'holiday-reserved' : 'holiday');
        td.title = isReserved
          ? `${holidayName}／${reservationHtml.replace(/<[^>]+>/g, '')}`
          : holidayName;
        td.innerHTML = `${date.getDate()}<br>
        <span>${holidayName}</span>`;
        if (isReserved) {
          td.innerHTML += `<br><span class="reservation">${reservationHtml}</span>`;
        }
      } else if (isReserved) {
        td.classList.add('reserved');
        td.title = reservationHtml.replace(/<[^>]+>/g, '');
        td.innerHTML = `${date.getDate()}<br><span class="reservation">${reservationHtml}</span>`;
      } else {
        td.textContent = date.getDate();
      }
    }

    if (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    ) {
      td.classList.add('selected');
    }

    td.onclick = () => {
      selectedDate = new Date(date);
      renderCalendar(currentYear, currentMonth);
      showReservationDetailForDate(date);
      
      // トークンがある場合のみ予約フォームを表示
      if (userToken) {
        const reservationForm = document.getElementById('reservationForm');
        const reserveDateInput = document.getElementById('reserveDate');
        const form = document.getElementById('newReservationForm');
        if (reservationForm && reserveDateInput && form) {
          // フォームをリセット（新規予約モード）
          form.reset();
          delete form.dataset.mode;
          delete form.dataset.originalDate;
          delete form.dataset.originalTime;
          
          // 見出しを元に戻す
          const heading = reservationForm.querySelector('h2');
          if (heading) {
            heading.textContent = '集会所予約を申し込む';
          }
          
          reservationForm.style.display = 'block';
          const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          reserveDateInput.value = dateStr;
        
          // フォームにスムーズにスクロール
          reservationForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };

    return td;
  }

  function openModifyForm(date, time, group) {
    // フォームを表示
    const reservationForm = document.getElementById('reservationForm');
    const form = document.getElementById('newReservationForm');
    
    if (!reservationForm || !form) return;
    
    // フォームを変更モードに設定
    form.dataset.mode = 'modify';
    form.dataset.originalDate = date;
    form.dataset.originalTime = time;
    
    // 既存データをフォームに入力
    document.getElementById('reserveDate').value = date;
    document.getElementById('reserveGroup').value = group;
    
    // 時刻を分解して入力（終日の場合は00:00-23:59）
    const isAllDay = (time === '00:00 - 23:59');
    if (isAllDay) {
      document.getElementById('allDayCheck').checked = true;
      document.getElementById('reserveTimeStart').value = '00:00';
      document.getElementById('reserveTimeEnd').value = '23:59';
      document.getElementById('reserveTimeStart').disabled = true;
      document.getElementById('reserveTimeEnd').disabled = true;
      document.getElementById('reserveTimeStart').style.backgroundColor = '#f0f0f0';
      document.getElementById('reserveTimeEnd').style.backgroundColor = '#f0f0f0';
    } else {
      const [start, end] = time.split(' - ');
      document.getElementById('allDayCheck').checked = false;
      document.getElementById('reserveTimeStart').value = start;
      document.getElementById('reserveTimeEnd').value = end;
      document.getElementById('reserveTimeStart').disabled = false;
      document.getElementById('reserveTimeEnd').disabled = false;
      document.getElementById('reserveTimeStart').style.backgroundColor = '';
      document.getElementById('reserveTimeEnd').style.backgroundColor = '';
    }
    
    // フォーム見出しを変更
    const heading = reservationForm.querySelector('h2');
    if (heading) {
      heading.textContent = '予約を変更する';
    }
    
    // フォームを表示してスクロール
    reservationForm.style.display = 'block';
    reservationForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  async function confirmDelete(date, time, group) {
    const displayTime = (time === '00:00 - 23:59') ? '終日' : time;
    const confirmed = confirm(
      `以下の予約を削除しますか？\n\n` +
      `日付: ${date}\n` +
      `時間: ${displayTime}\n` +
      `イベント名: ${group}`
    );
    
    if (!confirmed) return;
    
    if (!userToken) {
      alert('削除にはトークンが必要です。');
      return;
    }
    
    try {
      console.log('[予約削除] GAS API へ DELETE:', { date, timeSlot: time });
      
      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: userToken,
          date: date,
          timeSlot: time,
          action: 'delete'
        })
      });
      
      const result = await response.json();
      console.log('[予約削除] レスポンス:', result);
      
      if (!response.ok || result.error) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      // 成功
      alert('予約を削除しました。数秒後にカレンダーに反映されます。');
      
      // 3秒後にデータ再取得してカレンダー更新
      console.log('[予約削除] 3秒後にカレンダー更新');
      setTimeout(async () => {
        try {
          const res = await fetch(GAS_API_URL);
          const data = await res.json();
          sampleReservations = data;
          const dateObj = new Date(date + 'T00:00:00');
          renderCalendar(dateObj.getFullYear(), dateObj.getMonth());
          showReservationDetailForDate(dateObj);
          console.log('[予約削除] カレンダー更新完了');
        } catch (err) {
          console.error('[予約削除] カレンダー更新エラー:', err);
        }
      }, 3000);
      
    } catch (error) {
      console.error('[予約削除] エラー:', error);
      alert(`削除に失敗しました: ${error.message}`);
    }
  }

  function changeMonth(diff) {
    let y = currentYear;
    let m = currentMonth + diff;
    if (m < 0) { y--; m = 11; }
    if (m > 11) { y++; m = 0; }
    const newDate = new Date(y, m, 1);
    if (newDate < minDate || newDate > maxDate) return;
    currentYear = y;
    currentMonth = m;
    renderCalendar(currentYear, currentMonth);
    document.getElementById('reserveDetail').innerHTML = DEFAULT_RESERVATION_MESSAGE; // 一元化されたメッセージを使用
  }

  document.getElementById('prevMonth').onclick = () => changeMonth(-1);
  document.getElementById('nextMonth').onclick = () => changeMonth(1);
  document.getElementById('goToday').onclick = () => {
  const wasDifferentMonth = currentYear !== today.getFullYear() || currentMonth !== today.getMonth();

  // 「今日」の年月に変更
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDate = new Date(today); // 「今日」を選択状態に設定

  // カレンダーを再描画
  renderCalendar(currentYear, currentMonth);

  // 選択状態で予約情報を表示
  showReservationDetailForDate(selectedDate);
};
  document.getElementById('toggleDetail').addEventListener('click', () => {
    detailMode = !detailMode;
    document.getElementById('toggleDetail').textContent = detailMode ? '簡易表示' : '詳細表示';
    renderCalendar(currentYear, currentMonth);
  });
  
  // ========================================
  // フォーム関連の処理（initializeCalendar 内で定義）
  // ========================================
  
  // フォームを閉じるボタン
  const closeFormBtn = document.getElementById('closeFormBtn');
  const reservationForm = document.getElementById('reservationForm');
  if (closeFormBtn && reservationForm) {
    closeFormBtn.addEventListener('click', () => {
      reservationForm.style.display = 'none';
      // フォームをリセット
      const form = document.getElementById('newReservationForm');
      if (form) {
        form.reset();
        delete form.dataset.mode;
        delete form.dataset.originalDate;
        delete form.dataset.originalTime;
        // 見出しを元に戻す
        const heading = reservationForm.querySelector('h2');
        if (heading) {
          heading.textContent = '集会所予約を申し込む';
        }
      }
    });
  }
  
  // 終日チェックボックスの処理
  const allDayCheck = document.getElementById('allDayCheck');
  const timeStartInput = document.getElementById('reserveTimeStart');
  const timeEndInput = document.getElementById('reserveTimeEnd');
  
  if (allDayCheck && timeStartInput && timeEndInput) {
    allDayCheck.addEventListener('change', (e) => {
      if (e.target.checked) {
        // 終日をチェック → 時刻を無効化して00:00-23:59をセット
        timeStartInput.value = '00:00';
        timeEndInput.value = '23:59';
        timeStartInput.disabled = true;
        timeEndInput.disabled = true;
        timeStartInput.style.backgroundColor = '#f0f0f0';
        timeEndInput.style.backgroundColor = '#f0f0f0';
      } else {
        // 終日をチェック解除 → 時刻を有効化
        timeStartInput.disabled = false;
        timeEndInput.disabled = false;
        timeStartInput.style.backgroundColor = '';
        timeEndInput.style.backgroundColor = '';
        timeStartInput.value = '';
        timeEndInput.value = '';
      }
    });
  }
  
  // 予約フォームの送信処理（GAS API へ POST）
  const form = document.getElementById('newReservationForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!userToken) {
        alert('予約にはトークンが必要です。');
        return;
      }
      
      console.log('[予約送信] フォーム送信開始');
      
      const date = document.getElementById('reserveDate').value;
      const timeStart = document.getElementById('reserveTimeStart').value;
      const timeEnd = document.getElementById('reserveTimeEnd').value;
      const group = document.getElementById('reserveGroup').value;
      const isAllDay = allDayCheck && allDayCheck.checked;
      
      console.log('[予約送信] 入力値:', { date, timeStart, timeEnd, group, isAllDay });
      
      const timeSlot = `${timeStart} - ${timeEnd}`;
      
      // 送信ボタンを無効化
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
      }
      
      try {
        // GAS API へ POST
        console.log('[予約送信] GAS API へ POST:', { date, timeSlot, group });
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: userToken,
            date: date,
            timeSlot: timeSlot,
            groupName: group
          })
        });
        
        const result = await response.json();
        console.log('[予約送信] レスポンス:', result);
        
        if (!response.ok || result.error) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        // 成功
        alert('予約を受け付けました。数秒後にカレンダーに反映されます。');
        
        // フォームをリセット
        form.reset();
        
        // 変更モードをクリア
        delete form.dataset.mode;
        delete form.dataset.originalDate;
        delete form.dataset.originalTime;
        
        // 見出しを元に戻す
        const reservationForm = document.getElementById('reservationForm');
        const heading = reservationForm ? reservationForm.querySelector('h2') : null;
        if (heading) {
          heading.textContent = '集会所予約を申し込む';
        }
        
        if (timeStartInput && timeEndInput) {
          timeStartInput.disabled = false;
          timeEndInput.disabled = false;
          timeStartInput.style.backgroundColor = '';
          timeEndInput.style.backgroundColor = '';
        }
        
        // フォームを非表示
        if (reservationForm) {
          reservationForm.style.display = 'none';
        }
        
        // 3秒後にデータ再取得してカレンダー更新
        console.log('[予約送信] 3秒後にカレンダー更新');
        setTimeout(async () => {
          try {
            const res = await fetch(GAS_API_URL);
            const data = await res.json();
            sampleReservations = data;
            const dateObj = new Date(date + 'T00:00:00');
            renderCalendar(dateObj.getFullYear(), dateObj.getMonth());
            showReservationDetailForDate(dateObj);
            console.log('[予約送信] カレンダー更新完了');
          } catch (err) {
            console.error('[予約送信] カレンダー更新エラー:', err);
          }
        }, 3000);
        
      } catch (error) {
        console.error('[予約送信] エラー:', error);
        alert(`予約に失敗しました: ${error.message}`);
      } finally {
        // 送信ボタンを再有効化
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyCacheBuster();
  initializeCalendar();
});
