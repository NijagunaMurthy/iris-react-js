import React, { Component } from 'react';

import {IrisRoomContainer, IrisRtcSdk} from 'iris-react-sdk';

import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField';

import './App.css';
import config from './config.json'

if(!IrisRoomContainer || !IrisRtcSdk){
  console.error("iris-react-sdk is not imported");
}

var routingId = Math.random().toString(36).substr(2, 20) + '@' + config.domain;

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      token: '',
      routingId:'',
      Type:'chat',
      roomName:'testroom',
      mount : false,
      Config:{
        useBridge : true,
        anonymous:true,
        resolution:'hd',
        routingId:routingId
      },
      messages : [],
      userid : 0,
      users : 0,
      open: false,
      numChildren:0
    }

    this.room = "";

    this.makeIrisConnection = this.makeIrisConnection.bind(this);
    this.getRoomId = this.getRoomId.bind(this);
    this.onLocalStream = this.onLocalStream.bind(this);
    this.onRemoteStream = this.onRemoteStream.bind(this);
    this.onChatMessage = this.onChatMessage.bind(this);
    this.onChatAck = this.onChatAck.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.sendChatMessage = this.sendChatMessage.bind(this);
    this.onChatMsgChange = this.onChatMsgChange.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.updateToVideo = this.updateToVideo.bind(this);
  }

  handleToggle = () => this.setState({open: !this.state.open});

  handleClose = () => this.setState({open: false});

  componentDidMount(){
    this.makeIrisConnection();
  }

  makeIrisConnection(){
    fetch('https://' + config.urls.authManager + '/v1/login/anonymous/', {
        method: 'POST',
        headers: {
            'X-App-Key': config.appKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            UserID: routingId,
        })
    }).then(response => {
        console.log(' Anonymous login returned response code ' + response.status);
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            let error = new Error(response.statusText);
            error.response = response;
            throw error;
        }
    }).then(response => response.json())
    .then((responseData) => {
        console.log(' Anonymous login returned response ' + JSON.stringify(responseData));
        this.setState({
            token: responseData.Token
        });
        IrisRtcSdk.updateConfig(config);
        IrisRtcSdk.connect(this.state.token, routingId, config.urls.eventManager);
    })
    .catch(function (err) {
        console.log(' Anonymous login returned an error  ' + err);
    });

    IrisRtcSdk.onConnected = () => {
      console.log("IrisRtcSdk :: App :: Iris connection successful");
    }

    IrisRtcSdk.onNotification = (payload) => {
      console.log("App:: Notification Received :: ", JSON.stringify(payload));
    }

  }

  getRoomId(){
    fetch("https://"+ config.urls.eventManager + "/v1/createroom/room/"+ this.room, {
      method : "PUT",
      headers : {
        "Authorization": "Bearer " + this.state.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({participants: "",})
    })
    .then(response => {
      console.log(' createroom returned response code ' + response.status);
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
    .then((response) => {
      console.log(' createroom returned response ' + JSON.stringify(response));
      this.setState({
        RoomId:response.room_id,
        Type:"chat",
        roomName:this.room,
        inCall:true
      });
    })
    .catch((error) => {
      console.log("createroom returned an error ", error);
    })
  }

  render() {

    var msgchildren = [];

    this.state.messages.forEach(function(message) {
      msgchildren.push(<MsgComponent text={message} />);
    });

    return (
      <div className="App">

          <AppBar
            title="Iris React Example"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
          />
          <TextField
            className={this.state.inCall ? "hidden" : "chat" }
            hintText="Room Name"
            floatingLabelText="Please enter a room name"
            onChange={this.onTextChange}
          />

          <RaisedButton
            className={this.state.inCall ? "hidden" : "chat" }
            style={{top:'150', margin:'12'}}
            label="Join Chat"
            primary={true}
            onClick={this.getRoomId}
          />
          <RaisedButton
            className={this.state.inCall ? "chat" : "hidden" }
            style={{margin:'12'}}
            label="Video Call"
            primary={true}
            onClick={this.updateToVideo}
          />

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
            onJoined={this.onJoined}
            onEventHistory={this.onEventHistory}
          />

        <div id='localStreamDiv'>
          <video id="localStream" styles={localVideoStyles} src={this.state.localStreamUrl} />
        </div>

        <div id='remoteStreamDiv'>
          <video id="remoteStream" src={this.state.remoteStreamUrl} />
        </div>

        <div>
          {msgchildren}
        </div>

        {this.state.inCall ? (
          <div>
            <TextField
              hintText="Type a message..."
              fullWidth={true}
              style={{bottom:'0'}}
              value={this.state.message}
              onChange={this.onChatMsgChange}
            />
        <RaisedButton label="Send Chat" primary={true} style={style} onClick={() => this.sendChatMessage()}/>
        </div>) : null}
      </div>
    );
  }

  updateToVideo(){
    if(this.state.RoomId){
      this.setState({Type:'video'})
    }else{
      this.getRoomId();
    }
  }

  onLocalStream(stream){
    console.log("App:: Received Local Stream : ", stream);
    if(stream){
      this.setState({
        localStreamUrl : URL.createObjectURL(stream)
      });
    }
  }

  onChatMsgChange(event, msg){
    this.msg = msg;
  }

  sendChatMessage(id, msg){
    this.refs.room.sendChatMessage("1234", this.msg);
    // this.refs.room.sendChatMessage(id, msg);
  }

  onTextChange(roomName){
      this.room = roomName
  }

  onRemoteStream(stream){
    console.log("App:: Received Local Stream : ", stream);
    if(stream){
      this.setState({
        remoteStreamUrl : URL.createObjectURL(stream)
      });
    }
  }

  onChatMessage(chatPayload){
    console.log("Chat Message Received ", JSON.stringify(chatPayload));
    var newMessages = this.state.messages;
    newMessages.push(chatPayload.message)
    this.setState({messages : newMessages});
  }

  onChatAck(ackPayload){
    console.log("Chat Message ACK Received ", JSON.stringify(ackPayload));
  }

}

class MsgComponent extends React.Component {
    render () {
        return (
            <div styles={{marginLeft : '0'}}>{this.props.text}</div>
        );
    }
}

const localVideoStyles = {
    display: 'flex',
    height: '100%',
    width: '17%',
    margin: '10px'
}

const style = {
  margin: 12,
};

export default App;
