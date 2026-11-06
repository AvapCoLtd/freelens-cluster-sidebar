---
last_verified: 2026-11-06
---

# FreeLens 拡張 API の情報源

FreeLens拡張開発で参照すべき情報源へのポインタ集。
陳腐化を避けるため、ここには内容を転記せずリンク先を一次情報として参照すること。
リンク切れ・記述齟齬を見つけたら本ファイルを更新する（frontmatterの `last_verified` も併せて更新）。

## 一次情報（FreeLens 公式）

| 情報源 | URL | 何がわかるか |
|---|---|---|
| FreeLens 公式ドキュメント | <https://freelensapp.github.io/docs/> | 拡張の全体像と、`globalPages` / `clusterPages` 等の登録ポイント。クラスは `LensRendererExtension` / `LensMainExtension` の名前で説明されているが、v2で継承する公開名は `Renderer.LensExtension` / `Main.LensExtension` |
| freelensapp/freelens（本体リポジトリ） | <https://github.com/freelensapp/freelens> | 実装の最終的な真実。API の挙動が不明なときはここを読む |
| freelens 本体 Wiki: Extensions | <https://github.com/freelensapp/freelens/wiki/Extensions> | 拡張の配布・インストール周りの運用情報 |
| freelensapp/freelens-example-extension | <https://github.com/freelensapp/freelens-example-extension> | 公式サンプル。clusterPages でのカスタムページ実装例。新規プラグインの雛形として最有力 |
| FreeLens v2の拡張API仕様 | <https://github.com/freelensapp/freelens/blob/main/docs/extensions/api.md> | v2の公開APIが保証する挙動と失敗時の挙動。登録・ルーティング・CSSの読み込み等を節ごとに扱う |
| FreeLens v2 移行ガイド | <https://github.com/freelensapp/freelens/blob/v2.0.0/docs/extensions/migrating-from-v1.md> | v1 拡張を v2 へ移す際の必須変更。削除・改名された API の対応表（v1→v2 rename table）もここにある |
| npm: `@freelensapp/extensions` | <https://www.npmjs.com/package/@freelensapp/extensions> | 拡張が依存する公開 API パッケージ。v2 では `globalThis.FreelensExtensionApi` を読むだけの shim と、単一の型定義 `dist/extension-api.d.ts` からなる。型定義がそのまま API リファレンスになる |
| npm: `@freelensapp/legacy-extensions` | <https://www.npmjs.com/package/@freelensapp/legacy-extensions> | 旧 Lens (OpenLens) 拡張 API との互換レイヤ |

## 補助情報（旧 Lens / upstream）

FreeLensはOpenLensのfork。
拡張の概念モデル（main/rendererの2プロセス構成、IPC、各種Registration）は旧Lensのドキュメントがそのまま概ね通用するが、記述がFreeLensの現状と食い違う場合は上の一次情報を優先する。

| 情報源 | URL | 何がわかるか |
|---|---|---|
| Lens Extension API docs | <https://api-docs.k8slens.dev/> | ガイドが体系的。Extension Anatomy / Main Extension / Renderer Extension / IPC（`broadcast` / `invoke` / `listen` / `handle`）の解説 |

## 実例

外部ドキュメントより先に、まず動いている実例として本リポジトリの `src` を読むこと。

- freelens-cluster-sidebar（本リポジトリ、[README](../README.md)）:
  `topBarItems` 登録 + `ReactDOM.createPortal` による常駐UI、`Renderer.Catalog` の使用例。
  [docs/design.md](design.md)にExtension APIの構造的制約（`clusterFrameComponents` がクラスタiframe内でしか生きない等）の調査記録あり
- [freelens-locale-ja](https://github.com/AvapCoLtd/freelens-locale-ja):
  公式登録APIを使わない実行時パッチ方式の例。
  `src/renderer/collector.ts` はrendererコードから `node:fs` を直接importして使う実例。
  ただしFreeLens 1.x向けの実装で、rendererからのNode利用はv2では使えない
- ビルド枠組み（Viteをrenderer用・main用の2回実行し、どちらもESMで出力する。host提供ライブラリは `globalThis.FreelensExtensionApi` へ置き換える）は `vite.config.mjs` と `build/vite-plugin-host-modules.mjs` に記載

## 型定義 = API リファレンス

公開APIの正確な形は型定義を直接読むのが確実。
v2では `node_modules/@freelensapp/extensions/dist/extension-api.d.ts` の1ファイルに全名前空間がまとまっている。

## 要点（ポインタの読み方）

- 拡張はrenderer（UI・React）とmain（Electron mainプロセス）の2エントリポイント構成。
  独立ページ追加はrenderer側の `globalPages` / `clusterPages`（`PageRegistration[]`）に登録する。
- v2のrendererエントリは `freelens-extension://` のURLから読み込まれるESMで、Node / Electronモジュールは使えない。
  CLI実行・ファイル操作等はmainへ置き、IPC（`Main.Ipc` の `handle` と `Renderer.Ipc` の `invoke`）で呼ぶ。
  `vite.config.mjs` の `noNodeInRenderer` が、rendererからのNode / Electronのimportをビルドエラーにする
- `clusterPageMenus` は上流Lensの公式ガイド例より**公式FluxCD拡張の実装を正とする**（<https://github.com/freelensapp/freelens-fluxcd-extension>）。
  実機で確認した差異が2件ある。
  全エントリ（親・子とも）に一意な `id` が必須（`id` 省略時は登録キーが拡張ID単体に潰れ、複数エントリが後勝ちで上書きされる）。
  親エントリにも `target` を併記する（ガイドは「`id` 指定時 `target` は無視される」と書くが、実機ではサイドバーのactiveハイライト挙動に影響した）。
  さらに親の `target` を子と同じpageIdにする場合、**子エントリを配列で親より先に置く**。
  上部タブストリップは「そのページをtargetに持つ最初のエントリ」の `parentId` から兄弟を導出するため、親が先だとそのページだけタブが消える。
- `Renderer.K8sApi` のKubeObjectStoreを自前ページから使う場合、namespacedリソースの `loadAll()` は**FreeLens上部の名前空間フィルタ選択に従う**（`contextNamespaces` 既定）。
  全件が要るなら `namespaceStore` から全名前空間を取り `loadAll({ namespaces })` で明示する。
  cluster-scopedリソース（Node / PV等）はこの影響を受けない。
- `clusterPages[].components.Page` に `observer()` 済みコンポーネントを渡さない。
  ホスト側 (`extension-route-registrator`) が再度 `observer()` を適用するためmobx-react-liteがthrowし、**自拡張の登録中断に加え他拡張のサイドバー項目まで消える**（v1.8.0〜1.10.3のcore実装で確認）。
  v2.0.0のホストも `observer(registration.components.Page)` を適用する（本体の `packages/core/src/renderer/routes/extension-route-registrator.injectable.tsx` で確認）。
  v2の実機でthrowするかは未確認。
  ページ内部の子コンポーネントの `observer()` は問題ない。
