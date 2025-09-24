# セッション期限切れモーダル (Session Expired Modal)

## 概要

このコンポーネントは、ユーザーのセッションが期限切れになった際に自動的に表示されるモーダルです。
ユーザーはパスワードを再入力することで、セッションを更新できます。

## 機能

1. **自動認証状態チェック**: モーダルが開かれた際に、`/check-auth-status` APIを呼び出して認証状態を確認
2. **パスワード再入力**: ユーザーはパスワードのみを入力して再ログイン可能
3. **自動セッション更新**: 正しいパスワードが入力されると、新しいトークンでセッションが更新される
4. **エラーハンドリング**: パスワードが間違っている場合の適切なエラーメッセージ表示
5. **強制リダイレクト**: ユーザーが再ログインせずにモーダルを閉じた場合、ホームページにリダイレクト

## 使用方法

### 1. 基本的な使用方法

```tsx
import useSessionExpiredModal from "@/hooks/useSessionExpiredModal";

const MyComponent = () => {
  const { open, close, isOpen } = useSessionExpiredModal();

  // セッション期限切れを検出した際にモーダルを開く
  const handleSessionExpired = () => {
    open();
  };

  return (
    <div>
      <button onClick={handleSessionExpired}>
        セッション期限切れテスト
      </button>
    </div>
  );
};
```

### 2. API呼び出し時の自動処理

```tsx
import { handleApiAuthError } from "@/lib/sessionManager";

const fetchData = async () => {
  try {
    const response = await fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // 認証エラーの場合、自動的にモーダルが表示される
      if (handleApiAuthError(response, token)) {
        return; // 認証エラーの場合は処理を中断
      }
      // その他のエラー処理
    }

    const data = await response.json();
    // データ処理
  } catch (error) {
    console.error('エラー:', error);
  }
};
```

### 3. 定期的なセッション監視

```tsx
import { startSessionMonitoring } from "@/lib/sessionManager";

const MyComponent = () => {
  useEffect(() => {
    if (token) {
      // 5分ごとにセッション状態をチェック
      const cleanup = startSessionMonitoring(token, 5);
      
      return cleanup; // コンポーネントアンマウント時にクリーンアップ
    }
  }, [token]);

  return <div>...</div>;
};
```

## コンポーネント構成

### SessionExpiredModal
- メインのモーダルコンポーネント
- パスワード入力フォーム
- エラーメッセージ表示
- ローディング状態管理

### SessionExpiredModalWrapper
- レイアウトファイルに配置されるラッパー
- グローバルな状態管理との連携

### useSessionExpiredModal
- Zustandベースの状態管理フック
- モーダルの開閉状態を管理

## API エンドポイント

### 認証状態チェック
```
GET /check-auth-status
```

### 再ログイン
```
POST /api/v1/users/login
Body: { "email": "user@example.com", "password": "password" }
```

## 状態管理

- **isOpen**: モーダルの表示状態
- **loading**: ログイン処理中の状態
- **checkingAuth**: 認証状態チェック中の状態
- **error**: エラーメッセージ

## セキュリティ機能

1. **強制モーダル**: ユーザーはモーダルを閉じることができない（再ログインまたはリダイレクトのみ）
2. **パスワード検証**: 正しいパスワードでのみセッション更新が可能
3. **自動リダイレクト**: 不正な操作を防ぐため、適切なページにリダイレクト

## カスタマイズ

### スタイルの変更
Mantine UIのテーマシステムを使用して、モーダルの外観をカスタマイズできます。

### メッセージの変更
各言語に対応したメッセージを表示するため、国際化対応も可能です。

## 注意事項

1. このコンポーネントは、ユーザーが既にログインしている状態でのみ使用してください
2. モーダルが開かれた際は、必ずユーザーの操作（再ログインまたはリダイレクト）が必要です
3. セッション監視機能は、必要に応じて使用してください（過度なAPI呼び出しを避ける）
