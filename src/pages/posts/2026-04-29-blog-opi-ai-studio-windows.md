---
title: "OPi AI Studio 配置记录 - Windows（驱动+CANN+llama.cpp）"
date: 2026-04-29
draft: false
categories:
  - Blog
tags:
  - OPi AI Studio
  - Windows
  - Ascend
  - CANN
  - llama.cpp
---

# OPi AI Studio 配置记录 - Windows（驱动+CANN+llama.cpp）

这篇文章记录我在 Windows 环境下配置 OPi AI Studio 的完整流程，包括测试模式设置、驱动安装、CANN 环境变量配置，以及用 `llama-cli.exe` 进行大模型推理。

## 一、环境与准备

开始前建议先确认以下信息：

1. 系统为 Windows。
2. 驱动安装包、CANN 压缩包、`llama-cli.exe` 与模型文件均可从以下地址下载：<https://pan.baidu.com/s/1Gik8ghnBnZBlUUkAlaM8Tg?pwd=psjb>
3. 使用产品附带 USB4 线缆连接设备。

系统信息参考：

![系统信息](/images/opi-ai-studio-windows/system-info.png)

## 二、将系统切换到测试模式

1. 右键开始菜单，打开 `终端（管理员）` 或 `Windows PowerShell（管理员）`。
2. 输入命令：

```powershell
bcdedit /set testsigning on
```

3. 出现“操作成功”后，重启系统。
4. 重启后桌面右下角应出现“测试模式”水印。

命令执行示意：

![将系统设置为测试模式](/images/opi-ai-studio-windows/enable-test-mode.png)

测试模式水印示意：

![测试模式显示](/images/opi-ai-studio-windows/test-mode-watermark.png)

## 三、安装驱动并验证设备识别

1. 安装驱动 `Ascend310P_1.1.0.3.exe`。
2. 重启系统。
3. 启动 OPi AI Studio，并使用 USB4 线缆连接电脑。

注意事项：

先启动 OPi AI Studio 并连接到主机，再启动主机。若顺序错误，可能出现设备无法识别。

驱动安装界面示意：

![安装驱动](/images/opi-ai-studio-windows/driver-installation.png)

4. 打开管理员终端，执行：

```powershell
npu-smi info
```

5. 若终端能正确打印 OPi AI Studio 相关信息，则驱动安装成功。

识别成功示意：

![npu-smi info显示](/images/opi-ai-studio-windows/npu-smi-info-output.png)

若安装成功后依旧报错如下，可以尝试重启整套环境：

![报错](/images/opi-ai-studio-windows/error-message.png)

## 四、安装 CANN 包

1. 解压 `CANN8.0.0.zip`。
2. 将解压后的目录放到：

```text
C:\Program Files\CANN8.0.0
```

3. 手动创建目录：

```text
C:\Program Files\Huawei\Ascend
```

## 五、配置环境变量

1. 在开始菜单搜索“环境变量”，打开“编辑系统环境变量”。
2. 在“系统变量”中新建以下变量：

```text
ASCEND_HOME_PATH = C:\Program Files\CANN8.0.0
ASCEND_OPP_PATH  = C:\Program Files\CANN8.0.0
```

3. 编辑系统变量 `Path`，新增：

```text
C:\Program Files\CANN8.0.0
```

环境变量配置示意：

![环境变量CANN](/images/opi-ai-studio-windows/env-var-cann-1.png)

![环境变量CANN2](/images/opi-ai-studio-windows/env-var-cann-2.png)

## 六、配置 llama.cpp 并运行模型

### 1) 添加 llama.cpp 相关环境变量

在系统环境变量中新增：

```text
GGML_CANN_WEIGHT_NZ = 1
```

配置示意：

![环境变量llama](/images/opi-ai-studio-windows/env-var-llama.png)

### 2) 启动推理

打开管理员终端，执行：

```powershell
{llama-cli.exe 文件路径} -m {模型文件路径}
```

命令行调用示意：

![llama调用qwen2.5-0.5b](/images/opi-ai-studio-windows/llama-cli-qwen-call.png)

当终端出现 `>` 且光标闪烁时，表示模型已成功启动：

![运行成功等待输入](/images/opi-ai-studio-windows/llama-ready-for-input.png)

### 3) 提问与结束

1. 在 `>` 后输入提问内容并回车。
2. 等待模型输出完成。
3. 当再次出现 `>` 且光标闪烁时，按 `Ctrl + C` 结束推理。

推理输出示意：

![推理输出(包含报错)](/images/opi-ai-studio-windows/inference-output-with-error.png)

已知日志说明：

在我的推理输出中可以看到类似以下日志：

```text
[ERROR](9836)D:\cann\0605_release\abl\slog\liblog\slog\plog\plog_file_mgr.c:218: fsync fail, ret=-1, strerr=Input/output error.
```

这个报错大概率来自 CANN 的 `slog` 日志模块。该模块主要按 Linux 服务器环境设计，Windows 文件系统对 `fsync` 语义支持与 Linux 存在差异，在特定条件下会触发 `fsync fail`。当前看属于日志写盘路径的兼容性问题，通常表现为持续报错日志，但推理进程本身并不崩溃。

结束后会看到性能统计信息（包含平均 `tps`）：

![结束后tps显示](/images/opi-ai-studio-windows/inference-tps-result.png)

## 七、常见问题

### 1) 设备无法识别

优先检查启动顺序与 USB4 连接状态：

1. 先启动 OPi AI Studio 并连接主机。
2. 再启动主机。
3. 重新执行 `npu-smi info` 验证。

### 2) `fsync fail` 日志反复出现

典型日志如下：

```text
[ERROR](9836)D:\cann\0605_release\abl\slog\liblog\slog\plog\plog_file_mgr.c:218: fsync fail, ret=-1, strerr=Input/output error.
```

可能原因：

1. CANN 的 `slog` 在 Linux 场景设计较完善。
2. Windows 文件系统对 `fsync` 语义支持不完全一致。
3. CANN 在 Windows 路径上未完全做容错，导致该日志持续出现。

## 八、总结

目前在 Windows 环境下，OPi AI Studio 整体上已经完成适配，可以正常完成推理任务：

1. 驱动识别正常（`npu-smi info` 可读）。
2. CANN 环境变量可用。
3. `llama-cli` 可以成功加载模型并启动推理。

但由于前面提到的 `fsync fail` 报错问题，推理输出的可视性会受到影响，结果显示常常断断续续，不够稳定直观。

因此，后续我会改用 Ubuntu 环境重新配置，并继续验证推理链路的稳定性与输出效果。
