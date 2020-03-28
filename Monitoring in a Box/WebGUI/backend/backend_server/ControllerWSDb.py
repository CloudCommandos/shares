import logging
import IssConstant
import IssConfig
import hashlib, binascii, os
from datetime import datetime
from InterfacePostgresDbPool import ReaderWriterDb
import json

logger = logging.getLogger(IssConstant.LOGGER_NAME)


class ControllerWSDb(ReaderWriterDb):
    DEFAULT_RESERVED_TYPES = (IssConstant.DB_ENUM_BOOKING_STATUS_REQUESTED,
                              IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED,
                              IssConstant.DB_ENUM_BOOKING_STATUS_LOCKED,
                              IssConstant.DB_ENUM_BOOKING_STATUS_INVALIDATED)

    def __init__(self,
                 db_user=IssConfig.DB_USER,
                 db_user_password=IssConfig.DB_USER_PASSWORD,
                 db_host=IssConfig.DB_HOST,
                 db_port=IssConfig.DB_PORT,
                 db_name=IssConfig.DB_NAME,
                 ):

        super(ControllerWSDb, self).__init__(db_user=db_user,
                                           db_user_password=db_user_password,
                                           db_host=db_host,
                                           db_port=db_port,
                                           db_name=db_name,
                                           logger=logger
                                           )

    def get_bookings_within_lock(self, lock_start, lock_end, room_name):
        sql = '''
            select phone_number,user_name,
                reservation_id,timestamp_start,timestamp_end 
            from glance 
            where room_name=%s 
                and reservation_status_type=%s 
                and (
                        (timestamp_start between %s and %s)
                        or (timestamp_end between %s and %s)                    
                        or (%s between timestamp_start and timestamp_end)
                        or (%s between timestamp_start and timestamp_end)
                    )
        '''
        para = (room_name, IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED,
                lock_start, lock_end, lock_start, lock_end, lock_start, lock_end)
        res, details, res_count = self.execute(sql, para)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_BOOKING_GET_LOCK_CONFLICTED
        return res, details

    def get_booking(self, booking_id):
        pgsql = '''
            select user_name, room_id, room_name, timestamp_start, timestamp_end, reservation_status_type 
                from glance where reservation_id=%s
                '''
        para = (booking_id,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error(details)
        return res, details

    def do_lock(self, chat_id, user_id,
                action_datetime, book_start_datetime, book_end_datetime,
                room_name, usage, employee_id=''):
        sql = ''
        para = ()
        if employee_id == '':   # Through Telegram
            sql = '''
                insert into reservations (employee_id, room_id, 
                                            action_ts, timestamp_start, timestamp_end,
                                            reservation_status, usage) 
                values (
                            (select employee_id from 
                                acl_registration inner join users 
                                on (
                                    acl_registration.phone_number = users.phone_number
                                    and users.user_id = %s
                                )
                            ),
                    (select room_id from rooms where room_name=%s),
                    %s, %s, %s,
                    (select reservation_status_id from enum_reservation_status where reservation_status_type=%s), %s)
                '''
            para = (user_id, room_name,
                    action_datetime, book_start_datetime, book_end_datetime,
                    IssConstant.DB_ENUM_BOOKING_STATUS_LOCKED, usage)

        else:   # Through Web Platform
            sql = '''
                insert into reservations (employee_id, room_id, 
                                            action_ts, timestamp_start, timestamp_end,
                                            reservation_status, usage) 
                values (%s, (select room_id from rooms where room_name=%s),
                    %s, %s, %s,
                    (select reservation_status_id from enum_reservation_status where reservation_status_type=%s), %s)
                '''
            para = (employee_id, room_name,
                    action_datetime, book_start_datetime, book_end_datetime,
                    IssConstant.DB_ENUM_BOOKING_STATUS_LOCKED, usage)

        res, details, res_count = self.execute(sql, para)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_DO_LOCK
        return res, details

    def do_booking(self, user_id, room_name,
                   start_datetime, end_datetime, action_datetime,
                   usage, employee_id=''):
        sql = ''
        para = ()
        if employee_id == '':  # Through Telegram
            pgsql = '''
                insert into reservations 
                    (employee_id, room_id, 
                    timestamp_start, timestamp_end, action_ts, 
                    reservation_status, usage) 
                values (
                    (select employee_id from users where user_id = %s),
                    (select room_id from rooms where room_name ilike %s), 
                    %s, %s, %s, 
                    (select reservation_status_id from enum_reservation_status where reservation_status_type=%s), %s
                    )
                returning reservation_id;
                '''
            para = (user_id, room_name, start_datetime, end_datetime, action_datetime,
                    IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED, usage)
        else:   # Through Web Platform
            pgsql = '''
                insert into reservations 
                    (employee_id, room_id, 
                    timestamp_start, timestamp_end, action_ts, 
                    reservation_status, usage) 
                values (%s, (select room_id from rooms where room_name ilike %s), 
                    %s, %s, %s, 
                    (select reservation_status_id from enum_reservation_status where reservation_status_type=%s), %s
                    )
                returning reservation_id;
                '''
            para = (employee_id, room_name, start_datetime, end_datetime, action_datetime,
                    IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED, usage)

        res, details, res_count = self.execute(pgsql, para)
        if not res:
            if IssConstant.DB_NOTIF_CONSTRAINT_BOOKING_OVERLAP in details:
                return False, IssConstant.INFO_CODE_DB_BOOKING_OVERLAP
            else:
                logger.error('%s:' % details)
                return False, IssConstant.ERROR_CODE_DB_BOOKING_INSERT

        last_reservation_id = details[0][0]

        pgsql = '''
            select reservation_id, phone_number, user_name
            from glance
            where reservation_id=%s
            '''
        para = (last_reservation_id,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return False, IssConstant.ERROR_CODE_DB_BOOKING_GET_USER_BOOKING

        return res, details[0]

    def is_user_pending_registration(self, chat_id):
        pgsql = '''select exists (select * from users_pending_registration where chat_id=%s)'''
        para = (chat_id,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_IS_UNREGISTERED
        return res, details[0][0]

    def save_unregistered(self, user_phone_number, chat_id):
        pgsql = '''
            insert into users_pending_registration (phone_number, chat_id) 
            values (%s, %s)
                on conflict (chat_id) 
                do update set 
                        phone_number=%s
                    '''
        para = (user_phone_number, chat_id, user_phone_number)
        res, exec_save_unregistered, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s' % exec_save_unregistered)
            return res, IssConstant.ERROR_CODE_DB_USER_SAVE_UNREGISTERED

        logger.info('save unregistered OK: phone_number:{} chat_id:{}'.format(user_phone_number, chat_id))
        return res, exec_save_unregistered

    def do_register(self, user_phone_number, user_id, user_name, chat_id):

        res, is_admin_registration = self.is_admin_registration(user_phone_number)
        if not res:
            return res, is_admin_registration

        if is_admin_registration is None:
            logger.info('phone %s not in acl' % user_phone_number)
            self.save_unregistered(user_phone_number, chat_id)
            return False, IssConstant.ERROR_CODE_RULE_NOT_IN_ACL

        if is_admin_registration:
            role_type = IssConstant.DB_ENUM_USER_ROLE_ADMIN
            user_quota = IssConfig.BOOKING_DEFAULT_ADMIN_QUOTA
        else:
            role_type = IssConstant.DB_ENUM_USER_ROLE_USER
            user_quota = IssConfig.BOOKING_DEFAULT_USER_QUOTA

        if is_admin_registration:
            # not critical. remove all previous admins. current design caters to only one admin
            pgsql = '''delete from users 
                        where user_role = (select user_role_id from enum_user_role where user_role_type=%s)
                        and user_id != %s
                    '''
            para = (role_type, user_id,)
            res, exec_delete_user, res_count = self.execute(pgsql, para)
            if res:
                if res_count > 0:
                    logger.warn('Removed previous admin (count:%d)' % res_count)
                else:
                    logger.info('First admin created')

        # Get employee_id from acl_registration
        pgsql = '''
                select employee_id
                from acl_registration
                where phone_number=%s
                limit 1
        '''
        para = (user_phone_number,)
        res, get_employee_id, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s' % get_employee_id)
            return res, IssConstant.ERROR_CODE_DB_GET_EMPLOYEE_ID_BY_PHONE_NUMBER

        if res_count == 0:
            logger.error('Cannot find employee_id from phone_number!')
            return res, IssConstant.ERROR_CODE_DB_GET_EMPLOYEE_ID_BY_PHONE_NUMBER

        employee_id = get_employee_id[0][0]

        pgsql = '''
            insert into users (user_name, phone_number, employee_id, user_id, user_role, chat_id, user_quota) 
            values (%s, %s, %s, %s, (select user_role_id from enum_user_role where user_role_type=%s), %s, %s) 
                on conflict (user_id) 
                do update set user_name=%s,
                        phone_number=%s,
                        user_role=(select user_role_id from enum_user_role where user_role_type=%s),
                        chat_id=%s ,
                        user_quota=%s,
                        is_blacklisted=false
                    '''
        para = (user_name, user_phone_number, employee_id, user_id, role_type, chat_id, user_quota,
                user_name, user_phone_number, role_type, chat_id, user_quota)
        res, exec_insert_user, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s' % exec_insert_user)
            return res, IssConstant.ERROR_CODE_DB_USER_CREATE

        logger.info('%s registration OK' % role_type)
        return res, exec_insert_user

    def is_blacklisted(self, user_id):  # TBC: combine with is_valid_user_id with json returns
        pgsql = '''select exists (select * from view_users where user_id=%s and is_blacklisted=%s)'''
        para = (user_id, True)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_IS_BLACKLISTED
        return res, details[0][0]

    def open_ticket(self, user_id, desc):
        pgsql = '''insert into tickets (user_id, ticket_status_id, description) 
            values(%s, (select ticket_status_id from enum_ticket_status where ticket_status_type=%s), %s) 
            returning ticket_id'''
        para = (user_id, IssConstant.DB_ENUM_TICKET_STATUS_OPENED, desc)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_TICKET_OPEN

        return res, details[0][0]

    def is_valid_chat_id(self, chat_id):

        pgsql = '''select exists (select * from view_users where chat_id=%s)'''
        para = (chat_id,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_IS_VALID_CHAT_ID

        return res, details[0][0]

    def is_valid_user_id(self, user_id, chat_id=None,
                         user_role_type=(IssConstant.DB_ENUM_USER_ROLE_USER, IssConstant.DB_ENUM_USER_ROLE_ADMIN)):

        pgsql = '''select exists (select * from view_users where user_id=%s and user_role_type in %s)'''
        para = (user_id, user_role_type)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_MISSING_USER_ID

        logger.info('is_valid_user_id:%d :::%s:::%s' % (user_id, res, str(details)))
        details = details[0][0]

        if chat_id is not None:
            # not critical. returns not captured for this subsection, only error flagging
            logger.info('updating chat_id and last_update for user_id:%d' % user_id)
            pgsql = '''
                update users set chat_id=%s, last_update_ts=CURRENT_TIMESTAMP 
                where user_id=%s and chat_id!=%s
                '''
            para = (chat_id, user_id, chat_id)
            res1, details1, res_count = self.execute(pgsql, para)
            if not res1:
                logger.error('failed to update chat_id for user')
            else:
                logger.info('updated chat_id for user_id:%d' % user_id)

        return res, details

    def is_admin_registration(self, phone_number):

        pgsql = '''select is_admin from acl_registration where phone_number=%s'''
        para = (phone_number,)

        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ACL_IS_ADMIN_CHECK

        if res_count == 0:  # return None if phone_number not found in acl
            details = None
        else:  # db has unique constraint for phone_number
            details = details[0][0]

        return res, details

    def get_reminders(self, start_dt, end_dt):

        pgsql = '''
            select chat_id, room_name, 
                timestamp_start, timestamp_end, 
                reservation_id, reservation_status_type, usage
            from glance 
            where timestamp_start between %s and %s
                and reservation_status_type <> %s
            order by user_id asc,
                timestamp_start asc
            '''
        para = (start_dt, end_dt, IssConstant.DB_ENUM_BOOKING_STATUS_CANCELLED)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ROOM_GET_INFO_REMINDER

        return res, details

    def get_all_room_info(self):
        pgsql = '''
        select room_id,room_name from rooms
        '''
        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ROOM_GET_INFO

        return res, details

    def get_all_room_id(self, capacity=0, location=''):
        pgsql = 'select room_id from rooms where room_capacity=%s and room_location=%s'
        para = (capacity, location)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ROOM_GET_ID

        return res, details

    def get_all_chat_id(self):
        pgsql = '''
        select chat_id from users
        '''
        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_GET_ALL_CHAT_ID

        return res, details

    def get_all_room_name(self):
        pgsql = ''' select room_name from rooms order by room_name asc '''
        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ROOM_GET_NAME

        return res, details

    def get_all_room_capacity(self):
        pgsql = ''' select room_capacity from rooms order by room_name asc '''
        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_ROOM_GET_CAPACITY

        return res, details

    def get_admin_chat_id(self):
        pgsql = '''
            select chat_id from users 
            where user_role=(select user_role_id from enum_user_role 
                            where user_role_type=%s)
            '''
        para = (IssConstant.DB_ENUM_USER_ROLE_ADMIN,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_GET_ADMIN_CHAT_ID

        if res_count == 0:
            logger.error('no admin registered')
            res = False
        # elif len(details) > 1: #commented away to handle more than 1 admin
        #     logger.error('more than 1 admin chat_id. expected only 1')
        #     res = False
        else:  # len 1
            details = [i[0] for i in details]
            # details = details[0][0]

        return res, details

    def is_booking_within_lock(self, room_id, book_start, book_end):
        pgsql = '''
            select exists (select * 
                from glance 
                where reservation_status_type=%s
                and room_id=%s 
                and (
                        (%s between timestamp_start and timestamp_end) 
                    or (%s between timestamp_start and timestamp_end)
                    or ((timestamp_start between %s and %s) and (timestamp_end between %s and %s))
                )
            ) 
            '''
        para = (
            IssConstant.DB_ENUM_BOOKING_STATUS_LOCKED, room_id, book_start, book_end, book_start, book_end, book_start,
            book_end)

        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, details

        return res, details[0][0]

    def get_reserved_datetimes(self, start_datetime, end_datetime, reserved_types=DEFAULT_RESERVED_TYPES, capacity=0,
                               location=''):
        pgsql = '''
            select room_id, timestamp_start, timestamp_end
            from glance 
            where room_capacity=%s
            and
            room_location=%s
            and
            ( reservation_status_type in %s )
            and
            (
                 (%s between timestamp_start and timestamp_end)
              or (%s between timestamp_start and timestamp_end)
              or (timestamp_start between %s and %s)
              or (timestamp_end between %s and %s)
            )
            order by room_id asc, timestamp_start asc
        '''
        para = (capacity, location, reserved_types, start_datetime, end_datetime,
                start_datetime, end_datetime, start_datetime, end_datetime,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_BOOKING_GET_ALL_DATETIME

        return res, details

    def update_user_booking(self, booking_id, booking_status):
        pgsql = ''' 
            update reservations set reservation_status = 
                (select reservation_status_id from enum_reservation_status where reservation_status_type=%s)
            where reservation_id=%s
            '''

        para = (booking_status, booking_id,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_BOOKING_UPDATE_STATUS
        return res, details

    def is_user_quota_exceeded(self, user_id):
        pgsql = """
               select exists (
                   select * from users 
                   where user_id=%s
                    and user_quota <=
                        (select count(*) from glance
                        where employee_id=(select employee_id from users where user_id=%s limit 1)
                         and reservation_status_type=%s
                         and timestamp_start > now()
                        ) 
                ) 
            """
        para = (user_id, user_id, IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_USER_GET_QUOTA

        return res, details[0][0]

    def get_user_bookings(self, user_id, start_datetime, end_datetime, reserved_types=DEFAULT_RESERVED_TYPES):
        pgsql = '''
            select room_name,
                timestamp_start as start_time,
                timestamp_end as end_time,
                reservation_id as booking_id,
                reservation_status_type as reservation_status,
                usage
            from glance
            where
                employee_id=(select employee_id from users where user_id=%s limit 1)
                and ((timestamp_start between %s and %s) or (timestamp_end between %s and %s))
                and (reservation_status_type in %s)
            order by start_time asc;
        '''

        para = (user_id,
                start_datetime, end_datetime, start_datetime, end_datetime,
                reserved_types)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_DB_BOOKING_GET_USER_LISTING
        return res, details

    """ 
    Web Service -----------------------------------------------------------------------------------------------------
    -----------------------------------------------------------------------------------------------------------------
    -----------------------------------------------------------------------------------------------------------------
    """

    def ws_user_login(self, username, password):
        pgsql = '''
            select password_hash,
                is_locked,
                is_admin
            from ws_users
            where
                username=%s
            limit 1;
        '''

        para = (username,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_LOGIN_VERIFY

        if res_count == 0:
            return False, IssConstant.ERROR_CODE_WS_DB_LOGIN_WRONG

        match = False
        isAdmin = False
        for password_hash, is_locked, is_admin in details:
            if is_locked:
                return False, IssConstant.ERROR_CODE_WS_DB_LOGIN_USERLOCKED
            else:
                match = self.verify_password(password_hash, password)
                isAdmin = is_admin
        if match:
            # Renew session key
            newkey = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
            pgsql = '''
                update ws_users
                set session_key=%s,
                    last_login_success_ts=now(),
                    last_login_attempt_ts=now(),
                    last_validation_ts=now(),
                    consec_login_failure=0
                where
                    username=%s
            '''
            para = (newkey, username)
            res, details, res_count = self.execute(pgsql, para)
            if not res:
                logger.error('%s:' % details)
                return res, IssConstant.ERROR_CODE_WS_DB_LOGIN_NEWKEY

            msg = {"session_key": newkey, "is_admin": isAdmin, "username": username}
            return res, msg

        else:
            # Increment consec_login_failure, lock account if hit threshold
            pgsql = '''
                update ws_users
                set last_login_attempt_ts=now(),
                    consec_login_failure=consec_login_failure + 1,
                    is_locked=
                        case
                            when consec_login_failure + 1 > %s
                                then true
                            else
                                false
                        end
                where
                    username=%s
            '''
            para = (IssConstant.LOGIN_CONSEC_FAILURE_MAX, username)
            res, details, res_count = self.execute(pgsql, para)
            if not res:
                logger.error('%s:' % details)
                return res, IssConstant.ERROR_CODE_WS_DB_LOGIN_FAILURE_UPDATE

            return False, IssConstant.ERROR_CODE_WS_DB_LOGIN_WRONG

    @staticmethod
    def hash_password(password):
        """Hash a password for storing."""
        salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
        pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
        pwdhash = binascii.hexlify(pwdhash)
        return (salt + pwdhash).decode('ascii')

    @staticmethod
    def verify_password(stored_password, provided_password):
        """Verify a stored password against one provided by user"""
        salt = stored_password[:64]
        stored_password = stored_password[64:]
        pwdhash = hashlib.pbkdf2_hmac('sha512',
                                      provided_password.encode('utf-8'),
                                      salt.encode('ascii'),
                                      100000)
        pwdhash = binascii.hexlify(pwdhash).decode('ascii')
        return pwdhash == stored_password

    def ws_user_logout(self, session_key):
        pgsql = '''
            update ws_users
            set session_key=''
            where
                session_key=%s
        '''

        para = (session_key,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_LOGOUT

        if res_count > 0:
            return True, IssConstant.NOTIF_WS_USER_LOGOUT
        else:
            return False, IssConstant.ERROR_CODE_WS_DB_LOGOUT_SESSUNKNOWN

    def ws_user_validate_session(self, session_key):
        pgsql = '''
            select username, is_admin
            from ws_users
            where
                session_key=%s
                and last_validation_ts > now()::date - interval '3 hours'
        '''

        para = (session_key,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GETSESS

        if res_count == 0:
            return False, IssConstant.ERROR_CODE_WS_DB_VALIDATE_SESSUNKNOWN


        isAdmin = False
        user_name = ''
        for username, is_admin in details:
            isAdmin = is_admin
            user_name = username
        msg = {'username': user_name, 'is_admin': isAdmin}

        pgsql = '''
                    update ws_users
                    set last_validation_ts = now()
                    where
                        session_key=%s
                '''

        para = (session_key,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_UPDATE_VALIDATION_TS

        return True, msg


    def get_ws_user_info_by_session(self, session_key, isAdmin=False):
        pgsql = ''

        if isAdmin:
            pgsql = '''
                select username, employee_id, employee_name, phone_number, is_admin, is_locked
                from ws_users
                where session_key=%s and is_locked <> true and is_admin = true
                    and last_validation_ts > now()::date - interval '3 hours'
                limit 1
            '''
        else:
            pgsql = '''
                select username, employee_id, employee_name, phone_number, is_admin, is_locked
                from ws_users
                where session_key=%s and is_locked <> true
                    and last_validation_ts > now()::date - interval '3 hours'
                limit 1
            '''

        para = (session_key,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GET_WS_USER_INFO_BY_SESS1

        if res_count > 0:
            isAdmin = False
            isLocked = False
            userName = ''
            employeeId = ''
            employeeName = ''
            phoneNumber = 0
            for username, employee_id, employee_name, phone_number, is_admin, is_locked in details:
                userName = username
                employeeId = employee_id
                employeeName = employee_name
                phoneNumber = phone_number
                isAdmin = is_admin
                isLocked = is_locked
            msg = {
                'username': userName,
                'employee_id': employeeId,
                'employee_name': employeeName,
                'phone_number': phoneNumber,
                'is_admin': isAdmin,
                'is_locked': isLocked
            }
            return True, msg
        else:
            return False, IssConstant.ERROR_CODE_WS_DB_GET_WS_USER_INFO_BY_SESS2

    def ws_user_change_password(self, session_key, old_password, new_password):
        pgsql = '''
            select password_hash
            from ws_users
            where
                session_key=%s
                and last_validation_ts > now()::date - interval '3 hours'
            limit 1
        '''

        para = (session_key,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_CHANGE_PASSWORD_GETHASH

        old_hash = ''
        if res_count > 0:
            old_hash = details[0][0]

        match = self.verify_password(old_hash, old_password)

        if match:
            new_hash = self.hash_password(new_password)
            pgsql = '''
                update ws_users
                set password_hash=%s
                where
                    session_key=%s
            '''
            para = (new_hash, session_key)
            res, details, res_count = self.execute(pgsql, para)
            if not res:
                logger.error('%s:' % details)
                return res, IssConstant.ERROR_CODE_WS_DB_CHANGE_PASSWORD_UPDATE_HASH

            if res_count > 0:
                return True, {}

            return False, IssConstant.ERROR_CODE_WS_DB_CHANGE_PASSWORD_UPDATE_HASH
        else:
            return False, IssConstant.ERROR_CODE_WS_DB_CHANGE_PASSWORD_WRONG_PASS

    def ws_update_users_based_on_acl(self):
        pgsql = '''
            update users
            set is_blacklisted=true
            where not exists (
                select 1
                from acl_registration
                where acl_registration.phone_number=users.phone_number
                    and acl_registration.employee_id=users.employee_id
            )
            and users.user_role <> (select user_role_id from enum_user_role where user_role_type=%s)
        '''
        para = (IssConstant.DB_ENUM_USER_ROLE_ADMIN,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_BLACKLIST_USERS_BY_ACL

        pgsql = '''
            update ws_users
            set is_blacklisted=true
            where not exists (
                select 1
                from acl_registration
                where acl_registration.phone_number=ws_users.phone_number
                    and acl_registration.employee_id=ws_users.employee_id
            )
        '''
        para = (IssConstant.DB_ENUM_USER_ROLE_ADMIN,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_BLACKLIST_WS_USERS_BY_ACL

        return res, details

    def ws_update_user_bookings_by_user_status(self, is_blacklisted, from_reservation_status_type,
                                               to_reservation_status_type):
        # from_reservation_status_type = IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED
        # to_reservation_status_type = IssConstant.DB_ENUM_BOOKING_STATUS_INVALIDATED
        pgsql = '''
            update reservations 
            set reservation_status=(select reservation_status_id from enum_reservation_status where reservation_status_type=%s)
            where (
                employee_id in (
                    select employee_id
                    from users
                    where is_blacklisted=%s
                )
                or
                employee_id in (
                    select employee_id
                    from ws_users
                    where is_blacklisted=%s
                )
            )
            and reservation_status=(select reservation_status_id from enum_reservation_status where reservation_status_type=%s)
            and timestamp_end > now()
            '''
        para = (to_reservation_status_type, is_blacklisted, is_blacklisted, from_reservation_status_type)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_UPDATE_BOOKINGS_BY_USER_STATUS
        return res, details

    def ws_populate_ws_users_based_on_acl(self):
        # from_reservation_status_type = IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED
        # to_reservation_status_type = IssConstant.DB_ENUM_BOOKING_STATUS_INVALIDATED
        pgsql = '''
                        select employee_id, employee_name, phone_number, is_admin
                        from acl_registration
                '''
        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error(details)
            details = IssConstant.ERROR_CODE_DB_GET_ACL_WITHOUT_WS_USER

        num_records = res_count
        if res_count > 0:
            for employee_id, employee_name, phone_number, is_admin in details:
                new_password = employee_id + phone_number
                password_hash = self.hash_password(new_password)
                pgsql = '''
                        insert into ws_users 
                        (   
                            username,
                            employee_id,
                            employee_name, 
                            phone_number,
                            password_hash,
                            last_login_success_ts,
                            last_login_attempt_ts,
                            last_validation_ts,
                            consec_login_failure,
                            session_key,
                            is_admin,
                            is_locked,
                            is_blacklisted
                        )
                        values(
                            %s,
                            %s, 
                            %s,
                            %s,
                            %s,
                            '2019-01-01 00:00:00.00-00',
                            '2019-01-01 00:00:00.00-00',
                            '2019-01-01 00:00:00.00-00',
                            0,
                            '',
                            %s,
                            false,
                            false
                        )
                        on conflict (employee_id) 
                        do update set
                            employee_name = %s, 
                            phone_number = %s
                '''
                para = (employee_id, employee_id, employee_name, phone_number, password_hash, is_admin,
                        employee_name, phone_number)
                res2, details2, res_count = self.execute(pgsql, para)

                if not res2:
                    logger.error(details2)
                    details2 = IssConstant.ERROR_CODE_DB_INSERT_WS_USER_BY_ACL
                    return res2, details2

        msg = {'num_records': num_records}
        return res, msg

    def ws_get_all_bookings(self, start_datetime, end_datetime):
        pgsql = '''
            select employee_name,
                room_name,
                room_location,
                room_capacity,
                timestamp_start as start_time,
                timestamp_end as end_time,
                reservation_id as booking_id,
                reservation_status_type as reservation_status,
                usage
            from glance
            where
                ((timestamp_start between %s and %s) or (timestamp_end between %s and %s))
            order by start_time asc;
        '''

        para = (start_datetime, end_datetime, start_datetime, end_datetime)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GET_ALL_BOOKINGS

        data = []
        for employee_name, room_name, room_location, room_capacity, start_time, end_time, booking_id, reservation_status, usage in details:
            data.append({
                'employee_name': employee_name,
                'room_name': room_name,
                'room_location': room_location,
                'room_capacity': room_capacity,
                'start_time': start_time.strftime("%Y-%m-%dT%H:%M:%S"),
                'end_time': end_time.strftime("%Y-%m-%dT%H:%M:%S"),
                'booking_id': booking_id,
                'reservation_status': reservation_status,
                'usage': usage,
            })
        return res, data

    def ws_get_parameter_list(self, isAdmin=False):
        pgsql = '''
            select param_name,
                param_type,
                param_value,
                param_display_name,
                param_description,
                last_update_ts
            from parameters
            where
                %s = true or is_restricted <> true
            order by param_name asc;
        '''

        para = (isAdmin,)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GET_ALL_BOOKINGS

        data = []
        for param_name, param_type, param_value, param_display_name, param_description, last_update_ts in details:
            data.append({
                'param_name': param_name,
                'param_type': param_type,
                'param_value': param_value,
                'param_display_name': param_display_name,
                'param_description': param_description,
                'last_update_ts': str(last_update_ts),
            })
        return res, data

    def ws_user_get_bookings(self, employee_id, start_datetime, end_datetime):
        pgsql = '''
            select employee_name,
                room_name,
                room_location,
                room_capacity,
                timestamp_start as start_time,
                timestamp_end as end_time,
                reservation_id as booking_id,
                reservation_status_type as reservation_status,
                usage
            from glance
            where
                ((timestamp_start between %s and %s) or (timestamp_end between %s and %s))
                and employee_id = %s
            order by start_time asc;
        '''

        para = (start_datetime, end_datetime, start_datetime, end_datetime, employee_id)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_USER_GET_BOOKINGS

        data = []
        for employee_name, room_name, room_location, room_capacity, start_time, end_time, booking_id, reservation_status, usage in details:
            data.append({
                'employee_name': employee_name,
                'room_name': room_name,
                'room_location': room_location,
                'room_capacity': room_capacity,
                'start_time': start_time.strftime("%Y-%m-%dT%H:%M:%S"),
                'end_time': end_time.strftime("%Y-%m-%dT%H:%M:%S"),
                'booking_id': booking_id,
                'reservation_status': reservation_status,
                'usage': usage,
            })
        return res, data

    def ws_get_room_list(self):
        pgsql = '''
            select room_name,
                room_capacity,
                room_location
            from rooms
        '''

        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GET_ROOMS

        data = []
        for room_name, room_capacity, room_location in details:
            data.append({
                'room_name': room_name,
                'room_capacity': room_capacity,
                'room_location': room_location,
            })
        return res, data

    def ws_get_uploaded_acl_list_info(self):
        pgsql = '''
            select file_name,
                num_acl_records,
                last_import_ts,
                last_export_ts,
                import_count,
                export_count
            from acl_history
            order by last_import_ts desc
        '''

        res, details, res_count = self.execute(pgsql)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_GET_ACL_HISTORY

        data = []
        for file_name, num_acl_records, last_import_ts, last_export_ts, import_count, export_count in details:
            data.append({
                'file_name': file_name,
                'num_acl_records': num_acl_records,
                'last_import_ts': str(last_import_ts),
                'last_export_ts': str(last_export_ts),
                'import_count': import_count,
                'export_count': export_count,
            })
        return res, data

    def ws_admin_cancel_booking(self, booking_id):
        pgsql = ''' 
            update reservations set reservation_status = 
                (select reservation_status_id from enum_reservation_status where reservation_status_type=%s)
            where reservation_id=%s
            '''

        para = (IssConstant.DB_ENUM_BOOKING_STATUS_CANCELLED, booking_id)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_ADMIN_CANCEL_BOOKING
        return res, details

    def ws_user_cancel_booking(self, employee_id, booking_id):
        pgsql = ''' 
            update reservations set reservation_status = 
                (select reservation_status_id from enum_reservation_status where reservation_status_type=%s)
            where reservation_id=%s
                and employee_id=%s
            '''

        para = (IssConstant.DB_ENUM_BOOKING_STATUS_CANCELLED, booking_id, employee_id)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_USER_CANCEL_BOOKING
        return res, details

    def ws_is_user_quota_exceeded(self, employee_id):
        pgsql = """
               select exists (
                   select * from ws_users 
                   where employee_id=%s
                    and user_quota <=
                        (select count(*) from glance
                        where employee_id=%s
                         and reservation_status_type=%s
                         and timestamp_start > now()
                        ) 
                ) 
            """
        para = (employee_id, employee_id, IssConstant.DB_ENUM_BOOKING_STATUS_APPROVED)
        res, details, res_count = self.execute(pgsql, para)
        if not res:
            logger.error('%s:' % details)
            return res, IssConstant.ERROR_CODE_WS_DB_USER_GET_QUOTA

        return res, details[0][0]

    def ws_update_acl_history(self, filename, action='export', num_records=0):
        if action == 'import':
            pgsql = """
                    insert into acl_history
                    (file_name, num_acl_records, last_import_ts, last_export_ts, import_count, export_count)
                    values (%s, %s, now(), now(), 1, 0)
                    on conflict (file_name) 
                    do update set
                        num_acl_records = %s, 
                        last_import_ts = now(),
                        import_count = acl_history.import_count + 1
                """
            para = (filename, num_records, num_records)
            res, details, res_count = self.execute(pgsql, para)
            if not res:
                logger.error('%s:' % details)
                return res, IssConstant.ERROR_CODE_WS_DB_UPDATE_ACL_HISTORY_IMPORT

            return res, details

        elif action == 'export':
            pgsql = """
                        update acl_history
                        set
                            last_export_ts = now(),
                            export_count = export_count + 1
                        where file_name = %s
                    """
            para = (filename,)
            res, details, res_count = self.execute(pgsql, para)
            if not res:
                logger.error('%s:' % details)
                return res, IssConstant.ERROR_CODE_WS_DB_UPDATE_ACL_HISTORY_EXPORT

            return res, details


if __name__ == '__main__':
    d = ControllerWSDb()
    # d.clear_record('reservations', 'where reservation_id=4')
    d.get_admin_chat_id()
    pass
