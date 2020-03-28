import React from 'react';
import $ from 'jquery';
import {ExcelRenderer} from 'react-excel-renderer';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import import_settings from './import_excel_settings.js';
import SETTINGS from '../../../settings';

export default class ImportAcl extends React.Component {
	constructor(props){
		super(props);
		this.fileInput = React.createRef();
		this.openFileBrowser = this.openFileBrowser.bind(this);
		this.clearSelection = this.clearSelection.bind(this);
		this.fileHandler = this.fileHandler.bind(this);
		this.checkFileContents = this.checkFileContents.bind(this);
		this.exportToCSV = this.exportToCSV.bind(this);
		this.uploadAclExcel = this.uploadAclExcel.bind(this);
		this.state = {
		    fileToUpload: null,
		    fileName:"",
		    feedbackFileData: null,
		    fileCheckPassed: false,
		    fileUploaded: false,
		};
	}

    openFileBrowser = () => {
        this.fileInput.current.click();
    }

    fileHandler = (event) => {
        let fileObj = event.target.files[0];
        //just pass the fileObj as parameter
        ExcelRenderer(fileObj, (err, resp) => {
            if(err){
                console.log(err);
            }else{
                this.setState({
                    cols: resp.cols,
                    rows: resp.rows,
                    fileToUpload: fileObj,
                    fileName: fileObj.name,
                    feedbackFileData: null,
                    fileCheckPassed: false,
                    fileUploaded: false,
                });
                //Clear Error Messages
                $('#fileCheckFeedbackMsg').html("");
                $('#fileCheckBtn').attr('disabled', false);
            }
        });
    }

    checkFileContents(){
        if (typeof(this.state.rows) !== "undefined"){
            var feedbackMsg = "";
            var req_fields = import_settings.required_fields;
            //Check required columns
            var checklist = [];
            for (let i = 0; i < req_fields.length; ++i){
                checklist[i] = 0;
            }
            for (let j = 0; j < this.state.rows[0].length; ++j){
                for (let i = 0; i < req_fields.length; ++i){
                    if (this.state.rows[0][j] === req_fields[i].columnName){
                        checklist[i] = 1;
                    }
                }
            }
            for (let i = 0; i < req_fields.length; ++i){
                if (checklist[i] === 0){
                    if (feedbackMsg === ''){
                        feedbackMsg += "'<b>" + req_fields[i].columnName + "</b>'";
                    }else{
                        feedbackMsg += ", '<b>" + req_fields[i].columnName + "</b>'";
                    }
                }
            }
            if (feedbackMsg !== ''){    //Terminate check
                $('#fileCheckFeedbackMsg').html("<span style='color: red; background-color: rgba(0,0,0,0.3); padding: 10px;'> Missing column(s):  " + feedbackMsg + "</span>");
                return;
            }

            //check if column 'check_status' exists, otherwise add in
            var has_feedback_column = false;
            for (let j = 0; j < this.state.rows[0].length; ++j){
                if (this.state.rows[0][j] === "check_status"){
                    has_feedback_column = true;
                    break;
                }
            }
            if (!has_feedback_column){
                //Add in 'check_status' column
                this.state.rows[0].push('check_status');
            }

            //check data
            var csvData = [];
            var errCount = 0;
            for (let i = 1; i < this.state.rows.length; ++i){
                var csvRow = {};
                var rowCheckFeedback = "";
                for (let j = 0; j < this.state.rows[0].length; ++j){
                    let valueToCheck = this.state.rows[i][j];
                    let columnHeader = this.state.rows[0][j];

                    if (columnHeader !== 'check_status'){  //Only insert into 'check_status after processing all other columns'
                        for (let k = 0; k < req_fields.length; ++k){
                            if (columnHeader === req_fields[k].columnName){
                                for (let c = 0; c < req_fields[k].checks.length; ++c){
                                    switch(req_fields[k].checks[c].type){
                                        case "is_integer":
                                            if (typeof(valueToCheck) !== "undefined"){
                                                let integer_sample_str = "" + parseInt(valueToCheck);
                                                if (valueToCheck + "" === integer_sample_str && integer_sample_str !== "NaN"){
                                                    //passed
                                                }else{
                                                    rowCheckFeedback += columnHeader + " must be an integer. ";
                                                }
                                            }
                                            break;
                                        case "is_numeric":
                                            if (typeof(valueToCheck) !== "undefined"){
                                                let reg = /^\d*$/;
                                                if (reg.test(valueToCheck)){
                                                    //passed test
                                                }else{
                                                    rowCheckFeedback += columnHeader + " must contain only numbers. ";
                                                }
                                            }
                                            break;
                                        case "is_alphabet":
                                            if (typeof(valueToCheck) !== "undefined"){
                                                if (typeof(req_fields[k].checks[c].allow_whitespace) !== "undefined"
                                                    && req_fields[k].checks[c].allow_whitespace){
                                                    let reg = /^[a-zA-Z ]*$/;
                                                    if (reg.test(valueToCheck)){
                                                        //passed test
                                                    }else{
                                                        rowCheckFeedback += columnHeader + " must contain only alphabets or whitespaces. ";
                                                    }
                                                }else{
                                                    let reg = /^[a-zA-Z]*$/;
                                                    if (reg.test(valueToCheck)){
                                                        //passed test
                                                    }else{
                                                        rowCheckFeedback += columnHeader + " must contain only alphabets. ";
                                                    }
                                                }
                                            }
                                            break;
                                        case "is_email":
                                            if (typeof(valueToCheck) !== "undefined"){
                                                //check if is valid email format
                                                let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                                if (reg.test(valueToCheck)){
                                                    //passed test

                                                    //check if part of whitelist
                                                    if (typeof(req_fields[k].checks[c].domain_whitelist) !== "undefined"){
                                                        if (req_fields[k].checks[c].domain_whitelist.length > 0){
                                                            let is_allowed = false;
                                                            for (let w = 0; w < req_fields[k].checks[c].domain_whitelist.length; ++w){
                                                                let emailparts = valueToCheck.split("@");
                                                                if (emailparts[1] === req_fields[k].checks[c].domain_whitelist[w]){
                                                                    is_allowed = true;
                                                                    break;
                                                                }
                                                            }
                                                            if (is_allowed){
                                                                //passed
                                                            }else{
                                                                rowCheckFeedback += columnHeader + " is not an accepted domain. ";
                                                            }
                                                        }
                                                    }

                                                    //check if part of blacklist
                                                    if (typeof(req_fields[k].checks[c].domain_blacklist) !== "undefined"){
                                                        if (req_fields[k].checks[c].domain_blacklist.length > 0){
                                                            let is_allowed = true;
                                                            for (let w = 0; w < req_fields[k].checks[c].domain_blacklist.length; ++w){
                                                                let emailparts = valueToCheck.split("@");
                                                                if (emailparts[1] === req_fields[k].checks[c].domain_blacklist[w]){
                                                                    is_allowed = false;
                                                                    break;
                                                                }
                                                            }
                                                            if (is_allowed){
                                                                //passed
                                                            }else{
                                                                rowCheckFeedback += columnHeader + " is not an accepted domain. ";
                                                            }
                                                        }
                                                    }
                                                }else{
                                                    rowCheckFeedback += columnHeader + " is not a valid email. ";
                                                }
                                            }
                                            break;
                                        case "length":
                                            if (typeof(valueToCheck) !== "undefined"){
                                                //convert to string first
                                                let tmpstr = "" + valueToCheck;
                                                let valueLength = tmpstr.length;
                                                //test min length
                                                if (typeof(req_fields[k].checks[c].min_length) !== "undefined"
                                                    && typeof(req_fields[k].checks[c].max_length) !== "undefined"){

                                                    //min_length < max_length
                                                    if (req_fields[k].checks[c].min_length < req_fields[k].checks[c].max_length){
                                                        if (valueLength >= req_fields[k].checks[c].min_length
                                                            && valueLength <= req_fields[k].checks[c].max_length){
                                                            //passed test
                                                        }else{
                                                            rowCheckFeedback += columnHeader + " must have a length of " + req_fields[k].checks[c].min_length + " to " + req_fields[k].checks[c].max_length + ". ";
                                                        }
                                                    }else
                                                    //min_length == max_length
                                                    if (req_fields[k].checks[c].min_length === req_fields[k].checks[c].max_length){
                                                        if (valueLength === req_fields[k].checks[c].min_length){
                                                            //passed test
                                                        }else{
                                                            rowCheckFeedback += columnHeader + " must have a length of " + req_fields[k].checks[c].min_length + ". ";
                                                        }
                                                    }else{
                                                        //test is not configured correctly!
                                                        if (SETTINGS.MODE === "DEVELOPMENT") console.log("length test is not configured correctly!");
                                                    }
                                                }else if(typeof(req_fields[k].checks[c].min_length) !== "undefined"){
                                                    if (valueLength >= req_fields[k].checks[c].min_length){
                                                       //passed test
                                                    }else{
                                                       rowCheckFeedback += columnHeader + " must have a length of at least " + req_fields[k].checks[c].min_length + ". ";
                                                    }
                                                }else if(typeof(req_fields[k].checks[c].min_length) !== "undefined"){
                                                    if (valueLength <= req_fields[k].checks[c].max_length){
                                                        //passed test
                                                    }else{
                                                        rowCheckFeedback += columnHeader + " must have a length of at most " + req_fields[k].checks[c].min_length + ". ";
                                                    }
                                                }else{
                                                    //test is not configured correctly!
                                                    if (SETTINGS.MODE === "DEVELOPMENT") console.log("length test is not configured correctly!");
                                                }
                                            }else{
                                                if (typeof(req_fields[k].checks[c].min_length) !== "undefined"
                                                    && req_fields[k].checks[c].min_length > 0){
                                                    rowCheckFeedback += columnHeader + " is required. ";
                                                }
                                            }
                                            break;
                                        default:
                                            break;
                                    }

                                    //add value into csvRow
                                    csvRow[columnHeader] = valueToCheck;
                                }
                            }else{
                                csvRow[columnHeader] = valueToCheck;
                            }
                        }
                    }
                }
                if (rowCheckFeedback !== ''){
                    ++errCount;
                }
                csvRow['check_status'] = (rowCheckFeedback === '' ? 'OK' : rowCheckFeedback);
                csvData.push(csvRow);
            }

            if (errCount > 0){
                $('#fileCheckFeedbackMsg').html("<span style='color: red; background-color: rgba(0,0,0,0.3); padding: 10px;'> <b>" + errCount + "</b> row(s) with error. Download the file check result for more information.</span>");
            }else{
                $('#fileCheckFeedbackMsg').html("<span style='color: #00ff00; background-color: rgba(0,0,0,0.3); padding: 10px;'> File check passed. You can proceed to upload the changes. </span>");
            }
            this.setState({
                feedbackFileData: csvData,
                fileCheckPassed: (errCount === 0 ? true : false),
                fileUploaded: false,
            });
            $('#fileCheckBtn').attr('disabled', true);
        }
    }

    exportToCSV = () => {
        if (this.state.feedbackFileData !== null){
            let fileName = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'short',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(Date.now());
            const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
            const fileExtension = '.xlsx';
            const ws = XLSX.utils.json_to_sheet(this.state.feedbackFileData);
            const wb = { Sheets: { 'Sheet1': ws }, SheetNames: ['Sheet1'] };
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], {type: fileType});
            FileSaver.saveAs(data, fileName + fileExtension);
        }
    }

    uploadAclExcel(){
        if (this.state.fileName !== '' && this.state.feedbackFileData !== null && this.state.fileCheckPassed && !this.state.fileUploaded){
            $('#uploadBtn').attr("disabled", true);
            $('#fileUploadFeedbackMsg').html("<span style='color: yellow; background-color: rgba(0,0,0,0.3); padding: 10px;'> Uploading... </span>");

            var fd = new FormData();
            fd.append('file', this.state.fileToUpload);

            let context = this;
            $.ajax({
                url: SETTINGS.BACKEND_WS_UPLOAD_ACL_URL,
                type: 'POST',
                beforeSend: function (jqXHR, settings) {
                    jqXHR.setRequestHeader('Authorization', window.localStorage['session_key']);
                },
                data: fd,
                cache: false,
                contentType: false,
                processData: false,
                dataType: 'json',
                success: function(response){
                    if (response.status === 'success'){
                        context.setState({
                            fileUploaded: true
                        })
                        $('#fileUploadFeedbackMsg').html("<span style='color: #00ff00; background-color: rgba(0,0,0,0.3); padding: 10px;'> Successfully uploaded </span>");
                    }else{
                        $('#fileUploadFeedbackMsg').html("<span style='color: red; background-color: rgba(0,0,0,0.3); padding: 10px;'> Upload failed! </span>");
                        $('#uploadBtn').attr("disabled", false);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("failed!");
                    $('#fileUploadFeedbackMsg').html("<span style='color: red; background-color: rgba(0,0,0,0.3); padding: 10px;'> Connection Error! </span>");
                    $('#uploadBtn').attr("disabled", false);
                }
            });
        }
    }

    clearSelection(){
        this.setState({
            fileToUpload: null,
            fileName: '',
            feedbackFileData: null,
            fileCheckPassed: false,
            fileUploaded: false,
        });
    }

    renderFileSelection(){
        if (this.state.fileName === ''){
            return(
                <div>
                    <button style={{color: "black"}} onClick={this.openFileBrowser}> Select file </button>
                    <input type="text" readOnly disabled style={{width:'200px'}} value=''></input>
                    <input id="hiddenFileInput" type="file" hidden onChange={this.fileHandler} ref={this.fileInput} onClick={(event)=> { event.target.value = null; this.fileInput.current.click();}} style={{"padding":"10px"}} />
                </div>
            )
        }else{
            return(
                <div>
                    <button style={{color: "black"}} onClick={this.openFileBrowser}> Select file </button>
                    <input type="text" readOnly disabled style={{width:'200px'}} value={this.state.fileName}></input>
                    <button style={{color: "red"}} onClick={this.clearSelection}> X </button>
                    <input id="hiddenFileInput" type="file" hidden onChange={this.fileHandler} ref={this.fileInput} onClick={(event)=> { event.target.value = null; this.fileInput.current.click();}} style={{"padding":"10px"}} />
                </div>
            )
        }
    }

    renderFileCheck(){
        if (this.state.fileName !== ''){
            return (
                <div>
                    <button id='fileCheckBtn' style={{color: "black"}} onClick={this.checkFileContents}> Check file </button>
                    <span id='fileCheckFeedbackMsg' style={{marginLeft: "10px"}}></span>
                </div>
            )
        }
    }

    renderFeedbackDownload(){
        if (this.state.fileName !== '' && this.state.feedbackFileData !== null){
            return (
                <div>
                    <button style={{color: "black"}} onClick={this.exportToCSV}> Download File Check Result </button>
                </div>
            )
        }
    }

    renderUpload(){
        if (this.state.fileName !== '' && this.state.feedbackFileData !== null && this.state.fileCheckPassed){
            return (
                <div>
                    <button className='GreenSubmitBtn' id='uploadBtn' onClick={this.uploadAclExcel}> Upload </button>
                    <span id='fileUploadFeedbackMsg' style={{marginLeft: "10px"}}></span>
                </div>
            )
        }
    }

    render(){
        return (
            <div className='MainContentWrapper'>
                <p className='MainContentTitle'>Import ACL</p>
                <div className='MainContentBody'>
                    {this.renderFileSelection()}
                    <br/>
                    {this.renderFileCheck()}
                    <br/>
                    {this.renderFeedbackDownload()}
                    <br/>
                    {this.renderUpload()}
                </div>
            </div>
        )
    }
}