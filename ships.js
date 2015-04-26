var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var mubsub = require('mubsub');




function planets_get_all(g_id, cb) {
	cb(null, [{ pos : [.1  ,.3  ], size:10},
			{ pos : [.3  ,.1  ], size:10},
			{ pos : [.9  ,.7  ], size:10},
			{ pos : [.7  ,.9  ], size:10},
			{ pos : [.5  ,.5  ], size:10},
			{ pos : [.78  ,.86  ], size:10},
			{ pos : [.14  ,.23  ], size:10},
			{ pos : [.36  ,.48  ], size:10},
			]);
};


function planets_get(g_id, planets_id, cb) {
	planets_get_all(g_id, function(err, planets) {
		cb(err, planets[planets_id]);
	}
}

function player_setPos(g_id, p_id, planet_id, cb)
{
	
}
function player_setAction(g_id, p_id, action, cb)
{

}


players = {
	setPos    : player_setPos,
	setAction : player_setAction
}

planets = {
	get_all : planets_get_all,
}

function Game(host, port)
{
	this.db= new Db('node-mongo-employee', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
	this.db.open(function(){});

	this.players = new Players();
	this.planets = new Planets();

	var client = mubsub('mongodb://localhost:27017/mubsub_example');
	this.channel = client.channel('test');
}

exports.players=players;
exports.planets=planets;
exports.channel = channel;


exports.game = game;
