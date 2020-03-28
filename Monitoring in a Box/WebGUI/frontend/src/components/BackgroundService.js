import React from 'react';
import $ from 'jquery';
import SETTINGS from '../settings';
import socketIOClient from "socket.io-client";

export default class BackgroundService extends React.Component {
	constructor(props){
		super(props);
		this.state={
		};
	}

    socket = null;

    componentDidMount(){
        this.socket = socketIOClient(SETTINGS.WEB_SOCKET_URL);
        this.socket.on("server has update", data => this.handleServerHasUpdate(data));
    }

    handleServerHasUpdate(data){
        data = JSON.parse(data);

        switch(data.hasUpdate){
            case 'prometheus_endpoints':
                this.props.setGlobalState({
                    'socket_prometheus_endpoints_updated': true,
                }, "BackgroundService");
                break;
            case 'prometheus_rules':
                this.props.setGlobalState({
                    'socket_prometheus_rules_updated': true,
                }, "BackgroundService");
                break;
            case 'alertmanager_config':
                this.props.setGlobalState({
                    'socket_alertmanager_config_updated': true,
                }, "BackgroundService");
                break;
            default:
                break;
        }
    }

    getRoomInfo(){
        let payload = {
            session_key: window.localStorage['session_key'],
        }

        let context = this;
        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_GET_ROOMS_LIST,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    context.processRoomData(res.status);
                }else{
                    setTimeout(function(){context.getRoomInfo();}, 5000)   //retry
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("failed!");
                setTimeout(function(){context.getRoomInfo();}, 5000)   //retry
            },complete: function(){

            }
        });
    }

    processRoomData(data){
        this.props.setGlobalState({'roomlist': data}, "BackgroundService");
    }

    render(){
        return '';
    }
}