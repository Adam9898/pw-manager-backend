#!/usr/bin/env node

import { app } from "../app";
import { debug } from "debug";
import * as http from "http";
import {HttpError} from "http-errors";
import {MongoDBConnector} from "../repositories/MongoDBConnector";
import dotenv from 'dotenv';
import Jasmine from "jasmine";
import {monitorEventLoopDelay} from "perf_hooks";
import {Db} from "mongodb";

/**
 * Module dependencies.
 */

const resolvedDebug = debug('wp-manager-backend:server');
dotenv.config();

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: HttpError) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr?.port;
    resolvedDebug('Listening on ' + bind);

    if (process.argv[2] === '--test') {
        // connect to test database
        const mongodb = new MongoDBConnector(process.env.MONGO_USER!, process.env.MONGO_PASSWORD!, process.env.MONGO_HOST!,
            parseInt(process.env.MONGO_PORT!), process.env.MONGO_TEST_DB!)
        mongodb.connect(true).then(() => {
        // run tests
        const jasmine = new Jasmine({});
            jasmine.loadConfig({
                    "spec_dir": "spec",
                    "spec_files": [
                        "**/*[sS]pec.js"
                    ],
                    "stopSpecOnExpectationFailure": false,
                    "random": true
                }
            );
            jasmine.execute();

        });
    } else {
        // connect to regular database
        const mongodb = new MongoDBConnector(process.env.MONGO_USER!, process.env.MONGO_PASSWORD!, process.env.MONGO_HOST!,
            parseInt(process.env.MONGO_PORT!), process.env.MONGO_DB!)
        mongodb.connect(true);
    }

}
