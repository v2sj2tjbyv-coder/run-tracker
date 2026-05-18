import { Platform, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n";

type AppHeaderProps = {
  isTracking: boolean;
  statusLabel: string;
};

export function AppHeader({ isTracking, statusLabel }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{t("appName")}</Text>
        <Text style={styles.title}>{t("screenTitle")}</Text>
      </View>
      <View style={[styles.statusPill, isTracking && styles.statusPillActive]}>
        <Text style={[styles.statusText, isTracking && styles.statusTextActive]}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Platform.select({ android: 18, ios: 6, default: 0 })
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#102033",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 2
  },
  statusPill: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  statusPillActive: {
    backgroundColor: "#ccfbf1"
  },
  statusText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800"
  },
  statusTextActive: {
    color: "#0f766e"
  }
});
