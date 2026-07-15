# freelens-cluster-sidebar 設計ドキュメント

本プラグインの設計判断の記録。使い方・デプロイ手順は [README](../README.md) を参照。

## 概要

Hotbarの略称表示を補完する、クラスタフルネーム常時表示パネル。

## 目的

1. Hotbarの2〜3文字の略称だけではクラスタを見分けられず、誤操作（意図しないクラスタでの操作）につながるリスクを解消する

## 背景・解決したい課題

FreeLensのHotbar（左端の縦アイコン列）は、クラスタ名を2〜3文字に短縮したアイコンラベルしか表示できない。
クラスタを多数登録している利用者は、略称だけでは目的のクラスタを確実に判別できない。
都度ホバーしてツールチップを確認する運用は手間が大きい。

FreeLens/Lens系のコミュニティにも同種の要望が複数存在する。
いずれも未解決のまま放置されている（[lensapp/lens#7333](https://github.com/lensapp/lens/issues/7333)、[#3498](https://github.com/lensapp/lens/issues/3498)）。
既存拡張機能・npmパッケージの調査でも該当する解決策は見つからなかった。

---

## スコープ

### やること

- Catalogに登録済みの全クラスタを、フルネームで一覧表示するパネルを追加する
- 折りたたみ⇔展開の2状態を持ち、ホバーで操作する
- 一覧の各行にクラスタフルネーム・接続状態LED・現在アクティブなクラスタのハイライトを表示する
- クラスタ名クリックで、そのクラスタの概要ページへ遷移する

### やらないこと

- クラスタの並べ替え・グルーピング機能（Hotbar自体に既にある機能と重複させない）
- クラスタの新規追加・削除・kubeconfig編集（既存のCatalog/Hotbar画面で代替可能）
- 接続状態の詳細表示（エラーメッセージ等）。
  LEDインジケータのみに絞る。
- 商用Lens Desktop「Navigator」と同等のレイアウト分割表示（メインコンテンツを圧迫しない表示）。
  Extension APIの構造的制約により実現不可能と判明済み

---

## 機能仕様

### ユーザーフロー

1. FreeLens起動 → Hotbar領域そのもの（上端のTopBarと下端のHotbar切替メニューを除く）がホバー判定になる（折りたたみ時は透明で、見た目は通常のHotbarのまま）
2. Hotbar領域にマウスホバー → 即座にパネルが展開し、Hotbarを一時的に覆って左端から広がる
3. 展開されたパネルに、登録済み全クラスタがフルネームで一覧表示される。
   各行にクラスタ名・接続状態LED・現在アクティブなクラスタのハイライトが表示される。
4. マウスがパネル領域から離れる → 即座に折りたたみ状態へ戻る
5. 展開中にクラスタ名をクリック → そのクラスタの概要ページへ遷移する（Hotbarクリックと同一挙動）

### Input/Output

| 操作 | Input | Output | 備考 |
|------|-------|--------|------|
| ホバー展開 | Hotbar領域(TopBar・Hotbar切替メニューを除く)へのマウスオーバー | 折りたたみ状態→展開状態へ遷移 | 遅延なし。マウスが離れると即座に折りたたみへ戻る |
| クラスタ一覧表示 | なし（`Catalog.getAllClusters()`から取得） | クラスタごとに「フルネーム・接続状態LED・アクティブハイライト」を1行で表示 | Catalogの全クラスタが対象（Hotbar未登録も含む） |
| クラスタ切替 | 一覧内のクラスタ名クリック | 対象クラスタの概要ページへ遷移 | `entity.onRun(...)`経由。Hotbarクリックと同一挙動 |
| 表示位置 | なし | Hotbarに重ねて常時存在（折りたたみ時は透明なホバー判定のみ） | `topBarItems` + React Portalでメインウィンドウ常駐として実装 |

---

## 設計決定事項

| # | 項目 | 決定 | 理由 |
|---|------|------|------|
| 1 | クラスタ一覧の取得元 | `Catalog.getAllClusters()`（Extension公式API） | Hotbar構成（何が登録されているか）を取得する公式APIが存在しないため、表示対象をCatalogの全クラスタに変更。公式APIの範囲内で完結し安定性が高い |
| 2 | クラスタ切替の実行 | `entity.onRun({ navigate: Renderer.Navigation.navigate, setCommandPaletteContext: () => {} })` | `CatalogEntity`基底クラスのpublicメソッド`onRun`と、Extension公式APIの`Renderer.Navigation.navigate`のみで完結。`entityRegistry`のprotectedプロパティへの実行時アクセスという非公式手段も、react-router-dom（`useHistory()`）への依存も避けられる |
| 3 | パネルの実装方式 | `topBarItems`（Extension公式API） + React Portalで`document.body`直下に固定配置 | PoCで実証済み。クラスタ内`<iframe>`にのみ存在する`clusterFrameComponents`は、クラスタ切替やクラスタ未選択画面をまたいで永続しないため不採用 |
| 4 | パネルの配置 | Hotbarに重ねる（Hotbarの右隣＝クラスタサイドバーメニュー領域には重ねない） | Hotbarの右隣に配置すると既存のクラスタサイドバーメニュー（概要/Pods/ワークロード等）を覆いクリック不能にしてしまう。Hotbarとこのパネルは「クラスタへのクイックアクセス」という役割が重複するため、展開中Hotbarが隠れても実用上の支障が小さい |
| 5 | react-domのグローバル参照 | `electron.vite.config.js`で`"react-dom": "global.ReactDOM"`（大文字DOM）を使う | FreeLens hostが実際にエクスポートするグローバルは`ReactDOM`。`freelens-locale-ja`には`"global.ReactDom"`（小文字dom）というタイポがあり、react-domを実際に使う初のプラグインとしてPoCで顕在化・特定した（locale-ja側も修正済み） |
| 6 | 接続状態の追従方式 | パネル本体をmobxの`observer`でラップし、`getAllClusters()`をレンダー内で呼ぶ | 一度限りの呼び出しでは接続状態の変化（CONNECTING→CONNECTED等）を拾えず、静的リストになってしまうため |
| 7 | 展開/折りたたみのトリガー | ホバーで即座に展開・カーソルが離れたら即座に折りたたむ（遅延なし） | 画面左端はマウスが日常的に通過する場所だが、意図せず展開してもすぐ閉じられる方が、遅延を挟むより利便性が高いと判断 |
| 8 | ホバー判定の範囲 | Hotbar全域（幅75px）。ただし上端のTopBar(40px)と下端のHotbar切替メニュー(48px)は除外し、そこは従来通り操作可能に残す | 当初の「右端の細いハンドル(6px)」は実機で当たり判定が狭すぎた。Hotbar全域をトリガーにするとHotbarアイコンの直接クリックは不可になるが、パネルの行クリックが同一機能を提供するため支障なし（実機フィードバックで決定） |

---

## 技術メモ

- 初回デプロイの注意は [../CONTRIBUTING.md](../CONTRIBUTING.md) 参照
- WSLの `cp` 経由でのファイル配置は、Windows側のファイル監視（chokidar）に検知されないことがある。
  ディレクトリを削除→即再作成するような操作を伴う場合は、PowerShell（Windows側ネイティブ）から直接操作する方が確実
- `KubernetesCluster.onRun` の実装は `context.navigate(\`/cluster/${id}\`)`を呼ぶだけの薄い処理。
  `navigate`コールバックの実体（`history.push`）さえ用意すれば、URL形式を意識する必要はない。
- `getAllClusters()` の実体はCatalogエンティティレジストリ（Hotbar/Catalog画面と同一のデータソース）。
  レジストリはmainプロセスとのIPC同期で充填されるが、FreeLensは充填完了を待たずに拡張をロードするため、拡張ロード直後の一瞬は空配列が返ることがある。
  レジストリはobservableなので、observer配下なら同期完了後に自動で再描画される。
