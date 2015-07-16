var restify = require('restify');
var cookieParser = require('restify-cookies');
var game = require('./ships');


var server = restify.createServer();


/* Test server, to be able to dev les clients
 *
 * Only one game */



function game_new(req, res, next) {
    console.log("game_new");
    game.get_new_id( function(err, game_id) {
        if (err) {
            return next(err);
        }
        res.setCookie('g_id', game_id, {path: "/game/"});
        res.send({'game_id': game_id});
        return next();
    });
}

function game_status(req, res, next) {
    console.log("game_status");
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    console.log(g_id);

    game.get_status(g_id, function(err, planets, players) {
        if (err) {
            return next(err);
        }

        res.send({ planets : planets,
            players : players
        });
        return next();
    });
}


function player_new(req, res, next)
{
    console.log("player_new 0");
    var g_id = req.params.game_id;
    console.log(g_id);
    game.player_new(g_id, function(err, p_id) {
        if (err) {
            return next(err);
        }
        res.setCookie('p_id', p_id, {path: "/game/"});
        res.setCookie('g_id', g_id, {path: "/game/"});
        res.send({id:p_id});
        return next();
    });
}

function player_action(req, res, next) {
    var load=req.params;
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];
    console.log("player action");
    console.log(g_id);
    console.log(p_id);
    game.player_action(g_id, p_id, load, function(err) {
        if (err) {
            return next(err);
        }
        return next();
    });
}

function player_status(req, res, next) {
    console.log("player_status");
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];
    console.log(g_id);
    console.log(p_id);

    var p_info = g_players_infos[p_id] ;
    game.player_status(g_id, p_id, function(err, p_info) {
        if (err) {
            return next(err);
        }
        res.send({g_id : g_id, p_id :p_id , 'info': p_info });
        return next();
    });
}

server.use(cookieParser.parse)
      .use(restify.fullResponse())
      .use(restify.bodyParser({ mapParams: true }))
      .use(restify.CORS({
    origins: ['http://toromanoff.org'],   // defaults to ['*']
    credentials: true,                  // defaults to false
    headers: ['x-foo']                 // sets expose-headers
}));


server.get( /\/?.*\.html/,
        restify.serveStatic({
                directory : './static/',
                default: 'index.html'
        })
);
server.get( /\/?.*\.js/,
        restify.serveStatic({
                directory : './static/',
        })
);
server.get( /\/?.*\.svg/,
        restify.serveStatic({
                directory : './static/',
        })
);

server.get('/game/new', game_new);
server.get('/game/status', game_status);
server.get('/game/:game_id/p/new', player_new);
server.get('/game/p/status', player_status);
server.post('/game/p/action', player_action);

var conString = "mongodb://localhost/ships";


server.get('/sse', function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(0x7FFFFFFF);
  var cookies = req.cookies;
  var g_id = cookies['g_id'];
  var p_id = cookies['p_id'];

  var messageCount = 0;
  var subscriber = game.channel;

  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("PubSub channel Error: " + err);
  });


  // When we receive a message about the game from the PubSub channel
  var subscription = subscriber.subscribe("message", function(message) {
    messageCount++; // Increment our message count
    res.write('id: ' + messageCount + '\n');
    res.write("data: " + JSON.stringify(message) + '\n\n'); // Note the extra newline
  });

  //send headers for event-stream connection
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://toromanoff.org',
  });
  res.write('\n');

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our PubSub channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscription.unsubscribe();
  });
});


server.listen(process.env.PORT, process.env.IP, function() {
//server.listen(8881, "192.168.0.1", function() {
  game.connect(conString, function(err) {
      if(err) throw err;
      console.log('listening: %s\n\n', server.url);
  });
});

