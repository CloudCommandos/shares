import React from 'react';
//import $ from 'jquery';
//import SETTINGS from '../../settings';
import Popup from 'reactjs-popup';
import './PopupService.css';

//Handles all popups through global state
export default class PopupService extends React.Component {
	constructor(props){
		super(props);

		//expected popup state
		/*
		    this.props.popupState = {
                popup1: {
                    show: false,
                    title: '',
                    content: '',
                    mode: 'admin'/'common',
                    hasCloseBtn: false,
                },
                popup2: {
                    show: false,
                    title: '',
                    content: '',
                    mode: 'admin'/'common',
                    hasCloseBtn: false,
                },
                popupConfirmation: {
                    show: false,
                    title: '',
                    yesCallback: f()/'',
                    yesButtonValue: '',
                    noCallback: f()/'',
                    noButtonValue: '',
                    mode: 'admin'/'common',
                    hasCloseBtn: false,
                },
		    }
		*/
        this.state={};
	}

    closePopup1(){
        var tmpState = {...this.props.popupState.popup1};
        tmpState.show = false;
        tmpState.title = '';
        tmpState.content = '';
        tmpState.mode = '';
        tmpState.hasCloseBtn = false;

        this.props.setPopupState({
            popup1: tmpState,
        }, 'PopupService');
    }
    closePopup2(){
        var tmpState = {...this.props.popupState.popup2};
        tmpState.show = false;
        tmpState.title = '';
        tmpState.content = '';
        tmpState.mode = '';
        tmpState.hasCloseBtn = false;

        this.props.setPopupState({
            popup2: tmpState,
        }, 'PopupService');
    }
    closePopupConfirmation(){
        var tmpState = {...this.props.popupState.popupConfirmation};
        tmpState.show = false;
        tmpState.title = '';
        tmpState.yesCallback = '';
        tmpState.yesButtonValue = '';
        tmpState.noCallback = '';
        tmpState.noButtonValue = '';
        tmpState.mode = '';
        tmpState.hasCloseBtn = false;

        this.props.setPopupState({
            popupConfirmation: tmpState,
        }, 'PopupService');
    }

    renderPopup(popupState, xBtnCallback){
        let headerClass = '';
        let contentClass = '';
        if (popupState.mode === 'common'){
            headerClass = 'modal-header-common';
            contentClass = 'modal-content-common';
        }else if (popupState.mode === 'admin'){
            headerClass = 'modal-header-admin';
            contentClass = 'modal-content-admin';
        }

        return (
            <>
                {this.renderXBtn(popupState.hasCloseBtn, xBtnCallback)}
                <div className={headerClass}> {popupState.title} </div>
                <div className={contentClass}>
                    {popupState.content}
                </div>
            </>
        );
    }

    renderXBtn(enable, xBtnCallback){
        if (enable){
            return (
                <input type={'button'} className={'xbtn'} onClick={xBtnCallback} style={{fontWeight:'bold'}} value={'X'}/>
            );
        }
    }

    renderPopupConfirmation(popupState, xBtnCallback){
        let headerClass = '';
        let contentClass = '';
        if (popupState.mode === 'common'){
            headerClass = 'modal-header-common';
            contentClass = 'modal-content-common';
        }else if (popupState.mode === 'admin'){
            headerClass = 'modal-header-admin';
            contentClass = 'modal-content-admin';
        }

        if (popupState.noCallback === 'close'){
            popupState.noCallback = xBtnCallback;
        }

        return (
            <>
                {this.renderXBtn(popupState.hasCloseBtn, xBtnCallback)}
                <div className={headerClass}> {popupState.title} </div>
                <div className={contentClass}>
                    <button className={"modal-submit-btn"} id={"yesBtn"} onClick={popupState.yesCallback} value={popupState.yesButtonValue}>Yes</button>
                    <button className={"modal-submit-btn"} id={"noBtn"} onClick={popupState.noCallback} value={popupState.noButtonValue}>No</button>
                </div>
            </>
        );
    }

    render(){
        return (
            <div>
                <Popup open={this.props.popupState.popup1.show}
                    onClose={this.closePopup1.bind(this)}
                    closeOnDocumentClick={false}
                    contentStyle={{ borderRadius:'10px', border: 'none', padding: '0', background: '#282828', width: 'auto' }}>
                    <div>
                        {this.renderPopup(
                            this.props.popupState.popup1,
                            this.closePopup1.bind(this)
                        )}
                    </div>
                </Popup>
                <Popup open={this.props.popupState.popup2.show}
                    onClose={this.closePopup2.bind(this)}
                    closeOnDocumentClick={false}
                    contentStyle={{ borderRadius:'10px', border: 'none', padding: '0', background: '#282828', width: 'auto' }}>
                    <div>
                        {this.renderPopup(
                            this.props.popupState.popup2,
                            this.closePopup2.bind(this)
                        )}
                    </div>
                </Popup>
                <Popup open={this.props.popupState.popupConfirmation.show}
                    onClose={this.closePopupConfirmation.bind(this)}
                    closeOnDocumentClick={false}
                    contentStyle={{ borderRadius:'10px', border: 'none', padding: '0', background: '#282828', width: 'auto' }}>
                    <div>
                        {this.renderPopupConfirmation(
                            this.props.popupState.popupConfirmation,
                            this.closePopupConfirmation.bind(this)
                        )}
                    </div>
                </Popup>
            </div>
        )
    }
}