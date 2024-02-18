# Pico Starter Project

A typescript setup for developing javascript programs to run on the [Raspberry Pi Pico](https://www.raspberrypi.com/products/raspberry-pi-pico/) microcontroller using the [Kaluma](https://kalumajs.org/) firmware.

This provides a seamless dev experience using simple commands to initiate build steps, transpiling and bundling the typescript files into a single javascript file for flashing onto the Pico.

#### Commands in the [`package.json`](package.json) file
- `npm run flash` builds the current project and flashes the result onto the Pico
- `npm run debug` similar to **flash**, but additionally leaves the shell prompt open for reading Pico outputs, such as _console.log()_
- `npm run build` only builds the current project
- `npm run build-minify` builds and minifies the result. This additionally removes any _console.log()_ statements or large error message strings from the code
- `npm run flash-prod` builds, minifies and flashes the program onto the Pico

### Prerequisites
- [Node.js](https://nodejs.org/en)
- RP2040 chip firmware flashed with Kaluma
  - [Official Guide](https://kalumajs.org/) and resources
  - Press and hold the white BOOTSEL button on the Pico, and plug in the USB cable
  - The mounted USB storage device named `RPI-RP2` will appear
  - Copy the [.uf2](storage/kaluma-rp2-pico-1.1.0.uf2) file onto this storage device
  - The Pico will restart automatically with the new firmware, completing the process

## Getting Started
- Run `npm install` in the root directory to install the dependencies
- Plug in the Pico RP2040 chip
- In [main.ts](src/main.ts), add the line `console.log('Hello Microworld!')`
- Run `npm run debug`
- The log message should print out in the prompt




