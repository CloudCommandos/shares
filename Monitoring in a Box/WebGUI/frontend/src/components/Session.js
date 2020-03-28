import React from 'react';
import $ from 'jquery';
import { Redirect } from 'react-router-dom';
import SETTINGS from '../settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class Session extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			redirectToLoginPage: false,
		};
		this.checkSessionKey = this.checkSessionKey.bind(this);
	}

    componentDidMount(){
        if (!this.props.globalState.session_checked){
            this.checkSessionKey();
        }
    }

	checkSessionKey(){
	    if (typeof(window.localStorage['session_key']) !== "undefined" && window.localStorage['session_key'] !== ''){
	        let payload = {
                session_key: window.localStorage['session_key']
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
            }, "Session");

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
                        if (res['username'] !== ''){
                            context.props.setGlobalState({
                                is_admin: res['is_admin'],
                                username: res['username'],
                                session_checked: true,
                            }, "Session");

                            //close spinner
                            context.props.setPopupState({
                                popup1: {
                                    show: false,
                                    title: '',
                                    content: '',
                                    mode: 'common',
                                    hasCloseBtn: false,
                                }
                            }, "Session");
                        }else{
                            setTimeout(function(){
                                console.log('rechecking session...');
                                context.checkSessionKey();
                            }, 2000);   //retry
                        }
                    }else{
                        console.log('session check failed');
                        window.localStorage['session_key'] = "";
                        context.setState({
                            redirectToLoginPage: true
                        });
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("session check error!");
                    window.localStorage['session_key'] = "";
                    context.setState({
                        redirectToLoginPage: true
                    });
                }
            });
	    }else{
	        this.setState({
                redirectToLoginPage: true
            });
	    }
	}

	renderRedirect(){
		if (this.state.redirectToLoginPage) {
			return <Redirect to='/' />
		}
	}
	
	render(){ 
		return (
			<>
				{this.renderRedirect()}
			</>
		)
	}
}