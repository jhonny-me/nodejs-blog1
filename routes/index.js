var express = require('express');
var router = express.Router();
var crypto = require('crypto'),
    User   = require('../models/user.js'),
    Post   = require('../models/post.js');
//var multer = require('multer'),
//    upload = multer({ dest: './public/images/' });

/* GET home page. */
module.exports = function(app) {
  app.get('/', function (req, res) {
      var name;
      if(!req.session.user){
          name = null;
      }else {
          name = req.session.user.name;
      }
      Post.get(name, function(err, posts){
          if(err){
              posts = [];
          }
          res.render('index', {
              title: '主页',
              user: req.session.user,
              posts: posts,
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
      post = new Post(currentUser.name, req.body.title, req.body.post);
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