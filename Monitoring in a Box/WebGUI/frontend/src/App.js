import React from 'react';
//import $ from 'jquery';
import SETTINGS from './settings';
import './App.css';
import './lib/sb-admin/sb-admin-2.min.css';
import {BrowserRouter, Route} from 'react-router-dom';
//import {Redirect} from 'react-router-dom';

import Login from './components/Login';
import MainBody from './components/MainBody/MainBody';
import SidePane from './components/SidePane/SidePane';
import BackgroundService from './components/BackgroundService';
import PopupService from './components/PopupService/PopupService';
import Session from './components/Session';

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheckSquare, faCoffee, faSpinner,
            faPollH, faDoorOpen, faCalendarDay,
            faCalendarWeek, faCalendar, faCalendarAlt,
            faFileUpload, faIdCard, faLock,
            faStar, faSlidersH, faFileDownload,
            faCogs, faDownload, faEdit,
            faMapMarkerAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

//add FA icons
library.add(faCheckSquare, faCoffee, faSpinner,
            faPollH, faDoorOpen, faCalendarDay,
            faCalendarWeek, faCalendar, faCalendarAlt,
            faFileUpload, faIdCard, faLock,
            faStar, faSlidersH, faFileDownload,
            faCogs, faDownload, faEdit,
            faMapMarkerAlt, faExclamationTriangle);


export default class App extends React.Component {
    constructor(props){
		super(props);
		this.state={
		    session_checked: false,
            popupState: {
                popup1: {
                    show: false,
                    title: '',
                    content: '',
                    mode: '',
                    hasCloseBtn: false,
                },
                popup2: {
                    show: false,
                    title: '',
                    content: '',
                    mode: '',
                    hasCloseBtn: false,
                },
                popupConfirmation: {
                    show: false,
                    title: '',
                    yesCallback: null,
                    yesButtonValue: '',
                    noCallback: null,
                    noButtonValue: '',
                    mode: '',
                    hasCloseBtn: false,
                },
            }
		};
	}

    // Callback function for children to pass back global states
    setStateFromChild = (data, childname = "") => {
        if (SETTINGS.MODE === "DEVELOPMENT") console.log("global state from " + childname);
        this.setState(data);
    }

    // Callback function for children to pass back popup states
    setPopupStateFromChild = (data, childname = "") => {
        if (SETTINGS.MODE === "DEVELOPMENT") console.log("popup state from " + childname);
        var tmpState = this.state.popupState; //reference
        for (var key in data){
            tmpState[key] = data[key];
        }
        this.setState({
            popupState: tmpState,
        });
    }

    render() {
        return (
            <BrowserRouter>
                <div>
                    {/*<Redirect exact={true} from="/" to="/login" />*/}
                    <Route exact={true} path='/' render={() => (
                        <div className="Login Login-header">
                            <Login
                                setGlobalState={this.setStateFromChild}
                                globalState={this.state}/>
                        </div>
                    )}/>
                    <Route exact={true} path='/main' render={() => (
                        <div className="App App-header">
                            <Session
                                setGlobalState={this.setStateFromChild}
                                globalState={this.state}
                                setPopupState={this.setPopupStateFromChild}/>
                            <BackgroundService
                                setGlobalState={this.setStateFromChild}
                                setPopupState={this.setPopupStateFromChild}
                                globalState={this.state}/>
                            <div className="SidePane">
                                <SidePane
                                    setGlobalState={this.setStateFromChild}
                                    setPopupState={this.setPopupStateFromChild}
                                    globalState={this.state}/>
                            </div>
                            <div className="MainContent">
                                <MainBody
                                    setGlobalState={this.setStateFromChild}
                                    setPopupState={this.setPopupStateFromChild}
                                    popupState={this.state.popupState}
                                    globalState={this.state}/>
                            </div>
                            <PopupService
                                setPopupState={this.setPopupStateFromChild}
                                popupState={this.state.popupState}/>
                        </div>
                    )}/>
                </div>
            </BrowserRouter>
        );
    }
}
