/*
 * WebSocketClient.ino
 *
 * Uses the fastLED library: https://www.arduino.cc/reference/en/libraries/fastled/
 * and websocket library: https://github.com/Links2004/arduinoWebSockets
 * and ESP8266 board definitions: https://github.com/esp8266/Arduino
 * https://learn.sparkfun.com/tutorials/how-to-install-ftdi-drivers/windows---quick-and-easy
 * 
 * set board to Generic ESP8266 Module
 * IDK about everything else, try things?
 * 
 * Windows automatically installed the FT231X driver, idk about linux tho
 */

#include <Arduino.h>
#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <WebSocketsClient.h>

#include <Hash.h>

#include "password.h"

#include <stdlib.h>

ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

#define LED_PIN 2
#define NUM_LEDS 100
#define BUTTON_THRESHOLD 100

CRGB leds[NUM_LEDS];
enum class Mode { Single, Multi};

struct LEDData {
  CRGB solidColor = CRGB(0xFF, 0, 0);
  CRGB solidColorDimmed = CRGB(0xB2, 0, 0);
  CRGB multiColors[NUM_LEDS];
  bool ledsOn = true;
  int brightness = 70;
  Mode mode = Mode::Single;
};

LEDData data;

void calcBrightness(CRGB& in, CRGB& out) {
  out = in;
  //Serial.println(in);
  for(int i=0; i<3; i++) {
    out[i] = (in[i] * data.brightness) / 100;
    //Serial.print(in[i]);
    //Serial.print(", ");
    //Serial.println(out[i]);
  }
}
void showLEDs() {
  Serial.print("leds on: ");
  Serial.println(data.ledsOn ? "yes" : "no");
  Serial.print("mode: ");
  Serial.println(data.mode == Mode::Single ? "single" : "multi");
  if (data.ledsOn) {
    if (data.mode == Mode::Single) {
      FastLED.showColor(data.solidColorDimmed);
    } else if (data.mode == Mode::Multi) {
      FastLED.show();
    }
  } else {
    FastLED.showColor(CRGB(0,0,0));
  }
}
void handleText(uint8_t * payload) {
    int n = 0;
    String s = String((char*)payload);
    do {
      int nextN = s.indexOf(",", n);
      //Serial.println(n);
      //Serial.println(nextN);
      String item = (nextN == -1 ? s.substring(n) : s.substring(n, nextN));
      int col = item.indexOf(":");
      String key = item.substring(1, col-1);
      String value = item.substring(col+1);
      Serial.println(key);
      if (key == "solidColor") {
        Serial.println(value.substring(2,8)); 
        unsigned color = strtol(value.substring(2,8).c_str(), 0, 16);
        // int r = color >> 16;
        // int g = color >> 8 & 0xff;
        // int b = color & 0xff;
        // LEDData.solidColor = CRGB(r, g, b);
        data.solidColor = CRGB(color);
        calcBrightness(data.solidColor, data.solidColorDimmed);
        //for(int i=0; i<NUM_LEDS; i++) {
        //  leds[i] = calcBrightness(data.solidColor);
        //}
      } else if (key == "on") {
        Serial.println(value == "true");
        data.ledsOn = (value == "true");
      } else if (key == "brightness") {
        data.brightness = value.toInt();
        Serial.println(data.brightness);
        if (data.mode == Mode::Single) {
          calcBrightness(data.solidColor, data.solidColorDimmed);
        } else if (data.mode == Mode::Multi) {
           for (int i=0; i<NUM_LEDS; i++) {
            calcBrightness(data.multiColors[i], leds[i]);
          }
        }
      } else if (key == "mode") {
        Serial.println(value);
        if (value == "\"solidColor\"") {
          data.mode = Mode::Single;
        } else if (value == "\"manyColors\"") {
          data.mode = Mode::Multi;
          for (int i=0; i<NUM_LEDS; i++) {
            calcBrightness(data.multiColors[i], leds[i]);
          }
        } else {
          data.mode = Mode::Single;
        }
      } else if (key == "multiColor") {
        //Serial.println("...");
        //Serial.println(value);
        int m = 1, count=0;
        do {
          int nextM = value.indexOf(";", m);
          String color = (nextM == -1 ? value.substring(m+1, value.length()-1) : value.substring(m+1, nextM));
          //Serial.println(color);
          data.multiColors[count] = CRGB(strtol(color.c_str(), 0, 16));
          if (data.mode == Mode::Multi) {
            calcBrightness(data.multiColors[count], leds[count]);
          }
          m = nextM + 1;
        } while (++count < NUM_LEDS && m != 0 );
        //Serial.println("...");
      }
      n = nextN + 1;
    } while (n != 0);
    showLEDs();
}
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
	switch(type) {
		case WStype_DISCONNECTED:
			Serial.printf("[WSc] Disconnected!\n");
			break;
		case WStype_CONNECTED:
			Serial.printf("[WSc] Connected to url: %s\n", payload);
			// send message to server when Connected
			//webSocket.sendTXT("Connected");
			break;
		case WStype_TEXT:
			//Serial.printf("[WSc] get text: %s\n", payload);
      handleText(payload);
			// send message to server
			// webSocket.sendTXT("message here");
			break;
		case WStype_BIN:
        Serial.printf("[WSc] get binary length: %u\n", length);
        hexdump(payload, length);
        // send data to server
        // webSocket.sendBIN(payload, length);
        break;
    case WStype_PING:
        // pong will be send automatically
        Serial.printf("[WSc] get ping\n");
        break;
    case WStype_PONG:
        // answer to a ping we send
        Serial.printf("[WSc] get pong\n");
        break;
    default:
        Serial.println(type);
    }
}
long lastPress = 0;
ICACHE_RAM_ATTR void test() {
  if (millis() - lastPress > BUTTON_THRESHOLD) {
    Serial.println("button");
    lastPress = millis();
    data.ledsOn = !data.ledsOn;
    showLEDs();
    webSocket.sendTXT(data.ledsOn? "on" : "off");
  }
}
void setup() {
	// Serial.begin(921600);
	Serial.begin(9600);
  //delay(100);
  pinMode(LED_PIN, OUTPUT);
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
    for(int i=0; i<NUM_LEDS; i++) {
          leds[i] = CRGB(0,0,0);
        }
  FastLED.show();
    
  //Serial.print("...");
  delay(2);
  FastLED.show();
  Serial.print("...");

	Serial.setDebugOutput(true);
  
	Serial.println();

 pinMode(0, INPUT_PULLUP);
 attachInterrupt(digitalPinToInterrupt(0), test, FALLING);
	for(uint8_t t = 2; t > 0; t--) {
		Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
		Serial.flush();
		delay(1200);
	}

	WiFiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);

	//WiFi.disconnect();
	while(WiFiMulti.run() != WL_CONNECTED) {
		delay(100);
   Serial.printf(".");
	}
   Serial.printf("Connected\n");

	// server address, port and URL
	webSocket.beginSSL("led.boj.cc", 443, "/test/esp");
  //webSocket.begin("192.168.0.101", 4567, "/test/esp");

	// event handler
	webSocket.onEvent(webSocketEvent);

	// use HTTP Basic Authorization this is optional remove if not needed
	//webSocket.setAuthorization("user", "Password");

	// try ever 5000 again if connection has failed
	webSocket.setReconnectInterval(5000);
  
  // start heartbeat (optional)
  // ping server every 15000 ms
  // expect pong from server within 3000 ms
  // consider connection disconnected if pong is not received 2 times
  //webSocket.enableHeartbeat(15000, 3000, 2);

}

void loop() {
	if(WiFi.status() == WL_CONNECTED) {
    webSocket.loop();
  } else {
    webSocket.disconnect();
  }
}
