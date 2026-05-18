import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n";

type RunActionsProps = {
  isPaused: boolean;
  isTracking: boolean;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function RunActions({
  isPaused,
  isTracking,
  onPause,
  onResume,
  onStart,
  onStop
}: RunActionsProps) {
  if (!isTracking) {
    return (
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.primaryButton,
          styles.singleAction,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.primaryButtonText}>{t("startAction")}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={isPaused ? onResume : onPause}
        style={({ pressed }) => [
          styles.primaryButton,
          styles.secondaryButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={[styles.primaryButtonText, styles.secondaryButtonText]}>
          {isPaused ? t("resumeAction") : t("pauseAction")}
        </Text>
      </Pressable>
      <Pressable
        onPress={onStop}
        style={({ pressed }) => [
          styles.primaryButton,
          styles.stopButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.primaryButtonText}>{t("stopAction")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    flex: 1,
    minHeight: 54,
    justifyContent: "center"
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0"
  },
  secondaryButtonText: {
    color: "#102033"
  },
  singleAction: {
    marginTop: 16
  },
  stopButton: {
    backgroundColor: "#dc2626"
  },
  buttonPressed: {
    opacity: 0.82
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900"
  }
});
