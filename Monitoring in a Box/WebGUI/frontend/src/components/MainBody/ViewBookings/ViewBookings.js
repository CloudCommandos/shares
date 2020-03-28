import React from 'react';
//import $ from 'jquery';
//import SETTINGS from '../../../settings';
import ViewBookingsCalendar from './ViewBookingsCalendar';
import './ViewBookings.css';


export default class ViewBookings extends React.Component {
	constructor(props){
		super(props);
		this.state = {
		    isDisplaying: false,
		    displayTimestamp: Date.now(),
		};
	}

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (typeof(this.props.globalState.nav) !== 'undefined'){
                if (this.props.globalState.nav.viewBookings_selected !== this.state.isDisplaying){
                    this.setState({
                        isDisplaying : this.props.globalState.nav.viewBookings_selected,
                        displayTimestamp: Date.now(),
                    });
                }
            }
        }
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>My Bookings</p>
                <div className='MainContentBody'>
                    <ViewBookingsCalendar
                        setGlobalState={this.props.setGlobalState}
                        setPopupState={this.props.setPopupState}
                        globalState={this.props.globalState}/>
                </div>
            </div>
        )
    }
}