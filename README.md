# carlet-interview-20260119

以 Bun + Hono + Drizzle ORM + PostgreSQL 建置的預約服務 API。提供查詢可預約時段、建立預約與競態控制。

## 特色

- 可預約時段為 09:00–16:00（每小時一個時段）
- 以資料庫交易與唯一索引避免同時預約衝突
- 提供簡單的健康檢查與查詢空檔 API

## 技術棧

- Runtime / Package Manager：Bun
- Web Framework：Hono
- Database：PostgreSQL
- ORM / Query Builder：Drizzle ORM
- Validation：Zod

## 快速開始

### 1. 下載專案

```sh
git clone git@github.com:taichunmin/carlet-interview-20260119.git
cd carlet-interview-20260119
```

### 2. 安裝依賴

安裝 bun: <https://bun.com/docs/installation>

然後安裝 dependencies

```sh
bun install
```

### 3. 設定環境變數

```sh
cp .env.example .env
```

`.env` 主要欄位：

- `POSTGRES_URL`：資料庫連線字串
- `DOCKER_*`：docker compose 啟動本機資料庫的參數

### 4. 啟動本機開發用資料庫 (選用)

安裝 Docker: <https://docs.docker.com/engine/install/>

啟動本機 PostgreSQL（含 Adminer）：

```sh
docker compose up -d
```

Adminer 網址: http://localhost:8080

### 5. 套用資料庫結構與種子資料

```sh
bun run migration

# seeder 會先重設資料庫，請勿於正式環境中使用
bun run seeder
```

### 6. 啟動伺服器

```sh
bun run dev
```

預設服務位置：

- http://localhost:3000

## 專案結構

- `src/index.ts`：Hono API 入口與路由
- `src/index.test.ts`：API 測試
- `src/postgres/index.ts`：Drizzle 資料庫連線
- `src/postgres/schema.ts`：資料表與索引定義
- `src/postgres/seeder.ts`：重設資料庫與新增種子資料
- `drizzle.config.ts`：Drizzle CLI 設定
- `docker-compose.yml`：本機開發用 PostgreSQL 與 Adminer

## Scripts

- `bun run dev`：開發模式（hot reload）
- `bun run start`：正式啟動
- `bun run migration`：套用資料庫結構
- `bun run seeder`：重設資料庫與新增種子資料
- `bun test`：測試會先重設資料庫，請勿於正式環境中使用，建議可使用 Docker。
