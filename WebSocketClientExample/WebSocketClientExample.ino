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

ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

#define USE_SERIAL Serial

#define LED_PIN 2
#define NUM_LEDS 2

CRGB leds[NUM_LEDS];

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
	switch(type) {
		case WStype_DISCONNECTED:
			USE_SERIAL.printf("[WSc] Disconnected!\n");
			break;
		case WStype_CONNECTED: {
			USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);

			// send message to server when Connected
			webSocket.sendTXT("Connected");
		}
			break;
		case WStype_TEXT:
			USE_SERIAL.printf("[WSc] get text: %s\n", payload);

			// send message to server
			// webSocket.sendTXT("message here");
			break;
		case WStype_BIN:
      Serial.println(length);
      if (length == 3) {
//        for(int i=0; i<3; i++)
//          Serial.print(payload[i], HEX);
//        Serial.println();
        for(int i=0; i<NUM_LEDS; i++) {
          leds[i] = CRGB(payload[0], payload[1], payload[2]);
        }
        FastLED.show();
      } else if (length % 3 == 0) {
        for(int i=0; i<length / 3 && i < NUM_LEDS; i++) {
          leds[i] = CRGB(payload[3*i+0], payload[3*i+1], payload[3*i+2]);
        }
        FastLED.show();
      } else {
        USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
        hexdump(payload, length);
      }

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
ICACHE_RAM_ATTR void test() {
  Serial.println(digitalRead(0));
}
void setup() {
	// USE_SERIAL.begin(921600);
	USE_SERIAL.begin(9600);
 //delay(100);
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
 attachInterrupt(digitalPinToInterrupt(0), test, CHANGE);
	for(uint8_t t = 4; t > 0; t--) {
		USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
		USE_SERIAL.flush();
		delay(1000);
	}

	WiFiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);

	//WiFi.disconnect();
	while(WiFiMulti.run() != WL_CONNECTED) {
		delay(100);
   USE_SERIAL.printf(".");
	}
   USE_SERIAL.printf("Connected\n");

	// server address, port and URL
	webSocket.begin("70.176.119.77", 8765, "/");

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
  // webSocket.enableHeartbeat(15000, 3000, 2);

}

void loop() {
	webSocket.loop();
}
