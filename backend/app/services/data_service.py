"""DuckDB-powered data service."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import duckdb

from app.core.config import get_settings

settings = get_settings()


class DataService:
    """Encapsulates analytics queries against DuckDB."""

    def __init__(self) -> None:
        self.con = duckdb.connect(str(settings.duckdb_path))
        self.con.execute("PRAGMA threads=4")
        self._init_events_table()
        self._refresh_user_segments()

    def _init_events_table(self) -> None:
        table_exists = self.con.execute(
            """
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = 'events'
            """
        ).fetchone()
        if table_exists:
            return

        source: Path
        if settings.data_source.exists():
            source = settings.data_source
            reader = "read_parquet"
        else:
            source = settings.fallback_csv
            reader = "read_csv_auto"

        if not source.exists():
            raise FileNotFoundError(f"Data source not found: {source}")

        self.con.execute(
            f"""
            CREATE TABLE events AS
            SELECT *
            FROM {reader}('{source.as_posix()}')
            """
        )
        self.con.execute("CREATE INDEX idx_events_segment ON events (visitorid)")

    def _refresh_user_segments(self) -> None:
        self.con.execute("DROP TABLE IF EXISTS user_stats")
        self.con.execute(
            """
            CREATE TABLE user_stats AS
            SELECT
                visitorid,
                SUM(CASE WHEN event = 'view' THEN 1 ELSE 0 END) AS view_count,
                SUM(CASE WHEN event = 'addtocart' THEN 1 ELSE 0 END) AS addtocart_count,
                SUM(CASE WHEN event = 'transaction' THEN 1 ELSE 0 END) AS transaction_count,
                MIN(timestamp)::TIMESTAMP AS first_visit,
                MIN(CASE WHEN event = 'transaction' THEN timestamp END)::TIMESTAMP AS first_purchase
            FROM events
            GROUP BY visitorid
            """
        )
        self.con.execute("DROP TABLE IF EXISTS user_segments")
        self.con.execute(
            """
            CREATE TABLE user_segments AS
            SELECT visitorid, 'All' AS segment FROM user_stats
            UNION ALL
            SELECT
                visitorid,
                'Hesitant'
            FROM user_stats
            WHERE view_count >= 10
              AND COALESCE(transaction_count::DOUBLE / NULLIF(view_count, 0), 0) <= 0.05
            UNION ALL
            SELECT
                visitorid,
                'Impulsive'
            FROM user_stats
            WHERE transaction_count > 0
              AND view_count >= 3
              AND COALESCE(transaction_count::DOUBLE / NULLIF(view_count, 0), 0) >= 0.3
              AND COALESCE(date_diff('hour', first_visit, first_purchase), 9999) <= 24
            UNION ALL
            SELECT
                visitorid,
                'Collector'
            FROM user_stats
            WHERE transaction_count > 0
              AND addtocart_count >= 5
              AND COALESCE(transaction_count::DOUBLE / NULLIF(view_count, 0), 0) >= 0.1
            """
        )
        self.con.execute("CREATE INDEX idx_segments ON user_segments (segment, visitorid)")

    def _filtered_events(self, segment: str, date_from: str | None = None, date_to: str | None = None) -> str:
        base_query = f"""
        SELECT e.*
        FROM events e
        JOIN user_segments s
          ON e.visitorid = s.visitorid
        WHERE s.segment = '{segment}'
        """
        if date_from:
            base_query += f" AND CAST(e.timestamp AS DATE) >= '{date_from}'"
        if date_to:
            base_query += f" AND CAST(e.timestamp AS DATE) <= '{date_to}'"
        return base_query

    def get_segments(self) -> list[dict[str, Any]]:
        rows = self.con.execute(
            """
            SELECT segment, COUNT(*) AS user_count
            FROM (
                SELECT DISTINCT visitorid, segment
                FROM user_segments
            )
            GROUP BY segment
            ORDER BY segment
            """
        ).fetchall()
        return [{"segment": row[0], "user_count": int(row[1])} for row in rows]

    def get_top_entities(
        self,
        segment: str,
        metric: Literal["view", "addtocart", "transaction"],
        entity: Literal["item", "category"],
        limit: int,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict[str, Any]]:
        entity_field = "itemid" if entity == "item" else "categoryid"
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT
            {entity_field} AS entity_id,
            COUNT(*) AS value
        FROM filtered
        WHERE event = '{metric}'
        GROUP BY 1
        ORDER BY value DESC
        LIMIT {limit}
        """
        rows = self.con.execute(query).fetchall()
        label_prefix = "Item" if entity == "item" else "Category"
        return [
            {
                "entity_id": int(row[0]),
                "label": f"{label_prefix} {int(row[0])}",
                "metric": metric,
                "value": int(row[1]),
            }
            for row in rows
        ]

    def get_funnel(self, segment: str, date_from: str | None = None, date_to: str | None = None) -> list[dict[str, Any]]:
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT
            SUM(CASE WHEN event = 'view' THEN 1 ELSE 0 END) AS views,
            SUM(CASE WHEN event = 'addtocart' THEN 1 ELSE 0 END) AS carts,
            SUM(CASE WHEN event = 'transaction' THEN 1 ELSE 0 END) AS purchases
        FROM filtered
        """
        views, carts, purchases = self.con.execute(query).fetchone()
        view_count = max(int(views or 0), 1)
        return [
            {"stage": "浏览", "count": int(views or 0), "percentage": 100.0},
            {
                "stage": "加购",
                "count": int(carts or 0),
                "percentage": round((carts or 0) * 100 / view_count, 2),
            },
            {
                "stage": "购买",
                "count": int(purchases or 0),
                "percentage": round((purchases or 0) * 100 / view_count, 2),
            },
        ]

    def get_active_hours(self, segment: str, date_from: str | None = None, date_to: str | None = None) -> list[dict[str, Any]]:
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT
            EXTRACT(HOUR FROM timestamp) AS hour,
            COUNT(*) AS value
        FROM filtered
        GROUP BY hour
        ORDER BY hour
        """
        rows = self.con.execute(query).fetchall()
        return [{"hour": int(row[0]), "value": int(row[1])} for row in rows]

    def get_event_counts(self, segment: str, date_from: str | None = None, date_to: str | None = None) -> dict[str, int]:
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT event, COUNT(*) AS value
        FROM filtered
        GROUP BY event
        """
        rows = self.con.execute(query).fetchall()
        return {row[0]: int(row[1]) for row in rows}

    def get_drilldown(
        self,
        entity_type: Literal["item", "category"],
        entity_id: int,
        segment: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict[str, Any]:
        field = "itemid" if entity_type == "item" else "categoryid"
        label_prefix = "商品" if entity_type == "item" else "类别"
        query_base = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT *
        FROM filtered
        WHERE {field} = {entity_id}
        """
        # 基础统计
        summary_query = f"""
        SELECT event, COUNT(*) AS value
        FROM ({query_base})
        GROUP BY event
        """
        summary_rows = self.con.execute(summary_query).fetchall()
        summary = {row[0]: int(row[1]) for row in summary_rows}
        
        # 计算转化率
        view_count = summary.get("view", 0)
        cart_count = summary.get("addtocart", 0)
        purchase_count = summary.get("transaction", 0)
        
        conversion_rates = {
            "view_to_cart": round((cart_count / view_count * 100) if view_count > 0 else 0, 2),
            "cart_to_purchase": round((purchase_count / cart_count * 100) if cart_count > 0 else 0, 2),
            "view_to_purchase": round((purchase_count / view_count * 100) if view_count > 0 else 0, 2),
        }
        
        # 时间序列数据（周度）
        series_query = f"""
        SELECT
            date_trunc('week', timestamp) AS period,
            event,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY 1, 2
        ORDER BY period
        """
        series_rows = self.con.execute(series_query).fetchall()
        series_map: dict[str, list[dict[str, Any]]] = {}
        for period, event, value in series_rows:
            key = event
            # period 已经是 date 类型（date_trunc 返回 date），直接转换为字符串
            series_map.setdefault(key, []).append({"period": str(period), "value": int(value)})
        
        # 活跃时间段分布
        hourly_query = f"""
        SELECT
            EXTRACT(HOUR FROM timestamp) AS hour,
            COUNT(*) AS count
        FROM ({query_base})
        GROUP BY hour
        ORDER BY hour
        """
        hourly_rows = self.con.execute(hourly_query).fetchall()
        hourly_distribution = [{"hour": int(row[0]), "count": int(row[1])} for row in hourly_rows]
        
        # 转化漏斗
        funnel_stages = [
            {"stage": "浏览", "count": view_count, "percentage": 100.0},
            {"stage": "加购", "count": cart_count, "percentage": conversion_rates["view_to_cart"]},
            {"stage": "购买", "count": purchase_count, "percentage": conversion_rates["view_to_purchase"]},
        ]

        return {
            "entity_id": entity_id,
            "entity_label": f"{label_prefix} {entity_id}",
            "segment": segment,
            "summary": summary,
            "series": [
                {"label": event, "data": points} for event, points in series_map.items()
            ],
            "conversion_rates": conversion_rates,
            "hourly_distribution": hourly_distribution,
            "funnel": funnel_stages,
        }

    def get_funnel_stage_detail(
        self,
        stage: Literal["view", "addtocart", "transaction"],
        segment: str,
        top_n: int = 10,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict[str, Any]:
        """获取漏斗阶段的详细分析数据"""
        stage_mapping = {
            "view": "浏览",
            "addtocart": "加购",
            "transaction": "购买",
        }
        stage_label = stage_mapping[stage]
        
        query_base = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT *
        FROM filtered
        WHERE event = '{stage}'
        """
        
        # 基础统计
        count_query = f"SELECT COUNT(*) FROM ({query_base})"
        count = int(self.con.execute(count_query).fetchone()[0])
        
        # 获取整体漏斗数据以计算百分比
        funnel_data = self.get_funnel(segment, date_from, date_to)
        total_views = funnel_data[0]["count"] if funnel_data else 1
        percentage = round((count * 100 / total_views), 2) if total_views > 0 else 0
        
        # 时间序列数据（周度）
        series_query = f"""
        SELECT
            date_trunc('week', timestamp) AS period,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY period
        ORDER BY period
        """
        series_rows = self.con.execute(series_query).fetchall()
        time_series = [
            {"label": stage, "data": [{"period": str(row[0]), "value": int(row[1])} for row in series_rows]}
        ]
        
        # 活跃时间段分布
        hourly_query = f"""
        SELECT
            EXTRACT(HOUR FROM timestamp) AS hour,
            COUNT(*) AS count
        FROM ({query_base})
        GROUP BY hour
        ORDER BY hour
        """
        hourly_rows = self.con.execute(hourly_query).fetchall()
        hourly_distribution = [{"hour": int(row[0]), "count": int(row[1])} for row in hourly_rows]
        
        # Top 商品
        top_items_query = f"""
        SELECT
            itemid AS entity_id,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY itemid
        ORDER BY value DESC
        LIMIT {top_n}
        """
        top_items_rows = self.con.execute(top_items_query).fetchall()
        top_items = [
            {
                "entity_id": int(row[0]),
                "label": f"Item {int(row[0])}",
                "metric": stage,
                "value": int(row[1]),
            }
            for row in top_items_rows
        ]
        
        # Top 类别
        top_categories_query = f"""
        SELECT
            categoryid AS entity_id,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY categoryid
        ORDER BY value DESC
        LIMIT {top_n}
        """
        top_categories_rows = self.con.execute(top_categories_query).fetchall()
        top_categories = [
            {
                "entity_id": int(row[0]),
                "label": f"Category {int(row[0])}",
                "metric": stage,
                "value": int(row[1]),
            }
            for row in top_categories_rows
        ]
        
        # 用户群体分布（该阶段中各用户群体的占比）
        user_segment_query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        stage_events AS (
            SELECT DISTINCT visitorid
            FROM filtered
            WHERE event = '{stage}'
        )
        SELECT
            s.segment,
            COUNT(DISTINCT se.visitorid) AS count
        FROM stage_events se
        JOIN user_segments s ON se.visitorid = s.visitorid
        GROUP BY s.segment
        """
        user_segment_rows = self.con.execute(user_segment_query).fetchall()
        user_segment_distribution = {row[0]: int(row[1]) for row in user_segment_rows}
        
        # 流失分析（如果不是第一阶段）
        dropoff_analysis = None
        if stage == "addtocart":
            # 从浏览到加购的流失分析
            dropoff_query = f"""
            WITH filtered AS (
                {self._filtered_events(segment, date_from, date_to)}
            ),
            views AS (
                SELECT COUNT(DISTINCT visitorid) AS count
                FROM filtered
                WHERE event = 'view'
            ),
            carts AS (
                SELECT COUNT(DISTINCT visitorid) AS count
                FROM filtered
                WHERE event = 'addtocart'
            )
            SELECT
                (SELECT count FROM views) AS from_count,
                (SELECT count FROM carts) AS to_count
            """
            dropoff_row = self.con.execute(dropoff_query).fetchone()
            if dropoff_row:
                from_count = int(dropoff_row[0])
                to_count = int(dropoff_row[1])
                dropoff_analysis = {
                    "from_stage": "浏览",
                    "to_stage": "加购",
                    "from_count": from_count,
                    "to_count": to_count,
                    "dropoff_count": from_count - to_count,
                    "dropoff_rate": round(((from_count - to_count) * 100 / from_count) if from_count > 0 else 0, 2),
                    "conversion_rate": round((to_count * 100 / from_count) if from_count > 0 else 0, 2),
                }
        elif stage == "transaction":
            # 从加购到购买的流失分析
            dropoff_query = f"""
            WITH filtered AS (
                {self._filtered_events(segment, date_from, date_to)}
            ),
            carts AS (
                SELECT COUNT(DISTINCT visitorid) AS count
                FROM filtered
                WHERE event = 'addtocart'
            ),
            purchases AS (
                SELECT COUNT(DISTINCT visitorid) AS count
                FROM filtered
                WHERE event = 'transaction'
            )
            SELECT
                (SELECT count FROM carts) AS from_count,
                (SELECT count FROM purchases) AS to_count
            """
            dropoff_row = self.con.execute(dropoff_query).fetchone()
            if dropoff_row:
                from_count = int(dropoff_row[0])
                to_count = int(dropoff_row[1])
                dropoff_analysis = {
                    "from_stage": "加购",
                    "to_stage": "购买",
                    "from_count": from_count,
                    "to_count": to_count,
                    "dropoff_count": from_count - to_count,
                    "dropoff_rate": round(((from_count - to_count) * 100 / from_count) if from_count > 0 else 0, 2),
                    "conversion_rate": round((to_count * 100 / from_count) if from_count > 0 else 0, 2),
                }
        
        return {
            "stage": stage,
            "stage_label": stage_label,
            "segment": segment,
            "count": count,
            "percentage": percentage,
            "time_series": time_series,
            "hourly_distribution": hourly_distribution,
            "top_items": top_items,
            "top_categories": top_categories,
            "user_segment_distribution": user_segment_distribution,
            "dropoff_analysis": dropoff_analysis,
        }

    def get_active_hour_detail(
        self,
        hour: int,
        segment: str,
        top_n: int = 10,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict[str, Any]:
        """获取指定时间段的详细分析数据"""
        if hour < 0 or hour > 23:
            raise ValueError("hour must be between 0 and 23")
        
        query_base = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        )
        SELECT *
        FROM filtered
        WHERE EXTRACT(HOUR FROM timestamp) = {hour}
        """
        
        # 基础统计
        count_query = f"SELECT COUNT(*) FROM ({query_base})"
        total_count = int(self.con.execute(count_query).fetchone()[0])
        
        # 获取全天总数以计算百分比
        all_hours = self.get_active_hours(segment, date_from, date_to)
        total_day = sum(h["value"] for h in all_hours)
        percentage_of_day = round((total_count * 100 / total_day) if total_day > 0 else 0, 2)
        
        # 事件类型分布
        event_query = f"""
        SELECT event, COUNT(*) AS value
        FROM ({query_base})
        GROUP BY event
        """
        event_rows = self.con.execute(event_query).fetchall()
        event_distribution = {row[0]: int(row[1]) for row in event_rows}
        
        # 计算转化率
        view_count = event_distribution.get("view", 0)
        cart_count = event_distribution.get("addtocart", 0)
        purchase_count = event_distribution.get("transaction", 0)
        
        conversion_rates = {
            "view_to_cart": round((cart_count / view_count * 100) if view_count > 0 else 0, 2),
            "cart_to_purchase": round((purchase_count / cart_count * 100) if cart_count > 0 else 0, 2),
            "view_to_purchase": round((purchase_count / view_count * 100) if view_count > 0 else 0, 2),
        }
        
        # 转化漏斗
        funnel_stages = [
            {"stage": "浏览", "count": view_count, "percentage": 100.0},
            {"stage": "加购", "count": cart_count, "percentage": conversion_rates["view_to_cart"]},
            {"stage": "购买", "count": purchase_count, "percentage": conversion_rates["view_to_purchase"]},
        ]
        
        # 时间序列数据（周度）
        series_query = f"""
        SELECT
            date_trunc('week', timestamp) AS period,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY period
        ORDER BY period
        """
        series_rows = self.con.execute(series_query).fetchall()
        time_series = [
            {"label": "活动量", "data": [{"period": str(row[0]), "value": int(row[1])} for row in series_rows]}
        ]
        
        # Top 商品
        top_items_query = f"""
        SELECT
            itemid AS entity_id,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY itemid
        ORDER BY value DESC
        LIMIT {top_n}
        """
        top_items_rows = self.con.execute(top_items_query).fetchall()
        top_items = [
            {
                "entity_id": int(row[0]),
                "label": f"Item {int(row[0])}",
                "metric": "view",  # 默认使用 view，实际可以统计所有事件
                "value": int(row[1]),
            }
            for row in top_items_rows
        ]
        
        # Top 类别
        top_categories_query = f"""
        SELECT
            categoryid AS entity_id,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY categoryid
        ORDER BY value DESC
        LIMIT {top_n}
        """
        top_categories_rows = self.con.execute(top_categories_query).fetchall()
        top_categories = [
            {
                "entity_id": int(row[0]),
                "label": f"Category {int(row[0])}",
                "metric": "view",
                "value": int(row[1]),
            }
            for row in top_categories_rows
        ]
        
        # 用户群体分布
        user_segment_query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        hour_events AS (
            SELECT DISTINCT visitorid
            FROM filtered
            WHERE EXTRACT(HOUR FROM timestamp) = {hour}
        )
        SELECT
            s.segment,
            COUNT(DISTINCT he.visitorid) AS count
        FROM hour_events he
        JOIN user_segments s ON he.visitorid = s.visitorid
        GROUP BY s.segment
        """
        user_segment_rows = self.con.execute(user_segment_query).fetchall()
        user_segment_distribution = {row[0]: int(row[1]) for row in user_segment_rows}
        
        # 与相邻时间段和平均值对比
        prev_hour = (hour - 1) % 24
        next_hour = (hour + 1) % 24
        avg_per_hour = total_day / 24 if total_day > 0 else 0
        
        prev_hour_count = next((h["value"] for h in all_hours if h["hour"] == prev_hour), 0)
        next_hour_count = next((h["value"] for h in all_hours if h["hour"] == next_hour), 0)
        current_hour_count = next((h["value"] for h in all_hours if h["hour"] == hour), 0)
        
        comparison = {
            "prev_hour": {
                "hour": prev_hour,
                "count": prev_hour_count,
                "diff": current_hour_count - prev_hour_count,
                "diff_percentage": round(
                    ((current_hour_count - prev_hour_count) * 100 / prev_hour_count)
                    if prev_hour_count > 0 else 0,
                    2
                ),
            },
            "next_hour": {
                "hour": next_hour,
                "count": next_hour_count,
                "diff": current_hour_count - next_hour_count,
                "diff_percentage": round(
                    ((current_hour_count - next_hour_count) * 100 / next_hour_count)
                    if next_hour_count > 0 else 0,
                    2
                ),
            },
            "average": {
                "count": round(avg_per_hour, 2),
                "diff": current_hour_count - avg_per_hour,
                "diff_percentage": round(
                    ((current_hour_count - avg_per_hour) * 100 / avg_per_hour)
                    if avg_per_hour > 0 else 0,
                    2
                ),
            },
            "is_peak": current_hour_count > avg_per_hour * 1.2,  # 超过平均值20%视为峰值
            "is_valley": current_hour_count < avg_per_hour * 0.8,  # 低于平均值20%视为低谷
        }
        
        return {
            "hour": hour,
            "segment": segment,
            "total_count": total_count,
            "percentage_of_day": percentage_of_day,
            "event_distribution": event_distribution,
            "conversion_rates": conversion_rates,
            "funnel": funnel_stages,
            "time_series": time_series,
            "top_items": top_items,
            "top_categories": top_categories,
            "user_segment_distribution": user_segment_distribution,
            "comparison": comparison,
        }

    def get_monthly_retention(
        self,
        segment: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict[str, Any]]:
        """获取月度用户留存率数据
        
        计算逻辑：
        1. 找出每个用户的首次访问月份（cohort month）
        2. 对于每个cohort，计算后续每个月的留存用户数和留存率
        3. 返回每个cohort每月的留存率数据
        """
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        -- 计算每个用户的首次访问月份
        user_first_month AS (
            SELECT
                visitorid,
                DATE_TRUNC('month', MIN(CAST(timestamp AS DATE))) AS first_month
            FROM filtered
            GROUP BY visitorid
        ),
        -- 获取所有用户在数据范围内的访问月份
        user_month_activity AS (
            SELECT DISTINCT
                e.visitorid,
                DATE_TRUNC('month', CAST(e.timestamp AS DATE)) AS activity_month
            FROM filtered e
        ),
        -- 合并首次访问月份和活动月份
        user_cohorts AS (
            SELECT
                uma.visitorid,
                ufm.first_month AS cohort_month,
                uma.activity_month AS activity_month,
                EXTRACT(YEAR FROM uma.activity_month) * 12 + EXTRACT(MONTH FROM uma.activity_month) -
                (EXTRACT(YEAR FROM ufm.first_month) * 12 + EXTRACT(MONTH FROM ufm.first_month)) AS month_diff
            FROM user_month_activity uma
            JOIN user_first_month ufm ON uma.visitorid = ufm.visitorid
            WHERE uma.activity_month >= ufm.first_month
        ),
        -- 计算每个cohort每个月的用户数，同时保留实际月份信息
        cohort_month_counts AS (
            SELECT
                cohort_month,
                month_diff,
                activity_month,
                COUNT(DISTINCT visitorid) AS user_count
            FROM user_cohorts
            GROUP BY cohort_month, month_diff, activity_month
        ),
        -- 计算每个cohort的初始用户数（month_diff = 0）
        -- 对于month_diff=0，activity_month应该等于cohort_month，所以使用MAX确保获取一个值
        cohort_sizes AS (
            SELECT
                cohort_month,
                MAX(user_count) AS cohort_size
            FROM cohort_month_counts
            WHERE month_diff = 0
            GROUP BY cohort_month
        ),
        -- 计算每个实际月份的总活跃用户数（从user_cohorts直接计算，去重）
        monthly_active_users AS (
            SELECT
                activity_month::DATE AS actual_month,
                COUNT(DISTINCT visitorid) AS total_active_users
            FROM user_cohorts
            GROUP BY activity_month
        ),
        -- 计算留存率数据，使用cohort_month_counts中已有的activity_month
        retention_data AS (
            SELECT
                c.cohort_month::DATE AS cohort_month,
                c.month_diff,
                c.activity_month::DATE AS actual_month,
                c.user_count,
                cs.cohort_size,
                CASE 
                    WHEN cs.cohort_size > 0 
                    THEN ROUND((c.user_count::DOUBLE / cs.cohort_size::DOUBLE) * 100, 2)
                    ELSE 0.0
                END AS retention_rate
            FROM cohort_month_counts c
            JOIN cohort_sizes cs ON c.cohort_month = cs.cohort_month
        )
        -- 返回留存数据并关联实际月份的活跃用户数
        SELECT
            rd.cohort_month,
            rd.month_diff,
            rd.user_count,
            rd.cohort_size,
            rd.retention_rate,
            rd.actual_month,
            COALESCE(mau.total_active_users, 0) AS monthly_active_users
        FROM retention_data rd
        LEFT JOIN monthly_active_users mau ON rd.actual_month = mau.actual_month
        ORDER BY rd.cohort_month, rd.month_diff
        """
        rows = self.con.execute(query).fetchall()
        return [
            {
                "cohort_month": str(row[0]),
                "month_diff": int(row[1]),
                "user_count": int(row[2]),
                "cohort_size": int(row[3]),
                "retention_rate": float(row[4]),
                "actual_month": str(row[5]),
                "monthly_active_users": int(row[6]),
            }
            for row in rows
        ]


    def get_weekday_users(
        self,
        segment: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict[str, Any]:
        """获取周一到周日的用户数统计
        
        计算逻辑：
        1. 按星期几分组，统计每个星期几的独立用户数（去重）
        2. 计算工作日（周一到周五）的平均用户数
        3. 计算周末（周六、周日）的平均用户数
        """
        query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        -- 提取每个用户在每个日期和星期几的唯一记录
        weekday_data AS (
            SELECT DISTINCT
                visitorid,
                CAST(timestamp AS DATE) AS visit_date,
                EXTRACT(DOW FROM timestamp) AS day_of_week_raw
            FROM filtered
        ),
        -- 转换为标准星期几格式（1=周一，2=周二，...7=周日）
        weekday_normalized AS (
            SELECT
                visitorid,
                visit_date,
                CASE 
                    WHEN day_of_week_raw = 0 THEN 7  -- 周日 -> 7
                    ELSE day_of_week_raw::INTEGER  -- 周一(1)到周六(6)
                END AS weekday
            FROM weekday_data
        ),
        -- 按星期几统计独立用户数
        weekday_counts AS (
            SELECT
                weekday,
                COUNT(DISTINCT visitorid) AS user_count
            FROM weekday_normalized
            GROUP BY weekday
        ),
        -- 计算工作日平均（周一到周五）
        weekday_avg AS (
            SELECT COALESCE(AVG(user_count), 0) AS avg_users
            FROM weekday_counts
            WHERE weekday BETWEEN 1 AND 5
        ),
        -- 计算周末平均（周六、周日）
        weekend_avg AS (
            SELECT COALESCE(AVG(user_count), 0) AS avg_users
            FROM weekday_counts
            WHERE weekday IN (6, 7)
        )
        SELECT
            wc.weekday,
            wc.user_count,
            (SELECT avg_users FROM weekday_avg) AS weekday_avg,
            (SELECT avg_users FROM weekend_avg) AS weekend_avg
        FROM weekday_counts wc
        ORDER BY wc.weekday
        """
        rows = self.con.execute(query).fetchall()
        
        # 获取平均值（从第一行读取，因为所有行的平均值相同）
        weekday_avg = float(rows[0][2]) if rows and rows[0][2] is not None else 0
        weekend_avg = float(rows[0][3]) if rows and rows[0][3] is not None else 0
        
        # 构建结果
        weekday_names = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        weekday_data_map = {row[0]: int(row[1]) for row in rows}
        
        # 确保所有7天都有数据，缺失的补0
        result_data = []
        for i in range(1, 8):
            result_data.append({
                "weekday": i,
                "weekday_name": weekday_names[i],
                "user_count": weekday_data_map.get(i, 0),
            })
        
        return {
            "data": result_data,
            "weekday_avg": round(weekday_avg, 2),
            "weekend_avg": round(weekend_avg, 2),
        }

    def get_cohort_detail(
        self,
        cohort_month: str,
        segment: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict[str, Any]:
        """获取指定cohort的详细分析数据
        
        Args:
            cohort_month: cohort月份，格式为 'YYYY-MM' 或 'YYYY-MM-DD'
            segment: 用户群体
            date_from: 开始日期（可选）
            date_to: 结束日期（可选）
        
        Returns:
            包含cohort详细信息的字典
        """
        # 确保cohort_month格式正确（转换为日期格式以便查询）
        try:
            # 如果是 'YYYY-MM' 格式，转换为 'YYYY-MM-01'
            if len(cohort_month) == 7:
                cohort_month_date = f"{cohort_month}-01"
            else:
                cohort_month_date = cohort_month
        except Exception:
            raise ValueError(f"Invalid cohort_month format: {cohort_month}")
        
        query_base = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        -- 找到cohort的所有用户（首次访问月份为该cohort_month）
        user_first_month AS (
            SELECT
                visitorid,
                DATE_TRUNC('month', MIN(CAST(timestamp AS DATE))) AS first_month
            FROM filtered
            GROUP BY visitorid
        ),
        -- 获取该cohort的用户列表
        cohort_users AS (
            SELECT DISTINCT visitorid
            FROM user_first_month
            WHERE DATE_TRUNC('month', first_month) = DATE_TRUNC('month', CAST('{cohort_month_date}' AS DATE))
        ),
        -- 获取cohort用户的所有事件
        cohort_events AS (
            SELECT e.*
            FROM filtered e
            JOIN cohort_users cu ON e.visitorid = cu.visitorid
        )
        SELECT *
        FROM cohort_events
        """
        
        # 获取cohort的基本信息（cohort_size等）
        cohort_info_query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        user_first_month AS (
            SELECT
                visitorid,
                DATE_TRUNC('month', MIN(CAST(timestamp AS DATE))) AS first_month
            FROM filtered
            GROUP BY visitorid
        ),
        cohort_users AS (
            SELECT DISTINCT visitorid
            FROM user_first_month
            WHERE DATE_TRUNC('month', first_month) = DATE_TRUNC('month', CAST('{cohort_month_date}' AS DATE))
        )
        SELECT COUNT(DISTINCT visitorid) AS cohort_size
        FROM cohort_users
        """
        cohort_size_row = self.con.execute(cohort_info_query).fetchone()
        cohort_size = int(cohort_size_row[0]) if cohort_size_row else 0
        
        # 获取当前留存用户数（在选定日期范围内仍有活动的用户）
        current_active_query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        user_first_month AS (
            SELECT
                visitorid,
                DATE_TRUNC('month', MIN(CAST(timestamp AS DATE))) AS first_month
            FROM filtered
            GROUP BY visitorid
        ),
        cohort_users AS (
            SELECT DISTINCT visitorid
            FROM user_first_month
            WHERE DATE_TRUNC('month', first_month) = DATE_TRUNC('month', CAST('{cohort_month_date}' AS DATE))
        )
        SELECT COUNT(DISTINCT e.visitorid) AS active_users
        FROM filtered e
        JOIN cohort_users cu ON e.visitorid = cu.visitorid
        """
        current_active_row = self.con.execute(current_active_query).fetchone()
        current_active_users = int(current_active_row[0]) if current_active_row else 0
        current_retention_rate = round((current_active_users * 100 / cohort_size) if cohort_size > 0 else 0, 2)
        
        # 基础统计（事件计数）
        summary_query = f"""
        SELECT event, COUNT(*) AS value
        FROM ({query_base})
        GROUP BY event
        """
        summary_rows = self.con.execute(summary_query).fetchall()
        summary = {row[0]: int(row[1]) for row in summary_rows}
        
        # 计算转化率
        view_count = summary.get("view", 0)
        cart_count = summary.get("addtocart", 0)
        purchase_count = summary.get("transaction", 0)
        
        conversion_rates = {
            "view_to_cart": round((cart_count / view_count * 100) if view_count > 0 else 0, 2),
            "cart_to_purchase": round((purchase_count / cart_count * 100) if cart_count > 0 else 0, 2),
            "view_to_purchase": round((purchase_count / view_count * 100) if view_count > 0 else 0, 2),
        }
        
        # 时间序列数据（周度）
        series_query = f"""
        SELECT
            date_trunc('week', timestamp) AS period,
            event,
            COUNT(*) AS value
        FROM ({query_base})
        GROUP BY 1, 2
        ORDER BY period
        """
        series_rows = self.con.execute(series_query).fetchall()
        series_map: dict[str, list[dict[str, Any]]] = {}
        for period, event, value in series_rows:
            series_map.setdefault(event, []).append({"period": str(period), "value": int(value)})
        
        # 活跃时间段分布
        hourly_query = f"""
        SELECT
            EXTRACT(HOUR FROM timestamp) AS hour,
            COUNT(*) AS count
        FROM ({query_base})
        GROUP BY hour
        ORDER BY hour
        """
        hourly_rows = self.con.execute(hourly_query).fetchall()
        hourly_distribution = [{"hour": int(row[0]), "count": int(row[1])} for row in hourly_rows]
        
        # 转化漏斗
        funnel_stages = [
            {"stage": "浏览", "count": view_count, "percentage": 100.0},
            {"stage": "加购", "count": cart_count, "percentage": conversion_rates["view_to_cart"]},
            {"stage": "购买", "count": purchase_count, "percentage": conversion_rates["view_to_purchase"]},
        ]
        
        # 用户群体分布（该cohort中各用户细分群体的分布）
        user_segment_query = f"""
        WITH filtered AS (
            {self._filtered_events(segment, date_from, date_to)}
        ),
        user_first_month AS (
            SELECT
                visitorid,
                DATE_TRUNC('month', MIN(CAST(timestamp AS DATE))) AS first_month
            FROM filtered
            GROUP BY visitorid
        ),
        cohort_users AS (
            SELECT DISTINCT visitorid
            FROM user_first_month
            WHERE DATE_TRUNC('month', first_month) = DATE_TRUNC('month', CAST('{cohort_month_date}' AS DATE))
        )
        SELECT
            s.segment,
            COUNT(DISTINCT cu.visitorid) AS count
        FROM cohort_users cu
        JOIN user_segments s ON cu.visitorid = s.visitorid
        GROUP BY s.segment
        """
        user_segment_rows = self.con.execute(user_segment_query).fetchall()
        user_segment_distribution = {row[0]: int(row[1]) for row in user_segment_rows}
        
        # 格式化cohort月份显示名称
        cohort_display = cohort_month[:7] if len(cohort_month) > 7 else cohort_month
        
        return {
            "cohort_month": cohort_display,
            "cohort_size": cohort_size,
            "current_active_users": current_active_users,
            "current_retention_rate": current_retention_rate,
            "segment": segment,
            "summary": summary,
            "series": [
                {"label": event, "data": points} for event, points in series_map.items()
            ],
            "conversion_rates": conversion_rates,
            "hourly_distribution": hourly_distribution,
            "funnel": funnel_stages,
            "user_segment_distribution": user_segment_distribution,
        }


@lru_cache
def get_data_service() -> DataService:
    return DataService()

