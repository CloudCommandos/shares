import React from 'react';
import './MainBody.css';
import coverphoto from '../../images/coverphoto.jpg';
//import $ from 'jquery';
//import SETTINGS from '../../settings';
import SystemSettings from './SystemSettings/SystemSettings';
import AccountSettings from './AccountSettings/AccountSettings';

export default class MainBody extends React.Component {
    constructor(props){
        super(props);
        this.state={
            initialized: false,
        };
    }

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (typeof(this.props.globalState.nav) !== 'undefined' && !this.state.initialized){
                for (let key in this.props.globalState.nav){
                    if (this.props.globalState.nav[key]){
                        this.setState({
                            initialized: true,
                        });
                        break;
                    }
                }
            }
        }
    }

    determineClass(id){
        let className = '';
        if (typeof(this.props.globalState.nav) !== 'undefined'){
            switch(id){
                case "AccountSettingsContainer":
                    if (typeof(this.props.globalState.nav.accountSettings_selected) !== "undefined"){
                        if(this.props.globalState.nav.accountSettings_selected){
                            className += 'ContentContainer ';
                        }else{
                            className += 'ContentContainer ContentContainer-SlideOut ';
                            if (!this.state.initialized){
                                className += 'NoTransformationDuration ';
                            }
                        }
                    }
                    break;
                case "SystemSettingsContainer":
                    if (typeof(this.props.globalState.nav.systemSettings_selected) !== "undefined"){
                        if(this.props.globalState.nav.systemSettings_selected){
                            className += 'AdminContentContainer ';
                        }else{
                            className += 'AdminContentContainer ContentContainer-SlideOut ';
                            if (!this.state.initialized){
                                className += 'NoTransformationDuration ';
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        return className;
    }

    render(){
        return (
            <div id='MainContentContainer'>
                <img id="coverphoto" src={coverphoto} alt=""/>

                <div id='SystemSettingsContainer' className={this.determineClass('SystemSettingsContainer')}>
                    <SystemSettings
                        setGlobalState={this.props.setGlobalState}
                        setPopupState={this.props.setPopupState}
                        globalState={this.props.globalState} />
                </div>

                <div id='AccountSettingsContainer' className={this.determineClass('AccountSettingsContainer')}>
                    <AccountSettings
                        setGlobalState={this.props.setGlobalState}
                        setPopupState={this.props.setPopupState}
                        globalState={this.props.globalState} />
                </div>
            </div>
        )
    }
}