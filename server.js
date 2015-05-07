var game = require('./ships');
var restify = require('restify');
var cookieParser = require('restify-cookies');

var server = restify.createServer();

function game_new(req, res, next) {
    db.incr(name + ":g_id",
            function (err, res) {
            if (err) {
                    next(err);
            }
            // TODO create planets
            res.send({'game_id': res});
            return next();
    });
}

function game_status(req, res, next) {
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];
}

function player_new(req, res, next) {
    var g_id = req.params.game_id;
    res.setCookie('p_id', res);
    res.setCookie('g_id', g_id);
    /* TODO get planets from g_id */
    /* TODO select start planets randomly */
    /* should send planets + start planet*/
    /* p_id, g_id are in cookies */

    game.planets.get(g_id, function(err,planets) {
        if(err) {
            return next(err);
        }
        res.send({'planets' : planets, 'pos' : 0 });
        return next();
    });
}

function player_action(req, res, next)
{
    var load=JSON.parse(req.body);
    var cookies = req.cookies;
    switch (load['action']) {
        case "move":
            game.players.updatePos(p_id, planet, function(err) {
            if(err) {
                                           return next(err);
                                       }
                                       return next();
                                   });
                                   break;
                                   case "steal":
            case "work":
                game.player.updateAction(p_id,
                        load['action'],
                        function(err) {
                            if(err) {
                                return next(err);
                            }
                            return next();
                        });

        }
}

function player_status(req, res, next) {
}

function see_manage(req, res)
{
  // let request last as long as possible
  req.socket.setTimeout(0x7FFFFFFF);
  var cookies = req.cookies;
  var g_id = cookies['g_id'];
  var p_id = cookies['p_id'];

  var messageCount = 0;
//  var subscriber = client.channel('test');
  var subscriber = game.channel;

  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("PubSub channel Error: " + err);
  });


  // When we receive a message about the game from the PubSub channel
  var subscription = subscriber.subscribe("game:"+g_id, function(message) {
    messageCount++; // Increment our message count
    res.write('id: ' + messageCount + '\n');
    res.write("data: " + message + '\n\n'); // Note the extra newline
  });
/*  // When we receive a message about the game for the current player from the PubSub channel
  var subscription = subscriber.subscribe("game:"+g_id+":"+p_id, function(message) {
    messageCount++; // Increment our message count
    res.write('id: ' + messageCount + '\n');
    res.write("data: " + message + '\n\n'); // Note the extra newline
  });
*/
  //send headers for event-stream connection
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
//    'Access-Control-Allow-Origin': 'https://toromanoff.org',
//    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS'
  });
  res.write('\n');

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our PubSub channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscription.unsubscribe();
  });
};


server.use(cookieParser.parse)
      .use(restify.fullResponse())
      .use(restify.bodyParser())
      .use(restify.CORS({
          origins: ['https://toromanoff.org'],   // defaults to ['*']
          credentials: true,                  // defaults to false
          headers: ['x-foo']                 // sets expose-headers
      }));

server.get( /\/?.*\.html/,
           restify.serveStatic({
               directory : './static/',
               default: 'index.html' }));

server.get('/game/new', game_new);
server.get('/game/:game_id/status', game_status);
server.get('/game/:game_id/p/new', player_new);
server.get('/game/:game_id/p/:p_id', player_status);
server.post('/game/:game_id/p/:p_id/action', player_action);
server.get('/sse', see_manage);

server.get('/fire-event/:event_name', function(req, res) {
    game.channel.publish('update', ('"' + req.params.event_name + '" page visited') );
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('All clients have received "' + req.params.event_name + '"');
    res.end();
});

uri = 'mongodb://localhost:27017/ships';
game.connect(uri, function(err) {
    if(err) throw err;
    server.listen(process.env.PORT, process.env.IP, function() {
        console.log('listening: %s', server.url);
    });
});

