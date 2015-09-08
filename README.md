# Pebble RPI Shuttle Schedule

Author: Branden Clark

# Components

* Pebble app that lets you view the Red Hawk schedule on your phone
* Scripts to parse shuttle schedule pdf into json

# How to
* Get the app on your pebble
  * Scan this QR Code
    <br>![Appstore QR Code](/resources/images/appstore_qrcode.png)
  * Or visit [the app store](https://apps.getpebble.com/applications/5491ca9da34dfb129d0000fa)
* Convert pdf to json format
```
cd ./src/schedule_parser
./parse.sh > output.json
```
