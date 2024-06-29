# Pico Starter Project

A typescript setup for developing javascript programs to run on
the [Raspberry Pi Pico](https://www.raspberrypi.com/products/raspberry-pi-pico/) microcontroller using
the [Kaluma](https://kalumajs.org/) firmware.

This provides a seamless dev experience using simple commands to initiate build steps, transpiling and bundling the
typescript files into a single javascript file for the final flashing onto the Pico.

---

## New to programming?

First read the
step-by-step [Total beginner guide](https://github.com/Blaarkies/pico-starter-project-ts/wiki/Total-beginner-guide)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en)
- RP2040 chip firmware flashed with Kaluma
    - [Official Guide](https://kalumajs.org/) and resources
    - Press and hold the white BOOTSEL button on the Pico, and plug in the USB cable
    - The mounted USB storage device named `RPI-RP2` will appear
    - Copy the [.uf2](storage/kaluma-rp2-pico-1.1.0.uf2) file onto this storage device
    - The Pico will restart automatically with the new firmware, completing the process

### Running the project

- Run `npm install` in the root directory to install the dependencies
- Plug in the Pico RP2040 chip
- In [main.ts](src/main.ts), add the line `console.log('Hello Microworld!')`
- Run `npm run debug`
- The log message should print out in the prompt alongside the sensor outputs such as the temperature and potentiometer
  readings

## Examples

The `main.ts` file contains examples of interacting with hardware on a Pico:

- Blinking internal LED
- Read internal temperature sensor
- React on button events
- Read dial position (Potentiometer)
- WS2812 Individually addressable LED strips (NeoPixels)

## Troubleshooting

- **Pico is frozen / bricked / stalled**
    - It could be a whole host of issues. Here is how to completely reset it:
        - Unplug it completely
        - Restart your computer (Windows has a habit of giving up on some USB ports)
        - Hold down the BOOTSEL button while plugging the Pico in
        - Copy the file from `./storage/flash_nuke.uf2` into the Pico
            - This firmware edition erases and resets everything on the Pico
        - The Pico should now be back to factory defaults. Now do the [Prerequisites](#Prerequisites) again

## Project details

### Commands in the [`package.json`](package.json) file

- `npm run flash` builds the current project and flashes the result onto the Pico
- `npm run debug` similar to **flash**, but additionally leaves the shell prompt open for reading Pico outputs, such as
  _console.log()_
- `npm run build` only builds the current project
- `npm run build-minify` builds and minifies the result. This additionally removes any _console.log()_ statements or
  large error message strings from the code
- `npm run flash-prod` builds, minifies and flashes the program onto the Pico
- `npm run test` runs all unit tests on the host computer

### Features

- Typescript and esbuild integration in scripts allow for 1-click updates into the Pico
    - Different build scripts for different environments:
    - _debug_: Build with dev source-maps, flash to Pico, and print the Pico output to console
    - _flash_: Build js and flash to Pico
    - _flash-prod_: Build minified js and remove all `console.log` or error messages that cannot be displayed, and flash
      to Pico
- Jest unit testing for more robust code
    - Simulated controllers provide a more accurate environment for testing code-to-hardware interactions
- Common devices can be controlled through classes
    - Complex logic for sending data to NeoPixels are handled in the class
    - Enhance simple hardware components: The Multi Action Button class turns any basic push button into a handler that
      can detect long-press presses, hold-to-repeat presses, etc.
    - Potentiometer dials can be read using the Poller class to reduce signal noise
- Kefir, a reactive programming library helps to interact with time/event based asynchronous code
- Common functions to re-use
    - Color-space conversions, Binary bit masking
    - Interpolation, transforms between number distributions
