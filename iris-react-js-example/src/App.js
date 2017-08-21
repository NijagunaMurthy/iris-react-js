import React, { Component } from 'react';

import {IrisRoomContainer, IrisRtcSdk} from 'iris-react-sdk';

import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField';

import './App.css';
import config from './config.json'

var encodedKey = window.btoa(config.appKey + ":" + config.appSecret);
console.log("encodedKey "+encodedKey);

if(!IrisRoomContainer || !IrisRtcSdk){
  console.error("iris-react-sdk is not imported");
}


class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      token: '',
      routingId:Math.random().toString(36).substr(2, 20) + '@' + config.domain,
      Type:'chat',
      mount : false,
      Config:{
        useBridge : true,
        sessionType:'create',
        resolution:'640',
        routingId:this.routingId,
        videoCodec:'vp8',
        connected:false,
        userLogin:false,
        logLevel:3
      },
      NotificationPayload:"",
      messages : [],
      userid : 0,
      users : 0,
      open: false,
      numChildren:0
    }
    this.routingId=Math.random().toString(36).substr(2, 20) + '@' + config.domain,

    this.roomName = "";
    this.emailId="";
    this.password="";
    this.toUser = "";

    this.onLocalStream = this.onLocalStream.bind(this);
    this.onRemoteStream = this.onRemoteStream.bind(this);
    this.onChatMessage = this.onChatMessage.bind(this);
    this.onChatAck = this.onChatAck.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.sendChatMessage = this.sendChatMessage.bind(this);
    this.onChatMsgChange = this.onChatMsgChange.bind(this);
    this.onSessionParticipantLeft = this.onSessionParticipantLeft.bind(this);
    this.onSessionTypeChange = this.onSessionTypeChange.bind(this);
    this.onSessionParticipantJoined = this.onSessionParticipantJoined.bind(this);

    this.makeIrisConnection = this.makeIrisConnection.bind(this);
    this.getRoomId = this.getRoomId.bind(this);
    this.onEmailId = this.onEmailId.bind(this);
    this.onPassword = this.onPassword.bind(this);
    this.onJoin = this.onJoin.bind(this);
    this.onJoinChat = this.onJoinChat.bind(this);
    this.onJoinVideo = this.onJoinVideo.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.updateToVideo = this.updateToVideo.bind(this);

  }

  componentDidMount(){
    // this.makeIrisConnection();
  }


  makeIrisConnection(anonymous, type){
    var self = this;
    if(anonymous){
      fetch('https://' + config.urls.authManager + '/v1/login/anonymous/', {
        method: 'POST',
        headers: {
          'X-App-Key': config.appKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserID: this.routingId,
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
        IrisRtcSdk.connect(self.state.token, self.state.routingId, config.urls.eventManager);
      })
      .catch(function (err) {
        console.log(' Anonymous login returned an error  ' + err);
      });
    }else{
      IrisRtcSdk.updateConfig(config);
      IrisRtcSdk.connect(this.state.token, this.routingId, config.urls.eventManager);
    }

    IrisRtcSdk.onConnected = () => {
      console.log("IrisRtcSdk :: App :: Iris connection successful");
      this.setState({
        connected : true
      });
      IrisRtcSdk.updateConfig(config);
      if(anonymous){
        this.getRoomId("", type);
      }
    }

    IrisRtcSdk.onNotification = (notificationInfo) => {

      // onNotification Received join the call
      if(notificationInfo.type == "notify" || notificationInfo.type == "chat"){
        var conf = this.state.Config;
        conf.sessionType = "join";
        this.setState({
          NotificationPayload : notificationInfo,
          Type :notificationInfo.userdata.notification.type,
          RoomId:notificationInfo.roomId,
          Config:conf
        })
      }
      console.log("App:: Notification Received :: ", JSON.stringify(notificationInfo));
    }
  }

  getRoomId(event, type){
    var self = this;
    fetch("https://"+ config.urls.eventManager + "/v1/createroom/room/"+ this.roomName, {
      method : "PUT",
      headers : {
        "Authorization": "Bearer " + this.state.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({participants: "",})
    })
    .then(response => {
      console.log(' anonymous createroom returned response code ' + response.status);
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
      console.log(' anonymous createroom returned response ' + JSON.stringify(response));
      console.log("Rout "+self.state.routingId);
      var conf = this.state.Config;
      conf.routingId = self.state.routingId,

      this.setState({
        RoomId:response.room_id,
        Type: type ? type : "chat",
        routingId:self.state.routingId,
        Config:conf,
        inCall:true,
        remoteStreamUrl : "",
        localStreamUrl : ""
      });
    })
    .catch((error) => {
      console.log("createroom returned an error ", error);
    })
  }

  getRoomIdWithParticipants(event, type){

    // First fetch routingId for callee
    fetch("https://"+ config.urls.idManager + "/v1/routingid/appdomain/"+config.domain+"/publicid/"+this.toUser, {
      method : "GET",
      headers : {
        "Authorization": "Bearer " + this.state.token,
        "Content-Type": "application/json",
      }
    })
    .then(response => {
      console.log(' get participant routingId returned response code ' + response.status);
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
      console.log(' get participant routingId ' + JSON.stringify(response));
      var toRoutingId = response.routing_id;

      var participants = [];

      participants.push({
        "history": true,
        "notification": true,
        "owner": true,
        "room_identifier": true,
        "routing_id": toRoutingId
      });
      participants.push({
        "history": true,
        "notification": true,
        "owner": true,
        "room_identifier": true,
        "routing_id": this.routingId
      });

      var headers = {
        "Authorization": "Bearer " + this.state.token,
        "Content-Type": "application/json",
      }
      console.log("headers : "+JSON.stringify(headers));
      console.log("Participants : "+JSON.stringify({participants: participants}));

      // Get roomId
      fetch("https://"+ config.urls.eventManager + "/v1/createroom/participants", {
        method : "PUT",
        headers : headers,
        body: JSON.stringify({participants: participants})
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

        var userData = JSON.stringify({
          "data": {
            "cid": this.emailId,
            "cname": this.emailId
          },
          "notification": {
            "topic": config.domain + "/" + type,
            "type": type
          }
        });

        var userConfig = this.state.Config;
        userConfig.userData = userData;
        userConfig.sessionType = "create";

        this.setState({
          RoomId:response.room_id,
          Type: type ? type : "chat",
          Config:userConfig,
          inCall:true,
          remoteStreamUrl : "",
          localStreamUrl : ""
        });
      })
      .catch((error) => {
        console.log("createroom returned an error ", error);
      })
    })
    .catch((error) => {
      console.log("Get participant routingId returned an error ", error);
    })
  }


  updateToVideo(){
    if(this.state.RoomId){
      let conf = this.state.Config;
      if(this.anonymous){
        conf.sessionType = "";
      }
      var userData = JSON.stringify({
        "data": {
          "cid": this.emailId,
          "cname": this.emailId
        },
        "notification": {
          "topic": config.domain + "/" + "video",
          "type": "video"
        }
      });
      conf.userData = userData;
      this.setState({
        Type:'video',
        Config:conf
      });
    }else{
      this.getRoomId('video');
    }
  }

  updateToAudio(){
    if(this.state.RoomId){
      this.setState({Type:'audio'})
    }else{
      this.getRoomId('audio');
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
    this.refs.room.sendChatMessage(Math.random().toString(36).substr(2, 20), this.msg);
    // this.refs.room.sendChatMessage(id, msg);
    // this.mgs = "";
    // this.setState({message:""})
  }

  onTextChange(event, string){
    if(!this.state.userLogin){
      this.roomName = string
    }else {
      this.toUser = string;
    }
  }
  onEmailId(event, email){
    this.emailId = email
  }
  onPassword(event, password){
    this.password = password
  }

  onJoinVideo(event){
    this.onJoin(event, "video");
  }

  onJoinChat(event){

    this.onJoin(event, "chat");

    this.setState({
      localStreamUrl:"",
    })
  }

  onLogin(event){
    this.onJoin(event, "video");
  }

  onJoin(event, type){

    if(this.state.connected && !this.anonymous){

      if(this.state.inCall){
        this.setState({
          Type : type
        });
      }else{
        this.getRoomIdWithParticipants(event, type);
      }


    }else if(this.anonymous){
      this.getRoomId(event, type);
    }else if(this.roomName){
      this.anonymous = this.roomName ? true : false;
      this.makeIrisConnection(this.anonymous, type);
    }else if(this.emailId && this.password){

      this.setState({
        userLogin : true
      })
      var headers = {
        'Accept': 'application/json',
        "Content-Type": "application/json",
        "Authorization": "Basic " + encodedKey
      }
      var body = {
        "Type": "Email",
        "Email": this.emailId,
        "Password": this.password
      }

      console.log("headers :: "+ JSON.stringify(headers));
      // console.log("body :: "+JSON.stringify(body));


      fetch("https://"+ config.urls.authManager + "/v1/login/", {
        method : "POST",
        headers : headers,
        body: JSON.stringify(body)
      })
      .then(response => {
        console.log(' Email login returned response code ' + response.status);
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
        console.log(' Email login returned response ' + JSON.stringify(response));

        var irisToken = response.Token;

        this.setState({
          token:irisToken
        })


        // Get Identities -
        fetch("https://"+ config.urls.idManager + "/v1/allidentities", {
          method : "GET",
          headers : {
            "Authorization": "Bearer " + irisToken,
            "Content-Type": "application/json",
          }
        })
        .then(response => {
          console.log(' Get allidentities returned response code ' + response.status);
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
          console.log(' Get allidentities returned response ' + JSON.stringify(response));

          var publicIds = response.public_ids;
          this.routingId = response.routing_id;

          var conf = this.state.Config;
          conf.routingId = this.routingId;

          this.setState({
            Config :conf
          })

          this.makeIrisConnection(false, type);

        })
        .catch((error) => {
          console.log("Get allidentities returned an error ", error);
        })

      })
      .catch((error) => {
        console.log("Email login returned an error ", error);
      })

    }else {
      console.error("Please enter room name or emailId and password");
      return;
    }
  }


  onRemoteStream(stream){
    console.log("App:: Received Remote Stream : ", stream);
    if(stream){

      var audioTrack = stream.getAudioTracks()[0];
      var videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) {
        console.log("AudioTrack is received : ", audioTrack);
      }

      if (videoTrack) {
        console.log("VideoTrack is received : ", videoTrack);
      }
      this.setState({
        remoteStreamUrl : URL.createObjectURL(stream)
      });
    }
  }

  onSessionParticipantLeft(roomId, sessionId, participantJid, closeSession){
    if(closeSession){
      // this.refs.room.endSession();
    }
  }

  onSessionTypeChange(participantJid, type){
    console.log("App :: onSessionTypeChange");
    if(type == "groupchat"){
      this.setState({
        remoteStreamUrl:""
      })
    }
  }

  onSessionParticipantJoined(){
    console.log("App :: onSessionParticipantJoined");

    this.setState({
      inCall : true
    });

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

  render() {

    var msgchildren = [];

    this.state.messages.forEach(function(message) {
      msgchildren.push(<MsgComponent text={message} key={Math.random().toString(36).substr(2, 20) } />);
    });

    return (
      <div className="App">

        <AppBar
          title="Iris React Example"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
          />
        <TextField
          className={(this.state.inCall  && this.anonymous) ? "hidden" : "chat" }
          hintText={this.state.connected ? "Email Id" : "Room Name"}
          onChange={this.onTextChange}
          />

        <RaisedButton
          style={{top:'150', margin:'12'}}
          label="Join Chat"
          primary={true}
          onClick={this.onJoinChat}
          />

        {(this.state.connected && !this.state.inCall) ? (
          <RaisedButton
            style={{top:'150', margin:'12'}}
            label="Video Call"
            primary={true}
            onClick={this.onJoinVideo}
            />

        ) : null}

        {!this.state.connected ? (
          <div className={this.state.inCall ? "hidden" : "chat" }><br/><br/><b>OR</b><br/>
          <TextField
            className={this.state.inCall ? "hidden" : "chat" }
            hintText="Email Id"
            onChange={this.onEmailId}
            />
          <br/>
          <TextField
            className={this.state.inCall ? "hidden" : "chat" }
            hintText="Password"
            type='password'
            onChange={this.onPassword}
            />
        </div>
      ) : null}

      {!this.state.connected ? (
        <RaisedButton
          style={{margin:'12'}}
          label="Login"
          primary={true}
          onClick={this.onLogin}
          />
      ) : null}

      {this.state.inCall ? (
        <RaisedButton
          style={{margin:'12'}}
          label="Video Call"
          primary={true}
          onClick={this.updateToVideo}
          />
      ) : null}


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
        onSessionParticipantLeft={this.onSessionParticipantLeft}
        onSessionTypeChange={this.onSessionTypeChange}
        onSessionParticipantJoined={this.onSessionParticipantJoined}
        />

      <div id='localStreamDiv' >
        <video id="localStream" muted={true} style={{width:50, height:50, bottom:0, left:0}} src={this.state.localStreamUrl} />
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

}

class MsgComponent extends React.Component {
  render () {
    return (
      <div>{this.props.text}</div>
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
