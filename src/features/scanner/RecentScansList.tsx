// T042 (specs/006-visual-identity, FR-008): the scan screen's "recent scans" list (brief §5.2,
// right column, below EmptyResultsPanel/FoundCardPanel). Web-only in practice — rendered
// exclusively from ScanShellScreen.web.tsx's two/one-column composition.
//
// specs/008-scan-experience/tasks.md T022 (US4, FR-010): the local, hand-typed `PLACEHOLDER_ROWS`
// array (006-visual-identity's unrelated Charizard/Blastoise/Venusaur set) is replaced by
// `SAMPLE_CARDS` (src/domain/scanResults.ts, T002) + `formatListMeta(card)` per row — this is now
// the SAME single source of truth `useScanSimulation.ts`'s found-card trigger and
// `FoundCardPanel.tsx` already read from (plan.md's "Sample-card pool" Research Decision), not a
// second, independently-typed card list that could drift from it. `SAMPLE_CARDS` is still static,
// compiled-in fixture data (spec.md FR-010) — this file's only `@/domain` imports remain the
// static i18n copy dictionary and this one data module; neither is a fetch/API call, and this file
// MUST NOT gain an `@/domain/api-client` import or a fetch/network call until a real scanner
// feature replaces `SAMPLE_CARDS` with a genuine query.
//
// Human-requested follow-up (2026-08-06): each row's thumbnail now renders `card.thumbnailGradient`
// via the shared `CardThumbnail.tsx` (an `expo-linear-gradient` wrapper) instead of a flat
// `backgroundColor` swatch, per the supplied mockups.
import { StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import { formatListMeta, SAMPLE_CARDS } from "@/domain/scanResults";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { colors, radius, shadowSurface, space, typography } from "@/theme";

import { CardThumbnail } from "./CardThumbnail";

export function RecentScansList() {
  const t = useTranslation(scanCopy);

  return (
    <View testID="recent-scans-list">
      <Text style={styles.heading}>{t("recentScansHeading")}</Text>
      <View style={styles.rows}>
        {SAMPLE_CARDS.map((card) => (
          <View
            key={card.id}
            style={[styles.row, shadowSurface]}
            testID={`recent-scan-row-${card.id}`}
          >
            <CardThumbnail
              gradient={card.thumbnailGradient}
              size={44}
              testID={`recent-scan-thumbnail-${card.id}`}
            />
            <View style={styles.textColumn}>
              <Text style={styles.name}>{card.name}</Text>
              <Text style={styles.meta}>{formatListMeta(card)}</Text>
            </View>
            <Text style={styles.price}>{card.priceLabel}</Text>
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
