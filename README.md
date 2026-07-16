[English](README.en.md)

# freelens-cluster-sidebar

Hotbar の略称表示を補完する、Catalog登録済み全クラスタのフルネーム常時表示パネル。

FreeLens の Hotbar（左端の縦アイコン列）はクラスタ名を2〜3文字の略称でしか表示できない。
クラスタを多数登録している環境では略称だけで対象クラスタを判別できず、誤操作につながる。
詳細は [設計ドキュメント](docs/design.md) を参照。

## 対応バージョン

FreeLens 1.8.0 以上(package.json の `engines` を参照)。
FreeLens 1.10.3(Extension API 1.10.3、Windows x64)で動作確認済み。

## インストール

GitHub Releases から最新の `.tgz` をダウンロードする。
FreeLens の Extensions 画面にドラッグ&ドロップする。
更新時も同様に新しい `.tgz` を取得して再インストールする。

## 使い方

1. Hotbar（左端の縦アイコン列）の領域そのものがホバー判定になっている（上端の TopBar と下端の Hotbar 切替メニューは除く）
2. Hotbar にマウスホバーすると即座にパネルが展開し、Catalog に登録済みの全クラスタがフルネームで一覧表示される
   - 各行に接続状態LED（緑=接続済 / 黄=接続中・切断中 / グレー=切断）とアクティブクラスタのハイライトが付く
3. マウスがパネル領域から離れると即座に折りたたまれる
4. 一覧内のクラスタ名をクリックすると、そのクラスタの概要ページへ遷移する（Hotbarクリックと同一挙動）

> [!NOTE]
> FreeLens の「ホットバーを自動的に隠す」設定は OFF を推奨する。
> Hotbar 領域全体が本パネルのホバー判定のため、有効のままだとメニュー操作時に意図せずパネルが開くことがある。

並べ替え・グルーピング・新規クラスタ追加等は扱わない。
Hotbar / 既存Catalog画面の役割と重複させないためである。

## リンク

- https://github.com/AvapCoLtd/freelens-cluster-sidebar (公開用)
- https://gitlab.avaper.day/avap/freelens-plugins/freelens-cluster-sidebar (開発用)

開発: [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## License

MIT
