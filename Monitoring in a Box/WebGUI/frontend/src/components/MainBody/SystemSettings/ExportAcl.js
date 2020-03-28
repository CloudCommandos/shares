import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Table from 'rc-table';

var ajax_retrieveExportFileList_timer = null;


export default class ExportAcl extends React.Component {
	constructor(props){
		super(props);
		this.state = {
		    initialized: false,
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    minApiDelayMS: 500, //500ms
		    aclFileList: [],
		};
	}

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (this.props.systemSettingsNavState.exportACL_selected !== this.state.isDisplaying){
                this.setState({
                    isDisplaying : this.props.systemSettingsNavState.exportACL_selected,
                    displayTimestamp: Date.now(),
                });

                if (this.props.systemSettingsNavState.exportACL_selected && !this.state.initialized){
                    this.aclFileListApiQueue();
                    this.setState({
                        initialized: true,
                    });
                }
            }
            if (this.state.isDisplaying && this.state.initialized && this.props.globalState.socket_acl_updated){
                this.aclFileListApiQueue();
                this.props.setGlobalState({
                    socket_acl_updated: false,
                }, "ExportAcl");
            }
        }
    }

    aclFileListApiQueue(){
        let context = this;
        clearTimeout(ajax_retrieveExportFileList_timer);  //reset ajax call timer
        ajax_retrieveExportFileList_timer = setTimeout(function(){
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
        }, "ExportAcl");

        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_GET_UPLOADED_ACL_FILES_INFO,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    context.processAvailableACLData(res.status);
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
                    }, "ExportAcl");
                }, 500);
            }
        });
    }

    processAvailableACLData(aclList){
        console.log(aclList);
        let context = this;
        for (let i = 0; i < aclList.length; ++i){
            aclList[i].action = (
                                    <button
                                        onClick={
                                            function(){
                                                context.handleDownloadACL(aclList[i].file_name);
                                            }
                                        }
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0)',
                                            border: 'none',
                                        }}
                                    >
                                        <FontAwesomeIcon icon="download" style={{fontSize: '1.5em', color: 'white'}}/>
                                    </button>
                                );
            aclList[i].last_import_ts = aclList[i].last_import_ts.split('.')[0];
            aclList[i].last_export_ts = aclList[i].last_export_ts.split('.')[0];
            aclList[i].key = i;
        }
        this.setState({
            aclFileList: aclList,
        });
    }

    renderTable(){
        if (this.state.aclFileList.length > 0){
            const columns = [
                {
                    title: 'File Name',
                    dataIndex: 'file_name',
                    key: 'file_name',
                },
                {
                    title: 'ACL Records',
                    dataIndex: 'num_acl_records',
                    key: 'num_acl_records',
                },
                {
                    title: 'Last Import Time',
                    dataIndex: 'last_import_ts',
                    key: 'last_import_ts',
                },
                {
                    title: 'Import Count',
                    dataIndex: 'import_count',
                    key: 'import_count',
                },
                {
                    title: 'Last Export Time',
                    dataIndex: 'last_export_ts',
                    key: 'last_export_ts',
                },
                {
                    title: 'Export Count',
                    dataIndex: 'export_count',
                    key: 'export_count',
                },
                {
                    title: 'Action',
                    dataIndex: 'action',
                    key: 'action',
                }
            ];

            return (
                <div id='export-acl-table-div'>
                    <Table columns={columns} data={this.state.aclFileList} />
                </div>
            );
        }
    }

    handleDownloadACL(file_name){
        let payload = {
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
        });
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>Export ACL</p>
                <div className='MainContentBody'>
                    {this.renderTable()}
                </div>
            </div>
        )
    }
}