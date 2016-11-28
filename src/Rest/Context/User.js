'use strict';

class ContextUser {

    constructor () {
        this._id = null;
        this._profile = null;
        this._group = null;
    }

    setId (id) {
        this._id = id;
    }

    getId () {
        return this._id;
    }

    setProfile (profile) {
        this._profile = profile;
    }

    getProfile () {
        return this._profile;
    }

    setGroup (group) {
        this._group = group;
    }

    getGroup () {
        return this._group;
    }

}

module.exports = ContextUser;
