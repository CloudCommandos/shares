import threading
import os
import IssConfig
import IssConstant
import json
from flask import Flask, request, send_file
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
from waitress import serve

from JsonMessageFactory import JsonMessageFactory
from ControllerWSApp import ControllerWSApp

ALLOWED_EXTENSIONS = set(['xlsx'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def obj_dict(obj):
    return obj.__dict__


class ControllerWS:

    def __init__(self, controllerDb):
        pass
        
    ws = Flask(__name__)
    ws.config['SECRET_KEY'] = "secret key"
    ws.config['UPLOAD_FOLDER'] = IssConfig.WS_FILE_UPLOAD_DIRECTORY
    ws.config['MAX_CONTENT_LENGTH'] = IssConstant.UPLOAD_MAX_FILE_SIZE
    ws.config['CORS_HEADERS'] = 'Content-Type'
    cors = CORS(ws)
    jmf = JsonMessageFactory()
    controllerWSApp = ControllerWSApp()    #App layer dedicated for WS
    socketio = SocketIO(ws, cors_allowed_origins="*", threads=10)

    # SOCKET.IO
    #@staticmethod
    #@socketio.on('client get update')
    #def handle_client_get_update(jsonObj, methods=['GET', 'POST']):
    #    print('received client get update: ' + str(jsonObj))
    #    ControllerWS.socketio.emit('update from server', json.dumps({'date': 'This is the data from server'}))

    @staticmethod
    def trigger_server_has_update(jsonObj):
        print('emitting server has update: ' + str(jsonObj))
        ControllerWS.socketio.emit('server has update', jsonObj)

    # HTTP API
    @staticmethod
    @ws.route('/login', methods=['POST'])
    @cross_origin()
    def login():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_LOGIN'])
        msg['username'] = content['username']
        msg['password'] = content['password']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_LOGIN']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/logout', methods=['POST'])
    @cross_origin()
    def logout():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_LOGOUT'])
        msg['session_key'] = content['session_key']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_LOGOUT']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/validate_session', methods=['POST'])
    @cross_origin()
    def validate_session():
        for x in request.headers:
            print(x)
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_VALIDATE_SESS'])
        msg['session_key'] = content['session_key']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_VALIDATE_SESS']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/change_password', methods=['POST'])
    @cross_origin()
    def change_password():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_CHANGE_PASSWORD'])
        msg['session_key'] = content['session_key']
        msg['old_password'] = content['old_password']
        msg['new_password'] = content['new_password']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_CHANGE_PASSWORD']:
            print(json.dumps(response))
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/reload_service', methods=['POST'])
    @cross_origin()
    def reload_service():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_RELOAD_SERVICE'])
        msg['session_key'] = content['session_key']
        msg['service_name'] = content['service_name']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_RELOAD_SERVICE']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/get_file_contents', methods=['POST'])
    @cross_origin()
    def get_file_contents():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_GET_FILE_CONTENTS'])
        msg['session_key'] = content['session_key']
        msg['file_name'] = content['file_name']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_GET_FILE_CONTENTS']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)\

    @staticmethod
    @ws.route('/update_file_contents', methods=['POST'])
    @cross_origin()
    def update_file_contents():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_UPDATE_FILE_CONTENTS'])
        msg['session_key'] = content['session_key']
        msg['file_name'] = content['file_name']
        msg['contents'] = content['contents']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_UPDATE_FILE_CONTENTS']:
            ControllerWS.trigger_server_has_update(json.dumps({'hasUpdate': msg['file_name']}))
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    # @staticmethod
    # @ws.route('/upload_acl_excel', methods=['POST'])
    # @cross_origin()
    # def upload_acl_excel():
    #     session_key = request.headers.get('Authorization')
    #
    #     # check if the post request has the file part
    #     if 'file' not in request.files:
    #         return 'No file part'
    #     fileToSave = request.files['file']
    #     if fileToSave.filename == '':
    #         return 'No file selected for uploading'
    #     if fileToSave and allowed_file(fileToSave.filename):
    #         filename = secure_filename(fileToSave.filename)
    #         filepath = os.path.join(ControllerWS.ws.config['UPLOAD_FOLDER'], filename)
    #         fileToSave.save(filepath)
    #
    #         msg = {}
    #         if (os.path.exists(filepath)):
    #             # Execute import
    #             doImportAcl(filepath)
    #             msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_UPDATE_USERS_BY_ACL'])
    #             msg['file_name'] = filename
    #             msg['session_key'] = session_key
    #             response = ControllerWS.controllerWSApp.handleWebRequest(msg)
    #
    #             if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_UPDATE_USERS_BY_ACL']:
    #                 ControllerWS.trigger_server_has_update(json.dumps({'hasUpdate': 'upload_acl'}))
    #                 msg = ControllerWS.getJsonMsg('success', response)
    #             else:
    #                 msg = ControllerWS.getJsonMsg('failure', response)
    #
    #         else:
    #             msg = ControllerWS.getJsonMsg('failure', {'status': 'Failed to save xlsx file'})
    #
    #         return msg
    #     else:
    #         # flash('Allowed file type is xlsx')
    #         return 'Allowed file types is xlsx'

    @staticmethod
    @ws.route('/get_uploaded_acl_files_info', methods=['POST'])
    @cross_origin()
    def get_uploaded_acl_files_info():
        content = request.get_json()
        # print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_GET_UPLOADED_ACL_FILES_INFO'])
        msg['session_key'] = content['session_key']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_GET_UPLOADED_ACL_FILES_INFO']:
            return ControllerWS.getJsonMsg('success', response)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    @ws.route('/download_acl_file', methods=['GET', 'POST'])
    @cross_origin()
    def download_acl_file():
        content = request.get_json()
        print(json.dumps(content))
        msg = ControllerWS.jmf.getMessage(ControllerWS.jmf.ID_MAP['REQ_WS_DOWNLOAD_ACL_FILE'])
        msg['session_key'] = content['session_key']
        msg['file_name'] = content['file_name']
        response = ControllerWS.controllerWSApp.handleWebRequest(msg)
        if response['id'] == ControllerWS.jmf.ID_MAP['RES_WS_DOWNLOAD_ACL_FILE']:
            directory = os.path.join(ControllerWS.ws.root_path, ControllerWS.ws.config['UPLOAD_FOLDER'])
            ControllerWS.trigger_server_has_update(json.dumps({'hasUpdate': 'download_acl'}))
            print(directory + '/' + content['file_name'])
            return send_file(directory + '/' + content['file_name'], as_attachment=True)
        elif response['id'] == ControllerWS.jmf.ID_MAP['RES_GENERAL']:
            return ControllerWS.getJsonMsg('failure', response)
        else:
            return ControllerWS.getJsonMsg('failure', response)

    @staticmethod
    def runWithWaitress(host, port):
        serve(ControllerWS.ws, host=host, port=port, threads=800)

    @staticmethod
    def run(port):
        thread1 = threading.Thread(target=ControllerWS.runWithWaitress, args=('0.0.0.0', port))
        thread1.start()

    @staticmethod
    def getJsonMsg(status, response_obj):
        if response_obj is None:
            response_obj = {}
        else:
            # Do not return to client the id of response
            del response_obj['id']

        return json.dumps({
            "status": status,
            "res": json.dumps(response_obj)
        })
