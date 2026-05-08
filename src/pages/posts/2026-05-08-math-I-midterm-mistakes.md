---
title: "高等数学 I（2026）期中错题整理"
math: true
exam: midterm
course: 高等数学 I
date: 2026-05-08
draft: false
categories:
  - notes
tags:
  - math
  - mistakes
---

<!-- markdownlint-disable MD024 MD025 -->
# 高等数学 I（2026）期中错题整理

这篇错题整理按“题干 - 解法 - 答案 - 易错点”来写，尽量把每道题拆开，避免所有内容挤在一起。

## 曲线积分

### 题干（曲线积分）

二、2. 曲线 $L: x^2 + y^2 = 2x$，则 $\int_L (x+y) \, ds = \underline{\qquad\qquad}$。

### 解题步骤

<!-- markdownlint-disable MD029 -->
1. 先把曲线化成标准圆方程：

$$
x^2 + y^2 = 2x
\Rightarrow (x-1)^2 + y^2 = 1
$$

这是一条以 $(1,0)$ 为圆心、半径为 $1$ 的圆。

2. 取参数方程：

$$
x = 1 + \cos t, \quad y = \sin t, \quad t \in [0, 2\pi]
$$

3. 计算弧长元素：

$$
ds = \sqrt{\left(\frac{dx}{dt}\right)^2 + \left(\frac{dy}{dt}\right)^2} \, dt
= \sqrt{(-\sin t)^2 + (\cos t)^2} \, dt
= dt
$$

4. 代回积分：

$$
\int_L (x+y) \, ds
= \int_0^{2\pi} \bigl((1+\cos t) + \sin t\bigr) \, dt
= \int_0^{2\pi} (1 + \cos t + \sin t) \, dt
$$

5. 分项积分：

$$
\int_0^{2\pi} 1 \, dt
++ \int_0^{2\pi} \cos t \, dt
++ \int_0^{2\pi} \sin t \, dt
= 2\pi + 0 + 0 = 2\pi
$$
<!-- markdownlint-enable MD029 -->

### 答案：$2\pi$

### 易错点

这里的 $ds$ 已经化成 $dt$ 了，不要再重复乘一次速度；最后积分也可以直接利用 $\sin t$ 和 $\cos t$ 在一个周期上的积分为 $0$。

## 二重积分

### 题干（二重积分）

二、4. 设 $D = \{(x,y) \mid 4x^2 + y^2 < 1,\ x \ge 0,\ y \ge 0\}$，则积分 $\iint_D (1 - 12x^2 - y^2) \, dxdy = \underline{\qquad\qquad}$。

### 解法

<!-- markdownlint-disable MD029 -->
1. 先作代换：

$$
u = 2x, \quad v = y
$$

于是令

$$
x = \frac{u}{2}, \quad y = v
$$

为了严格说明微分元的变化，我们计算雅可比行列式：

设映射 $\Phi(u,v) = (x(u,v), y(u,v))$，则

$$
J_{\Phi} = \begin{vmatrix}
\dfrac{\partial x}{\partial u} & \dfrac{\partial x}{\partial v} \\
\dfrac{\partial y}{\partial u} & \dfrac{\partial y}{\partial v}
\end{vmatrix}
= \begin{vmatrix}
\dfrac{1}{2} & 0 \\
0 & 1
\end{vmatrix}
= \frac{1}{2}.
$$

因此微分元变换为

$$
dx\,dy = |J_{\Phi}| \, du\,dv = \frac{1}{2} \, du\,dv.
$$

2. 代换后，区域 $D$ 变成第一象限内的四分之一单位圆盘：

$$
Q = \{(u,v) \mid u^2 + v^2 < 1,\ u \ge 0,\ v \ge 0\}
$$

原积分变为

$$
I = \frac{1}{2} \iint_Q (1 - 3u^2 - v^2) \, dudv
$$

3. 将积分拆开：

$$
I = \frac{1}{2} \left( \iint_Q 1 \, dudv - 3\iint_Q u^2 \, dudv - \iint_Q v^2 \, dudv \right)
$$

因为 $Q$ 关于直线 $u=v$ 对称，所以

$$
\iint_Q u^2 \, dudv = \iint_Q v^2 \, dudv
$$

4. 计算 $\iint_Q u^2 \, dudv$：

$$
\iint_Q u^2 \, dudv
= \int_0^{\pi/2} \int_0^1 r^2 \cos^2\theta \cdot r \, dr d\theta
= \left( \int_0^1 r^3 \, dr \right) \left( \int_0^{\pi/2} \cos^2\theta \, d\theta \right)
= \frac{1}{4} \cdot \frac{\pi}{4}
= \frac{\pi}{16}
$$

同理，

$$
\iint_Q v^2 \, dudv = \frac{\pi}{16}
$$

而四分之一单位圆盘的面积为

$$
\iint_Q 1 \, dudv = \frac{\pi}{4}
$$

5. 代回计算：

$$
I = \frac{1}{2} \left( \frac{\pi}{4} - 3 \cdot \frac{\pi}{16} - \frac{\pi}{16} \right)
= \frac{1}{2} \left( \frac{\pi}{4} - \frac{\pi}{4} \right)
= 0
$$
<!-- markdownlint-enable MD029 -->

### 答案：$0$

### 易错点

这题先把椭圆区域化成单位圆盘，再利用对称性处理 $u^2$ 和 $v^2$，会比直接在原区域里硬算更稳。

## 切平面与四面体体积

### 题干（切平面与四面体体积）

三、4. 设 $V$ 是由椭球面 $\frac{x^2}{a^2} + \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1$ 在第一卦限点处的切平面与三个坐标面围成的四面体体积，求 $V$ 的最小值。

### 解法

<!-- markdownlint-disable MD029 -->
1. 设切点为 $P(x_0, y_0, z_0)$，则它在椭球面上，满足

$$
\frac{x_0^2}{a^2} + \frac{y_0^2}{b^2} + \frac{z_0^2}{c^2} = 1
$$

2. 椭球面在点 $P$ 处的切平面方程为

$$
\frac{x x_0}{a^2} + \frac{y y_0}{b^2} + \frac{z z_0}{c^2} = 1
$$

它与三个坐标轴的截距分别是

$$
\frac{a^2}{x_0}, \quad \frac{b^2}{y_0}, \quad \frac{c^2}{z_0}
$$

3. 所以四面体体积为

$$
V = \frac{1}{6} \cdot \frac{a^2}{x_0} \cdot \frac{b^2}{y_0} \cdot \frac{c^2}{z_0}
= \frac{a^2 b^2 c^2}{6 x_0 y_0 z_0}
$$

要使 $V$ 最小，只需使 $x_0 y_0 z_0$ 最大。

4. 令

$$
u = \frac{x_0^2}{a^2}, \quad v = \frac{y_0^2}{b^2}, \quad w = \frac{z_0^2}{c^2}
$$

则 $u + v + w = 1$，且

$$
x_0 y_0 z_0 = abc \sqrt{u v w}
$$

由 AM-GM 不等式可得

$$
u v w \le \left( \frac{u + v + w}{3} \right)^3 = \left( \frac{1}{3} \right)^3
$$

当且仅当 $u = v = w = \frac{1}{3}$ 时取等号，因此

$$
x_0 y_0 z_0 \le \frac{abc}{3\sqrt{3}}
$$

5. 代回体积公式：

$$
V_{\min} = \frac{a^2 b^2 c^2}{6 \cdot \frac{abc}{3\sqrt{3}}}
= \frac{\sqrt{3}}{2} abc
$$
<!-- markdownlint-enable MD029 -->

### 答案：$\frac{\sqrt{3}}{2} abc$

### 易错点

这题容易漏掉切平面截距和四面体体积公式。先求截距，再写体积，最后用不等式求最小值，步骤会更稳。

## 方向导数

### 题干（方向导数）

三、6. 设 $f(x,y,z) = \arcsin(x^2 + y + z^2)$. 求该函数在点 $P\left(\frac{1}{2}, -1, -\frac{1}{2}\right)$ 处函数值增加最快的方向，并求在该点沿方向 $(1,-1,-1)$ 的方向导数。

### 解法

<!-- markdownlint-disable MD029 -->
1. 记

$$
u = x^2 + y + z^2,
\quad f(x,y,z) = \arcsin u
$$

由链式法则可得

$$
\nabla f = \frac{1}{\sqrt{1-u^2}} \nabla u
$$

而

$$
\nabla u = (2x, 1, 2z)
$$

2. 在点 $P\left(\frac{1}{2}, -1, -\frac{1}{2}\right)$ 处，

$$
u = \left(\frac{1}{2}\right)^2 - 1 + \left(-\frac{1}{2}\right)^2 = -\frac{1}{2}
$$

所以

$$
\frac{1}{\sqrt{1-u^2}} = \frac{1}{\sqrt{1-\frac{1}{4}}} = \frac{2}{\sqrt{3}}
$$

因此

$$
\nabla f(P) = \frac{2}{\sqrt{3}} (1, 1, -1)
$$

3. 函数值增加最快的方向就是梯度方向，所以单位方向向量为

$$
\frac{(1,1,-1)}{\sqrt{3}}
$$

4. 计算沿方向 $(1,-1,-1)$ 的方向导数。先把方向向量单位化：

$$
\mathbf{e} = \frac{(1,-1,-1)}{\sqrt{3}}
$$

于是方向导数为

$$
D_{\mathbf{e}} f(P)
= \nabla f(P) \cdot \mathbf{e}
= \frac{2}{\sqrt{3}} (1,1,-1) \cdot \frac{(1,-1,-1)}{\sqrt{3}}
= \frac{2}{3} (1 - 1 + 1)
= \frac{2}{3}
$$
<!-- markdownlint-enable MD029 -->

### 答案

函数值增加最快的方向为

$$
\frac{(1,1,-1)}{\sqrt{3}}
$$

沿方向 $(1,-1,-1)$ 的方向导数为

$$
\frac{2}{3}
$$

### 易错点

方向导数一定要先把方向向量单位化；“函数值增加最快的方向”则直接看梯度方向，但最后也要写成单位向量。
