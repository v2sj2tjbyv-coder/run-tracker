import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { t } from "../i18n";
import { loadRuns, saveRun } from "../storage/runs";
import { RunPoint, RunSummary } from "../types/run";
import { calculateDistance, calculatePace } from "../utils/runMetrics";
import { getRouteRegion, getRouteSegments } from "../utils/routeSegments";

const makePoint = (location: Location.LocationObject, segmentIndex: number): RunPoint => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  altitude: location.coords.altitude,
  accuracy: location.coords.accuracy,
  speed: location.coords.speed,
  timestamp: location.timestamp,
  segmentIndex
});

export function useRunTracker() {
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
  const routeRegion = useMemo(() => getRouteRegion(activePoints), [activePoints]);
  const routeSegments = useMemo(() => getRouteSegments(activePoints), [activePoints]);
  const liveDistanceMeters = useMemo(() => calculateDistance(points), [points]);
  const displayDistanceMeters = selectedRun?.distanceMeters ?? liveDistanceMeters;
  const displayDurationSeconds = selectedRun?.durationSeconds ?? elapsedSeconds;
  const displayPace =
    selectedRun?.averagePaceSecondsPerKm ??
    calculatePace(displayDistanceMeters, displayDurationSeconds);

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

  return {
    activePoints,
    displayDistanceMeters,
    displayDurationSeconds,
    displayPace,
    isPaused,
    isTracking,
    pauseRun,
    permissionStatus,
    resumeRun,
    routeRegion,
    routeSegments,
    runs,
    selectedRun,
    setSelectedRun,
    startRun,
    stopRun
  };
}
