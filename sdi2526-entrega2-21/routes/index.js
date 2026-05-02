var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  if (req.session.user) {
    res.render('index', { title: 'Express' });
  } else {
    res.redirect("/users/login");
  }
});

module.exports = router;
