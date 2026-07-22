[English](CONTRIBUTING.en.md)

# Contributing

## 環境構築

`make build` / `make deploy` 等はすべて Docker コンテナ内で完結する。ホストに必要なのは Docker と `jq` のみ。

コントリビューターごとに異なるパス(ローカルの FreeLens 拡張機能ディレクトリ等)は、リポジトリルートの `.env` ファイル(gitignore対象)に置く。

```sh
# `make deploy` のデプロイ先(FreeLens拡張機能ディレクトリ)。
# 未設定だと `make deploy` はエラーで停止する。
# 例(WSLからネイティブWindows版FreeLensを操作する場合):
#   /mnt/c/Users/<user>/.freelens/extensions
FREELENS_EXT_DIR=
```

`make <target> VAR=value` で実行時に個別上書きも可能。

## ビルド・デプロイ

```sh
make build    # 依存関係インストール + ビルド
make deploy   # ビルド + FREELENS_EXT_DIR へデプロイ
make lint     # Biome lint
make fmt      # Biome format (--write)
make pack     # .tgz へパック
make clean    # node_modules/out/*.tgz/.pnpm-store を削除
```

### 初回デプロイの注意

新規追加した拡張機能の**初回** `make deploy` は、FreeLens起動中に実行する必要がある。

FreeLensの拡張機能ディスカバリーは `~/.freelens/extensions/` をfile watcher(chokidar, `ignoreInitial: true`)で監視しており、起動前から存在するディレクトリの追加は検知しない。起動時の初期スキャンもリンク生成処理を伴わないため、次回起動でも自動修復されない(OSを問わないFreeLens自体の設計)。

検知漏れのままだと `node_modules/freelens-cluster-sidebar` へのリンク(`pnpm install` によるsymlink。Windows環境でDeveloper Modeが無効な場合はJunction)が作られず、有効化しても `Cannot find module ...\out\renderer\index.js` としてログに記録されるだけでこの拡張機能のみロードに失敗する(FreeLens自体は起動する)。

この直接配置によるデプロイは公式ドキュメント化された正規のインストール手順ではない(公式は `.tgz` をExtensions画面からパス指定/drag&dropする方式を案内している)。`make deploy` 一発で反復ビルド・デプロイを回すための非公式なショートカットであり、この制約はその副作用。

以降の更新(`out/` の中身のみ差し替え)はリンクが既に存在するため影響を受けない。

(WSL2からWindows側FreeLensへデプロイする場合、`.freelens/extensions/` への書き込みがWSL↔Windowsのファイルシステム境界を越えるため、起動中でもfile watcherイベントが確実に届くかは未検証。反映されない場合はFreeLensの再起動で切り分けること)

## リリース手順

1. `package.json` の `version` をリリースしたい値に上げ、コミット
2. `make tag` を実行。`package.json` のバージョンから `vX.Y.Z` タグを作成しpushする(既に同名タグがあれば拒否される)
3. GitLab CIがタグを検知し、以下を実行
   - Docker内で拡張機能をビルドし `.tgz` へパック(`make pack`)
   - `.tgz` とその `.sha256` を GitLab Generic Package Registry へアップロード
   - それらのファイルを添付した GitLab Release を作成
   - リポジトリをGitHubへミラー
   - `.tgz` と `.sha256` を添付した GitHub Release を作成

GitHubミラー処理は、プロジェクトにCI変数 `GH_APP_ID` / `GH_APP_PRIVATE_KEY` が設定されている場合のみ実行される。
設定済みなら `master` へのpushとタグ作成のたびに自動でGitHubへミラーされる。未設定ならGitLabのみが正とされ、GitHub関連ジョブはスキップされる。
