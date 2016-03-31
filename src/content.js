var ws = new WebSocket('ws://localhost:12345'); // todo configurable uri, default port should be different

ws.onopen = function () {
  console.log('remote-control: connected');
  return ws.send(JSON.stringify({uri: window.location.href}));
};

ws.onmessage = function (event) {
  try {
    JSON.parse(event.data).forEach(commandLine=> runCommand(commandLine));
  } catch (e) {
  }
};

function runCommand(commandLine) {
  var commands = commandLine.split(',');
  var command = commands[0];

  if ('reload' === command) {
    console.log('remote-control: reloading page');
    window.location.reload();
    return;
  }

  if ('reloadCss' === command) {
    console.log('remote-control: reloading css');
    reloadCss();
    return;
  }

  if ('trigger' === command) {
    console.log('remote-control: trigger');
    triggerAction(commands[1], commands[2], commands[3]);
    return;
  }

  console.log('remote-control: custom code:', commandLine);
  var f = new Function(commandLine.split('\n').join(' '));
  console.log(f);
  f.call(window);
}

function reloadCss() {
  var head = document.querySelector('html>head');
  var links = document.querySelectorAll('head>link[rel=stylesheet]');
  Array.prototype.forEach.call(links, function (link) {
    var href = link.href;
    if (!href) {
      return;
    }
    link.remove();

    setTimeout(function () {
      var newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = href;
      document.head.appendChild(newLink);
    }, 100);
  });
}

function triggerAction(timeout, action, selector) {
  setTimeout(function () {
    console.log('remote-control: triggering after timeout', timeout, action, selector);
    document.querySelector(selector)[action]();
  }, timeout);
}
