"""
图表组件模块
包含所有图表的生成函数
"""
import math

import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
import pandas as pd
from config import COLORS, TOP_N, COLOR_PALETTES, FONT_FAMILY, APP_THEME


# 注册定制 Plotly 模板，确保所有图保持统一的现代化配色
URBANIST_TEMPLATE = go.layout.Template(
    layout=dict(
        font=dict(family=FONT_FAMILY, color=APP_THEME['text']),
        paper_bgcolor=APP_THEME['card_bg'],
        plot_bgcolor=APP_THEME['card_bg'],
        colorway=COLOR_PALETTES.get('ocean', ['#42A5F5', '#0D47A1', '#4ECDC4', '#FF6B6B']),
        hoverlabel=dict(font=dict(family=FONT_FAMILY)),
        legend=dict(
            bgcolor='rgba(255,255,255,0.6)',
            bordercolor=APP_THEME['border'],
            borderwidth=1
        ),
        margin=dict(l=40, r=30, t=60, b=40)
    )
)

pio.templates["urbanist"] = URBANIST_TEMPLATE
pio.templates.default = "urbanist"


def _palette_colors(palette_key, size):
    palette = COLOR_PALETTES.get(palette_key, [COLORS['primary']])
    if not palette:
        palette = [COLORS['primary']]
    repeats = math.ceil(size / len(palette))
    return (palette * repeats)[:size]


def _base_layout(title, height=400, **kwargs):
    layout = dict(
        title=dict(text=title, font=dict(size=20, family=FONT_FAMILY, color=APP_THEME['text'])),
        template='plotly_white',
        height=height,
        paper_bgcolor=APP_THEME['card_bg'],
        plot_bgcolor=APP_THEME['card_bg'],
        font=dict(family=FONT_FAMILY, color=APP_THEME['text']),
        margin=dict(l=40, r=30, t=70, b=50),
        hoverlabel=dict(font=dict(family=FONT_FAMILY))
    )
    layout.update(kwargs)
    return layout


def create_monthly_sales_chart(data, title="按月份销售额"):
    """
    创建按月份销售额图表
    
    Args:
        data: DataFrame with columns: month, sales_count
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    colors = _palette_colors('ocean', len(data))
    fig.add_trace(go.Bar(
        x=data['month'],
        y=data['sales_count'],
        marker=dict(color=colors, line=dict(color=COLORS['primary_dark'], width=0)),
        text=data['sales_count'],
        textposition='outside',
        name='销售额',
        hovertemplate='月份: %{x}<br>销售额: %{y:,.0f}<extra></extra>'
    ))
    fig.add_trace(go.Scatter(
        x=data['month'],
        y=data['sales_count'],
        mode='lines',
        line=dict(color=COLORS['accent'], width=3),
        name='趋势',
        hovertemplate='月份: %{x}<br>销售额: %{y:,.0f}<extra></extra>'
    ))
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title='月份',
        yaxis_title='销售额（交易次数）',
        hovermode='x unified'
    )
    return fig


def create_top_items_chart(data, title="Top N 商品销量", top_n=TOP_N, metric_label="销量"):
    """
    创建Top N商品销量图表
    
    Args:
        data: DataFrame with columns: itemid, count
        title: 图表标题
        top_n: Top N数量
    
    Returns:
        plotly figure
    """
    # 按销量排序并取Top N
    data = data.sort_values('count', ascending=True).head(top_n)
    
    fig = go.Figure()
    color_sequence = _palette_colors('sunset', len(data))
    fig.add_trace(go.Bar(
        y=[f"商品 {int(itemid)}" for itemid in data['itemid']],
        x=data['count'],
        orientation='h',
        marker=dict(color=color_sequence, line=dict(color='rgba(0,0,0,0)', width=0)),
        text=data['count'],
        textposition='outside',
        name=metric_label,
        hovertemplate='商品ID: %{y}<br>%s: %{x:,.0f}<extra></extra>' % metric_label
    ))
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title=f'{metric_label}（次数）',
        yaxis_title='商品ID',
        yaxis={'categoryorder': 'total ascending'}
    )
    return fig


def create_top_categories_chart(data, title="Top N 类别销量", top_n=TOP_N, metric_label="销量"):
    """
    创建Top N类别销量图表
    
    Args:
        data: DataFrame with columns: categoryid, count
        title: 图表标题
        top_n: Top N数量
    
    Returns:
        plotly figure
    """
    # 按销量排序并取Top N
    data = data.sort_values('count', ascending=True).head(top_n)
    
    fig = go.Figure()
    color_sequence = _palette_colors('mint', len(data))
    fig.add_trace(go.Bar(
        y=[f"类别 {int(catid)}" for catid in data['categoryid']],
        x=data['count'],
        orientation='h',
        marker=dict(color=color_sequence, line=dict(color='rgba(0,0,0,0)', width=0)),
        text=data['count'],
        textposition='outside',
        name=metric_label,
        hovertemplate='类别ID: %{y}<br>%s: %{x:,.0f}<extra></extra>' % metric_label
    ))
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title=f'{metric_label}（次数）',
        yaxis_title='类别ID',
        yaxis={'categoryorder': 'total ascending'}
    )
    return fig


def create_conversion_funnel_chart(data, title="转换率漏斗"):
    """
    创建转换率漏斗图表
    
    Args:
        data: DataFrame with columns: stage, count, percentage
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    colors = [COLORS['view'], COLORS['addtocart'], COLORS['transaction']]
    fig.add_trace(go.Funnel(
        y=data['stage'],
        x=data['count'],
        textposition='inside',
        textinfo='value+percent initial',
        marker={'color': colors[:len(data)]},
        connector={'line': {'color': COLORS['muted_text'], 'dash': 'dot', 'width': 3}},
        hovertemplate='阶段: %{y}<br>数量: %{x:,.0f}<br>转化率: %{text}<extra></extra>'
    ))
    fig.update_layout(**_base_layout(title, height=420))
    return fig


def create_active_hours_chart(data, title="活跃时间段分布"):
    """
    创建活跃时间段分布图表
    
    Args:
        data: DataFrame with columns: hour, count
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=data['hour'],
        y=data['count'],
        marker_color=COLORS['info'],
        text=data['count'],
        textposition='outside',
        name='活跃度',
        hovertemplate='时间: %{x}:00<br>活跃度: %{y:,.0f}<extra></extra>'
    ))
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title='小时',
        yaxis_title='活跃度（事件次数）',
        xaxis={'tickmode': 'linear', 'tick0': 0, 'dtick': 2}
    )
    return fig


def create_event_counts_chart(data, title="浏览量、加购量、购买量"):
    """
    创建事件计数图表（浏览量、加购量、购买量）
    
    Args:
        data: DataFrame with columns: event, count
        title: 图表标题
    
    Returns:
        plotly figure
    """
    event_labels = {
        'view': '浏览',
        'addtocart': '加购',
        'transaction': '购买'
    }
    
    data['event_label'] = data['event'].map(event_labels)
    
    colors_map = {
        '浏览': COLORS['view'],
        '加购': COLORS['addtocart'],
        '购买': COLORS['transaction']
    }
    
    fig = go.Figure()
    for idx, row in data.iterrows():
        fig.add_trace(go.Bar(
            x=[row['event_label']],
            y=[row['count']],
            marker_color=colors_map.get(row['event_label'], COLORS['primary']),
            text=[f"{row['count']:,.0f}"],
            textposition='outside',
            name=row['event_label'],
            hovertemplate=f"{row['event_label']}: %{{y:,.0f}}<extra></extra>",
            showlegend=False
        ))
    fig.update_layout(
        **_base_layout(title, height=380),
        xaxis_title='事件类型',
        yaxis_title='数量'
    )
    return fig


def create_user_activity_trend_chart(data, title="用户活跃度趋势"):
    """
    创建用户活跃度趋势图表（每日活跃用户数）
    
    Args:
        data: DataFrame with columns: date, dau
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    data = data.sort_values('date')
    data['dau_7d_ma'] = data['dau'].rolling(7, min_periods=1).mean()
    fig.add_trace(go.Scatter(
        x=data['date'],
        y=data['dau'],
        mode='lines+markers',
        name='每日活跃用户',
        line=dict(color=COLORS['primary'], width=3),
        marker=dict(size=5, color=COLORS['accent']),
        hovertemplate='日期: %{x}<br>活跃用户: %{y:,.0f}<extra></extra>'
    ))
    fig.add_trace(go.Scatter(
        x=data['date'],
        y=data['dau_7d_ma'],
        mode='lines',
        name='7日移动平均',
        line=dict(color=COLORS['secondary'], width=3, dash='dash'),
        hovertemplate='日期: %{x}<br>7日平均: %{y:,.0f}<extra></extra>'
    ))
    # fig.update_layout(
    #     **_base_layout(title, height=420),
    #     xaxis_title='日期',
    #     yaxis_title='活跃用户数',
    #     hovermode='x unified',
    #     legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    # )
    return fig


def create_retention_rate_chart(data, title="用户留存率"):
    """
    创建用户留存率图表
    
    Args:
        data: DataFrame with columns: day, retention_rate, users
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=data['day'],
        y=data['retention_rate'],
        mode='lines+markers',
        name='留存率',
        line=dict(color=COLORS['accent'], width=4),
        marker=dict(size=10, color=COLORS['accent_warm'], line=dict(color=COLORS['card_bg'], width=2)),
        fill='tozeroy',
        fillcolor='rgba(255,107,107,0.15)',
        hovertemplate='第 %{x} 天<br>留存率: %{y:.2f}%<br>用户数: %{customdata:,.0f}<extra></extra>',
        customdata=data['users']
    ))
    # 添加关键留存点标注
    key_days = [1, 7, 14, 30]
    for day in key_days:
        if day < len(data):
            day_data = data[data['day'] == day]
            if not day_data.empty:
                fig.add_annotation(
                    x=day,
                    y=day_data.iloc[0]['retention_rate'],
                    text=f"Day {day}<br>{day_data.iloc[0]['retention_rate']:.2f}%",
                    showarrow=True,
                    arrowhead=2,
                    arrowcolor=COLORS['accent'],
                    bgcolor='white',
                    bordercolor=COLORS['accent'],
                    borderwidth=2
                )
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title='天数（自首次访问）',
        yaxis_title='留存率 (%)',
        xaxis={'tickmode': 'linear', 'tick0': 0, 'dtick': 5}
    )
    return fig


def create_black_horse_items_chart(data, monthly_sales_data, title="黑马商品购买趋势", top_n=TOP_N):
    """
    创建黑马商品购买趋势图表
    
    Args:
        data: DataFrame with columns: itemid, first_half_avg, second_half_avg, growth_rate, total_sales
        monthly_sales_data: DataFrame with columns: itemid, month, sales_count
        title: 图表标题
        top_n: Top N数量
    
    Returns:
        plotly figure
    """
    top_items = data.head(top_n)['itemid'].tolist()
    
    fig = go.Figure()
    colors = _palette_colors('ocean', len(top_items))
    all_months = sorted(monthly_sales_data['month'].unique())
    for idx, itemid in enumerate(top_items):
        item_monthly = monthly_sales_data[monthly_sales_data['itemid'] == itemid].copy()
        item_monthly = item_monthly.sort_values('month')
        
        # 确保所有月份都有数据
        all_months_df = pd.DataFrame({'month': all_months})
        item_monthly = all_months_df.merge(item_monthly, on='month', how='left')
        item_monthly['sales_count'] = item_monthly['sales_count'].fillna(0)
        item_monthly = item_monthly.sort_values('month')
        
        # 获取涨幅信息
        growth_info = data[data['itemid'] == itemid].iloc[0]
        growth_rate = growth_info['growth_rate']
        
        fig.add_trace(go.Scatter(
            x=item_monthly['month'],
            y=item_monthly['sales_count'],
            mode='lines+markers',
            name=f'商品 {int(itemid)} (↑{growth_rate:.1f}%)',
            line=dict(color=colors[idx], width=3),
            marker=dict(size=6, symbol='circle'),
            hovertemplate='月份: %{x}<br>销量: %{y:,.0f}<extra></extra>'
        ))
    if '2015-07' in all_months:
        mid_idx = all_months.index('2015-07')
        fig.add_vline(
            x=mid_idx - 0.5,
            line_dash="dash",
            line_color=COLORS['muted_text'],
            annotation_text="分界点 07-01",
            annotation_position="top"
        )
    fig.update_layout(
        **_base_layout(title, height=520),
        xaxis_title='月份',
        yaxis_title='销量（交易次数）',
        hovermode='x unified',
        legend=dict(orientation='v', yanchor='top', y=1, xanchor='left', x=1.02, bgcolor='rgba(255,255,255,0.7)')
    )
    return fig


def create_heatmap_chart(data, title="行为时间热力图"):
    """
    创建行为时间热力图
    
    Args:
        data: DataFrame with columns: date, hour, count
        title: 图表标题
    
    Returns:
        plotly figure
    """
    # 创建透视表
    pivot_data = data.pivot_table(
        values='count',
        index='date',
        columns='hour',
        aggfunc='sum',
        fill_value=0
    )
    
    fig = go.Figure(data=go.Heatmap(
        z=pivot_data.values,
        x=pivot_data.columns,
        y=[d.strftime('%Y-%m-%d') for d in pivot_data.index],
        colorscale='Aggrnyl',
        hovertemplate='日期: %{y}<br>时间: %{x}:00<br>活跃度: %{z:,.0f}<extra></extra>',
        colorbar=dict(title="活跃度", thickness=12)
    ))
    fig.update_layout(
        **_base_layout(title, height=620),
        xaxis_title='小时',
        yaxis_title='日期',
        xaxis={'tickmode': 'linear', 'tick0': 0, 'dtick': 2}
    )
    return fig


def create_user_segment_monthly_trend_chart(data, title="不同类型用户月度趋势"):
    """
    创建不同类型用户在不同月份上的涨跌趋势图表
    
    Args:
        data: DataFrame with columns: month, segment, count
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    segments = ['Hesitant', 'Impulsive', 'Collector', 'All']
    colors_map = {
        'Hesitant': COLORS['accent'],
        'Impulsive': COLORS['secondary'],
        'Collector': COLORS['info'],
        'All': COLORS['primary']
    }
    
    for segment in segments:
        segment_data = data[data['segment'] == segment].sort_values('month')
        if not segment_data.empty:
            fig.add_trace(go.Scatter(
                x=segment_data['month'],
                y=segment_data['count'],
                mode='lines+markers',
                name=segment,
                line=dict(color=colors_map.get(segment, COLORS['primary']), width=2.5),
                marker=dict(size=6),
                hovertemplate=f'{segment}<br>月份: %{{x}}<br>交易数: %{{y:,.0f}}<extra></extra>'
            ))
    fig.update_layout(
        **_base_layout(title, height=420),
        xaxis_title='月份',
        yaxis_title='交易次数',
        hovermode='x unified',
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    )
    return fig


def create_item_event_details_chart(item_data, title="商品事件详情"):
    """
    创建商品事件详情图表（浏览、加购、交易重叠柱状图）
    
    Args:
        item_data: DataFrame with columns: itemid, view, addtocart, transaction
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    
    # 按浏览次数排序
    item_data = item_data.sort_values('view', ascending=True)
    
    y_pos = [f"商品 {int(itemid)}" for itemid in item_data['itemid']]
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=item_data['view'],
        name='浏览',
        orientation='h',
        marker_color=COLORS['view'],
        opacity=0.6,
        hovertemplate='浏览: %{x:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=item_data['addtocart'],
        name='加购',
        orientation='h',
        marker_color=COLORS['addtocart'],
        opacity=0.7,
        hovertemplate='加购: %{x:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=item_data['transaction'],
        name='交易',
        orientation='h',
        marker_color=COLORS['transaction'],
        opacity=0.9,
        hovertemplate='交易: %{x:,.0f}<extra></extra>'
    ))
    
    fig.update_layout(
        **_base_layout(title, height=500),
        xaxis_title='事件次数',
        yaxis_title='商品ID',
        barmode='overlay',
        yaxis={'categoryorder': 'total ascending'},
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    )
    
    return fig


def create_category_event_details_chart(category_data, title="类别事件详情"):
    """
    创建类别事件详情图表（浏览、加购、交易重叠柱状图）
    
    Args:
        category_data: DataFrame with columns: categoryid, view, addtocart, transaction
        title: 图表标题
    
    Returns:
        plotly figure
    """
    fig = go.Figure()
    
    # 按浏览次数排序
    category_data = category_data.sort_values('view', ascending=True)
    
    y_pos = [f"类别 {int(catid)}" for catid in category_data['categoryid']]
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=category_data['view'],
        name='浏览',
        orientation='h',
        marker_color=COLORS['view'],
        opacity=0.6,
        hovertemplate='浏览: %{x:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=category_data['addtocart'],
        name='加购',
        orientation='h',
        marker_color=COLORS['addtocart'],
        opacity=0.7,
        hovertemplate='加购: %{x:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Bar(
        y=y_pos,
        x=category_data['transaction'],
        name='交易',
        orientation='h',
        marker_color=COLORS['transaction'],
        opacity=0.9,
        hovertemplate='交易: %{x:,.0f}<extra></extra>'
    ))
    
    fig.update_layout(
        **_base_layout(title, height=500),
        xaxis_title='事件次数',
        yaxis_title='类别ID',
        barmode='overlay',
        yaxis={'categoryorder': 'total ascending'},
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    )
    
    return fig


def create_drilldown_detail_chart(title, summary_counts, timeline_df):
    """
    创建 drill-down 详情图（上方概览，下方时间线）
    """
    fig = make_subplots(
        rows=2,
        cols=1,
        shared_xaxes=False,
        vertical_spacing=0.18,
        row_heights=[0.35, 0.65],
        specs=[[{"type": "bar"}], [{"type": "scatter"}]]
    )
    
    events = ['view', 'addtocart', 'transaction']
    labels = {'view': '浏览', 'addtocart': '加购', 'transaction': '购买'}
    colors = [COLORS['view'], COLORS['addtocart'], COLORS['transaction']]
    
    summary_values = [summary_counts.get(evt, 0) for evt in events]
    fig.add_trace(
        go.Bar(
            x=[labels[e] for e in events],
            y=summary_values,
            marker_color=colors,
            text=[f"{v:,.0f}" for v in summary_values],
            textposition='outside',
            hovertemplate='%{x}: %{y:,.0f}<extra></extra>',
            name='总览'
        ),
        row=1,
        col=1
    )
    
    if timeline_df is not None and not timeline_df.empty:
        timeline_df = timeline_df.sort_values('date')
        for color, evt in zip(colors, events):
            if evt in timeline_df.columns:
                fig.add_trace(
                    go.Scatter(
                        x=timeline_df['date'],
                        y=timeline_df[evt],
                        mode='lines+markers',
                        name=labels[evt],
                        line=dict(color=color, width=3),
                        marker=dict(size=5),
                        hovertemplate='日期: %{x|%Y-%m-%d}<br>%s: %{y:,.0f}<extra></extra>' % labels[evt]
                    ),
                    row=2,
                    col=1
                )
    fig.update_layout(
        **_base_layout(title, height=560),
        xaxis=dict(title='事件类型', row=1, col=1),
        xaxis2=dict(title='周度', row=2, col=1),
        yaxis=dict(title='总次数', row=1, col=1),
        yaxis2=dict(title='周度次数', row=2, col=1),
        legend=dict(orientation='h', yanchor='bottom', y=1.01, xanchor='right', x=1),
    )
    return fig

