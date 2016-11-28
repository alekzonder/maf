module.exports = () => {

    return {

        position: 'afterSchemaCheck',

        check: function (methodData) {
            return (methodData && methodData.getUserProfile) ? true : false;
        },

        middleware: (req, res, next) => {

            // TODO check

            if (req.di.config.private) {
                next();
            } else {

                req.di.api.users.getById(req.user.getId())
                    .then((user) => {
                        req.user.setProfile(user);
                        req.user.setGroup(user.group);
                        next();
                    })
                    .catch((error) => {
                        res.sendCtxNow();
                        res.logServerError(error);
                    });

            }

        }
    };
};
