# novel

小説プレビュー＆リーダーのプレイグラウンド。認証ゲート・サーバー側ブックマーク・共有サイドバーを題材に 4 層アーキテクチャを実装している。

## 起動

```bash
pnpm --filter @tolone/novel dev   # http://localhost:5174
pnpm --filter @tolone/novel test
```

---

## ルーティング

```
/                        → 認証状態に応じてリダイレクト
                           ログイン済み → /books/1
                           ゲスト      → /preview-books/1

/login                   → ログイン画面（サイドバーなし）

/preview-books/:id       → 書籍サマリー画面（認証不要）
                           サマリー（タイトル・著者・概要）を表示
                           "Start reading →" でプレビュー読書に切り替わる（同一 URL・state 遷移）
                           プレビューは先頭 3 ページまで読める
                           3 ページ読み終えるとログイン CTA が表示される

/books/:id               → 認証済みリーダー画面
                           未認証の場合は /preview-books/:id にリダイレクト
                           サマリーを最初に表示し "Start reading →" でページ読書へ
                           サーバー側ブックマーク（currentPage）から続きを再開できる
```

---

## API エンドポイント（MSW でモック）

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | `/api/login` | 不要 | `{ email, password }` → `{ token }` |
| GET | `/api/books` | 不要 | サイドバー用の書籍一覧 |
| GET | `/api/preview-books/:id` | 不要 | 書籍メタデータ＋先頭 3 ページ |
| GET | `/api/books/:id` | 必要 | 書籍メタデータ＋現在ページ番号＋ページ本文 |
| POST | `/api/books/:id/next` | 必要 | ブックマークを 1 ページ進める → 新しいページ本文を返す |
| POST | `/api/books/:id/prev` | 必要 | ブックマークを 1 ページ戻す → 新しいページ本文を返す |

`GET /api/books/:id` のレスポンスに `currentPage`（ページ番号）と `pageContent`（本文）が含まれるため、ページ読書に必要なデータは 1 リクエストで揃う。next/prev もレスポンスにページ本文を含むため追加フェッチが不要。

---

## 認証

`document.cookie` に `novelAuth` キーで保存するシンプルなクッキー認証（プレイグラウンド用）。

- `src/lib/auth-cookie.ts` — 読み書き＋subscriber パターン
- `src/lib/use-auth.ts` — `useSyncExternalStore` で `{ isLoggedIn }` をリアクティブに提供
- ログアウトはクッキーをクリアするだけ（API 呼び出しなし）

---

## 機能ごとの構成

### `book-preview/`

| ファイル | 役割 |
|----------|------|
| `BookPreviewContainer` | `showSummary` state を持ち、SummaryComponent と BookPreviewComponent を切り替える |
| `BookPreviewSummaryComponent` | タイトル・著者・概要＋"Start reading" ボタン |
| `BookPreviewComponent` | プレビューページネーション（1〜3 ページ）＋CTA |
| `BookPreview.facade` | `GET /api/preview-books/:id` を 1 回フェッチ。ページ状態（`currentPage`）を `useState` で管理 |
| `BookPreview.presenter` | prev/next の可否・CTA 表示判定を導出 |

### `book-reader/`

| ファイル | 役割 |
|----------|------|
| `BookReaderContainer` | Facade を呼び出して BookReaderComponent に spread |
| `BookReaderComponent` | `showSummary=true` のときサマリービュー、`false` のときページビューを表示 |
| `BookReader.facade` | `GET /api/books/:id` でブックマーク＋ページ本文を取得。next/prev mutation でキャッシュを楽観的更新 |
| `BookReader.presenter` | prev/next ボタンの表示判定 |

### `sidebar/`

Facade が書籍一覧（`GET /api/books`）を取得。ログアウトはクッキークリアのみで mutation の invalidation は不要（`useSyncExternalStore` が subscriber に通知する）。

### `login/`

Facade の `onSuccess` で `setAuthCookie(token)` を呼ぶ。ログイン後はルートの index redirect が `isAuthenticated()` を見て `/books/1` に遷移させる。

---

## 注意点

- 認証はクライアントサイドのみ。実際のバックエンドでは `Set-Cookie` とサーバーサイドガードが必要。
- ブックマークは MSW のインメモリ `Map` に保存されるため、ページリロードでリセットされる。
- 書籍データは `src/mocks/books-seed.ts` に 5 冊ハードコードされている。
