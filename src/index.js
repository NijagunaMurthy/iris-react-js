import React, { Component, PropTypes } from 'react';

require('iris-js-sdk');

var IrisRtcConnection = window.IrisRtcConnection;
var IrisRtcStream = window.IrisRtcStream;
var IrisRtcSession = window.IrisRtcSession;
var IrisRtcConfig = window.IrisRtcConfig;

if (!IrisRtcConnection || !IrisRtcStream || !IrisRtcSession || !IrisRtcConfig) {
  console.log(' IrisRtcSdk not found !!!');
}

var IrisRtcSdk = {};
var irisRtcConnection = null;

if (IrisRtcConnection) {
  irisRtcConnection = new IrisRtcConnection();
  IrisRtcSdk.connect = function(token, routingId, evmUrl) {
    if (IrisRtcConnection) {
      irisRtcConnection.connect(token, routingId, evmUrl);

      irisRtcConnection.onConnected = () => {
        console.log("IrisReact :: Iris connection successful");
        IrisRtcSdk.onConnected();
      }

      irisRtcConnection.onConnectionFailed = () => {
        console.log("IrisReact :: Iris connection failed");
      }

      irisRtcConnection.onClose = () => {
        console.log("IrisReact :: Iris connection closed");
      }

      irisRtcConnection.onError = () => {
        console.log("IrisReact :: Iris connection error");
      }

      irisRtcConnection.onNotification = (payload) => {
        console.log("IrisReact :: onNotification :: " + JSON.stringify(payload));
        IrisRtcSdk.onNotification(payload);
      }
    }
  }

  IrisRtcSdk.disconnect = function(){
    irisRtcConnection.close();
  }

}

if(IrisRtcConfig){
  IrisRtcSdk.updateConfig = function(config) {
    IrisRtcConfig.updateConfig(config);
  }
}

/*
** Create a room container
*/
class IrisRoomContainer extends Component {
  // Constructor

  constructor(props) {
    super(props);

    this.createNewIrisSession = this.createNewIrisSession.bind(this);
    this._endSession = this._endSession.bind(this);
    this._stopMediaStream = this._stopMediaStream.bind(this);
    this.stopMediaStream = this.stopMediaStream.bind(this);
    this.syncMessages = this.syncMessages.bind(this);

    this.sendChatMessage = this.sendChatMessage.bind(this);
    this.endSession = this.endSession.bind(this);
    this.setDisplayName = this.setDisplayName.bind(this);
    this.audioMuteToggle = this.audioMuteToggle.bind(this);
    this.videoMuteToggle = this.videoMuteToggle.bind(this);
  };


  createNewIrisSession(){

    // End if there are existing sessions

    if(this.irisRtcSession){
      this.irisRtcSession.endSession();
    }

    if(this.irisRtcStream){
      this.irisRtcStream.stopMediaStream(this.localStream);
    }

    // Create a new Iris Rtc Session object
    this.irisRtcSession = new IrisRtcSession();

    if (!this.irisRtcSession) {
      console.log('Failed to initialize IrisRtcSession');
      return;
    }

    // Create new Iris Rtc Stream object
    this.irisRtcStream = new IrisRtcStream();

    if (!this.irisRtcStream) {
      console.log('Failed to initialize IrisRtcStream');
      return;
    }

    this.irisRtcStream.onLocalStream = this._onLocalStream.bind(this);
    this.irisRtcStream.irisVideoStreamStopped = this._onStreamStopped.bind(this)

    this.irisRtcSession.onRemoteStream = this._onRemoteStream.bind(this);
    this.irisRtcSession.onSessionCreated = this._onSessionCreated.bind(this);
    this.irisRtcSession.onSessionJoined = this._onSessionJoined.bind(this);
    this.irisRtcSession.onSessionConnected = this._onSessionConnected.bind(this);
    this.irisRtcSession.onSessionParticipantJoined = this._onSessionParticipantJoined.bind(this);
    this.irisRtcSession.onSessionParticipantLeft = this._onSessionParticipantLeft.bind(this);
    this.irisRtcSession.onSessionEnd = this._onSessionEnd.bind(this);
    this.irisRtcSession.onChatMessage = this._onChatMessage.bind(this);
    this.irisRtcSession.onChatAck = this._onChatAck.bind(this);
    this.irisRtcSession.onParticipantVideoMuted = this._onParticipantVideoMuted.bind(this);
    this.irisRtcSession.onParticipantAudioMuted = this._onParticipantAudioMuted.bind(this);
    this.irisRtcSession.onUserProfileChange = this._onUserProfileChange.bind(this);
    this.irisRtcSession.onError = this._onError.bind(this);
    this.irisRtcSession.onEvent = this._onEvent.bind(this);
    this.irisRtcSession.onDominantSpeakerChanged = this._onDominantSpeakerChanged.bind(this);
    this.irisRtcSession.onSessionTypeChange = this._onSessionTypeChange.bind(this);
  }


  componentDidMount() {

    this.createNewIrisSession();
    var self = this;
    if (!this.props.Config || !this.props.Type || !this.props.RoomId) {
      console.warn("Please check the props");
    }

    if (this.props.Config) {
      IrisRtcConfig.updateConfig(this.props.Config);
    }

    if (this.props.RoomId && this.props.Type &&  this.props.Config) {
      if (this.props.Type === 'video') {
        // Provide either constraints or streamType and resolution
        var streamConfig = {
          "streamType": this.props.Type,
          "resolution": this.props.Config.resolution,
          "constraints": this.props.Config.constraints ? this.props.Config.constraints : null
        };

        this.irisRtcStream.createStream(streamConfig).then(function(stream) {
          self.localStream = stream;
          // Create new session
          let config = self.props.Config;
          config.roomId = self.props.RoomId;
          config.type = self.props.Type;

          if(self.props.NotificationPayload){
            self.irisRtcSession.joinSession(config, irisRtcConnection, stream, self.props.NotificationPayload);
          }else{
            self.irisRtcSession.createSession(config, irisRtcConnection, stream);
          }
        });
      } else if (this.props.Type === 'audio' || this.props.Type === 'pstn') {
        //Create Audio Stream
        var streamConfig = {
          "streamType": "audio",
          "resolution": this.props.Config.resolution,
          "constraints": this.props.Config.constraints ? this.props.Config.constraints : null
        };

        this.irisRtcStream.createStream(streamConfig).then(function(stream) {
          self.localStream = stream;
          // Create new session
          let config = self.props.Config;
          config.roomId = self.props.RoomId;
          config.type = self.props.Type;

          if(self.props.NotificationPayload){
            self.irisRtcSession.joinSession(config, irisRtcConnection, stream, self.props.NotificationPayload);
          }else{
            self.irisRtcSession.createSession(config, irisRtcConnection, stream);
          }
        });
      } else if (this.props.Type === 'chat') {
        // Create a new chat session
        let config = this.props.Config;
        config.roomId = this.props.RoomId;
        config.type = this.props.Type;

        if(this.props.NotificationPayload){
          this.irisRtcSession.joinChatSession(config, irisRtcConnection, this.props.NotificationPayload)
        }else{
          this.irisRtcSession.createChatSession(config, irisRtcConnection);
        }
      }
    }

    this.syncMessages();
  }

  // Called when there is a change in props
  componentWillReceiveProps(nextProps) {

    console.log(" IrisRoomContainer::componentWillReceiveProps :: start :: nextProps "+JSON.stringify(nextProps));

    var self = this;

    if((!this.props.RoomId && !nextProps.RoomId) || (!this.props.Type && !nextProps.Type) || (!this.props.Config && !nextProps.Config)){
      console.log("RoomId, Type and Config are required to make a call");
      return;
    }

    let config = nextProps.Config;
    config.roomId = nextProps.RoomId;
    config.type = nextProps.Type;

    console.log("IrisRoomContainer :: componentWillReceiveProps :: config : "+JSON.stringify(config));

    if (this.props.RoomId && !nextProps.RoomId) {

      console.log("IrisRoomContainer :: RoomId is set to null - ending the session");

      this._endSession();

    } else if (this.props.RoomId === nextProps.RoomId) {

      console.log("IrisRoomContainer :: RoomId is same - checking for Type change");

      // If RoomId is same and call Type has changed end the old session
      // and create new session with latest Type
      if (this.props.Type !== nextProps.Type) {

        console.log("IrisRoomContainer :: Change in the session Type is detected "+this.props.Type + " --> " +nextProps.Type);

        // Stop the media stream and end the session
        this._stopMediaStream();

        if (nextProps.Type === 'chat') {

          console.log("IrisRoomContainer :: downgradeToChat "+JSON.stringify(config) +
          " notify :: "+JSON.stringify(nextProps.NotificationPayload));

          this.irisRtcSession.downgradeToChat(config, nextProps.NotificationPayload);

        } else if (nextProps.Type === 'video') {

          console.log("IrisRoomContainer :: upgradeToVideo ");

          var streamConfig = {
            "streamType": nextProps.Type,
            "resolution": nextProps.Config.resolution,
            "constraints": nextProps.Config.constraints ? nextProps.Config.constraints : null
          }

          this.irisRtcStream.createStream(streamConfig).then(function(stream) {
            self.localStream = stream;
            console.log("IrisRoomContainer :: upgradeToVideo config :: "+JSON.stringify(config) +
            " notify :: "+JSON.stringify(nextProps.NotificationPayload));
            self.irisRtcSession.upgradeToVideo(stream, config, nextProps.NotificationPayload);
          });

        } else if (nextProps.Type === "audio" || nextProps.Type === "pstn") {

          console.log("IrisRoomContainer :: upgradeToAudio ");

          var streamConfig = {
            "streamType": "audio",
            "constraints": nextProps.Config.constraints ? nextProps.Config.constraints : null
          }

          this.irisRtcStream.createStream(streamConfig).then(function(stream) {
            self.localStream = stream;
            self.irisRtcSession.upgradeToAudio(stream, config, nextProps.NotificationPayload);
          });
        }
      }else {
        // RoomId and Type both are same dont do anything
      }
    } else if (this.props.RoomId !== nextProps.RoomId) {

      console.log("IrisRoomContainer :: Change in RoomId detected "+this.props.RoomId + " --> " +nextProps.RoomId);

      // If RoomId is changed end the old session and
      // create new session with latest RoomId from props

      // Stop media stream and end the session
      this._endSession();

      if(nextProps.Type === "video"){

        console.log("IrisRoomContainer :: Video call with RoomId " +nextProps.RoomId);

        var streamConfig = {
          "streamType": nextProps.Type,
          "resolution": nextProps.Config.resolution,
          "constraints": nextProps.Config.constraints ? nextProps.Config.constraints : null
        };

        this.irisRtcStream.createStream(streamConfig).then(function(stream) {

          self.localStream = stream;

          if(self.props.NotificationPayload){
            console.log("IrisRoomContainer :: Joining video call with RoomId " +nextProps.RoomId + " config : "+JSON.stringify(config) + " notification "+JSON.stringify(nextProps.NotificationPayload));
            self.irisRtcSession.joinSession(config, irisRtcConnection, stream, nextProps.NotificationPayload);
          }else{
            console.log("IrisRoomContainer :: Making video call with RoomId " +nextProps.RoomId + " config : "+JSON.stringify(config));
            self.irisRtcSession.createSession(config, irisRtcConnection, stream);
          }
        });
      }

      if(nextProps.Type === "audio" || nextProps.Type === "pstn"){

        console.log("IrisRoomContainer :: Audio call with RoomId " +nextProps.RoomId);

        var streamConfig = {
          "streamType": "audio",
          "resolution": nextProps.Config.resolution,
          "constraints": nextProps.Config.constraints ? nextProps.Config.constraints : null
        };

        this.irisRtcStream.createStream(streamConfig).then(function(stream) {

          self.localStream = stream;

          if(self.props.NotificationPayload){
            console.log("IrisRoomContainer :: Joining audio call with RoomId " +
            nextProps.RoomId + " config : "+JSON.stringify(config) + " notification "+JSON.stringify(nextProps.NotificationPayload));
            self.irisRtcSession.joinSession(config, irisRtcConnection, stream, nextProps.NotificationPayload);
          }else{
            console.log("IrisRoomContainer :: Making audio call with RoomId " +nextProps.RoomId + " config : "+JSON.stringify(config));
            self.irisRtcSession.createSession(config, irisRtcConnection, stream);
          }
        });
      }

      // Create new session with RoomId and Type
      if ((!this.props.Type || this.props.Type === 'chat') && nextProps.Type === 'chat') {

        console.log("IrisRoomContainer :: groupchat with RoomId " +nextProps.RoomId);

        this.createNewIrisSession();

        if(nextProps.NotificationPayload){
          console.log("IrisRoomContainer :: Joining groupchat with RoomId " +nextProps.RoomId + " config : "+JSON.stringify(config) + " notification "+JSON.stringify(nextProps.NotificationPayload));
          this.irisRtcSession.joinChatSession(config, irisRtcConnection, nextProps.NotificationPayload)
        }else{
          console.log("IrisRoomContainer :: Making groupchat with RoomId " +nextProps.RoomId + " config : "+JSON.stringify(config));
          this.irisRtcSession.createChatSession(config, irisRtcConnection);
        }
      }

    }else if ((this.props.Type != nextProps.Type) || (this.props.RoomId != nextProps.RoomId)) {
      console.log("IrisRoomContainer :: Change in Type and RoomId" );

      if ((this.props.Type == 'chat') && (this.props.RoomId != "")) {
        // End the existing session
        this.irisRtcSession.endSession();
      }
    }

    console.log(" IrisRoomContainer::componentWillReceiveProps :: end");
  }

  componentWillUnmount() {
    //
  }

  _stopMediaStream(){

    if(this.irisRtcStream && this.localStream){
      console.log(" IrisRoomContainer::_stopMediaStream :: "+this.localStream);
      this.irisRtcStream.stopMediaStream(this.localStream);
      this.localStream = null;
    }
  }

  stopMediaStream(){
    console.log(" IrisRoomContainer::stopMediaStream :: "+this.localStream);
    this._stopMediaStream();
  }

  // Function end the session
  _endSession() {
    console.log(" IrisRoomContainer::_endSession");
    // End the session
    if(this.irisRtcSession && this.irisRtcSession.config){
      this.irisRtcSession.endSession();
    }

    // Stop the media stream for non chat sessions
    if (this.localStream) {
      this.irisRtcStream.stopMediaStream(this.localStream);
      this.localStream = null;
    }
  }

  _onLocalStream(stream) {
    console.log("IrisRoomContainer :: _onLocalStream");
    this.localStream = stream;
    if(this.props.onLocalStream){
      this.props.onLocalStream(stream);
    }
  }

  _onStreamStopped() {
    console.log("IrisRoomContainer :: _onStreamStopped");
    if(this.props.onStreamStopped){
      this.props.onStreamStopped();
    }
  }

  _onRemoteStream(stream) {
    console.log("IrisRoomContainer :: _onRemoteStream");
    if(this.props.onRemoteStream){
      this.props.onRemoteStream(stream);
    }
  }

  _onSessionCreated(roomId) {
    console.log("IrisRoomContainer :: _onSessionCreated " + roomId);
    if(this.props.onSessionCreated){
      this.props.onSessionCreated(roomId);
    }
  }
  _onSessionJoined(roomId, sessionId, myJid) {
    console.log("IrisRoomContainer :: _onSessionJoined " + roomId);
    if(this.props.onSessionJoined){
      this.props.onSessionJoined(roomId, sessionId, myJid);
    }
  }
  _onSessionConnected(sessionId) {
    console.log("IrisRoomContainer :: _onSessionConnected " + sessionId);
    if(this.props.onSessionConnected){
      this.props.onSessionConnected(sessionId);
    }
  }
  _onSessionParticipantJoined(roomId, sessionId, participantJid) {
    console.log("IrisRoomContainer :: _onSessionParticipantJoined :: participantJid : " + participantJid);
    if(this.props.onSessionParticipantJoined){
      this.props.onSessionParticipantJoined(roomId, sessionId, participantJid);
    }
  }

  _onSessionParticipantLeft(roomId, sessionId, participantJid, closeSession) {
    console.log("IrisRoomContainer :: _onSessionParticipantLeft :: participantJid : " + participantJid);
    if(this.props.onSessionParticipantLeft){
      this.props.onSessionParticipantLeft(roomId, sessionId, participantJid, closeSession);
    }
  }

  _onSessionEnd(sessionId) {
    console.log("IrisRoomContainer :: _onSessionEnd " + sessionId);
    if(this.props.onSessionEnd){
      this.props.onSessionEnd(sessionId);
    }
  }

  _onChatMessage(chatMsgPayload) {
    console.log("IrisRoomContainer :: _onChatMessage " + JSON.stringify(chatMsgPayload));
    if(this.props.onChatMessage){
      this.props.onChatMessage(chatMsgPayload);
    }
  }

  _onChatAck(chatAckPayload) {
    console.log("IrisRoomContainer :: _onChatAck " + JSON.stringify(chatAckPayload));
    if (this.props.onChatAck) {
      this.props.onChatAck(chatAckPayload);
    }
  }

  _onParticipantVideoMuted(id, muted) {
    console.log("IrisRoomContainer :: _onParticipantVideoMuted " + id + " Muted "+muted);
    if(this.props.onParticipantVideoMuted){
      this.props.onParticipantVideoMuted(id, muted);
    }
  }

  _onParticipantAudioMuted(id, muted) {
    console.log("IrisRoomContainer :: _onParticipantAudioMuted " + id + " Muted "+muted);
    if(this.props.onParticipantAudioMuted){
      this.props.onParticipantAudioMuted(id, muted);
    }
  }

  _onUserProfileChange(id, obj) {
    console.log("IrisRoomContainer :: _onUserProfileChange " + id + " obj "+ JSON.stringify(obj));
    if(this.props.onUserProfileChange){
      this.props.onUserProfileChange(id, obj);
    }
  }

  _onError(error) {
    console.log("IrisRoomContainer :: _onUserProfileChange " + error);
    if(this.props.onError){
      this.props.onError(error);
    }
  }

  _onEvent(event) {
    console.log("IrisRoomContainer :: onEvent :: " + JSON.stringify(event));
    if(this.props.onEvent){
      this.props.onEvent(event);
    }
  }

  _onDominantSpeakerChanged(participantJid) {
    console.log("IrisRoomContainer :: _onDominantSpeakerChanged :: participantJid : " + participantJid);
    if(this.props.onDominantSpeakerChanged){
      this.props.onDominantSpeakerChanged(participantJid);
    }
  }

  _onSessionTypeChange(participantJid, type){
    console.log("IrisRoomContainer :: _onSessionTypeChange :: participantJid : " + participantJid + " type : "+type);
    if(this.props.onSessionTypeChange){
      this.props.onSessionTypeChange(participantJid, type);
    }
  }

  // Send chat messages
  sendChatMessage(id, message) {
    if ((this.props.Type == 'chat' || this.props.Type == 'video') && this.props.RoomId != "") {
      this.irisRtcSession.sendChatMessage(id, message);
    }
  }

  endSession(){
    console.log(" IrisRoomContainer :: endSession");
    if(this.irisRtcSession){
      this.irisRtcSession.endSession();
    }
  }

  setDisplayName(name){
    console.log(" IrisRoomContainer :: setDisplayName");
    if(this.irisRtcSession){
      this.irisRtcSession.setDisplayName(name);
    }
  }

  audioMuteToggle(){
    console.log(" IrisRoomContainer :: audioMuteToggle");
    if(this.irisRtcSession){
      this.irisRtcSession.audioMuteToggle();
    }
  }

  videoMuteToggle(){
    console.log(" IrisRoomContainer :: videoMuteToggle");
    if(this.irisRtcSession){
      this.irisRtcSession.videoMuteToggle();
    }
  }

  //Start the screen share
  startScreenshare(screenShareConfig) {
    console.log("IrisRoomContainer :: startScreenshare");

    if(!screenShareConfig){
      console.log("IrisRoomContainer :: startScreenshare :: screenShareConfig is not available creating new config");
      return;
    }

    if(screenShareConfig && !screenShareConfig.screenShare)
      screenShareConfig.screenShare = true;

    console.log("IrisRoomContainer :: startScreenshare :: screenShareConfig "+JSON.stringify(screenShareConfig));

    if(this.irisRtcSession && this.irisRtcStream){
      console.log('IrisRoomContainer :: startScreenshare :: Calling irisRtcSession.switchStream ');
      this.irisRtcSession.switchStream(this.irisRtcStream, screenShareConfig);
    }
  }

  // Ending the screen share
  endScreenshare(streamConfig) {

    console.log('IrisRoomContainer :: endScreenShare');

    if(this.irisRtcSession && this.irisRtcStream){
      this.irisRtcStream.stopMediaStream(this.localStream);

      if(streamConfig){
        console.log("IrisRoomContainer :: endScreenshare :: set screenShare flag to false");
        streamConfig.screenShare = false;
        console.log("IrisRoomContainer :: endScreenshare :: streamConfig : "+JSON.stringify(streamConfig));

        this.irisRtcSession.switchStream(this.irisRtcStream, streamConfig);
      }else {
        console.error('IrisRoomContainer :: endScreenShare :: streamConfig not available');

      }
    }
  }

  // Sync chat messages
  syncMessages() {
    if (!this.props.eventManager || !this.props.RoomId)
    return;

    var length;
    if (!this.props.historyLength) {
      length = 100;
    } else {
      length = this.props.historyLength;
    }

    console.log('Get events from event manager' + 'https://' + this.props.eventManager + '/v1/view/routingid/' + encodeURIComponent(this.props.routingId) + '/room/' + this.props.RoomId + '/records/' + length);
    // Make the event manager call to get the list of current messages for the room
    fetch('https://' + this.props.eventManager + '/v1/view/routingid/' + encodeURIComponent(this.props.routingId) + '/room/' + this.props.RoomId + '/records/' + length, {
      method: 'GET',
      headers: {
        'Authorization': "Bearer " + this.props.token,
      }
    }).then(response => {
      console.log(' Get the list of current messages returned response code ' + response.status);
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        let error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
    })
    .then(response => {
      setTimeout(() => null, 0); // This is a hack, read more at https://github.com/facebook/react-native/issues/6679
      return response.json()
    })
    .then((responseData) => {
      console.log(' Get the list of current messages returned  response ' + JSON.stringify(responseData));
      if(this.props.onEventHistory){
        this.props.onEventHistory(responseData);
      }
    })
    .catch(function(err) {
      console.log(' Get the list of current messages returned an error  ' + err);
    })
    .done();
  }

  render() {
    var videoCallView = (

      <IrisVideoCallView
        {...this.props}
        />
    )
    if (this.props.Type == 'video') return videoCallView;
    else return <div / >
    }
  }

  class IrisVideoCallView extends Component {

    constructor(props){
      super(props);
    }

    render(){
      return(
        <div className="iris-room">
        </div>
      );
    }
  }


  export { IrisRoomContainer, IrisRtcSdk };
  export default IrisRtcSdk;
