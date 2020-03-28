import React from 'react';
//import $ from 'jquery';
//import SETTINGS from '../../../settings';
import Prometheus_Endpoints from './Prometheus_Endpoints';
import Prometheus_Rules from './Prometheus_Rules';
import AlertManager_Config from './Alertmanager_Config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './SystemSettings.css';


export default class SystemSettings extends React.Component {
	constructor(props){
		super(props);
		this.makeSelection = this.makeSelection.bind(this);

		this.state = {
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    nav: {
		        prometheus_endpoints_selected: false,
		        prometheus_rules_selected: false,
		        alertmanager_config_selected: false,
		    },
		};
	}

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (typeof(this.props.globalState.nav) !== 'undefined'){
                if (this.props.globalState.nav.systemSettings_selected !== this.state.isDisplaying){
                    this.setState({
                        isDisplaying : this.props.globalState.nav.systemSettings_selected,
                        displayTimestamp: Date.now(),
                    });
                }
            }
        }
    }

    makeSelection(selection){
        var newnav = {};
        for (var key in this.state.nav){
            newnav[key] = false;
        }
        switch(selection.target.id){
            case "nav_prometheus_endpoints":
                if (!this.state.nav.prometheus_endpoints_selected){
                    newnav.prometheus_endpoints_selected = true;
                }
                this.setState({
                    nav: newnav,
                });
                break;
            case "nav_prometheus_rules":
                if (!this.state.nav.prometheus_rules_selected){
                    newnav.prometheus_rules_selected = true;
                }
                this.setState({
                    nav: newnav,
                });
                break;
            case "nav_alertmanager_config":
                if (!this.state.nav.alertmanager_config_selected){
                    newnav.alertmanager_config_selected = true;
                }
                this.setState({
                    nav: newnav,
                });
                break;
            default:
                console.log("Wrong Nav Selection!");
	    }
    }

    getButtonClass(id){
        let classname = '';
        if (typeof(this.state.nav) !== 'undefined'){
            switch(id){
                case "nav_prometheus_endpoints":
                    if (this.state.nav.prometheus_endpoints_selected){
                        classname = 'AdminNavigationBtn NavigationBtnActive ';
                    }else{
                        classname = 'AdminNavigationBtn ';
                    }
                    if (!this.state.isDisplaying){
                        classname += 'MenuBtn-SlideOut ';
                    }
                    break;
                case "nav_prometheus_rules":
                    if (this.state.nav.prometheus_rules_selected){
                        classname = 'AdminNavigationBtn NavigationBtnActive ';
                    }else{
                        classname = 'AdminNavigationBtn ';
                    }
                    if (!this.state.isDisplaying){
                        classname += 'MenuBtn-SlideOut ';
                    }
                    break;
                case "nav_alertmanager_config":
                    if (this.state.nav.alertmanager_config_selected){
                        classname = 'AdminNavigationBtn NavigationBtnActive ';
                    }else{
                        classname = 'AdminNavigationBtn ';
                    }
                    if (!this.state.isDisplaying){
                        classname += 'MenuBtn-SlideOut ';
                    }
                    break;
                default:
                    console.log("Unhandled case!");
                    break;
            }
        }
        return classname;
    }

    getButtonStyle(idx){
        let style = {
            transitionDelay: (idx * 0.1) + 's',
            transitionDuration: (idx*0.1 + 1.2) + 's',
            transitionProperty: 'transform',
        };
        return style;
    }

    getDivClass(id){
        let className = 'system-settings-content-div ';
        if (!this.state.nav[id + '_selected']){
            className += 'system-settings-content-div-SlideOut ';
        }
        return className;
    }

    renderMenuBars(){
        return (
            <div id='system-settings-menu'>
                <button className={this.getButtonClass('nav_prometheus_endpoints')} id='nav_prometheus_endpoints' onClick={this.makeSelection} style={this.getButtonStyle(1)} >
                    <FontAwesomeIcon style={{fontSize:'1.6em',float:'left', position:'relative', marginRight:'10px'}} icon={'map-marker-alt'} />
                    Prometheus Endpoints
                </button>

                <button className={this.getButtonClass('nav_prometheus_rules')} id='nav_prometheus_rules' onClick={this.makeSelection} style={this.getButtonStyle(2)} >
                    <FontAwesomeIcon style={{fontSize:'1.6em',float:'left', position:'relative', marginRight:'10px'}} icon={'exclamation-triangle'} />
                    Prometheus Rules
                </button>

                <button className={this.getButtonClass('nav_alertmanager_config')} id='nav_alertmanager_config' onClick={this.makeSelection} style={this.getButtonStyle(3)} >
                    <FontAwesomeIcon style={{fontSize:'1.6em',float:'left', position:'relative', marginRight:'10px'}} icon={'cogs'} />
                    Alertmanager Config
                </button>
            </div>
        );
    }

    renderContent(){
        return (
            <div id='system-settings-content-wrapper'>
                <div className={this.getDivClass('prometheus_endpoints')}>
                <Prometheus_Endpoints style={{position:'absolute'}}
                    setGlobalState={this.props.setGlobalState}
                    setPopupState={this.props.setPopupState}
                    globalState={this.props.globalState}
                    systemSettingsNavState={this.state.nav}/>
                </div>
                <div className={this.getDivClass('prometheus_rules')}>
                <Prometheus_Rules
                    setGlobalState={this.props.setGlobalState}
                    setPopupState={this.props.setPopupState}
                    globalState={this.props.globalState}
                    systemSettingsNavState={this.state.nav}/>
                </div>
                <div className={this.getDivClass('alertmanager_config')}>
                <AlertManager_Config
                    setGlobalState={this.props.setGlobalState}
                    setPopupState={this.props.setPopupState}
                    globalState={this.props.globalState}
                    systemSettingsNavState={this.state.nav}/>
                </div>
            </div>
        )
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>System Settings</p>
                <div className='MainContentBody'>
                    {this.renderMenuBars()}
                    {this.renderContent()}
                </div>
            </div>
        )
    }
}