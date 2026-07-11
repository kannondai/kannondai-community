"""
集会所にピアノを配置した3Dシーンを作成
"""
import pyvista as pv
import numpy as np

# プロッターの作成（オフスクリーンレンダリング）
plotter = pv.Plotter(off_screen=True, window_size=[1920, 1080])

# 床（集会所の部屋）- 90度回転後: 8m × 10m
floor = pv.Plane(center=(4, 5, 0), i_size=8, j_size=10)
plotter.add_mesh(floor, color='#E8E8E8', name='floor')

# 壁（4面）
wall_back = pv.Plane(center=(8, 5, 1.5), i_size=10, j_size=3, direction=(1, 0, 0))
wall_front = pv.Plane(center=(0, 5, 1.5), i_size=10, j_size=3, direction=(-1, 0, 0))
wall_left = pv.Plane(center=(4, 0, 1.5), i_size=8, j_size=3, direction=(0, 1, 0))
wall_right = pv.Plane(center=(4, 10, 1.5), i_size=8, j_size=3, direction=(0, -1, 0))

plotter.add_mesh(wall_back, color='#F5F5DC', opacity=0.8)
plotter.add_mesh(wall_front, color='#F5F5DC', opacity=0.3)
plotter.add_mesh(wall_left, color='#F5F5DC', opacity=0.8)
plotter.add_mesh(wall_right, color='#F5F5DC', opacity=0.8)

# 電子ピアノ（3D図形）- テーブルA と B の間の通路の反対側（カメラから遠い側）に配置
# 寸法: 幅1.4m × 奥行0.35m × 高さ0.75m（本体天板まで）
piano_x_center = 4.0
piano_y_center = 0.5
piano_width = 1.4
piano_depth = 0.35
piano_height = 0.75
piano_body_thickness = 0.12

# スタンド（4本脚）
leg_radius = 0.025
leg_positions = [
    (piano_x_center - piano_width/2 + 0.15, piano_y_center - piano_depth/2 + 0.08),
    (piano_x_center + piano_width/2 - 0.15, piano_y_center - piano_depth/2 + 0.08),
    (piano_x_center - piano_width/2 + 0.15, piano_y_center + piano_depth/2 - 0.08),
    (piano_x_center + piano_width/2 - 0.15, piano_y_center + piano_depth/2 - 0.08),
]
for leg_x, leg_y in leg_positions:
    leg = pv.Cylinder(center=(leg_x, leg_y, piano_height/2), 
                     direction=(0, 0, 1), radius=leg_radius, height=piano_height)
    plotter.add_mesh(leg, color='#2a2a2a')

# 本体（黒い筐体）
piano_body = pv.Box(bounds=(
    piano_x_center - piano_width/2, piano_x_center + piano_width/2,
    piano_y_center - piano_depth/2, piano_y_center + piano_depth/2,
    piano_height, piano_height + piano_body_thickness
))
plotter.add_mesh(piano_body, color='#1a1a1a')

# コントロールパネル部分（本体の奥側、少し盛り上がっている）
panel_height = 0.05
panel = pv.Box(bounds=(
    piano_x_center - piano_width/2 + 0.1, piano_x_center + piano_width/2 - 0.1,
    piano_y_center - piano_depth/2, piano_y_center - piano_depth/2 + 0.08,
    piano_height + piano_body_thickness, piano_height + piano_body_thickness + panel_height
))
plotter.add_mesh(panel, color='#0a0a0a')

# 鍵盤部分（白鍵）- 手前側に配置
keyboard_white = pv.Box(bounds=(
    piano_x_center - piano_width/2 + 0.15, piano_x_center + piano_width/2 - 0.15,
    piano_y_center + piano_depth/2 - 0.15, piano_y_center + piano_depth/2 - 0.02,
    piano_height + piano_body_thickness, piano_height + piano_body_thickness + 0.02
))
plotter.add_mesh(keyboard_white, color='#F8F8F8')

# 黒鍵（簡略化して12本、2本ずつのペアで配置）
# 2本ペアを6組配置
black_key_pairs = [
    (-0.55, -0.50),  # ペア1
    (-0.35, -0.30),  # ペア2
    (-0.15, -0.10),  # ペア3
    (0.05, 0.10),    # ペア4
    (0.25, 0.30),    # ペア5
    (0.45, 0.50),    # ペア6
]
for offset1, offset2 in black_key_pairs:
    for offset in [offset1, offset2]:
        black_key = pv.Box(bounds=(
            piano_x_center + offset - 0.015, piano_x_center + offset + 0.015,
            piano_y_center + piano_depth/2 - 0.12, piano_y_center + piano_depth/2 - 0.03,
            piano_height + piano_body_thickness + 0.02, piano_height + piano_body_thickness + 0.04
        ))
        plotter.add_mesh(black_key, color='#0a0a0a')

# ペダル部分（3本のペダルを個別に表現）- ピアノ本体の真下に配置
pedal_base_y = piano_y_center + 0.05  # ピアノ本体の直下
pedal_positions = [
    piano_x_center - 0.2,  # 左ペダル
    piano_x_center,         # 中央ペダル
    piano_x_center + 0.2,   # 右ペダル
]
for pedal_x in pedal_positions:
    # ペダル本体（少し傾斜をつけた形で）
    pedal = pv.Box(bounds=(
        pedal_x - 0.055, pedal_x + 0.055,
        pedal_base_y, pedal_base_y + 0.12,
        0.0, 0.05
    ))
    plotter.add_mesh(pedal, color='#4a4a4a')  # 少し明るいグレー
    
    # ペダル上面（踏む部分）
    pedal_top = pv.Box(bounds=(
        pedal_x - 0.05, pedal_x + 0.05,
        pedal_base_y + 0.08, pedal_base_y + 0.11,
        0.04, 0.05
    ))
    plotter.add_mesh(pedal_top, color='#5a5a5a')

# ピアノスツール（演奏用の椅子）
stool_x = piano_x_center
stool_y = piano_y_center + piano_depth/2 + 0.4  # ペダルの少し手前
stool_height = 0.48
stool_seat_size = 0.35

# 座面（円形に近い形で、少し丸みを持たせる）
stool_seat = pv.Cylinder(center=(stool_x, stool_y, stool_height), 
                        direction=(0, 0, 1), radius=stool_seat_size/2, height=0.05)
plotter.add_mesh(stool_seat, color='#1a1a1a')

# スツールの脚（4本、細め）
stool_leg_positions = [
    (stool_x - 0.12, stool_y - 0.12),
    (stool_x + 0.12, stool_y - 0.12),
    (stool_x - 0.12, stool_y + 0.12),
    (stool_x + 0.12, stool_y + 0.12),
]
for leg_x, leg_y in stool_leg_positions:
    leg = pv.Cylinder(center=(leg_x, leg_y, stool_height/2), 
                     direction=(0, 0, 1), radius=0.02, height=stool_height)
    plotter.add_mesh(leg, color='#2a2a2a')

# 脚の間の補強バー（オプション、X字型）
crossbar_height = 0.15
crossbar = pv.Cylinder(center=(stool_x, stool_y, crossbar_height), 
                      direction=(0, 0, 1), radius=0.08, height=0.03)
plotter.add_mesh(crossbar, color='#2a2a2a')

# 譜面台（オプション、細い板）
music_stand = pv.Box(bounds=(
    piano_x_center - 0.4, piano_x_center + 0.4,
    piano_y_center - piano_depth/2 + 0.05, piano_y_center - piano_depth/2 + 0.07,
    piano_height + piano_body_thickness + 0.05, piano_height + piano_body_thickness + 0.35
))
plotter.add_mesh(music_stand, color='#1a1a1a', opacity=0.8)

# 会議テーブル（180cm × 50cm × 70cm）を8台、2台ずつ短辺で組み合わせて4セット
# 1セット = 180cm × 100cm × 70cm
# スケール: 1単位 = 約100cm、1セットは 1.8 × 1.0 × 0.7
# 90度回転後: 100cm × 180cm配置

# セット1 (C): 左手前、ピアノから遠い
table1a = pv.Box(bounds=(5.0, 5.5, 6.1, 7.9, 0.7, 0.75))
table1b = pv.Box(bounds=(5.5, 6.0, 6.1, 7.9, 0.7, 0.75))
plotter.add_mesh(table1a, color='#D2B48C')
plotter.add_mesh(table1b, color='#D2B48C')

# セット2 (A): 左奥、ピアノに近い → 手前に移動（x位置は保持）
table2a = pv.Box(bounds=(5.0, 5.5, 3.1, 4.9, 0.7, 0.75))
table2b = pv.Box(bounds=(5.5, 6.0, 3.1, 4.9, 0.7, 0.75))
plotter.add_mesh(table2a, color='#D2B48C')
plotter.add_mesh(table2b, color='#D2B48C')

# セット3 (D): 右手前、ピアノから遠い
table3a = pv.Box(bounds=(2.0, 2.5, 6.1, 7.9, 0.7, 0.75))
table3b = pv.Box(bounds=(2.5, 3.0, 6.1, 7.9, 0.7, 0.75))
plotter.add_mesh(table3a, color='#D2B48C')
plotter.add_mesh(table3b, color='#D2B48C')

# セット4 (B): 右奥、ピアノに近い → 手前に移動（x位置は保持）
table4a = pv.Box(bounds=(2.0, 2.5, 3.1, 4.9, 0.7, 0.75))
table4b = pv.Box(bounds=(2.5, 3.0, 3.1, 4.9, 0.7, 0.75))
plotter.add_mesh(table4a, color='#D2B48C')
plotter.add_mesh(table4b, color='#D2B48C')

# テーブルの脚（各テーブルに4本）- 90度回転
all_tables = [
    (5.0, 5.5, 6.1, 7.9), (5.5, 6.0, 6.1, 7.9),  # セット1 (C)
    (5.0, 5.5, 3.1, 4.9), (5.5, 6.0, 3.1, 4.9),  # セット2 (A) - 手前に移動
    (2.0, 2.5, 6.1, 7.9), (2.5, 3.0, 6.1, 7.9),  # セット3 (D)
    (2.0, 2.5, 3.1, 4.9), (2.5, 3.0, 3.1, 4.9),  # セット4 (B) - 手前に移動
]

for x1, x2, y1, y2 in all_tables:
    x_center = (x1 + x2) / 2
    y_center = (y1 + y2) / 2
    x_offset = (x2 - x1) / 2 - 0.15
    y_offset = (y2 - y1) / 2 - 0.05
    for dx, dy in [(-x_offset, -y_offset), (x_offset, -y_offset), 
                   (-x_offset, y_offset), (x_offset, y_offset)]:
        leg = pv.Cylinder(center=(x_center+dx, y_center+dy, 0.35), 
                         direction=(0, 0, 1), radius=0.03, height=0.7)
        plotter.add_mesh(leg, color='#8B4513')

# 積み重ね可能な椅子を16個、各テーブルの長辺側に2つずつ対面配置
# 90度回転後: 各セット（100×180）の長辺（180cm）側に配置
# (x, y, direction): direction は背もたれの位置 ('east'=背もたれが+x側, 'west'=背もたれが-x側)
chair_data = [
    # セット1 (C)（5.0-6.0, 6.1-7.9）
    (4.8, 6.6, 'west'), (4.8, 7.4, 'west'),   # 左側、テーブル（+x方向）に向く
    (6.2, 6.6, 'east'), (6.2, 7.4, 'east'),   # 右側、テーブル（-x方向）に向く
    # セット2 (A)（5.0-6.0, 3.1-4.9）- 手前に移動
    (4.8, 3.6, 'west'), (4.8, 4.4, 'west'),   # 左側、テーブル（+x方向）に向く
    (6.2, 3.6, 'east'), (6.2, 4.4, 'east'),   # 右側、テーブル（-x方向）に向く
    # セット3 (D)（2.0-3.0, 6.1-7.9）
    (1.8, 6.6, 'west'), (1.8, 7.4, 'west'),   # 左側、テーブル（+x方向）に向く
    (3.2, 6.6, 'east'), (3.2, 7.4, 'east'),   # 右側、テーブル（-x方向）に向く
    # セット4 (B)（2.0-3.0, 3.1-4.9）- 手前に移動
    (1.8, 3.6, 'west'), (1.8, 4.4, 'west'),   # 左側、テーブル（+x方向）に向く
    (3.2, 3.6, 'east'), (3.2, 4.4, 'east'),   # 右側、テーブル（-x方向）に向く
]

for x, y, direction in chair_data:
    # 座面（薄く）
    seat = pv.Box(bounds=(x-0.2, x+0.2, y-0.2, y+0.2, 0.42, 0.46))
    plotter.add_mesh(seat, color='#FFFDD0', opacity=0.9)
    
    # 背もたれ（向きを制御）- 90度回転後はeast/west方向
    if direction == 'east':  # テーブルが東側（+x方向）
        back = pv.Box(bounds=(x+0.18, x+0.22, y-0.2, y+0.2, 0.46, 0.75))
    else:  # direction == 'west', テーブルが西側（-x方向）
        back = pv.Box(bounds=(x-0.22, x-0.18, y-0.2, y+0.2, 0.46, 0.75))
    plotter.add_mesh(back, color='#FFFDD0', opacity=0.9)
    
    # 脚（4本、細め）
    for dx, dy in [(-0.15, -0.15), (0.15, -0.15), (-0.15, 0.15), (0.15, 0.15)]:
        leg = pv.Cylinder(center=(x+dx, y+dy, 0.21), direction=(0, 0, 1), 
                         radius=0.015, height=0.42)
        plotter.add_mesh(leg, color='#2C2C2C')

# ラベル（オプション）
plotter.add_text("電子ピアノ", position=(50, 850), font_size=20, color='#2980b9', font='arial')
plotter.add_text("集会所のイメージ", position=(50, 50), font_size=16, color='#555555', font='arial')

# カメラ位置の設定（斜め上から見下ろす）- 90度回転後
plotter.camera_position = [(-2, 12, 4), (4, 5, 0.5), (0, 0, 1)]

# ライティングの設定
plotter.enable_lightkit()

# 画像として保存
output_path = 'piano_scene.png'
plotter.screenshot(output_path, transparent_background=False)
print(f"画像を保存しました: {output_path}")

plotter.close()
