const repl = require('repl-extra');

module.exports = function (logger, init) {

    return new Promise((resolve, reject) => {
        reject(new Error('use Service/Init/Repl for cli repl'));
    });

};
