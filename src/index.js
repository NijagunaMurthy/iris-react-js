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
                console.log("App :: Iris connection successful");
                IrisRtcSdk.onConnected();
            }

            irisRtcConnection.onConnectionFailed = () => {
                console.log("App :: Iris connection failed");
            }

            irisRtcConnection.onClose = () => {
                console.log("App :: Iris connection closed");
            }

            irisRtcConnection.onError = () => {
                console.log("App :: Iris connection error");
            }

            irisRtcConnection.onNotification = (payload) => {
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


        this.irisRtcSession = new IrisRtcSession();
        if (!this.irisRtcSession) {
            console.log('Failed to initialize IrisRtcSession');
            return;
        }

        this.irisRtcStream = new IrisRtcStream();
        if (!this.irisRtcStream) {
            console.log('Failed to initialize IrisRtcStream');
            return;
        }

        this.irisRtcStream.onLocalStream = this._onLocalStream.bind(this);
        this.irisRtcStream.irisVideoStreamStopped = this._onStreamStopped.bind(this)

        this.irisRtcSession.onRemoteStream = this._onRemoteStream.bind(this);
        this.irisRtcSession.onSessionCreated = this._onSessionCreated.bind(this);
        this.irisRtcSession.onSessionJoined = this._onSessionJoined.bind();
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

    };

    componentDidMount() {

        if (!this.props.Config || !this.props.Type || !this.props.RoomId || !this.props.Connection) {
            console.warn("Please check the props");
        }

        if (this.props.Config) {
            IrisRtcConfig.updateConfig(this.props.Config);
        }

        if (this.props.RoomId != null) {
            if (this.props.Type === 'video') {
                // Provide either constraints or streamType and resolution
                this._createStream(this.props.Type, this.props.Config);
            } else if (this.props.Type === 'audio' || this.props.Type === 'pstn') {
                //Create Audio Stream
                this._createStream("audio", this.props.Config);

            } else if (this.props.Type === 'chat') {
                this.irisRtcSession.createChatSession(this.props.Config, this.props.Connection);
            }
        }

        this.syncMessages();
    }

    // Called when there is a change in props
    componentWillReceiveProps(nextProps) {
        console.log(" IrisRoomContainer::componentWillReceiveProps ");

        if (this.props.RoomId && nextProps.RoomId === null) {
            // If RoomId is null end the session
            this.irisRtcSession.endSession();

        } else if (this.props.RoomId === nextProps.RoomId) {
            // If new RoomId is same as old one check for call Type

            // If RoomId is same and call Type has changed end the old session
            // and new session with latest Type
            if (this.props.Type !== nextProps.Type) {

                if (this.props.Type === "video" || this.props.Type === "audio" || this.props.Type === "pstn") {
                    this.irisRtcStream.stopMediaStream(this.localStream);
                    this.irisRtcSession.endSession();
                }

                if (nextProps.Type === 'chat') {
                    this.irisRtcSession.createChatSession(this.props.Config, irisRtcConnection);
                } else if (nextProps.Type === 'video') {
                    this._createStream(nextProps.Type, nextProps.Config);
                } else if (nextProps.Type === "audio" || nextProps.Type === "pstn") {
                    this._createStream("audio", nextProps.Config);
                }
            }else {
              // TODO :: Delete
            }
        } else if (this.props.RoomId !== nextProps.RoomId) {

            // If RoomId is changed end the old session and
            // create new session with latest RoomId from props
            if (this.props.Type === "video" || this.props.Type === "audio" || this.props.Type === "pstn") {
                this._endSession();
            }

            if(nextProps.Type === "video" || nextProps.Type === "audio" || nextProps.Type === "pstn"){
              this._createStream(nextProps.Type, nextProps.Config);
            }

            // Create new session with RoomId and Type
            if (( !this.props.Type || this.props.Type == 'chat') && nextProps.Type === 'chat') {
                // Create a new chat session
                let config = nextProps.Config;
                config.roomId = nextProps.RoomId;
                config.type = nextProps.Type;
                if(nextProps.NotificationPayload){
                  this.irisRtcSession.joinChatSession(config, irisRtcConnection, nextProps.NotificationPayload)
                }else{
                  this.irisRtcSession.createChatSession(config, irisRtcConnection);
                }
            }
        }else if ((this.props.Type != nextProps.Type) || (this.props.RoomId != nextProps.RoomId)) {
            if ((this.props.Type == 'chat') && (this.props.RoomId != "")) {
                // End the existing session
                this.irisRtcSession.endSession();
            }
        }

    }

    componentWillUnmount() {
      //
    }

    // Function to create stream
    _createStream(type, config) {
        // Provide either constraints or streamType and resolution
        var streamConfig = {
            "streamType": type,
            "resolution": config.resolution,
            "constraints": config.constraints ? config.constraints : null
        };
        this.irisRtcStream.createStream(streamConfig);
    }

    // Function end the session
    _endSession() {
        this.state.irisRtcSession.endSession();
        if (this.localStream) {
            this.irisRtcStream.stopMediaStream(this.localStream);
            this.localStream = null;
        }
    }

    _onLocalStream(stream) {
        console.log("IrisRoomContainer :: _onLocalStream");
        this.localStream = stream;
        this.setState({
          localStream:stream
        });

        this.props.onLocalStream(stream);

        // Create new session
        let config = this.props.Config;
        config.roomId = this.props.RoomId;
        config.type = this.props.Type;
        if(this.props.NotificationPayload){
          this.irisRtcSession.joinSession(config, irisRtcConnection, stream, this.props.NotificationPayload);
        }else{
          this.irisRtcSession.createSession(config, irisRtcConnection, stream);
        }
    }
    _onStreamStopped() {
        console.log("IrisRoomContainer :: _onStreamStopped");
    }
    _onRemoteStream(stream) {
        console.log("IrisRoomContainer :: _onRemoteStream");
        this.props.onRemoteStream(stream);
    }
    _onSessionCreated(roomId) {
        console.log("IrisRoomContainer :: _onSessionCreated " + roomId);
    }
    _onSessionJoined(roomId, sessionId, myJid) {
        console.log("IrisRoomContainer :: _onSessionJoined " + roomId);
    }
    _onSessionConnected(sessionId) {
        console.log("IrisRoomContainer :: _onSessionConnected " + sessionId);

    }
    _onSessionParticipantJoined(roomId, sessionId, participantJid) {
        console.log("IrisRoomContainer :: _onSessionParticipantJoined :: participantJid : " + participantJid);
    }

    _onSessionParticipantLeft(roomId, sessionId, participantJid, closeSession) {
        console.log("IrisRoomContainer :: _onSessionParticipantLeft :: participantJid : " + participantJid);
        if (closeSession) {
          this.endSession();
        }
    }

    _onSessionEnd(sessionId) {
        console.log("IrisRoomContainer :: _onSessionEnd " + sessionId);
    }

    _onChatMessage(chatMsgPayload) {
      console.log("IrisRoomContainer :: _onChatMessage " + chatMsgPayload);

      this.props.onChatMessage(chatMsgPayload);
    }

    _onChatAck(chatAckPayload) {
      console.log("IrisRoomContainer :: _onChatAck " + chatAckPayload);
      this.props.onChatAck(chatAckPayload)
    }

    _onParticipantVideoMuted(id, muted) {
      console.log("IrisRoomContainer :: _onParticipantVideoMuted " + id + " Muted "+muted);
    }

    _onParticipantAudioMuted(id, muted) {
      console.log("IrisRoomContainer :: _onParticipantAudioMuted " + id + " Muted "+muted);
    }

    _onUserProfileChange(id, obj) {
      console.log("IrisRoomContainer :: _onUserProfileChange " + id + " obj "+obj);
    }

    _onError(error) {
      console.log("IrisRoomContainer :: _onUserProfileChange " + error);

    }
    _onEvent(event) {
      console.log("IrisRoomContainer :: onEvent :: " + JSON.stringify(event));

    }

    _onDominantSpeakerChanged(participantJid) {
      console.log("IrisRoomContainer :: _onDominantSpeakerChanged :: participantJid : " + participantJid);

    }

    // Send chat messages
    sendChatMessage(id, message) {
        if ((this.props.Type == 'chat' || this.props.Type == 'video') && this.props.RoomId != "") {
            this.irisRtcSession.sendChatMessage(id, message);
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
                this.props.onEventHistory(responseData);
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
      <div>
      </div>
    );
  }
}


export { IrisRoomContainer, IrisRtcSdk };
export default IrisRtcSdk;
