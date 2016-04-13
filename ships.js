var mongodb = require('mongodb');
var mubsub = require('mubsub');

var NB_PLANETS=9;

function getRandom(min, max) {
    return (Math.random() * (max - min )) + min;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function Game()
{
	this.db = null ;
	this.ships = null ;
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

        db.createCollection('ships', function( err, collection) {
            if (err)
                cb(err);
            self.ships = collection;
            cb(null);
        });
    });
};

Game.prototype.get_new_id = function(cb)
{
    /* create planets fields */
    var planets=[];
    var nb_planets = NB_PLANETS;
    for (i = 0; i < nb_planets; i++) {
        planets.push({ pos : [getRandom(.08  ,.92), getRandom(.08  ,.92)], size:15*(Math.random()+.5)});
    }
    game_id = new mongodb.ObjectID();
    this.ships.insert( { _id : game_id, planets : planets, players : [] },
                      function(err, coll) {
                          if (err)
                              cb(err);
                          cb(null, game_id);
                      });

};

Game.prototype.get_status = function(g_id, cb)
{
    this.ships.findOne( {_id : mongodb.ObjectId(g_id) }, function(err, item) {
        if(err)
            cb(err);

        var planets = item.planets;
        var players = item.players;
        cb(null, planets, players);
    });
};

Game.prototype.player_new = function (g_id, cb)
{
        var p_id = new mongodb.ObjectID();
        var planet_id = getRandomInt(0, NB_PLANETS);
        var p_info= {id : p_id, score : 0, planet_id : planet_id, action : 'idle' };
        self=this;
        this.ships.update( { _id : mongodb.ObjectId(g_id) },
                                 { $push : {players : p_info }  },
                                 function(err) {
                                     if (err)
                                         cb(err);
                                     self.channel.publish('player', { move : p_info } );
                                     cb(null, p_id);
                                 });
};

Game.prototype.player_action = function(g_id, p_id, load, cb) {

    switch (load['action']) {
        case "move":
            this.ships.update({ _id : mongodb.ObjectId(g_id), "players._id" : mongodb.ObjectId(p_id)  },
                              { $set : {"players.$.action" : load['action'] ,
                                        "players.$.planet_id" : load["planet_id"]} },
                              function(err) { if(err) console.log(err) } );
            this.channel.publish('player', {game_id: g_id , move: {id : p_id, score: 0, planet_id: load["planet_id"], action : 'work' }} );
            break;
        case "steal":
            break;
        case "harvest":
            break;
    }
    cb(null);
};

Game.prototype.player_status = function(g_id, p_id, cb) {
    this.ships.findOne( {_id : mongodb.ObjectId(g_id), "players._id": mongodb.ObjectId(p_id) }, {_id:0, "players.$":1}, function(err, item) {
        if(err)
            cb(err);
        cb(null, item.players[0]);
    });
};

module.exports = new Game();
