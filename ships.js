var mongodb = require('mongodb');
var mubsub = require('mubsub');


function Players(collection)
{
	this.collection = collection;
}
function Planets(collection)
{
	this.collection = collection;
}

Planets.prototype.get_all = function(g_id, cb) {
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


Planets.prototype.get = function(g_id, planets_id, cb) {
	this.get_all(g_id, function(err, planets) {
		cb(err, planets[planets_id]);
	});
};

Players.prototype.setPos= function(g_id, p_id, planet_id, cb) {
	this.db
};

Players.prototype.setAction = function(g_id, p_id, action, cb) {

};


function Game()
{
	this.db = null ;

}

Game.prototype.connect = function(uri, cb)
{
	var self = this;

	mongodb.MongoClient.connect(uri, function(err, db) {
		if (err)
			cb(err);
		self.db = db;
		var client =  mubsub(uri); /* why with mubsub(db); the next line crash */
		self.channel = client.channel('ships_channel');
/*
		var collec_player = db.collection('ships_player');
		var collec_planet = db.collection('ships_planet');
		self.players = new Players(collec_player);
		self.planets = new Planets(collec_planet);
*/
		cb(null);
	});

}

module.exports = new Game();
