import { Renderer } from "@freelensapp/extensions";
import { ClusterSidebarPanel } from "./cluster-sidebar-panel";

export default class ClusterSidebarRenderer extends Renderer.LensExtension {
  topBarItems = [
    {
      components: {
        Item: ClusterSidebarPanel,
      },
    },
  ];
}
