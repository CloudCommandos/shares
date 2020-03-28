import React from 'react';
import $ from 'jquery';
import { Redirect } from 'react-router-dom';
import SETTINGS from '../../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class Logout extends React.Component {
	constructor(props){
		super(props);
		this.logout = this.logout.bind(this);
		this.state = {
			redirect: (window.localStorage['session_key'] === "" ? true : false)
		};
	}

	logout(){
		let payload = {
			session_key: window.localStorage['session_key']
		}
		let context = this;
		$.ajax({
			type: "POST",
			url: SETTINGS.BACKEND_WS_LOGOUT_URL,
			data: JSON.stringify(payload),
			cache: false,
			dataType: 'json',
            contentType: 'application/json',
			success: function(data){
				if (data.status === "success"){
				    window.localStorage['session_key'] = "";
					context.setState({
						redirect: true
					});
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.log("failed!");
			}
		});
	}

	renderRedirect(){
		if (this.state.redirect) {
			return <Redirect to='/' />
		}
	}

	render(){
		return (
            <div id='logoutContainer'>
                {this.renderRedirect()}

                <button id='logoutBtn' onClick={this.logout}>
                    <FontAwesomeIcon style={{fontSize:'1.1em', marginRight:'10px'}} icon={'door-open'} />
                    Sign out
                </button>
            </div>
		)
	}


}