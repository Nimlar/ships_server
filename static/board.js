var s = Snap("#svg");
var color=["red",
        "yellow",
        "green",
        "blue",
        "gray" ];
var ships=[];
var planets;


function get_color(num)
{
    return color[num % color.length];
}

function add_ship(id, planet_id)
{
    console.log("add player"+id);
    ships[id] = new Ships(get_color(id));
    ships[id].next_planet = planets[planet_id];
    ships[id].prepare_move();
}

function eventMessage(e)
{
    var data = JSON.parse(e.data);
    console.log(data);
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


$.getJSON("http://miners-in.space/game/new", function(data) {
    console.log(data);
    var g_id=data["game_id"];
    console.log("game_id =", g_id);
    $.getJSON("http://miners-in.space/game/status", function(stat) {
        planets=stat["planets"];
        var players=stat["players"] || [];
        for(i=0;i<planets.length;i++){
            planets[i].img=s.circle(planets[i].pos[0]*Width, planets[i].pos[1]*Height, planets[i].size*(Math.random()+.5));
            planets[i].img.attr({
                fill: "#bada55",
                stroke: "#000",
                strokeWidth: i
            });
        }
        //display existing player
        for (var i = 1; i < players.length ; i++) {
            add_ship(players[i]["id"], players[i]["planet_id"]);
        }

        qr.canvas({
            canvas: document.getElementById('newplayer'),
            size : 10,
            value: 'http://miners-in.space/player.html&game_id='+g_id
        });

        var source = new EventSource('/sse');
        source.addEventListener('message', eventMessage, false);

    });
});



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