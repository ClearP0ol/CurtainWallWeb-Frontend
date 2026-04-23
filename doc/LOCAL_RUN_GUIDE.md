# CurtainWallWeb 本地运行与联调指南

这份文档的目标是让你把当前项目在本地尽可能完整地跑起来，并明确区分：

- 什么时候是“本地前端在访问远程接口”
- 什么时候才算“本地前后端真正打通”
- 下一步应该先做什么，避免一开始就陷入部署问题

项目涉及两个目录：

- 前端：`E:\Course Project\CurtainWallWeb-Frontend`
- 后端：`E:\Course Project\Intelligent-Curtain-Wall`

---

## 1. 当前项目现状

### 1.1 前端现状

前端是 Nuxt 3 项目，入口脚本在 [package.json](../package.json)。

本地启动前端后，很多模块可以工作，但不一定代表“本地前后端都跑起来了”，因为：

- 登录/注册等接口通过 `nuxt.config.ts` 里的远程代理访问线上服务
- 振动模块多个页面直接写死访问 `http://110.42.214.164:8009`

也就是说，**前端本地能跑，不等于后端本地也跑了。**

### 1.2 后端现状

后端是 Django 项目，入口在：

- [manage.py](../../Intelligent-Curtain-Wall/manage.py)
- [myproject/urls.py](../../Intelligent-Curtain-Wall/myproject/urls.py)

数据库配置已经写在：

- [myproject/settings.py](../../Intelligent-Curtain-Wall/myproject/settings.py)

当前配置指向远程 MySQL：

- Host: `8.159.143.133`
- Port: `3306`
- DB: `vibration`
- User: `vibration`

但是要注意：

- 数据库“配置已写”不代表“你本地已验证连接成功”
- 你当前本地 Python 环境还没有安装 Django，不能直接跑后端

---

## 2. 你接下来应该先做什么

不要先部署服务器。

**最优先的目标是：**

1. 本地前端能启动
2. 本地后端能启动
3. 本地后端能连上远程 MySQL
4. 本地前端能改为访问你本地后端
5. 然后再开始补“预警模块的真实业务逻辑”

如果第 2、3 步没过，后面谈“前后端打通”和“部署”都还太早。

---

## 3. 环境准备

### 3.1 前端环境

建议：

- Node.js 18 或 20
- npm

查看版本：

```powershell
node -v
npm -v
```

### 3.2 后端环境

建议：

- Python 3.11 或 3.12
- 不建议直接用 Python 3.14 做这个 Django 4.2 项目

查看版本：

```powershell
python --version
```

如果你的系统里已经有 Python 3.11，建议优先用它建虚拟环境。

---

## 4. 前端本地启动

进入前端目录：

```powershell
cd "E:\Course Project\CurtainWallWeb-Frontend"
```

安装依赖：

```powershell
npm install
```

启动开发服务器：

```powershell
npm run dev
```

默认访问：

```text
http://localhost:3000
```

如果登录页拦截你，而你只是想看界面，可以在浏览器控制台执行：

```js
localStorage.setItem('authToken', 'dev-token')
localStorage.setItem('email', 'dev@example.com')
localStorage.setItem('userAuth', JSON.stringify({
  is_superuser: true,
  access_system_v: true
}))
location.href = '/vibration/dashboard'
```

如果你只是想看静态演示页，不依赖任何登录和接口，可以直接打开：

- [vibration-demo.html](../vibration-demo.html)

---

## 5. 后端本地启动

### 5.1 进入后端目录

```powershell
cd "E:\Course Project\Intelligent-Curtain-Wall"
```

### 5.2 创建虚拟环境

如果你当前 `python` 指向的是合适版本：

```powershell
python -m venv .venv
```

激活虚拟环境：

```powershell
& .\.venv\Scripts\Activate.ps1
```

如果 PowerShell 不允许执行脚本，可以先执行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

然后再激活：

```powershell
& .\.venv\Scripts\Activate.ps1
```

如果你发现提示符前面虽然看起来有 `(.venv)`，但 `python` / `pip` 仍然指向全局 Python，那么不要继续依赖激活脚本，直接使用虚拟环境里的解释器完整路径。

先检查当前 `python` 和 `pip` 指向：

```powershell
Get-Command python
Get-Command pip
```

如果不是 `.venv\Scripts\python.exe` 和 `.venv\Scripts\pip.exe`，就直接用下面这种最稳的写法。

### 5.3 安装依赖

```powershell
.\.venv\Scripts\python.exe -m ensurepip --upgrade
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

如果 `mysqlclient` 安装失败，常见处理方式有两种：

1. 安装 Visual Studio C++ Build Tools 后重试
2. 临时改用 `PyMySQL`

如果遇到这个问题，不要先乱改业务代码，先把安装问题解决。

### 5.4 验证 Django 是否安装成功

```powershell
.\.venv\Scripts\python.exe -c "import django; print(django.get_version())"
```

如果这一步报错，说明虚拟环境或依赖安装还没成功。

### 5.5 验证 Django 配置是否正常

```powershell
.\.venv\Scripts\python.exe manage.py check
```

### 5.6 启动本地后端

建议先跑本地端口 `8009`，因为你们振动前端当前就是按这个端口写的：

```powershell
.\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8009
```

这样你后续联调时，前端改动会最少。

---

## 6. 验证数据库是否连通

### 6.1 基础判断

后端配置文件里已经有数据库连接参数，但真正是否连通，要看 Django 启动时能否访问远程 MySQL。

你可以先执行：

```powershell
.\.venv\Scripts\python.exe manage.py check
```

如果这里只做配置检查不够明显，再进一步：

```powershell
.\.venv\Scripts\python.exe manage.py shell
```

进入后执行：

```python
from django.db import connection
connection.ensure_connection()
print("DB OK")
```

如果输出 `DB OK`，说明数据库已连通。

如果报错，优先排查：

- 网络能否访问 `8.159.143.133:3306`
- 数据库用户名密码是否有效
- 本机防火墙/学校网络是否拦截
- `mysqlclient` 是否安装正确

---

## 7. 先验证哪些接口

不要一上来就做全部功能。先验证“最小业务闭环”。

建议优先验证这几个接口：

### 7.1 查询某设备当前上下限

```text
GET /data/get_threshold_or_offset
```

示例：

```text
http://127.0.0.1:8009/data/get_threshold_or_offset?device_name=安楼外幕墙2D&device_type=accelerometer
```

### 7.2 手动更新某设备上下限底层字段

```text
GET /data/update_threshold_or_offset
```

示例：

```text
http://127.0.0.1:8009/data/update_threshold_or_offset?device_name=安楼外幕墙2D&type=x_limit&value=0.32
```

### 7.3 查询异常/预警记录

```text
GET /data/get_abnormal_data
GET /data/get_abnormal_data_with_type
```

### 7.4 获取比例数据

```text
GET /data/get_ratio_data
```

如果这几个接口在浏览器或 Postman 里能正常返回，说明本地后端基础链路已经跑起来了。

---

## 8. 本地前后端联调

### 8.1 当前问题

你们振动模块前端现在很多地方写死了：

```text
http://110.42.214.164:8009
```

涉及文件包括：

- [pages/vibration/index.vue](../pages/vibration/index.vue)
- [pages/vibration/dashboard.vue](../pages/vibration/dashboard.vue)
- [pages/vibration/parameter.vue](../pages/vibration/parameter.vue)
- [pages/vibration/abnormal.vue](../pages/vibration/abnormal.vue)

### 8.2 联调目标

真正的“本地打通”应该是：

- 前端在本地 `localhost:3000`
- 后端在本地 `127.0.0.1:8009`
- 前端振动模块访问的是你本地启动的 Django，不是远程服务器

### 8.3 最简单的联调方式

先把这些页面里的 `API_BASE_URL` 改成：

```ts
const API_BASE_URL = 'http://127.0.0.1:8009'
```

或者：

```ts
const API_BASE_URL = 'http://localhost:8009'
```

这样能最快开始联调。

后续更规范的做法是统一改成环境变量，不要再页面里硬编码。

---

## 9. 你们现在最该优先打通的业务

老师现在关心的是“按钮后面有没有真实业务”，不是“页面有没有画出来”。

所以优先级建议是：

### 第一优先级

把参数页做成真实业务闭环：

1. 查询某设备当前上下限
2. 手动设置上下限并保存
3. 刷新后还能查到更新后的值

### 第二优先级

把预警规则改成真实后端存储：

- 一级预警阈值
- 二级预警阈值
- 三级预警阈值
- 邮件发送间隔

当前这部分前端还是本地保存，不算真正打通。

### 第三优先级

做 Agent 推荐上下限接口骨架：

- 获取推荐值
- 应用推荐值

注意：第一版不一定非要接真实机器学习模型，也可以先做伪数据或简单规则，只要业务链路跑通。

---

## 10. 建议的实际开发顺序

建议按下面顺序推进：

### 阶段 1：后端环境跑通

- 建虚拟环境
- 装依赖
- 跑 Django
- 验证数据库连接

### 阶段 2：本地联调基础接口

- `get_threshold_or_offset`
- `update_threshold_or_offset`
- `get_abnormal_data`

### 阶段 3：把前端预警模块切到本地后端

- 改 `API_BASE_URL`
- 确认参数页按钮都能打到本地 Django

### 阶段 4：补真实业务

- 预警规则后端存储
- Agent 推荐接口
- 应用 Agent 推荐
- 邮件节流

### 阶段 5：最后再做部署

不要在本地没联调通之前就部署服务器。

---

## 11. 常见问题

### 11.1 前端能打开，但后端没跑，这算打通吗？

不算。

这通常只是“本地前端正在访问远程接口”。

### 11.2 后端配置里有数据库地址，是不是就算数据库连上了？

不算。

必须通过 Django 实际验证连接成功才算。

### 11.3 为什么建议先跑 `8009`？

因为你们振动模块前端当前默认就是按 `8009` 写的。先保持这个端口，可以减少前端联调改动。

### 11.4 现在能不能直接部署？

不建议。

因为你们预警模块还没形成真实业务闭环，部署只会把“前端壳子”搬到服务器，并不能解决核心问题。

---

## 12. 你现在立刻可以执行的命令

### 前端

```powershell
cd "E:\Course Project\CurtainWallWeb-Frontend"
npm run dev
```

### 后端

```powershell
cd "E:\Course Project\Intelligent-Curtain-Wall"
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m ensurepip --upgrade
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "import django; print(django.get_version())"
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8009
```

### 数据库验证

```powershell
.\.venv\Scripts\python.exe manage.py shell
```

然后在 shell 里执行：

```python
from django.db import connection
connection.ensure_connection()
print("DB OK")
```

---

## 13. 下一步建议

你现在最应该先完成的是：

**把本地 Django 跑起来，并验证数据库连接。**

只要这一步过了，下一步我建议直接开始做：

**“预警规则后端接口 + 前端参数页切真接口”**

这是最短路径，也最能体现“前后端真正打通”。
