import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { AppHeader } from "./src/components/AppHeader";
import { RouteMap } from "./src/components/RouteMap";
import { RunActions } from "./src/components/RunActions";
import { RunHistory } from "./src/components/RunHistory";
import { RunStats } from "./src/components/RunStats";
import { useRunTracker } from "./src/hooks/useRunTracker";
import { locale, t } from "./src/i18n";

export default function App() {
  const tracker = useRunTracker();
  const currentRunLabel = tracker.selectedRun
    ? new Date(tracker.selectedRun.startedAt).toLocaleString(locale)
    : tracker.isTracking
      ? tracker.isPaused
        ? t("currentRunPaused")
        : t("currentRunLive")
      : t("currentRunReady");
  const statusLabel = tracker.isTracking
    ? tracker.isPaused
      ? t("trackingStatusPaused")
      : t("trackingStatusLive")
    : t("trackingStatusIdle");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader isTracking={tracker.isTracking} statusLabel={statusLabel} />
        <Text style={styles.subtitle}>{currentRunLabel}</Text>

        <RouteMap
          activePoints={tracker.activePoints}
          isPaused={tracker.isPaused}
          isTracking={tracker.isTracking}
          routeRegion={tracker.routeRegion}
          routeSegments={tracker.routeSegments}
        />

        <RunStats
          distanceMeters={tracker.displayDistanceMeters}
          durationSeconds={tracker.displayDurationSeconds}
          paceSecondsPerKm={tracker.displayPace}
          pointCount={tracker.activePoints.length}
        />

        <RunActions
          isPaused={tracker.isPaused}
          isTracking={tracker.isTracking}
          onPause={tracker.pauseRun}
          onResume={tracker.resumeRun}
          onStart={tracker.startRun}
          onStop={tracker.stopRun}
        />

        {tracker.permissionStatus === Location.PermissionStatus.DENIED ? (
          <Text style={styles.permissionText}>{t("permissionDeniedMessage")}</Text>
        ) : null}

        <RunHistory runs={tracker.runs} onSelectRun={tracker.setSelectedRun} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f5f7f9",
    flex: 1
  },
  container: {
    padding: 18,
    paddingBottom: 34
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 10
  },
  permissionText: {
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12
  }
});
