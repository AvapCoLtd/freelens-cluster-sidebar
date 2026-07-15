# freelens-cluster-sidebar

Hotbar の略称表示を補完する、Catalog登録済み全クラスタのフルネーム常時表示パネル。

## 背景

FreeLens の Hotbar（左端の縦アイコン列）はクラスタ名を2〜3文字の略称でしか表示できない。
クラスタを多数登録している環境では略称だけで対象クラスタを判別できず、誤操作につながる。
詳細は [設計ドキュメント](docs/design.md) を参照。

## 使い方

1. Hotbar（左端の縦アイコン列）の領域そのものがホバー判定になっている（上端の TopBar と下端の Hotbar 切替メニューは除く）
2. Hotbar にマウスホバーすると即座にパネルが展開し、Catalog に登録済みの全クラスタがフルネームで一覧表示される
   - 各行に接続状態LED（緑=接続済 / 黄=接続中・切断中 / グレー=切断）とアクティブクラスタのハイライトが付く
3. マウスがパネル領域から離れると即座に折りたたまれる
4. 一覧内のクラスタ名をクリックすると、そのクラスタの概要ページへ遷移する（Hotbarクリックと同一挙動）

並べ替え・グルーピング・新規クラスタ追加等は扱わない（Hotbar / 既存Catalog画面の役割と重複させないため）。

## 初回デプロイの注意

新規プラグインの**初回**デプロイは、必ず FreeLens を起動した状態で `make freelens-cluster-sidebar/deploy` を実行すること。
FreeLens 終了中にデプロイすると、`.freelens/extensions/` への新規ディレクトリ追加をファイル監視が検知できず、
`AppData\Roaming\Freelens\node_modules\freelens-cluster-sidebar` への Junction が作られないまま `lens-extensions.json` にだけ
`enabled: true` 登録され、`Cannot find module ...\out\renderer\index.js` エラーで起動に失敗する。
既存プラグインの更新（`out/` の中身だけ差し替え）では Junction が既に存在するため、この問題は起きない。
