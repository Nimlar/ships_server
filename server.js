var restify = require('restify');
var cookieParser = require('restify-cookies');

var server = restify.createServer();
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/* Test server, to be able to dev les clients
 *
 * Only one game */

/* global variable that fake the DB */
var g_game_d =1;
var g_player_id =0;
g_planets = [{ pos : [.1  ,.3  ], size:10},
			{ pos : [.3  ,.1  ], size:10},
			{ pos : [.9  ,.7  ], size:10},
			{ pos : [.7  ,.9  ], size:10},
			{ pos : [.5  ,.5  ], size:10},
			{ pos : [.78  ,.86  ], size:10},
			{ pos : [.14  ,.23  ], size:10},
			{ pos : [.36  ,.48  ], size:10},
			];

g_players_infos=[];

function game_new(req, res, next) {
            res.send({'game_id': g_game_d});
            return next();
}

function game_status(req, res, next) {
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];

    res.send({ planets : g_planets,
               players : g_players_infos ]
               });
    return next();
}


function player_new(req, res, next) {
    var g_id = req.params.game_id;
    p_id = ++g_player_id;
        res.setCookie('p_id', p_id);
        res.setCookie('g_id', g_id);
        /* TODO get planets from g_id */
        /* TODO select sta  rt planets randomly */
        /* should send planets + start planet*/
        /* p_id, g_id are in cookies */
            var planets=g_planets;
            var planet_id = getRandomInt(0, planets.lenght);
            var p_info= {id : p_id, score : 0, planet_id : planet_id };
            g_player_infos[p_id]= p_info;
            res.send(p_info);
            return next();
    });
}

function player_action(req, res, next) {
    var load=JSON.parse(req.body);
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];
        g_player_infos[p_id]["action"]= load["action"];
        switch (load['action']) {
            case "move":
                g_player_infos[p_id]["pos"]= load["action"]["planet_id"];
                break;
            case "steal":
                break;
            case "work":
                break;
        }
    return next();
}

function player_status(req, res, next) {
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];

    var p_info = g_player_infos[p_id] ;
            res.send({g_id : g_id, p_id :p_id ,
                      'info': p_info });
            return next();
}

server.use(CookieParser.parse)
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
                default: 'index.html'
        })
);

server.get('/game/new', game_new);
server.get('/game/status', game_status);
server.get('/game/p/new', player_new);
server.get('/game/p/status', player_status);
server.post('/game/p/action', player_action);

server.get('/sse', function(req, res) {
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
});


server.get('/fire-event/:event_name', function(req, res) {
  game.channel.publish('update', ('"' + req.params.event_name + '" page visited') );
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('All clients have received "' + req.params.event_name + '"');
  res.end();
});


server.listen(process.env.PORT, process.env.IP, function() {
  console.log('listening: %s', server.url);
});

