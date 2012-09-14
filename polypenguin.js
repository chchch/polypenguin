$(document).ready(function() {
	csize = {h:500,w:600};
	cpos = {x:0,y:0};
	fps = 16;
	ordering = [3,4,2,5,1,6,0,7];
	debug = false;
	god_mode = false;
	is_chrome = /chrome/.test( navigator.userAgent.toLowerCase() );
	var params = getParams();
	if(params["debug"]) debug = true;
	if(params["god"] == "dead") god_mode = true;
			
	sounds = [];
	r_keys = ["59","76","75","74"];
	l_keys = ["70","68","83","65"];
	for(var k=0;k<4;k++){
		sounds[r_keys[k]] = new PSound(9/8 * (k+1),1);
		sounds[l_keys[k]] = new PSound(9/8 * (k+5),-1);
	} 
	sounds["186"] = sounds["59"];

	animator = new Animator();
	
	game = new PGame();
	game.init();

	$(document).keydown(function(e) {return KeyCapture(e)});
	
})

getParams = function() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

KeyCapture = function(e) {
	var k = e.keyCode;
/*	if(game.menus.active) {
		var id = game.menus.active;
		if(k == 38) { // Up
		}
		if(k == 40) { // Down
		}
		if(k == 13) { // Enter
		}
		return false;
	} */
	if(k == 32) { // spacebar
		if(animator.active) animator.stop();
		else
			game.start();
			
	}
	else {
		var penguarray = [65,83,68,70,74,75,76,59]; // A,S,D,F,J,K,L,;
		var penguindex = $.inArray(k,penguarray);
		if(penguindex != -1 || k == 186) { // 186 is ; in some browsers 
			if(k == 186) penguindex = 7;
			game.pengus[penguindex].jump();
			if(is_chrome) sounds[k].play();
			else
				sounds[k].cloneNode(false).play();
			return false;
		}
	}
}

PSound = function(n,pan) {
	var sine = []; 
	for (var i=0; i<1000;i++) {
		ii = 0x8000+Math.round(0x7fff*Math.sin(i/n));
		if(pan == 1) sine.push(0); 
		sine.push(ii);
		if(pan == -1) sine.push(0);
	}
	var wave = new RIFFWAVE();
	wave.header.sampleRate = 22000;
	wave.header.numChannels = 2;
	wave.header.bitsPerSample = 16;
	wave.Make(sine);
	var audio = new Audio(wave.dataURI);
	return audio;
} 

PGame = function() {
	var self = this;
	this.pengus = [];
	this.fields = [];
	this.levels = [
		[2],
		[2,3],
		[2,3,4],
		[2,3,4],
		[2,3,4,5],
		[2,3,4,5],
		[2,3,4,5,7],
		[2,3,4,5,7],
		[2,3,4,5,7,6],
		[2,3,4,5,7,6],
		[2,3,4,5,7,6,9],
		[2,3,4,5,7,6,9],
		[2,3,4,5,7,6,9,11],
		[2,3,4,5,7,6,9,11]
			];
	this.levelcount = 0;
	this.level = this.levels[this.levelcount];
	this.poopcount = 0;

	this.init = function() {
		$("#game").css("width", csize.w + "px");
		$("#game").css("height", csize.h + "px");
		$("#game").css("background", "black");
		$("#game").css("overflow", "hidden");
		
		var poopimg = new Image();
		poopimg.src = "poop.png";
		poopimg.onload = function() {
			game.fields[0] = new PField(cpos,csize,"#99ccff",poopimg);
			game.fields[1] = new PField({x:cpos.x,y:cpos.y+csize.h},csize,"#99ccff",poopimg);
			$("#game").append(game.fields[0].CObj);
			$("#game").append(game.fields[1].CObj);
		}
		
		pwidth = 50;
		var penguimg = new Image();
		penguimg.src = "pengu.png";
		penguimg.onload = function() {
			var offset = (csize.w/8 - pwidth)/2;
			for(n=0;n<8;n++) {
				var newpengu = new PPengu(offset + csize.w/8*n,penguimg);
				self.pengus.push(newpengu);
				newpengu.init();
				$("#game").append(newpengu.Div);
			}
		}
		
//		self.menus = new Object();
	
/*      self.statusbar = new MBox(csize.w-5,14,{x:5,y:5});
        self.statusbar.CObj.style.border = "1px solid red";
        self.statusbar.CObj.style.fontSize = "14px";
        self.statusbar.CObj.style.textAlign = "left";
        $("#game").append(self.statusbar.CObj); */
		}
	this.start = function() {
		self.fields[1].draw(self.level);
		var ll = self.level.length;
		while(ll--) {
			self.pengus[ordering[ll]].show();
		}
		animator.start();
	}
	this.lose = function() {
		animator.stop();
	}
	
	this.iter = function() {
		self.poopcount++;
		if(self.poopcount == 2) {
			self.levelup();
			self.poopcount = 0;
		}
	}
	this.levelup = function() {
		self.levelcount++;
		if(self.levelcount < self.levels.length)
			self.level = self.levels[self.levelcount];
		var pp = 8;
		while(pp--)
			self.pengus[pp].hide();
		var ll = self.level.length;
		while(ll--) 
			self.pengus[ordering[ll]].show();
	}
}

MBox = function(w,h,o) {
	this.CObj = document.createElement("div");
	if(o) {
		this.CObj.style.position = "absolute";
		this.CObj.style.top = o.y + "px";
		this.CObj.style.left = o.x + "px";
	}
	else {
		this.CObj.style.position = "absolute";
		this.CObj.style.left = (csize.w - w)/2 + "px";
		this.CObj.style.top = (csize.h-h)/2 + "px";
	}
	this.CObj.style.width = w + "px";
	this.CObj.style.height = h + "px";
	this.CObj.style.color = "white";
	this.CObj.style.fontSize = "30px";
	this.CObj.style.fontFamily = "Courier";
	this.CObj.style.fontWeight = "bold";
	this.timer = null; 
	this.visible = true;

	var self = this;
	this.write = function(s) {
		self.clear();
		self.CObj.innerHTML = s;
	}
	this.prepend = function(m) {
		self.write(m + self.CObj.innerHTML);
	}
    this.append = function(m) {
        self.write(self.CObj.innerHTML + m);
    }
	this.clear = function(t) {
		if(self.timer) clearTimeout(self.timer);
		if(t) self.timer = setTimeout(function() {self.clear()},t);
		else self.CObj.innerHTML = "";
	} 
	this.hide = function() {
		self.CObj.style.visibility = "hidden";
		self.visible = false;
	}
	this.show = function() {
		self.CObj.style.visibility = "visible";
		self.visible = true;
	}
}

PField = function(pos, size, c, poopimg) {
	this.CObj = document.createElement("canvas");
	this.CObj.style.position = "absolute";
	this.CObj.style.width = size.w + 'px';
	this.CObj.width = size.w;
	this.CObj.style.height = size.h + 'px';
	this.CObj.height = size.h;
	this.pos = pos;
	this.size = size;
	this.CObj.style.top = pos.y + 'px';
	this.CObj.style.left = pos.x + 'px';
//	this.CObj.style.border = "1px solid red";
	this.CObj.style.backgroundColor = c;
	this.Ctx = this.CObj.getContext('2d');
//	this.speed = 2;
	this.active = true;
	this.poopimg = poopimg;

	this.lanes = [];
	var xoffset = (size.w/8 - poopimg.width)/2;
	for(var n=0;n<8;n++) {
		this.lanes[n] = new Object();
		this.lanes[n].x = Math.round(size.w/8*n+xoffset);
		this.lanes[n].y = [];
	}
	
	animator.enqueue(this);

	var self = this;

	this.draw = function(rhythms) {
		var r = rhythms.length;
		while(r--) {
			for(var n = 0;n < rhythms[r];n++) {
				var ycoord = Math.round(csize.h/rhythms[r]*n);
				self.Ctx.drawImage(self.poopimg,self.lanes[ordering[r]].x,ycoord);
				self.lanes[ordering[r]].y.push(ycoord);
			}
		}
	}
	
	self.clear = function() {
		self.Ctx.clearRect(0,0,self.size.w,self.size.h);
	}
	this.animate = function() {
		self.pos.y--;
		if(self.pos.y + csize.h == 0) {
			self.pos.y = csize.h;
			game.iter();
			self.clear(); // don't clear unless you level up
			self.draw(game.level);
		}
		self.CObj.style.top = self.pos.y + "px";
		var nn = 8;
		while(nn--) {
	
				if(self.lanes[nn].pooping) {
					self.lanes[nn].pooping--;
					if(game.pengus[nn].mode != 1) {
						game.pengus[nn].dirty += 20;
						if(game.pengus[nn].dirty > 1000) game.pengus[nn].fall();
					}
				}
				else if(game.pengus[nn].dirty) game.pengus[nn].dirty--;
				
				if(self.lanes[nn].y.length != 0) {
					if(self.lanes[nn].y[0] + self.pos.y == 100) {
						self.lanes[nn].y.shift();
						self.lanes[nn].pooping = 15;
					}
				}

		}
	}

}

PPengu = function(cpos,penguimg) {
	this.Div = document.createElement("div");
	this.CObj = document.createElement("canvas");
	var self = this;
	this.w = 50;
	this.penguimg = penguimg;
	this.h = 100;
	this.csize = csize;
	this.Div.width = this.w;
	this.Div.height = this.h;
	this.Div.style.cssText = "position: absolute; width: "+this.w+"px; height: "
		+this.h+"px; top: 0; left: "+cpos+"px; overflow: hidden";
	this.CObj.width = this.w;
	this.CObj.height = this.h;
	this.CObj.style.cssText = "position: absolute; width: "+this.w+"px; height: "
		+this.h+"px; top: 0; left: 0; visibility: hidden";
//	this.Div.style.border = "1px solid red";
//	this.CObj.style.border = "1px solid yellow";
	this.Ctx = this.CObj.getContext("2d"); 
	this.active = false;
	this.dirty = 0;
	this.frame = Math.floor(Math.random()*6);
	this.mode = 0; // 0: walking, 1: jumping, 2: dying
	this.speed = 4;
	this.jumpoffset = 0;
	this.jumpframes = [];
	this.maxjump = 5;
	for(var n=0;n<this.maxjump;n++) {
		this.jumpframes.push(6*n*(n-this.maxjump)+50);
	}
	this.prints = new PPrints(this);
	this.Div.appendChild(this.prints.CObjs[0]);
	this.Div.appendChild(this.prints.CObjs[1]);

	this.Div.appendChild(this.CObj);
	
	animator.enqueue(self);

	this.show = function() {
		self.active = true;
		self.prints.active = true;
		self.CObj.style.visibility = "visible";
	}
	this.hide = function() {
		self.active = false;
		self.prints.active = false;
		self.CObj.style.visibility = "hidden";
	}
	this.draw = function() {
		var xoffset = self.w*self.frame;
		var yoffset = self.w*self.mode;
		if(self.jumpoffset) var jumpoffset = self.jumpframes[self.jumpoffset];
		else jumpoffset = 50;
		self.Ctx.drawImage(penguimg,xoffset,yoffset,self.w,self.w,0,jumpoffset,self.w,self.w);
		
	}

	this.init = function() {
		self.draw();
	}
	this.clear = function() {
		self.Ctx.clearRect(0,0,self.w,self.h);
	}
	this.fall = function() {
		self.mode = 2;
	}	
	
	this.animate = function() {
		var max = 5;
		self.clear();
		if(self.mode == 1) {
			max = 1;
			if(self.jumpoffset < self.maxjump) self.jumpoffset++;
			else {
				self.jumpoffset = 0;
				self.mode = 0;
			}
		}
		if(self.mode == 2) {
			max = 6;
		}
		self.draw();
		if(self.frame < max) self.frame++;
		else if(self.mode == 2) game.lose();
		else self.frame = 0;
	}

	this.jump = function() {
		self.mode = 1;
	}
} 

PPrints = function(pengu) {
	var self = this;
	this.pengu = pengu;
	this.w = 50;
	this.h = 100;
	this.CObjs = [];
	this.foot = true;
	this.printcounter = 0;
	this.active = false;
	for(var n=0;n<2;n++) {
		var print = document.createElement("canvas");
		print.width = this.w;
		print.height = this.h;
		print.myVars = new Object();
		print.style.cssText = "position: absolute; width: "+this.w+"px; height:"
			+this.h+"px; left: 0";
		print.Ctx = print.getContext("2d");
//		print.style.border = "1px red solid";
		this.CObjs.push(print);
	}
	this.CObjs[0].myVars.y = 0;
	this.CObjs[0].style.top = 0;
	this.CObjs[1].myVars.y = this.h;
	this.CObjs[1].style.top = this.h+"px";

	animator.enqueue(self);
	
	this.animate = function() {
		self.printcounter++;
		var pp = 2;
		while (pp--) {
			self.CObjs[pp].myVars.y--;
			self.CObjs[pp].style.top = self.CObjs[pp].myVars.y + "px";
		}
		if(self.CObjs[0].myVars.y + self.h <= 0) {
			self.CObjs[0].myVars.y = self.h;
			self.CObjs[0].style.top = self.h + "px";
			self.CObjs[0].Ctx.setTransform(1,0,0,1,0,0);
			self.CObjs[0].Ctx.clearRect(0,0,50,100);
			self.CObjs[0].Ctx.translate(0,-10);
			self.CObjs.push(self.CObjs.shift());
		}
		if(self.printcounter == 10) {
			var Ctx = self.CObjs[1].Ctx;
			Ctx.translate(0,10);
			Ctx.save();
			if(self.pengu.mode == 0) {
				if(self.foot)
					Ctx.translate(10,0);
				else {
					Ctx.translate(40,0);
					Ctx.scale(-1,1);
				}
				if(self.pengu.dirty) 
					Ctx.fillStyle = "rgba(60,43,0,"+
						self.pengu.dirty/100+")";
//						500/self.pengu.dirty+")"; 
//					Ctx.fillStyle = "rgba(85,65,0,0.6)";
				else
					Ctx.fillStyle="rgba(0,0,0,0.2)";
				Ctx.beginPath();
				Ctx.moveTo(1, 4);
				Ctx.bezierCurveTo(2, 2, 6, 0, 8, 0);
				Ctx.bezierCurveTo(11, 2, 6, 7, 6, 7);
				Ctx.bezierCurveTo(6, 7, 5, 8, 3, 7);
				Ctx.bezierCurveTo(2, 7, 2, 4, 2, 4);
				Ctx.bezierCurveTo(2, 4, 1, 5, 1, 4);
				Ctx.closePath();
				Ctx.fill();
				Ctx.restore();
			}
			self.foot = !self.foot;
			self.printcounter = 0;
		}
	}

}
	
function Animator() {
	var self = this;
	this.timer = false;
	this.active = false;
	this.queue = [];
	this.dqueue = new Array();
	this.frame = 0;
	this.enqueue = function(AObj) {
		if(typeof AObj.speed != 'undefined') {
			if(typeof self.dqueue[AObj.speed] != 'undefined') 
				self.dqueue[AObj.speed].push(AObj);
			else {
				self.dqueue[AObj.speed] = new Array();
				self.dqueue[AObj.speed].push(AObj);
			}
		}
		else
			self.queue.push(AObj);
	}
	this.start = function() {
		if(!self.active) {
			self.active = true;
			if(!self.timer) self.animate();
		}
	}
	this.pause = function() {
		if(self.active) self.stop();
		else self.start();
	}
	this.stop = function() {
		self.active = false;
		self.timer = false;
	}
	this.clear = function() {
		self.queue = [];
	}
	this.animate = function() {
		self.timer = false;
		if(self.active) {
			var active = 0;
			for (var i=0,j=self.queue.length; i<j; i++) {
  		    	if (self.queue[i].active) {
	  	  	   		self.queue[i].animate();
  	  		  	  	active++;
  	  	  		}
			}
			var dd = self.dqueue.length;
			if(dd) {
				self.frame++;
				active++;
				var d = dd;
				while(d--) {
					if(typeof self.dqueue[d] != 'undefined' && 
					   self.frame % d == 0) {
						var n = self.dqueue[d].length;
						while(n--) {
							if(self.dqueue[d][n].active) {
								self.dqueue[d][n].animate();
							}
						}
					}
				}
				if(self.frame == dd) self.frame = 0;
			}
	   		if(active != 0) {
 	  			window.requestAnimationFrame(self.animate);
   				self.timer = true;
   			}
   			else self.stop();
   		}
	}
}

function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}

if(!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    }
}

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
}()); 
