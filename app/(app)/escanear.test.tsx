// specs/008-scan-experience/tasks.md T019 (US3, FR-003): confirms app/(app)/escanear.tsx — the
// file the shell's Escanear tab now resolves to, replacing the retired standalone app/scan.tsx —
// renders the real scan visual shell (ScanShellScreen) with a working local "found" trigger, not
// camera UI, not a capture flow, and no "Back" affordance of its own (the shell provides
// navigation away like every other destination). This is an ordinary screen route file (not a
// `_layout.*` file), so per docs/conventions.md's Tests section it stays colocated under app/
// like every other route test in this repo.
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";

import EscanearRouteScreen from "./escanear";

describe("app/(app)/escanear.tsx", () => {
  // FR-003, spec.md US3 AS1: "/escanear" renders the real branded visual shell (title
  // "Escanear", defaulting to Spanish/DEFAULT_LOCALE with no <LocaleProvider> wrapping this
  // render) — not camera UI, not a capture flow — and no standalone "Back" button (the shell
  // itself provides navigation away).
  it('renders the scan visual shell (title "Escanear") with no standalone "Back" affordance', () => {
    render(<EscanearRouteScreen />);

    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText(scanCopy.es.titleMobile)).toBeTruthy();
    expect(screen.queryByTestId("scan-back-button")).toBeNull();
  });

  // FR-004, FR-007, FR-008, spec.md US3 AS1-AS2: pressing "Escanear carta" triggers the local
  // found state end to end through this route.
  it('pressing "Escanear carta" shows the found panel inline', () => {
    render(<EscanearRouteScreen />);

    fireEvent.press(screen.getByTestId("scan-shell-button"));

    expect(screen.getByText(scanCopy.es.viewfinderFoundHeading)).toBeTruthy();
    expect(screen.getByTestId("found-card-panel")).toBeTruthy();
  });
});
