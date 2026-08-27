import os
import requests
from bs4 import BeautifulSoup
import argparse
import re
import json
from datetime import datetime, timedelta

LOGIN_URL = "https://www.c-sqr.net/login"
SCHEDULE_URL = "https://www.c-sqr.net/events?date=today"
GAS_API_URL = "https://script.google.com/macros/s/AKfycby5deijDza0ky3NHDmH555-0IiPEliRyRMCYLQmzmWtpf_uWOaWYiSL09oKMFNi-aRd/exec"

def fetch_ics_file(filename="docs/scripts/events.ics", debug=False):
    """iCalファイルを取得して保存する"""
    account = os.environ.get("CSQR_ACCOUNT")
    password = os.environ.get("CSQR_PASSWORD")
    if not account or not password:
        raise ValueError("環境変数 CSQR_ACCOUNT または CSQR_PASSWORD が設定されていません。")

    with requests.Session() as session:
        # 1. ログインページを取得してCSRFトークンを取得
        resp = session.get(LOGIN_URL)
        soup = BeautifulSoup(resp.text, "html.parser")
        token = soup.find("input", {"name": "_token"}).get("value")

        # 2. ログインフォーム送信
        payload = {
            "account": account,
            "password": password,
            "_token": token,
            "remember": "on"
        }
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": LOGIN_URL
        }
        login_resp = session.post(LOGIN_URL, data=payload, headers=headers)

        # 3. ログイン成功判定
        soup = BeautifulSoup(login_resp.text, "html.parser")
        title = soup.title.string if soup.title else ""
        if "ログイン" in title:
            print("ログイン失敗")
            if debug:
                with open("login_failed.html", "w", encoding="utf-8") as f:
                    f.write(login_resp.text)
                print("レスポンス内容を login_failed.html に保存しました。")
            import sys
            sys.exit(1)
        else:
            print("ログイン成功")

            # スケジュールページへアクセス
            resp = session.get(SCHEDULE_URL)
            soup = BeautifulSoup(resp.text, "html.parser")

            # デバッグ用: スケジュールページのHTMLを保存
            if debug:
                with open("schedule_page.html", "w", encoding="utf-8") as f:
                    f.write(resp.text)
                print("スケジュールページのHTMLを schedule_page.html に保存しました。")

            # 「iCal出力」ページへ遷移
            ical_page_link = soup.find("a", href=lambda x: x and "/events/ics" in x)
            if not ical_page_link:
                print("iCal出力ページへのリンクが見つかりませんでした。")
                return False
            ical_page_url = ical_page_link["href"]
            if not ical_page_url.startswith("http"):
                ical_page_url = "https://www.c-sqr.net" + ical_page_url
            print("iCal出力ページURL:", ical_page_url)

            # iCal出力ページにアクセス
            ical_page_resp = session.get(ical_page_url)
            ical_page_resp.raise_for_status()
            if debug:
                with open("ical_page.html", "w", encoding="utf-8") as f:
                    f.write(ical_page_resp.text)
                print("iCal出力ページのHTMLを ical_page.html に保存しました。")

            ical_page_soup = BeautifulSoup(ical_page_resp.text, "html.parser")
            ics_input = ical_page_soup.find("input", {"id": "ics_url"})
            if not ics_input:
                print("icsファイルのURLが見つかりませんでした。")
                return False
            ics_url = ics_input.get("value")
            print("icsファイルURL:", ics_url)

            # icsファイルをダウンロード
            ical_resp = session.get(ics_url)
            ical_resp.raise_for_status()
            if not ical_resp.content.startswith(b"BEGIN:VCALENDAR"):
                print("警告: 取得したファイルはics形式ではありません。内容を確認してください。")
                if debug:
                    with open("invalid_ics_response.html", "wb") as f:
                        f.write(ical_resp.content)
                return False
            with open(filename, "wb") as f:
                f.write(ical_resp.content)
            print(f"iCalファイルを {filename} として保存しました。")
            return True

def ics_to_custom_json(ics_path="docs/scripts/events.ics", json_path="docs/scripts/calendar-reservations.json", keep_days=730):
    """iCalファイルをJSON形式に変換し、既存データとマージして保存する
    
    Args:
        ics_path: iCalファイルのパス
        json_path: 出力JSONファイルのパス
        keep_days: 過去何日分のデータを保持するか（デフォルト: 730日=約2年）
    """
    # 既存のJSONデータを読み込む（存在しない場合は空の辞書）
    existing_data = {}
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            print(f"既存データを読み込みました: {len(existing_data)} 日分")
        except (json.JSONDecodeError, IOError) as e:
            print(f"既存データの読み込みに失敗しました: {e}")
            existing_data = {}
    
    # 新規データを格納する辞書
    events_by_date = {}

    def parse_dt(dtstr):
        # 例: 20250126T093000 → "2025-01-26", "09:30"
        m = re.match(r"(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?", dtstr)
        if m:
            y, mo, d, h, mi = m.groups()
            date = f"{y}-{mo}-{d}"
            time = f"{h}:{mi}" if h and mi else None
            return date, time
        return None, None

    with open(ics_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    event = {}
    for line in lines:
        line = line.strip()
        if line == "BEGIN:VEVENT":
            event = {}
        elif line == "END:VEVENT":
            # 必要な情報だけ抽出
            summary = event.get("SUMMARY", "")
            description = event.get("DESCRIPTION", "").replace("\\n", "\n")  # 改行コードを変換
            dtstart = event.get("DTSTART;TZID=Japan") or event.get("DTSTART;VALUE=DATE") or event.get("DTSTART")
            dtend = event.get("DTEND;TZID=Japan") or event.get("DTEND;VALUE=DATE") or event.get("DTEND")
            if dtstart and dtend and summary:
                date, start = parse_dt(dtstart)
                _, end = parse_dt(dtend)
                if date:
                    # 時間範囲がない場合（終日イベント）
                    time_range = f"{start} - {end}" if start and end else "終日"
                    if date not in events_by_date:
                        events_by_date[date] = {}
                    # SUMMARY と DESCRIPTION を結合して保存
                    full_description = summary
                    if description:
                        full_description += f"; \n{description}"
                    events_by_date[date][time_range] = full_description
        else:
            if ":" in line:
                key, value = line.split(":", 1)
                event[key] = value

    # 既存データとマージ（削除を正しく反映するための信頼期間ベース）
    print(f"新規データ: {len(events_by_date)} 日分")
    
    if events_by_date:
        # 新規データの日付範囲を特定
        new_dates = sorted(events_by_date.keys())
        trust_boundary = new_dates[0]  # 新規データの最古の日付
        print(f"信頼境界日付: {trust_boundary}（この日付以降は新規データを完全に信頼）")
        
        # 信頼境界より前の既存データのみ保持
        old_data = {
            date: events 
            for date, events in existing_data.items() 
            if date < trust_boundary
        }
        print(f"保持する古いデータ: {len(old_data)} 日分")
        
        # 新規データで置き換え（削除も反映される）
        merged_data = old_data.copy()
        merged_data.update(events_by_date)
    else:
        # 新規データがない場合は既存データをそのまま使用
        merged_data = existing_data.copy()
    
    # 古いデータを削除（keep_days より古い日付）
    cutoff_date = datetime.now() - timedelta(days=keep_days)
    cutoff_str = cutoff_date.strftime("%Y-%m-%d")
    
    filtered_data = {
        date: events 
        for date, events in merged_data.items() 
        if date >= cutoff_str
    }
    
    removed_count = len(merged_data) - len(filtered_data)
    if removed_count > 0:
        print(f"{cutoff_str} より古いデータを {removed_count} 日分削除しました")
    
    # ソートして保存（日付順）
    sorted_data = dict(sorted(filtered_data.items()))
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)
    print(f"カレンダー用予約データを {json_path} に保存しました（合計: {len(sorted_data)} 日分）")

def upload_to_gas(json_path="docs/scripts/calendar-reservations.json", gas_url=GAS_API_URL):
    """JSONデータをGAS APIに同期アップロードする。トークンは環境変数 HALL_RESERVE_TOKEN から取得。
    
    データ管理方式（2026-08-12時点）:
    - サークルスクエア（C-SQR）→ JSON → GAS Sheets（一方向同期）
    - ユーザーがGAS経由で作成・削除した予約は、GAS Sheetsにのみ存在
    - カレンダー初期表示は静的JSON、予約CRUD後はGAS APIから最新データ取得
    - この関数はGitHub Actions（毎日9:00 JST）から自動実行される
    """
    token = os.environ.get("HALL_RESERVE_TOKEN")
    if not token:
        raise ValueError("環境変数 HALL_RESERVE_TOKEN が設定されていません。")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    payload = {"action": "sync", "token": token, "data": data}
    print(f"GAS API に同期中... ({len(data)} 日分)")
    resp = requests.post(gas_url, json=payload)
    resp.raise_for_status()
    result = resp.json()

    if result.get("success"):
        print(f"GAS同期成功: {result.get('message')} (信頼境界: {result.get('trustBoundary')})")
    else:
        print(f"GAS同期失敗: {result.get('error')}")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="iCal取得・変換・GAS同期スクリプト")
    parser.add_argument("--fetch", action="store_true", help="iCalファイルを取得する")
    parser.add_argument("--convert", action="store_true", help="icsファイルをJSONに変換する")
    parser.add_argument("--upload", action="store_true", help="JSONデータをGAS APIに同期する")
    parser.add_argument("--debug", action="store_true", help="ログイン・スケジュールページのHTML等をデバッグ用に保存する")
    args = parser.parse_args()

    if args.fetch:
        fetch_ics_file(debug=args.debug)
    if args.convert:
        ics_to_custom_json()
    if args.upload:
        upload_to_gas()
    if not args.fetch and not args.convert and not args.upload:
        # デフォルトは取得・変換・GAS同期を全て実行
        if fetch_ics_file(debug=args.debug):
            ics_to_custom_json()
            upload_to_gas()