// T019 (FR-007): the first-run tutorial's own content/UI. Pure presentation — the completion
// side effects (marking the tutorial complete locally, invalidating the gate's cache) live in
// app/(onboarding)/tutorial.tsx, this component only calls the `onComplete` prop it's handed
// (Constitution IV — this file never imports src/lib/tutorial-storage.ts, src/domain/
// registration.ts, or React Query directly). Follows this feature's established conventions
// (RegistrationForm.tsx, VerifyPhoneScreen.tsx, ProfileForm.tsx): a single primary action button
// owned by the screen (isCompleting/onComplete passed down), minimum 44x44 tap targets
// (Constitution VII, SC-003), and a layout that stays a single narrow column so it works
// unmodified at a 375px-wide web viewport through tablet/desktop widths.
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface TutorialScreenProps {
  onComplete: () => void | Promise<void>;
  isCompleting?: boolean;
}

// Wireframe's "Solo 1° vez" (only-first-time) steps, kept as plain static copy — this feature has
// no CMS/localization layer yet (out of scope), and the tutorial's actual step content isn't
// specified beyond "shown only once" (FR-007), so this is a minimal, real, renderable placeholder
// rather than lorem ipsum, not a design pass on the final copy.
const TUTORIAL_STEPS = [
  "Browse and organize your trading card portfolio.",
  "Draw and trade cards with other collectors.",
  "Track your collection's value as you go.",
];

export function TutorialScreen({ onComplete, isCompleting = false }: TutorialScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Welcome to Draw a Card
      </Text>

      {TUTORIAL_STEPS.map((step, index) => (
        <Text key={step} style={styles.step} testID={`tutorial-step-${index}`}>
          {step}
        </Text>
      ))}

      <Pressable
        style={[styles.button, isCompleting ? styles.buttonDisabled : null]}
        onPress={() => onComplete()}
        disabled={isCompleting}
        accessibilityRole="button"
        accessibilityLabel="Get started"
        accessibilityState={{ disabled: isCompleting, busy: isCompleting }}
        testID="tutorial-complete-button"
      >
        <Text style={styles.buttonText}>{isCompleting ? "Loading…" : "Get started"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  step: {
    fontSize: 15,
    color: "#374151",
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
