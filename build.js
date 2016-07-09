var fs = require('fs-extra');

var logger = require('log4js').getLogger('build');

var packagePath = `${__dirname}/package`;

if (fs.existsSync(packagePath)) {
    fs.removeSync(packagePath);
    logger.info(`remove package dir ${packagePath}`);
}

fs.mkdirsSync(packagePath);

logger.info(`create package dir ${packagePath}`);

var copyFiles = [
    'package.json',
    'README.md',
    'LICENSE'
];

for (var file of copyFiles) {
    fs.copySync(__dirname + '/' + file, packagePath + '/' + file);
    logger.info(`copy  ${file}`);
}

logger.info('copy code');

fs.walk(__dirname + '/lib')
    .on('error', function (error) {
        logger.error(error);
        process.exit(1);
    })
    .on('data', function (file) {
        if (file.stats.isDirectory()) {
            return;
        }

        var from = file.path;
        var to = file.path.replace(__dirname + '/lib', packagePath);

        var code = fs.readFileSync(from);

        fs.outputFile(to, code, function (err) {
            if (err) {
                logger.error(error);
                process.exit(1);
            }

            logger.info('copied ' + to);
        });

    })
    .on('end', function () {
        logger.info('code copied');
    });
