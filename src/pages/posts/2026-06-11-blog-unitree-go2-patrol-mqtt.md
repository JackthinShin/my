---
title: "宇树 GO2 巡检系统全记录 — MQTT 控制、调试踩坑与现场实况"
date: 2026-06-11
draft: false
categories:
  - Blog
tags:
  - 宇树 GO2
  - MQTT
  - SLAM
  - MinIO
  - RTMP
---

# 宇树 GO2 巡检系统全记录 — MQTT 控制、调试踩坑与现场实况

---

## 1. 项目介绍

宇树 Go2 机器狗的一套巡检程序。原来只能做基础运动（前进后退、趴下站起），手机 App 就能控。现在加了一层，让它能干三件正经事：

- **自主建图导航** — 走一遍就能把环境扫成地图，之后可以沿着设定路线自动巡逻
- **远程运动控制** — 不限于基础运动，还能切步态（灵动模式、跑步、避障等）
- **拍照回传 + 实时视频** — 拍的照片自动存到远端存储，摄像头画面实时推流

整个通信链路长这样：

```
你的手机/电脑
     │
     ▼  MQTT 指令
jiaoyujidi.work:1883
     │
     ▼
巡检程序 (跑在机器狗上)
     │
     ├─→ DDS → 机器狗运动控制
     ├─→ MinIO → 照片存档
     └─→ RTMP → 视频流
```

配合后端存储（MinIO）和视频推流（RTMP），基本凑齐了一套远程巡检系统的骨架。

---

## 2. 怎么跟它说话 — MQTT 接口协议

整个系统的通信走 MQTT，一台公网 broker 做中转。

### 基础信息

| 项目 | 值 |
|------|-----|
| MQTT 服务器 | jiaoyujidi.work:1883 |
| 指令发送 Topic | `thing/product/device_01/services` |
| 指令回复 Topic | `thing/product/device_01/services_reply` |
| 事件上报 Topic | `thing/product/device_01/events` |
| 状态上报 Topic | `thing/product/device_01/osd` |
| Client ID | `robot_dog` |

### 指令格式

发一条指令就是往 services topic 丢一段 JSON：

```json
{"method": "方法名", "data": {参数...}}
```

机器狗处理完会往 services_reply topic 吐回复：

```json
{"method": "方法名", "data": {"result": 0, "text": "操作成功描述"}}
```

`result` 为 0 表示成功，-1 表示失败，其他值看具体场景。

### 有哪些功能

method 按功能分三大类：

**姿态与运动控制** — 让狗做动作。包括趴下放松（damp）、站起来（standup）、站稳（balancestand）、恢复站立（recoverystand）、趴下（standdown）、前后左右移动（move）、急停（stopmove）。还有步态切换：灵动模式（freewalk）、跑步（trotrun）、行走（staticwalk）、并腿跑（freebound）、避障（freeavoid）、跳跃（freejump）、节能续航（economicgait）等。

**建图与导航** — 巡检核心功能。建图流程：开始建图（slam_mapping_start）→ 走动采集 → 结束建图并自动上传地图（slam_mapping_end）。导航流程：加载地图和拓扑点（slam_navigation_prepare）→ 重定位（slam_relocalization）→ 执行导航（slam_navigation_execute），过程中可以暂停（pause）、恢复（resume）、停止（stop）。还支持采集当前位姿作为拓扑点（slam_collect_node_edge），可以保存到文件或清除。

**其他** — 拍照（take_photo），拍完自动上传 MinIO。

### 标准操作流程

**建图：**
1. 让狗站起来（balancestand 或 standup）
2. 进入灵动模式（freewalk），方便遥控走动
3. 开始建图（slam_mapping_start），给个任务 ID
4. 控制狗在目标区域走动，SLAM 自动采集点云
5. 结束建图（slam_mapping_end），地图自动保存并上传 MinIO

**导航：**
1. 让狗站起来
2. 加载之前建好的地图和拓扑点（slam_navigation_prepare）
3. 重定位（slam_relocalization），让狗知道自己在哪
4. 执行导航（slam_navigation_execute），狗按拓扑路线走
5. 走完或需要中断就停止（slam_navigation_stop）

---

## 3. 调试踩坑

### 坑 1：SLAM 脚本启动 0.5 秒就挂了

第一次跑程序的时候，日志显示 slam_script 的进程刚启动就被杀了：

```
[ScriptManager] Script 'slam_script' started with PID 5236
[ScriptManager] Script 'slam_script' (PID 5236) kiiled with status 0
```

中间隔了不到半秒。lidar_script 倒是好好的。

排查时直接跑 unitree_slam 看了一下，发现它崩溃在日志目录的权限上。程序启动后想写 `/unitree/module/unitree_slam/bin/logs/slam_server/`，但那个目录权限不够，`std::filesystem::filesystem_error` 抛异常，直接 SIGABRT 了。

修起来倒是简单，到机器狗上跑一行：

```bash
sudo chmod -R 777 /unitree/module/unitree_slam/bin/logs/
```

再启动就正常了。

### 坑 2：让狗站起来失败了

测试运动控制的时候发了 balancestand，返回了：

```json
{"data":{"result":-1,"text":"平衡站立失败"},"method":"sport_control_balancestand"}
```

想了半天，狗当时处于 Damp（趴下放松）状态，四条腿完全松弛贴地。这个状态下直接调 BalanceStand 是不行的——BalanceStand 是在已站立姿态下调整平衡，而不是从趴着直接站起来。

正确的顺序是：

```
Damp (趴下) → StandUp (先站起来) → BalanceStand (再站稳)
```

先发 standup 让狗站起来，然后再发 balancestand 调整姿态，就成功了。

### 彩蛋

代码里把 "killed" 拼成了 **"kiiled"**。不影响功能，但每次看到日志都得多看一眼。

---

## 4. 现场实况

机器狗和开发机在同一个局域网里：

| 设备 | IP 地址 |
|------|---------|
| 开发机 (PC) | 192.168.123.29 |
| 机器狗板载电脑 (eth0) | 192.168.123.18 |
| 机器狗板载电脑 (默认) | 192.168.123.161 |

从开发机 ping 机器狗延迟大概 1.4ms，SSH 直连没问题。

外网服务：

| 服务 | 地址 | 用途 |
|------|------|------|
| MQTT Broker | jiaoyujidi.work:1883 | 指令中转 |
| MinIO | 112.6.203.2:446 | 照片、地图文件存储 |
| RTMP 服务器 | 27.223.85.130:3519 | 视频推流 |

机器狗通过板载电脑的 eth0 网口连接到局域网，配置文件里指定了 `networkInterface: eth0`。

---

## 5. 下一步

命令行发 MQTT 指令始终是调试阶段的东西。后面几个方向：

- **Web 面板** — 已经在搭了。FastAPI 后端 + 前端页面，在浏览器里点按钮就能发指令、看照片、看实时视频。后端已经写好了，前端还没做完。
- **定时巡检** — 用 cron 定时触发的逻辑，到点自动发导航指令，狗自己走一圈。
- **异常检测** — 配合摄像头和传感器，检测到异常自动拍照上传并告警。

本质上，现在每一条命令行里敲的 MQTT 指令，后面就是 App 或网页里的一个按钮。

---

## 附录：完整 MQTT 指令参考

以下所有 method 和参数结构均从项目源代码中提取。

### A. 姿态控制

| method | data 参数 | 说明 |
|--------|-----------|------|
| `sport_control_damp` | `{}` | 阻尼模式，趴下放松 |
| `sport_control_balancestand` | `{}` | 平衡站立（需先 standup） |
| `sport_control_recoverystand` | `{}` | 从躺倒恢复站立 |
| `sport_control_standup` | `{}` | 从坐/趴到站起来 |
| `sport_control_standdown` | `{}` | 从站到趴下 |

### B. 移动控制

| method | data 参数 | 说明 |
|--------|-----------|------|
| `sport_control_move` | `{"vx":float, "vy":float, "vyaw":float}` | 移动：前后(m/s)、左右(m/s)、转向(rad/s) |
| `sport_control_stopmove` | `{}` | 急停 |
| `sport_control_speedlevel` | `{"level":int}` | 设置速度等级 |
| `sport_control_switchjoystick` | `{"flag":bool}` | 切换摇杆模式 |

### C. 步态模式

| method | data 参数 | 说明 |
|--------|-----------|------|
| `sport_control_freewalk` | `{}` | 灵动/自由行走模式 |
| `sport_control_freebound` | `{"flag":bool}` | 并腿跑 |
| `sport_control_freejump` | `{"flag":bool}` | 跳跃模式 |
| `sport_control_freeavoid` | `{"flag":bool}` | 避障模式 |
| `sport_control_autorecoverset` | `{"flag":bool}` | 自动翻身 |
| `sport_control_classicwalk` | `{"flag":bool}` | 经典步态 |
| `sport_control_trotrun` | `{}` | 常规跑步 |
| `sport_control_staticwalk` | `{}` | 常规行走 |
| `sport_control_economicgait` | `{}` | 节能续航步态 |

### D. SLAM 建图

| method | data 参数 | 说明 |
|--------|-----------|------|
| `slam_mapping_start` | `{"slam_mapping_id":"string"}` | 开始建图，ID 自定义 |
| `slam_mapping_end` | `{"slam_mapping_id":"string"}` | 结束建图，自动上传 PCD 到 MinIO |

### E. 拓扑点采集

| method | data 参数 | 说明 |
|--------|-----------|------|
| `slam_collect_node_edge` | `{"slam_navigation_id":"","slam_mapping_id":"","slam_topo_id":"","mode":int,"speed":float}` | 采集当前位姿为拓扑点 |
| `slam_save_node_edge` | `{"slam_mapping_id":"","slam_topo_id":""}` | 保存拓扑点到文件并上传 MinIO |
| `slam_clear_node_edge` | `{}` | 清除所有拓扑点 |

### F. 导航

| method | data 参数 | 说明 |
|--------|-----------|------|
| `slam_navigation_prepare` | `{"slam_navigation_id":"","slam_mapping_id":"","slam_topo_id":""}` | 加载地图和拓扑点，可选参数 `file` 从 URL 下载 |
| `slam_relocalization` | `{"slam_navigation_id":""}` | 基于已加载地图重定位 |
| `slam_navigation_execute` | `{"slam_navigation_id":""}` | 执行导航 |
| `slam_navigation_pause` | `{"slam_navigation_id":""}` | 暂停导航 |
| `slam_navigation_resume` | `{"slam_navigation_id":""}` | 恢复导航 |
| `slam_navigation_stop` | `{"slam_navigation_id":""}` | 停止导航（停止全部脚本） |

### G. 其他

| method | data 参数 | 说明 |
|--------|-----------|------|
| `take_photo` | `{}` | 拍照并上传 MinIO |
| `test_startScript` | `{}` | 测试脚本启动 |
| `test` | `{}` | 测试上传 |

### 发送示例

用 `mosquitto_pub` 工具：

```bash
# 让狗站起来
mosquitto_pub -h jiaoyujidi.work -p 1883 \
  -t "thing/product/device_01/services" \
  -m '{"method":"sport_control_standup","data":{}}'

# 前进 0.3m/s
mosquitto_pub -h jiaoyujidi.work -p 1883 \
  -t "thing/product/device_01/services" \
  -m '{"method":"sport_control_move","data":{"vx":0.3,"vy":0,"vyaw":0}}'

# 拍照
mosquitto_pub -h jiaoyujidi.work -p 1883 \
  -t "thing/product/device_01/services" \
  -m '{"method":"take_photo","data":{}}'
```

查看回复（另开一个终端）：

```bash
mosquitto_sub -h jiaoyujidi.work -p 1883 \
  -t "thing/product/device_01/services_reply"
```
