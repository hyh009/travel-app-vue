# 台灣景點地圖

在地圖上瀏覽台灣景點、收藏喜歡的地點。作品集專案,同時也是我學習 Vue 的練習(之前主要寫 React)。

**線上展示:** https://54-66-110-220.sslip.io

## 功能

- **地圖與列表連動**:拖動、縮放地圖會重新查詢範圍內的景點;滑鼠移到卡片,地圖顯示該景點的名稱;點地圖上的標記,列表捲到對應的卡片
- **收藏**:樂觀更新(先更新畫面,失敗再還原並提示);沒登入時按愛心會導去登入,登入後自動完成剛才的收藏
- **登入系統**:Email 註冊/登入,登出或登入逾期會自動離開需要登入的頁面
- **響應式**:1024px 以下地圖在上、卡片橫向捲動
- **後端範圍限制**:查詢範圍有上限,前端依地圖容器大小算出最小縮放等級,不讓使用者縮到會出錯的範圍

## 技術

| | |
|---|---|
| 前端 | Vue 3、Vuetify 4、Pinia、Vue Router、Leaflet(OpenStreetMap)、Vite |
| 後端 | Express 5、Prisma 7、PostgreSQL |
| 共用 | `@travel/shared`:zod schema 與型別,前後端共用同一份驗證規則 |
| 驗證 | JWT access token 放在 httpOnly cookie;refresh token 雜湊後存資料庫、每次使用就換新(rotation);密碼用 bcrypt |
| 部署 | Docker Compose、Caddy(自動 HTTPS)、AWS Lightsail |
| 工具 | pnpm workspace、TypeScript、ESLint、Prettier |

## 專案結構

```
apps/web         Vue 前端
apps/api         Express API + Prisma
packages/shared  前後端共用的 zod schema 與型別
```

正式環境由 Express 同時提供 API 和打包好的前端,前後端同一個網址,cookie 不需要處理跨站問題。

## 在本機執行

需要 Node.js 22、pnpm、Docker。

```bash
pnpm install

# 啟動資料庫(Docker)
pnpm db:up

# 設定後端環境變數,內容已經對應 docker-compose 的資料庫
cp apps/api/.env.example apps/api/.env

# 建立資料表、匯入景點資料
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 分別開兩個終端機
pnpm --filter api dev    # http://localhost:3000
pnpm --filter web dev    # http://localhost:5173
```

## 開發方式

開發過程使用 [Claude Code](https://claude.com/claude-code) 作為協作與學習工具,包含概念講解、程式碼審查、Docker 部署設定,以及用瀏覽器自動化驗證功能。
