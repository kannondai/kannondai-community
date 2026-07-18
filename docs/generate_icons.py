"""
PWA用のシンプルなアイコンを生成するスクリプト
観音台コミュニティ情報サイト用
"""
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    """指定サイズのアイコンを生成"""
    # 背景色（テーマカラー）
    bg_color = (44, 62, 80)  # #2c3e50
    
    # 画像を作成
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # 家のアイコンを描画
    margin = size // 6
    
    # 屋根（三角形）
    roof_top = (size // 2, margin)
    roof_left = (margin, size // 2)
    roof_right = (size - margin, size // 2)
    draw.polygon([roof_top, roof_left, roof_right], fill=(236, 240, 241))
    
    # 家の本体（四角形）
    house_left = margin + size // 8
    house_top = size // 2 - size // 16
    house_right = size - margin - size // 8
    house_bottom = size - margin
    draw.rectangle([house_left, house_top, house_right, house_bottom], 
                   fill=(236, 240, 241))
    
    # ドア
    door_width = size // 6
    door_height = size // 4
    door_left = (size - door_width) // 2
    door_top = size - margin - door_height
    draw.rectangle([door_left, door_top, door_left + door_width, size - margin],
                   fill=(189, 195, 199))
    
    # 保存
    img.save(filename, 'PNG')
    print(f"✓ {filename} を生成しました")

if __name__ == '__main__':
    import os
    
    # iconsディレクトリに移動
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')
    
    # 192x192のアイコンを生成
    create_icon(192, os.path.join(icons_dir, 'icon-192.png'))
    
    # 512x512のアイコンを生成
    create_icon(512, os.path.join(icons_dir, 'icon-512.png'))
    
    print("\nアイコン生成完了！")
    print("必要に応じて、icons/icon-*.png を正式なデザインに置き換えてください。")
