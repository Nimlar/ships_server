var s = Snap("#svg");
var ships=[];
var planets;

function add_ship(id, planet_id)
{
    console.log("add player "+id);
    console.log("on planet "+planet_id);
    ships[id] = new Ships(id);
    ships[id].next_planet = planets[planet_id];
    ships[id].prepare_move();
}
function eventMessage(e)
{
    var data = JSON.parse(e.data);
    console.log(data);
    console.log(data.move);
    if (data.move) {
        var id = data.move.id;
        var planet_id = data["move"]["planet_id"];
        if ( ships[id] == undefined) {
            add_ship(id, planet_id);
        } else {
            ships[id].next_planet = planets[planet_id];
        }
    }
    if (data["gain"]) {
        console.log("start");
        for(var i = 0 ; i < data["gain"].length ; i++){
            console.log("ici");
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




function touch_handler(ev)
{
    var planet_id= this.data("index");
    var data =  {action: "move", planet_id : planet_id };
    console.log("will send:");
    console.log(data);
    Snap.ajax(server + "/game/p/action", data);


    ev.preventDefault();
    return false;
}


g_id="55a8001cea2132237c54034f"

$.getJSON("/game/"+g_id +"/p/new", function(data) {
    console.log(data);
    var p_id=data["id"];
    console.log("p_id =", p_id);
    $.getJSON("/game/status", function(stat) {
        planets=stat["planets"];
        var players=stat["players"] || [];
        for(i=0;i<planets.length;i++) {
            planets[i].img=s.circle(planets[i].pos[0]*Width, planets[i].pos[1]*Height, planets[i].size*(Math.random()+.5))
            .attr({
                fill: "#bada55",
                stroke: "#000",
                strokeWidth: i
            })
            .data("index", i)
            .touchend(touch_handler)
            .mouseup(touch_handler);
        }
        console.log(players);
        console.log(planets);
        //display existing player
        for (var i = 1; i < players.length ; i++) {
            console.log("players["+i+"][\"id\"]"+ players[i]["id"])
            add_ship(players[i]["id"], players[i]["planet_id"]);
        }
    });

    var source = new EventSource('/sse');
    source.addEventListener('message', eventMessage, false);

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
