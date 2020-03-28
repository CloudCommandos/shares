import React from 'react';
//import $ from 'jquery';
import { Redirect } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class NavigationMenu extends React.Component {
	constructor(props){
		super(props);
		this.makeSelection = this.makeSelection.bind(this);
		this.getButtonClass = this.getButtonClass.bind(this);
	}

	componentDidMount(){
	    //Reset selections
	    this.props.setGlobalState({
	        nav: {
                accountSettings_selected: false,
                systemSettings_selected: false,
            },
        }, "NavigationMenu");
	}

    makeSelection(selection){
        var newnav = {};
        for (var key in this.props.globalState.nav){
            newnav[key] = false;
        }
        switch(selection.target.id){
            case "nav_accountSettings":
                if (!this.props.globalState.nav.accountSettings_selected){
                    newnav.accountSettings_selected = true;
                }
                this.props.setGlobalState({
                    nav: newnav,
                }, "NavigationMenu");
                break;
            case "nav_systemSettings":
                if (!this.props.globalState.nav.systemSettings_selected){
                    newnav.systemSettings_selected = true;
                }
                this.props.setGlobalState({
                    nav: newnav,
                }, "NavigationMenu");
                break;
            default:
                console.log("Wrong Nav Selection!");
	    }
    }

	renderRedirect(){
		if (this.state.redirect) {
			return <Redirect to='/login' />
		}
	}

    getButtonClass(id){
        let classname = '';
        if (typeof(this.props.globalState.nav) !== 'undefined'){
            switch(id){
                case "nav_accountSettings":
                    if (this.props.globalState.nav.accountSettings_selected){
                        classname = 'NavigationBtn NavigationBtnActive';
                    }else{
                        classname = 'NavigationBtn';
                    }
                    break;
                case "nav_systemSettings":
                    if (this.props.globalState.nav.systemSettings_selected){
                        classname =  'AdminNavigationBtn NavigationBtnActive';
                    }else{
                        classname =  'AdminNavigationBtn';
                    }
                    break;
                default:
                    console.log("Unhandled case!");
                    break;
            }
        }
        return classname;
    }

    renderAccountSettings(){
        return (
            <button className={this.getButtonClass('nav_accountSettings')} id='nav_accountSettings' onClick={this.makeSelection} >
                <FontAwesomeIcon style={{fontSize:'1.6em',float:'left', position:'relative', marginRight:'10px', color:'white'}} icon={'id-card'} />
                Profile
            </button>
        )
    }
    renderSystemSettings(){
        if (this.props.globalState.is_admin){
            return (
                <button className={this.getButtonClass('nav_systemSettings')} id='nav_systemSettings' onClick={this.makeSelection} >
                    <FontAwesomeIcon style={{fontSize:'1.6em',float:'left', position:'relative', marginRight:'10px'}} icon={'sliders-h'} />
                    System Settings
                </button>
            )
        }
    }

	render(){
		return (
            <div id='NavigationMenuContainer'>
                {this.renderSystemSettings()}
                {this.renderAccountSettings()}
            </div>
		)
	}
}