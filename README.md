# 拾光课表 (ClassFlow)

一款基于 **React Native + Expo (TypeScript)** 打造的跨平台高颜值大学课表 App（支持 Android、iOS 与 Web 预览），设计灵感参考 GitHub 热门开源课表项目 **SleepIn**、**WakeUp课程表** 与 **下节啥课**。

## 核心功能

- **周视图课表**：支持 1-20+ 周快速切换、高亮今日、单双周与自定义周次、非本周课程虚线淡化显示、点击空白格快捷加课、点击课程卡片查看详情与编辑。
- **今日日程 & 实时倒计时**：顶部渐变倒计时卡片，实时显示「正在上课（含进度条与下课倒计时）」「下一节倒计时」或「明日第一节预览」。
- **教务系统导入**：
  - **内置教务 WebView 浏览器（移动端）**：支持直接打开学校教务系统登录，进入个人课表页后点击「一键抓取当前页课表」，自动注入脚本识别 **新正方、旧正方、强智、青果、URP** 及通用 HTML 表格。
  - **智能粘贴 / 文件导入（移动端 & Web 通用）**：自动识别新正方 `kbList` JSON、教务网页表格 HTML、WakeUp `.wakeup_schedule` 5 行格式、JSON 备份与 CSV 表格。
- **日历导出与备份**：支持一键导出标准 `.ics`（iCalendar，含课前 15 分钟提醒，可直接导入 iOS / Android / Google 日历）、JSON 完整备份与 CSV 表格。
- **高颜值个性化外观**：内置莫兰迪、马卡龙、极光、纸墨 4 套精选 12 色板；支持浅色 / 深色 / 跟随系统；内置 5 款渐变壁纸 + 自定义相册壁纸 + 卡片通透度调节 + 自定义 12 节作息时间表。

## 本地运行与打包

```bash
cd classflow-app

# 1. 启动开发服务器（手机安装 Expo Go 扫码即可直接体验）
npx expo start

# 2. 在电脑浏览器中预览
npx expo start --web

# 3. 打包 Android APK（需安装 EAS CLI 或本地 Android Studio）
npx eas build -p android --profile preview
```
