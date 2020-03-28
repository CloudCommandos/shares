import React from 'react';
import logo from '../images/favicon.ico';
import $ from 'jquery';
import { Redirect } from 'react-router-dom';
import SETTINGS from '../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class Login extends React.Component {
	constructor(props){
		super(props);
		this.login = this.login.bind(this);
		this.state = {
			redirect: false,
			session_checked: false,
			loadSpinner: false,
			feedback: '',
			feedback2: '',
		};
		this.checkSessionKey = this.checkSessionKey.bind(this);
	}

    componentDidMount(){
        this.checkSessionKey();
    }

	checkSessionKey(){
	    if (typeof(window.localStorage['session_key']) !== "undefined" && window.localStorage['session_key'] !== ''){
	        let payload = {
                session_key: window.localStorage['session_key']
            }
            let context = this;
            $.ajax({
                type: "POST",
                url: SETTINGS.BACKEND_WS_VALIDATE_SESSION_URL,
                data: JSON.stringify(payload),
                cache: false,
                dataType: 'json',
                contentType: 'application/json',
                success: function(data){
                    if (data.status === "success"){
                        let res = JSON.parse(data.res);
                        context.props.setGlobalState({
                            is_admin: res['is_admin'],
                            username: res['username'],
                            session_checked: true,
                        }, "Login");
                        context.setState({
                            redirect: true
                        });
                    }else{
                        window.localStorage['session_key'] = "";
                        context.setState({
                            session_checked: true
                        });
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("failed!");
                    window.localStorage['session_key'] = "";
                    context.setState({
                        session_checked: true
                    });
                }
            });
	    }else{
	        this.setState({
                session_checked: true
            });
	    }
	}

	login(event){
	    //Reset feedback div
	    this.setState({
	        loadSpinner: true,
	        feedback: '',
	        feedback2: '',
	    });

        //Get user input
		let payload = {
			username: $('#username')[0].value,
			password: $('#password')[0].value
		}

		let context = this;
		$.ajax({
			type: "POST",
			url: SETTINGS.BACKEND_WS_LOGIN_URL,
			data: JSON.stringify(payload),
			cache: false,
			dataType: 'json',
            contentType: 'application/json',
			success: function(data){
				if (data.status === "success"){
				    let res = JSON.parse(data.res);
				    //Store session_key locally
				    window.localStorage['session_key'] = res['session_key'];
				    context.props.setGlobalState({
				        is_admin: res['is_admin'],
				        username: res['username']
				    });
					context.setState({
						redirect: true,
					});
				}else{
				    let res = JSON.parse(data.res);

				    context.setState({
				        feedback: (res['error_code'] !== 0 ? "Error: " + res['error_code'] : ""),
                        feedback2: (typeof(res['status']) !== "undefined" ? res['status'] : ""),
                        loadSpinner: false,
				    });
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
			    context.setState({
                    feedback: "Request failed",
                    loadSpinner: false,
                });
				//$('#feedback').html();
			},
			complete: function () {

			},

		});
		event.preventDefault();
	}
	
	renderRedirect(){
		if (this.state.redirect) {
			return <Redirect to='/main' />
		}
	}

    renderFeedback(){
        if (this.state.loadSpinner){
            return (
                <FontAwesomeIcon icon="spinner" spin />
            )
        }else{
            return (
                <>
                    <p id="feedback" style={{color:'yellow'}}>{this.state.feedback}<br/>{this.state.feedback2}</p>
                </>
            )
        }
    }
	renderContents(){
		if (this.state.session_checked) {
			return(
			    <div>
                    <img src={logo} alt="logo"/>
                    <div id='loginContainer'>
                        <form onSubmit={this.login}>
                            <input className='login_input' id="username" type="text"
                                placeholder="Employee ID"/>
                            <br/>
                            <input className='login_input' id="password" type="password"
                                placeholder="Password"/>
                            <br/>
                            <button className='login_input' id='submit' >Sign in</button>
                        </form>
                        {this.renderFeedback()}
                    </div>
				</div>
			)
		}
	}
	
	render(){ 
		return (
			<div>
				{this.renderRedirect()}
                {this.renderContents()}
			</div>
		)
	}
}