var path = require('path');

var terror = require(path.resolve(`${__dirname}/../../Error`));

module.exports = terror.create('ConfigError', {
    NO_CONFIG_PATH: 'no config path',
    NO_CONFIG: 'no config: %path%',
    INVALID_CONFIG: 'invalid config format',
    CONSUL_ECONNREFUSED: 'connection refused on %method% %url%',
    CONSUL_TIMEOUT: 'timeout on %method% %url%'
});
