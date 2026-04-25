# 监控服务前端对接文档

## 1. 服务说明

该服务在保留原有“定时监控 + 告警后备份/压缩”能力的基础上，新增了 HTTP API，供前端实现以下页面能力：

- 展示 CPU、内存、磁盘实时载荷
- 展示当前监控阈值
- 手动修改阈值，并立即生效
- 查看最近一次监控结果
- 手动触发一次监控

服务启动后默认提供 Swagger 文档：

- OpenAPI: `/openapi.json`
- Swagger UI: `/docs`

## 2. 基本约定

- Base URL: `http://{host}:{port}`
- API 前缀: `/api/v1`
- 请求/响应格式: `application/json`
- 时间格式: UTC 时区的 ISO-8601 字符串，例如 `2026-04-22T08:30:00.000000+00:00`
- 当前版本无鉴权，如需接入生产建议在网关层补鉴权

## 3. 前端推荐页面结构

推荐拆成两个页面或两个 Tab：

- 资源总览页
  - 展示 CPU、内存、磁盘实时使用率
  - 展示对应阈值
  - 根据 `status` 字段切换颜色
- 阈值设置页
  - 支持修改内存阈值、磁盘阈值、CPU 阈值、CPU 监控开关
  - 修改后调用保存接口即可，无需重启服务

如果页面需要“最近一次后台定时监控”的结果，使用“监控概览接口”即可。

## 4. 接口列表

### 4.1 获取系统实时总览

- 方法: `GET`
- 路径: `/api/v1/system/overview`
- 用途: 前端首页实时展示 CPU / 内存 / 磁盘载荷
- 建议刷新频率: 5 秒到 15 秒

示例响应：

```json
{
  "collected_at": "2026-04-22T08:30:00.000000+00:00",
  "cpu": {
    "usage_percent": 27.5,
    "threshold_percent": 90.0,
    "monitoring_enabled": true,
    "status": "ok",
    "cores_logical": 8,
    "cores_physical": 4
  },
  "memory": {
    "usage_percent": 61.2,
    "threshold_percent": 85.0,
    "status": "ok",
    "total_bytes": 17179869184,
    "used_bytes": 10522669875,
    "available_bytes": 6657199309
  },
  "disk": {
    "usage_percent": 72.8,
    "threshold_percent": 90.0,
    "status": "ok",
    "mount_path": "/",
    "total_bytes": 512110190592,
    "used_bytes": 372416512000,
    "free_bytes": 139693678592
  }
}
```

字段说明：

- `cpu.status`
  - `ok`: 未达到告警阈值
  - `alert`: 已达到或超过告警阈值
  - `disabled`: CPU 告警监控已关闭，但仍会返回实时 CPU 使用率供页面展示
- `memory.total_bytes / used_bytes / available_bytes`
  - 建议前端换算为 GB 展示
- `disk.total_bytes / used_bytes / free_bytes`
  - 建议前端换算为 GB 或 TB 展示

### 4.2 获取系统阈值

- 方法: `GET`
- 路径: `/api/v1/system/thresholds`
- 用途: 阈值设置页初始化表单

示例响应：

```json
{
  "system": {
    "memory_percent": 85.0,
    "disk_percent": 90.0,
    "cpu_percent": 90.0,
    "enable_cpu": true
  },
  "meta": {
    "persisted_file": "/app/runtime/thresholds_override.json",
    "has_runtime_override": true,
    "updated_at": "2026-04-22T08:20:00+00:00"
  }
}
```

字段说明：

- `has_runtime_override`
  - `false`: 当前阈值全部来自环境变量默认值
  - `true`: 当前阈值已被前端保存过，并已落盘
- `updated_at`
  - 最近一次通过接口持久化阈值的时间

### 4.3 更新系统阈值

- 方法: `PUT`
- 路径: `/api/v1/system/thresholds`
- 用途: 保存 CPU / 内存 / 磁盘阈值
- 特性: 支持部分字段更新，只传需要修改的字段

请求示例：

```json
{
  "memory_percent": 80,
  "disk_percent": 88,
  "cpu_percent": 92,
  "enable_cpu": true
}
```

示例响应：

```json
{
  "message": "System thresholds updated.",
  "data": {
    "system": {
      "memory_percent": 80.0,
      "disk_percent": 88.0,
      "cpu_percent": 92.0,
      "enable_cpu": true
    },
    "meta": {
      "persisted_file": "/app/runtime/thresholds_override.json",
      "has_runtime_override": true,
      "updated_at": "2026-04-22T08:35:00+00:00"
    }
  }
}
```

说明：

- 阈值保存后立即生效，无需重启服务
- 数据会写入 `THRESHOLDS_FILE` 指定的 JSON 文件
- 合法范围：
  - `memory_percent`: `0 ~ 100`
  - `disk_percent`: `0 ~ 100`
  - `cpu_percent`: `0 ~ 100`
  - `enable_cpu`: `true / false`

### 4.4 获取全部阈值

- 方法: `GET`
- 路径: `/api/v1/thresholds`
- 用途: 如果前端后续还需要展示数据库监控阈值，可直接调用该接口

示例响应：

```json
{
  "system": {
    "memory_percent": 85.0,
    "disk_percent": 90.0,
    "cpu_percent": 90.0,
    "enable_cpu": true
  },
  "database": {
    "active_connections": 100,
    "slow_queries": 100,
    "cache_hit_ratio": 95.0
  },
  "meta": {
    "persisted_file": "/app/runtime/thresholds_override.json",
    "has_runtime_override": true,
    "updated_at": "2026-04-22T08:20:00+00:00"
  }
}
```

### 4.5 更新全部阈值

- 方法: `PUT`
- 路径: `/api/v1/thresholds`
- 用途: 同时更新系统阈值和数据库阈值
- 特性: 支持部分更新

请求示例：

```json
{
  "system": {
    "memory_percent": 82,
    "disk_percent": 90
  },
  "database": {
    "active_connections": 120,
    "slow_queries": 200,
    "cache_hit_ratio": 96
  }
}
```

说明：

- 如果数据库可选阈值需要关闭，可传 `null`
- 例如：

```json
{
  "database": {
    "slow_queries": null,
    "cache_hit_ratio": null
  }
}
```

### 4.6 获取监控概览

- 方法: `GET`
- 路径: `/api/v1/monitor/summary`
- 用途:
  - 展示最近一次后台监控的结果
  - 展示最近一次告警列表
  - 展示最近一次数据库采集结果
  - 展示服务健康状态

示例响应：

```json
{
  "service_started_at": "2026-04-22T08:00:00+00:00",
  "monitor_interval_seconds": 3600,
  "backup_failure_count": 0,
  "health": {
    "status": "healthy",
    "timestamp": "2026-04-22T08:10:02+00:00",
    "details": {
      "last_cycle_completed_at": "2026-04-22T08:10:02+00:00",
      "alerts_count": 0,
      "trigger": "scheduled"
    }
  },
  "thresholds": {
    "system": {
      "memory_percent": 85.0,
      "disk_percent": 90.0,
      "cpu_percent": 90.0,
      "enable_cpu": true
    },
    "database": {
      "active_connections": 100,
      "slow_queries": 100,
      "cache_hit_ratio": 95.0
    },
    "meta": {
      "persisted_file": "/app/runtime/thresholds_override.json",
      "has_runtime_override": true,
      "updated_at": "2026-04-22T08:20:00+00:00"
    }
  },
  "latest_cycle": {
    "running": false,
    "status": "success",
    "trigger": "scheduled",
    "started_at": "2026-04-22T08:10:00+00:00",
    "completed_at": "2026-04-22T08:10:02+00:00",
    "duration_ms": 2100,
    "alerts": [],
    "error": null,
    "system_metrics": {
      "collected_at": "2026-04-22T08:10:01+00:00",
      "memory_percent": 61.2,
      "memory_total_bytes": 17179869184,
      "memory_used_bytes": 10522669875,
      "memory_available_bytes": 6657199309,
      "disk_percent": 72.8,
      "disk_total_bytes": 512110190592,
      "disk_used_bytes": 372416512000,
      "disk_free_bytes": 139693678592,
      "cpu_percent": 27.5,
      "cpu_cores_logical": 8,
      "cpu_cores_physical": 4
    },
    "database_metrics": {
      "vibration": {
        "active_connections": 18,
        "slow_queries": 2,
        "cache_hit_ratio": 99.3
      }
    }
  }
}
```

字段说明：

- `latest_cycle.status`
  - `idle`: 服务刚启动，尚未完成一次监控
  - `running`: 当前正在执行监控
  - `success`: 最近一次监控成功完成
  - `failed`: 最近一次监控失败
- `latest_cycle.trigger`
  - `startup`: 服务启动时自动执行
  - `scheduled`: 定时调度执行
  - `manual`: 前端手动触发执行

### 4.7 手动触发一次监控

- 方法: `POST`
- 路径: `/api/v1/monitor/run`
- 用途: 在页面上提供“立即检测”按钮

成功响应：

```json
{
  "message": "Manual monitoring cycle completed.",
  "data": {
    "...": "结构与 /api/v1/monitor/summary 一致"
  }
}
```

冲突响应：

```json
{
  "detail": "A monitoring cycle is already running."
}
```

说明：

- 如果后台已经有一个监控周期正在执行，则返回 HTTP `409`
- 前端可提示“检测任务正在执行中，请稍后重试”

### 4.8 获取健康状态

- 方法: `GET`
- 路径: `/api/v1/health`
- 用途: 运维页或前端状态角标展示

示例响应：

```json
{
  "status": "healthy",
  "timestamp": "2026-04-22T08:10:02+00:00",
  "details": {
    "last_cycle_completed_at": "2026-04-22T08:10:02+00:00",
    "alerts_count": 0,
    "trigger": "scheduled"
  }
}
```

## 5. 前端开发建议

### 5.1 展示建议

- CPU、内存、磁盘可以统一用卡片组件
- 大数字建议展示为百分比
- 字节数建议前端自行格式化为 `GB/TB`
- `status=alert` 时卡片显示红色或橙色
- `status=disabled` 时 CPU 卡片显示灰色并标注“监控已关闭”

### 5.2 刷新建议

- 实时资源总览：5 秒到 15 秒轮询一次
- 阈值配置：页面初始化加载一次，保存后重新拉取
- 监控概览：30 秒到 60 秒轮询一次，或在手动触发后主动刷新

### 5.3 错误处理建议

- `422`: 入参不合法，例如阈值超出 `0~100`
- `409`: 当前已经有监控任务在跑
- `500`: 服务内部异常，建议提示“请联系后端查看日志”

## 6. 部署侧说明

新增环境变量：

- `API_HOST`
- `API_PORT`
- `ALLOWED_ORIGINS`
- `THRESHOLDS_FILE`

其中：

- `ALLOWED_ORIGINS=*` 表示允许所有来源跨域，适合内网开发联调
- 生产环境建议改成明确的前端域名，例如：
  - `ALLOWED_ORIGINS=http://10.0.0.8:5173,https://admin.example.com`

## 7. 联调最小流程

前端可按以下顺序联调：

1. 页面初始化时调用 `GET /api/v1/system/overview`
2. 同时调用 `GET /api/v1/system/thresholds` 回填表单
3. 用户修改阈值后调用 `PUT /api/v1/system/thresholds`
4. 如果页面提供“立即检测”按钮，则调用 `POST /api/v1/monitor/run`
5. 若需要查看最近一次后台监控结果，则调用 `GET /api/v1/monitor/summary`
