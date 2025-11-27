"""
配置文件
"""
from pathlib import Path

# 基础路径
BASE_DIR = Path(__file__).resolve().parent

# 数据与缓存路径
DATA_FILE = BASE_DIR / 'archive' / 'events_with_category.csv'
CACHE_DIR = BASE_DIR / 'cache'
DATA_CACHE_FILE = CACHE_DIR / 'events_with_category.parquet'
USER_SEGMENTS_CACHE = CACHE_DIR / 'user_segments.pkl'

# 图表配置
TOP_N = 10  # Top N 商品/类别数量

# 字体 & 主题
FONT_FAMILY = "Urbanist, 'PingFang SC', 'Microsoft YaHei', sans-serif"

APP_THEME = {
    'app_bg': '#F5F7FB',
    'card_bg': '#FFFFFF',
    'border': '#E2E8F0',
    'text': '#1F2A44',
    'text_muted': '#7F8C8D',
    'shadow': '0 15px 30px rgba(15, 23, 42, 0.08)'
}

# 用户分类阈值配置
USER_CLASSIFICATION = {
    'Hesitant': {
        'description': '犹豫型用户：浏览多但购买少',
        'view_threshold': 10,  # 至少浏览10次
        'purchase_ratio_max': 0.05  # 购买率低于5%
    },
    'Impulsive': {
        'description': '冲动型用户：浏览后快速购买',
        'view_threshold': 3,  # 至少浏览3次
        'purchase_ratio_min': 0.3,  # 购买率高于30%
        'time_to_purchase_max_hours': 24  # 24小时内购买
    },
    'Collector': {
        'description': '收藏型用户：加购多但购买转化慢',
        'addtocart_threshold': 5,  # 至少加购5次
        'purchase_ratio_min': 0.1  # 购买率高于10%
    }
}

# 颜色配置（参考 draw_pretty_picture.ipynb 配色）
COLORS = {
    'primary': '#42A5F5',
    'primary_dark': '#0D47A1',
    'secondary': '#4ECDC4',
    'accent': '#FF6B6B',
    'accent_warm': '#FFB347',
    'deep_navy': '#1F2A44',
    'muted_text': '#7F8C8D',
    'success': '#1A936F',
    'info': '#6EC6FF',
    'warning': '#FF9800',
    'card_bg': '#FFFFFF',
    'app_bg': '#F5F7FB',
    'border': '#E2E8F0',
    'view': '#2196F3',
    'addtocart': '#FF9800',
    'transaction': '#1A936F'
}

COLOR_PALETTES = {
    'ocean': ['#6EC6FF', '#42A5F5', '#2196F3', '#1976D2', '#0D47A1'],
    'sunset': ['#FFD166', '#FF6B6B', '#E94E77'],
    'citrus': ['#FF9800', '#E91E63', '#9C27B0'],
    'mint': ['#4ECDC4', '#1A936F', '#0E918C']
}

