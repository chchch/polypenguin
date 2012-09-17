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
//	game.titlescreen();

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
			game.toggle();
	}
	else {
		var penguarray = [65,83,68,70,74,75,76,59]; // A,S,D,F,J,K,L,;
		var penguindex = $.inArray(k,penguarray);
		if(penguindex != -1 || k == 186) { // 186 is ; in some browsers 
			if(k == 186) penguindex = 7;
			game.pengus[penguindex].toggle();
			if(game.visiblekeys.indexOf(penguindex) != -1)
				game.flashkey(penguindex,game.activefield,game.keyheight);
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
	this.poopcount = 0;
	this.mode = 0; // 0: titlescreen, 1: playing, 2: paused, 3: lost
	this.spritewidth = 50;
	this.keyheight = 330;

	this.calcLevels = function(arr) {
		var qq = arr.length;
		var returnarr = [];
		while(qq--) {
			var returnob = new Object();
			returnob.lanes = [];
			returnob.iter = arr[qq].iter;
			var rhythms = returnob.rhythms = arr[qq].rhythms;
			returnob.common = [];
			var allpoops = [];
			var r = rhythms.length;
			while(r--) {
				returnob.lanes[ordering[r]] = new Object();
				returnob.lanes[ordering[r]].y = [];
				for(var n = 0;n < rhythms[r];n++) {
					var ycoord = (csize.h/rhythms[r]*n + 0.5) | 0; //rounding hack
					if(allpoops.indexOf(ycoord) != -1 &&
							returnob.common.indexOf(ycoord) == -1)
						returnob.common.push(ycoord);
					returnob.lanes[ordering[r]].y.push(ycoord);
					allpoops.push(ycoord);
				}
			}
			returnarr.unshift(returnob);
		}
		return returnarr;
	}
	this.levels = this.calcLevels([
		{rhythms: [2], iter: 2},
		{rhythms: [2,3], iter: 4}, 
		{rhythms: [2,3,4], iter: 4},
		{rhythms: [2,3,4,5], iter: 4},
		{rhythms: [2,3,4,5,7], iter: 5},
		{rhythms: [2,3,4,5,7,6], iter: 6},
		{rhythms: [2,3,4,5,7,6,9], iter: 7},
		{rhythms: [2,3,4,5,7,6,9,11], iter: 8}
			]);
	this.levelcount = 0;
	this.level = this.levels[this.levelcount];

	this.init = function() {
		$("#game").css("width", csize.w + "px");
		$("#game").css("height", csize.h + "px");
		$("#game").css("background", "black");
		$("#game").css("overflow", "hidden");
		
		self.poopimg = new Image();
		self.poopimg.src = "poop.png";
		self.poopimg.onload = ImgLoaded();
			
		self.penguimg = new Image();
		self.penguimg.src = "pengu.png";
		self.penguimg.onload = ImgLoaded();

		
		}
	var imgtotal = 2;
	var imgcount = 0;
	var ImgLoaded = function() {
		imgcount++;
		if(imgcount == imgtotal) {
			game.fields[0] = new PField(cpos,csize,"bg-1.png",0);
			game.fields[1] = new PField({x:cpos.x,y:cpos.y+csize.h},csize,"bg-2.png",1);
			$("#game").append(game.fields[0].CObj);
			$("#game").append(game.fields[1].CObj);
			game.activefield = game.fields[0];

			var offset = (csize.w/8 - self.spritewidth)/2;
			for(n=0;n<8;n++) {
				var newpengu = new PPengu(offset + csize.w/8*n);
				self.pengus.push(newpengu);
				newpengu.draw(); // Firefox doesn't draw the pengu in the
								 // keytest screen on the first press for some
								 // reason; this seems to fix it
				$("#game").append(newpengu.Div);
			}
			self.titlecard = 0;
			self.titlescreen();
		}
	}

	this.toggle = function() {
		if(self.mode == 0) {
			if(self.titlescreen()) {
				self.start();
			}
		}
		else if(self.mode == 1) {
			animator.stop();
			self.story.innerHTML = "<p style='font-size:20px;font-style:normal;color: #FFFFFF'>"+
				"POLYPENGUIN PAUSE!</p><p style='color: #FFFFFF'>Press SPACEBAR to continue...</p>";
			self.story.style.visibility = "visible";
			self.overlay.style.visibility = "visible";
			self.mode = 2;
		}
		else if(self.mode == 2) {
			self.story.style.visibility = "hidden";
			self.overlay.style.visibility = "hidden";
			animator.start();
			self.mode = 1;
		}
		else if(self.mode == 3) {
			self.overlay.style.visibility = "hidden";
			self.restart();
		}
	}

	this.titlescreen = function() {
		var Ctx = self.fields[0].Ctx;
		if(self.titlecard == 0) {
			Ctx.strokeStyle = "#000000";
			Ctx.font = "normal 40px Courier";
			Ctx.textAlign = "center";
			Ctx.strokeText("POLYRHYTHM PENGUIN",csize.w/2,csize.h/2);
			self.story = document.createElement("div");
			self.story.style.cssText = "position: absolute;top:260px;margin:0 80px 0 80px;"+
				"font-family:'Courier';font-style:italic;font-size:12px;text-align:justify";
			var storytext = "TUX is a penguin who lives in the Artic Circle! He's"+
						" in big trouble! GLOBAL WARMING has had a devastating"+
						" effect on the Arctic Permafrost, uncovering MILLENIA"+
						" of Unscooped Wooly Mammoth Poop in the melting snow!"+
						" Help TUX keep his feet clean so he and his identical"+
						" clones can spread FREE SOFTWARE to SANTA'S DATA HAVEN!"+
						"<br><br>Press SPACEBAR to continue...";
			self.story.innerHTML = storytext;
			
			self.overlay = document.createElement("div");
			self.overlay.style.cssText =
				"position:absolute;width:"+csize.w+"px;height:"+csize.h+"px;"+
				"background-color: #555555;opacity: 0.5;visibility: hidden";
			$("#game").append(self.overlay);
			
			$("#game").append(self.story);
			self.titlecard++;
			return false;
		}
		if(self.titlecard == 1) {
			self.story.innerHTML = "Use these keys to help Tux and his friends"+
									" jump over the evil Wooly Mammoth Poop!"+
									" Try it!<br><br>When you're ready, press"+
									" SPACEBAR to start...";
			self.drawkeys();
			self.titlecard++;
			return false;
		}
		if(self.titlecard == 2) {
			self.story.style.visibility = "hidden";
			var clearkeys = [];
			var nn = self.level.rhythms.length;
			while(nn < 8) {
				clearkeys.push(ordering[nn]);
				clearTimeout(self.keyOuts[ordering[nn]]);
				nn++;
			}
			self.clearkeys(clearkeys);
			return true;
		}
	}
	
	this.visiblekeys = [];
	this.drawkeys = function(keys,field,height) {
		var keys = keys ? keys : [0,1,2,3,4,5,6,7];
		var Ctx = field ? field.Ctx : self.fields[0].Ctx;
		var yy = height ? height : 330;
		var kkeys = ["A","S","D","F","J","K","L",";"];
		self.clearkeys(keys,field,height);
		var offset = (csize.w/8-35)/2;
		Ctx.strokeStyle = "#222222";
		Ctx.font = "normal 18px Courier";
		Ctx.textAlign = "center";
		for(var k=0,kk=keys.length;k<kk;k++) {
			var xx = offset+csize.w/8*keys[k];
			Ctx.roundRect(xx,yy,xx+35,yy+35,3);
			Ctx.stroke();
			Ctx.strokeText(kkeys[keys[k]],csize.w/8*(1/2+keys[k]),yy+22);
			if(self.visiblekeys.indexOf(keys[k]) == -1)
				self.visiblekeys.push(keys[k]);
		}
	}
	this.keyOuts = [];
	this.flashkey = function(key,field,height) {
		if(!self.keyOuts[key]) {
			var Ctx = field ? field.Ctx : self.fields[0].Ctx;
			var yy = height ? height : 330;
			var offset = (csize.w/8-35)/2+0.5;
			var xx = offset+csize.w/8*key;
			Ctx.fillStyle = "rgba(0,0,0,0.3)";
			Ctx.fillRect(xx,yy+0.5,34,34);
			self.keyOuts[key] =
				setTimeout(function(){self.drawkeys([key],field,height);self.keyOuts.splice(key,1);},100);
		}
	}
	this.clearkeys = function(keys,field,height) {
		var keys = keys ? keys : [0,1,2,3,4,5,6,7];
		var Ctx = field ? field.Ctx : self.fields[0].Ctx;
		var yy = height ? height : 329;
		var offset = (csize.w/8-35)/2-1;
		for(var k=0,kk=keys.length;k<kk;k++) {
			var xx = offset+csize.w/8*keys[k];
			Ctx.clearRect(xx,yy,37,37);
			self.visiblekeys.splice(self.visiblekeys.indexOf(keys[k]),1);
			if(self.keyOuts[k]) self.keyOuts.splice(k,1);
		}	
	}
	this.start = function(restart) {
		var restart = restart ? restart : false;
		self.mode = 1;
		self.fields[1].draw(self.level);
		self.fields[1].active = true;
		self.fields[0].force_redraw = true;
		self.fields[0].active = true;
		
		var pp = self.pengus.length;
		while(pp--)
			self.pengus[pp].init(restart);	
		var ll = self.level.rhythms.length;
		while(ll--) {
			self.pengus[ordering[ll]].show();
		}
		
		animator.start();
	}
	this.restart = function() {
		self.fields[0].reset();
		self.fields[0].pos.y = 0;
		self.fields[1].reset();
		self.fields[1].pos.y = csize.h;
		self.levelcount = 0;
		self.level = self.levels[0];
		self.poopcount = 0;
		self.story.style.visibility = "hidden";
		self.start(true);
	}

	this.lose = function() {
		self.mode = 3;
		self.story.innerHTML = "<p style='font-size:20px;font-style:normal;color:#FFFFFF'>"+
			"Tux fainted from being too DIRTY!</p><p style='color:#FFFFFF'>Press"+
			" SPACEBAR to try again...</p>";
		self.story.style.visibility = "visible";
		self.overlay.style.visibility = "visible";
		animator.stop();

	}
	
	this.iter = function(whichfield) {
		var af = whichfield ? 0 : 1;
		self.activefield = self.fields[af];
		var ss = self.keyOuts.length;
		while(ss--)
			clearTimeout(self.keyOuts[ss]);
		self.keyOuts = [];
		self.visiblekeys = [];

		self.poopcount++;
		if(self.poopcount == self.level.iter) {
			self.levelup();
			self.poopcount = 0;
//			self.fields[0].force_redraw = true; // redraw every time?
//			self.fields[1].force_redraw = true;
		} 
	}
	this.levelup = function() {
		self.levelcount++;
		var oldll = self.level.rhythms.length;
		if(self.levelcount < self.levels.length)
			self.level = self.levels[self.levelcount];
		var ll = self.level.rhythms.length;
		var pp = 8;
		var drawkeys = [];
		while(pp-- >= ll)
			self.pengus[ordering[pp]].hide();
		while(oldll < ll) {
			drawkeys.push(ordering[oldll]);
			oldll++;
		}
		self.drawkeys(drawkeys,self.fields[self.activefield],50);
		self.keyheight = 50;
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

PField = function(pos, size, bgimg, order) {
	this.order = order;
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
	this.CObj.style.backgroundImage="url('"+bgimg+"')";
	this.Ctx = this.CObj.getContext('2d');
//	this.speed = 2;
	this.active = false;
//	this.force_redraw = false;

	this.lanes = [];
//	var xoffset = (size.w/8 - game.poopimg.naturalWidth)/2; // doesn't work in some browsers?
	var xoffset = (size.w/8 - 24)/2;
	for(var n=0;n<8;n++) {
		this.lanes[n] = new Object();
		this.lanes[n].x = Math.round(size.w/8*n+xoffset);
		this.lanes[n].y = [];
	}
	
	animator.enqueue(this);

	var self = this;

	this.draw = function(level) {
		var rhythms = level.rhythms;
		var r = rhythms.length;
		while(r--) {
			self.lanes[ordering[r]].y = clone(game.level.lanes[ordering[r]].y);
			for(var n = 0;n < rhythms[r];n++) {
	//			var ycoord = (csize.h/rhythms[r]*n + 0.5) | 0; //rounding hack
	//			var ycoord = game.level.lanes[ordering[r]].y[n];
				var ycoord = self.lanes[ordering[r]].y[n];
				var ycrop = (game.level.common.indexOf(ycoord) != -1) ? 20 : 0;
				self.Ctx.drawImage(game.poopimg,0,ycrop,24,20,self.lanes[ordering[r]].x,ycoord,24,20);
	//			self.lanes[ordering[r]].y.push(ycoord);
			}
		}
	}
	
	this.clear = function() {
		self.Ctx.clearRect(0,0,self.size.w,self.size.h);
	}
	this.reset = function() {
		self.clear();
		for(var n=0;n<8;n++)
			self.lanes[n].y = [];
	}

	this.animate = function() {
		self.pos.y--;
		if(self.pos.y + csize.h == 0) {
			self.pos.y = csize.h;
			game.iter(self.order);
//			if(self.force_redraw) { // redraw every time?
				self.clear();
				self.draw(game.level);
//				self.force_redraw = false;
//			}
		}
		self.CObj.style.top = self.pos.y + "px";
		var nn = 8;
		while(nn--) {

			if(self.lanes[nn].pooping) {
				self.lanes[nn].pooping--;
				if(game.pengus[nn].mode != 1) {
					game.pengus[nn].dirty += 20;
					if(game.pengus[nn].dirty > 500) game.pengus[nn].fall();
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

PPengu = function(cpos) {
	this.Div = document.createElement("div");
	this.CObj = document.createElement("canvas");
	var self = this;
	this.w = game.spritewidth;
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
//	this.frame = Math.floor(Math.random()*6);
	this.frame = 0;
	this.mode = 1; // 0: walking, 1: jumping, 2: dying, 3: demo
	this.speed = 4;
	this.yframe = 0;
	this.jumpframes = [];
	this.maxjump = 5;
	this.maxframe = 1; // 5: walking, 1: jumping, 8: dying
	this.fallframes = [];
	for(var n=0;n<this.maxjump;n++) {
		this.jumpframes.push(Math.round(6*n*(n-this.maxjump)+this.w));
	}
	for(var n=0;n<9;n++) {
		this.fallframes.push(Math.round(0.77*n*(n-16)+this.w));
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
	this.draw = function(yy) {
		var xcrop = self.w*self.frame;
		var ycrop = self.w*self.mode;
		var yoffset = yy || self.w;
		self.Ctx.drawImage(game.penguimg,xcrop,ycrop,self.w,self.w,0,yoffset,self.w,self.w);
		
	}

	this.init = function(restart) {
		self.frame = 0;
		self.mode = 1;
		self.maxframe = 1;
		self.yframe = 0;
		self.hide();
		if(restart) {
			self.prints.clear();
			self.dirty = 0;
		}

	}
	this.clear = function() {
		self.Ctx.clearRect(0,0,self.w,self.h);
	}
	this.fall = function() {
		self.mode = 2;
		self.frame = 0;
		self.yframe = 0;
		self.maxframe = 8;
	}	
	
	this.demo = function() {
		self.active = true;
		self.CObj.style.visibility = "visible";
		self.yframe = 0;
		self.mode = 1;
		self.maxframe = 1;
		animator.start();
	}

	this.animate = function() {
		var yoffset = 0;
		self.clear();
		if(self.mode == 1) {
			if(self.yframe < self.maxjump) {
				yoffset = self.jumpframes[self.yframe];
				self.yframe++;
			}
			else {
				self.yframe = 0;
				self.mode = 0;
				self.maxframe = 5;
				if(game.mode == 0) self.hide();
			}
		}
		if(self.mode == 2) {
			yoffset = self.fallframes[self.yframe];
			self.yframe++;
		}
		self.draw(yoffset);
		if(self.frame < self.maxframe) self.frame++;
		else if(self.mode == 2) game.lose();
		else self.frame = 0;
	}

	this.jump = function() {
		if(self.mode == 0) {
			self.mode = 1;
			self.maxframe = 1;
		}
	}

	this.toggle = function() {
		if(game.mode == 0)
			self.demo();
		else self.jump();
	}
} 

PPrints = function(pengu) {
	var self = this;
	this.pengu = pengu;
	this.w = game.spritewidth;
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
	
	this.clear = function() {
		this.CObjs[0].Ctx.setTransform(1,0,0,1,0,0);
		this.CObjs[0].Ctx.clearRect(0,0,self.w,self.h);
		this.CObjs[1].Ctx.setTransform(1,0,0,1,0,0);
		this.CObjs[1].Ctx.clearRect(0,0,self.w,self.h);
	}
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
			self.CObjs[0].Ctx.clearRect(0,0,self.w,self.h);
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
						self.pengu.dirty/300+")";
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
				// active++; // TODO: this sucks
				var d = dd;
				while(d--) {
					if(typeof self.dqueue[d] != 'undefined') {
						active++;
						if(self.frame % d == 0) {
							var n = self.dqueue[d].length;
							var subactive = 0;
							while(n--) {
								if(self.dqueue[d][n].active) {
									self.dqueue[d][n].animate();
									subactive++;
								}
							}
							if(subactive == 0) active--;
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

// Rounded rectangles from StackOverflow
(function() {
	CanvasRenderingContext2D.prototype.roundRect = function(sx,sy,ex,ey,r) {
		var r2d = Math.PI/180;
		if( ( ex - sx ) - ( 2 * r ) < 0 ) { r = ( ( ex - sx ) / 2 ); }
		if( ( ey - sy ) - ( 2 * r ) < 0 ) { r = ( ( ey - sy ) / 2 ); }
		this.beginPath();
		this.moveTo(sx+r,sy);
		this.lineTo(ex-r,sy);
		this.arc(ex-r,sy+r,r,r2d*270,r2d*360,false);
		this.lineTo(ex,ey-r);
		this.arc(ex-r,ey-r,r,r2d*0,r2d*90,false);
		this.lineTo(sx+r,ey);
		this.arc(sx+r,ey-r,r,r2d*90,r2d*180,false);
		this.lineTo(sx,sy+r);
		this.arc(sx+r,sy+r,r,r2d*180,r2d*270,false);
		this.closePath();
	}
}());

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
