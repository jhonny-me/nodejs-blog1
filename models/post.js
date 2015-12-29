var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, tags, post){
    this.name = name;
    this.title = title;
    this.tags = tags;
    this.post = post;
    this.head = head;
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
        head: this.head,
        post: this.post,
        tags: this.tags,
        title: this.title,
        comments: [],
        pv: 0
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
Post.getAllBySize = function (name, page, pageSize, callback){
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
          //使用 count 返回特定查询的文档数 total
          collection.count(query, function (err, total) {
              if (err){
                  return callback(err);
              }
              //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
              collection.find(query).skip((page -1)*pageSize).limit(pageSize).sort({
                  time: -1
              }).toArray(function (err, docs) {
                  db.close();
                  if (err){
                      return callback(err);
                  }
                  docs.forEach(function (doc) {
                      doc.post = markdown.toHTML(doc.post);
                  });
                  return callback(null, docs, total);
              });
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
            collection.findOne({
                "name": name,
                "title": title,
                "time.day": day
            }, function (err, result) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (result){
                    collection.update({
                        name: name,
                        "time.day": day,
                        title: title
                    },{
                        $inc: {pv: 1}
                    }, function (err) {
                        mongodb.close();
                        if (err){
                            return callback(err);
                        }
                    });
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

Post.archive = function (callback) {

    mongodb.open(function (err, db) {
        if (err){
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
           if (err){
               mongodb.close();
               return callback(err);
           }

            //返回只包含 name、time、title 属性的文档组成的存档数组
            collection.find({},{
                name: 1,
                time: 1,
                title: 1
            },{
                sort: {time: -1}
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err){
                    return callback(err);
                }

                return callback(null, docs);
            });
        });
    });
};

//返回所有标签
Post.getTags = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// search
Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {

        if (err){
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err){
                mongodb.close();
                return callback(err);
            }

            var pattern = new RegExp(keyword, "i");
            collection.find({
                title: pattern
            },{
                name: 1,
                time: 1,
                title: 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err){
                    return callback(err);
                }

                return callback(null, docs);
            });
        });
    });
};