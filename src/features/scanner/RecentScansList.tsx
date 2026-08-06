// T042 (specs/006-visual-identity, FR-008): the scan screen's "recent scans" list (brief §5.2,
// right column, below EmptyResultsPanel). Web-only in practice — rendered exclusively from
// ScanShellScreen.web.tsx's two/one-column composition (a later task).
//
// *** PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS ***
// PLACEHOLDER_ROWS below is STATIC, LOCAL, HAND-TYPED placeholder content — it is NOT real scan
// history, is NOT fetched from src/domain or any backend endpoint, and is NOT persisted
// anywhere. It exists purely so the two-column web layout reads correctly with something in it
// (spec.md FR-008, US3 AS6). FR-008's own text is "no src/domain fetch, no API call, no
// persistence" — this file's only src/domain import is the static i18n copy dictionary
// (`@/domain/i18n/copy/scan`, required by FR-010 so the "ESCANEOS RECIENTES" heading isn't
// hardcoded), never `@/domain/api-client` or any data-fetching module. This file MUST NOT gain
// an api-client import or a fetch/network call of any kind until a real scanner feature
// replaces PLACEHOLDER_ROWS (and likely this component's entire data source) with a genuine
// query — that is explicitly out of scope here.
import { StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, shadowSurface, space, typography } from "@/theme";

interface PlaceholderScanRow {
  id: string;
  name: string;
  meta: string;
  price: string;
  // Reuses existing theme color tokens for the placeholder thumbnail swatch (never a raw hex
  // literal, per FR-001) — src/theme has no dedicated "thumbnail swatch" token category, so this
  // cycles through a few visually distinct, already-defined semantic colors.
  thumbnailColor: string;
}

// See the file-level PLACEHOLDER-UNTIL-THE-REAL-SCANNER-FEATURE-SHIPS note above (FR-008) — this
// array is hand-typed placeholder data, not real scan results.
const PLACEHOLDER_ROWS: PlaceholderScanRow[] = [
  {
    id: "1",
    name: "Charizard",
    meta: "PSA 10 · GEN-001",
    price: "$450.00",
    thumbnailColor: colors.brand.primary,
  },
  {
    id: "2",
    name: "Blastoise",
    meta: "PSA 9 · GEN-009",
    price: "$210.00",
    thumbnailColor: colors.accent.priceGreen,
  },
  {
    id: "3",
    name: "Venusaur",
    meta: "PSA 9 · GEN-003",
    price: "$180.00",
    thumbnailColor: colors.text.link,
  },
];

export function RecentScansList() {
  const t = useTranslation(scanCopy);

  return (
    <View testID="recent-scans-list">
      <Text style={styles.heading}>{t("recentScansHeading")}</Text>
      <View style={styles.rows}>
        {PLACEHOLDER_ROWS.map((row) => (
          <View
            key={row.id}
            style={[styles.row, shadowSurface]}
            testID={`recent-scan-row-${row.id}`}
          >
            <View style={[styles.thumbnail, { backgroundColor: row.thumbnailColor }]} />
            <View style={styles.textColumn}>
              <Text style={styles.name}>{row.name}</Text>
              <Text style={styles.meta}>{row.meta}</Text>
            </View>
            <Text style={styles.price}>{row.price}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.label.section,
    marginBottom: space.md,
  },
  rows: {
    gap: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    borderRadius: radius.row,
    padding: space.lg,
    gap: space.md,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radius.row,
  },
  textColumn: {
    flex: 1,
  },
  // No dedicated "list item name/meta/price" entry exists in src/theme's typography scale
  // (docs/design-brief-visual-identity.md §5.2 specifies only weight/color, not size) — kept as
  // component-specific literals, mirroring the same accepted gap FormField.tsx's `error` style
  // already documents, rather than inventing an unspecified token.
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  meta: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent.priceGreen,
  },
});
