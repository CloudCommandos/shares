import logging
import IssConstant

logger = logging.getLogger(IssConstant.LOGGER_NAME)

class JsonMessageFactory:

    def __init__(self):
        self.DEFAULT_INT_VALUE = -1
        self.DEFAULT_BOOL_VALUE = False
        self.DEFAULT_STR_VALUE = "NO_VALUE"

        self.ID_UNKNOWN = 'ID_UNKNOWN'

        self.ID_MAP = dict()

        # Web Service
        self.ID_MAP['REQ_WS_LOGIN'] = 'REQ_WS_LOGIN'
        self.ID_MAP['REQ_WS_LOGOUT'] = 'REQ_WS_LOGOUT'
        self.ID_MAP['REQ_WS_VALIDATE_SESS'] = 'REQ_WS_VALIDATE_SESS'
        self.ID_MAP['REQ_WS_CHANGE_PASSWORD'] = 'REQ_WS_CHANGE_PASSWORD'
        self.ID_MAP['REQ_WS_GET_FILE_CONTENTS'] = 'REQ_WS_GET_FILE_CONTENTS'
        self.ID_MAP['REQ_WS_UPDATE_FILE_CONTENTS'] = 'REQ_WS_UPDATE_FILE_CONTENTS'
        self.ID_MAP['REQ_WS_RELOAD_SERVICE'] = 'REQ_WS_RELOAD_SERVICE'

        self.ID_MAP['RES_WS_LOGIN'] = 'RES_WS_LOGIN'
        self.ID_MAP['RES_WS_LOGOUT'] = 'RES_WS_LOGOUT'
        self.ID_MAP['RES_WS_VALIDATE_SESS'] = 'RES_WS_VALIDATE_SESS'
        self.ID_MAP['RES_WS_CHANGE_PASSWORD'] = 'RES_WS_CHANGE_PASSWORD'
        self.ID_MAP['RES_WS_GET_FILE_CONTENTS'] = 'RES_WS_GET_FILE_CONTENTS'
        self.ID_MAP['RES_WS_UPDATE_FILE_CONTENTS'] = 'RES_WS_UPDATE_FILE_CONTENTS'
        self.ID_MAP['RES_WS_RELOAD_SERVICE'] = 'RES_WS_RELOAD_SERVICE'

    def getMessage(self, iden):
        msg = dict()
        msg['id'] = iden

        if iden not in self.ID_MAP:
            logger.error('Not supported message:{}'.format(iden))
            msg['id'] = self.ID_UNKNOWN

        return msg