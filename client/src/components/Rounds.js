//Rounds -- A parent component for the app's "rounds" mode.sidemenu-user
//Manages the rounds data for the current user and conditionally renders the
//appropriate rounds mode page based on App's mode, which is passed in as a
//prop.

import React from 'react';
import RoundsTable from './RoundsTable.js';
import RoundForm from './RoundForm.js';
import FloatingButton from './FloatingButton.js';
import AppMode from '../AppMode.js';

class Rounds extends React.Component {

    //Initialize a Rounds object based on local storage
    constructor(props) {
        super(props);
        this.state = {rounds: [],
                      deleteId: "",
                      editId: ""};          
    }

    //fetchRounds -- Pushes current user's rounds data into state
    fetchRounds = async () => {
        let url = "/rounds/" + this.props.user.id;
        let res = await fetch(url, {method: 'GET'});
        if (res.status != 200) {
            let msg = await res.text();
            alert("Sorry, there was an error obtaining rounds data for this user: " + msg);
            return;
        } 
        let body = await res.json();
        this.setState({rounds: body}, this.props.changeMode(AppMode.ROUNDS));
    }

    //When component is loaded, push data from database into state
    componentDidMount() {
       this.fetchRounds();
    }

    //setDeleteId -- Capture in this.state.deleteId the unique id of the item
    //the user is considering deleting.
    setDeleteId = (val) => {
        this.setState({deleteId: val});
    }

    //setEditId -- Capture in this.state.editId the unique id of the item
    //the user is considering editing.
    setEditId = (val) => {
        this.setState({editId: val});
    }

    //editRound -- Given an object newData containing updated data on an
    //existing round, update the current user's round uniquely identified by
    //this.state.editId, commit to local storage, reset editId to empty and
    //toggle the mode back to AppMode.ROUNDS since the user is done editing the
    //round. 
    editRound = async (newData) => {
        let url = '/rounds/' + this.props.user.id + '/' + this.state.rounds[this.state.editId]._id;
        let res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            method: 'PUT',
            body: JSON.stringify(newData)}); 
        let msg = await res.text();
        if (res.status != 200) {
            alert("An error occurred when attempting to update a round in the database: " + msg);
        } else {
            //Push update into component state:
            this.fetchRounds();
        }
    }


    //deleteRound -- Delete the current user's round uniquely identified by
    //this.state.deleteId, commit to local storage, and reset deleteId to empty.
    deleteRound = async () => {
        let url = '/rounds/' + this.props.user.id + '/' + this.state.rounds[this.state.deleteId]._id;
        let res = await fetch(url, {method: 'DELETE'});
        let msg = await res.text();
        if (res.status != 200) {
            alert("An error occurred when attempting to delete round from database: " + msg);
        } else {
            //Push update into component state:
            this.fetchRounds();
        }
    }

    //addRound -- Given an object newData containing a new round, add the round
    //to the current user's list of rounds, commit to local storage, and toggle
    //the mode back to AppMode.ROUNDS since the user is done adding a round.
    addRound = async (newData) => {
        const url = '/rounds/' + this.props.user.id;
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            method: 'POST',
            body: JSON.stringify(newData)}); 
        const msg = await res.text();
        if (res.status != 200) {
            alert("An error occurred when attempting to add new round to database: " + msg);
        } else {
            //Push update into component state:
            this.fetchRounds();
        }
    }

    //render -- Conditionally render the Rounds mode page as either the rounds
    //table, the rounds form set to obtain a new round, or the rounds form set
    //to edit an existing round.
    render() {
        switch(this.props.mode) {
            case AppMode.ROUNDS:
                return (
                  <React.Fragment>
                  <RoundsTable 
                    rounds={this.state.rounds}
                    setEditId={this.setEditId}
                    setDeleteId={this.setDeleteId}
                    deleteRound={this.deleteRound}
                    changeMode={this.props.changeMode}
                    menuOpen={this.props.menuOpen} /> 
                  <FloatingButton
                      handleClick={() => 
                        this.props.changeMode(AppMode.ROUNDS_LOGROUND)}
                      menuOpen={this.props.menuOpen}
                      icon={"fa fa-plus"} />
                  </React.Fragment>
                );
            case AppMode.ROUNDS_LOGROUND:
                return (
                    <RoundForm
                       mode={this.props.mode}
                       startData={""} 
                       saveRound={this.addRound} />
                );
            case AppMode.ROUNDS_EDITROUND:
                return (
                    <RoundForm
                      mode={this.props.mode}
                      startData={this.state.rounds[this.state.editId]} 
                      saveRound={this.editRound} />
                );
        }
    }
}    

    export default Rounds;