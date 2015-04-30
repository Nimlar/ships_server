var restify = require('restify');
var cookieParser = require('restify-cookies');
var mubsub = require('mubsub');



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
var g_planets = [{ pos : [.1  ,.3  ], size:15},
			{ pos : [.3  ,.1  ], size:15},
			{ pos : [.9  ,.7  ], size:15},
			{ pos : [.7  ,.9  ], size:15},
			{ pos : [.5  ,.5  ], size:15},
			{ pos : [.78  ,.86  ], size:15},
			{ pos : [.14  ,.23  ], size:15},
			{ pos : [.36  ,.48  ], size:15},
			];

var g_players_infos=[];

function game_new(req, res, next) {
            res.send({'game_id': g_game_d});
            return next();
}

function game_status(req, res, next) {
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];

    res.send({ planets : g_planets,
               players : g_players_infos
               });
    return next();
}


function player_new(req, res, next)
{
    var g_id = req.params.game_id;
    var p_id = ++g_player_id;
        res.setCookie('p_id', p_id, {path: "/game/"});
        res.setCookie('g_id', g_id, {path: "/game/"});
        /* TODO get planets from g_id */
        /* TODO select sta  rt planets randomly */
        /* should send planets + start planet*/
        /* p_id, g_id are in cookies */
            var planets=g_planets;
            var planet_id = getRandomInt(0, planets.length);
            var p_info= { move: {id : p_id, score : 0, planet_id : planet_id, action : 'idle' }};
            g_players_infos[p_id]= p_info.move;
            channel.publish('player', p_info );
            res.send(p_info);
            return next();
}

function work_timeout(p_id)
{
    console.log("timeout");
    channel.publish('player', {gain : [{id : p_id, value : 100}]} );
}

var TIMEOUT_WORK=2000;
var TIMEOUT_STEAL=2500;

function player_action(req, res, next) {
    var load=req.params;
    var cookies = req.cookies;
    var g_id = cookies['g_id'];
    var p_id = cookies['p_id'];
    g_players_infos[p_id]["action"]= load["action"];
    switch (load['action']) {
        case "move":
            g_players_infos[p_id]["pos"]= load["planet_id"];
            channel.publish('player', { move : {id : p_id, score: 0, planet_id: load["planet_id"], action : 'work' }} );
            console.log("message sent");
            g_players_infos[p_id]["time_id"] && clearTimeout(g_players_infos[p_id]["time_id"])
            console.log("test");
            g_players_infos[p_id]["time_id"] = setTimeout(work_timeout, TIMEOUT_WORK, p_id);
            console.log("start timers");
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

    var p_info = g_players_infos[p_id] ;
    res.send({g_id : g_id, p_id :p_id ,
        'info': p_info });
    return next();
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


var client = mubsub(conString);
var channel = client.channel('test');


server.get('/sse', function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(0x7FFFFFFF);
  var cookies = req.cookies;
  var g_id = cookies['g_id'];
  var p_id = cookies['p_id'];

  var messageCount = 0;
  var subscriber = client.channel('test');
  //var subscriber = channel;

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
  console.log('listening: %s\n\n', server.url);
});

