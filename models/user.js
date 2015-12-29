var mongodb = require('./db');
var crypto  = require('crypto');

function User(user) {
    this.name     = user.name;
    this.password = user.password;
    this.email    = user.email;
};

module.exports = User;

// store user info
User.prototype.save = function(callback) {

    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    // save info document
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };
    // opne datebase
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // read user collection
        db.collection('users', function (err, collection) {

            if (err){

                mongodb.close();
                return callback(err);//err, return the err
            }
            // insert into collection
            collection.insert(user, {
                safe: true
            }, function (err, result) {
                mongodb.close();
                if (err){
                    return callback(err);
                }
                callback(null, result["ops"][0]);// success, return the saved user document
            })
        })
    });
};

// read info by name
User.get = function (name, callback) {
    // open db
    mongodb.open(function (err, db) {
       if (err){

           return callback(err);
       }
        db.collection('users', function (err, collection){
            if (err){
                db.close();
                return callback(err);
            }
            // find document by name
            collection.findOne({
                name: name
            }, function (err, user){
                mongodb.close();
                if (err){
                    return callback(err);// fail, return err
                }
                callback(null, user);// success, return result
            });
        });
    });
};