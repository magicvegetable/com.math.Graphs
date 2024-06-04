Graphs

## Overview

![light](misc/screenshots/light.png)

![dark](misc/screenshots/dark.png)

Graph calculator

## Build and installation

There are 2 ways:

### Meson

    meson setup build
    meson compile -C build
    meson install -C build

### Flatpak

    flatpak-builder build com.math.Graphs.json
    flatpak-builder --user --install --force-clean build com.math.Graphs.json

## Run

Click on icon with `com.math.Graphs` name. Or, to run from the command line, use one of the following commands, depending on how the application was installed.
```
flatpak run com.math.Graphs
```
```
com.math.Graphs
```

## Run tests

    node --experimental-detect-module test/test.js