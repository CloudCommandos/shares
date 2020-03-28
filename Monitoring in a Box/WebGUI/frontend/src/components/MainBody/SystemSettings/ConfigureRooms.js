import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Table from 'rc-table';


export default class ConfigureRooms extends React.Component {
	constructor(props){
		super(props);
		this.state = {
		    initialized: false,
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    minApiDelayMS: 500, //500ms
		};
	}

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (this.props.systemSettingsNavState.configureRooms_selected !== this.state.isDisplaying){
                this.setState({
                    isDisplaying : this.props.systemSettingsNavState.configureRooms_selected,
                    displayTimestamp: Date.now(),
                });

                if (this.props.systemSettingsNavState.configureRooms_selected && !this.state.initialized){
                    this.setState({
                        initialized: true,
                    });
                }
            }
        }
    }

    /*processAvailableRoomsData(roomList){
        console.log(roomList);
        let context = this;
        for (let i = 0; i < roomList.length; ++i){
            roomList[i].action = (
                                    <button
                                        onClick={
                                            function(){
                                                context.handleDownloadACL(roomList[i].file_name);
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
            paramList[i].last_import_ts = paramList[i].last_import_ts.split('.')[0];
            paramList[i].last_export_ts = paramList[i].last_export_ts.split('.')[0];
            paramList[i].key = i;
        }
        this.setState({
            parameterList: paramList,
        });
    }*/

    renderTable(){
        return 'Feature coming soon...';
        /*if (this.state.parameterList.length > 0){
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
                <div id='parameters-table-div'>
                    <Table columns={columns} data={this.state.parameterList} />
                </div>
            );
        }*/
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>Rooms</p>
                <div className='MainContentBody'>
                    {this.renderTable()}
                </div>
            </div>
        )
    }
}