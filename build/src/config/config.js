"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qiwi_URL = exports.Authorization = exports.QIWI_NUMBER = exports.apiReqBody = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../../utils/database");
dotenv_1.default.config();
const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || 5000;
const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};
const jwt = {
    SECRET_KEY: process.env.JWT_SECRET
};
const db_config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};
const db = new database_1.Database(db_config);
const config = {
    server: SERVER,
    jwt,
    db
};
function apiReqBody(apiRoute) {
    return {
        url: `${exports.qiwi_URL}/${apiRoute}`,
        config: {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${exports.Authorization}`
            }
        }
    };
}
exports.apiReqBody = apiReqBody;
exports.QIWI_NUMBER = process.env.QIWI_NUMBER;
exports.Authorization = process.env.QIWI_TOKEN;
exports.qiwi_URL = 'https://edge.qiwi.com';
exports.default = config;
