var redis = require("redis"),db = redis.createClient();
var a = require('./ships');
var restify = require('restify');
var cookieParser = require('restify-cookies');

var name="ship"


var server = restify.createServer();

function game_new(req, res, next) {
    db.incr(name + ":g_id",
            function (err, res) {
            if (err) {
                next(err);
            }
            // TODO crete planets
            res.send({'game_id': res});
            return next();
    });
}

function player_new(req, res, next) {
    var g_id = req.params.game_id;
    
    this.db.incr(name +":"+ g_id + ":p_id", function(err, res) {
        if(err) {
            next(err);
        }
        res.setCookie('p_id', res);
        res.setCookie('g_id', g_id);
        /* TODO get planets from g_id */
        /* TODO select start planets randomly */
        /* should send planets + start planet*/
        /* p_id, g_id are in cookies */
        res.send({'planets' : [], 'pos' : 0 });
        return next();
    });
}

function player_action(req, res, next) {
    var g = new a.Game(db);
    var load=JSON.parse(req.body);
    var cookies = req.cookies;
        switch (load['action']) {
        case "move":
		planet = load['planet'];
		
		break;
        case "steal":
        case "work":
    return next();
}

function player_status(req, res, next) {
    var g = new a.Game(db);
    g.set_id(req.params.game_id, function(err, val) {
        g.getInfoPlayer(req.params.p_id, function(err, p_info){
            res.send({'game_id' : g.id, 'p_id' :req.params.p_id ,
                      'info': p_info });
            next();
	});
    });
}

server.use(CookieParser.parse) 
      .use(restify.fullResponse())
      .use(restify.bodyParser())
      .use(restify.CORS({
    origins: ['https://toromanoff.org'],   // defaults to ['*']
    credentials: true,                  // defaults to false
    headers: ['x-foo']                 // sets expose-headers
}));

server.get('/game/new', game_new);
server.get('/game/:game_id/status', game_status);
server.get('/game/:game_id/p/new', player_new);
server.get('/game/:game_id/p/:p_id', player_status);
server.post('/game/:game_id/p/:p_id/action', player_action);


function create_see_function(list_event)
{
  return function(req, res) {
  // let request last as long as possible
  req.socket.setTimeout(Infinity);

  var messageCount = 0;
  var subscriber = redis.createClient();

  for(i=0;i<list_event.length;i++)
     subscriber.subscribe(list_event[i]);
  }

  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {
    messageCount++; // Increment our message count

    res.write('id: ' + messageCount + '\n');
    res.write("data: " + message + '\n\n'); // Note the extra newline
  });

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
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
}

server.get('/sse_game', create_see_function(['game']) );
server.get('/sse_player', create_see_function(['game']) );


server.get('/fire-event/:event_name', function(req, res) {
  db.publish( 'updates', ('"' + req.params.event_name + '" page visited') );
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('All clients have received "' + req.params.event_name + '"');
  res.end();
});


server.listen(process.env.PORT, process.env.IP, function() {
  console.log('listening: %s', server.url);
});

