import datetime
import IssConstant
import IssConfig
import logging
import os
import subprocess
from ControllerWSDb import ControllerWSDb
from JsonMessageFactory import JsonMessageFactory

logger = logging.getLogger(IssConstant.LOGGER_NAME)


class ControllerWSApp:

    def __init__(self):
        self.jmf = JsonMessageFactory()
        self.db = ControllerWSDb()

    def handleWebRequest(self, incoming_msg):
        try:
            logger.info('handleWebReq: %s' % str(incoming_msg))
            if incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_LOGIN']:
                response = self.process_req_ws_login(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_LOGOUT']:
                response = self.process_req_ws_logout(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_VALIDATE_SESS']:
                response = self.process_req_ws_validate_session(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_CHANGE_PASSWORD']:
                response = self.process_req_ws_change_password(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_RELOAD_SERVICE']:
                response = self.process_req_ws_reload_service(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_GET_FILE_CONTENTS']:
                response = self.process_req_ws_get_file_contents(incoming_msg)
            elif incoming_msg['id'] == self.jmf.ID_MAP['REQ_WS_UPDATE_FILE_CONTENTS']:
                response = self.process_req_ws_update_file_contents(incoming_msg)
            else:
                logger.error('invalid msg')
                response = self.generate_ko_msg(IssConstant.ERROR_CODE_MSG_INVALID_ID)
        except KeyError:
            logger.error('missing parameters in msg:%s' % incoming_msg)
            response = self.generate_ko_msg(IssConstant.ERROR_CODE_MSG_MISSING_PARAM)
        except Exception as e:
            logger.error('general error:%s' % str(e))
            response = self.generate_ko_msg(IssConstant.ERROR_CODE_MSG_GENERAL_FAILURE)
        finally:
            logger.info('>>>>> handleWeb response:%s' % response)
            return response

    def generate_ko_msg(self, code):
        logger.error('ko msg:%d' % code)
        response = {'id': self.jmf.ID_MAP['RES_GENERAL'], 'error_code': code}
        return response

    def generate_ok_msg(self, status):
        logger.info('ok msg:%s' % status)
        response = {'id': self.jmf.ID_MAP['RES_GENERAL'], 'error_code': IssConstant.MSG_RES_GENERAL_NO_ERROR_CODE,
                    'status': status}
        return response

    def process_req_ws_login(self, incoming_msg):
        username = incoming_msg['username']
        password = incoming_msg['password']
        res, details = self.db.ws_user_login(username, password)

        if not res:
            if details == IssConstant.ERROR_CODE_WS_DB_LOGIN_USERLOCKED:
                return self.generate_ok_msg(IssConstant.NOTIF_WS_USER_LOCKED)
            elif details == IssConstant.ERROR_CODE_WS_DB_LOGIN_WRONG:
                return self.generate_ok_msg(IssConstant.NOTIF_WS_LOGIN_WRONG)
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_LOGIN'],
                    'session_key': details['session_key'],
                    'is_admin': details['is_admin'],
                    'username': details['username']}
        return response

    def process_req_ws_logout(self, incoming_msg):
        session_key = incoming_msg['session_key']
        res, details = self.db.ws_user_logout(session_key)

        if not res:
            return self.generate_ko_msg(details)

        if details == IssConstant.NOTIF_WS_USER_LOGOUT:
            response = {'id': self.jmf.ID_MAP['RES_WS_LOGOUT'],
                        'status': details}
            return response

        return self.generate_ok_msg(details)

    def process_req_ws_validate_session(self, incoming_msg):
        session_key = incoming_msg['session_key']
        res, details = self.db.ws_user_validate_session(session_key)

        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_VALIDATE_SESS'],
                    'is_admin': details['is_admin'],
                    'username': details['username']}
        return response

    def process_req_ws_change_password(self, incoming_msg):
        session_key = incoming_msg['session_key']
        old_password = incoming_msg['old_password']
        new_password = incoming_msg['new_password']
        res, details = self.db.ws_user_change_password(session_key, old_password, new_password)

        #print(res)
        if not res:
            if details == IssConstant.ERROR_CODE_WS_DB_CHANGE_PASSWORD_WRONG_PASS:
                print('why am i here1?')
                return self.generate_ok_msg(IssConstant.NOTIF_WS_USER_WRONG_PASS)
            print('why am i here2?')
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_CHANGE_PASSWORD']}
        return response

    def process_req_ws_update_users_by_acl(self, incoming_msg):
        session_key = incoming_msg['session_key']
        acl_file_name = incoming_msg['file_name']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_update_users_based_on_acl()
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_update_user_bookings_by_user_status(True,
                                                                      IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED,
                                                                      IssConstant.DB_ENUM_BOOKING_STATUS_INVALIDATED)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_update_user_bookings_by_user_status(False,
                                                                      IssConstant.DB_ENUM_BOOKING_STATUS_INVALIDATED,
                                                                      IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_populate_ws_users_based_on_acl()
        if not res:
            return self.generate_ko_msg(details)

        # update acl_history table
        res, details = self.db.ws_update_acl_history(acl_file_name, action='import', num_records=details['num_records'])
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_UPDATE_USERS_BY_ACL'],
                    'status': details}
        return response

    def process_req_ws_get_all_bookings(self, incoming_msg):
        start_date_time = incoming_msg['start_date_time']
        end_date_time = incoming_msg['end_date_time']
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_get_all_bookings(start_date_time, end_date_time)
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_ADMIN_GET_ALL_BOOKINGS'],
                    'status': details}
        return response

    def process_req_ws_user_get_bookings(self, incoming_msg):
        start_date_time = incoming_msg['start_date_time']
        end_date_time = incoming_msg['end_date_time']
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_user_get_bookings(details['employee_id'], start_date_time, end_date_time)
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_USER_GET_BOOKINGS'],
                    'status': details}
        return response

    def process_req_ws_admin_cancel_booking(self, incoming_msg):
        booking_id = incoming_msg['booking_id']
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_admin_cancel_booking(booking_id)
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_ADMIN_CANCEL_BOOKING'],
                    'status': details}
        return response

    def process_req_ws_user_cancel_booking(self, incoming_msg):
        booking_id = incoming_msg['booking_id']
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_user_cancel_booking(details['employee_id'], booking_id)
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_USER_CANCEL_BOOKING'],
                    'status': details}
        return response

    def process_req_ws_get_room_list(self, incoming_msg):
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_get_room_list()
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_GET_ROOM_LIST'],
                    'status': details}
        return response

    def process_req_ws_get_all_parameter_list(self, incoming_msg):
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_get_parameter_list(isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_GET_ALL_PARAMETER_LIST'],
                    'status': details}
        return response

    def process_req_ws_get_uploaded_acl_files_info(self, incoming_msg):
        session_key = incoming_msg['session_key']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        res, details = self.db.ws_get_uploaded_acl_list_info()
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_GET_UPLOADED_ACL_FILES_INFO'],
                    'status': details}
        return response

    def process_req_ws_download_acl_file(self, incoming_msg):
        session_key = incoming_msg['session_key']
        file_name = incoming_msg['file_name']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        # update acl_history table
        res, details = self.db.ws_update_acl_history(file_name, action='export')
        if not res:
            return self.generate_ko_msg(details)

        response = {'id': self.jmf.ID_MAP['RES_WS_DOWNLOAD_ACL_FILE'],
                    'status': details}
        return response

    def process_req_ws_reload_service(self, incoming_msg):
        session_key = incoming_msg['session_key']
        service_name = incoming_msg['service_name']

        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        # Determine script to run
        filename = ''
        if (service_name == 'reload_prometheus'):
            filename = 'reload_prometheus.sh';
        elif (service_name == 'reload_alertmanager'):
            filename = 'reload_alertmanager.sh';

        if (filename == ''):
            return self.generate_ko_msg('Wrong service_name')

        filepath = os.path.join(os.getcwd() + IssConfig.WS_SCRIPTS_DIR, filename)

        status = '';
        #print(filepath)
        if (os.path.exists(filepath)):
            # for linux
            status = subprocess.run([str(filepath)]).returncode

            # for windows
            #status = subprocess.call(['C:\\cygwin64\\bin\\bash.exe', '-l', str(filepath)])

        print('status is:', status)
        if status == 1:
            return self.generate_ko_msg(status)

        response = {'id': self.jmf.ID_MAP['RES_WS_RELOAD_SERVICE'],
                    'status': status}
        return response

    def process_req_ws_get_file_contents(self, incoming_msg):
        session_key = incoming_msg['session_key']
        file_name = incoming_msg['file_name']
        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        # Determine target filename
        filename = ''
        if (file_name == 'prometheus_endpoints'):
            filename = 'prometheus_endpoints.yml';
        elif (file_name == 'prometheus_rules'):
            filename = 'prometheus_rules.yml';
        elif (file_name == 'alertmanager_config'):
            filename = 'alertmanager_config.yml';

        if (filename == ''):
            return self.generate_ko_msg('Wrong file_name')

        filepath = os.path.join(os.getcwd() + IssConfig.WS_SCRIPTS_DIR, filename)

        status = '';
        # print(filepath)
        if (os.path.exists(filepath)):
            with open(filepath) as f:
                status = f.read()
                f.close()

        # print(status)
        if status == 1:
            return self.generate_ko_msg(status)

        response = {'id': self.jmf.ID_MAP['RES_WS_GET_FILE_CONTENTS'],
                    'status': status}
        return response

    def process_req_ws_update_file_contents(self, incoming_msg):
        session_key = incoming_msg['session_key']
        file_name = incoming_msg['file_name']
        contents = incoming_msg['contents']
        # Check session_key first
        res, details = self.db.get_ws_user_info_by_session(session_key, isAdmin=True)
        if not res:
            return self.generate_ko_msg(details)

        # Determine target filename
        filename = ''
        if (file_name == 'prometheus_endpoints'):
            filename = 'prometheus_endpoints.yml';
        elif (file_name == 'prometheus_rules'):
            filename = 'prometheus_rules.yml';
        elif (file_name == 'alertmanager_config'):
            filename = 'alertmanager_config.yml';

        if (filename == ''):
            return self.generate_ko_msg('Wrong file_name')

        filepath = os.path.join(os.getcwd() + IssConfig.WS_SCRIPTS_DIR, filename)

        status = '';
        # print(filepath)
        if (os.path.exists(filepath)):
            with open(filepath, 'w') as f:
                status = f.write(contents)
                f.close()

        # print(status)
        if status == 1:
            return self.generate_ko_msg(status)

        response = {'id': self.jmf.ID_MAP['RES_WS_UPDATE_FILE_CONTENTS'],
                    'status': status}
        return response
