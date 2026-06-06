'use strict';
const pug = require('pug');
const Cookies = require('cookies');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const util = require('./handler-util');
const { currentThemeKey } = require('../config');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ja');
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.tz.setDefault('Asia/Tokyo');

async function handle(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  const options = { maxAge: 30 * 86400 * 1000 };
  cookies.set(currentThemeKey, currentTheme, options);
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      // データベースから全タスク取得
      const posts = await prisma.post.findMany({
        orderBy: { id: 'asc' }
      });
      console.log('データベースから取得した直後のデータ:', posts);

      const boardData = {
        todo: [],
        doing: [],
        done: []
      };

      posts.forEach((post) => {
        post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
        post.formattedCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
        // 各タスクを状態ごとに分ける
        if (boardData[post.status]) {
          boardData[post.status].push(post);
        } else {
          boardData.todo.push(post);
        }
      });

      //boardDataをpugに渡す
      res.end(pug.renderFile('./views/index.pug', {
        currentTheme,
        boardData,
        user: req.user
      }))

      console.info(`閲覧されました: user: ${req.user}`);
      break;

    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const content = params.get('content');
        console.info(`送信されました: ${content}`);

        await prisma.post.create({
          data: {
            content,
            status: 'todo',
            postedBy: req.user
          }
        });
        handleRedirectPosts(req, res);
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const id = parseInt(params.get('id'));
        const post = await prisma.post.findUnique({
          where: { id }
        });
        if (req.user === post.postedBy || req.user === 'admin') {
          await prisma.post.delete({
            where: { id }
          });
          console.info(
            `削除されました: user: ${req.user}, ` +
              `remoteAddress: ${req.socket.remoteAddress}, ` +
              `userAgent: ${req.headers['user-agent']} `
          );
          handleRedirectPosts(req, res);
        }
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

async function handleUpdateStatus(req, res) {
    switch (req.method) {
        case 'POST':
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            }).on('end', async () => {
              try{
                const params = new URLSearchParams(body);
                const id = parseInt(params.get('id'));
                const status = params.get('status');

                await prisma.post.update({
                  where: { id },
                  data: { status }
                });
                console.info(`タスクID: ${id} の状態が ${status} に更新されました`);

                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({ sucess: true}));
              } catch (err) {
                console.error;
                res.writeHead(500, { 'Content-Type': 'text/plain'});
                res.end('Server Error')
              }
            });
}}

module.exports = {
  handle,
  handleDelete,
  handleUpdateStatus
};