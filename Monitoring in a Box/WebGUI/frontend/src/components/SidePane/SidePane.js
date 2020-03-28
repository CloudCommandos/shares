import React from 'react';
//import SETTINGS from '../../settings';
import './SidePane.css';
import {Route} from 'react-router-dom';
import Logout from './Logout';
import Clock from './Clock';
import NavigationMenu from './NavigationMenu';

export default class SidePane extends React.Component {

    render() {
        return (
            <div>
                <Route exact={true} path='/main' render={() => (
                    <div>
                        <div>
                            <Logout
                                setGlobalState={this.props.setGlobalState}
                                setPopupState={this.props.setPopupState}
                                globalState={this.props.globalState}/>
                            <Clock
                                setGlobalState={this.props.setGlobalState}
                                setPopupState={this.props.setPopupState}
                                globalState={this.props.globalState}/>
                        </div>
                        <hr/>
                        <NavigationMenu
                            setGlobalState={this.props.setGlobalState}
                            setPopupState={this.props.setPopupState}
                            globalState={this.props.globalState}/>
                    </div>
                )}/>
            </div>
        );
    }
}
