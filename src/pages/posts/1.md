---
title: "Windows 环境下无 U 盘安装 Ubuntu 双系统教程"
date: 2026-05-02
draft: false
categories:
  - Blog
tags:
  - Windows
  - Ubuntu
  - 双系统
  - EasyUEFI
  - UEFI
---

这篇文章记录一种在 Windows 已安装、又手头没有 U 盘时的 Ubuntu 双系统安装方法。核心思路是：从硬盘里划出一小块 FAT32 分区，临时充当启动介质，再通过 EasyUEFI 手动添加 Ubuntu 启动项。

> 提醒：分区操作有风险，开始前先备份重要数据。

## 一、安装前准备

需要准备下面两个工具：

- Ubuntu 镜像：<https://ubuntu.com/download>
- EasyUEFI 免费版：<https://www.easyuefi.com>

同时确认你的电脑使用的是 UEFI 启动。下面的步骤默认你已经有 Windows 系统，并且可以正常进入磁盘管理。

## 二、先给硬盘腾出空间

打开 Windows 的磁盘管理工具，通过“压缩卷”方式预留两块空间：

- 一块给 Ubuntu 正式安装使用，建议至少 100GB，后面会作为根分区 `/`。
- 一块给安装程序和引导文件使用，建议 5GB 以上，并格式化为 FAT32。

这块 FAT32 分区就相当于“没有 U 盘时的替代介质”。

## 三、把 Ubuntu 镜像解压到 FAT32 分区

将下载好的 Ubuntu 镜像解压到刚创建的 FAT32 分区根目录中。

解压完成后，确认其中包含 `/EFI/BOOT/grubx64.efi` 这个文件。后面创建启动项时会直接指向它。

## 四、用 EasyUEFI 添加启动项

打开 EasyUEFI，进入“管理 UEFI 启动项”，然后添加启动项：

1. 启动类型选择“Linux 或者其他操作系统”。
2. 启动项盘符选择刚才存放 Ubuntu 安装文件的 FAT32 分区。
3. 启动项文件路径填写 `/EFI/BOOT/grubx64.efi`。
4. 启动项名称可以设为 `Ubuntu`。
5. 保存后，把这个启动项上移到列表顶部。

## 五、进 BIOS 把 Ubuntu 设为第一启动项

重启电脑，在开机时按对应按键进入 BIOS/UEFI 设置界面。不同机器的按键不一样，常见的是 F10、F12、Del 或 Esc。

在启动顺序里，把刚创建的 Ubuntu 启动项设为第一启动项，保存并退出。

## 六、开始安装 Ubuntu

电脑重启后，会从刚才创建的 Ubuntu 启动项进入安装程序。选择 `Install Ubuntu`，然后在安装过程中把前面预留的那块大空间分配给 Ubuntu。

如果你只是想保留 Windows 双系统，不要覆盖整块硬盘，只处理之前压缩出来的空间即可。

## 七、常见报错：没有定义根文件系统

如果安装时提示：

> 没有定义根文件系统。请回到分区菜单以修正此错误。

通常是因为还没有正确设置 Ubuntu 的根分区。处理方法是：

1. 删除之前腾出的安装空间。
2. 重新创建分区。
3. 把挂载点设置为 `/`。
4. 文件系统选择 `ext4`。
5. 再点击继续安装。

这样就能继续完成后面的安装步骤。

## 八、安装完成后的启动选择

安装完成后，重启电脑会看到 GRUB 引导界面，可以选择进入 Ubuntu 或 Windows Boot Manager。

如果你希望默认直接进入 Windows，也可以在 BIOS 里把 Windows Boot Manager 调回第一启动项。

## 总结

这套方法的关键点只有两个：

- 用 FAT32 分区替代 U 盘，手动提供 Ubuntu 启动文件。
- 在 Ubuntu 安装时正确创建根分区 `/`，文件系统使用 `ext4`。

只要这两步没出问题，Windows + Ubuntu 双系统就能顺利装好。
