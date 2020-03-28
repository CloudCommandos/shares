import psycopg2
from psycopg2 import sql, pool
import logging
from StringIO import StringIO
import IssConstant
import json

class ReaderWriterDb(object):
    ERROR_CODE_DB_GENERAL_CLEAR_TABLE = 7002

    def __init__(self,
                 db_user,
                 db_user_password,
                 db_host,
                 db_port,
                 db_name,
                 isolation_level=None,
                 logger=None
                 ):

        self.db_user = db_user
        self.db_user_password = db_user_password
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name

        self.isolation_level = isolation_level
        self.logger = logger or logging.getLogger(__name__)

        self.conn = None
        self.cursor = None

        self.pool = None

        self.res_count = 0  # store result of commits

        self.connect()

    def connect(self, isolation_level=None):
        try:
            self.pool = psycopg2.pool.ThreadedConnectionPool(5, 20,
                                         user=self.db_user,
                                         password=self.db_user_password,
                                         host=self.db_host,
                                         port=self.db_port,
                                         database=self.db_name)
            if self.pool:
                self.logger.info('Connection pool created successfully using ThreadedConnectionPool')

        except (Exception, psycopg2.Error) as error:
            self.logger.error('pgsql error:%s' % error)
            self.close()

        except (Exception, psycopg2.DatabaseError) as error:
            self.logger.error("pgsql dberror: %s" % error)
            self.close()

    def close(self):
        if self.pool:
            self.pool.closeall
            self.logger.info("PostgreSQL connection closed")

    def execute(self, pgsql, para=None, is_retry=False):

        res = False
        details = 'KO'
        res_count = 0

        try:
            conn = self.pool.getconn()
            cursor = conn.cursor()
            if cursor is None:
                self.logger.warn('failed to get cursor. reconnecting...')
                self.connect()

            # logger.info('para:%s' % para) #TBC: phenomenon!!!!
            if para is None:
                cursor.execute(pgsql)
            else:
                cursor.execute(pgsql, para)
            conn.commit()
            res_count = cursor.rowcount
            res = True
            if cursor.description is None:
                details = ''  # nothing to fetch
            else:
                details = cursor.fetchall()

            cursor.close()

            # Use this method to release the connection object and send back to connection pool
            self.pool.putconn(conn)

        except (Exception, psycopg2.Error) as error:
            self.logger.error('pgsql:{}   para:{}  ({})'.format(pgsql, str(para), is_retry))
            self.logger.error('pgsql error: {} ({})'.format(error, is_retry))
            details = str(error)
            if (not is_retry) and (IssConstant.DB_NOTIF_CONSTRAINT_BOOKING_OVERLAP not in details):
                res, details = self.execute(pgsql, para, is_retry=True)
            self.close()

        except (Exception, psycopg2.DatabaseError) as error:
            self.logger.error('pgsql:%s   para:%s' % (pgsql, para))
            self.logger.error("pgsql dberror: %s" % (error))
            details = str(error)
            self.close()

        finally:
            return res, details, res_count

    def loads(self, my_tables):
        conn = self.pool.getconn()
        cursor = conn.cursor()
        for table_name, table_content in my_tables.iteritems():
            for x in table_content:
                f = StringIO()
                f.write(x)
                f.seek(0)
                cursor.copy_from(f, table_name, sep=',')
        conn.commit()

    def clear_tables(self, table_names):
        for table_name in table_names:
            pgsql = sql.SQL("delete from {}").format(sql.Identifier(table_name))
            res, details = self.execute(pgsql)
            if not res:
                self.logger.error('clear table:%s :::%s' % (table_name, details))


if __name__ == '__main__':
    pass
