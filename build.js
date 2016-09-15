var fs = require('fs-extra');
var path = require('path');

var logger = require('log4js').getLogger('build');

var packagePath = `${__dirname}/package`;

if (fs.existsSync(packagePath)) {
    fs.removeSync(packagePath);
    logger.info(`remove package dir ${packagePath}`);
}

fs.mkdirsSync(packagePath);

logger.info(`create package dir ${packagePath}`);

var copyFiles = [
    'README.md',
    'LICENSE'
];

// copy and change package.json
var pkg = require(__dirname + '/package.json');

delete pkg.scripts.prepublish;

fs.writeFileSync(path.join(packagePath, 'package.json'), JSON.stringify(pkg, null, '    '));


for (var file of copyFiles) {
    fs.copySync(path.join(__dirname, file), path.join(packagePath, file));
    logger.info(`copy  ${file}`);
}

logger.info('copy code');

fs.walk(path.join(__dirname, '/src'))
    .on('error', function (error) {
        logger.error(error);
        throw err;
    })
    .on('data', function (file) {
        if (file.stats.isDirectory()) {
            return;
        }

        var from = file.path;
        var to = file.path.replace(path.join(__dirname, 'src'), packagePath);

        var code = fs.readFileSync(from);

        fs.outputFile(to, code, function (err) {
            if (err) {
                logger.error(error);
                throw err;
            }

            logger.info('copied ' + to);
        });

    })
    .on('end', function () {
        logger.info('code copied');
    });
