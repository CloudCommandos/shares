import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import './AccountSettings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class AccountSettings extends React.Component {
	constructor(props){
		super(props);
		this.state={
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		    changePassword: {
                showChangePassword: false,
                secrets: {},
		    }
		};
	}

    handleChangePasswordBtnClick(){
        //clear secret inputs
        $('input.passwordChangeElement').each(function(index){ $(this).val(''); });

        this.setState(prevState =>({
            changePassword: {
                ...prevState.changePassword,
                showChangePassword: !prevState.changePassword.showChangePassword,
            }
        }));
    }

    handleChangePasswordSubmitClick(event){
        event.preventDefault();

        let secrets = {
            oldPassword: $('#password_old')[0].value,
            newPassword: $('#password_new')[0].value,
            newPassword2: $('#password_new2')[0].value,
        }

        if (secrets.oldPassword === ''
            || secrets.newPassword === ''
            || secrets.newPassword2 === ''){
            //Show notification in popup
            this.props.setPopupState({
                popup1: {
                    show: true,
                    title: 'Notification',
                    content: 'All fields are required!',
                    mode: 'common',
                    hasCloseBtn: true,
                }
            }, "AccountSettings");
            return;
        }

        if (secrets.newPassword !== secrets.newPassword2){
            //Show notification in popup
            this.props.setPopupState({
                popup1: {
                    show: true,
                    title: 'Notification',
                    content: 'New passwords do not match!',
                    mode: 'common',
                    hasCloseBtn: true,
                }
            }, "AccountSettings");
            return;
        }

        if (secrets.oldPassword === secrets.newPassword){
            //Show notification in popup
            this.props.setPopupState({
                popup1: {
                    show: true,
                    title: 'Notification',
                    content: 'New password must be different from old password!',
                    mode: 'common',
                    hasCloseBtn: true,
                }
            }, "AccountSettings");
            return;
        }

        this.setState(prevState => ({
            changePassword: {
                ...prevState.changePassword,
                secrets: secrets,
            }
        }));
        this.props.setPopupState({
            popupConfirmation: {
                show: true,
                title: 'Proceed to change password?',
                yesCallback: this.changePassword.bind(this),
                yesButtonValue: '',
                noCallback: 'close',
                noButtonValue: '',
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "AccountSettings");
    }

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (typeof(this.props.globalState.nav) !== 'undefined'){
                if (this.props.globalState.nav.accountSettings_selected !== this.state.isDisplaying){
                    this.setState({
                        isDisplaying : this.props.globalState.nav.accountSettings_selected,
                        displayTimestamp: Date.now(),
                    });

                    if (!this.props.globalState.nav.accountSettings_selected){
                        //clear secret inputs
                        $('input.passwordChangeElement').each(function(index){ $(this).val(''); });
                    }
                }
            }
        }
    }

    changePassword(){
        //secrets should already be stored in state
        //clear secret inputs
        $('input.passwordChangeElement').each(function(index){ $(this).val(''); });

        //Show spinner in popup
        this.props.setPopupState({
            popupConfirmation:{
                show: false,
            },
            popup1: {
                show: true,
                title: 'Loading',
                content: <FontAwesomeIcon icon="spinner" spin style={{fontSize: '2em', margin: 'auto', display: 'block'}}/>,
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "AccountSettings");

		let payload = {
			session_key: window.localStorage['session_key'],
			old_password: this.state.changePassword.secrets.oldPassword,
			new_password: this.state.changePassword.secrets.newPassword,
		}

		let context = this;
		$.ajax({
			type: "POST",
			url: SETTINGS.BACKEND_WS_CHANGE_PASSWORD,
			data: JSON.stringify(payload),
			cache: false,
			dataType: 'json',
            contentType: 'application/json',
			success: function(data){
				if (data.status === "success"){
				    //let res = JSON.parse(data.res);
                    //Show notification in popup
                    context.props.setPopupState({
                        popup1: {
                            show: true,
                            title: 'Notification',
                            content: 'Password changed',
                            mode: 'common',
                            hasCloseBtn: true,
                        }
                    }, "AccountSettings");

                    context.handleChangePasswordBtnClick();

				}else{
				    let res = JSON.parse(data.res);
				    const feedback = (
				        <div>
                            <span>{(res['error_code'] !== 0 ? "Error: " + res['error_code'] + ", ": " ")}
                            {(typeof(res['status']) !== "undefined" ? res['status'] : "")}</span>
				        </div>
				    )
				    //Show notification in popup
                    context.props.setPopupState({
                        popup1: {
                            show: true,
                            title: 'Notification',
                            content: feedback,
                            mode: 'common',
                            hasCloseBtn: true,
                        }
                    }, "AccountSettings");
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
			    //Show notification in popup
                context.props.setPopupState({
                    popup1: {
                        show: true,
                        title: 'Notification',
                        content: 'Request failed',
                        mode: 'common',
                        hasCloseBtn: true,
                    }
                }, "AccountSettings");
			},
			complete: function () {

			},

		});
    }

    getDivClass(id){
        let className = '';
        switch(id){
            case 'changePasswordContentDiv':
                if (this.state.changePassword.showChangePassword){
                    className = 'changePasswordContentDiv';
                }else{
                    className = 'changePasswordContentDiv changePasswordContentDiv-SlideUp';
                }
                break;
            case 'changePasswordBtn':
                if (this.state.changePassword.showChangePassword){
                    className = 'changePasswordBtn-expanded';
                }else{
                    className = 'changePasswordBtn-collapsed';
                }
                break;
            default:
                break;
        }
        return className;
    }

    renderChangePasswordDiv(){
        return (
                <div className={this.getDivClass('changePasswordContentDiv')}>
                    <form onSubmit={this.handleChangePasswordSubmitClick.bind(this)}>
                        <input id='password_old' className='passwordChangeElement' type='password' placeholder='old password' /><br/>
                        <input id='password_new' className='passwordChangeElement' type='password' placeholder='new password' /><br/>
                        <input id='password_new2' className='passwordChangeElement' type='password' placeholder='repeat new password' /><br/>
                        <button id='passwordChangeSubmit' className='passwordChangeElement' >Submit</button>
                    </form>
                </div>
        );
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>Profile</p>
                <div className='MainContentBody'>
                    <div id='changePasswordDiv'>
                        <button id='changePasswordBtn' className={this.getDivClass('changePasswordBtn')} onClick={this.handleChangePasswordBtnClick.bind(this)} >Change Password</button>
                        <div id='changePasswordContentDivWrapper'>
                            {this.renderChangePasswordDiv()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}