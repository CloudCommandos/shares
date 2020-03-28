const backend_server_url = "http://localhost:4000";

const SETTINGS = {
    WEB_SOCKET_URL: backend_server_url,
    BACKEND_SERVER_URL: backend_server_url,
    MODE: "DEVELOPMENT", // DEVELOPMENT, PRODUCTION

    //Web Service Endpoints
    BACKEND_WS_LOGIN_URL: backend_server_url + "/login",
    BACKEND_WS_LOGOUT_URL: backend_server_url + "/logout",
    BACKEND_WS_VALIDATE_SESSION_URL: backend_server_url + "/validate_session",
    BACKEND_WS_CHANGE_PASSWORD: backend_server_url + "/change_password",
    BACKEND_WS_GET_FILE_CONTENTS: backend_server_url + "/get_file_contents",
    BACKEND_WS_UPDATE_FILE_CONTENTS: backend_server_url + "/update_file_contents",
    BACKEND_WS_RELOAD_SERVICE: backend_server_url + "/reload_service",

    //Operation Settings
    FIRST_AVAILABLE_HOUR: 9,
    LAST_AVAILABLE_HOUR: 18,
};

module.exports = SETTINGS;