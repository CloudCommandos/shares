import React from 'react';
import $ from 'jquery';
import SETTINGS from '../../../settings';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from "@fullcalendar/interaction"; // needed for dayClick
//import bootstrapPlugin from '@fullcalendar/bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import RoomFilterDropDownMenu from '../RoomFilterDropDownMenu';

import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import '@fullcalendar/list/main.css';
//import '@fullcalendar/bootstrap/main.css';
import './ViewBookingsCalendar.css';
import './ViewBookingsDropDownMenu.css';

var initialLoaded = false;
var ajax_userGetAllBookings_timer = null;
window.test = null;
export default class ViewBookingsCalendar extends React.Component {
	constructor(props){
		super(props);
        this.calendarEventRetrievalHandler = this.calendarEventRetrievalHandler.bind(this);
        this.handleDateClick = this.handleDateClick.bind(this);
        this.handleEventClick = this.handleEventClick.bind(this);
        this.getFilterButtonClass = this.getFilterButtonClass.bind(this);
        this.handleFilterClick = this.handleFilterClick.bind(this);

		this.state = {
		    isDisplaying: false,
		    loadedAllBookings: false,
		    showDropDown: false,
		    displayTimestamp: Date.now(),
		    prevGetAllBookingsTimestamp: Date.now() - 500,
		    minApiDelayMS: 500, //500ms
		    userGetAllBookings_data: [],

            filterRooms: [],
            filterLocations: [],
            requireCalendarRefresh: false,
            requireCalendarApiRefresh: false,

		    calendarState: {
		        dataStartYear: 0,
		        dataStartMonth: 0,
		        dataStartDay: 0,
		        dataEndYear: 0,
		        dataEndMonth: 0,
		        dataEndDay: 0,
		    },

		    modal: false,
		    modalContents: {
		        title: '',
		        html: '',
		    },

		    modalConfirmation: false,
		    modalConfirmationContents: {
		        html: '',
		    },
		};
		initialLoaded = false;
	}

    calendarRef = React.createRef();

//for testing//////////////
    getMethods(obj){
  var result = [];
  for (var id in obj) {
    try {
      if (typeof(obj[id]) == "function") {
        result.push(id + ": " + obj[id].toString());
      }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }
  return result;
}
///////////////////////////

    componentDidUpdate(){
        if (typeof(this.props.globalState) !== 'undefined'){
            if (typeof(this.props.globalState.nav) !== 'undefined'){
                if (this.props.globalState.nav.viewBookings_selected !== this.state.isDisplaying){
                    if (this.props.globalState.nav.viewBookings_selected){
                        this.setState({
                            isDisplaying : this.props.globalState.nav.viewBookings_selected,
                            displayTimestamp: Date.now(),
                            requireCalendarApiRefresh: true,
                        });
                    }else{
                        this.setState({
                            isDisplaying : this.props.globalState.nav.viewBookings_selected,
                            displayTimestamp: Date.now(),
                        });
                    }
                }else{
                    if (this.state.isDisplaying){
                        if (!initialLoaded){
                            initialLoaded = true;
                            let calendarApi = this.calendarRef.current.getApi();
                            calendarApi.refetchEvents();
                            calendarApi.updateSize();
                        }else if ( typeof(this.props.globalState.socket_booking_updated) !== 'undefined' &&
                            this.props.globalState.socket_booking_updated){
                            let calendarApi = this.calendarRef.current.getApi();
                            calendarApi.refetchEvents();
                            calendarApi.updateSize();
                            this.props.setGlobalState({
                                'socket_booking_updated': false,
                            }, "ViewBookingsCalendar");
                            this.setState({
                                requireCalendarApiRefresh: true,
                            });
                        }else if (this.state.requireCalendarApiRefresh){
                            let calendarApi = this.calendarRef.current.getApi();
                            calendarApi.refetchEvents();
                            calendarApi.updateSize();
                        }
                    }
                }
            }

            if (this.state.isDisplaying){
                if (typeof(this.props.globalState.roomlist) !== 'undefined'){
                    if (this.props.globalState.roomlist.length !== this.state.filterRooms.length){
                        var rooms = [];
                        var locations = [];
                        locations.push({
                            location: 'All',
                            selected: true,
                        });
                        for (let i = 0; i < this.props.globalState.roomlist.length; ++i){
                            var obj = {
                                room_name: this.props.globalState.roomlist[i]['room_name'],
                                room_location: this.props.globalState.roomlist[i]['room_location'],
                                room_capacity: this.props.globalState.roomlist[i]['room_capacity'],
                                selected: false,
                            }
                            rooms.push(obj);

                            //get unique locations
                            var newLocation = true;
                            for (let j = 0; j < locations.length; ++j){
                                if (locations[j].location === this.props.globalState.roomlist[i]['room_location']){
                                    newLocation = false;
                                }
                            }
                            if (newLocation){
                                locations.push({
                                    location: this.props.globalState.roomlist[i]['room_location'],
                                    selected: false,
                                });
                            }
                        }
                        var needUpdate = false;
                        for (let i = 0; i < rooms.length; ++i){
                            var exists = false;
                            for (let j = 0; j < this.state.filterRooms.length; ++j){
                                if (rooms[i]['room_name'] === this.state.filterRooms[j]['room_name']){
                                    exists = true;
                                    rooms[i]['selected'] = this.state.filterRooms[j]['selected'];
                                    break;
                                }
                            }
                            if (!exists){
                                needUpdate = true;
                            }

                        }
                        if (needUpdate){
                            this.setState({
                                filterRooms: rooms,
                                filterLocations: locations,
                            });
                        }
                    }
                }
            }
        }
        if (this.state.isDisplaying){
            if (this.state.requireCalendarRefresh){
                let calendarApi = this.calendarRef.current.getApi();
                calendarApi.refetchEvents();
                this.setState({
                    'requireCalendarRefresh': false
                });
            }
        }
    }

    processEventData(data, callback, usingCache){
        var tmpData = [];
        //merge with existing events
        if (!usingCache){
            var oldEvents = this.calendarRef.current.getApi().getEvents();
            var tmpData2 = JSON.parse(JSON.stringify(data));
            for (let o = oldEvents.length - 1; o >= 0 ; --o){
                var hasNewer = false;
                for (let i = tmpData2.length - 1; i >= 0 ; --i){
                    if ("" + tmpData2[i]['booking_id'] === "" + oldEvents[o].id){
                        hasNewer = true;
                        tmpData2.splice(i,1);
                        break;
                    }
                }
                if (!hasNewer){
                    //retain old data
                    if (oldEvents[o].extendedProps.refreshes_survived < 20){  //discard events older than 20 data retrievals
                        let obj = {
                            id: oldEvents[o].id,
                            title: oldEvents[o].title,
                            //allDay : false, // will make the time show
                            start: oldEvents[o].start,
                            end: oldEvents[o].end,
                            color: oldEvents[o].backgroundColor,
                            extendedProps: {
                                'reservation_status': oldEvents[o].extendedProps.reservation_status,
                                'purpose': oldEvents[o].extendedProps.purpose,
                                'refreshes_survived': oldEvents[o].extendedProps.refreshes_survived + 1,
                                'name': oldEvents[o].extendedProps.name,
                                'location': oldEvents[o].extendedProps.location,
                                'capacity': oldEvents[o].extendedProps.capacity,
                                'user': oldEvents[o].extendedProps.user,
                            },
                        };
                        tmpData.push(obj);
                    }
                }
            }

            for (let i = data.length - 1; i >= 0 ; --i){
                //use new data to replace old data
                let backgroundColor = "";
                let borderColor = "";
                switch(data[i]['reservation_status']){
                    case "approved":
                        backgroundColor = "rgba(69, 230, 3, 0.8)";
                        borderColor = "rgba(69, 230, 3, 1)";
                        break;
                    case "cancelled":
                        break;
                    case "rejected":
                        break;
                    case "locked":
                        backgroundColor = "rgba(29, 29, 29, 0.8)";
                        borderColor = "rgba(29, 29, 29, 1)";
                        break;
                    case "invalidated":
                        backgroundColor = "rgba(218, 25, 25, 0.8)";
                        borderColor = "rgba(218, 25, 25, 1)";
                        break;
                    default:
                        backgroundColor = "rgb(100,100,100,0.8)";
                        borderColor = "rgb(100,100,100,1)";
                        break;
                }
                let obj = {
                    id: data[i]['booking_id'],
                    title: data[i]['room_name'] + ' : ' + data[i]['employee_name'],
                    //allDay : false, // will make the time show
                    start: data[i]['start_time'],
                    end: data[i]['end_time'],
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    extendedProps: {
                        'reservation_status': data[i]['reservation_status'],
                        'purpose': data[i]['usage'],
                        'refreshes_survived': 1,
                        'name': data[i]['room_name'],
                        'location': data[i]['room_location'],
                        'capacity': data[i]['room_capacity'],
                        'user': data[i]['employee_name'],
                    },
                };
                tmpData.push(obj);
            }
        }else{
            tmpData = data;
        }

        var processedData = [];
        for (let i = 0; i < tmpData.length; ++i){
            var show = true;
            //Filter by reservation_status
            switch(tmpData[i].extendedProps.reservation_status){
                case "approved":
                    break;
                case "cancelled":
                    show = false;
                    break;
                case "rejected":
                    show = false;
                    break;
                case "locked":
                    break;
                case "invalidated":
                    break;
                default:
                    show = false;
                    break;
            }

            if (show){
                processedData.push(tmpData[i]);
            }
        }

        //Store non-filtered events first
        this.setState({
            userGetAllBookings_data: processedData,
        });

        //Filter events
        var showData = JSON.parse(JSON.stringify(processedData));
        var filterMap_Rooms = {};
        var filterMap_Locations = {};
        for (let i = 0; i < this.state.filterRooms.length; ++i){
            filterMap_Rooms[this.state.filterRooms[i]['room_name']] = this.state.filterRooms[i]['selected'];
        }
        for (let i = 0; i < this.state.filterLocations.length; ++i){
            filterMap_Locations[this.state.filterLocations[i]['location']] = this.state.filterLocations[i]['selected'];
        }

        for (let i = showData.length - 1; i >= 0; --i){
            let show = true;
            if (!filterMap_Rooms[showData[i].extendedProps.name]
                && !filterMap_Locations[showData[i].extendedProps.location]
                && !filterMap_Locations['All']
                ){
                show = false;
            }

            if (!show){
                showData.splice(i, 1);
            }
        }
        callback(showData);
    }

    handleDateClick(arg){
        let calendarApi = this.calendarRef.current.getApi();
        calendarApi.changeView('timeGridDay', arg.date);
    }

    handleEventClick(el){
        this.props.setPopupState({
            popup1: {
                show: true,
                title: el.event.title,
                content: this.getEventModalBody(el.event),
                mode: 'common',
                hasCloseBtn: true,
            }
        }, "ViewBookings_Calendar");
    }

    handleCancelItem(el){
        this.props.setPopupState({
            popupConfirmation: {
                show: true,
                title: 'Proceed to Cancel Item?',
                yesCallback: this.handleConfirmCancelItem.bind(this),
                yesButtonValue: el.target.value,
                noCallback: 'close',
                noButtonValue: '',
                mode: 'common',
                hasCloseBtn: false,
            }
        }, "ViewBookings_Calendar");
    }

    handleConfirmCancelItem(el){
        //let context = this;
        let eventId = el.target.value;
        //call api to cancel lock
        this.userCancelItem(eventId, function(){
            //trigger calendar event refetch
            //context.calendarRef.current.getApi().refetchEvents();
        })
        this.props.setPopupState({
            popup1: {
                show: false,
            },
            popupConfirmation: {
                show: false,
            },
        }, "ViewBookings_Calendar");
    }

    getEventModalBody(event){
        let startStr = event.start.getFullYear() + '-' + (event.start.getMonth() + 1) + '-' + event.start.getDate() + ' ' + ("0" + event.start.getHours()).slice(-2) + ':' + ("0" + event.start.getMinutes()).slice(-2);
        let endStr = event.end.getFullYear() + '-' + (event.end.getMonth() + 1) + '-' + event.end.getDate() + ' ' + ("0" + event.end.getHours()).slice(-2) + ':' + ("0" + event.end.getMinutes()).slice(-2);

        return (
            <>
                <table>
                    <tbody>
                        <tr><th>Location: </th><td> {event.extendedProps.location} </td></tr>
                        <tr><th>Room: </th><td> {event.extendedProps.name} </td></tr>
                        <tr><th>Capacity: </th><td> {event.extendedProps.capacity} </td></tr>
                        <tr><th>Booked By: </th><td> {event.extendedProps.user} </td></tr>
                        <tr><th>Start: </th><td> {startStr} </td></tr>
                        <tr><th>End: </th><td> {endStr} </td></tr>
                        <tr><th>Status: </th><td> {event.extendedProps.reservation_status} </td></tr>
                        <tr><th>ID: </th><td> {event.id} </td></tr>
                        <tr><th>Purpose: </th><td> {event.extendedProps.purpose} </td></tr>
                    </tbody>
                </table>
                {this.getEventModalBody_actions(event)}
            </>
        )
    }

    getEventModalBody_actions(event){
        let cancelItemBtn = (
                                <button
                                    className={"modal-submit-btn"}
                                    id={"cancelItemBtn"}
                                    onClick={this.handleCancelItem.bind(this)}
                                    value={event.id}
                                    style={{width:'100%', marginTop:'2.5rem'}}
                                >
                                    Cancel Item
                                </button>
                            );
        //let rejectBtn = <button className={"modal-submit-btn"} id={"rejectEventBtn"} onClick={function(){alert('Rejected');}}>Reject</button>
        switch(event.extendedProps.reservation_status){
            case "locked":
                return(
                    cancelItemBtn
                )
            case "invalidated":
                return(
                    cancelItemBtn
                )
            case "approved":
                return(
                    cancelItemBtn
                )
            default:
                return '';
        }
    }

    calendarEventRetrievalHandler(params, callback){
        let context = this;
        if (context.state.isDisplaying){
            let startYear = params.start.getFullYear();
            let startMonth = params.start.getMonth() + 1;
            let startDay = params.start.getDate();

            let endYear = params.end.getFullYear();
            let endMonth = params.end.getMonth() + 1;
            let endDay = params.end.getDate();

            startDay -= 7;
            if (startDay < 1){
                startDay += 28;
                startMonth -= 1;
                if (startMonth < 1){
                    startMonth = 12;
                    startYear -= 1;
                }
            }

            endDay += 7;
            if (endDay > 28){
                endDay -= 28;
                endMonth += 1;
                if (endMonth > 12){
                    endMonth = 1;
                    endYear += 1;
                }
            }

            if ( this.state.requireCalendarApiRefresh ||
                (startYear + '' + startMonth + '' + startDay + '' + endYear + '' + endMonth + '' + endDay) !==
                (context.state.calendarState.dataStartYear
                    + '' + context.state.calendarState.dataStartMonth
                    + '' + context.state.calendarState.dataStartDay
                    + '' + context.state.calendarState.dataEndYear
                    + '' + context.state.calendarState.dataEndMonth
                    + '' + context.state.calendarState.dataEndDay
                )
            ) {
                clearTimeout(ajax_userGetAllBookings_timer);  //reset ajax call timer
                ajax_userGetAllBookings_timer = setTimeout(function(){
                    context.userGetAllBookings(startYear, startMonth, startDay, endYear, endMonth, endDay, callback)}
                , context.state.minApiDelayMS);

                context.setState({
                    requireCalendarApiRefresh: false,
                    calendarState: {
                        dataStartYear: startYear,
                        dataStartMonth: startMonth,
                        dataStartDay: startDay,
                        dataEndYear: endYear,
                        dataEndMonth: endMonth,
                        dataEndDay: endDay,
                    },
                });
            }else{
                context.processEventData(context.state.userGetAllBookings_data, callback, true);
            }
        }
    }

    userGetAllBookings(startYear, startMonth, startDay, endYear, endMonth, endDay, callback){
        let payload = {
            session_key: window.localStorage['session_key'],
            start_date_time: startYear + '-' + startMonth + '-' + startDay + ' 00:00:00',
            end_date_time: endYear + '-' + endMonth + '-' + endDay + ' 23:59:59',
        }

        let context = this;
        let callbackholder = callback;
        $.ajax({
            type: "POST",
            url: SETTINGS.BACKEND_WS_USER_GET_ALL_BOOKINGS,
            data: JSON.stringify(payload),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            success: function(data){
                if (data.status === "success"){
                    let res = JSON.parse(data.res);
                    context.processEventData(res.status, callbackholder, false);
                }else{

                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("failed!");
            },complete: function(){
                context.setState({
                    prevGetAllBookingsTimestamp: Date.now(),
                });
            }
        });
    }

    userCancelItem(eventId, callback){
        if (this.state.isDisplaying){
            let payload = {
                session_key: window.localStorage['session_key'],
                booking_id: eventId,
            }

            let context = this;
            //let callbackholder = callback;
            $.ajax({
                type: "POST",
                url: SETTINGS.BACKEND_WS_USER_CANCEL_BOOKING,
                data: JSON.stringify(payload),
                cache: false,
                dataType: 'json',
                contentType: 'application/json',
                success: function(data){
                    if (data.status === "success"){
                        //let res = JSON.parse(data.res);
                    }else{
                        console.log('failed to cancel item!');
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("failed!");
                },complete: function(){
                    context.setState({
                        requireCalendarApiRefresh: true,
                    });
                    //callbackholder();
                }
            });
        }
    }

    handleFilterClick(selection){
        let filterSel = selection.target.value;
        let fR = JSON.parse(JSON.stringify(this.state.filterRooms));
        let fL = JSON.parse(JSON.stringify(this.state.filterLocations));

        if (filterSel === 'All'){  //special case, All rooms and locations
            //deselect all location selections
            for (let i = 0; i < fL.length; ++i){
                if (fL[i]['location'] !== filterSel){
                    fL[i]['selected'] = false;
                }
            }
            //deselect all room selections
            for (let i = 0; i < fR.length; ++i){
                if (fR[i]['room_name'] !== filterSel){
                    fR[i]['selected'] = false;
                }
            }
            //toggle 'All' selection
            for (let i = 0; i < fL.length; ++i){
                if (fL[i]['location'] === filterSel){
                    fL[i]['selected'] = true; //no deselecting 'All'
                    break;
                }
            }
        }else{
            //determine is room or location selection
            let isLocation = false;
            for (let i = 0; i < fL.length; ++i){
                if (fL[i]['location'] === filterSel){
                    isLocation = true;
                    break;
                }
            }

            if (isLocation){    //normal location selection
                //deselect all location selections except for current selection
                for (let i = 0; i < fL.length; ++i){
                    if (fL[i]['location'] !== filterSel){
                        fL[i]['selected'] = false;
                    }
                }
                //deselect all room selections
                for (let i = 0; i < fR.length; ++i){
                    fR[i]['selected'] = false;
                }
                //toggle selected location filter
                for (let i = 0; i < fL.length; ++i){
                    if (fL[i]['location'] === filterSel){
                        fL[i]['selected'] = !fL[i]['selected'];
                        break;
                    }
                }
                //select 'All' if none selected
                let noneSelected = true;
                for (let i = 0; i < fL.length; ++i){
                    if (fL[i]['selected']){
                        noneSelected = false;
                        break;
                    }
                }
                if (noneSelected){
                    //toggle 'All' selection
                    for (let i = 0; i < fL.length; ++i){
                        if (fL[i]['location'] === 'All'){
                            fL[i]['selected'] = true; //no deselecting 'All'
                            break;
                        }
                    }
                }

            }else{  //normal room selection
                //deselect all location selections
                for (let i = 0; i < fL.length; ++i){
                    fL[i]['selected'] = false;
                }
                //toggle selected room filter
                for (let i = 0; i < fR.length; ++i){
                    if (fR[i]['room_name'] === filterSel){
                        fR[i]['selected'] = !fR[i]['selected'];
                        break;
                    }
                }
                //select 'All' if none selected
                let noneSelected = true;
                for (let i = 0; i < fR.length; ++i){
                    if (fR[i]['selected']){
                        noneSelected = false;
                        break;
                    }
                }
                if (noneSelected){
                    //toggle 'All' selection
                    for (let i = 0; i < fL.length; ++i){
                        if (fL[i]['location'] === 'All'){
                            fL[i]['selected'] = true; //no deselecting 'All'
                            break;
                        }
                    }
                }
            }
        }

        this.setState({
            'filterRooms': fR,
            'filterLocations': fL,
            'requireCalendarRefresh': true
        });
    }

    getFilterButtonClass(id, isLiTag){
        if (isLiTag){
            //Only applies to menu levels that have children
            for (let i = 0; i < this.state.filterLocations.length; ++i){
                if (id === this.state.filterLocations[i]['location']){
                    if (this.state.filterLocations[i]['selected']){
                        return '';
                    }else{
                        //check if any children selected
                        let hasChildSelected = false;
                        for (let j = 0; j < this.state.filterRooms.length; ++j){
                            if (this.state.filterRooms[j]['room_location'] === id
                                && this.state.filterRooms[j]['selected']){
                                hasChildSelected = true;
                                break;
                            }
                        }

                        if (hasChildSelected){
                            return 'hasChildSelected';
                        }
                        return '';
                    }
                }
            }
            return '';
        }else{
            //locations
            for (let i = 0; i < this.state.filterLocations.length; ++i){
                if (id === this.state.filterLocations[i]['location']){
                    if (this.state.filterLocations[i]['selected']){
                        return 'filterBtn filterBtnActive';
                    }else{
                        //check if any children selected
                        let hasChildSelected = false;
                        for (let j = 0; j < this.state.filterRooms.length; ++j){
                            if (this.state.filterRooms[j]['room_location'] === id
                                && this.state.filterRooms[j]['selected']){
                                hasChildSelected = true;
                                break;
                            }
                        }

                        if (hasChildSelected){
                            return 'filterBtn hasChildSelected';
                        }
                        return 'filterBtn';
                    }
                }
            }

            //Rooms
            for (let i = 0; i < this.state.filterRooms.length; ++i){
                if (id === this.state.filterRooms[i]['room_name']){
                    if (this.state.filterRooms[i]['selected']){
                        return 'filterBtn filterBtnActive';
                    }else{
                        return 'filterBtn';
                    }
                }
            }

            return 'filterBtn';
        }
    }

    getFilterIconClass(){
        for (let i = 0; i < this.state.filterLocations.length; ++i){
            if (this.state.filterLocations[i]['location'] === 'All'){
                if (this.state.filterLocations[i]['selected']){
                    return 'no-filter';
                }else{
                    return 'has-filter';
                }
            }
        }
    }

    handleFilterIconClick(){
        this.setState({
            showDropDown: !this.state.showDropDown,
        });
    }

    toggleDropDown(show){
        this.setState({
            showDropDown: show,
        });
    }

    renderDropDownMenu(){
        if (this.state.showDropDown){
            var config = [];
            for (let i = 0; i < this.state.filterLocations.length; ++i){
                var rooms = [];
                for (let j = 0; j < this.state.filterRooms.length; ++j){
                    if (this.state.filterRooms[j]['room_location'] === this.state.filterLocations[i].location){
                        var room = {
                            title: this.state.filterRooms[j]['room_name'],
                            submenu: null,
                        };
                        rooms.push(room);
                    }
                }
                var location = {
                    title: this.state.filterLocations[i].location,
                    submenu: (rooms.length > 0 ? rooms : null),
                };
                config.push(location);
            }

            return (
                <RoomFilterDropDownMenu dropdown_classname={'Dropdown-menu'}
                    config={config}
                    getDropDownClass={this.getFilterButtonClass}
                    handleDropDownClick={this.handleFilterClick}
                    showDropDown={this.toggleDropDown.bind(this)}
                    ignoreClickId={'filterIcon'}
                />
            )
        }
    }
    render(){
        return (
            <div id='ViewBookings_Calendar_Wrapper'>
                <div id='ViewBookings_Filter'>
                    <FontAwesomeIcon className={this.getFilterIconClass()} id={'filterIcon'} icon={'poll-h'} onClick={this.handleFilterIconClick.bind(this)}/>
                    {this.renderDropDownMenu()}
                </div>

                <div id='ViewBookings_Calendar'>
                    <FullCalendar
                        ref={this.calendarRef}
                        defaultView="dayGridMonth"
                        plugins={[ dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin ]}
                        header={{
                            center: 'title',
                            left: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                            right: 'prev,next today',
                        }}
                        themeSystem={'standard'}
                        weekends={false}
                        height={'parent'}
                        dateClick={this.handleDateClick}
                        eventClick={this.handleEventClick}
                        nowIndicator={true}
                        events={this.calendarEventRetrievalHandler}
                        windowResizeDelay={'1000'}
                    />
                </div>
            </div>
        )
    }
}
