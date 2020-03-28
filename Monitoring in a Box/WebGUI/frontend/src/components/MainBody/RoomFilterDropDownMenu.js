//From http://jsfiddle.net/n5u2wwjg/233886/
import React from 'react';
//import $ from 'jquery';


export default class RoomFilterDropDownMenu extends React.Component {
    constructor(props){
		super(props);
		this.recursive.bind(this);
		this.setWrapperRef = this.setWrapperRef.bind(this);
		this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)
            && (this.props.ignoreClickId && event.target.id !== this.props.ignoreClickId)
            && (this.props.ignoreClickId && event.target.parentNode.id !== this.props.ignoreClickId)) {
            if (typeof(this.props.showDropDown) !== 'undefined'){
                this.props.showDropDown(false);
            }
        }
    }

    getMenuItemTitle = (menuItem, index, depthLevel) => {
        return menuItem.title;
    };

    getMenuItem = (menuItem, depthLevel, index) => {
        let title = this.getMenuItemTitle(menuItem, index, depthLevel);

        if (menuItem.submenu && menuItem.submenu.length > 0) {
            return (
                <li key={title} className={this.props.getDropDownClass(title, true)}>
                    <input type="button"
                        className={this.props.getDropDownClass(title, false)}
                        key={title}
                        value={title}
                        onClick={this.props.handleDropDownClick}/>
                    {this.recursive(menuItem.submenu, true)}
                </li>
            );
        } else {
                //return <li key={title}>{title}</li>;
                return (
                    <li key={title} className={this.props.getDropDownClass(title, true)}>
                        <input type="button"
                            className={this.props.getDropDownClass(title, false)}
                            key={title}
                            value={title}
                            onClick={this.props.handleDropDownClick}/>
                    </li>
                );
        }
    };

    recursive(config, submenu){
        let options = [];
        config.map((item, index) => {
            options.push(this.getMenuItem(item, 0, index));
            return true;
        });
        if (submenu === true)
            return <ul>{options}</ul>;

        return <ul className={this.props.dropdown_classname}>{options}</ul>;
    }

    render(){
        return(
            <div ref={this.setWrapperRef}>
                {this.recursive(this.props.config, false)}
            </div>
        )
    };
}