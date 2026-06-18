from PIL import Image
import numpy as np

# ========== 1. 颜色贴图 ==========
color = Image.open('lroc_color_poles_4k.tif')
color = color.convert('RGB')
# 如果文件太大，可以压到 2K：color = color.resize((2048, 1024))
color.save('moon_color.jpg', 'JPEG', quality=85, optimize=True)
print("✅ moon_color.jpg 已生成")

# ========== 2. 高度贴图（16-bit 归一化修复） ==========
height = Image.open('ldem_16.tif')

# 转成 numpy 数组，保持原始精度
height_arr = np.array(height)

print(f"高度图数据范围: {height_arr.min()} ~ {height_arr.max()}")
print(f"数据类型: {height_arr.dtype}")

# 归一化到 0-255
height_norm = (height_arr - height_arr.min()) / (height_arr.max() - height_arr.min())
height_8bit = (height_norm * 255).astype(np.uint8)

# 转回 PIL Image
height_img = Image.fromarray(height_8bit, mode='L')

# 压到 2K（网页加载快）
height_img = height_img.resize((2048, 1024), Image.Resampling.LANCZOS)
height_img.save('moon_height.png', 'PNG', optimize=True)

print("✅ moon_height.png 已生成 (2K, 已修复黑图问题)")