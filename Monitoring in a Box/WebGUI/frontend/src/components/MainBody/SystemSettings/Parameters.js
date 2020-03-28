import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Table from 'rc-table';

var ajax_retrieveParameterList_timer = null;


export default class Parameters extends React.Component {
	constructor(props){
		super(props);
		this.state = {
		    initialized: false,
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    minApiDelayMS: 500, //500ms
		    parameterList: [],
		};
	}

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (this.props.systemSettingsNavState.parameters_selected !== this.state.isDisplaying){
                this.setState({
                    isDisplaying : this.props.systemSettingsNavState.parameters_selected,
                    displayTimestamp: Date.now(),
                });

                if (this.props.systemSettingsNavState.parameters_selected && !this.state.initialized){
                    this.parameterListApiQueue();
                    this.setState({
                        initialized: true,
                    });
                }
            }
            if (this.state.isDisplaying && this.state.initialized && this.props.globalState.socket_parameters_updated){
                this.parameterListApiQueue();
                this.props.setGlobalState({
                    socket_parameters_updated: false,
                }, "Parameters");
            }
        }
    }

    parameterListApiQueue(){
        let context = this;
        clearTimeout(ajax_retrieveParameterList_timer);  //reset ajax call timer
        ajax_retrieveParameterList_timer = setTimeout(function(){
            context.retrieveData()}
        , context.state.minApiDelayMS);
    }

    retrieveData(){
        let payload = {
            session_key: window.localStorage['session_key'],
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
        }, "Parameters");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_GET_ALL_PARAMETER_LIST,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    context.processAvailableParametersData(res.status);
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
                    }, "Parameters");
                }, 500);
            }
        });
    }

    processAvailableParametersData(paramList){
        console.log(paramList);
        let context = this;
        for (let i = 0; i < paramList.length; ++i){
            paramList[i].action = (
                                    <button
                                        onClick={
                                            function(){
                                                context.handleEditParameter(paramList[i].param_name);
                                            }
                                        }
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0)',
                                            border: 'none',
                                        }}
                                    >
                                        <FontAwesomeIcon icon="edit" style={{fontSize: '1.5em', color: 'white'}}/>
                                    </button>
                                );
            paramList[i].last_update_ts = paramList[i].last_update_ts.split('.')[0];
            paramList[i].key = i;
        }
        this.setState({
            parameterList: paramList,
        });
    }

    renderTable(){
        if (this.state.parameterList.length > 0){
            const columns = [
                {
                    title: 'Name',
                    dataIndex: 'param_display_name',
                    key: 'param_display_name',
                    width: 200,
                },
                {
                    title: 'Value',
                    dataIndex: 'param_value',
                    key: 'param_value',
                    width: 200,
                },
                {
                    title: 'Description',
                    dataIndex: 'param_description',
                    key: 'param_description',
                    width: 200,
                },
                {
                    title: 'Last Update Time',
                    dataIndex: 'last_update_ts',
                    key: 'last_update_ts',
                    width: 200,
                },
                {
                    title: 'Action',
                    dataIndex: 'action',
                    key: 'action',
                    width: 200,
                }
            ];

            return (
                <div id='parameters-table-div'>
                    <Table columns={columns} data={this.state.parameterList} />
                </div>
            );
        }
    }

    handleEditParameter(param_name){
        console.log(param_name);
        /*let payload = {
            session_key: window.localStorage['session_key'],
            file_name: file_name,
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
        }, "ExportAcl");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_DOWNLOAD_ACL_FILE,
            data: JSON.stringify(payload),
            contentType: 'application/json',
            cache: false,
            xhr:function(){// Seems like the only way to get access to the xhr object
                let xhr = new XMLHttpRequest();
                xhr.responseType= 'blob'
                return xhr;
            },
            success: function(data){
                var a = document.createElement('a');
                var url = window.URL.createObjectURL(data);
                a.href = url;
                a.download = file_name;
                document.body.append(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
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
                    }, "ExportAcl");
                }, 500);
            }
        });*/
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>Parameters</p>
                <div className='MainContentBody'>
                    {this.renderTable()}
                </div>
            </div>
        )
    }
}