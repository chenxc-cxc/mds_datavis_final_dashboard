"""
数据处理模块
负责数据加载、用户分类、数据预处理等
"""
import json
import hashlib
import os
import pickle
from pathlib import Path

import pandas as pd
import numpy as np
from config import (
    DATA_FILE,
    USER_CLASSIFICATION,
    CACHE_DIR,
    DATA_CACHE_FILE,
    USER_SEGMENTS_CACHE,
)


class DataProcessor:
    """数据处理器"""
    
    def __init__(self, data_file=None):
        """
        初始化数据处理器
        
        Args:
            data_file: 数据文件路径，如果为None则使用配置文件中的路径
        """
        self.data_file = Path(data_file or DATA_FILE)
        self.cache_dir = Path(CACHE_DIR)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.data_cache_file = Path(DATA_CACHE_FILE)
        self.segment_cache_file = Path(USER_SEGMENTS_CACHE)
        self.df = None
        self.user_segments = {}
        self.data_mtime = None
        self.config_signature = self._generate_config_signature()
    
    def _generate_config_signature(self):
        """生成用户分类配置的哈希值"""
        serialized = json.dumps(USER_CLASSIFICATION, sort_keys=True).encode('utf-8')
        return hashlib.md5(serialized).hexdigest()
    
    def load_data(self, force_reload=False):
        """加载数据（支持缓存）"""
        if self.df is not None and not force_reload:
            return self.df
        
        self.data_mtime = self.data_file.stat().st_mtime
        use_cache = False
        
        if self.data_cache_file.exists() and not force_reload:
            cache_mtime = self.data_cache_file.stat().st_mtime
            if cache_mtime >= self.data_mtime:
                print(f"从缓存加载数据: {self.data_cache_file}")
                self.df = pd.read_parquet(self.data_cache_file)
                use_cache = True
        
        if not use_cache:
            print(f"正在加载数据: {self.data_file}")
            self.df = pd.read_csv(self.data_file, parse_dates=['timestamp'])
            print("数据转换为 Parquet，以加速后续启动")
            self.df.to_parquet(self.data_cache_file, index=False)
        else:
            if self.df['timestamp'].dtype == 'object':
                self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        
        print(f"数据加载完成，共 {len(self.df):,} 条记录")
        return self.df
    
    def _load_user_segments_cache(self):
        """尝试从缓存读取用户分群结果"""
        if not self.segment_cache_file.exists():
            return None
        
        try:
            with open(self.segment_cache_file, 'rb') as f:
                payload = pickle.load(f)
            
            meta = payload.get('meta', {})
            if (meta.get('data_mtime') == self.data_mtime and
                    meta.get('config_signature') == self.config_signature):
                print("用户分类命中缓存")
                return payload.get('segments')
        except Exception as exc:
            print(f"读取用户分类缓存失败: {exc}")
        
        return None
    
    def _persist_user_segments_cache(self):
        """持久化用户分群结果"""
        payload = {
            'segments': self.user_segments,
            'meta': {
                'data_mtime': self.data_mtime,
                'config_signature': self.config_signature
            }
        }
        with open(self.segment_cache_file, 'wb') as f:
            pickle.dump(payload, f)
    
    def classify_users(self, force_reload=False):
        """
        对用户进行分类
        返回: dict，包含不同用户群体的visitorid列表
        """
        if self.df is None:
            self.load_data()
        
        if self.user_segments and not force_reload:
            return self.user_segments
        
        if not force_reload:
            cached = self._load_user_segments_cache()
            if cached:
                self.user_segments = cached
                return self.user_segments
        
        print("正在对用户进行分类...")
        
        # 计算每个用户的行为统计
        user_stats = self.df.groupby('visitorid').agg({
            'event': lambda x: {
                'view': (x == 'view').sum(),
                'addtocart': (x == 'addtocart').sum(),
                'transaction': (x == 'transaction').sum()
            },
            'timestamp': ['min', 'max']
        }).reset_index()
        
        user_stats.columns = ['visitorid', 'events', 'first_visit', 'last_visit']
        
        # 展开事件统计
        user_stats['view_count'] = user_stats['events'].apply(lambda x: x['view'])
        user_stats['addtocart_count'] = user_stats['events'].apply(lambda x: x['addtocart'])
        user_stats['transaction_count'] = user_stats['events'].apply(lambda x: x['transaction'])
        user_stats['total_actions'] = user_stats['view_count'] + user_stats['addtocart_count'] + user_stats['transaction_count']
        
        # 计算购买率
        user_stats['purchase_ratio'] = user_stats['transaction_count'] / (user_stats['view_count'] + 1)
        
        # 计算首次购买时间（如果有购买行为）
        user_transactions = self.df[self.df['event'] == 'transaction'].groupby('visitorid')['timestamp'].min().reset_index()
        user_transactions.columns = ['visitorid', 'first_purchase']
        
        user_stats = user_stats.merge(user_transactions, on='visitorid', how='left')
        user_stats['time_to_purchase_hours'] = (
            (user_stats['first_purchase'] - user_stats['first_visit']).dt.total_seconds() / 3600
        ).fillna(9999)  # 没有购买的用户设为很大的值
        
        # 分类用户（允许用户同时属于多个类别）
        hesitant_users = []
        impulsive_users = []
        collector_users = []
        
        config = USER_CLASSIFICATION
        
        for _, row in user_stats.iterrows():
            visitorid = row['visitorid']
            view_count = row['view_count']
            addtocart_count = row['addtocart_count']
            transaction_count = row['transaction_count']
            purchase_ratio = row['purchase_ratio']
            time_to_purchase = row['time_to_purchase_hours']
            
            # Hesitant: 浏览多但购买少
            if (view_count >= config['Hesitant']['view_threshold'] and 
                purchase_ratio <= config['Hesitant']['purchase_ratio_max']):
                hesitant_users.append(visitorid)
            
            # Impulsive: 浏览后快速购买（需要至少有一次购买）
            if (transaction_count > 0 and
                view_count >= config['Impulsive']['view_threshold'] and 
                purchase_ratio >= config['Impulsive']['purchase_ratio_min'] and
                time_to_purchase <= config['Impulsive']['time_to_purchase_max_hours']):
                impulsive_users.append(visitorid)
            
            # Collector: 加购多但购买转化慢（需要至少有一次购买）
            if (transaction_count > 0 and
                addtocart_count >= config['Collector']['addtocart_threshold'] and
                purchase_ratio >= config['Collector']['purchase_ratio_min']):
                collector_users.append(visitorid)
        
        self.user_segments = {
            'All': self.df['visitorid'].unique().tolist(),
            'Hesitant': hesitant_users,
            'Impulsive': impulsive_users,
            'Collector': collector_users
        }
        self._persist_user_segments_cache()
        
        print(f"用户分类完成:")
        print(f"  总用户数: {len(self.user_segments['All']):,}")
        print(f"  犹豫型用户: {len(hesitant_users):,}")
        print(f"  冲动型用户: {len(impulsive_users):,}")
        print(f"  收藏型用户: {len(collector_users):,}")
        
        return self.user_segments
    
    def get_filtered_data(self, user_segment='All'):
        """
        根据用户群体筛选数据
        
        Args:
            user_segment: 用户群体名称 ('All', 'Hesitant', 'Impulsive', 'Collector')
        
        Returns:
            筛选后的DataFrame
        """
        if self.df is None:
            self.load_data()
        
        if not self.user_segments:
            self.classify_users()
        
        if user_segment not in self.user_segments:
            user_segment = 'All'
        
        visitorids = self.user_segments[user_segment]
        return self.df[self.df['visitorid'].isin(visitorids)].copy()
    
    def get_monthly_sales(self, user_segment='All'):
        """
        获取按月份的销售额数据
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: month, sales_count
        """
        df = self.get_filtered_data(user_segment)
        transactions = df[df['event'] == 'transaction'].copy()
        transactions['month'] = transactions['timestamp'].dt.to_period('M').astype(str)
        
        monthly_sales = transactions.groupby('month').size().reset_index(name='sales_count')
        monthly_sales = monthly_sales.sort_values('month')
        
        return monthly_sales
    
    def get_top_items(self, user_segment='All', top_n=10, event_type='transaction'):
        """
        获取Top N商品
        
        Args:
            user_segment: 用户群体名称
            top_n: Top N数量
            event_type: 事件类型 ('transaction', 'addtocart', 'view')
        
        Returns:
            DataFrame with columns: itemid, count
        """
        df = self.get_filtered_data(user_segment)
        event_type = event_type or 'transaction'
        data = df[df['event'] == event_type]
        top_items = data.groupby('itemid').size().reset_index(name='count')
        top_items = top_items.sort_values('count', ascending=False).head(top_n)
        return top_items
    
    def get_top_categories(self, user_segment='All', top_n=10, event_type='transaction'):
        """
        获取Top N类别
        
        Args:
            user_segment: 用户群体名称
            top_n: Top N数量
            event_type: 事件类型 ('transaction', 'addtocart', 'view')
        
        Returns:
            DataFrame with columns: categoryid, count
        """
        df = self.get_filtered_data(user_segment)
        event_type = event_type or 'transaction'
        data = df[df['event'] == event_type]
        top_categories = data.groupby('categoryid').size().reset_index(name='count')
        top_categories = top_categories.sort_values('count', ascending=False).head(top_n)
        return top_categories
    
    def get_conversion_funnel(self, user_segment='All'):
        """
        获取转换率漏斗数据
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: stage, count, percentage
        """
        df = self.get_filtered_data(user_segment)
        
        view_count = len(df[df['event'] == 'view'])
        addtocart_count = len(df[df['event'] == 'addtocart'])
        transaction_count = len(df[df['event'] == 'transaction'])
        
        funnel_data = pd.DataFrame({
            'stage': ['浏览', '加购', '购买'],
            'count': [view_count, addtocart_count, transaction_count],
            'percentage': [
                100.0,
                (addtocart_count / view_count * 100) if view_count > 0 else 0,
                (transaction_count / view_count * 100) if view_count > 0 else 0
            ]
        })
        
        return funnel_data
    
    def get_active_hours(self, user_segment='All'):
        """
        获取活跃时间段分布
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: hour, count
        """
        df = self.get_filtered_data(user_segment)
        df['hour'] = df['timestamp'].dt.hour
        
        hourly_counts = df.groupby('hour').size().reset_index(name='count')
        hourly_counts = hourly_counts.sort_values('hour')
        
        return hourly_counts
    
    def get_event_counts(self, user_segment='All'):
        """
        获取事件计数（浏览量、加购量、购买量）
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: event, count
        """
        df = self.get_filtered_data(user_segment)
        
        event_counts = df['event'].value_counts().reset_index()
        event_counts.columns = ['event', 'count']
        
        # 确保顺序
        event_order = ['view', 'addtocart', 'transaction']
        event_counts['event'] = pd.Categorical(event_counts['event'], categories=event_order, ordered=True)
        event_counts = event_counts.sort_values('event')
        
        return event_counts
    
    def get_user_activity_trend(self, user_segment='All'):
        """
        获取用户活跃度趋势（每日活跃用户数）
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: date, dau
        """
        df = self.get_filtered_data(user_segment)
        df['date'] = df['timestamp'].dt.date
        
        daily_active = df.groupby('date')['visitorid'].nunique().reset_index()
        daily_active.columns = ['date', 'dau']
        daily_active['date'] = pd.to_datetime(daily_active['date'])
        daily_active = daily_active.sort_values('date')
        
        return daily_active
    
    def get_retention_rate(self, user_segment='All', days=30):
        """
        获取用户留存率
        
        Args:
            user_segment: 用户群体名称
            days: 计算多少天的留存率
        
        Returns:
            DataFrame with columns: day, retention_rate, users
        """
        df = self.get_filtered_data(user_segment)
        
        # 计算每个用户的首次访问日期
        user_first_visit = df.groupby('visitorid')['timestamp'].min().reset_index()
        user_first_visit.columns = ['visitorid', 'first_visit_date']
        user_first_visit['first_visit_date'] = pd.to_datetime(user_first_visit['first_visit_date']).dt.date
        
        # 合并首次访问日期
        df_with_first = df.copy()
        df_with_first['visit_date'] = pd.to_datetime(df_with_first['timestamp']).dt.date
        df_with_first = df_with_first.merge(user_first_visit, on='visitorid', how='left')
        df_with_first['first_visit_date'] = pd.to_datetime(df_with_first['first_visit_date'])
        df_with_first['visit_date'] = pd.to_datetime(df_with_first['visit_date'])
        df_with_first['days_since_first'] = (df_with_first['visit_date'] - df_with_first['first_visit_date']).dt.days
        
        # 计算留存率
        retention_data = []
        daily_new = df_with_first[df_with_first['days_since_first'] == 0].groupby('visit_date')['visitorid'].nunique()
        total_new = daily_new.sum()
        
        for day in range(0, min(days + 1, 31)):
            if day == 0:
                retention_data.append({'day': day, 'users': total_new, 'retention_rate': 100.0})
            else:
                daily_retained = df_with_first[df_with_first['days_since_first'] == day]['visitorid'].nunique()
                retention_rate = (daily_retained / total_new) * 100 if total_new > 0 else 0
                retention_data.append({'day': day, 'users': daily_retained, 'retention_rate': retention_rate})
        
        return pd.DataFrame(retention_data)
    
    def get_black_horse_items(self, user_segment='All', top_n=10):
        """
        获取黑马商品（销量涨幅Top N）
        
        Args:
            user_segment: 用户群体名称
            top_n: Top N数量
        
        Returns:
            DataFrame with columns: itemid, first_half_avg, second_half_avg, growth_rate, total_sales
        """
        df = self.get_filtered_data(user_segment)
        transactions = df[df['event'] == 'transaction'].copy()
        transactions['month'] = transactions['timestamp'].dt.to_period('M').astype(str)
        
        # 排除九月份数据
        transactions = transactions[~transactions['month'].str.contains('2015-09')]
        
        # 计算每个商品每月的销量
        monthly_sales = transactions.groupby(['itemid', 'month']).size().reset_index(name='sales_count')
        
        all_months = sorted([m for m in monthly_sales['month'].unique() if '2015-09' not in m])
        first_half_months = [m for m in all_months if m < '2015-07']
        second_half_months = [m for m in all_months if m >= '2015-07']
        
        # 计算每个商品在前半段和后半段的平均销量
        item_growth = []
        for itemid in monthly_sales['itemid'].unique():
            item_data = monthly_sales[monthly_sales['itemid'] == itemid]
            
            first_half_sales = item_data[item_data['month'].isin(first_half_months)]['sales_count'].mean()
            second_half_sales = item_data[item_data['month'].isin(second_half_months)]['sales_count'].mean()
            
            if pd.isna(first_half_sales):
                first_half_sales = 0
            if pd.isna(second_half_sales):
                second_half_sales = 0
            
            # 计算涨幅
            if first_half_sales > 0:
                growth_rate = ((second_half_sales - first_half_sales) / first_half_sales) * 100
            else:
                growth_rate = 1000 if second_half_sales > 0 else 0
            
            total_sales = item_data['sales_count'].sum()
            
            item_growth.append({
                'itemid': itemid,
                'first_half_avg': first_half_sales,
                'second_half_avg': second_half_sales,
                'growth_rate': growth_rate,
                'total_sales': total_sales
            })
        
        growth_df = pd.DataFrame(item_growth)
        growth_df = growth_df[growth_df['total_sales'] >= 5]  # 至少5笔交易
        growth_df = growth_df.nlargest(top_n, 'growth_rate')
        
        return growth_df
    
    def get_item_monthly_sales(self, user_segment='All'):
        """
        获取商品的月度销量数据（用于黑马商品图表）
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: itemid, month, sales_count
        """
        df = self.get_filtered_data(user_segment)
        transactions = df[df['event'] == 'transaction'].copy()
        transactions['month'] = transactions['timestamp'].dt.to_period('M').astype(str)
        transactions = transactions[~transactions['month'].str.contains('2015-09')]
        
        monthly_sales = transactions.groupby(['itemid', 'month']).size().reset_index(name='sales_count')
        return monthly_sales
    
    def get_heatmap_data(self, user_segment='All'):
        """
        获取行为时间热力图数据
        
        Args:
            user_segment: 用户群体名称
        
        Returns:
            DataFrame with columns: date, hour, count
        """
        df = self.get_filtered_data(user_segment)
        df['date'] = df['timestamp'].dt.date
        df['hour'] = df['timestamp'].dt.hour
        
        heatmap_data = df.groupby(['date', 'hour']).size().reset_index(name='count')
        heatmap_data['date'] = pd.to_datetime(heatmap_data['date'])
        
        return heatmap_data
    
    def get_user_segment_monthly_trend(self):
        """
        获取不同类型用户在不同月份上的涨跌趋势
        
        Returns:
            DataFrame with columns: month, segment, count
        """
        monthly_trends = []
        
        for segment in ['Hesitant', 'Impulsive', 'Collector', 'All']:
            df = self.get_filtered_data(segment)
            transactions = df[df['event'] == 'transaction'].copy()
            transactions['month'] = transactions['timestamp'].dt.to_period('M').astype(str)
            
            monthly_counts = transactions.groupby('month').size().reset_index(name='count')
            monthly_counts['segment'] = segment
            monthly_trends.append(monthly_counts)
        
        result = pd.concat(monthly_trends, ignore_index=True)
        return result

    def get_entity_event_profile(self, entity_type, entity_id, user_segment='All'):
        """
        获取指定商品或品类的事件概览与时间序列
        
        Args:
            entity_type: 'item' 或 'category'
            entity_id: 对应 ID
            user_segment: 用户群体
        
        Returns:
            summary (dict), timeline_df (DataFrame)
        """
        df = self.get_filtered_data(user_segment)
        key = 'itemid' if entity_type == 'item' else 'categoryid'
        subset = df[df[key] == entity_id].copy()
        
        summary = subset['event'].value_counts().to_dict()
        
        if subset.empty:
            return summary, pd.DataFrame()
        
        subset['period'] = subset['timestamp'].dt.to_period('W').dt.start_time
        timeline = (
            subset.groupby(['period', 'event'])
            .size()
            .unstack(fill_value=0)
            .reset_index()
            .rename(columns={'period': 'date'})
        )
        return summary, timeline

