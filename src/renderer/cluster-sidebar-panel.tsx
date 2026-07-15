import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { CLUSTER_ROW_HOVER_CSS, ClusterRow } from "./cluster-row";

const HOTBAR_WIDTH = 75; // 実測値。変更するとHotbarの当たり判定がずれる
const TOPBAR_HEIGHT = 40; // 実測値。変更するとTopBarの操作に重なる
const HOTBAR_SELECTOR_HEIGHT = 48; // 実測値。変更するとHotbar切替メニューが操作不能になる
const PANEL_WIDTH = 300;
const Z_INDEX = 999999; // 小さくするとhostのダイアログ等の裏に回る

const EXPANDED_STYLE: React.CSSProperties = {
  width: PANEL_WIDTH,
  background: "var(--mainBackground, #1e2124)",
  borderRight: "1px solid var(--borderColor, #3f4041)",
  boxShadow: "2px 0 8px rgba(0, 0, 0, 0.4)",
};

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Portalでもdocument.bodyに描画されるだけでReactツリー上は子: ここで例外を捕捉できる。
class ClusterSidebarErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("[freelens-cluster-sidebar] panel crashed", error);
  }

  render(): React.ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}

const ClusterSidebarContent = observer(function ClusterSidebarContent() {
  const [expanded, setExpanded] = React.useState(false);
  const clusters = Renderer.Catalog.getAllClusters();

  return (
    <nav
      aria-label="クラスタ一覧"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: "fixed",
        top: TOPBAR_HEIGHT,
        bottom: HOTBAR_SELECTOR_HEIGHT,
        left: 0,
        width: HOTBAR_WIDTH,
        zIndex: Z_INDEX,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "transparent",
        ...(expanded && EXPANDED_STYLE),
      }}
    >
      {/* 条件分岐の中に置くとホバーのたびに<style>が再パースされる */}
      <style>{CLUSTER_ROW_HOVER_CSS}</style>
      {expanded && (
        <>
          <div
            style={{
              flexShrink: 0,
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: "bold",
              color: "var(--textColorSecondary, #9aa0a6)",
              borderBottom: "1px solid var(--borderColor, #3f4041)",
            }}
          >
            クラスタ
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {clusters.length === 0 ? (
              <div
                style={{
                  padding: "16px 12px",
                  fontSize: 13,
                  color: "var(--textColorSecondary, #9aa0a6)",
                }}
              >
                登録済みのクラスタがありません
              </div>
            ) : (
              clusters.map((cluster) => <ClusterRow key={cluster.id} cluster={cluster} />)
            )}
          </div>
        </>
      )}
    </nav>
  );
});

export function ClusterSidebarPanel() {
  return ReactDOM.createPortal(
    <ClusterSidebarErrorBoundary>
      <ClusterSidebarContent />
    </ClusterSidebarErrorBoundary>,
    document.body,
  );
}
