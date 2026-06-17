---
title: "宇树 GO2 巡检系统全记录 — MQTT 控制、网络配置、Patrol 代码与 Dashboard 控制台"
date: 2026-06-17
draft: false
categories:
  - Blog
tags:
  - 宇树 GO2
  - MQTT
  - SLAM
  - MinIO
  - RTMP
  - 无线网络
  - Dashboard
  - FastAPI
  - Vue 3
---

# 宇树 GO2 巡检系统全记录 — MQTT 控制、网络配置、Patrol 代码与 Dashboard 控制台

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

method 按功能分三大类。下面的括号里是方法名的**简写形式**，实际 MQTT 发送时运动控制类需要加 `sport_control_` 前缀（如 `damp` → `sport_control_damp`），建图导航类需要加 `slam_` 前缀（如 `mapping_start` → `slam_mapping_start`）。完整 method 列表见附录。

**姿态与运动控制** — 让狗做动作。包括趴下放松（damp → `sport_control_damp`）、站起来（standup → `sport_control_standup`）、站稳（balancestand → `sport_control_balancestand`）、恢复站立（recoverystand）、趴下（standdown）、前后左右移动（move）、急停（stopmove）。还有步态切换：灵动模式（freewalk）、跑步（trotrun）、行走（staticwalk）、并腿跑（freebound）、避障（freeavoid）、跳跃（freejump）、节能续航（economicgait）等。

**建图与导航** — 巡检核心功能。建图流程：开始建图（mapping_start → `slam_mapping_start`）→ 走动采集 → 结束建图并自动上传地图（mapping_end）。导航流程：加载地图和拓扑点（navigation_prepare → `slam_navigation_prepare`）→ 重定位（relocalization）→ 执行导航（navigation_execute），过程中可以暂停（pause）、恢复（resume）、停止（stop）。还支持采集当前位姿作为拓扑点（collect_node_edge → `slam_collect_node_edge`），可以保存到文件或清除。

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

上面这套协议在纸上看起来很完美，但实际部署到机器狗上跑起来的时候，各种问题就冒出来了。下面是在调试过程中踩过的几个典型坑。

### 3.1 坑 1：SLAM 脚本启动 0.5 秒就挂了

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

### 3.2 坑 2：让狗站起来失败了

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

### 3.3 彩蛋

代码里把 "killed" 拼成了 **"kiiled"**。不影响功能，但每次看到日志都得多看一眼。

---

## 4. 现场实况

调试环境的具体网络拓扑如下。机器狗通过有线网口连接到开发机所在局域网，外网服务（MQTT Broker、MinIO、RTMP）则通过公网 IP 访问。

**局域网设备：**

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

## 5. 无线网络配置

有线连接虽然稳定，但机器狗巡检时需要自由走动，拖着网线不现实。这一节记录如何给 Go2 配置 Wi-Fi，让它通过无线网络连接到 MQTT Broker 和外网服务。

### 5.1 前置准备：修改路由器网段

Go2 机器狗内部有一个硬编码的局域网 `192.168.123.x`（板载电脑 `192.168.123.18`，MCU `192.168.123.161`）。如果外接路由器的 LAN 也恰好是 `192.168.123.x` 网段，就会和机器狗内部网络**冲突**，导致路由混乱。

**第一步**：登录路由器后台，把路由器 LAN 口 IP 从默认的 `192.168.123.1` 改为**其他网段**，比如 `192.168.6.1`（子网掩码 `255.255.255.0`）。修改后路由器重启，DHCP 分配的 IP 就变成 `192.168.6.xxx` 了，彻底避开 `192.168.123.x`。

### 5.2 连接外设，进 Ubuntu 桌面

机器狗上没有预装无线网卡，需要外接 USB 无线网卡。操作步骤：

1. **接外设**：给机器狗板载电脑接上显示器（HDMI）、键盘和鼠标（USB）
2. **插无线网卡**：将 USB 无线网卡插入机器狗的 USB 口
3. **开机进 Ubuntu**：机器狗启动后进入板载电脑的 Ubuntu 桌面环境

### 5.3 手动连接 Wi-Fi

在 Ubuntu 桌面右上角点击网络图标，扫描并选择你的 Wi-Fi，输入密码连接。连接成功后 `wlan0` 通过 DHCP 获取 IP（如 `192.168.6.6`），和机器狗内部 LAN 的 `192.168.123.x` 处于两个独立网段。

### 5.4 调整路由优先级（关键步骤）

此时机器狗同时有两个网卡在线：

| 网卡 | 网段 | 用途 |
|------|------|------|
| eth0（内部总线） | 192.168.123.x | 与机器狗运动控制 MCU 通信（DDS） |
| wlan0（外接无线网卡） | 192.168.6.x | 连接外网，访问 MQTT Broker、MinIO、RTMP |

问题在于：Ubuntu 默认会把 `eth0`（`192.168.123.x`）的路由优先级设为最高，导致外网请求走错网卡，无法访问 MQTT Broker。

**核心原则**：外网流量优先走 `wlan0`，机器狗内部 DDS 通信走 `eth0`。通过调整路由 metric 实现——metric 越低，优先级越高。

先用 `route -n` 查看当前路由表：

```bash
route -n
```

可以看到两条默认路由，`eth0` 的 metric 通常比 `wlan0` 低（优先走 `eth0`）。需要把 `wlan0` 的优先级调高。

![route -n 修改前 — eth0 优先级高于 wlan0](/images/unitree-go2-patrol/route-n-before.png)

安装 `ifmetric` 工具并设置 `wlan0` 的 metric：

```bash
sudo apt install ifmetric
sudo ifmetric wlan0 90
```

`wlan0` metric 设为 90 后，它的优先级就高于默认的 `eth0`（通常 metric 为 100），外网流量会自动走 `wlan0`。

验证调整结果：

```bash
route -n
# 确认 wlan0 的 metric < eth0 的 metric
```

![route -n 修改后 — wlan0 metric=90 优先](/images/unitree-go2-patrol/route-n-after.png)

### 5.5 连通性验证

分别验证内网和外网都能通：

```bash
# 内网：ping 机器狗 MCU
ping 192.168.123.161

# 外网：ping 公网 MQTT Broker
ping jiaoyujidi.work
```

**两者同时通即表示配置成功**——内网 DDS 通信走 `eth0`，外网 MQTT/MinIO/RTMP 走 `wlan0`，互不干扰。

![内网 192.168.123.161 与外网 jiaoyujidi.work 同时 ping 通](/images/unitree-go2-patrol/ping-success.png)

最后测试 MQTT 连接：

```bash
mosquitto_pub -h jiaoyujidi.work -p 1883 \
  -t "thing/product/device_01/services" \
  -m '{"method":"test","data":{}}'
```

收到回复就说明整条链路打通了：机器狗 → Wi-Fi → 路由器 → 公网 → MQTT Broker。

---

## 6. Patrol 巡检程序代码解析

前面的内容讲的是「怎么用」，这一节说清楚巡检程序本身的架构——代码怎么写、模块怎么组织、怎么跑起来。文中的 MQTT 话题和指令格式已在 [第 2 节](#2-怎么跟它说话-mqtt-接口协议) 中详细定义。

### 6.1 技术栈与项目结构

巡检程序用 **C++（Qt5）** 编写，基于 Unitree SDK2 和 paho-mqtt-cpp，CMake 构建。项目位于机器狗板载电脑的 `~/arm/` 目录下：

```
arm/
├── CMakeLists.txt            # CMake 构建配置
├── run.sh                    # 启动脚本
├── config/
│   └── config.yaml           # 配置文件（MQTT、MinIO、RTMP、网卡）
├── 3rdparty/                 # 第三方库（DDS、MQTT、AWS SDK）
├── src/
│   ├── main.cpp              # 入口：Qt Application
│   ├── LogicControl/         # 主控逻辑：加载配置、初始化各模块、连接信号槽
│   ├── Mqtt/                 # MQTT 客户端（paho-mqtt-cpp async_client）
│   ├── Go2Control/           # 指令分发中枢
│   ├── Minio/                # MinIO 上传工具（AWS SDK S3）
│   └── Core/
│       ├── motion/           # 运动控制（封装 Unitree SportClient）
│       ├── slam_core/        # SLAM 底层通信（DDS 订阅 slam_info）
│       ├── nav_lifecycle/    # 建图/导航流程管理 + ScriptManager
│       ├── nav_handler/      # 导航执行与重定位
│       ├── media_sender/     # 拍照上传（ImageUploader）+ RTMP 推流（VideoStreamManager）
│       ├── status_watch/     # 状态监控（LowState/SportMode/BMS/Lidar）
│       ├── arm_controller/   # 机械臂控制
│       └── utils/            # 工具函数
└── build/                    # 编译输出
```

第三方依赖：Unitree SDK2（DDS 运动控制）、paho-mqtt-cpp（MQTT）、AWS SDK C++（MinIO S3）、GStreamer（RTMP 推流）、nlohmann/json、yaml-cpp、spdlog（日志）、Qt5。

### 6.2 架构概览

整个程序围绕 Qt 信号槽机制组织，核心流程：

```
MQTT Broker
    │ 指令(json) publish 到 services topic
    ▼
MqttClient (mqtt_callback)     ←  paho-mqtt-cpp async_client
    │ 收到消息 → emit receiveOrder(json)
    ▼
Go2Control :: handleOrder()    ←  指令分发中枢
    │
    ├─ sport_control_*  ──→  MotionController  ──→  Unitree SportClient (DDS)
    ├─ slam_*           ──→  slamLifecycle      ──→  ScriptManager (fork/exec SLAM脚本)
    ├─ take_photo       ──→  ImageUploader      ──→  VideoClient 拍照 → MinIO 上传
    └─ arm_*            ──→  ArmController      ──→  机械臂 DDS 指令
                                    │
                         publish_message(json) → MQTT services_reply
```

另外两条独立线程：
- **VideoStreamManager**（单例）— GStreamer 管道，摄像头 RTMP 推流，后台常驻
- **customStatus** — 订阅 DDS 频道（`rt/sportmodestate`、`rt/lowstate`、`rt/utlidar/lidar_state`），定期上报 OSD 状态和事件到 MQTT

### 6.3 关键模块说明

**LogicControl** — 主控入口。`main.cpp` 中创建 Qt Application，初始化 `InitSetting`（日志系统），然后创建 `LogicControl` 实例。`LogicControl` 加载 `config.yaml`，创建 MQTT 客户端、`Go2Control`、`customStatus`，通过 `init_connections()` 串联所有信号槽。

**MotionController** — 封装 Unitree SDK2 的 `SportClient`，每个 MQTT 指令对应一个方法：`sport_control_damp()`、`sport_control_move(data)`、`sport_control_freewalk()` 等，直接通过 DDS 下发到机器狗运控系统。

**ScriptManager**（单例）— SLAM 脚本的进程管理器。通过 `fork() + execv()` 启动宇树的 `unitree_slam` 和 `mid360_driver` 二进制程序，用 `waitpid()` 监控子进程退出状态。支持三种输出模式：终端输出、文件日志（`~/arm/log/`）、静默。建图开始 → `startScript("slam_script", ...)`；建图结束 → `stopScript("slam_script")`，底层 `kill(-pid, SIGTERM)` 终止进程组。这就是第 3 节踩坑 1 中 `slam_script` 的管理机制。

**minioTools** — 基于 AWS SDK C++ 的 S3 客户端，负责拍照后的图片上传以及建图完成后的 PCD 地图文件上传/下载。

### 6.4 编译与运行

```bash
# 安装依赖（首次）
sudo apt install qt5-default qtcreator nlohmann-json3-dev libyaml-cpp-dev \
  libcurl4-openssl-dev libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad

# 编译
cd ~/arm/build
cmake ..
make -j8

# 运行（无桌面环境，-platform minimal）
cd ~/arm
bash run.sh
```

`run.sh` 只有两行：`export QT_QPA_PLATFORM=minimal` 然后启动 `./build/bin/unitree_go2_patrol`。`-platform minimal` 让 Qt 不依赖图形环境，适合 SSH 远程运行。

![程序运行日志 — MQTT 连接、SLAM 脚本启动、指令处理](/images/unitree-go2-patrol/patrol-log.png)

---

## 7. Dashboard WebUI — 宇树 Go2 巡检控制台

命令行发 MQTT 指令只能调试用，真正用起来需要图形界面。我搭了一个 Web 控制台，跑在机器狗板载电脑上，局域网内任意设备打开浏览器就能控制。Dashboard 的指令全部通过 [第 2 节](#2-怎么跟它说话-mqtt-接口协议) 中定义的 MQTT 协议下发，相当于把附录里的每一条指令变成了可视化的按钮。

### 7.1 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 后端 | FastAPI (Python) | REST API，uvicorn 运行，HTTP → MQTT 翻译层 |
| 前端 | 原生 HTML/CSS/JS | 单页应用，GitHub 暗色主题 |
| 实时通信 | MQTT（paho-mqtt） | 后端维持 MQTT 长连接，前端轮询 REST API |
| 视频流 | RTMP → HLS | GStreamer 推 RTMP，后端提供 HLS 静态文件 |
| 部署 | 机器狗板载电脑 `192.168.6.6:8900` | FastAPI 自托管静态文件 |

### 7.2 API 接口

后端提供以下 REST 端点（完整 OpenAPI 文档见 `/docs`）：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/command?method=...&data=...` | POST | 发送 MQTT 指令到机器狗 |
| `/api/status` | GET | 系统状态总览（MQTT 连接、HLS 状态等） |
| `/api/messages?limit=N` | GET | 最近的 MQTT 回复和事件日志 |
| `/api/photos` | GET | MinIO 照片列表 |
| `/api/photos/{key}` | GET | MinIO 照片代理 |
| `/api/hls/start` | GET | 启动/重启 HLS 视频流 |
| `/api/arm_status` | GET | 机械臂关节角度（通过 MQTT OSD 回传） |
| `/api/config` | GET | 当前配置（脱敏后） |

### 7.3 前端功能面板

控制台默认 GitHub 暗色主题，顶部状态栏显示 MQTT / HLS / ARM 三个连接指示灯，主区域四个 Tab：

**① 视频 & 照片** — 左侧主面板。HLS 实时视频播放（`<video>` 标签），下方照片缩略图列表，点击放大查看。每 10 秒轮询 `/api/photos` 刷新。

**② 运动控制** — 虚拟摇杆 + 速度滑块。拖动摇杆计算位移量，映射为 `vx`（前后）、`vy`（左右）、`vyaw`（转向）三个速度值。通过三个滑块精细调节。姿态按钮和步态切换按钮直接调用 `/api/command`。

**③ 建图 & 导航** — 建图流程控制和导航状态面板。显示当前 SLAM 状态（空闲/建图中/导航中），发送停指令目标导航导航任务指令。

**④ 日志 & 状态** — 最近 MQTT 消息日志（`/api/messages`），OSD 状态数据（电池、姿态、步态模式），机械臂角度实时反馈（每 2 秒轮询 `/api/arm_status`）。

![Dashboard 主界面 — 视频画面与运动控制面板](/images/unitree-go2-patrol/dashboard-1.png)

![Dashboard — 建图导航与日志状态面板](/images/unitree-go2-patrol/dashboard-2.png)

### 7.4 架构要点

```
浏览器 (192.168.6.x)
    │  fetch('/api/command?method=...')
    ▼
FastAPI (192.168.6.6:8900)
    │  paho-mqtt publish
    ▼
MQTT Broker (jiaoyujidi.work:1883)
    │  subscribe services topic
    ▼
Patrol 巡检程序 (C++ Qt, 同一台机器狗)
    │  DDS → 机器狗运控
```

前端是纯静态文件（HTML + CSS + JS），由 FastAPI 的 `StaticFiles` 托管。后端本质上是一个 HTTP → MQTT 的翻译网关：前端发 HTTP POST 请求，后端转成 MQTT 消息发布到 Broker；后端同时维持 MQTT 订阅，把收到的回复和事件缓存下来，供前端轮询。

### 7.5 启动方式

```bash
# 在机器狗板载电脑上
cd ~/arm/dashboard
uvicorn server:app --host 0.0.0.0 --port 8900
```

然后局域网内任意设备浏览器访问 `http://192.168.6.6:8900` 就能打开控制台。配合前面配好的无线网络，手机或平板也能远程巡检。

---

## 8. 下一步

当前进度总结：

| 模块 | 状态 | 说明 |
|------|------|------|
| MQTT 指令协议 | ✅ 完成 | 三大类 20+ 条指令，覆盖运动/建图/导航/拍照 |
| SLAM 建图导航 | ✅ 完成 | 可建图、保存、加载、重定位、巡逻 |
| 无线网络配置 | ✅ 完成 | Wi-Fi 连接外网，双网卡分流 |
| Patrol 巡检程序 | ✅ 完成 | C++ Qt5 实现，MQTT+DDS 双通道 |
| Dashboard WebUI | ✅ 完成 | FastAPI + Vue 3，局域网浏览器控制 |
| 公网远程控制 | 🔜 待做 | 前端部署到公网，实现外网远程巡检 |

后面几个方向：

- **Web 面板公网部署** — 目前 Dashboard 跑在机器狗局域网内（`192.168.6.6:8900`），只能局域网访问。下一步把前端部署到 Vercel/Netlify 等公网平台，通过 FRP 内网穿透将机器狗的 FastAPI 后端暴露到公网，实现真正的远程巡检控制。
- **定时巡检** — 用 APScheduler 或 cron 在机器狗上设置定时任务，到点自动发导航指令，狗自己走一圈。走完自动拍照存档，生成巡检报告。
- **异常检测** — 配合摄像头和传感器数据，在巡逻过程中实时检测异常（如物品移位、区域入侵、温度异常等），触发自动拍照上传并告警通知。
- **多机协同** — 多台机器狗协同巡检大范围区域，通过 MQTT 共享位置信息避免碰撞，任务编排。

本质上，现在每一条命令行里敲的 MQTT 指令，以及 Dashboard 上的每一个按钮，都是在驱动这台机器狗从「遥控玩具」变成「自主巡检工具」。

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
