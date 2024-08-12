import * as bunyan from 'bunyan';

// --- Available levels
// "fatal" (60): The app is going to stop or become unusable now. An operator should definitely look into this soon.
// "error" (50): Fatal for a particular request, app continues servicing other requests.
// "warn" (40): A note on something that should probably be looked at by an operator eventually.
// "info" (30): Detail on regular operation.
// "debug" (20): Anything else, i.e. too verbose to be included in "info" level.
// "trace" (10): Logging from external libraries used by your app or very detailed application logging.
//
//

const logger = bunyan.createLogger({
    name: 'mmo-ecc-orchestration-svc',
    level: 'debug',
    serializers: {
      err: bunyan.stdSerializers.err
    }
});

if (process.env.NODE_ENV === "test") {
    logger.level(bunyan.FATAL + 1);
}

export default logger;
