var s = Snap("#svg");
var ships=[];
var planets;

s.touchend(space_touch_handler)
 .mouseup(space_touch_handler);

function add_ship(id, planet_id)
{
    ships[id] = new Ships(id);
    ships[id].next_planet = planets[planet_id];
    ships[id].prepare_move();
}
function eventMessage(e)
{
    console.log("eventMessage");
    var data = JSON.parse(e.data);
    console.log(data);
    if (data.move) {
        var id = data.move.id;
        var planet_id = data["move"]["planet_id"];
        if (planet_id) {
            if ( ships[id] == undefined) {
                add_ship(id, planet_id);
            } else {
                ships[id].next_planet = planets[planet_id];
                ships[id].next_coord=undefined;
            }
        } else { /* move without planet_id*/
            var coord = data["move"]["coord"];
            ships[id].next_planet = undefined;
            ships[id].next_coord=[parseFloat(coord[0]),parseFloat(coord[1])] ;
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



function space_touch_handler(ev)
{
    var coord = [ev.clientX/svgdiv.width, ev.clientY/svgdiv.height ];
    console.log("space_touch_handler")
    var data =  {action: "move_to_space", X : coord[0], Y : coord[1] };

    Snap.ajax(server + "/game/p/action", data);

    ev.preventDefault();
    ev.stopPropagation()
    return false;
}

function planet_touch_handler(ev)
{
    console.log("planet_touch_handler")
    var planet_id= this.data("index");
    var data =  {action: "move_to_planet", planet_id : planet_id };
    Snap.ajax(server + "/game/p/action", data);

    ev.preventDefault();
    ev.stopPropagation()
    return false;
}


function reload_status(game_id)
{
    $.getJSON("/game/status", function(stat) {
        planets=stat["planets"];
        var players=stat["players"] || [];
        for(i=0;i<planets.length;i++) {
            planets[i].img=s.circle(planets[i].pos[0]*svgdiv.width, planets[i].pos[1]*svgdiv.height, planets[i].size)
            .attr({
                fill: "#bada55",
                stroke: "#000",
                strokeWidth: i
            })
            .data("index", i)
            .touchend(planet_touch_handler)
            .mouseup(planet_touch_handler);
        }
        //display existing player
        for (var i = 0; i < players.length ; i++) {
            add_ship(players[i]["id"], players[i]["planet_id"]);
        }
    });

    var source = new EventSource('/sse/'+game_id);
    source.addEventListener('message', eventMessage, false);


}


// screen.orientation.lock("landscape");
if (  (getParameterByName("game_id") === readCookie("g_id"))
    && readCookie("g_id") ) {
//same game but reload
    game_id=getParameterByName("game_id")
    console.log("reload game "+ game_id);
    reload_status(game_id)
} else {
    game_id=getParameterByName("game_id")
    console.log(" new player for "+ game_id);
    $.getJSON("/game/" + game_id +"/p/new", function(data) {
        //var p_id=data["id"];

        reload_status(game_id)
    });
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
