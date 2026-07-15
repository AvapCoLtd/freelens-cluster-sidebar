import { Common, Renderer } from "@freelensapp/extensions";

// Record を Partial にしない: 新しい ClusterConnectionStatus 追加時にコンパイルエラーで検知できなくなる。
const LED_COLOR: Record<Common.Clusters.ClusterConnectionStatus, string> = {
  [Common.Clusters.ClusterConnectionStatus.CONNECTED]: "var(--colorSuccess, #4caf50)",
  [Common.Clusters.ClusterConnectionStatus.CONNECTING]: "var(--colorWarning, #ffc107)",
  [Common.Clusters.ClusterConnectionStatus.DISCONNECTING]: "var(--colorWarning, #ffc107)",
  [Common.Clusters.ClusterConnectionStatus.DISCONNECTED]: "var(--halfGray, #6b6f76)",
};

const CLUSTER_ROW_CLASS = "flcs-row";

// inline style は :hover を表現できないため<style>で注入する(transparentはbuttonのUA既定背景の打ち消し)。
// backgroundのhoverはinlineのアクティブ背景に負けて効かないため、filter(brightness)で全行のホバーを保証する。
export const CLUSTER_ROW_HOVER_CSS = `
  .${CLUSTER_ROW_CLASS} { background: transparent; }
  .${CLUSTER_ROW_CLASS}:hover {
    background: var(--sidebarItemHoverBackground, rgba(255, 255, 255, 0.08));
    filter: brightness(1.2);
  }
`;

export interface ClusterRowProps {
  cluster: Common.Clusters.ClusterInfo;
}

export function ClusterRow({ cluster }: ClusterRowProps) {
  const handleClick = () => {
    const entity = Renderer.Catalog.catalogEntities.getById(cluster.id);
    // Catalogのエンティティは非同期に増減するため対象消失もあり得る: エラー扱いにせず何もしない
    if (!entity?.onRun) return;
    // ErrorBoundaryは非同期コールバック内の例外を捕捉できないため、ここで自前でログする
    Promise.resolve(
      entity.onRun({
        navigate: Renderer.Navigation.navigate,
        setCommandPaletteContext: () => {},
      }),
    ).catch((error) => console.error("[freelens-cluster-sidebar] entity.onRun failed", error));
  };

  return (
    <button
      type="button"
      className={CLUSTER_ROW_CLASS}
      onClick={handleClick}
      title={cluster.name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "10px 12px",
        border: "none",
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        // 非アクティブ行はinlineに書かない: クラスの:hover背景より優先されて効かなくなる
        background: cluster.isActive ? "var(--navSelectedBackground, rgba(90, 150, 220, 0.25))" : undefined,
        color: "var(--textColorPrimary, #fff)",
        fontSize: 14,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: LED_COLOR[cluster.status],
        }}
      />
      <span
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cluster.name}
      </span>
    </button>
  );
}
