import AsyncStorage from "@react-native-async-storage/async-storage";
import { RunSummary } from "../types/run";

const RUNS_KEY = "run-tracker:runs";

export const loadRuns = async () => {
  const rawRuns = await AsyncStorage.getItem(RUNS_KEY);
  return rawRuns ? (JSON.parse(rawRuns) as RunSummary[]) : [];
};

export const saveRun = async (run: RunSummary) => {
  const runs = await loadRuns();
  const nextRuns = [run, ...runs].slice(0, 50);
  await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(nextRuns));
  return nextRuns;
};

export const clearRuns = async () => {
  await AsyncStorage.removeItem(RUNS_KEY);
};
