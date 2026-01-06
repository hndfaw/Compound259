# Compound Interest Calculator

A React Native mobile app for calculating compound interest with support for regular contributions and multiple compounding frequencies.

## Features

- Calculate future value of investments with compound interest
- Support for periodic contributions (annually, semi-annually, quarterly, monthly)
- Visual breakdown of principal, contributions, and interest earned
- Save and manage multiple calculations
- Clean, dark-themed UI

## Tech Stack

- React Native
- Expo
- TypeScript
- AsyncStorage for data persistence
- Expo Router for navigation

## Getting Started

### Installation

```bash
npm install
```

### Running the App

```bash
npx expo start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Building for Production

```bash
# iOS
npx eas build --platform ios

# Android
npx eas build --platform android
```

## Project Structure

```
app/
  (tabs)/
    index.tsx     # Calculator screen
    explore.tsx   # Saved calculations screen
  _layout.tsx     # Root layout
components/       # Reusable components
hooks/            # Custom hooks
```

## License

Private
