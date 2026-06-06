'use strict';
const postsHandler = require('./handler-main');
const util = require('./handler-util');

function route(req, res) {
  switch (req.url) {
    case '/':
      res.writeHead(303, {
        'Location': '/posts'
      });
      res.end();
      break;
    case '/posts':
      postsHandler.handle(req, res);
      break;
    case '/posts/delete':
      postsHandler.handleDelete(req, res);
      break;
    case '/posts/updateStatus':
      postsHandler.handleUpdateStatus(req, res);
      break;
    case '/logout':
      util.handleLogout(req, res);
      break;
    case '/changeTheme':
      util.handleChangeTheme(req, res);
      break;
    case '/favicon.ico':
      util.handleFavicon(req, res);
      break;
    case '/style.css':
      util.handleStyleCssFile(req, res);
      break;
    case '/taskboard.js':
      util.handleTaskboardJsFile(req, res);
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

module.exports = {
  route
};