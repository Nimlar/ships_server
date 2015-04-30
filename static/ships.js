var Width = document.getElementById('svg').offsetWidth;
var Height = document.getElementById('svg').offsetHeight;


function Ships(color)
{
    this.pos=[0,0];
    this.prev=[0,0];
    this.color=color;

}

Ships.prototype.prepare_move = function()
{
    //console.log("prepare move "+ this.color);
    if (this.next_planet!=this.planet)
    {
        this.to_planet(this.next_planet);
    }else {
        this.rotate();
    }
    if (this.img === undefined) {
        var that=this;
        Snap.load("fleche.svg",
           function(e) {
                var f=e.select("g"); /* get the internal data of svg */
                f.select("#center").attr({fill: this.color});
                s.append(f);
                this.img=f;
                this.move();
           }, this);
    } else {
        this.move();
    }
}
Ships.prototype.move = function()
{
    //console.log("move "+ this.color);
    var x0=this.prev[0]*Width;
    var y0=this.prev[1]*Height;
    var x1=this.pos[0]*Width;
    var y1=this.pos[1]*Height;

    var t=new Snap.Matrix();
    t.translate(x1, y1);
    t.rotate(this.angle,0,0);
    that=this;
    this.img.animate({transform :t}, this.time, mina.linear, that.prepare_move.bind(that));
}

Ships.prototype.gain = function(val){
    var sText = s.text(0, 0, val).attr({ fontSize: '100px', "text-anchor": "middle", "fill": this.color });

    /* create the path to follow while animation */
    var p1x,p1y,cx,cy,p2x,p2y;
    var dx, dy;
    p1x=this.planet.pos[0]*Width;
    p1y=this.planet.pos[1]*Height;
    var bbox=this.img.getBBox();
    p2x=bbox.cx;
    p2y=bbox.cy;

    /* normal calculation : http://stackoverflow.com/questions/1243614/how-do-i-calculate-the-normal-vector-of-a-line-segment */
    dx=p2x-p1x;
    dy=p2y-p1y;
    /* normal vectors are (dy, -dx) and  (-dy, dx) */
    /* we want the one that go up, so with an y component <=0 */
    if(dx>=0) {
        dx=-dx;
    } else {
        dy=-dy;
    }
    /* the normal vector is the same size as p1 to p2, we want it 2 times bigger so*/
    cx=p1x+dx/2+ dy* 2
    cy=p1y+dy/2+ dx* 2

//    var t=s.path("M"+p1x+","+p1y +" Q"+ cx +","+ cy +","+ p2x +","+p2y)
//    s.append(t);
    pathStr="M"+this.planet.pos[0]*Width+"," + this.planet.pos[1]*Height+"q10,10,10,10"
    var timing = 800;
    Snap.animate( 0, 2, function( value ) {
        var dot = Snap.path.findDotsAtSegment(p1x,p1y,cx,cy,cx,cy,p2x,p2y,value/2);
        sText.transform('t'+ dot.x +',' + dot.y );
        if (value <1) {
            sText.attr({ 'font-size': value * 10 +10 });      // Animate by font-size
        } else {
            sText.attr({ 'font-size': (2-value) * 10 +10});      // Animate by font-size
        }
    }, timing, mina.elactic, function() { sText.remove() } );

}
Ships.prototype.lost = function(val){
    /* create the path to follow while animation */
    var bbox=this.img.getBBox();
    p1x=bbox.cx;
    p1y=bbox.cy;

    var sText = s.text(p1x, p1y+20, val).attr({ fontSize: '20px', "text-anchor": "middle", "fill": this.color });
    var timing = 800;
    Snap.animate( 0, 1, function( value ) {
        sText.transform('t0,'+ value*20 );
        sText.attr({ 'opacity': 1-value });      // Animate by font-size
    }, timing, mina.easeout, function() { sText.remove() } );

}

Ships.prototype.to_planet = function(planet)
{
    //console.log("to planet "+ this.color);
    this.prev[0]=this.pos[0];
    this.prev[1]=this.pos[1];
    this.planet=planet;
    this.next_planet=planet;

    this.angle=Snap.angle(planet.pos[0]*Width, planet.pos[1]*Height, this.prev[0]*Width, this.prev[1]*Height);
    var angle=Snap.rad(this.angle);
    this.pos[0]=planet.pos[0]-planet.size*Math.cos(angle)/Width;
    this.pos[1]=planet.pos[1]-planet.size*Math.sin(angle)/Height;
    this.time = 1000;
}

Ships.prototype.rotate = function()
{
    //console.log("rotate "+ this.color);
    this.angle+=10;
    var angle=Snap.rad(this.angle);
    this.pos[0]=this.planet.pos[0]-this.planet.size*Math.cos(angle)/Width;
    this.pos[1]=this.planet.pos[1]-this.planet.size*Math.sin(angle)/Height;
    this.time=100+Math.floor(Math.random() *400);
}



