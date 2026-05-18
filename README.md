# Run Tracker

A React Native and Expo app for recording running sessions with GPS.

## Features

- Requests foreground location permission before tracking.
- Records GPS route points in real time.
- Displays the route on a map with start and current-position markers.
- Calculates distance, elapsed time, and average pace.
- Supports pause and resume without counting paused time or movement.
- Stores up to 50 recent runs locally with AsyncStorage.
- Lets users reopen a saved run to review its route.
- Uses a lightweight i18n layer for English and Vietnamese app text.

## Requirements

- Node.js compatible with Expo SDK 54.
- Expo Go for testing on a physical device.
- Location services enabled on the device.

## Getting Started

```bash
npm install
npm start
```

Scan the Expo QR code with Expo Go. A physical device is recommended for more accurate GPS testing.

## Scripts

```bash
npm start
npm run android
npm run ios
npm run web
npm run typecheck
```

## Roadmap

- Add distance and pace goals.
- Add per-kilometer split charts.
- Add backend sync for run history.
