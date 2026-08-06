// Minimal ambient type declaration for `react-test-renderer/shallow` — a transitive dependency
// of the already-installed `react-test-renderer` (no new package added), which ships no type
// declarations of its own and has no `@types/react-test-renderer` shallow-renderer coverage.
// Used by src/features/navigation/AppNativeLayout.test.tsx (specs/008-scan-experience T020a,
// AS4 follow-up) to shallow-render app/(app)/_layout.tsx's default export without needing a
// <NavigationContainer>.
declare module "react-test-renderer/shallow" {
  import type { ReactElement } from "react";

  export default class ShallowRenderer {
    render(element: ReactElement): ReactElement | null;
    getRenderOutput(): ReactElement | null;
    unmount(): void;
  }
}
