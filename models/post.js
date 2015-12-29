var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post){
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback){

    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    var post = {
        time: time,
        name: this.name,
        post: this.post,
        title: this.title,
        comments: []
    };

    //open db
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
           if (err){
               return callback(err);
           }

            // check if post exists
            collection.findOne({
                title: post.title
            }, function(err, post){
                if (post){
                    mongodb.close();
                    return callback(err);
                }
            });

            collection.insert(post, {
                safe: true
            }, function(err, result){
                mongodb.close();
               if(err){
                   return callback(err);
               }

                callback(null, result["ops"][0]);
            });
        });
    });
};
// 根据用户名查所有该用户的文章
Post.getAll = function (name, callback){
    // open db
  mongodb.open(function(err, db){
      if(err){
          return callback(err);
      }

      db.collection('posts', function(err, collection){
         if(err){
             mongodb.close();
             return callback(err);
         }
          var query = {};
          if (name) {
              query.name = name;
          }
          //根据 query 对象查询文章
          collection.find(query).sort({
              time: -1
          }).toArray(function (err, docs) {
              mongodb.close();
              if (err) {
                  return callback(err);//失败！返回 err
              }
              //解析 markdown 为 html
              docs.forEach(function (doc) {
                  doc.post = markdown.toHTML(doc.post);
              });
              callback(null, docs);//成功！以数组形式返回查询的结果
          });
      });
  });
};

// 根据用户名,标题,时间获取文章
Post.getOne = function (name, day, title, callback){

    //open db
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err){

                mongodb.close();
                return  callback(err);
            }
            console.log('name:'+ name+ 'title:'+ title+ 'time'+ day);
            collection.findOne({
                "name": name,
                "title": title,
                "time.day": day
            }, function (err, result) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                if (result) {
                  result.post = markdown.toHTML(result.post);
                  result.comments.forEach(function (comment) {
                    comment.content = markdown.toHTML(comment.content);
                  });
                }
                callback(null, result);
            });
        });
    });
};

Post.edit = function (name, day, title, callback) {
  // open db
    mongodb.open(function (err, db) {
        if (err){
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
           if (err){
               mongodb.close();
               return callback(err);
           }

            collection.findOne({
                name: name,
                "time.day": day,
                title: title
            }, function (err, results) {
                mongodb.close();
                if(err){
                    return callback(err);
                }

                callback(null, results);
            });
        });
    });
};

Post.update = function (name, day, title, post, callback) {

    mongodb.open(function (err, db) {
       if (err){
           return callback(err);
       }

        db.collection('posts', function (err, collecton) {
           if (err){
               mongodb.close();
               return callback(err);
           }

            collecton.updateOne({
                name: name,
                "time.day": day,
                title: title
            }, {
                $set: {post: post}
            }, function (err) {
                mongodb.close();
                if (err){
                    return callback(err);
                }

                callback(null);
            });
        });
    });
};

Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err){
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err){
                mongodb.close();
                return callback(err);
            }

            collection.deleteOne({
               name: name,
                "time.day": day,
                title: title
            }, function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }

                callback(null);
            });
        });
    });
};