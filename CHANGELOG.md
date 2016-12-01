# Changelog

## v0.5.0 (2016-12-01)

### New

* Gitchangelog integration. [alekzonder]

* Refactor Service/Config: get config from consul or from fs. [alekzonder]

* Maf/Error based on terror module, maf/Error/CheckChain copied from mazaid-error. [alekzonder]

### Changes

* Dev eslint integration, lint fixes. [alekzonder]

### Other

* Deps: update, fix: #7 issue. [alekzonder]

* Refactor: move Error/CheckChain from mazaid-error. [alekzonder]

* Esdoc integration. [alekzonder]

* Add .eslint.js, fix lints. [alekzonder]


## v0.5.0-beta.3 (2016-11-24)

### Other

* Fix #6 Rest/Api/Client add timeout option. [alekzonder]

* Jsdoc: for some methods of Api/Abstract. [alekzonder]

* Change npm script commands, rm docs. [alekzonder]

* Travis-ci: add node.js v7 for testing. [alekzonder]

* Deps: update. [alekzonder]

* Add .gitignore, update .jsdoc.json with distination. [alekzonder]


## v0.5.0-beta.2 (2016-10-27)

### Other

* Chain: done method alias of exec, if no onExec function return data. [alekzonder]


## v0.5.0-beta.1 (2016-10-27)

### Other

* Chain: new config format. [alekzonder]


## v0.4.6 (2016-10-18)

### Other

* Deps: update, add vendors/express. [alekzonder]

* V0.4.6-beta. [alekzonder]

* Deps: update, integrate log4js-nested. [alekzonder]

* Install in-publish. [alekzonder]

* Move lib to src, tests and build changes. [alekzonder]

* Add publish aliases. [alekzonder]


## v0.4.5 (2016-09-15)

### Other

* Update deps and publish scripts. [alekzonder]

* Update deps. [alekzonder]


## v0.4.4 (2016-08-31)

### Other

* Fix Rest/Client post method. [alekzonder]

* Add david-dm deps badge. [alekzonder]


## v0.4.3 (2016-08-11)

### Other

* Config.NODE_ENV from env.NODE_ENV, fix tmp dir path for tests. [alekzonder]

* Update npm badge. [alekzonder]


## v0.4.2 (2016-08-05)

### Other

* Move tests to test, fix some codeclimate issues, add Rest check joi schemas before joi.object().keys. [alekzonder]


## v0.4.1 (2016-08-04)

### Other

* Models fix no indexes result format. [alekzonder]


## v0.4.0 (2016-08-04)

### Other

* New Model ensureIndexes result format. [alekzonder]


## v0.3.6 (2016-08-04)

### Fix

* RestApi body validation error code. [alekzonder]


## v0.3.5 (2016-08-04)

### Other

* Update joi@9.0.4. [alekzonder]


## v0.3.4 (2016-08-04)

### Fix

* No debug response in REST, invalid continue option in Service/Application. [alekzonder]

### Other

* Add coverage badge. [alekzonder]

* Add codeclimate-test-reporter package. [alekzonder]

* Add code coverage report. [alekzonder]

* Update .travis.yml. [alekzonder]


## v0.3.3 (2016-07-25)

### Other

* Small fix of response/helpers. [alekzonder]


## v0.3.2 (2016-07-12)

### Other

* Version bump. [alekzonder]


## 0.3.0 (2016-07-12)

### Fix

* Model/Mongodb tests. [alekzonder]

### Other

* Version bump. [alekzonder]

* Travis test debug. [alekzonder]

* Model/Mongodb fix methods to equal Tingodb and func tests. [alekzonder]


## 0.3.0-beta.4 (2016-07-09)

### Other

* Chain: config.steps value is default value. [alekzonder]


## v0.3.0-beta.3 (2016-07-09)

### Other

* Api/Error: remove status constructor param. [alekzonder]


## v0.3.0-beta.2 (2016-07-09)

### Other

* Update npm deps. [alekzonder]


## v0.3.0-beta.1 (2016-07-09)

### Other

* Build script. [alekzonder]

* 0.3.1-0. [alekzonder]

* Package.json: add files param. [alekzonder]

* Travis: add mongodb service. [alekzonder]

* Test: Model/Tingodb ensureIndexes. [alekzonder]

* 0.3.0-0. [alekzonder]

* Tests for Model/Tingodb. [alekzonder]

* Add .travis.yml. [alekzonder]

* Model/Tingodb tests. [alekzonder]

* Some model files refactor, insertOne func tests for Model/Tingodb. [alekzonder]

* Move all to lib. [alekzonder]


## 0.2.7-beta.1 (2016-06-17)

### Other

* Update package.json deps. [alekzonder]

* Travis-ci build status. [alekzonder]

* Npm badge. [alekzonder]

* Code climate badge. [alekzonder]


## 0.2.6 (2016-06-01)

### Other

* Litle MongoModel changes. [alekzonder]


## 0.2.5 (2016-05-25)

### Other

* Config for Service/Application: use bodyParser.urlencoded. [alekzonder]


## 0.2.4 (2016-05-16)

### Fix

* Rest/Middleware/Permissions use req.di. [alekzonder]

### Other

* Version bump. [alekzonder]

* Some fixes, docs generator. [alekzonder]

* Update package deps. [alekzonder]


## 0.2.2 (2016-04-14)

### Other

* RestClient, Rest Middlewares: ContextUser, Permissions, User. [alekzonder]


## 0.2.1 (2016-04-11)

### Other

* Version bump. [alekzonder]

* Add ErrorCheckChain, response helpers fixes. [alekzonder]

* Rest middlewares basic RestApiClient. [alekzonder]

* Add timers to Mongo/Model methods. [alekzonder]


## 0.2.0 (2016-03-24)

### Other

* Debug/Timer event onStop. [alekzonder]

* More tools: Chain, DebugTimer, Mongo/Model. [alekzonder]


## 0.1.10 (2016-03-01)

### Other

* Rest: fix resource url in OPTIONS. [alekzonder]


## 0.1.9 (2016-02-29)

### Other

* Rest: addMany resources method. [alekzonder]


## 0.1.8 (2016-02-29)

### Other

* Prehook rest api function. [alekzonder]


## 0.1.7 (2016-02-29)

### Other

* Rest class. [alekzonder]


## 0.1.6 (2016-02-22)

### Other

* Imp: add errorCodes. [alekzonder]


## 0.1.5 (2016-02-03)

### Fix

* Api/Abstract _clearSystemFields don't work. [alekzonder]


## 0.1.4 (2016-02-01)

### Fix

* NedbWrapper Find chain fields default value, already exists on insert. [alekzonder]

### Other

* Nedb Db wrapper. [alekzonder]

* Model/Abstract all methods return promises. [alekzonder]


## 0.1.2 (2016-01-29)

### Other

* Di public vars. [alekzonder]

* Init commit. [alekzonder]


