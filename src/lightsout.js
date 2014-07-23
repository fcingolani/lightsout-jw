/** @license
 * Lights Out Plugin
 *
 * Author: Wesley Luyten
 * Version: 1.1 - (2012/11/21)
 * Version: 2.0 - (2012/12/04)
 */

(function(jwplayer) {

	var scripts = document.getElementsByTagName("head")[0].getElementsByTagName('script');
	for (var i = 0; i < scripts.length; i++) {
		var match = scripts[i].src.match(/(.*?)lightsout-?\d?\.js/);
		if (match) {
			var mydir = match[1];
			break;
		}
	}

	function getPlayerContainer(p) {
		return	p.getRenderingMode() === "html5"
				? p.getContainer()
				: p.getContainer().parentNode;
	}
		
	function main(player, config, div) {
		
		var _this = this;
		var shade, lights;
			
		var defaultConfig = {
			backgroundcolor:		'000000',
			dockicon:				true,
			opacity:				0.8,
			time:					800,
			onidle:					'on',
			onplay:					'off',
			onpause:				'on',
			oncomplete:				'on',
			parentid:				null,
			dockiconUrl:			mydir + "lightsout_dock_out.png"
		};
	
		function setup(e) {
			for (var prp in defaultConfig) {
				if (config[prp] === undefined) config[prp] = defaultConfig[prp];
			}
						
			shade = document.createElement('div');
			shade.className += " lightsout_shade";
			shade.style.display = "none";
			shade.style.backgroundColor = "#" + config.backgroundcolor;
			shade.style.zIndex = 300;
			shade.style.opacity = 0;
			shade.style.filter = "alpha(opacity=0)";
			shade.style.top = 0;
			shade.style.left = 0;
			shade.style.bottom = 0;
			shade.style.right = 0;
			if (config.parentid) {
				shade.style.position = "absolute";
				document.getElementById(config.parentid).style.position = "relative";
				document.getElementById(config.parentid).appendChild(shade);
			} else {
				shade.style.position = "fixed";
				document.body.appendChild(shade);
			}

			shade.onclick = turnOn;
			
			lights = new Lights(shade, config.time, config.opacity, sortPlayers);

			//setup plugin api
			_this.on = lights.on;
			_this.off = lights.off;
			_this.toggle = lights.toggle;
					
			if (config.dockicon === true && typeof player.addButton === "function") {
				player.addButton(config.dockiconUrl, 'Toggle Light', function(){ lights.toggle(player) }, 'lightsout');
			}
			
			player.onIdle(stateHandler);
			player.onPlay(stateHandler);
			player.onPause(stateHandler);
			player.onComplete(completeHandler);
		}

		function sortPlayers() {
			var i = 0;
			var p;
			while ((p = jwplayer(i++)) && p.hasOwnProperty('id') && i < 100) {
				zIndex(p, 'auto');
			}
			zIndex(player, 301);
		}

		function zIndex(p, value) {
			getPlayerContainer(p).style.zIndex = value;
		}

		function turnOn() {
			player.pause(true);
			lights.on(player);
		}

		function completeHandler(data) {
			if (config.oncomplete == "off") lights.off(player)
			else lights.on(player);
		}
		
		function stateHandler(data) {
			switch (player.getState()) {
				case 'IDLE':
					if (config.onidle == "off") lights.off(player);
					else lights.on(player);
					break;
				case 'PLAYING':
					if (config.onplay == "off") lights.off(player);
					else lights.on(player);
					break;
				case 'PAUSED':
					if (config.onpause == "off") lights.off(player);
					else lights.on(player);
					break;
			}
		}

		player.onReady(setup);
		
		this.getDisplayElement = function() {
			return div;
		};
		
		this.resize = function(wid, hei) {
		};
	}
	
	function Lights(element, time, dark, callback) {
		
		this.element = element;
		this.time = time || 1000;
		this.dark = dark || 0.8;
		
		this.opacity = 0;
		
		var _this = this;
		var interval;
		
		var supportOpacity = 'opacity' in this.element.style;
        if (!supportOpacity) this.element.style.zoom = 1;
        
        function setOpacity(o) {
            _this.element.style.opacity = "" + o;
            _this.element.style.filter = "alpha(opacity=" + Math.round(o*100) + ")";
			_this.opacity = o;
        }
		
		this.off = function(player) {
			if (typeof callback === "function") callback();
			
			if (player != null) 
				getPlayerContainer(player).setAttribute('data-lights','off');
				
			_this.element.style.display = "block";
			clearInterval(interval);
			var t0 = new Date().getTime();
			var o0 = _this.opacity;
			interval = setInterval(function() {
				var dt = (new Date().getTime() - t0) / _this.time;
				if (dt >=1) {
					dt = 1;
					clearInterval(interval);
				}
				setOpacity(_this.dark * dt + o0 * (1-dt));
			}, 1000 / 60);
		};
		
		this.on = function(player) {
			if (player != null)
				getPlayerContainer(player).setAttribute('data-lights','on');
				
			clearInterval(interval);
			var t0 = new Date().getTime();
			var o0 = _this.opacity;
			interval = setInterval(function() {
				var dt = (new Date().getTime() - t0) / _this.time;
				if (dt >=1) {
					dt = 1;
					clearInterval(interval);
					_this.element.style.display = "none";
				}
				setOpacity(0 * dt + o0 * (1-dt));
			}, 1000 / 60);
		};
		
		this.toggle = function(player) {
			if (_this.opacity < 0.5) {
				_this.off(player);
			} else {
				_this.on(player);
			}
		};
	}
	
	jwplayer().registerPlugin('lightsout', '6.0', main);
	
})(jwplayer);
