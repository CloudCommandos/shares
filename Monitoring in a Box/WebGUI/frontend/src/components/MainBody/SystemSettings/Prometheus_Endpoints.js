import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from 'react-simple-code-editor';

var ajax_retrievePrometheusEndpoints_timer = null;


export default class Prometheus_Endpoints extends React.Component {

	constructor(props){
		super(props);
		this.state = {
		    initialized: false,
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    minApiDelayMS: 500, //500ms
		    fileContents: "",
		};
	}

    onChange = (value) => {
        this.setState({fileContents: value});
    };

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (this.props.systemSettingsNavState.prometheus_endpoints_selected !== this.state.isDisplaying){
                this.setState({
                    isDisplaying : this.props.systemSettingsNavState.prometheus_endpoints_selected,
                    displayTimestamp: Date.now(),
                });

                if (this.props.systemSettingsNavState.prometheus_endpoints_selected && !this.state.initialized){
                    this.prometheusEndpointsApiQueue();
                    this.setState({
                        initialized: true,
                    });
                }
            }
            if (this.state.isDisplaying && this.state.initialized && this.props.globalState.socket_prometheus_endpoints_updated){
                this.prometheusEndpointsApiQueue();
                this.props.setGlobalState({
                    socket_prometheus_endpoints_updated: false,
                }, "Prometheus_Endpoints");
            }
        }
    }

    prometheusEndpointsApiQueue(){
        let context = this;
        clearTimeout(ajax_retrievePrometheusEndpoints_timer);  //reset ajax call timer
        ajax_retrievePrometheusEndpoints_timer = setTimeout(function(){
            context.retrieveData()}
        , context.state.minApiDelayMS);
    }

    retrieveData(){
        let payload = {
            session_key: window.localStorage['session_key'],
            file_name: 'prometheus_endpoints',
        }
        let context = this;

        //Show spinner in popup
        this.props.setPopupState({
            popup1: {
                show: true,
                title: 'Loading',
                content: <FontAwesomeIcon icon="spinner" spin style={{fontSize: '2em', margin: 'auto', display: 'block'}}/>,
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_GET_FILE_CONTENTS,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    context.displayFileContents(res.status);
                }else{

                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("failed!");
            },complete: function(){
                setTimeout(function(){
                    //remove spinner popup
                    context.props.setPopupState({
                        popup1: {
                            show: false,
                            title: '',
                            content: '',
                            mode: 'common',
                            hasCloseBtn: true,
                        }
                    }, "Prometheus_Endpoints");
                }, 500);
            }
        });
    }

    uploadDataConfirmation(){
        this.props.setPopupState({
            popupConfirmation: {
                show: true,
                title: 'Proceed to apply?',
                yesCallback: this.uploadData.bind(this),
                yesButtonValue: '',
                noCallback: 'close',
                noButtonValue: '',
                mode: 'admin',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");
    }

    uploadData(){
        let tmpContents = this.state.fileContents;
        let payload = {
            session_key: window.localStorage['session_key'],
            file_name: 'prometheus_endpoints',
            contents: tmpContents,
        }
        let context = this;

        //Close confirmation popup
        this.props.setPopupState({
            popupConfirmation: {
                show: false,
                title: '',
                yesCallback: '',
                yesButtonValue: '',
                noCallback: '',
                noButtonValue: '',
                mode: 'admin',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");

        //Show spinner in popup
        this.props.setPopupState({
            popup1: {
                show: true,
                title: 'Loading',
                content: <FontAwesomeIcon icon="spinner" spin style={{fontSize: '2em', margin: 'auto', display: 'block'}}/>,
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_UPDATE_FILE_CONTENTS,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    //show success popup
                    context.props.setPopupState({
                        popup1: {
                            show: true,
                            title: 'Updated',
                            content: '',
                            mode: 'admin',
                            hasCloseBtn: true,
                        }
                    }, "Prometheus_Endpoints");
                }else{

                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("failed!");
            },complete: function(){
                setTimeout(function(){
                    //remove spinner popup
                    context.props.setPopupState({
                        popup1: {
                            show: false,
                            title: '',
                            content: '',
                            mode: 'common',
                            hasCloseBtn: true,
                        }
                    }, "Prometheus_Endpoints");
                }, 500);
            }
        });
    }

    reloadServiceConfirmation(){
        this.props.setPopupState({
            popupConfirmation: {
                show: true,
                title: 'Proceed to reload?',
                yesCallback: this.reloadService.bind(this),
                yesButtonValue: '',
                noCallback: 'close',
                noButtonValue: '',
                mode: 'admin',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");
    }

    reloadService(){
        let payload = {
            session_key: window.localStorage['session_key'],
            service_name: 'reload_prometheus',
        }
        let context = this;

        //Close confirmation popup
        this.props.setPopupState({
            popupConfirmation: {
                show: false,
                title: '',
                mode: 'admin',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");

        //Show spinner in popup
        this.props.setPopupState({
            popup1: {
                show: true,
                title: 'Loading',
                content: <FontAwesomeIcon icon="spinner" spin style={{fontSize: '2em', margin: 'auto', display: 'block'}}/>,
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "Prometheus_Endpoints");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_RELOAD_SERVICE,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    if (res.status === 0){
                        //show success popup
                        context.props.setPopupState({
                            popup1: {
                                show: true,
                                title: 'Reloaded',
                                content: '',
                                mode: 'admin',
                                hasCloseBtn: true,
                            }
                        }, "Prometheus_Endpoints");
                    }else if (res.status === 1){
                        //show failure popup
                        context.props.setPopupState({
                            popup1: {
                                show: true,
                                title: 'Failed to reload',
                                content: 'The new configuration is rejected by the server!',
                                mode: 'admin',
                                hasCloseBtn: true,
                            }
                        }, "Prometheus_Endpoints");
                    }else{
                        //show failure popup
                        context.props.setPopupState({
                            popup1: {
                                show: true,
                                title: 'Failed to reload',
                                content: 'Server script has error(s)!',
                                mode: 'admin',
                                hasCloseBtn: true,
                            }
                        }, "Prometheus_Endpoints");
                    }
                }else{

                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("failed!");
                //show failure popup
                context.props.setPopupState({
                    popup1: {
                        show: true,
                        title: 'Failed to reload',
                        content: 'Unable to connect to server or the server has an internal error!',
                        mode: 'admin',
                        hasCloseBtn: true,
                    }
                }, "Prometheus_Endpoints");
            },complete: function(){
                /*setTimeout(function(){
                    //remove spinner popup
                    context.props.setPopupState({
                        popup1: {
                            show: false,
                            title: '',
                            content: '',
                            mode: 'common',
                            hasCloseBtn: true,
                        }
                    }, "Prometheus_Endpoints");
                }, 500);*/
            }
        });
    }

    displayFileContents(fileContents){
        let context = this;
        this.setState({
            fileContents: fileContents,
        });
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle2'>Prometheus Endpoints</p>
                <div className='MainContentBody'>
                    <div id='parameters-table-div'>
                        <Editor
                            value={this.state.fileContents}
                            onValueChange={code => this.onChange(code)}
                            highlight={code => function(){} }
                            padding={10}
                            style={{
                              fontFamily: '"Fira code", "Fira Mono", monospace',
                              fontSize: 14,
                              backgroundColor:'#fafafa',
                              height: '90%',
                              color:'black'
                            }}
                        />
                        <button className='BlueSubmitBtn' id='uploadBtn'
                            style={{float:'right', marginLeft:'10px'}}
                            onClick={this.reloadServiceConfirmation.bind(this)}
                        >
                        Reload Prometheus
                        </button>
                        <button className='GreenSubmitBtn' id='uploadBtn'
                            style={{float:'right'}}
                            onClick={this.uploadDataConfirmation.bind(this)}
                        >
                        Apply
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}