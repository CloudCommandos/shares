#!/usr/bin/env python

import IssConfig
import IssConstant
import datetime
import logging


# logging.basicConfig(level=logging.DEBUG)

import logging.handlers
from ControllerWS import ControllerWS


def main():
    ################## setup the logger ##################
    logger = logging.getLogger(IssConstant.LOGGER_NAME)
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s-[%(levelname)s]-%(filename)s:%(lineno)s:: %(message)s',
                                  datefmt='%Y%m%d-%H%M%S')
    # console logging
    streamHandler = logging.StreamHandler()
    streamHandler.setFormatter(formatter)
    logger.addHandler(streamHandler)

    # file logging
    fileHandler = logging.handlers.RotatingFileHandler('log.txt', maxBytes=10 * 1024 * 1024, backupCount=10)
    fileHandler.setFormatter(formatter)
    logger.addHandler(fileHandler)

    # Start Web Service
    ControllerWS.run(port=4000)

if __name__ == '__main__':
    main()
