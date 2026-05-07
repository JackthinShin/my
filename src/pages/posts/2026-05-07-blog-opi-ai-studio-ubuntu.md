---
title: "OPi AI Studio 配置记录 - Ubuntu（310P 驱动 + MindIE + Daemon + curl 调用接口）"
date: 2026-05-07
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

# OPi AI Studio 配置记录 - Ubuntu（310P 驱动 + MindIE + Daemon + curl 调用接口）

上一篇在 Windows 下完成了 OPi AI Studio 的基础配置，但遇到了影响使用的报错。因此这次切到 Ubuntu 22.04 + Linux 5.15，重新整理一套可复现的部署流程。

## 一、目标环境与下载准备

310P NPU 驱动包当前适配的推荐系统为 Ubuntu 22.04，内核版本为 Linux 5.15。

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
如果推理期间 NPU 利用率和显存占用有明显变化，说明任务已正确落到设备侧。加载进度跑到 100% 后，通常就会继续进入模型推理阶段：
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
docker pull --platform=amd64 swr.cn-south-1.myhuaweicloud.com/ascendhub/mindie:3.0.0-300I-Duo-py311-openeuler24.03-lts
```

![MindIE 镜像下载入口示意1](/images/opi-ai-studio-ubuntu/mindie-image1.png)

![MindIE 镜像下载入口示意2](/images/opi-ai-studio-ubuntu/mindie-image2.png)

![MindIE 镜像下载入口示意3](/images/opi-ai-studio-ubuntu/mindie-image3.png)

![MindIE 镜像下载入口示意4](/images/opi-ai-studio-ubuntu/mindie-image4.png)

![拉取 MindIE 镜像](/images/opi-ai-studio-ubuntu/pull-mindie-image.png)

查看本地镜像列表：
```bash
docker images
```

![查看本地镜像](/images/opi-ai-studio-ubuntu/docker-images-list.png)

### 3) 编写并执行容器启动脚本

```bash
vim start_docker.sh
```

新建 `start_docker.sh`：
输入以下内容

```bash
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

切换至/models目录：

```bash
cd /models
```

模型地址：<https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B>

国内网络建议使用镜像：

```bash
git clone --depth=1 https://modelers.cn/XLRJ/DeepSeek-R1-Distill-Qwen-14B
```

![模型下载完成](/images/opi-ai-studio-ubuntu/model-download-complete.png)

![模型下载](/images/opi-ai-studio-ubuntu/model-download.png)

下载过程较长，可在模型目录观察大小变化：

```bash
du -sh
```

![模型下载进度观察](/images/opi-ai-studio-ubuntu/model-download-percentage.png)

当然也可以通过watch命令持续监控：

```bash
watch -n 1 du -sh
```

![watch 监控模型下载](/images/opi-ai-studio-ubuntu/percentage-watch.png)

## 八、模型配置、推理验证与服务启动

下面把后续实操整理成一条更顺的链路：先把模型配置和权限处理好，再做一次本地推理验证，最后启动 MindIE 服务并用 `curl` 复核接口。

### 1) 模型配置调整（float16）

进入模型目录：

```bash
cd /models/DeepSeek-R1-Distill-Qwen-14B/
```

编辑配置文件：

```bash
vim config.json
```

确认或修改 `torch_dtype` 为：

```json
"torch_dtype": "float16"
```

![修改 torch_dtype](/images/opi-ai-studio-ubuntu/modify-torch-dtype.png)

建议执行一次快速校验，确保 JSON 结构未被破坏：

```bash
python3 -m json.tool config.json >/dev/null && echo "config.json is valid"
```

![验证 JSON 合法性](/images/opi-ai-studio-ubuntu/validate-json.png)

### 2) 调整模型权限与所有者

在模型目录执行：

```bash
sudo chmod 640 config.json
cd ..
sudo chown -R root:root /models/DeepSeek-R1-Distill-Qwen-14B/
```

校验权限：

```bash
ls -l /models/DeepSeek-R1-Distill-Qwen-14B/config.json
ls -ld /models/DeepSeek-R1-Distill-Qwen-14B
```

目标是保证配置文件权限收敛、目录所有者统一，减少容器内运行时的权限歧义。

### 3) 进入容器并执行一次本地推理

启动并进入容器（`NAME` 为你自定义的容器名）：

```bash
docker start NAME
docker exec -it NAME bash
```

![启动并进入 Docker](/images/opi-ai-studio-ubuntu/start-and-enter-docker.png)

进入工作目录：

```bash
cd atb-models/
```

先执行环境变量配置：
```bash
export MINDIE_LOG_TO_STDOUT=1
```

再执行推理命令：

```bash
torchrun --nproc_per_node 1 --master_port 20037 -m examples.run_pa --model_path /models/DeepSeek-R1-Distill-Qwen-14B/ --max_output_length 256
```

另开一个终端观察 NPU 使用情况：

```bash
watch -n 0.2 npu-smi info
```

![npu-smi 使用情况](/images/opi-ai-studio-ubuntu/npu-smi-usage.png)

如果推理期间 NPU 利用率和显存占用有明显变化，说明任务已正确落到设备侧。加载进度跑到 100% 后，通常就会继续进入模型推理阶段：

![样例推理成功](/images/opi-ai-studio-ubuntu/run-pa-example-success.png)

Tips: 注意！如果不进行**环境变量配置**，执行推理命令时将会加载至100%后直接异常退出：

![推理加载异常跳出](/images/opi-ai-studio-ubuntu/run-pa-loading-complete.png)

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
"worldSize": 1,
"modelWeightPath": "/models/DeepSeek-R1-Distill-Qwen-14B/"
```

![mindie-service 配置 1](/images/opi-ai-studio-ubuntu/mindie-service-config-1.png)

![mindie-service 配置 2](/images/opi-ai-studio-ubuntu/mindie-service-config-2.png)

![mindie-service 配置 3](/images/opi-ai-studio-ubuntu/mindie-service-config-3.png)

启动服务：

```bash
./mindieservice_daemon
```

报错：

```bash
./mindieservice_daemon: error while loading shared libraries: libtorch_cpu.so: cannot open shared object file: No such file or directory
```

![Daemon 启动失败](/images/opi-ai-studio-ubuntu/mindie-service-start-error-missing-libtorch.png)

这类报错通常说明运行时环境变量还没补齐。先尝试激活下面这些环境：

```bash
# 配置CANN环境，默认安装在/usr/local目录下
source /usr/local/Ascend/ascend-tookit/set_env.sh
# 配置加速库环境
source /usr/local/Ascend/nnal/atb/set_env.sh
# 配置模型仓环境变量
source /usr/local/Ascend/atb-models/set_env.sh
source /usr/local/Ascend/mindie/atb/set_env.sh
```

再次启动后，若看到 `Daemon start success!`，说明服务已经正常拉起：

![Daemon 启动成功](/images/opi-ai-studio-ubuntu/mindie-service-start-success.png)

可能出现运存不足时，尝试增加交换分区：

```bash
sudo fallocate -l 64G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

![创建 swap 内存](/images/opi-ai-studio-ubuntu/create-swap-file.png)

在运行结束时可以关闭交换分区：

```bash
sudo swapoff /swapfile
sudo rm /swapfile
```

### 5) 使用 curl 验证 HTTP 接口

MindIE 服务启动后，可以直接用 `curl` 调用 `generate` 接口做快速验证：

```bash
curl -w "\ntime_total=%{time_total}\n" \
    -H "Accept: application/json" \
    -H "Content-type: application/json" \
    -X POST -d '{"inputs":"Who are you?","stream":false}' \
    http://127.0.0.1:1025/generate
```

示例结果如下：

![curl 推理 1](/images/opi-ai-studio-ubuntu/curl-generate-1.png)

![curl 推理 2](/images/opi-ai-studio-ubuntu/curl-generate-2.png)

![curl 推理 3](/images/opi-ai-studio-ubuntu/curl-generate-3.png)

![curl 推理 4](/images/opi-ai-studio-ubuntu/curl-generate-4.png)

完成了最终接口部署的验证，至此整个 OPi AI Studio 在 Ubuntu 环境下的部署流程就算是完整走通了。

接下来将在此基础之上，进一步调试上下文长度、并发性能等参数，并且换上精度更高的模型进行调试，以实现更快、质量更高的推理能力，尽可能地释放OPi AI Studio的潜力。

同时，在这个基础上通过调用本地模型接口的方式，部署ChatBot，并且开始养龙虾(OpenClaw / Hermes Agent)！
