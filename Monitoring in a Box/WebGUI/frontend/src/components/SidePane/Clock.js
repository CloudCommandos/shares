import React from 'react';

export default class Clock extends React.Component {
	constructor(props){
		super(props);
		this.state = {
		    time: new Date().toLocaleString('en-GB'),
		};
	}

    componentDidMount() {
        this.intervalID = setInterval(
            () => this.tick(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    tick() {
        this.setState({
            time: new Date().toLocaleString('en-GB')
        });
    }

	render(){
		return (
			<div id='clockdiv'>
                <p id='clock' style={{margin:'0px'}}>{this.state.time}</p>
			</div>
		)
	}


}