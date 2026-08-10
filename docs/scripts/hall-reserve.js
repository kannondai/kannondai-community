// デバイスがタッチデバイスかどうかを判定
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// グローバルスコープで `today` を定義
const today = new Date();

// グローバルスコープでメッセージを定義
const DEFAULT_RESERVATION_MESSAGE = `日付を${isTouchDevice ? "タップ" : "クリック"}すると予約内容が表示されます。`;

// ========================================
// localStorage 管理（pending 予約）
// ========================================

// pending 予約を保存
function savePendingReservation(date, timeSlot, group) {
  const id = `pending-${Date.now()}`;
  const pending = getPendingReservations();
  pending.push({
    id,
    date,
    timeSlot,
    group,
    status: 'pending',
    submittedAt: new Date().toISOString()
  });
  localStorage.setItem('pendingReservations', JSON.stringify(pending));
  return id;
}

// pending 予約を取得
function getPendingReservations() {
  const stored = localStorage.getItem('pendingReservations');
  return stored ? JSON.parse(stored) : [];
}

// 30分経過した pending 予約を削除
function cleanupExpiredReservations() {
  const pending = getPendingReservations();
  const now = new Date();
  const filtered = pending.filter(item => {
    const submitted = new Date(item.submittedAt);
    const elapsed = (now - submitted) / 1000 / 60; // 分
    return elapsed < 30;
  });
  localStorage.setItem('pendingReservations', JSON.stringify(filtered));
}

// pending 予約を削除（ID指定）
function removePendingReservation(id) {
  const pending = getPendingReservations();
  const filtered = pending.filter(item => item.id !== id);
  localStorage.setItem('pendingReservations', JSON.stringify(filtered));
}

// 指定日の pending 予約を取得
function getPendingReservationsForDate(dateStr) {
  const pending = getPendingReservations();
  return pending.filter(item => item.date === dateStr);
}

// ========================================
// 既存のコード
// ========================================

// 昨日の日付を計算して挿入
function insertYesterdayDate() {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const formattedDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const yesterdayElement = document.getElementById('yesterday-date');
  if (yesterdayElement) {
    yesterdayElement.textContent = formattedDate;
  }
}

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

  // JSONデータをフェッチ（キャッシュバスターを追加）
  fetch(`scripts/calendar-reservations.json?v=${generateCacheBuster()}`)
    .then(res => res.json())
    .then(data => {
      sampleReservations = data;
      renderCalendar(currentYear, currentMonth);
      showReservationDetailForDate(today);
    })
    .catch(err => console.error('Error fetching reservations:', err));

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
    const pendingRes = getPendingReservationsForDate(dateStr);
    
    let detail = `<strong>${dateStr}</strong><br>`;
    
    // 時刻を表示用に変換（00:00 - 23:59 → 終日）
    const formatTime = (time) => {
      return (time === '00:00 - 23:59') ? '終日' : time;
    };
    
    // 確定予約（Confirmed）
    if (res) {
      detail += '<div style="margin-top: 10px;"><strong>🟢 確定予約</strong></div>';
      if (Array.isArray(res)) {
        detail += res.map(item => `<div>${item}</div>`).join('');
      } else if (typeof res === 'object' && res !== null) {
        detail += Object.entries(res).map(
          ([time, val]) =>
            `<div style="display:flex;gap:0.5em;">
             <span style="min-width:3em;font-weight:bold;text-align:left;">${formatTime(time)}</span>
             <span style="flex:1;text-align:left;">${val}</span>
           </div>`
        ).join('');
      } else if (typeof res === 'string') {
        detail += `<div>${res}</div>`;
      }
    }
    
    // Pending 予約
    if (pendingRes.length > 0) {
      detail += '<div style="margin-top: 15px;"><strong>🟡 処理待ち予約</strong></div>';
      detail += '<div style="font-size: 0.85em; color: #888; margin-bottom: 5px;">(送信後30分以内に確定予約に反映されます)</div>';
      pendingRes.forEach(item => {
        detail += `<div style="display:flex;gap:0.5em;">
          <span style="min-width:3em;font-weight:bold;text-align:left;">${formatTime(item.timeSlot)}</span>
          <span style="flex:1;text-align:left;">${item.group}</span>
        </div>`;
      });
    }
    
    if (!res && pendingRes.length === 0) {
      detail += '<div>予約はありません。</div>';
    }
    
    document.getElementById('reserveDetail').innerHTML = detail;
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
    const pendingRes = getPendingReservationsForDate(dateStr);
    const isReserved = !!res;
    const hasPending = pendingRes.length > 0;
    
    // 他の月の日付にクラスを追加
    if (isOtherMonth) {
      td.classList.add('other-month');
    }

    if (!detailMode) {
      if (holidayName) {
        td.classList.add((isReserved || hasPending) ? 'holiday-reserved' : 'holiday');
        td.title = (isReserved || hasPending)
          ? `${holidayName}／予約あり`
          : holidayName;
        td.innerHTML = `${date.getDate()}<br>
        <span>${holidayName}</span>`;
        if (isReserved) {
          td.innerHTML += `<br><span class="icon">${getReservationIcon(res)}</span>`;
        }
        if (hasPending) {
          td.innerHTML += `<br><span class="icon">🟡</span>`;
        }
      } else if (isReserved || hasPending) {
        td.classList.add('reserved');
        td.title = "予約あり";
        let icons = '';
        if (isReserved) {
          icons += getReservationIcon(res);
        }
        if (hasPending) {
          icons += '🟡';
        }
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
      
      // Pending 予約を追加
      if (hasPending) {
        const pendingHtml = pendingRes.map(p => `${p.timeSlot}: ${p.group}🟡`).join('<br>');
        reservationHtml = reservationHtml ? `${reservationHtml}<br>${pendingHtml}` : pendingHtml;
      }

      if (holidayName) {
        td.classList.add((isReserved || hasPending) ? 'holiday-reserved' : 'holiday');
        td.title = (isReserved || hasPending)
          ? `${holidayName}／${reservationHtml.replace(/<[^>]+>/g, '')}`
          : holidayName;
        td.innerHTML = `${date.getDate()}<br>
        <span>${holidayName}</span>`;
        if (isReserved || hasPending) {
          td.innerHTML += `<br><span class="reservation">${reservationHtml}</span>`;
        }
      } else if (isReserved || hasPending) {
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
      
      // 予約フォームを表示して日付をセット
      const reservationForm = document.getElementById('reservationForm');
      const reserveDateInput = document.getElementById('reserveDate');
      if (reservationForm && reserveDateInput) {
        reservationForm.style.display = 'block';
        const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        reserveDateInput.value = dateStr;
        
        // フォームにスムーズにスクロール
        reservationForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    return td;
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
}

document.addEventListener('DOMContentLoaded', () => {
  insertYesterdayDate();
  applyCacheBuster();
  initializeCalendar();
  
  // Pending 予約のクリーンアップ（30分経過したものを削除）
  cleanupExpiredReservations();
  
  // フォームを閉じるボタン
  const closeFormBtn = document.getElementById('closeFormBtn');
  const reservationForm = document.getElementById('reservationForm');
  if (closeFormBtn && reservationForm) {
    closeFormBtn.addEventListener('click', () => {
      reservationForm.style.display = 'none';
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
  
  // 予約フォームの送信処理
  const form = document.getElementById('newReservationForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const date = document.getElementById('reserveDate').value;
      const timeStart = document.getElementById('reserveTimeStart').value;
      const timeEnd = document.getElementById('reserveTimeEnd').value;
      const group = document.getElementById('reserveGroup').value;
      const isAllDay = allDayCheck && allDayCheck.checked;
      
      const timeSlot = `${timeStart} - ${timeEnd}`;
      const displayTime = isAllDay ? '終日' : timeSlot;
      
      // localStorage に保存
      savePendingReservation(date, timeSlot, group);
      
      // カレンダーを再描画
      const dateObj = new Date(date + 'T00:00:00');
      renderCalendar(dateObj.getFullYear(), dateObj.getMonth());
      showReservationDetailForDate(dateObj);
      
      // Gmail 作成画面を開く
      const subject = encodeURIComponent(`集会所予約 ${date}`);
      const body = encodeURIComponent(
        `集会所の予約をお願いします。\n\n` +
        `【予約日】${date}\n` +
        `【時間】${displayTime}\n` +
        `【イベント名】${group}\n\n` +
        `よろしくお願いいたします。`
      );
      const mailto = `mailto:freesemt@gmail.com?subject=${subject}&body=${body}`;
      window.open(mailto, '_blank');
      
      // フォームをリセット
      form.reset();
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
      
      // 成功メッセージ
      alert('予約を送信しました。\n約30分以内（最長30分）にカレンダーに反映されます。');
    });
  }
});