/**************************************************
Copyright www.ginifab.com, all right reserved.
**************************************************/
function getAverageRGB(imgEl) {

    var blockSize = 5, // only visit every 5 pixels
        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;

    if (!context) {
        return defaultRGB;
    }
    
    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    context.drawImage(imgEl, 0, 0);
    
    try {
        data = context.getImageData(0, 0, width, height);
    } catch(e) {console.log(e);
        /* security error, img on diff domain */
        return defaultRGB;
    }
    
    length = data.data.length;

    while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
    }

    // ~~ used to floor values
    rgb.r = ~~(rgb.r/count);
    rgb.g = ~~(rgb.g/count);
    rgb.b = ~~(rgb.b/count);

    return rgb;

}

function angle_points(canvas){
  this.canvas=canvas;
  this.ctx=this.canvas.getContext("2d");
  this.cpX=0;
  this.cpY=0;
  this.setCenterPoint=function(x,y){this.cpX=x;this.cpY=y;}
  this.points=[];
  this.line_color='#ff6021';
  this.has_close_to=function(x,y,dis){
    for(i=0;i<this.points.length;i++){
      p=this.points[i];
      if ((p.x > x-dis)&&(p.x < x+dis)&&(p.y > y-dis)&&(p.y < y+dis)){
        return true;
      }
    }
    return false;
  };
  this.get_pin=function(x,y){
    for(i=0;i<this.points.length;i++){
      p=this.points[i];
      if ((p.x > x-20)&&(p.x < x+8)&&(p.y > y-5)&&(p.y < y+38)){
        return p;
      }
    }
    return null;
  };
  this.remove=function(pin){
    for(i=0;i<this.points.length;i++){
      if (this.points[i]===pin){
        this.points.splice(i,1);
        return true; 
      }
    }
    return false;
  };
  this.add=function(x,y){
    if (this.has_close_to(x,y,5)){
      return false;
    } else {
      this.points.push({'x':x,'y':y,'degree':0,'radian':0,'time':new Date().getTime()});
      this.draw_pushpin(x,y);
      return true;
    }
  };
  this.draw_pushpin=function(x,y){
    var ctx=this.canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x,y-25);
    ctx.lineTo(x+12,y-22);
    ctx.closePath();
    ctx.lineWidth =1;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#DDDDDD';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x+7,y-24,10,0,2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#FFCC00';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(this.cpX,this.cpY);
    ctx.lineWidth=2;
    ctx.strokeStyle=this.line_color;
    ctx.stroke();
  };
  this.calculate_degrees=function(){
    this.points.sort(function(a,b){return a.x-b.x;});
    for(i=0;i<this.points.length;i++){
      pin=this.points[i];
      radians=Math.atan2(pin.x-this.cpX,this.cpY-pin.y);
      pin.radian=Math.atan2(pin.y-this.cpY,pin.x-this.cpX);
      if (pin.y-this.cpY<0 ){pin.radian=pin.radian+2*Math.PI;} 
      pin.degree=radians*180/Math.PI+90; 
      if (pin.degree<0){pin.degree+=360;}
    }
  };
  this.get_coordinate=function(distance,degree){
    x=this.cpX + distance * Math.cos((degree-180)*Math.PI/180);
    y=this.cpY + distance * Math.sin((degree-180)*Math.PI/180);
    return {'x':x,'y':y};
  };
  this.draw_degrees=function(){
    this.calculate_degrees();//recalculate before drawing
    var ctx=this.canvas.getContext("2d");
    for(i=1;i<this.points.length;i++){
      pin1=this.points[i-1];
      pin2=this.points[i];
      deg=Math.round(Math.abs(pin2.degree-pin1.degree));
      deg2=Math.round((pin2.degree+pin1.degree)/2);
      if (deg<10){r=10;} 
      else if (deg<100){r=13;}
      else {r=16;}
      if (deg<63){hTxt=30+(63-deg);}
      else if (deg>70){hTxt=30-(deg-70)/10;if(hTxt<16){hTxt=16;} }
      else {hTxt=30;}
      
      pTxt=this.get_coordinate(hTxt,deg2);      
      ctx.beginPath();
      ctx.moveTo(pTxt.x,pTxt.y);
      ctx.arc(pTxt.x,pTxt.y,r,0,Math.PI*2);
      ctx.fillStyle='#FFE4B5';
      ctx.stroke();
      ctx.fill();
      //ctx.endPath();
      
      ctx.beginPath();
      ctx.save();
      ctx.translate(pTxt.x,pTxt.y);
      ctx.rotate(-(90-deg2)*Math.PI/180);

      ctx.font="15px Arial";
      ctx.fillStyle=invertColor(this.line_color);
      ctx.textBaseline="middle"; 
      ctx.fillText(deg+'°',0,0);
      ctx.restore();
      
    }
  };
  this.redraw=function(){
    for(i=0;i<this.points.length;i++){
      this.draw_pushpin(this.points[i].x,this.points[i].y);
    }
    this.draw_degrees();
  };  
}

function rotate_cycles(ctx){
  this.cycle1={x:1,y:1,focused:false}
  this.cycle2={x:1,y:1,focused:false}
  this.focused_cycle=null;
  this.highlighting=false;
  this.cycle_radius=0;
  this.set_values=function(cpX,cpY,angle_rotate,radius){
    this.cycle_radius=radius*0.091;
    distance=radius*0.80;
    var radian=((angle_rotate-8) * Math.PI) / 180;
    this.cycle1.x=cpX+distance*Math.cos(radian);
    this.cycle1.y=cpY+distance*Math.sin(radian);
    radian=((angle_rotate-172) * Math.PI) / 180;
    this.cycle2.x=cpX+distance*Math.cos(radian);
    this.cycle2.y=cpY+distance*Math.sin(radian);
  }
  this.in_cycles=function(x,y){
    var dis1=Math.sqrt(Math.pow(this.cycle1.x-x,2)+Math.pow(this.cycle1.y-y,2));
    if (dis1<this.cycle_radius){
      this.focused_cycle=this.cycle1;
      return true;} 
    var dis2=Math.sqrt(Math.pow(this.cycle2.x-x,2)+Math.pow(this.cycle2.y-y,2));
    if (dis2<this.cycle_radius){
      this.focused_cycle=this.cycle2;
      return true;}
    this.focused_cycle=null;  
    return false;  
  }
  this.hightlight_cycle=function(){
    if (this.focused_cycle!=null && this.highlighting==false){
      ctx.beginPath();
      ctx.arc(this.focused_cycle.x,this.focused_cycle.y, this.cycle_radius, 0, 2 * Math.PI);
      ctx.globalAlpha=0.8;
      ctx.fillStyle = "#FFC170";
      ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle = "#000000";
      var font_size=Math.round(this.cycle_radius/2);
      ctx.font=font_size+"px Arial";
      ctx.textAlign="center";
      ctx.fillText("Drag",this.focused_cycle.x,this.focused_cycle.y-font_size*0.8);
      ctx.fillText("To",this.focused_cycle.x,this.focused_cycle.y+font_size*0.3);
      ctx.fillText("Rotate",this.focused_cycle.x,this.focused_cycle.y+font_size*1.3);
      ctx.stroke();
      this.highlighting=true;
    }
  }
  this.stop_highlighting=function(){
    this.highlighting=false;
  }
}

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    } else {return hex;}
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}