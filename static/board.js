var s = Snap("#svg");
var ships=[];
var planets;


function add_ship(id, planet_id)
{
    ships[id] = new Ships(id);
    ships[id].next_planet = planets[planet_id];
    ships[id].prepare_move();
}

function eventMessage(e)
{
    var data = JSON.parse(e.data);
    if (data["move"]) {
        var id = data["move"]["id"];
        var planet_id = data["move"]["planet_id"];
        if ( ships[id] == undefined) {
            add_ship(id, planet_id);
        } else {
            ships[id].next_planet = planets[planet_id];
        }
    }
    if (data["gain"]) {
        for(var i = 0 ; i < data["gain"].length ; i++){
            var id = data["gain"][i]["id"];
            var val = data["gain"][i]["value"];
            ships[id].gain(val);
        }
    }
    if (data["lost"]) {
        for(var i = 0 ; i < data["lost"].length ; i++){
            var id = data["lost"][i]["id"];
            var val = data["lost"][i]["value"];
            ships[id].lost(val);
        }
    }
}

//var server="http://miners-in.space"
var server="http://localhost:4976"

function reload_status(game_id)
{
    $.ajax({dataType: "json",
           url: server + "/game/status",
//           xhrFields: { withCredentials: false },
           success: function(stat) {
        planets=stat["planets"];
        var players=stat["players"] || [];
        for(i=0;i<planets.length;i++){
            planets[i].img=s.circle(planets[i].pos[0]*svgdiv.width, planets[i].pos[1]*svgdiv.height, planets[i].size);
            planets[i].img.attr({
                fill: "#bada55",
                stroke: "#000",
                strokeWidth: i
            });
        }
        //display existing player
        for (var i = 0; i < players.length ; i++) {
            add_ship(players[i]["id"], players[i]["planet_id"]);
        }

        var player_url = server + '/player.html?game_id='+game_id ;
        qr.canvas({
            canvas: document.getElementById('newplayer'),
            size : 10,
            value: player_url,
        });
        $('#newplayer').wrap(function() {
            return "<a href='" + player_url +"'></a>";
        });
        var source = new EventSource('/sse/'+game_id);
        source.addEventListener('message', eventMessage, false);

    }});
}

if (!readCookie("g_id") || getParameterByName("force") )
{
    $.getJSON(server + "/game/new", function(data) {
        var g_id=data["game_id"];
        reload_status(g_id)
    });
} else {
    reload_status(readCookie("g_id"))
}


function move_all(){
    for(i=0;i<ships.length;i++){
        var dest = planets[Math.floor((Math.random() * planets.length))];
        ships[i].next_planet=dest;
    }
}

function apply_all(){
    for(i=0;i<ships.length;i++){
        ships[i].prepare_move();
    }
}
function gain_all(){
    for(i=0;i<ships.length;i++){
        ships[i].gain(Math.floor((Math.random() * 2000)));
    }
}
function lost_all(){
    for(i=0;i<ships.length;i++){
        ships[i].lost(Math.floor((Math.random() * 1000)));
    }
}



//event_one();
