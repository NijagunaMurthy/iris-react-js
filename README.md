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

```
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
	    onEventHistory={this.onEventHistory}
	    onDominantSpeakerChanged={this.onDominantSpeakerChanged}
	    onSessionEnd={this.onSessionEnd}
	    onSessionParticipantLeft={this.onSessionParticipantLeft}
	    />
	)

	...

	let roomId = response.room_id;
	let Config = {
		SessionType: 'outgoing',
		notificationPayload: ''
	};
	this.setState({
		RoomId:roomId,
		Config:Config,
	});
```

## APIs

<div>

### Connection APIs - Make a connection using `connectUsingServer`

**Example**

```js
import IrisRtcSdk from 'iris-react-sdk';
IrisRtcSdk.connect(irisToken, routingId, serverUrl);
```
**Params**

* `serverUrl` **{String}**: The url to event manager
* `irisToken` **{String}**: A valid IRIS token
* `routingId` **{String}**: Routing id of the user who is trying to login

</div>
----


### Connection APIs - Disconnect using `disconnect`

**Example**

```js
import IrisRtcSdk from 'iris-react-sdk';
IrisRtcSdk.disconnect();
```
**Params**

* None

</div>
----


### Message APIs - send message using `sendChatMessage`

**Example**

```js
this.refs.room.sendChatMessage(id, message);
```
**Params**

* `id` **{String}**: Unique UUID for the message
* `message` **{String}**: Text message to be sent to participant

</div>
----



### Message APIs - get messages history `syncMessages`

This returns a callback onEventHistory on IrisRoomContainer component.

**Example**

```js
this.refs.room.syncMessages();
```
**Params**

* None

</div>
----
