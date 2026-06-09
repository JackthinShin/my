
---
title: "JetRover 基于 ROS2 的建图与导航实操流程"
date: 2026-06-09
draft: false
categories:
  - Blog
tags:
  - JetRover
  - ROS2
  - SLAM
  - Nav2
  - NoMachine
---

# JetRover 基于 ROS2 的建图与导航实操流程

主控型号：Jetson Orin NX

## 概述
本文档为 JetRover 小车在 Jetson Orin NX 主控下使用 ROS2 完成环境建图（SLAM）与自主导航（Nav2）的实验流程。内容覆盖启动前检查、网络与远程连接、手动建图、地图保存、单点与多点导航操作，以及常见问题与排查要点。

## 1. 前置准备与安全说明

- **电量与安全**：小车前侧显示屏上有电池电压数据，在启动前确认电池电压 ≥ 10V；若低于 10V，扩展板蜂鸣器会提示“滴滴”，即为电量过低信号，此时请先充电以避免运行异常。
- **工作环境**：建图与导航应在平整、封闭或半封闭的室内场地进行。若场内布置障碍物，障碍物高度应高于激光雷达水平线以确保可被扫描。

按下按键开机

<p><img src="/images/jetrover-ros2-slam-nav2/按下按钮开机.png" alt="按下按钮开机" style="width:420px; display:block; margin:6px auto;" /></p>

## 2. 网络连接与远程桌面（NoMachine）

1. 在触摸屏上进入 Ubuntu 桌面并配置 Wi‑Fi，使小车与控制电脑及手机处于同一局域网内。

<p><img src="/images/jetrover-ros2-slam-nav2/Wi-Fi设置.png" alt="Wi‑Fi设置" style="width:420px; display:block; margin:6px auto;" /></p>

2. 手机端（目的是获得小车主控的IP地址，也可以通过查看路由器管理页面信息更加轻松地获得）：安装并打开 WonderAI 应用，选择正确的小车型号 `JetRover Mecanum`，长按设备图标可查看分配的 IP 地址与设备 ID，用于后续的远程连接。


<p><img src="/images/jetrover-ros2-slam-nav2/app选择正确的小车.jpg" alt="选择小车型号" style="width:420px; display:block; margin:6px auto;" /></p>
<p><img src="/images/jetrover-ros2-slam-nav2/长按小车图标查看ip地址.jpg" alt="长按查看 IP 地址" style="width:420px; display:block; margin:6px auto;" /></p>

3. 使用 NoMachine 在电脑上连接小车主机：打开 NoMachine，在主界面输入刚才获得的小车 IP，选择 `Configure connection to new host` 并添加。

<p><img src="/images/jetrover-ros2-slam-nav2/NoMachine中添加地址.png" alt="NoMachine 添加地址" style="width:420px; display:block; margin:6px auto;" /></p>
<p><img src="/images/jetrover-ros2-slam-nav2/填写名称.png" alt="填写名称" style="width:420px; display:block; margin:6px auto;" /></p>
<p><img src="/images/jetrover-ros2-slam-nav2/输入账号密码.png" alt="输入账号密码" style="width:420px; display:block; margin:6px auto;" /></p>

默认账号：用户名 `ubuntu`，密码 `ubuntu`。登录成功后可远程访问桌面。

## 3. 启动与工具检查

远程桌面上默认提供若干快捷程序：`SLAM`、`Navigation`、`Tool`、`Arm`。在开始建图/导航前，首先打开 `Tool` 检查传感器、雷达与系统配置是否正常。

<p><img src="/images/jetrover-ros2-slam-nav2/桌面上的四个程序.png" alt="桌面上的四个程序" style="width:320px; display:block; margin:6px auto;" /></p>

注意确认以下信息是否与实际设备匹配！
- 深度摄像头：Dabai
- 雷达：G4
- 机器类型：JetRover Mecanum

<p><img src="/images/jetrover-ros2-slam-nav2/Tool界面.png" alt="Tool 界面" style="width:420px; display:block; margin:6px auto;" /></p>

确认各项参数与驱动正常后，进入下一步建图流程。

## 4. 手动建图（SLAM）流程

流程要点：通过遥控器或键盘控制机器人在目标空间内均匀移动，采集足够的激光雷达数据，以生成完整、无缺失的二维栅格地图。

步骤：
1. 将机器人放置于待建图区域内，开启 `SLAM` 程序（双击桌面上的 `SLAM` 图标）。

<p><img src="/images/jetrover-ros2-slam-nav2/进入slam2.png" alt="进入 SLAM（扩展）" style="width:420px; display:block; margin:6px auto;" /></p>

2. 程序启动后会打开多个终端窗口及 RViz 显示界面。若 RViz 无数据显示，先关闭所有 SLAM 程序窗口后重启 `SLAM` 应用。

3. 若显示信息正常，使用遥控器、手柄或远程桌面上的虚拟遥控器控制机器人运动以扫描场景信息：
- 按 `W`/`S`：持续前进/后退
- 按 `A`/`D`：中断直行并原地旋转（按键松开停止旋转）

4. 在移动过程中观察 RViz 的激光点云/里程计，确保环境扫描覆盖完整。建图时的界面示例如下：

<p><img src="/images/jetrover-ros2-slam-nav2/slam移动小车后.png" alt="SLAM: 移动小车后扫描增加" style="width:420px; display:block; margin:6px auto;" /></p>
<p><img src="/images/jetrover-ros2-slam-nav2/slam完成建图.png" alt="SLAM: 建图过程示意" style="width:420px; display:block; margin:6px auto;" /></p>

我们可以拖动鼠标调整视角，检查建图完成情况：

<p><img src="/images/jetrover-ros2-slam-nav2/完成建图预览.png" alt="建图预览" style="width:420px; display:block; margin:6px auto;" /></p>

5. 完成覆盖扫描后，在 RViz 中点击左侧的 `Save Map` 或退出时选择保存，将当前生成的地图文件保存到默认路径。

<p><img src="/images/jetrover-ros2-slam-nav2/完成slam建图保存.png" alt="完成并保存地图" style="width:420px; display:block; margin:6px auto;" /></p>

> 建议：退出 SLAM 时保留远程遥控器程序窗口以便后续导航过程中进行人工干预。

## 5. 自主导航（Nav2）流程

在完成并加载地图后，使用 `Navigation` 程序启动 Nav2，系统会基于激光雷达实时匹配并定位到已保存地图。

<p><img src="/images/jetrover-ros2-slam-nav2/自动匹配2.png" alt="导航时的匹配示意" style="width:420px; display:block; margin:6px auto;" /></p>

1. 双击桌面 `Navigation`，等待加载地图与相关节点启动。

2. 若初始位姿不准，使用工具栏中的 `2D Pose Estimate` 在地图上拖拽设定机器人当前位置与朝向。

### 单目标点导航：

- 选择 `2D Goal Pose`，在地图上点击目标点并拖拽以设定朝向，松开鼠标后 Nav2 将自动规划路径并移动至目标。

<p><img src="/images/jetrover-ros2-slam-nav2/单点navi拖动设置目标点.png" alt="设置单点目标并拖动朝向" style="width:420px; display:block; margin:6px auto;" /></p>
<p><img src="/images/jetrover-ros2-slam-nav2/单点navi效果.png" alt="单点导航效果示例" style="width:420px; display:block; margin:6px auto;" /></p>

### 多点路径导航（Waypoint）：
- 启用 `Waypoint / Nav Through Poses Mode`，

<p><img src="/images/jetrover-ros2-slam-nav2/点击进入多点navi.png" alt="进入多点导航模式" style="width:420px; display:block; margin:6px auto;" /></p>

每次点击 `Nav2 Goal` 添加一个路径点，

<p><img src="/images/jetrover-ros2-slam-nav2/点击添加navi点.png" alt="添加导航点" style="width:420px; display:block; margin:6px auto;" /></p>

<p><img src="/images/jetrover-ros2-slam-nav2/添加数个navi点.png" alt="添加多个导航点" style="width:420px; display:block; margin:6px auto;" /></p>

重复设置多个点后点击 `Start Nav Through Navigation` 开始按序导航。系统将进行路径规划并动态避障。

<p><img src="/images/jetrover-ros2-slam-nav2/开始navi.png" alt="开始多点导航" style="width:420px; display:block; margin:6px auto;" /></p>

## 6. 常见问题与难点

1. 在点击SLAM与Navigation图标后，程序自动打开的RViz界面无数据：多数情况是因为雷达或摄像头信息加载失败，需要关闭所有相关程序窗口后重新打开。若多次重启仍然失败，请注意检查[3. 启动与工具检查](#3-启动与工具检查)中的配置信息！
<p><img src="/images/jetrover-ros2-slam-nav2/Tool界面.png" alt="Tool 界面" style="width:420px; display:block; margin:6px auto;" /></p>

2. 使用NoMachine连接远程桌面时，时常会出现断连卡顿的情况：可以尝试点击NoMachine界面右上角的 `Settings`（红色尖头指向的位置），在 `Display` 选项中调整分辨率为较低的设置（如 1024x768），将 `Quality` 向Best Speed侧滑动，以减少数据传输量并提升稳定性。
<p><img src="/images/jetrover-ros2-slam-nav2/分辨率.png" alt="调整分辨率" style="width:420px; display:block; margin:6px auto;" /></p>

3. 在Nav2导航过程中，机器人无法正确避障或路径规划失败：可能是因为建图过程中某些区域未被充分扫描导致地图不完整，或是初始位姿设定不准确。建议回到[4. 手动建图（SLAM）流程](#4-手动建图slam流程)重新进行建图，确保覆盖所有区域，在关键区域缓慢、反复地扫描以提高准确度，并在导航前使用 `2D Pose Estimate` 进行准确的初始位姿设定。
