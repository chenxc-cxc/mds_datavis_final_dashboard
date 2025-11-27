"""
主应用文件
Dash交互式数据可视化看板
"""
import dash
from dash import dcc, html, Input, Output, State, callback_context
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
from data_processor import DataProcessor
import chart_components as charts
from config import TOP_N, APP_THEME

# 初始化Dash应用
external_stylesheets = [
    dbc.themes.LUX,
    "https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap",
]
app = dash.Dash(__name__, external_stylesheets=external_stylesheets, suppress_callback_exceptions=True)
app.title = "电商数据可视化看板"

# 初始化数据处理器
processor = DataProcessor()

# 加载数据并分类用户
print("正在初始化数据...")
processor.load_data()
processor.classify_users()

METRIC_LABELS = {
    'transaction': '购买量',
    'addtocart': '加购量',
    'view': '浏览量'
}


def graph_card(title, graph_id, subtitle=None):
    header_children = [html.H5(title, className="card-title mb-1")]
    if subtitle:
        header_children.append(html.P(subtitle, className="text-muted mb-3"))
    return dbc.Card(
        [
            html.Div(header_children, className="card-heading"),
            dcc.Graph(id=graph_id, config={'displaylogo': False, 'responsive': True})
        ],
        body=True,
        className="modern-card h-100"
    )


def extract_entity_id(label_text):
    """从标签中提取整数ID"""
    if isinstance(label_text, (int, float)) and not isinstance(label_text, bool):
        return int(label_text)
    if isinstance(label_text, str):
        digits = ''.join(ch for ch in label_text if ch.isdigit())
        if digits:
            return int(digits)
    return None

app.layout = html.Div(
    [
        dcc.Store(id='selected-segment', data='All'),
        dcc.Store(id='drilldown-store'),
        dbc.Container(
            [
                dbc.Row(
                    dbc.Col(
                        html.Div(
                            [
                                html.H1("电商数据可视化看板", className="display-5 fw-bold"),
                                html.P(
                                    "洞察 200 万+ 行为数据，理解用户旅程、转化漏斗与黑马商品。",
                                    className="text-muted lead"
                                )
                            ],
                            className="page-header"
                        ),
                        width=12
                    ),
                    className="mb-3"
                ),
                dbc.Row(
                    dbc.Col(
                        html.Div(
                            [
                                html.Span("选择用户群体", className="text-uppercase text-muted small"),
                                dbc.ButtonGroup(
                                    [
                                        dbc.Button("全部用户", id="btn-all", color="primary", outline=True, className="segment-btn"),
                                        dbc.Button("犹豫型", id="btn-hesitant", color="warning", outline=True, className="segment-btn"),
                                        dbc.Button("冲动型", id="btn-impulsive", color="danger", outline=True, className="segment-btn"),
                                        dbc.Button("收藏型", id="btn-collector", color="success", outline=True, className="segment-btn"),
                                    ],
                                    className="segment-button-group flex-wrap"
                                ),
                            ]
                        ),
                        width=12
                    ),
                    className="mb-3"
                ),
                dbc.Row(
                    dbc.Col(
                        dbc.Card(
                            [
                                html.Div(id="user-segment-info", className="mb-3"),
                                dbc.Row(
                                    [
                                        dbc.Col(
                                            [
                                                html.Small("排行榜指标", className="text-muted fw-semibold"),
                                                dcc.Dropdown(
                                                    id='ranking-metric',
                                                    options=[
                                                        {'label': '购买量 (transaction)', 'value': 'transaction'},
                                                        {'label': '加购量 (add to cart)', 'value': 'addtocart'},
                                                        {'label': '浏览量 (view)', 'value': 'view'}
                                                    ],
                                                    value='transaction',
                                                    clearable=False,
                                                    className="ranking-dropdown"
                                                )
                                            ],
                                            md=6
                                        ),
                                        dbc.Col(
                                            [
                                                html.Small("Top N 数量", className="text-muted fw-semibold"),
                                                dcc.Slider(
                                                    id='ranking-topn',
                                                    min=5,
                                                    max=20,
                                                    value=TOP_N,
                                                    step=1,
                                                    marks={5: '5', 10: '10', 15: '15', 20: '20'},
                                                    tooltip={"placement": "bottom", "always_visible": True}
                                                )
                                            ],
                                            md=6
                                        )
                                    ],
                                    className="g-3 align-items-center"
                                )
                            ],
                            body=True,
                            className="modern-card"
                        ),
                        width=12
                    ),
                    className="mb-4"
                ),
                html.Div("用户洞察", className="section-title"),
                dbc.Row(
                    [
                        dbc.Col(graph_card("按月份销售额", "monthly-sales-chart", "识别交易高峰与淡季"), lg=12)
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("Top 商品榜", "top-items-sales-chart", "动态切换浏览/加购/购买"), lg=6),
                        dbc.Col(graph_card("Top 类别榜", "top-categories-sales-chart", "洞察品类热度"), lg=6),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("转化率漏斗", "conversion-funnel-chart", "浏览 → 加购 → 购买"), lg=6),
                        dbc.Col(graph_card("活跃时间段", "active-hours-chart", "识别黄金营销时段"), lg=6),
                    ],
                    className="g-4"
                ),
                html.Div("总览指标", className="section-title"),
                dbc.Row(
                    [
                        dbc.Col(graph_card("事件概览", "event-counts-chart"), lg=6),
                        dbc.Col(graph_card("用户活跃时段", "user-active-hours-chart"), lg=6),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("Top 商品（总表）", "top-items-overall-chart"), lg=6),
                        dbc.Col(graph_card("Top 类别（总表）", "top-categories-overall-chart"), lg=6),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("用户类型趋势", "user-segment-trend-chart"), lg=12),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("活跃度趋势", "user-activity-trend-chart"), lg=6),
                        dbc.Col(graph_card("留存率", "retention-rate-chart"), lg=6),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("黑马商品趋势", "black-horse-items-chart"), lg=12),
                    ],
                    className="g-4"
                ),
                dbc.Row(
                    [
                        dbc.Col(graph_card("行为时间热力图", "heatmap-chart"), lg=12),
                    ],
                    className="g-4 pb-4"
                )
            ],
            fluid=True,
            className="dashboard-container"
        ),
        dbc.Offcanvas(
            [
                html.H4(id='drilldown-title', className='mb-3'),
                dcc.Graph(id='drilldown-graph', config={'displaylogo': False, 'responsive': True}),
                dbc.Button("关闭", id='close-drilldown', color='secondary', className='mt-3 w-100')
            ],
            id='drilldown-panel',
            title="深度钻取",
            placement='end',
            is_open=False,
            scrollable=True,
            style={'backgroundColor': APP_THEME['card_bg'], 'width': '480px'}
        )
    ],
    className="app-wrapper",
    style={'backgroundColor': APP_THEME['app_bg']}
)


# 用户群体选择回调
@app.callback(
    [Output('selected-segment', 'data'),
     Output('user-segment-info', 'children'),
     Output('btn-all', 'outline'),
     Output('btn-hesitant', 'outline'),
     Output('btn-impulsive', 'outline'),
     Output('btn-collector', 'outline')],
    [Input('btn-all', 'n_clicks'),
     Input('btn-hesitant', 'n_clicks'),
     Input('btn-impulsive', 'n_clicks'),
     Input('btn-collector', 'n_clicks')]
)
def update_segment(btn_all, btn_hesitant, btn_impulsive, btn_collector):
    ctx = callback_context
    if not ctx.triggered:
        segment = 'All'
    else:
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
        segment_map = {
            'btn-all': 'All',
            'btn-hesitant': 'Hesitant',
            'btn-impulsive': 'Impulsive',
            'btn-collector': 'Collector'
        }
        segment = segment_map.get(button_id, 'All')
    
    # 更新按钮状态
    outline_states = {
        'btn-all': segment != 'All',
        'btn-hesitant': segment != 'Hesitant',
        'btn-impulsive': segment != 'Impulsive',
        'btn-collector': segment != 'Collector'
    }
    
    # 获取用户数量信息
    user_count = len(processor.user_segments.get(segment, []))
    segment_names = {
        'All': '全部用户',
        'Hesitant': '犹豫型用户',
        'Impulsive': '冲动型用户',
        'Collector': '收藏型用户'
    }
    
    info_text = dbc.Alert(
        f"当前选择: {segment_names.get(segment, segment)} | 用户数量: {user_count:,}",
        color="info",
        className="mb-0"
    )
    
    return segment, info_text, outline_states['btn-all'], outline_states['btn-hesitant'], \
           outline_states['btn-impulsive'], outline_states['btn-collector']


# 用户子表图表回调

@app.callback(
    Output('monthly-sales-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_monthly_sales(segment):
    data = processor.get_monthly_sales(segment)
    return charts.create_monthly_sales_chart(data, f"按月份销售额 - {segment}")


@app.callback(
    Output('top-items-sales-chart', 'figure'),
    Input('selected-segment', 'data'),
    Input('ranking-metric', 'value'),
    Input('ranking-topn', 'value')
)
def update_top_items_sales(segment, metric, top_n):
    event_type = metric or 'transaction'
    label = METRIC_LABELS.get(event_type, '数量')
    data = processor.get_top_items(segment, top_n, event_type=event_type)
    return charts.create_top_items_chart(data, f"Top {top_n} 商品榜 - {label}", top_n, label)


@app.callback(
    Output('top-categories-sales-chart', 'figure'),
    Input('selected-segment', 'data'),
    Input('ranking-metric', 'value'),
    Input('ranking-topn', 'value')
)
def update_top_categories_sales(segment, metric, top_n):
    event_type = metric or 'transaction'
    label = METRIC_LABELS.get(event_type, '数量')
    data = processor.get_top_categories(segment, top_n, event_type=event_type)
    return charts.create_top_categories_chart(data, f"Top {top_n} 类别榜 - {label}", top_n, label)


@app.callback(
    Output('conversion-funnel-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_conversion_funnel(segment):
    data = processor.get_conversion_funnel(segment)
    return charts.create_conversion_funnel_chart(data, f"转换率漏斗 - {segment}")


@app.callback(
    Output('active-hours-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_active_hours(segment):
    data = processor.get_active_hours(segment)
    return charts.create_active_hours_chart(data, f"活跃时间段分布 - {segment}")


# 总表图表回调

@app.callback(
    Output('event-counts-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_event_counts(segment):
    data = processor.get_event_counts(segment)
    return charts.create_event_counts_chart(data, f"浏览量、加购量、购买量 - {segment}")


@app.callback(
    Output('user-active-hours-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_user_active_hours(segment):
    data = processor.get_active_hours(segment)
    return charts.create_active_hours_chart(data, f"用户活跃时间段分布 - {segment}")


@app.callback(
    Output('top-items-overall-chart', 'figure'),
    Input('selected-segment', 'data'),
    Input('ranking-metric', 'value'),
    Input('ranking-topn', 'value')
)
def update_top_items_overall(segment, metric, top_n):
    event_type = metric or 'transaction'
    label = METRIC_LABELS.get(event_type, '数量')
    data = processor.get_top_items(segment, top_n, event_type=event_type)
    return charts.create_top_items_chart(data, f"Top {top_n} 商品（总表） - {label}", top_n, label)


@app.callback(
    Output('top-categories-overall-chart', 'figure'),
    Input('selected-segment', 'data'),
    Input('ranking-metric', 'value'),
    Input('ranking-topn', 'value')
)
def update_top_categories_overall(segment, metric, top_n):
    event_type = metric or 'transaction'
    label = METRIC_LABELS.get(event_type, '数量')
    data = processor.get_top_categories(segment, top_n, event_type=event_type)
    return charts.create_top_categories_chart(data, f"Top {top_n} 类别（总表） - {label}", top_n, label)


@app.callback(
    Output('user-segment-trend-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_user_segment_trend(segment):
    data = processor.get_user_segment_monthly_trend()
    return charts.create_user_segment_monthly_trend_chart(data, "不同类型用户在不同月份上的涨跌趋势")


@app.callback(
    Output('user-activity-trend-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_user_activity_trend(segment):
    data = processor.get_user_activity_trend(segment)
    return charts.create_user_activity_trend_chart(data, f"用户活跃度趋势 - {segment}")


@app.callback(
    Output('retention-rate-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_retention_rate(segment):
    data = processor.get_retention_rate(segment, days=30)
    return charts.create_retention_rate_chart(data, f"用户留存率 - {segment}")


@app.callback(
    Output('black-horse-items-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_black_horse_items(segment):
    growth_data = processor.get_black_horse_items(segment, TOP_N)
    
    # 获取月度销量数据用于绘制趋势
    monthly_sales = processor.get_item_monthly_sales(segment)
    
    return charts.create_black_horse_items_chart(growth_data, monthly_sales, f"黑马商品购买趋势 - {segment}", TOP_N)


@app.callback(
    Output('heatmap-chart', 'figure'),
    Input('selected-segment', 'data')
)
def update_heatmap(segment):
    data = processor.get_heatmap_data(segment)
    return charts.create_heatmap_chart(data, f"行为时间热力图 - {segment}")


@app.callback(
    Output('drilldown-store', 'data'),
    [
        Input('top-items-sales-chart', 'clickData'),
        Input('top-categories-sales-chart', 'clickData'),
        Input('top-items-overall-chart', 'clickData'),
        Input('top-categories-overall-chart', 'clickData')
    ],
    State('selected-segment', 'data'),
    prevent_initial_call=True
)
def capture_drilldown(items_seg, cats_seg, items_all, cats_all, segment):
    ctx = callback_context
    if not ctx.triggered:
        raise PreventUpdate
    trigger = ctx.triggered[0]
    trigger_id = trigger['prop_id'].split('.')[0]
    click_data = trigger['value']
    if not click_data or not click_data.get('points'):
        raise PreventUpdate
    point = click_data['points'][0]
    raw_label = point.get('y')
    if not isinstance(raw_label, str):
        raw_label = point.get('x')
    entity_id = extract_entity_id(raw_label)
    if entity_id is None:
        raise PreventUpdate
    entity_type = 'category' if 'categories' in trigger_id else 'item'
    return {
        'type': entity_type,
        'id': entity_id,
        'label': raw_label,
        'segment': segment
    }


@app.callback(
    Output('drilldown-panel', 'is_open'),
    Output('drilldown-title', 'children'),
    Output('drilldown-graph', 'figure'),
    Input('drilldown-store', 'data'),
    Input('close-drilldown', 'n_clicks'),
    State('drilldown-panel', 'is_open'),
    prevent_initial_call=True
)
def toggle_drilldown_panel(store_data, close_clicks, is_open):
    ctx = callback_context
    if ctx.triggered and ctx.triggered[0]['prop_id'].startswith('close-drilldown'):
        return False, dash.no_update, dash.no_update
    if not store_data:
        raise PreventUpdate
    summary, timeline = processor.get_entity_event_profile(
        store_data['type'],
        store_data['id'],
        store_data.get('segment', 'All')
    )
    entity_label = "商品" if store_data['type'] == 'item' else "类别"
    title = f"{entity_label} {store_data['id']} 深度洞察"
    figure = charts.create_drilldown_detail_chart(title, summary, timeline)
    return True, title, figure


# 为Gunicorn部署提供server变量
server = app.server

if __name__ == '__main__':
    print("\n" + "="*50)
    print("应用启动中...")
    print("="*50)
    print(f"访问地址: http://127.0.0.1:8051")
    print("="*50 + "\n")
    app.run_server(debug=False, host='0.0.0.0', port=8050)

