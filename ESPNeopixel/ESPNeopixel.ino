// So apparently ESP8266-01 are a lot more obnoxious to deal with than I thought
// http://www.whatimade.today/esp8266-easiest-way-to-program-so-far/
// https://www.esp8266.com/viewtopic.php?f=6&t=9958


#include <FastLED.h>

#define LED_PIN D2
#define NUM_LEDS 2

CRGB leds[NUM_LEDS];

void setup() {
  Serial.begin(9600);
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
}

int i=0;

void loop() {
  //Serial.print(".");  
  leds[0] = CRGB(i = ++i % 255, 0, 0);
  leds[1] = CRGB(i = ++i % 255, 0, 0);
  delay(10);
  FastLED.show();
}
