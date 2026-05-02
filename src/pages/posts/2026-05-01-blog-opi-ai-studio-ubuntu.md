---
title: "OPi AI Studio 配置记录 - Ubuntu（310P 驱动 + MindIE）"
date: 2026-05-01
draft: false
categories:
    - Blog
tags:
    - OPi AI Studio
    - Ubuntu
    - Ascend
    - MindIE
    - 310P
---

# OPi AI Studio 配置记录 - Ubuntu（310P 驱动 + MindIE）

上一篇我在 Windows 下完成了 OPi AI Studio 的基础配置，但遇到了影响使用的报错。因此这次切到 Ubuntu 22.04 + Linux 5.15，重新整理一套可复现的部署流程。

## 一、目标环境与下载准备

310P NPU 驱动包当前适配的推荐系统为 Ubuntu 22.04，内核版本为 Linux 5.15。

这一步的核心目标是先把“系统版本边界”定死，避免后续出现驱动可安装但运行不稳定的问题。实践里最常见的问题就是系统版本正确、但内核版本偏差导致设备侧异常。

Ubuntu 镜像（`ubuntu-22.04.5-desktop-amd64.iso`）可从以下地址下载：

- <https://mirrors.ustc.edu.cn/ubuntu-releases/22.04.5/ubuntu-22.04.5-desktop-amd64.iso>
- <https://mirrors.huaweicloud.com/ubuntu-releases/22.04.5/ubuntu-22.04.5-desktop-amd64.iso>

## 二、切换并固定 Linux 5.15 内核

### 1) 检查当前内核

```bash
uname -r
```

![当前内核版本](/images/opi-ai-studio-ubuntu/kernel-before.png)

### 2) 安装 5.15.0-126 内核与头文件

```bash
sudo apt update
sudo apt install -y linux-image-5.15.0-126-generic linux-modules-extra-5.15.0-126-generic
sudo apt install -y linux-headers-5.15.0-126 linux-headers-5.15.0-126-generic
```

![安装 5.15 内核（1）](/images/opi-ai-studio-ubuntu/install-kernel-1.png)

![安装 5.15 内核（2）](/images/opi-ai-studio-ubuntu/install-kernel-2.png)

### 3) 修改 GRUB 默认启动项

先安装编辑器：

```bash
sudo apt install -y vim
```

![安装 vim](/images/opi-ai-studio-ubuntu/install-vim.png)

编辑 GRUB：

```bash
sudo vim /etc/default/grub
```

将 `GRUB_DEFAULT` 指向 5.15 内核项：

```text
GRUB_DEFAULT="Advanced options for Ubuntu>Ubuntu, with Linux 5.15.0-126-generic"
```

![修改 GRUB 默认项](/images/opi-ai-studio-ubuntu/edit-grub-default.png)

更新并重启：

```bash
sudo update-grub
sudo reboot
```

![更新 grub](/images/opi-ai-studio-ubuntu/update-grub.png)

重启后再次确认：

```bash
uname -r
```

预期输出：`5.15.0-126-generic`

![重启后内核版本](/images/opi-ai-studio-ubuntu/kernel-after.png)

### 4) 可选：USB4/雷电 4 机器禁用 thunderbolt 模块

如果主机使用 USB4 或雷电 4 口，连接 OPi AI Studio 启动时可能出现 PCIe 相关错误，可追加以下配置：

```bash
sudo vim /etc/default/grub
```

```text
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash modprobe.blacklist=thunderbolt"
```

```bash
sudo update-grub
sudo reboot
```

## 三、检查硬件识别

系统启动后等待片刻，执行：

```bash
lspci
```

若能看到 ASMedia 相关信息和 OPi AI Studio PCIe 设备，则链路正常。

![lspci 查看设备](/images/opi-ai-studio-ubuntu/lspci-device-detected.png)

注意：和 Windows 场景相同，建议先给 OPi AI Studio 上电并连接，再启动电脑；反过来可能导致设备识别异常。

## 四、安装基础依赖

```bash
sudo apt update
sudo apt install -y dkms net-tools gcc make cmake git pigz pciutils vim dos2unix unrar
```

![安装基础软件](/images/opi-ai-studio-ubuntu/install-required-packages.png)

## 五、安装 310P NPU 驱动与固件

### 1) 安装驱动

驱动包：`Ascend-hdk-310p-npu-driver_24.1.t29_linux-x86-64-opiaistudo-20250212.run`

下载地址：<https://pan.baidu.com/s/1b1hkpebtRXxawnoKQSV--Q?pwd=2m6f>

赋予执行权限：

```bash
chmod +x Ascend-hdk-310p-npu-driver_24.1.t29_linux-x86-64-opiaistudo-20250212.run
```

![赋予驱动执行权限](/images/opi-ai-studio-ubuntu/chmod-npu-driver.png)

安装（将 `test` 替换为实际普通用户名/组名）：

```bash
sudo ./Ascend-hdk-310p-npu-driver_24.1.t29_linux-x86-64-opiaistudo-20250212.run \
    --full --install-username=test --install-usergroup=test --install-for-all
```

![安装 NPU 驱动](/images/opi-ai-studio-ubuntu/install-npu-driver.png)

重启并验证：

```bash
sudo reboot
npu-smi info
```

![npu-smi info 结果](/images/opi-ai-studio-ubuntu/npu-smi-info.png)

### 2) 安装固件

固件包：`Ascend-hdk-310p-npu-firmware_7.6.t7.0.b052-opiaistudio-20250311.run`

```bash
chmod +x Ascend-hdk-310p-npu-firmware_7.6.t7.0.b052-opiaistudio-20250311.run
sudo ./Ascend-hdk-310p-npu-firmware_7.6.t7.0.b052-opiaistudio-20250311.run --full
```

## 六、安装 Docker 与 MindIE 镜像

### 1) 安装 Docker

```bash
sudo apt install -y docker.io
```

![安装 Docker](/images/opi-ai-studio-ubuntu/install-docker.png)

切换 root：

```bash
sudo -i
```

### 2) 拉取 MindIE 镜像

```bash
docker pull --platform=amd64 \
    swr.cn-south-1.myhuaweicloud.com/ascendhub/mindie:3.0.0b2-300l-Duo-py311-openeuler24.03-lts
docker images
```

![MindIE 镜像下载入口示意](/images/opi-ai-studio-ubuntu/mindie-image-source.png)

![拉取 MindIE 镜像](/images/opi-ai-studio-ubuntu/pull-mindie-image.png)

![查看本地镜像](/images/opi-ai-studio-ubuntu/docker-images-list.png)

### 3) 编写并执行容器启动脚本

新建 `start_docker.sh`（图片中存在拼写与空格问题）：

```bash
#!/usr/bin/env bash

IMAGE_ID=$1
NAME=${2:-mindie}

if [ -z "$IMAGE_ID" ]; then
    echo "usage: $0 <IMAGE_ID> [CONTAINER_NAME]"
    exit 1
fi

docker run --name "$NAME" -it -d --net=host --shm-size=500g \
    --privileged=true \
    -w /usr/local/Ascend \
    --device=/dev/davinci_manager \
    --device=/dev/hist_hdc \
    --device=/dev/devmm_svm \
    --entrypoint=bash \
    -v /models:/models \
    -v /data:/data \
    -v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
    -v /usr/local/dcmt:/usr/local/dcmt \
    -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
    -v /usr/local/sbin:/usr/local/sbin \
    -v /home:/home \
    -v /tmp:/tmp \
    -v /usr/share/zoneinfo/Asia/Shanghai:/etc/localtime \
    -e http_proxy=$http_proxy \
    -e https_proxy=$https_proxy \
    -e "PATH=/usr/local/python3.11.10/bin:$PATH" \
    "$IMAGE_ID"
```

![编写启动脚本](/images/opi-ai-studio-ubuntu/create-start-docker-script.png)

赋予权限并启动：

```bash
chmod +x start_docker.sh
./start_docker.sh IMAGE_ID CONTAINER_NAME
```

![赋予脚本权限](/images/opi-ai-studio-ubuntu/chmod-start-docker-script.png)

![启动容器](/images/opi-ai-studio-ubuntu/run-docker-container.png)

## 七、下载模型（DeepSeek-R1-Distill-Qwen-14B）

安装 git-lfs：

```bash
sudo apt install -y git-lfs
```

![安装 git-lfs](/images/opi-ai-studio-ubuntu/install-git-lfs.png)

模型地址：<https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B>

国内网络建议使用镜像：

```bash
git clone https://hf-mirror.com/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B
```

下载过程较长，可在模型目录观察大小变化：

```bash
du -sh
```

![模型下载进度观察](/images/opi-ai-studio-ubuntu/model-download-progress.png)

## 八、后续待实操（详细推进版，保留并扩充）

下面这部分保留你原本的推进思路，并展开成可直接照做的逐步流程。为了后续回溯，建议每一小步都截图并记录输出。

### 1) 模型配置调整（float16）

进入模型目录：

```bash
cd DeepSeek-R1-Distill-Qwen-14B/
```

编辑配置文件：

```bash
vim config.json
```

确认或修改为：

```json
"torch_dtype": "float16"
```

建议执行一次快速校验，确保 JSON 结构未被破坏：

```bash
python3 -m json.tool config.json >/dev/null && echo "config.json is valid"
```

### 2) 调整模型权限与所有者

在模型目录执行：

```bash
sudo chmod 640 config.json
cd ..
sudo chown -R root:root DeepSeek-R1-Distill-Qwen-14B/
```

校验权限：

```bash
ls -l DeepSeek-R1-Distill-Qwen-14B/config.json
ls -ld DeepSeek-R1-Distill-Qwen-14B
```

目标是保证配置文件权限收敛、目录所有者统一，减少容器内运行时的权限歧义。

### 3) 进入容器并执行 ATB 推理

启动并进入容器（`NAME` 为你自定义的容器名）：

```bash
docker start NAME
docker exec -it NAME bash
```

进入工作目录：

```bash
cd atb-models/
```

执行推理命令：

```bash
torchrun --nproc_per_node 1 --master_port 20037 -m examples.run_pa \
    --model_path /models/DeepSeek-R1-Distill-Qwen-14B/ \
    --max_output_length 256
```

常见检查点：

1. 若启动即退出，先检查模型路径是否在容器内可见。
2. 若报端口占用，替换 `--master_port` 为其他空闲端口。
3. 若报权限问题，回到上一步重新核对 `chown/chmod`。

另开一个终端观察 NPU 使用情况：

```bash
watch -n 0.2 npu-smi info
```

如果推理期间 NPU 利用率和显存占用有明显变化，说明任务已正确落到设备侧。

### 4) 启动 mindie-service（服务化）

在容器内进入目录：

```bash
cd ../mindie/latest/mindie-service/
```

编辑配置：

```bash
vim conf/config.json
```

将关键字段改为单卡 HTTP 场景：

```json
"httpsEnabled": false,
"npuDeviceIds": [[0]],
"worldSize": 1
```

启动服务：

```bash
./mindieservice_daemon
```

建议补充检查：

```bash
ps -ef | grep -i mindie
ss -lntp | grep -E "(mindie|8080|8000|9000)"
```

端口号以你实际配置为准，核心目标是确认服务进程和监听端口都起来。

### 5) 启动 chatbot 并做端到端验证

另开一个终端安装依赖：

```bash
sudo apt install -y python3-pip
pip3 install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple
```

进入项目目录并启动：

```bash
cd chat_robot/
python3 main.py
```

通过终端给出的本地地址访问界面，建议按以下顺序验收：

1. 页面可正常打开，基础静态资源无 404。
2. 发送短问题（如“你好”）可收到稳定返回。
3. 发送稍长问题时，服务端无异常退出。
4. 推理期间 `npu-smi info` 有对应负载变化。

### 6) 待实操阶段建议补充记录

为了后续写复盘文档，建议每次实操按这个模板记录：

1. 执行时间与版本信息（系统、驱动、固件、镜像标签）。
2. 执行命令与原始输出（成功与失败都保留）。
3. 问题现象、定位过程、最终修复动作。
4. 可复现实验最小步骤（方便后续重跑）。

## 九、本次阶段结论

当前已完成：

1. Ubuntu 22.04 + Linux 5.15 内核切换。
2. PCIe 设备识别确认。
3. 310P 驱动安装与 `npu-smi info` 验证。
4. Docker 与 MindIE 镜像拉取、容器启动脚本整理。
5. 模型下载流程打通。

下一步重点是把第八节的推理链路完整跑通，并补齐服务侧截图与日志记录。