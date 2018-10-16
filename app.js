/**
 * Created by megan on 2016-11-17.
 */

process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

var cluster = require('cluster');

var log = require('./modules/logModule');
var config = require('./modules/configModule');

var workerIds = [];

if(cluster.isMaster){
    // 재입수 trigger
    if(config.conf.daemon.isReingest) forkWorker('reingest');

    // 재입수 trigger (version 3.0)
    if(config.conf.daemon_v2.isReingest) forkWorker('reingest_v3');

    // 재보고 trigger
    if(config.conf.daemon.isRereport) forkWorker('rereport');

    // 워커 감시 trigger (type A)
    if(config.conf.daemon.isObserve) forkWorker('observe');

    // 워커 감시 trigger (type B)
    if(config.conf.overseer_v1.use){
        forkWorker('overseer');     // normal
        forkWorker('wOverseer');    // watermarking
    }

    // 워커 감시 trigger (type C)
    if(config.conf.overseer_v2.use){
        forkWorker('prepare');      // prepare
        forkWorker('parallel');     // parallel
        forkWorker('merge');        // merge
        forkWorker('deeplearning'); // deeplearning
    }

    cluster.on('online', function(worker){
        log.notice('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal){
        log.notice('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        log.notice('Starting a new worker');

        workerIds.forEach(function(e, idx, arr){
            if(e.value == worker.process.pid){
                var workerName = e.name;
                var forkedWorker = cluster.fork();
                workerIds.splice(idx, 1);
                workerIds.push({name: workerName, value: forkedWorker.process.pid});
                forkedWorker.send(workerName);
            }
        });
    });
}else{
    process.on('message', function(message){
        log.notice('From master for worker', message);

        // 재입수 trigger
        if(message === 'reingest'){
            var reingest = require('./handlers/reingestHandler');
            reingest.init();
        }
        // 재입수 trigger (version 3.0)
        if(message === 'reingest_v3'){
            var reingest_v3 = require('./handlers/reingestHandler_V3');
            reingest_v3.init();
        }
        // 재보고 trigger
        if(message === 'rereport'){
            var rereport = require('./handlers/rereportHandler');
            rereport.init();
        }
        // 워커 감시 trigger (type A)
        if(message === 'observe'){
            var trigger = require('./handlers/triggerHandler');
            trigger.startObserve();
        }
        // 워커 감시 trigger (type B) normal
        if(message === 'overseer'){
            var overseer = require('./handlers/overseerHandler');
            overseer.init();
        }
        // 워커 감시 trigger (type B) watermarking
        if(message === 'wOverseer'){
            var wOverseer = require('./handlers/wOverseerHandler');
            wOverseer.init();
        }
        // 워커 감시 trigger (type C - prepare)
        if(message === 'prepare'){
            var ppOverseer = require('./handlers/prepareHandler');
            ppOverseer.init();
        }
        // 워커 감시 trigger (type C - parallel)
        if(message === 'parallel'){
            var pOverseer = require('./handlers/parallelHandler');
            pOverseer.init();
        }
        // 워커 감시 trigger (type C - merge)
        if(message === 'merge'){
            var mOverseer = require('./handlers/mergeHandler');
            mOverseer.init();
        }
        // 워커 감시 trigger (type C - deeplearning)
        if(message === 'deeplearning'){
            var dOverseer = require('./handlers/deeplearningHandler');
            dOverseer.init();
        }
    });

    process.send(process.pid);
}

function forkWorker(workerName){
    var worker = cluster.fork();
    log.notice('Master cluster setting up ' + worker.process.pid + ' workers...');
    worker.on('message', function(message){
        if(typeof message == 'number'){
            log.notice('Master ' + process.pid + ' from worker pid ' + message);
            workerIds.push({name: workerName, value: message});
        }
    });
    worker.send(workerName);
}

// process.on('uncaughtException', function(err) {
//     log.error('uncaughtException :', err.message);
//     process.exit(1);
// });