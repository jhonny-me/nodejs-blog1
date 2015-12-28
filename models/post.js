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
    }

    var post = {
        time: time,
        name: this.name,
        post: this.post,
        title: this.title
    };

    //open db
    mongodb.open(function(err, db){
        if(err){
            db.close();
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
                    db.close();
                    return callback(err);
                }
            });

            collection.insert(post, {
                safe: true
            }, function(err, result){
                db.close();
               if(err){
                   return callback(err);
               }

                callback(null, result["ops"][0]);
            });
        });
    });
};
// 根据用户名查所有该用户的文章
Post.get = function (name, callback){
    // open db
  mongodb.open(function(err, db){
      if(err){
          return callback(err);
      }

      db.collection('posts', function(err, collection){
         if(err){
             db.close();
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