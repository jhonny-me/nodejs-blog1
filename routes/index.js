var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
    User   = require('../models/user.js'),
    Post   = require('../models/post.js'),
    Comment = require('../models/comment.js');
//var multer = require('multer'),
//    upload = multer({ dest: './public/images/' });

// get pageSize
var pageSize = 2;

/* GET home page. */
module.exports = function(app) {
  app.get('/', function (req, res) {
      var name;
      if(!req.session.user){
          name = null;
      }else {
          name = req.session.user.name;
      }

      //判断是否是第一页，并把请求的页数转换成 number 类型
      var page = parseInt(req.query.p) || 1;
      if (page ==0){
          page =1;
      }
      //查询并返回第 page 页的 10 篇文章
      Post.getAllBySize(name, page, pageSize, function(err, posts, total){
          if(err){
              posts = [];
          }
          res.render('index', {
              title: '主页',
              user: req.session.user,
              posts: posts,
              page: page,
              isFirstPage: page ==1,
              isLastPage: ((page -1)*pageSize +posts.length) == total,
              success: req.flash('success').toString(),
              error: req.flash('error').toString()
          });
      });
  });

    app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

    app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {

      var name = req.body.name,
          password = req.body.password,
          password_re = req.body['password-repeat'];
    // check twice password
    if (password != password_re){

      req.flash('error', '两次输入的密码不一致');
      return res.redirect('/reg');// back to registration page
    }
    // generate password's MD5
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });

    // check if name is already exist
    User.get(newUser.name, function(err, user) {
      if (err){
        req.flash('error', err);
        return res.redirect('/');
      }

      if(user){
        req.flash('error', '用户已存在');
        return res.redirect('/reg');
      }

      newUser.save(function (err, user){
        if (err){
          req.flash('error', err);
          return res.redirect('/reg');
        }

        //console.log(user);
        req.session.user = user;// save user info to session
        req.flash('success', '注册成功!');
        res.redirect('/');// back to home
      });
    });
  });

    app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {

    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
  });

    app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
      // get md5 passord
      var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');
      // check if user exist
      User.get(req.body.name, function(err, user) {
          if (err){
              req.flash('error', err);
              return res.redirect('/login');
          }

          if(!user){
              req.flash('error', '用户名不存在');
              return res.redirect('/login');
          }

          if(user.password != password){
              req.flash('error', '密码不正确');
              return res.redirect('/login');
          }

          req.session.user = user;
          req.flash('success', '登录成功');
          res.redirect('/');
      });
  });

    app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
      res.render('post', {
          title: '发表',
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
      });
  });

    app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
      var currentUser = req.session.user;
      var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
      console.log('posts tags == '+tags);
      post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
      post.save(function(err){
          if(err){
              req.flash('error', err);
              res.redirect('/');
          }
          req.flash('success', '发表成功');
          res.redirect('/');
      });
  });

    app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
      req.session.user = null;
      req.flash('success', '退出成功');
      res.redirect('/');
  });

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        req.flash('success', '文件上传成功!');
        res.redirect('/upload');
    });


    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: "SEARCH:" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/links', function (req, res) {
        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/u/:name', function (req, res) {
        var page = parseInt(req.query.q) || 1;
        if (page ==0){
            page =1;
        }
        User.get(req.params.name, function (err, user) {
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            if (!user){
                req.flash('error', "用户名不存在");
                return res.redirect('/');
            }

            Post.getAllBySize(user.name, page, pageSize, function (err, result, total) {
                if(err){
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: result,
                    page: page,
                    isFirstPage: page ==1,
                    isLastPage: ((page -1)*pageSize +result.length) == total,
                    user : req.session.user,
                    success : req.flash('success').toString(),
                    error : req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        console.log('in post '+ req.body.content);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功!');
            res.redirect('back');
        });
    });

    // 编辑
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        // 获取markdown格式的文档
        Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err){
                req.flash('error', err);
                return res.redirect('back');
            }

            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        // 保存user,不然可能会丢失
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = encodeURI('/u/'+ currentUser.name+ '/'+ req.params.day+ '/'+ req.params.title);
            if (err){
                req.flash('error', err);
                return res.redirect('url');
            }

            req.flash('success', '修改成功');
            res.redirect(url);
        });
    });

    // 删除
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        Post.remove(req.params.name, req.params.day, req.params.title, function (err) {
            if (err){
                req.flash('error', err);
                return res.redirect('back');
            }

            req.flash('sucess', '删除成功');
            res.redirect('/');
        });
    });

    // archive
    app.get('/archive', function (req, res) {
        Post.archive(function (err, posts) {
            if (err){
                req.flash('error',error);
                return res.redirect('/');
            }

            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //tags
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.use(function (req, res) {
        res.render("404");
    });

};

function checkLogin(req, res, next){
    if (!req.session.user){
        req.flash('error', '未登录');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next){
    if(req.session.user){
        req.flash('error', '已登录');
        res.redirect('back');
    }
    next();
}