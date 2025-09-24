# 講義予約システム データベース

## 概要

このディレクトリには、講義予約システムのPostgreSQLデータベース設定が含まれています。

## ファイル構成

```
database/
├── Dockerfile              # データベース用Dockerfile
├── init.sql               # データベース初期化スクリプト
├── docker-compose.yml     # データベース専用のDocker Compose設定
└── README.md              # このファイル
```

## データベース仕様

- **データベースエンジン**: PostgreSQL 15 Alpine
- **データベース名**: `lecture_booking`
- **ユーザー名**: `lecture_admin`
- **パスワード**: `postgresroot`
- **ポート**: 5432 (内部), 5433 (外部アクセス用)

## テーブル構成

### 1. ユーザー情報テーブル (user_infos)
- ユーザーの基本情報を管理
- ロール: student, teacher, admin

### 2. 講師情報テーブル (teacher_profiles)
- 講師の詳細情報を管理
- ユーザー情報テーブルと1対1の関係

### 3. 講義情報テーブル (lectures)
- 講義の基本情報を管理
- 承認ステータス: pending, approved, rejected

### 4. 講義スケジュールテーブル (lecture_schedules)
- 講義の時間割を管理
- 日付、開始時間、終了時間

### 5. 講義予約テーブル (lecture_bookings)
- ユーザーの講義予約を管理
- ステータス: pending, confirmed, cancelled

### 6. カルーセルテーブル (carousel)
- ホームページのカルーセル表示を管理

## 使用方法

### 1. データベースのみを起動

```bash
# データベースディレクトリに移動
cd database

# データベースを起動
docker-compose up -d

# ログを確認
docker-compose logs -f postgres

# データベースを停止
docker-compose down
```

### 2. データベースに接続

```bash
# データベースコンテナに接続
docker-compose exec postgres psql -U lecture_admin -d lecture_booking

# または外部から接続（ポート5433を使用）
psql -h localhost -p 5433 -U lecture_admin -d lecture_booking
```

### 3. データベースのリセット

```bash
# データベースを停止してボリュームを削除
docker-compose down -v

# 再起動（初期化スクリプトが実行される）
docker-compose up -d
```

## 初期データ

システム起動時に以下のデフォルト管理者アカウントが作成されます：

- **メールアドレス**: admin@example.com
- **パスワード**: Admin1234
- **ロール**: admin
- **名前**: システム管理者

## 設定オプション

### 環境変数

- `POSTGRES_DB`: データベース名
- `POSTGRES_USER`: ユーザー名
- `POSTGRES_PASSWORD`: パスワード
- `PGDATA`: データディレクトリ
- `POSTGRES_INITDB_ARGS`: 初期化時の追加引数

### ボリューム

- `postgres-data`: データベースの永続化データ
- `./init.sql:/docker-entrypoint-initdb.d/init.sql:ro`: 初期化スクリプト

### ネットワーク

- `booking-network`: データベース専用ネットワーク

## ログ設定

- ログローテーション: 1日または10MBでローテーション
- 最大ファイル数: 3ファイル
- ログレベル: 全SQL文をログ出力

## パフォーマンス設定

- 共有メモリ: pg_stat_statements拡張を有効化
- クエリ統計: 全クエリを追跡
- インデックス: 主要フィールドにインデックスを設定

## セキュリティ

- 外部アクセス: 127.0.0.1のみ許可
- 初期化スクリプト: 読み取り専用でマウント
- データ永続化: Dockerボリュームを使用

## トラブルシューティング

### 1. データベースが起動しない

```bash
# ログを確認
docker-compose logs postgres

# ボリュームを確認
docker volume ls | grep postgres
```

### 2. 接続できない

```bash
# ポートが使用中か確認
netstat -tulpn | grep 5433

# コンテナの状態を確認
docker-compose ps
```

### 3. 初期化スクリプトが実行されない

- データディレクトリが空であることを確認
- 初期化スクリプトの権限を確認
- ログでエラーメッセージを確認

## 開発時の注意事項

1. データベースの変更は `init.sql` で行う
2. 既存データがある場合は、ボリュームを削除してから再起動
3. 本番環境ではパスワードを環境変数で管理する
4. 定期的にデータベースのバックアップを取る

