import { StyleSheet, View } from "react-native";
import { t } from "../i18n";
import { formatDistance, formatDuration, formatPace } from "../utils/runMetrics";
import { StatCard } from "./StatCard";

type RunStatsProps = {
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number | null;
  pointCount: number;
};

export function RunStats({
  distanceMeters,
  durationSeconds,
  paceSecondsPerKm,
  pointCount
}: RunStatsProps) {
  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          label={t("distanceLabel")}
          value={formatDistance(distanceMeters, t("distanceUnit"))}
        />
        <StatCard label={t("durationLabel")} value={formatDuration(durationSeconds)} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label={t("paceLabel")}
          value={formatPace(paceSecondsPerKm, t("paceUnit"), t("unavailablePace"))}
        />
        <StatCard label={t("gpsPointsLabel")} value={pointCount} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  }
});
