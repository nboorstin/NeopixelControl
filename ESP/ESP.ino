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

#define USE_SERIAL Serial

#define LED_PIN 2
#define NUM_LEDS 30
#define BUTTON_THRESHOLD 100

CRGB leds[NUM_LEDS];
bool ledsOn = true;
void handleText(uint8_t * payload, size_t length) {
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
        int color = strtol(value.substring(2,8).c_str(), NULL, 16);
        int r = color >> 16;
        int g = color >> 8 & 0xff;
        int b = color & 0xff;
        for(int i=0; i<NUM_LEDS; i++) {
          leds[i] = CRGB(r, g, b);
        }
      } else if (key == "on") {
        Serial.println(value == "true");
        ledsOn = (value == "true");
      }
      n = nextN + 1;
    } while (n != 0);
    Serial.print("leds on: ");
    Serial.println(ledsOn? "yes" : "no");
    if (ledsOn) {
      FastLED.show();
    } else {
      FastLED.showColor(CRGB(0,0,0));
    }
//    Serial.println("....");
//    if (s.indexOf("solidColor:") != -1) {
//      Serial.println("!!!");
//      Serial.println(s.substring(11));
//      n = strtol(s.substring(11).c_str(), NULL, 16);
//      int r = n >> 16;
//      int g = n >> 8 & 0xff;
//      b = n & 0xff;
//      for(int i=0; i<NUM_LEDS; i++) {
//        leds[i] = CRGB(r, g, b);
//      }
//      if(ledsOn) {
//        FastLED.show();
//      }
//    }
}
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  Serial.println(type);
	switch(type) {
		case WStype_DISCONNECTED:
			USE_SERIAL.printf("[WSc] Disconnected!\n");
			break;
		case WStype_CONNECTED: {
			USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);

			// send message to server when Connected
			//webSocket.sendTXT("Connected");
		}
			break;
		case WStype_TEXT:
			USE_SERIAL.printf("[WSc] get text: %s\n", payload);
      handleText(payload, length);
			// send message to server
			// webSocket.sendTXT("message here");
			break;
		case WStype_BIN:
        USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
        hexdump(payload, length);
			// send data to server
			// webSocket.sendBIN(payload, length);
			break;
    case WStype_PING:
        // pong will be send automatically
        USE_SERIAL.printf("[WSc] get ping\n");
        break;
    case WStype_PONG:
        // answer to a ping we send
        USE_SERIAL.printf("[WSc] get pong\n");
        break;
    }
}
long lastPress = 0;
ICACHE_RAM_ATTR void test() {
  if (millis() - lastPress > BUTTON_THRESHOLD) {
    Serial.println("button");
    lastPress = millis();
    ledsOn = !ledsOn;
    if (ledsOn) {
      FastLED.show();
    } else {
      FastLED.showColor(CRGB(0,0,0));
    }
    webSocket.sendTXT(ledsOn? "on" : "off");
  }
}
void setup() {
	// USE_SERIAL.begin(921600);
	USE_SERIAL.begin(9600);
 //delay(100);
 pinMode(LED_PIN, OUTPUT);
   FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
   for(int i=0; i<NUM_LEDS; i++) {
          leds[i] = CRGB(0,255,0);
        }
   //FastLED.show();
   
 //USE_SERIAL.print("...");
 delay(2);
 FastLED.show();
 USE_SERIAL.print("...");
 

	//Serial.setDebugOutput(true);
	USE_SERIAL.setDebugOutput(true);

	USE_SERIAL.println();
	USE_SERIAL.println();
	USE_SERIAL.println();

 pinMode(0, INPUT_PULLUP);
 attachInterrupt(digitalPinToInterrupt(0), test, FALLING);
	for(uint8_t t = 2; t > 0; t--) {
		USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
		USE_SERIAL.flush();
		delay(1200);
	}

	WiFiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);

	//WiFi.disconnect();
	while(WiFiMulti.run() != WL_CONNECTED) {
		delay(100);
   USE_SERIAL.printf(".");
	}
   USE_SERIAL.printf("Connected\n");

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
