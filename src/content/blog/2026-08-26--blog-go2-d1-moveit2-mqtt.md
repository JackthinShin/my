---
title: "从 URDF 到真机运动，D1 的 MoveIt2 控制链路"
date: 2026-08-26
draft: false
tags:
  - unitree-go2
  - d1-arm
  - moveit2
  - mqtt
  - urdf
category: "Blog"
description: "记录 Unitree D1 从 URDF、RViz 和 MoveIt2 仿真，到 MQTT 桥接控制真机的过程。"
---

## RViz 里能动只是第一关

我们先把 D1 的官方模型放进 RViz，检查 link、joint、visual、collision、inertial 和关节限制。模型加载以后，MoveIt2 可以规划机械臂从一个姿态移动到另一个姿态，关节轨迹也能在 RViz 中显示出来。

仿真给出的反馈很容易让人产生错觉。规划器正常返回，模型也能按预期运动，看起来整条链路已经完成。真机接入以后，通信方式、状态反馈和架构兼容性都会变成新的问题。

## 先尝试 ros2_control

早期方案是编写 `ros2_control` 硬件接口，让它在 `read()` 中读取 D1 的关节反馈，在 `write()` 中把 MoveIt2 输出的弧度转换为 SDK 需要的角度，再通过 DDS 发给机械臂。

这个方案在设计上很完整，真机部署时却遇到了 ROS2 Humble 的参数和 controller manager 兼容问题。继续在这条路线上消耗时间，可能会把机械臂控制问题变成 ROS2 框架问题。

于是我们改成了 MQTT 桥接。

## 最终采用 MQTT 桥接

Dashboard 端仍然使用 MoveIt2 负责运动规划。规划出来的轨迹先交给 fake controller，fake controller 按照轨迹中的时间戳做插值，同时完成两件事。

一份状态发布给 RViz，让可视化模型继续运动。另一份通过 MQTT 发往机器狗端，再由机器狗上的 D1 SDK 控制真实机械臂。

```text
MoveIt2 规划
      ↓
fake controller 接收轨迹
      ↓
按 time_from_start 插值
      ├── 发布 RViz 关节状态
      └── MQTT 下发真机角度
```

![MoveIt2 中的机械臂规划轨迹](/images/go2-grasp-series/moveit/02-plan.jpg)

这个方案的好处是把规划和真机控制隔开。MoveIt2 不需要直接处理 D1 SDK，真机端也不需要承担完整的规划任务。缺点是桥接层必须自己处理轨迹执行状态和通信重连。

![MoveIt2 规划前的机械臂状态](/images/go2-grasp-series/moveit/01-start.jpg)

![MoveIt2 执行过程中的机械臂状态](/images/go2-grasp-series/moveit/04-execute.jpg)

## 状态同步比发出命令更难

早期 bridge 通过 fake 位置和真机位置的角度差判断轨迹是否完成。这个判断在机械臂运动时看起来有效，机械臂停在目标姿态以后却可能一直不满足阈值，程序就把一条已经结束的轨迹当成仍在执行。

后来我们改成显式的执行状态。轨迹开始时进入执行状态，轨迹结束时由 fake controller 写回完成标志，bridge 再恢复关节状态同步。

MQTT 断线重连也会造成订阅丢失。重新连接成功，不代表原来的 topic 订阅已经恢复。机械臂控制程序需要把重连和重新订阅当成两个动作处理。

## 真机验证以后，问题会换一种形式出现

完成桥接以后，MoveIt2 可以规划轨迹，真机也能够执行，关节状态能够回到 RViz。机械臂从一个底座角度运动到另一个底座角度，说明规划、桥接和 SDK 执行链路已经接上。

接下来要处理的是关节方向、夹爪映射和真实几何。程序里角度的正方向必须和 URDF、SDK 以及真机实际旋转方向保持一致。只要其中一处定义相反，机械臂依然可能正常运动，但运动结果会逐渐偏离模型。

夹爪也不能只看两个关节在 RViz 里有没有开合。D1 的夹爪由一个舵机带动两个机械耦合关节，servo6 的角度和实际开合毫米数需要通过真机测量建立映射。

## 当前结论

D1 的 URDF、RViz 可视化、MoveIt2 规划和 MQTT 真机执行链路已经基本跑通。剩下的工作集中在夹爪标定、关节方向验证和抓取姿态联调。

机械臂已经能够按照规划去某个位置。接下来要解决的问题，是这个位置和真实目标之间到底差了多少。
