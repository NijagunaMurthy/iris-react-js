# iris-react-js
This document covers the Iris JavaScript SDK's React Component.

## Getting started

`$ npm install iris-react-sdk --save`

## Usage - Examples

```javascript
import {IrisRoomContainer, IrisRtcSdk} from 'iris-react-sdk';
```

1. Make connection using `iristoken` and `routingId`
  	```javascript

    // Call connection method
    IrisRtcSdk.connect(iristoken, routingId, config.urls.eventManager);

    //Listen to onConnected event
    IrisRtcSdk.onConnected = () => {
      console.log("App :: onConnected :: Iris connection successful");
    }

    //Listen to notification event
    IrisRtcSdk.onNotification = (payload) => {
      console.log("App:: onNotification :: Payload : ", JSON.stringify(payload));
    }

    ```

2. Using `IrisRoomContainer` to initiate/accept call

```js

return (
  <IrisRoomContainer
  ref="room"
  Type={this.state.Type}
  RoomId={this.state.RoomId}
  Config={this.state.Config}
  NotificationPayload={this.state.NotificationPayload}
  onLocalStream={this.onLocalStream}
  onRemoteStream={this.onRemoteStream}
  onChatMessage={this.onChatMessage}
  onChatAck={this.onChatAck}
  onChatState={this.onChatState}
  onEventHistory={this.onEventHistory}
  onDominantSpeakerChanged={this.onDominantSpeakerChanged}
  onSessionEnd={this.onSessionEnd}
  onSessionParticipantJoined={this.onSessionParticipantJoined}
  onSessionParticipantLeft={this.onSessionParticipantLeft}
  onSessionTypeChange={this.onSessionTypeChange}

  />
)

...

let roomId = response.room_id;
let Config = {
  irisToken: "",
  routingID: "",
  toTN: "",
  fromTN: "",
  toRoutingId: "",
  traceId: "",
  userData: "",
  SessionType: 'outgoing',
  notificationPayload: ''
};
this.setState({
  RoomId:roomId,
  Config:Config,
});

```

## APIs

**Connection APIs - Make a connection using `connect`**
---
* **Example**

```js
import IrisRtcSdk from 'iris-react-sdk';
IrisRtcSdk.connect(irisToken, routingId, serverUrl);
```
* **Params**

  * `serverUrl` **{String}**: The url to event manager
  * `irisToken` **{String}**: A valid IRIS token
  * `routingId` **{String}**: Routing id of the user who is trying to login


**Connection APIs - Disconnect using `disconnect`**
---
* **Example**

```js
import IrisRtcSdk from 'iris-react-sdk';
IrisRtcSdk.disconnect();
```
* **Params**

  * None


**Media devices - Get a list of meida devices with `getMediaDevices`**
---
Returns a promise with list of available audio and video devies

* **Example**

```js
import IrisRtcSdk from 'iris-react-sdk';
IrisRtcSdk.getMediaDevices();
```
* **Params**

  * None


**Message APIs - send message using `sendChatMessage`**
---
* **Example**

```js
this.refs.room.sendChatMessage(roomId, id, message);
```
* **Params**

  * `id` **{String}**: Unique UUID for the message
  * `message` **{String}**: Text message to be sent to participant


**Message APIs - send chat state using `sendChatState`**
---
* **Example**

```js
this.refs.room.sendChatState(roomId, chatState);
```
* **Params**

  * `roomId` **{String}** : Room Id
  * `chatState` **{String}**: Chat States like `active`, `composing`, `paused`, `inactive` and `gone`


**Message APIs - get messages history `syncMessages`**
---
This returns a callback onEventHistory on IrisRoomContainer component.

* **Example**

```js
this.refs.room.syncMessages();
```
* **Params**

  * None


**Screen Share API - Start screen share with `startScreenshare`**
---
This API starts sharing the screen. It should be called with `screenShareConfig`

* **Example**

```js

var constraints = {
  audio : false,
  video : {
    mandatory: {
      chromeMediaSource: "desktop",
      chromeMediaSourceId: response.streamId, // streamId from chrome extension response
      maxWidth: window.screen.width,
      maxHeight: window.screen.height,
      maxFrameRate: 3
    },
    optional: []
  }
}
var screenShareConfig = {
  "constraints": constraints,
  "screenShare": true
}

this.refs.room.startScreenshare(screenShareConfig);

```
* **Params**

  * `screenShareConfig` **{json}**: Stream config for screen share


**Screen Share API - End screen share  with `endScreenshare`**
---
This API ends sharing the screen. It should be called with `streamConfig` to get revert back to localStream

* **Example**

```js

var streamConfig = {
    "streamType": "video",
    "resolution": ""
    "constraints": "",
    "screenShare": false
};

this.refs.room.endScreenshare(streamConfig);

```
* **Params**

  * `streamConfig` **{json}**: Stream config to revert back from screen to local stream


**PSTN APIs - Hold a PSTN call using `pstnHold`**
---
* **Example**

```js
this.refs.room.pstnHold(roomId, participantJid);
```
* **Params**

  * `roomId` **{String}** : Room Id
  * `participantJid` **{String}**: Remote participant routingId/resourceId


**PSTN APIs - UnHold a PSTN call using `pstnUnHold`**
---
* **Example**

```js
this.refs.room.pstnUnHold(roomId, participantJid);
```
* **Params**

  * `roomId` **{String}** : Room Id
  * `participantJid` **{String}**: Remote participant routingId/resourceId


**PSTN APIs - Merge two PSTN calls using `pstnMerge`**
---
* **Example**

```js
this.refs.room.pstnMerge(roomId, firstParticipantJid, secondParticipantJid);
```
* **Params**

  * `roomId` **{String}** : Room Id
  * `firstParticipantJid` **{String}**: First remote participant's routingId/resourceId
  * `secondParticipantJid` **{String}**: Second remote participant's routingId/resourceId


**PSTN APIs - End PSTN call using `pstnHangup`**
---
* **Example**

```js
this.refs.room.pstnHangup(roomId, participantJid);
```
* **Params**

  * `roomId` **{String}** : Room Id
  * `participantJid` **{String}**: Remote participant's routingId/resourceId


<br/><br/>
# Callbacks

**Connection - For connection successful listen to  `onConnected`**
---
* **Example**

```js
IrisRtcSdk.onConnected = () => {
  console.log("App :: onConnected :: Iris connection successful");
}
```

* **Params**

  * None


**Connection - For Notification listen to  `onNotification`**
---
* **Example**

```js
IrisRtcSdk.onNotification = (notificationPayload) => {
  console.log("App :: notificationPayload :: Iris notification received");
}
```

* **Params**

  * `notificationPayload` **{json}** : Notification payload with the information to join session


**IrisRoomContainer - For local media stream `onLocalStream`**
---
* **Example**

```js
onLocalStream= (stream) => {
  console.log("App :: onLocalStream :: Local media stream received");
}
```

* **Params**

  * `stream` **{object}** : Local media stream
