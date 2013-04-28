/**
 * Godjs: A module loader and a MVC javascript programming framework used for
 * large and modularized web applications
 * 
 * @author guodong
 * @email gd@tongjo.com
 * @see https://github.com/tongjo/god
 * 
 * @notice the loading order is described as follows: 1. execute script in
 *         loading file 2. execute callback such as onload callback and
 *         onreadystatechange callback
 * 
 * the register process is described as follows: 1. create context 2. define the
 * callback that check if module is ready 3. parse and load dependences and bind
 * callbacks 4. register to god.modules
 * 
 * @issues: there still exists some issues to be solved, here list them as
 *          follows: 1. the cycle dependence, optionally you can just use the
 *          god.exe method to call controller's action directly
 */
(function(window) {
  var version = 2;
	var n_req = 0;
	var n_rep = 0;
	var all_complete = true;
	function God() {
	}
	var require_wq = [];
	var script_class = "__@god_script";

	var isObject = function(source) {
		return 'function' == typeof source
				|| !!(source && 'object' == typeof source);
	};
	function chk_modules() {
		for ( var i in god.modules) { 
			if (god.modules[i].isReady || null === god.modules[i].callback)
				continue;
			console.log('chk:'+i)
			var ready = true;
			for ( var j in god.modules[i].deps) {// alert(god.modules[i].deps[j])
				if (!god.modules[god.modules[i].deps[j]].isReady) {
					ready = false;// alert('rd'+god.modules[i].deps[j])
					break;
				}
			}
			if (ready) { console.log("ready:"+i)
				var args = [];
				for ( var k in god.modules[i].deps) {
					args.push(god.modules[god.modules[i].deps[k]].content);
				}
				god.modules[i].content = god.modules[i].callback.apply(window,
						args);
				god.modules[i].isReady = true;
				chk_modules();
			}
		}
		for ( var i in require_wq) {
			if (require_wq[i].isReady) {
				continue;
			}
			var ready = true;
			for ( var j in require_wq[i].deps) {
				if (!god.modules[require_wq[i].deps[j]].isReady) {
					ready = false;
					break;
				}
			}
			if (ready) { console.log('require_wq ready: '+ require_wq[i].deps.join(';'));
				var args = [];
				for ( var k in require_wq[i].deps) {
					args.push(god.modules[require_wq[i].deps[k]].content);
				}
				require_wq[i].callback.apply(window, args);
				require_wq[i].isReady = true;
				if(i == require_wq.length-1) all_complete = true;
			}else{ console.log('require_wq not ready: '+ require_wq[i].deps.join(';'));
				/*var n;
				for(var j in require_wq){
					if(require_wq[j].isReady){
						n++;
					}
				}
				if(n == require_wq.length-1){
					for(var k in require_wq[i].deps){
						if(!god.modules[require_wq[i].deps[k]].added){
							console.log("before is complete: "+require_wq[i].deps);
							now_mod_name = require_wq[i].deps[k];
							load_module(require_wq[i].deps[k]);
							break;
						}
					}
				}
				if(n_rep == n_req){
					
				}*/
			}
			
		}
	}
	/**
	 * Helper function for iterating over an array. If the func returns a true
	 * value, it will break out of the loop.
	 */
	function each(ary, func) {
		for ( var i in ary) {
			if (func(ary[i], i, ary))
				break;
		}
	}
	var now_mod_name;
	/**
	 * this varible is set to ensure only one module is loading,
	 * because if there are two god.require... main_loop will be called twice and load the recent module
	 * but the now_mod_name is the old. Thus it must be in serial way.
	 * And the other god.require will be execute in next main_loop loop
	 */
	var working = false;
	var main_loop = function() {// alert('loop')
		working = true;
		all_complete = false;
		chk_modules();
		each(god.modules, function(module, name) {// alert('loop'+name)
			if (!module.added) {
				now_mod_name = name;
				load_module(name);console.log('load:'+name)
				module.added = true;
				return true;
			}
		});
	};
	function loadScript(moduleName, url, callback) {// alert("create tag:"+url)
		var head = document.getElementsByTagName('head')[0];
		tag = document.createElement('script');
		tag.type = 'text/javascript';
		tag.charset = 'utf-8';
		tag.async = false;
		tag.setAttribute('data-requiremodule', moduleName);
		tag.setAttribute('class', script_class);
		/**/if (tag.attachEvent) {
			tag.attachEvent('onreadystatechange', callback);
		} else {
			tag.addEventListener('load', callback, false);
		}
		/*if (tag.attachEvent &&
                //Check if node.attachEvent is artificially added by custom script or
                //natively supported by browser
                //read https://github.com/jrburke/requirejs/issues/187
                //if we can NOT find [native code] then it must NOT natively supported.
                //in IE8, node.attachEvent does not have toString()
                //Note the test for "[native code" with no closing brace, see:
                //https://github.com/jrburke/requirejs/issues/273
                !(tag.attachEvent.toString && tag.attachEvent.toString().indexOf('[native code') < 0)) {
            //Probably IE. IE (at least 6-8) do not fire
            //script onload right after executing the script, so
            //we cannot tie the anonymous define call to a name.
            //However, IE reports the script as being in 'interactive'
            //readyState at the time of the define call.
            useInteractive = true;

            tag.attachEvent('onreadystatechange', callback);
            //It would be great to add an error handler here to catch
            //404s in IE9+. However, onreadystatechange will fire before
            //the error handler, so that does not help. If addEventListener
            //is used, then IE will fire error before load, but we cannot
            //use that pathway given the connect.microsoft.com issue
            //mentioned above about not doing the 'script execute,
            //then fire the script load event listener before execute
            //next script' that other browsers do.
            //Best hope: IE10 fixes the issues,
            //and then destroys all installs of IE 6-9.
            //node.attachEvent('onerror', context.onScriptError);
        } else {
        	tag.addEventListener('load', callback, false);
        }
		tag.onreadystatechange = tag.onload = callback;*/
		tag.src = url;
		head.appendChild(tag);
	}
	function load_module(module_name) {
		n_req++;
		var url, has = false;
		for ( var j in god.paths) {
			if (module_name.indexOf(j) === 0) {
				var cut = j.length + 1;
				url = god.paths[j] + module_name + '.js';
				has = true;
				break;
			}
		}
		if (!has)
			url = god.appPath + module_name + '.js';
		url += '?v='+version+Math.random(0,9999);
		loadScript(module_name, url, function(){});
	}
	God.prototype = {
		appPath: '',
		paths: {},
		modules: [],
		config: function(obj) {
			this.appPath = obj.appPath;
			this.paths = obj.paths ? obj.paths : {};
		},
		define: function(module_name, deps, callback) {
			if (arguments.length === 2) {
				if (typeof (module_name) === "string") {
					callback = deps;
					deps = [];
				} else if (typeof (module_name) === "object") {
					callback = deps;
					deps = module_name;
					module_name = null;
				}
			} else if (arguments.length === 1) {
				callback = module_name;
				deps = [];
				module_name = null;
			}
			if (module_name === null) {
				module_name = now_mod_name;
			}
			console.log('define:'+module_name)
			god.modules[module_name].deps = deps;
			god.modules[module_name].callback = callback;
			// alert('define:'+module_name);
			for ( var i in deps) {
				if (undefined === god.modules[deps[i]]) {
					god.modules[deps[i]] = {
						deps: [],
						isReady: false,
						callback: null,
						content: null,
						added: false
					};
					// if(undefined !== god.modules[deps[i]])
					// load_module(deps[i]);
				}
			}
			n_rep++;
			main_loop();
		},
		require: function(deps, callback) {
			console.log('require: '+deps.join(';'));
			for ( var i in deps) {
				if (undefined === god.modules[deps[i]]) {
					god.modules[deps[i]] = {
						deps: [],
						isReady: false,
						callback: null,
						content: null,
						added: false
					};
				}
			}
			require_wq.push({
				isReady: false,
				deps: deps,
				callback: callback
			});
			if(!working || all_complete) main_loop();
			else chk_modules();
		},
		/**
		 * execute the controller's action, the arguments except first
		 * one(controller name and action name) will be transfered to the action
		 * For instance, god.exe('User.logout', {uid: 2});
		 * 
		 * @param action:
		 *            the controller and action string eg: 'User.logout' if the
		 *            action name do not exist, just return the instance, and
		 *            the init function will be execute.
		 * @returns {God} just for chain call
		 */
		exe: function(action) {
			var t = action.split('.'), controller_name = t[0], action_name = t[1];
			var args = [], i, length = arguments.length;
			for (i = 1; i < length; i++) {
				args.push(arguments[i]);
			}
			this.require([ 'controller/' + controller_name ], function(ctrl) {
				if (action_name) {
					var str = "ctrl." + action_name + ".apply(ctrl, args)";
					eval(str);
				}

			});
			return this; // make chain
		}
	};
	window.god = new God;
	function clone(myObj)
	{
		if (typeof (myObj) != 'object')
			return myObj;

		if (myObj == null)
			return myObj;

		var myNewObj = new Object();
		for ( var i in myObj)
			myNewObj[i] = clone(myObj[i]);
		return myNewObj;

	}
	God.prototype.extend = function(supper, source) {
		var s = source;
		var F = function(obj) {
			supper.call(this, obj);
			for ( var i in s) {
				if (typeof (s[i]) == 'object' || typeof(s[i]) == 'function') {
					this[i] = clone(s[i]);
				}else{
					this[i] = s[i];
				}
			}
		};

		F.prototype = supper.prototype;
		F.prototype.constructor = F;
		return F;
	};

	function Controller(obj) {
		for ( var i in obj) {
			this[i] = obj[i];
		}
		if (this.init) {
			this.init();
		}
	}

	function Model(obj) {
		/**
		 * the url to fetch model data, used by fetch, save, delete...
		 */
		this.fields = {};
		this.baseUrl = "";
		for ( var i in obj) {
			this[i] = obj[i];
		}
		if (this.init) {
			this.init();
		}
	}

	Model.prototype = {
		setConfig: function(obj) {

		},
		/**
		 * the url to fetch model data, used by fetch, save, delete...
		 */
		set: function(key, value) {
			this.fields[key] = value;
		},
		sets: function(obj) {
			for ( var i in obj) {
				this.set(i, obj[i]);
			}
		},
		get: function(key) {
			return this.fields[key];
		},
		gets: function() {
			return this.fields;
		},
		save: function() {
			Helper.ajax({
				url: this.baseUrl,
				data: this.fields,
				method: 'POST'
			});
		},
		/**
		 * fetch data from remote server, server response should be like:
		 * {"name": "guodong", "age": 18, "isVip": true}, it uses HTTP GET
		 * method
		 * 
		 * @param param
		 *            the param transfred to server using Get Method
		 */
		fetch: function(arg) {
			var arg = arg || {}, self = this;
			$.ajax({
				url: this.baseUrl,
				async: false,
				data: arg,
				dataType: 'json',
				success: function(d) {
					for ( var i in d) {
						self.fields[i] = d[i];
					}
				}
			});
			return self.fields;
		}
	};

	function Collection(obj) {
		this.model = null, /* the model class */
		this.baseUrl = '';
		this.data = [];
		for ( var i in obj) {
			this[i] = obj[i];
		}
		if (this.init) {
			this.init();
		}
	}
	Collection.prototype = {
		fetchAll: function(arg) {
			this.data = [];
			var arg = arg || {}, self = this;
			$.ajax({
				url: this.baseUrl,
				async: false,
				data: arg,
				dataType: 'json',
				success: function(d) {
					var tarr = [], t = [];
					for ( var i in d) {
						t[i] = new self.model;
						t[i].sets(d[i]);
						tarr.push(t[i]);
					}
					self.data = tarr;
				}
			});

			return self.data;
		}
	}

	function View(obj) {
		this.template = '';
		this.vars = {};
		this.templatePath = 'tpl';
		for ( var i in obj) {
			this[i] = obj[i];
		}
		if (this.init) {
			this.init();
		}
	}
	View.prototype = {
		set: function(key, value) {
			this.vars[key] = value;
		},
		/**
		 * render the view page and replace the <%=..%> with vars
		 * 
		 * @param dom:
		 *            the id of dom
		 */
		render: function(domId) {
			var self = this;
			if (this.templatePath === '')
				this.templatePath = this.id;
			var url = god.appPath + 'template/' + this.templatePath + ".js?v="+version;
			this.template = Helper.load(url);
			/*
			 * var self = this, viewVarsRegExp = /<%=\s*(.*)\s*%>/g;
			 * this.template.replace(viewVarsRegExp, function(match, data) { var
			 * str = "self.vars." + data; var value = eval(str); self.template =
			 * self.template.replace(match, value); });
			 */
			var cache = {};

			var tmpl = function(str, data) {
				// Figure out if we're getting a template, or if we need to
				// load the template - and be sure to cache the result.
				var fn = !/\W/.test(str) ? cache[str] = cache[str]
						|| tmpl(document.getElementById(str).innerHTML) :

				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				new Function("obj",
						"var p=[],print=function(){p.push.apply(p,arguments);};"
								+
								// Introduce the data as local variables using
								// with(){}
								"with(obj){p.push('"
								+

								// Convert the template into pure JavaScript
								str.replace(/[\r\t\n]/g, " ").split("<%").join(
										"\t").replace(/((^|%>)[^\t]*)'/g,
										"$1\r")
										.replace(/\t=(.*?)%>/g, "',$1,'")
										.split("\t").join("');").split("%>")
										.join("p.push('").split("\r").join(
												"\\'")
								+ "');}return p.join('');");

				// Provide some basic currying to the user
				return data ? fn(data) : fn;
			};
			// document.getElementById(dom).innerHTML = self.template;
			document.getElementById(domId).innerHTML = tmpl(this.template,
					this.vars);
			if (this.initRender)
				this.initRender();
		}
	};

	God.prototype.mvc = {
		Controller: Controller,
		Model: Model,
		Collection: Collection,
		View: View,
	};
	God.prototype.controller = new Controller();
	
	/*
	 * v1 = god.extend(god.mvc.View,{templatePath: '1'}); v2 =
	 * god.extend(god.mvc.View,{templatePath: '2'}); var t1 = new v1; var t2 =
	 * new v2; t2.templatePath = '3'; console.log(t1.templatePath)
	 */

	var Helper = {
		/**
		 * just load content without executing it in sync way. Used for View
		 * templates
		 * 
		 * @notice this method only can be used for same domain loading, thus
		 *         determine the View templates must be load under app domain
		 */
		load: function(path) {
			return this.ajax({
				url: path,
				async: false
			});
		},

		ajax: function(params, callback) {
			var url = params.url
			var method = params.method ? params.method.toUpperCase() : 'GET', async = (params.async === false) ? false
					: true;
			var t = [], data = params.data || {};
			for ( var i in data) {
				t[t.length] = i + '=' + data[i];
			}
			var argstr = t.join('&');
			if (method === 'GET' && argstr !== '') {
				url += '/?' + argstr;
			}
			var xmlHttp;
			if (window.XMLHttpRequest) {
				xmlHttp = new XMLHttpRequest();
			} else {
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlHttp.open(method, url, async);
			if (method === 'GET') {
				xmlHttp.send(null);
			} else {
				xmlHttp.setRequestHeader("Content-Type",
						"application/x-www-form-urlencoded");

				xmlHttp.send(argstr);
			}
			if (undefined !== callback) {
				if (async) {
					xmlHttp.onreadystatechange = function() {
						if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							callback(xmlHttp.responseText);
						}
					}
				} else {
					if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
						callback(xmlHttp.responseText);
					}
				}

			}
			/**
			 * if it isn't sync, load and return the response
			 */
			if (!async) {
				return xmlHttp.responseText;
			}
		}
	}
})(window);
