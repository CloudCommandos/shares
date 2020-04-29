
const backend_server_url = extractServerUrl(window.location.href) + ":4000";
function extractServerUrl(url) {
    var hostname = '';
    var protocol = 'http://';
    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("//") > -1) {
        protocol = url.split('/')[0] + "//";
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return protocol + hostname;
}

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