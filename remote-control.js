const assert = require('assert');
const bunyan = require('bunyan');
const fs = require('fs');
const glob = require('glob');
const is = require('is');
const yaml = require('js-yaml');

const WebSocketServer = require('websocket').server;

const packageInfo = require('./package.json');
const logger = bunyan.createLogger({
  name: packageInfo.name,
  version: packageInfo.version,
  serializers: bunyan.stdSerializers
});

const connections = [];
const uris = [];

fs.readFile(__dirname + '/config/commands.local.yaml', 'utf-8', (err, config)=> { // todo command-line path
  assert.ifError(err);
  const commands = yaml.safeLoad(config);
  logger.info('COMMANDS PARSED');
  return Object.keys(commands).forEach(uri=> registerUri(uri, commands[uri]));
});

function registerUri(uri, params) {
  uris.push(uri);
  return Object.keys(params).forEach(files=> registerWatcher(uri, files, params[files]));
}

function registerWatcher(uri, files, commands) {
  if (!is.array(commands)) commands = [commands];

  // if (null == watchers[uri]) watchers[uri] = {};
  // watchers[uri][files] = commands;

  glob(files, (err, paths)=> {
    assert.ifError(err);
    paths.forEach(path=> {
      fs.watchFile(path, ()=> triggerCommands(uri, commands));
    });
  });
}

function triggerCommands(uri, commands) {
  const re = new RegExp(uri);

  // todo lock/unlock

  connections.forEach(description=> {
    console.log(re, description.uri, re.test(description.uri));
    if (!re.test(description.uri)) {
      return;
    }
    description.connection.sendUTF(JSON.stringify(commands));
    description.logger.info({commands}, 'COMMANDS SENT');
  });
}

function clearConnections() {
  let i, l, indexes;
  indexes = [];

  // todo somethings not right with the function

  for (i = 0, l = connections.length; i < l; ++i) {
    if (connections[i] && connections[i].connection && connections[i].connection.connected === false) {
      indexes.push(i);
    }
  }

  while (i = indexes.pop()) {
    connections.splice(i, 1);
  }
}

const server = new WebSocketServer({
  httpServer: require('http').createServer(()=> {
    // skip
  }).listen(12345) // todo custom port
});

server.on('request', request=> {
  const connection = request.accept(null, request.origin);
  const connectionLogger = logger.child({
    address: request.remoteAddress
  });

  connection.on('message', msg=> {
    if ('utf8' === msg.type) {
      try {
        const input = JSON.parse(msg.utf8Data);
        const uri = input.uri;
        let found = false;

        for (let i = 0, l = uris.length; i < l; ++i) {
          if ((new RegExp(uris[i])).test(uri)) {
            found = true;
            break;
          }
        }

        if (!found) {
          return connection.close();
        }

        connections.push({uri, connection, logger: connectionLogger});
        connectionLogger.info({uri, address: connection.remoteAddress}, 'CONNECTION ESTABLISHED');

        connection.on('close', ()=> {
          connectionLogger.info('CONNECTION CLOSED');
          clearConnections();
        });

      } catch (err) {
        connectionLogger.error({err}, 'INPUT ERROR');
      }
    }
  });
});

