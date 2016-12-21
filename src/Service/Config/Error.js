var path = require('path');

var BaseError = require(path.resolve(`${__dirname}/../../BaseError`));

module.exports = BaseError.create('ConfigError', {
    NO_CONFIG_PATH: 'no config path',
    NO_CONFIG: 'no config: %path%',
    INVALID_CONFIG: 'invalid config format',
    CONSUL_ECONNREFUSED: 'connection refused on %method% %url%',
    CONSUL_TIMEOUT: 'timeout on %method% %url%'
});
