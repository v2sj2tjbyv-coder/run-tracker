type Locale = "en" | "vi";

const translations = {
  en: {
    appName: "Run Tracker",
    screenTitle: "Run tracker",
    loadHistoryError: "Could not load run history",
    locationPermissionTitle: "Location permission required",
    locationPermissionStartMessage: "Enable location permission to record your running route.",
    locationPermissionResumeMessage: "Enable location permission to continue recording your route.",
    runTooShortTitle: "Run is too short",
    runTooShortMessage: "More GPS data is required before this run can be saved.",
    selectedRunStartMarker: "Start",
    selectedRunCurrentMarker: "Current",
    trackingStatusLive: "Live",
    trackingStatusIdle: "Idle",
    trackingStatusPaused: "Paused",
    currentRunPaused: "Paused",
    currentRunLive: "Recording run",
    currentRunReady: "Ready to run",
    distanceLabel: "Distance",
    durationLabel: "Time",
    paceLabel: "Avg pace",
    gpsPointsLabel: "GPS points",
    resumeAction: "Resume",
    pauseAction: "Pause",
    stopAction: "Finish",
    startAction: "Start run",
    permissionDeniedMessage:
      "Location permission is denied. Enable it in Settings so the app can track GPS.",
    historyTitle: "History",
    historyCount: "{count} runs",
    emptyHistory: "No runs yet.",
    runMetaSeparator: "·",
    distanceUnit: "km",
    paceUnit: "/km",
    unavailablePace: "--"
  },
  vi: {
    appName: "Run Tracker",
    screenTitle: "Theo dõi chạy bộ",
    loadHistoryError: "Không thể tải lịch sử chạy",
    locationPermissionTitle: "Cần quyền vị trí",
    locationPermissionStartMessage: "Hãy bật quyền vị trí để ghi lại lộ trình chạy.",
    locationPermissionResumeMessage: "Hãy bật quyền vị trí để tiếp tục ghi lộ trình chạy.",
    runTooShortTitle: "Buổi chạy quá ngắn",
    runTooShortMessage: "Cần thêm dữ liệu GPS để lưu một buổi chạy hợp lệ.",
    selectedRunStartMarker: "Bắt đầu",
    selectedRunCurrentMarker: "Hiện tại",
    trackingStatusLive: "Live",
    trackingStatusIdle: "Idle",
    trackingStatusPaused: "Paused",
    currentRunPaused: "Đang tạm dừng",
    currentRunLive: "Đang ghi lại buổi chạy",
    currentRunReady: "Sẵn sàng chạy",
    distanceLabel: "Quãng đường",
    durationLabel: "Thời gian",
    paceLabel: "Nhịp độ TB",
    gpsPointsLabel: "Điểm GPS",
    resumeAction: "Tiếp tục",
    pauseAction: "Tạm dừng",
    stopAction: "Kết thúc",
    startAction: "Bắt đầu chạy",
    permissionDeniedMessage:
      "Quyền vị trí đang bị từ chối. Hãy bật lại trong Settings để app tracking được GPS.",
    historyTitle: "Lịch sử",
    historyCount: "{count} buổi",
    emptyHistory: "Chưa có buổi chạy nào.",
    runMetaSeparator: "·",
    distanceUnit: "km",
    paceUnit: "/km",
    unavailablePace: "--"
  }
} as const;

type TranslationKey = keyof typeof translations.en;

const getDeviceLocale = (): Locale => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("vi") ? "vi" : "en";
};

export const locale = getDeviceLocale();

export const t = (key: TranslationKey, params: Record<string, string | number> = {}): string => {
  const template: string = translations[locale][key] ?? translations.en[key];

  return Object.entries(params).reduce<string>(
    (text, [paramKey, value]) => text.replace(`{${paramKey}}`, String(value)),
    template
  );
};
