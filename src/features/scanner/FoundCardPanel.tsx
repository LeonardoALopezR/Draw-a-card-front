// specs/008-scan-experience/tasks.md T014 (US2, FR-008, FR-009, spec.md User Story 2 AS1–AS4):
// the shared found-card detail panel. Strictly props-driven — no internal fetch, no direct
// `useScanSimulation()` call (Constitution IV: "render this data, call this handler"). Reused
// unchanged inline on mobile (`ScanShellScreen.tsx`, T018) and in the right column on web
// (`ScanShellScreen.web.tsx`, T021), so it must not assume either layout context itself (no
// `flex: 1`/screen-width assumption baked in here — the parent controls sizing).
//
// Condition selection is a real single-select `radiogroup`/`radio` pair (exactly one chip ever
// carries `checked`), and the "Gradeada" toggle is a real `switch` — both use the same
// `aria-checked` + `accessibilityState.checked` pairing `RegistrationForm.tsx`'s account-type
// radios and `ProfileForm.tsx`'s checkboxes already established, since this repo's pinned
// react-native-web does not forward `accessibilityState` to the DOM on its own (see those files'
// comments for the full investigation) — real accessible state, not just a background-color
// change (Constitution VII).
import { Pressable, StyleSheet, Text, View } from "react-native";

import { scanCopy } from "@/domain/i18n/copy/scan";
import {
  CONDITION_OPTIONS,
  formatDetailMeta,
  MIN_QUANTITY,
  type ConditionOption,
  type FoundCardState,
} from "@/domain/scanResults";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { colors, PLAYFAIR_DISPLAY_BOLD, radius, shadowSurface, space, typography } from "@/theme";

export interface FoundCardPanelProps {
  readonly state: FoundCardState;
  readonly onSelectCondition: (condition: ConditionOption) => void;
  readonly onToggleGraded: () => void;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onChange: () => void;
  readonly onRemove: () => void;
  readonly onAccept: () => void;
}

// One dictionary key per src/domain/scanResults.ts ConditionOption value (T006 already named
// these `condition<Option>`) — keeps the chip row's render loop free of a hardcoded switch.
const CONDITION_COPY_KEY: Record<ConditionOption, keyof typeof scanCopy.es> = {
  nearMint: "conditionNearMint",
  excellent: "conditionExcellent",
  veryGood: "conditionVeryGood",
  good: "conditionGood",
  fair: "conditionFair",
};

export function FoundCardPanel({
  state,
  onSelectCondition,
  onToggleGraded,
  onIncrement,
  onDecrement,
  onChange,
  onRemove,
  onAccept,
}: FoundCardPanelProps) {
  const t = useTranslation(scanCopy);
  const { card, condition, graded, quantity } = state;
  const canDecrement = quantity > MIN_QUANTITY;
  const gradeValueText = graded ? card.grade : t("gradeValuePlaceholder");

  return (
    <View style={[styles.panel, shadowSurface]} testID="found-card-panel">
      <View style={styles.headerRow}>
        <View
          style={[styles.thumbnail, { backgroundColor: card.thumbnailColorToken }]}
          testID="found-card-thumbnail"
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.meta}>{formatDetailMeta(card)}</Text>
        </View>
      </View>

      <View style={styles.pillRow}>
        {/* "Solid" grade pill (spec.md User Story 2 AS1) — no dedicated "solid badge" token
            exists in src/theme, so this reuses text.primary/bg.surface, the same dark-fill/
            light-text pairing already used elsewhere for solid-filled surfaces, rather than
            introducing a raw hex literal. */}
        <View style={styles.gradePill} testID="found-card-grade-pill">
          <Text style={styles.gradePillLabel}>{card.grade}</Text>
        </View>
        {/* Green price pill — the same accent.pillBg/accent.priceGreen pairing StatusPill.tsx
            and RecentScansList.tsx's price text already establish for "this reads as green". */}
        <View style={styles.pricePill} testID="found-card-price-pill">
          <Text style={styles.pricePillLabel}>{card.priceLabel}</Text>
        </View>
      </View>

      <View style={styles.linkRow}>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t("removeLink")}
          style={styles.linkButton}
          testID="found-card-remove-link"
        >
          <Text style={styles.removeLinkText}>{t("removeLink")}</Text>
        </Pressable>
        <Pressable
          onPress={onChange}
          accessibilityRole="button"
          accessibilityLabel={t("changeLink")}
          style={styles.linkButton}
          testID="found-card-change-link"
        >
          <Text style={styles.changeLinkText}>{t("changeLink")}</Text>
        </Pressable>
      </View>

      <View style={styles.gradedRow}>
        <View style={styles.gradedField}>
          <Text style={styles.fieldLabel}>{t("gradedLabel")}</Text>
          <Pressable
            onPress={onToggleGraded}
            accessibilityRole="switch"
            accessibilityLabel={t("gradedLabel")}
            aria-checked={graded}
            accessibilityState={{ checked: graded }}
            style={[styles.toggleTrack, graded ? styles.toggleTrackOn : null]}
            testID="found-card-graded-toggle"
          >
            <View style={[styles.toggleThumb, graded ? styles.toggleThumbOn : null]} />
          </Pressable>
        </View>
        <View style={styles.gradedField}>
          {/* Read-only — its visible Text content is what a screen reader announces (the
              "Gradeada" toggle immediately above already carries the interactive/accessible
              state), so no separate accessibilityLabel is layered on this static box. */}
          <View style={styles.gradeValueBox} testID="found-card-grade-value">
            <Text style={styles.gradeValueText}>{gradeValueText}</Text>
          </View>
        </View>
      </View>

      <View
        style={styles.conditionRow}
        accessibilityRole="radiogroup"
        testID="found-card-condition-row"
      >
        {CONDITION_OPTIONS.map((option) => {
          const selected = option === condition;
          const label = t(CONDITION_COPY_KEY[option]);
          return (
            <Pressable
              key={option}
              onPress={() => onSelectCondition(option)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              aria-checked={selected}
              accessibilityState={{ checked: selected }}
              style={[styles.conditionChip, selected ? styles.conditionChipSelected : null]}
              testID={`found-card-condition-${option}`}
            >
              <Text
                style={[styles.conditionChipText, selected ? styles.conditionChipTextSelected : null]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.fieldLabel}>{t("quantityLabel")}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={canDecrement ? onDecrement : undefined}
            disabled={!canDecrement}
            accessibilityRole="button"
            accessibilityLabel={`${t("quantityLabel")} −1`}
            accessibilityState={{ disabled: !canDecrement }}
            style={[styles.stepperButton, !canDecrement ? styles.stepperButtonDisabled : null]}
            testID="found-card-quantity-decrement"
          >
            <Text style={styles.stepperButtonText}>{"−"}</Text>
          </Pressable>
          <Text style={styles.quantityValue} testID="found-card-quantity-value">
            {quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityRole="button"
            accessibilityLabel={`${t("quantityLabel")} +1`}
            style={styles.stepperButton}
            testID="found-card-quantity-increment"
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.marketPriceRow}>
        <Text style={styles.fieldLabel}>{t("marketPriceLabel")}</Text>
        <Text style={styles.marketPriceValue}>{card.priceLabel}</Text>
      </View>

      <PrimaryButton label={t("acceptButton")} onPress={onAccept} testID="found-card-accept-button" />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.panel,
    padding: space.xl,
    gap: space.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.row,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: PLAYFAIR_DISPLAY_BOLD,
    color: colors.text.primary,
  },
  meta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  gradePill: {
    backgroundColor: colors.text.primary,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  gradePillLabel: {
    color: colors.bg.surface,
    fontSize: typography.body.link.fontSize,
    fontWeight: "700",
  },
  pricePill: {
    backgroundColor: colors.accent.pillBg,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pricePillLabel: {
    color: colors.accent.priceGreen,
    fontSize: typography.body.link.fontSize,
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    gap: space.lg,
  },
  linkButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
  },
  // "Cambiar"/"Eliminar" (spec.md's Design note): red/blue text links. This repo's established
  // color tokens have no literal "blue" — text.link is the semantic "link" color this app already
  // uses everywhere else a mockup calls for a blue/actionable link (e.g. SignInForm.tsx's
  // "forgot password"), so "Cambiar" reuses it rather than introducing a raw hex. "Eliminar"
  // reuses text.danger, the same token every other destructive/error action in this repo uses.
  removeLinkText: {
    fontSize: typography.body.link.fontSize,
    fontWeight: typography.body.link.fontWeight,
    color: colors.text.danger,
  },
  changeLinkText: {
    fontSize: typography.body.link.fontSize,
    fontWeight: typography.body.link.fontWeight,
    color: colors.text.link,
  },
  gradedRow: {
    flexDirection: "row",
    gap: space.lg,
  },
  gradedField: {
    flex: 1,
    gap: space.sm,
  },
  fieldLabel: {
    ...typography.label.field,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.border.input,
    justifyContent: "center",
    padding: 2,
    minHeight: 44,
    // The track itself is visually 28px tall (brief-scale), but the tap target is padded out to
    // the 44x44 floor via alignItems/justifyContent centering the visible track — see
    // `hitSlop`-free minHeight/minWidth pattern already used for SignInForm.tsx's link buttons.
    alignItems: "flex-start",
  },
  toggleTrackOn: {
    backgroundColor: colors.brand.primary,
    alignItems: "flex-end",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
  },
  toggleThumbOn: {
    backgroundColor: colors.brand.onPrimary,
  },
  gradeValueBox: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: radius.row,
    paddingHorizontal: space.md,
    backgroundColor: colors.bg.surfaceMuted,
  },
  gradeValueText: {
    fontSize: typography.body.input.fontSize,
    color: colors.text.primary,
  },
  // Wraps onto a second row when the five chips don't fit on one line (spec.md User Story 3 AS3
  // — the mobile mockup shows exactly four chips then "Fair" alone on a second row).
  conditionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  conditionChip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.input,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  conditionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  conditionChipTextSelected: {
    color: colors.brand.onPrimary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.input,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  quantityValue: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  marketPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marketPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent.priceGreen,
  },
});
