# Claude Code Project Guidelines

このプロジェクトで作業する際は、以下のガイドラインに従ってください。

## Conventional Commits

このプロジェクトでは、すべての **commit メッセージ** と **PR タイトル** は [Conventional Commits](https://www.conventionalcommits.org/) に従う必要があります。

### フォーマット

```
<type>: <description>

[optional body]

[optional footer(s)]
```

### 利用可能な Type

- `feat`: 新機能の追加
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（空白、フォーマット、セミコロンの欠落など）
- `refactor`: バグ修正や機能追加を行わないコード変更
- `perf`: パフォーマンスを向上させるコード変更
- `test`: 不足しているテストの追加や既存のテストの修正
- `build`: ビルドシステムや外部依存関係に影響する変更
- `ci`: CI 設定ファイルとスクリプトの変更
- `chore`: その他の変更（ソースやテストファイルを変更しない）
- `revert`: 以前のコミットを取り消す

### 例

**Commit メッセージ:**
```
feat: add user authentication
fix: resolve null pointer exception in chat handler
ci: add PR checks for lint and typecheck
docs: update README with setup instructions
```

**PR タイトル:**
```
feat: implement dark mode support
fix: correct webhook message formatting
ci: add GitHub Actions workflow for PR validation
```

### 重要事項

- **すべての commit** は Conventional Commits 形式に従うこと
- **すべての PR タイトル** は Conventional Commits 形式に従うこと
- description は小文字で始めること（例: `feat: add feature` ✓、`feat: Add feature` ✗）
- CI で自動的にチェックされ、形式に従っていない場合は PR をマージできません

## コードスタイル

- Biome を使用してコードをフォーマット・lint します
- TypeScript の型チェックを必ず通すこと
- すべてのテストが通ることを確認すること

## CI/CD

PR がマージされる前に、以下のチェックが自動的に実行されます：

1. **Biome Lint**: コードスタイルと潜在的な問題のチェック
2. **TypeScript Type Check**: 型の整合性チェック
3. **Tests**: すべてのテストが成功すること
4. **PR Title Check**: PR タイトルが Conventional Commits に従っているかチェック

これらすべてのチェックが通らない限り、PR をマージすることはできません。
