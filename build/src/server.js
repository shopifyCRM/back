"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config/config"));
const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());
//Auth Router
app.use('/api', require('./routes/apiRouter'));
//Cards Router
app.use('/api', require('./routes/cardsRouter'));
//Shopify Router
app.use('/api/shopify', require('./routes/shopifyRouter'));
app.listen(config_1.default.server.port, () => {
    console.log(`Server is running on ${config_1.default.server.hostname}:${config_1.default.server.port}`);
});
