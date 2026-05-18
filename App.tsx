import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { StatCard } from "./src/components/StatCard";
import { locale, t } from "./src/i18n";
import { loadRuns, saveRun } from "./src/storage/runs";
import { RunPoint, RunSummary } from "./src/types/run";
import {
  calculateDistance,
  calculatePace,
  formatDistance,
  formatDuration,
  formatPace
} from "./src/utils/runMetrics";

const DEFAULT_REGION: Region = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02
};

const makePoint = (location: Location.LocationObject, segmentIndex: number): RunPoint => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  altitude: location.coords.altitude,
  accuracy: location.coords.accuracy,
  speed: location.coords.speed,
  timestamp: location.timestamp,
  segmentIndex
});

export default function App() {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [activeStartedAt, setActiveStartedAt] = useState<number | null>(null);
  const [elapsedBeforePauseSeconds, setElapsedBeforePauseSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [points, setPoints] = useState<RunPoint[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const segmentIndexRef = useRef(0);

  const activePoints = selectedRun?.points ?? points;
  const liveDistanceMeters = useMemo(() => calculateDistance(points), [points]);
  const displayDistanceMeters = selectedRun?.distanceMeters ?? liveDistanceMeters;
  const displayDurationSeconds = selectedRun?.durationSeconds ?? elapsedSeconds;
  const displayPace =
    selectedRun?.averagePaceSecondsPerKm ??
    calculatePace(displayDistanceMeters, displayDurationSeconds);

  const routeSegments = useMemo(() => {
    return activePoints.reduce<RunPoint[][]>((segments, point) => {
      const segmentIndex = point.segmentIndex ?? 0;
      const lastSegment = segments[segments.length - 1];
      const lastPoint = lastSegment?.[lastSegment.length - 1];

      if (!lastSegment || (lastPoint?.segmentIndex ?? 0) !== segmentIndex) {
        segments.push([point]);
        return segments;
      }

      lastSegment.push(point);
      return segments;
    }, []);
  }, [activePoints]);

  const routeRegion = useMemo<Region>(() => {
    const lastPoint = activePoints[activePoints.length - 1];

    if (!lastPoint) {
      return DEFAULT_REGION;
    }

    return {
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
  }, [activePoints]);

  useEffect(() => {
    loadRuns()
      .then(setRuns)
      .catch(() => Alert.alert(t("loadHistoryError")));
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (isTracking && !isPaused && activeStartedAt) {
      timer = setInterval(() => {
        const currentActiveSeconds = Math.floor((Date.now() - activeStartedAt) / 1000);
        setElapsedSeconds(elapsedBeforePauseSeconds + currentActiveSeconds);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [activeStartedAt, elapsedBeforePauseSeconds, isPaused, isTracking]);

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
    };
  }, []);

  const ensureLocationPermission = useCallback(async () => {
    const currentPermission = await Location.getForegroundPermissionsAsync();

    if (currentPermission.status === Location.PermissionStatus.GRANTED) {
      setPermissionStatus(currentPermission.status);
      return true;
    }

    const requestedPermission = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(requestedPermission.status);

    return requestedPermission.status === Location.PermissionStatus.GRANTED;
  }, []);

  const startLocationWatch = useCallback(async (segmentIndex: number) => {
    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1500
      },
      (location) => {
        setPoints((previousPoints) => [...previousPoints, makePoint(location, segmentIndex)]);
      }
    );
  }, []);

  const getCurrentElapsedSeconds = useCallback(() => {
    if (!isTracking || isPaused || !activeStartedAt) {
      return elapsedSeconds;
    }

    return elapsedBeforePauseSeconds + Math.floor((Date.now() - activeStartedAt) / 1000);
  }, [activeStartedAt, elapsedBeforePauseSeconds, elapsedSeconds, isPaused, isTracking]);

  const startRun = useCallback(async () => {
    const hasPermission = await ensureLocationPermission();

    if (!hasPermission) {
      Alert.alert(t("locationPermissionTitle"), t("locationPermissionStartMessage"));
      return;
    }

    setSelectedRun(null);
    setPoints([]);
    setIsPaused(false);
    setElapsedSeconds(0);
    setElapsedBeforePauseSeconds(0);
    segmentIndexRef.current = 0;
    const now = Date.now();
    setStartedAt(now);
    setActiveStartedAt(now);
    setIsTracking(true);

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation
    });
    setPoints([makePoint(currentLocation, segmentIndexRef.current)]);

    await startLocationWatch(segmentIndexRef.current);
  }, [ensureLocationPermission, startLocationWatch]);

  const pauseRun = useCallback(() => {
    const currentElapsedSeconds = getCurrentElapsedSeconds();
    watchRef.current?.remove();
    watchRef.current = null;
    setElapsedSeconds(currentElapsedSeconds);
    setElapsedBeforePauseSeconds(currentElapsedSeconds);
    setActiveStartedAt(null);
    setIsPaused(true);
  }, [getCurrentElapsedSeconds]);

  const resumeRun = useCallback(async () => {
    const hasPermission = await ensureLocationPermission();

    if (!hasPermission) {
      Alert.alert(t("locationPermissionTitle"), t("locationPermissionResumeMessage"));
      return;
    }

    const nextSegmentIndex = segmentIndexRef.current + 1;
    segmentIndexRef.current = nextSegmentIndex;

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation
    });
    setPoints((previousPoints) => [...previousPoints, makePoint(currentLocation, nextSegmentIndex)]);
    setActiveStartedAt(Date.now());
    setIsPaused(false);
    await startLocationWatch(nextSegmentIndex);
  }, [ensureLocationPermission, startLocationWatch]);

  const stopRun = useCallback(async () => {
    const durationSeconds = Math.max(0, getCurrentElapsedSeconds());
    watchRef.current?.remove();
    watchRef.current = null;
    setIsTracking(false);
    setIsPaused(false);

    const endedAt = Date.now();
    const finalDistance = calculateDistance(points);

    if (durationSeconds < 5 || finalDistance < 10 || points.length < 2) {
      setStartedAt(null);
      setActiveStartedAt(null);
      setElapsedBeforePauseSeconds(0);
      Alert.alert(t("runTooShortTitle"), t("runTooShortMessage"));
      return;
    }

    const run: RunSummary = {
      id: `${startedAt}-${endedAt}`,
      startedAt: startedAt ?? endedAt,
      endedAt,
      durationSeconds,
      distanceMeters: finalDistance,
      averagePaceSecondsPerKm: calculatePace(finalDistance, durationSeconds),
      points
    };

    const nextRuns = await saveRun(run);
    setRuns(nextRuns);
    setSelectedRun(run);
    setStartedAt(null);
    setActiveStartedAt(null);
    setElapsedBeforePauseSeconds(0);
  }, [getCurrentElapsedSeconds, points, startedAt]);

  const currentRunLabel = selectedRun
    ? new Date(selectedRun.startedAt).toLocaleString(locale)
    : isTracking
      ? isPaused
        ? t("currentRunPaused")
        : t("currentRunLive")
      : t("currentRunReady");
  const statusLabel = isTracking
    ? isPaused
      ? t("trackingStatusPaused")
      : t("trackingStatusLive")
    : t("trackingStatusIdle");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
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

        <Text style={styles.subtitle}>{currentRunLabel}</Text>

        <View style={styles.mapShell}>
          <MapView
            style={styles.map}
            region={routeRegion}
            showsUserLocation={isTracking && !isPaused}
          >
            {activePoints.length > 0 ? (
              <>
                {routeSegments.map((segment, index) => (
                  <Polyline
                    key={`${segment[0]?.timestamp ?? index}-${index}`}
                    coordinates={segment}
                    strokeColor="#0f766e"
                    strokeWidth={5}
                  />
                ))}
                <Marker coordinate={activePoints[0]} title={t("selectedRunStartMarker")} />
                <Marker
                  coordinate={activePoints[activePoints.length - 1]}
                  title={t("selectedRunCurrentMarker")}
                />
              </>
            ) : null}
          </MapView>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label={t("distanceLabel")}
            value={formatDistance(displayDistanceMeters, t("distanceUnit"))}
          />
          <StatCard label={t("durationLabel")} value={formatDuration(displayDurationSeconds)} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label={t("paceLabel")}
            value={formatPace(displayPace, t("paceUnit"), t("unavailablePace"))}
          />
          <StatCard label={t("gpsPointsLabel")} value={activePoints.length} />
        </View>

        {isTracking ? (
          <View style={styles.actionRow}>
            <Pressable
              onPress={isPaused ? resumeRun : pauseRun}
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
              onPress={stopRun}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.stopButton,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.primaryButtonText}>{t("stopAction")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={startRun}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.singleAction,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{t("startAction")}</Text>
          </Pressable>
        )}

        {permissionStatus === Location.PermissionStatus.DENIED ? (
          <Text style={styles.permissionText}>{t("permissionDeniedMessage")}</Text>
        ) : null}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>{t("historyTitle")}</Text>
          <Text style={styles.historyCount}>{t("historyCount", { count: runs.length })}</Text>
        </View>

        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t("emptyHistory")}</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedRun(item);
              }}
              style={({ pressed }) => [styles.runRow, pressed && styles.rowPressed]}
            >
              <View>
                <Text style={styles.runDate}>
                  {new Date(item.startedAt).toLocaleString(locale)}
                </Text>
                <Text style={styles.runMeta}>
                  {formatDuration(item.durationSeconds)} {t("runMetaSeparator")}{" "}
                  {formatPace(item.averagePaceSecondsPerKm, t("paceUnit"), t("unavailablePace"))}
                </Text>
              </View>
              <Text style={styles.runDistance}>
                {formatDistance(item.distanceMeters, t("distanceUnit"))}
              </Text>
            </Pressable>
          )}
        />
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
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 10
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
  },
  mapShell: {
    borderColor: "#dbe3ea",
    borderRadius: 8,
    borderWidth: 1,
    height: 330,
    marginTop: 18,
    overflow: "hidden"
  },
  map: {
    height: "100%",
    width: "100%"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
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
  },
  permissionText: {
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26
  },
  sectionTitle: {
    color: "#102033",
    fontSize: 20,
    fontWeight: "900"
  },
  historyCount: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 14
  },
  separator: {
    height: 10
  },
  runRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ea",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 14
  },
  rowPressed: {
    backgroundColor: "#f1f5f9"
  },
  runDate: {
    color: "#102033",
    fontSize: 15,
    fontWeight: "800"
  },
  runMeta: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4
  },
  runDistance: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "900"
  }
});
