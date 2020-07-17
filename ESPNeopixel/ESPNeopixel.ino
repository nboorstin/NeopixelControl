#include <FastLED.h>

#define LED_PIN D2
#define NUM_LEDS 1

CRGB leds[NUM_LEDS];

void setup() {
  Serial.begin(9600);
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  leds[0] = CRGB(255, 0, 0);
  FastLED.show();
}

int i=0;

void loop() {
  Serial.print(".");  
  leds[0] = CRGB(i = ++i % 255, 0, 0);
  FastLED.show();
}
