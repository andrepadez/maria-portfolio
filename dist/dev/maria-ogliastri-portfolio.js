(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
// promised library for Ajax requests
var Q = require('q');

var Ajax = module.exports = {

    get: function(url){
        var deferred = Q.defer();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function(ev){
            if(this.status < 400){
                deferred.resolve(this.responseText);    
            } else {
                deferred.reject({
                    status: this.status,
                    message: this.responseText
                });
            }
        };
        xhr.send();
        return deferred.promise;
    },
    getJSON: function(url){
        return Ajax.get(url).then(JSON.parse);
    }
};

},{"q":8}],5:[function(require,module,exports){
//pubsub module used by our application controllers
var registeredHandlers = {};
var catchAll = [];

module.exports = {
    subscribe: subscribe,
    broadcast: broadcast
};

function subscribe (messages, handler){
    if(typeof handler !== 'function'){
        throw new Error('you can\'t register non-methods as handlers');
    }
    if( messages === '*' ){
        catchAll.push(handler);
        return;
    }

    messages = Array.isArray(messages)? messages : [messages];
    messages.forEach(function(message){
        registeredHandlers[message] = registeredHandlers[message] || [];
        registeredHandlers[message].push(handler);
    });
};

function broadcast(message, data){
    data = data || {};
    var handlers = registeredHandlers[message] || [];
    handlers.forEach(function(handler){
        handler(message, data);
    });
    catchAll.forEach(function(handler){
        handler(message, data);
    });
};

},{}],6:[function(require,module,exports){
//promised Templating engine 
var Q = require('q');
var swig = require('swig');
var loader = require('./loader');

var Templator = module.exports = {
    init: function(views){
        loader.init(views);
    },

    render: function(url, locals, wrapper, before){
        return this.getTemplate(url)
            .then( function(template){
                return this.parse(template, locals);
            }.bind(this) )
            .then( function(html){
                return this.inject(wrapper, html)
            }.bind(this) );
    },

    getTemplate: function(url){
        url = 'views/' + url;
        return loader.load(url);
    },

    parse: function(template, locals){
        var html = swig.render(template, { 
            locals: locals,
            autoescape: false
        });
        return html;
    },
    
    inject: function(wrapper, html){
        var deferred = Q.defer();
        var div = document.createElement('div');
        (function(container, html){
            container.innerHTML = html;
            children = Array.prototype.slice.call(container.children);
            requestAnimationFrame(function(){
                children.forEach(function(child){
                    wrapper.appendChild(child);
                });
                deferred.resolve();
            });    
        })(wrapper, html);
        
        return deferred.promise;
    }, 

    empty: function(container){
        var deferred = Q.defer();
        if(!container || !container.nodeName){
            deferred.reject( Error("container must be a DOM element") );
        } else {
            requestAnimationFrame(function(){
                container.innerHTML = '';
                deferred.resolve();
            });
        }
        return deferred.promise;
    }
};

},{"./loader":7,"q":8,"swig":9}],7:[function(require,module,exports){
var Q = require('q');
var ajax = require('../ajax');

var Loader = module.exports = {
    init: function(views){
        this.views = views;
    },
    load: function(url){
        if( Loader.views ){
            return loadFromJSON(url);
        } else {
            return ajax.get(url);
        }

        
    }
};

var loadFromJSON = function(url){
    var deferred = Q.defer();
    path = url.split('/');
    var template = Loader.views;
    Object.keys(path).forEach(function(key){
        if(key !== "0" || path[key] !== 'views'){
            template = template[ path[key] ];
            if(!template){
                deferred.reject( Error('view not found in views.json ' + url) );
            }
        }
    });
    deferred.resolve( template );
    return deferred.promise;
}; 

},{"../ajax":4,"q":8}],8:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof self !== "undefined") {
        self.Q = definition();

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function(prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function() {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))

},{"_process":3}],9:[function(require,module,exports){
module.exports = require('./lib/swig');

},{"./lib/swig":17}],10:[function(require,module,exports){
var utils = require('./utils');

var _months = {
    full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  _days = {
    full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    alt: {'-1': 'Yesterday', 0: 'Today', 1: 'Tomorrow'}
  };

/*
DateZ is licensed under the MIT License:
Copyright (c) 2011 Tomo Universalis (http://tomouniversalis.com)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
exports.tzOffset = 0;
exports.DateZ = function () {
  var members = {
      'default': ['getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds', 'toISOString', 'toGMTString', 'toUTCString', 'valueOf', 'getTime'],
      z: ['getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getYear', 'toDateString', 'toLocaleDateString', 'toLocaleTimeString']
    },
    d = this;

  d.date = d.dateZ = (arguments.length > 1) ? new Date(Date.UTC.apply(Date, arguments) + ((new Date()).getTimezoneOffset() * 60000)) : (arguments.length === 1) ? new Date(new Date(arguments['0'])) : new Date();

  d.timezoneOffset = d.dateZ.getTimezoneOffset();

  utils.each(members.z, function (name) {
    d[name] = function () {
      return d.dateZ[name]();
    };
  });
  utils.each(members['default'], function (name) {
    d[name] = function () {
      return d.date[name]();
    };
  });

  this.setTimezoneOffset(exports.tzOffset);
};
exports.DateZ.prototype = {
  getTimezoneOffset: function () {
    return this.timezoneOffset;
  },
  setTimezoneOffset: function (offset) {
    this.timezoneOffset = offset;
    this.dateZ = new Date(this.date.getTime() + this.date.getTimezoneOffset() * 60000 - this.timezoneOffset * 60000);
    return this;
  }
};

// Day
exports.d = function (input) {
  return (input.getDate() < 10 ? '0' : '') + input.getDate();
};
exports.D = function (input) {
  return _days.abbr[input.getDay()];
};
exports.j = function (input) {
  return input.getDate();
};
exports.l = function (input) {
  return _days.full[input.getDay()];
};
exports.N = function (input) {
  var d = input.getDay();
  return (d >= 1) ? d : 7;
};
exports.S = function (input) {
  var d = input.getDate();
  return (d % 10 === 1 && d !== 11 ? 'st' : (d % 10 === 2 && d !== 12 ? 'nd' : (d % 10 === 3 && d !== 13 ? 'rd' : 'th')));
};
exports.w = function (input) {
  return input.getDay();
};
exports.z = function (input, offset, abbr) {
  var year = input.getFullYear(),
    e = new exports.DateZ(year, input.getMonth(), input.getDate(), 12, 0, 0),
    d = new exports.DateZ(year, 0, 1, 12, 0, 0);

  e.setTimezoneOffset(offset, abbr);
  d.setTimezoneOffset(offset, abbr);
  return Math.round((e - d) / 86400000);
};

// Week
exports.W = function (input) {
  var target = new Date(input.valueOf()),
    dayNr = (input.getDay() + 6) % 7,
    fThurs;

  target.setDate(target.getDate() - dayNr + 3);
  fThurs = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((fThurs - target) / 604800000);
};

// Month
exports.F = function (input) {
  return _months.full[input.getMonth()];
};
exports.m = function (input) {
  return (input.getMonth() < 9 ? '0' : '') + (input.getMonth() + 1);
};
exports.M = function (input) {
  return _months.abbr[input.getMonth()];
};
exports.n = function (input) {
  return input.getMonth() + 1;
};
exports.t = function (input) {
  return 32 - (new Date(input.getFullYear(), input.getMonth(), 32).getDate());
};

// Year
exports.L = function (input) {
  return new Date(input.getFullYear(), 1, 29).getDate() === 29;
};
exports.o = function (input) {
  var target = new Date(input.valueOf());
  target.setDate(target.getDate() - ((input.getDay() + 6) % 7) + 3);
  return target.getFullYear();
};
exports.Y = function (input) {
  return input.getFullYear();
};
exports.y = function (input) {
  return (input.getFullYear().toString()).substr(2);
};

// Time
exports.a = function (input) {
  return input.getHours() < 12 ? 'am' : 'pm';
};
exports.A = function (input) {
  return input.getHours() < 12 ? 'AM' : 'PM';
};
exports.B = function (input) {
  var hours = input.getUTCHours(), beats;
  hours = (hours === 23) ? 0 : hours + 1;
  beats = Math.abs(((((hours * 60) + input.getUTCMinutes()) * 60) + input.getUTCSeconds()) / 86.4).toFixed(0);
  return ('000'.concat(beats).slice(beats.length));
};
exports.g = function (input) {
  var h = input.getHours();
  return h === 0 ? 12 : (h > 12 ? h - 12 : h);
};
exports.G = function (input) {
  return input.getHours();
};
exports.h = function (input) {
  var h = input.getHours();
  return ((h < 10 || (12 < h && 22 > h)) ? '0' : '') + ((h < 12) ? h : h - 12);
};
exports.H = function (input) {
  var h = input.getHours();
  return (h < 10 ? '0' : '') + h;
};
exports.i = function (input) {
  var m = input.getMinutes();
  return (m < 10 ? '0' : '') + m;
};
exports.s = function (input) {
  var s = input.getSeconds();
  return (s < 10 ? '0' : '') + s;
};
//u = function () { return ''; },

// Timezone
//e = function () { return ''; },
//I = function () { return ''; },
exports.O = function (input) {
  var tz = input.getTimezoneOffset();
  return (tz < 0 ? '-' : '+') + (tz / 60 < 10 ? '0' : '') + Math.abs((tz / 60)) + '00';
};
//T = function () { return ''; },
exports.Z = function (input) {
  return input.getTimezoneOffset() * 60;
};

// Full Date/Time
exports.c = function (input) {
  return input.toISOString();
};
exports.r = function (input) {
  return input.toUTCString();
};
exports.U = function (input) {
  return input.getTime() / 1000;
};

},{"./utils":34}],11:[function(require,module,exports){
var utils = require('./utils'),
  dateFormatter = require('./dateformatter');

/**
 * Helper method to recursively run a filter across an object/array and apply it to all of the object/array's values.
 * @param  {*} input
 * @return {*}
 * @private
 */
function iterateFilter(input) {
  var self = this,
    out = {};

  if (utils.isArray(input)) {
    return utils.map(input, function (value) {
      return self.apply(null, arguments);
    });
  }

  if (typeof input === 'object') {
    utils.each(input, function (value, key) {
      out[key] = self.apply(null, arguments);
    });
    return out;
  }

  return;
}

/**
 * Backslash-escape characters that need to be escaped.
 *
 * @example
 * {{ "\"quoted string\""|addslashes }}
 * // => \"quoted string\"
 *
 * @param  {*}  input
 * @return {*}        Backslash-escaped string.
 */
exports.addslashes = function (input) {
  var out = iterateFilter.apply(exports.addslashes, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.replace(/\\/g, '\\\\').replace(/\'/g, "\\'").replace(/\"/g, '\\"');
};

/**
 * Upper-case the first letter of the input and lower-case the rest.
 *
 * @example
 * {{ "i like Burritos"|capitalize }}
 * // => I like burritos
 *
 * @param  {*} input  If given an array or object, each string member will be run through the filter individually.
 * @return {*}        Returns the same type as the input.
 */
exports.capitalize = function (input) {
  var out = iterateFilter.apply(exports.capitalize, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.toString().charAt(0).toUpperCase() + input.toString().substr(1).toLowerCase();
};

/**
 * Format a date or Date-compatible string.
 *
 * @example
 * // now = new Date();
 * {{ now|date('Y-m-d') }}
 * // => 2013-08-14
 * @example
 * // now = new Date();
 * {{ now|date('jS \o\f F') }}
 * // => 4th of July
 *
 * @param  {?(string|date)}   input
 * @param  {string}           format  PHP-style date format compatible string. Escape characters with <code>\</code> for string literals.
 * @param  {number=}          offset  Timezone offset from GMT in minutes.
 * @param  {string=}          abbr    Timezone abbreviation. Used for output only.
 * @return {string}                   Formatted date string.
 */
exports.date = function (input, format, offset, abbr) {
  var l = format.length,
    date = new dateFormatter.DateZ(input),
    cur,
    i = 0,
    out = '';

  if (offset) {
    date.setTimezoneOffset(offset, abbr);
  }

  for (i; i < l; i += 1) {
    cur = format.charAt(i);
    if (cur === '\\') {
      i += 1;
      out += (i < l) ? format.charAt(i) : cur;
    } else if (dateFormatter.hasOwnProperty(cur)) {
      out += dateFormatter[cur](date, offset, abbr);
    } else {
      out += cur;
    }
  }
  return out;
};

/**
 * If the input is `undefined`, `null`, or `false`, a default return value can be specified.
 *
 * @example
 * {{ null_value|default('Tacos') }}
 * // => Tacos
 *
 * @example
 * {{ "Burritos"|default("Tacos") }}
 * // => Burritos
 *
 * @param  {*}  input
 * @param  {*}  def     Value to return if `input` is `undefined`, `null`, or `false`.
 * @return {*}          `input` or `def` value.
 */
exports["default"] = function (input, def) {
  return (typeof input !== 'undefined' && (input || typeof input === 'number')) ? input : def;
};

/**
 * Force escape the output of the variable. Optionally use `e` as a shortcut filter name. This filter will be applied by default if autoescape is turned on.
 *
 * @example
 * {{ "<blah>"|escape }}
 * // => &lt;blah&gt;
 *
 * @example
 * {{ "<blah>"|e("js") }}
 * // => \u003Cblah\u003E
 *
 * @param  {*} input
 * @param  {string} [type='html']   If you pass the string js in as the type, output will be escaped so that it is safe for JavaScript execution.
 * @return {string}         Escaped string.
 */
exports.escape = function (input, type) {
  var out = iterateFilter.apply(exports.escape, arguments),
    inp = input,
    i = 0,
    code;

  if (out !== undefined) {
    return out;
  }

  if (typeof input !== 'string') {
    return input;
  }

  out = '';

  switch (type) {
  case 'js':
    inp = inp.replace(/\\/g, '\\u005C');
    for (i; i < inp.length; i += 1) {
      code = inp.charCodeAt(i);
      if (code < 32) {
        code = code.toString(16).toUpperCase();
        code = (code.length < 2) ? '0' + code : code;
        out += '\\u00' + code;
      } else {
        out += inp[i];
      }
    }
    return out.replace(/&/g, '\\u0026')
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E')
      .replace(/\'/g, '\\u0027')
      .replace(/"/g, '\\u0022')
      .replace(/\=/g, '\\u003D')
      .replace(/-/g, '\\u002D')
      .replace(/;/g, '\\u003B');

  default:
    return inp.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
exports.e = exports.escape;

/**
 * Get the first item in an array or character in a string. All other objects will attempt to return the first value available.
 *
 * @example
 * // my_arr = ['a', 'b', 'c']
 * {{ my_arr|first }}
 * // => a
 *
 * @example
 * // my_val = 'Tacos'
 * {{ my_val|first }}
 * // T
 *
 * @param  {*} input
 * @return {*}        The first item of the array or first character of the string input.
 */
exports.first = function (input) {
  if (typeof input === 'object' && !utils.isArray(input)) {
    var keys = utils.keys(input);
    return input[keys[0]];
  }

  if (typeof input === 'string') {
    return input.substr(0, 1);
  }

  return input[0];
};

/**
 * Group an array of objects by a common key. If an array is not provided, the input value will be returned untouched.
 *
 * @example
 * // people = [{ age: 23, name: 'Paul' }, { age: 26, name: 'Jane' }, { age: 23, name: 'Jim' }];
 * {% for agegroup in people|groupBy('age') %}
 *   <h2>{{ loop.key }}</h2>
 *   <ul>
 *     {% for person in agegroup %}
 *     <li>{{ person.name }}</li>
 *     {% endfor %}
 *   </ul>
 * {% endfor %}
 *
 * @param  {*}      input Input object.
 * @param  {string} key   Key to group by.
 * @return {object}       Grouped arrays by given key.
 */
exports.groupBy = function (input, key) {
  if (!utils.isArray(input)) {
    return input;
  }

  var out = {};

  utils.each(input, function (value) {
    if (!value.hasOwnProperty(key)) {
      return;
    }

    var keyname = value[key],
      newVal = utils.extend({}, value);
    delete value[key];

    if (!out[keyname]) {
      out[keyname] = [];
    }

    out[keyname].push(value);
  });

  return out;
};

/**
 * Join the input with a string.
 *
 * @example
 * // my_array = ['foo', 'bar', 'baz']
 * {{ my_array|join(', ') }}
 * // => foo, bar, baz
 *
 * @example
 * // my_key_object = { a: 'foo', b: 'bar', c: 'baz' }
 * {{ my_key_object|join(' and ') }}
 * // => foo and bar and baz
 *
 * @param  {*}  input
 * @param  {string} glue    String value to join items together.
 * @return {string}
 */
exports.join = function (input, glue) {
  if (utils.isArray(input)) {
    return input.join(glue);
  }

  if (typeof input === 'object') {
    var out = [];
    utils.each(input, function (value) {
      out.push(value);
    });
    return out.join(glue);
  }
  return input;
};

/**
 * Return a string representation of an JavaScript object.
 *
 * Backwards compatible with swig@0.x.x using `json_encode`.
 *
 * @example
 * // val = { a: 'b' }
 * {{ val|json }}
 * // => {"a":"b"}
 *
 * @example
 * // val = { a: 'b' }
 * {{ val|json(4) }}
 * // => {
 * //        "a": "b"
 * //    }
 *
 * @param  {*}    input
 * @param  {number}  [indent]  Number of spaces to indent for pretty-formatting.
 * @return {string}           A valid JSON string.
 */
exports.json = function (input, indent) {
  return JSON.stringify(input, null, indent || 0);
};
exports.json_encode = exports.json;

/**
 * Get the last item in an array or character in a string. All other objects will attempt to return the last value available.
 *
 * @example
 * // my_arr = ['a', 'b', 'c']
 * {{ my_arr|last }}
 * // => c
 *
 * @example
 * // my_val = 'Tacos'
 * {{ my_val|last }}
 * // s
 *
 * @param  {*} input
 * @return {*}          The last item of the array or last character of the string.input.
 */
exports.last = function (input) {
  if (typeof input === 'object' && !utils.isArray(input)) {
    var keys = utils.keys(input);
    return input[keys[keys.length - 1]];
  }

  if (typeof input === 'string') {
    return input.charAt(input.length - 1);
  }

  return input[input.length - 1];
};

/**
 * Return the input in all lowercase letters.
 *
 * @example
 * {{ "FOOBAR"|lower }}
 * // => foobar
 *
 * @example
 * // myObj = { a: 'FOO', b: 'BAR' }
 * {{ myObj|lower|join('') }}
 * // => foobar
 *
 * @param  {*}  input
 * @return {*}          Returns the same type as the input.
 */
exports.lower = function (input) {
  var out = iterateFilter.apply(exports.lower, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.toString().toLowerCase();
};

/**
 * Deprecated in favor of <a href="#safe">safe</a>.
 */
exports.raw = function (input) {
  return exports.safe(input);
};
exports.raw.safe = true;

/**
 * Returns a new string with the matched search pattern replaced by the given replacement string. Uses JavaScript's built-in String.replace() method.
 *
 * @example
 * // my_var = 'foobar';
 * {{ my_var|replace('o', 'e', 'g') }}
 * // => feebar
 *
 * @example
 * // my_var = "farfegnugen";
 * {{ my_var|replace('^f', 'p') }}
 * // => parfegnugen
 *
 * @example
 * // my_var = 'a1b2c3';
 * {{ my_var|replace('\w', '0', 'g') }}
 * // => 010203
 *
 * @param  {string} input
 * @param  {string} search      String or pattern to replace from the input.
 * @param  {string} replacement String to replace matched pattern.
 * @param  {string} [flags]      Regular Expression flags. 'g': global match, 'i': ignore case, 'm': match over multiple lines
 * @return {string}             Replaced string.
 */
exports.replace = function (input, search, replacement, flags) {
  var r = new RegExp(search, flags);
  return input.replace(r, replacement);
};

/**
 * Reverse sort the input. This is an alias for <code data-language="swig">{{ input|sort(true) }}</code>.
 *
 * @example
 * // val = [1, 2, 3];
 * {{ val|reverse }}
 * // => 3,2,1
 *
 * @param  {array}  input
 * @return {array}        Reversed array. The original input object is returned if it was not an array.
 */
exports.reverse = function (input) {
  return exports.sort(input, true);
};

/**
 * Forces the input to not be auto-escaped. Use this only on content that you know is safe to be rendered on your page.
 *
 * @example
 * // my_var = "<p>Stuff</p>";
 * {{ my_var|safe }}
 * // => <p>Stuff</p>
 *
 * @param  {*}  input
 * @return {*}          The input exactly how it was given, regardless of autoescaping status.
 */
exports.safe = function (input) {
  // This is a magic filter. Its logic is hard-coded into Swig's parser.
  return input;
};
exports.safe.safe = true;

/**
 * Sort the input in an ascending direction.
 * If given an object, will return the keys as a sorted array.
 * If given a string, each character will be sorted individually.
 *
 * @example
 * // val = [2, 6, 4];
 * {{ val|sort }}
 * // => 2,4,6
 *
 * @example
 * // val = 'zaq';
 * {{ val|sort }}
 * // => aqz
 *
 * @example
 * // val = { bar: 1, foo: 2 }
 * {{ val|sort(true) }}
 * // => foo,bar
 *
 * @param  {*} input
 * @param {boolean} [reverse=false] Output is given reverse-sorted if true.
 * @return {*}        Sorted array;
 */
exports.sort = function (input, reverse) {
  var out;
  if (utils.isArray(input)) {
    out = input.sort();
  } else {
    switch (typeof input) {
    case 'object':
      out = utils.keys(input).sort();
      break;
    case 'string':
      out = input.split('');
      if (reverse) {
        return out.reverse().join('');
      }
      return out.sort().join('');
    }
  }

  if (out && reverse) {
    return out.reverse();
  }

  return out || input;
};

/**
 * Strip HTML tags.
 *
 * @example
 * // stuff = '<p>foobar</p>';
 * {{ stuff|striptags }}
 * // => foobar
 *
 * @param  {*}  input
 * @return {*}        Returns the same object as the input, but with all string values stripped of tags.
 */
exports.striptags = function (input) {
  var out = iterateFilter.apply(exports.striptags, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.toString().replace(/(<([^>]+)>)/ig, '');
};

/**
 * Capitalizes every word given and lower-cases all other letters.
 *
 * @example
 * // my_str = 'this is soMe text';
 * {{ my_str|title }}
 * // => This Is Some Text
 *
 * @example
 * // my_arr = ['hi', 'this', 'is', 'an', 'array'];
 * {{ my_arr|title|join(' ') }}
 * // => Hi This Is An Array
 *
 * @param  {*}  input
 * @return {*}        Returns the same object as the input, but with all words in strings title-cased.
 */
exports.title = function (input) {
  var out = iterateFilter.apply(exports.title, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.toString().replace(/\w\S*/g, function (str) {
    return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
  });
};

/**
 * Remove all duplicate items from an array.
 *
 * @example
 * // my_arr = [1, 2, 3, 4, 4, 3, 2, 1];
 * {{ my_arr|uniq|join(',') }}
 * // => 1,2,3,4
 *
 * @param  {array}  input
 * @return {array}        Array with unique items. If input was not an array, the original item is returned untouched.
 */
exports.uniq = function (input) {
  var result;

  if (!input || !utils.isArray(input)) {
    return '';
  }

  result = [];
  utils.each(input, function (v) {
    if (result.indexOf(v) === -1) {
      result.push(v);
    }
  });
  return result;
};

/**
 * Convert the input to all uppercase letters. If an object or array is provided, all values will be uppercased.
 *
 * @example
 * // my_str = 'tacos';
 * {{ my_str|upper }}
 * // => TACOS
 *
 * @example
 * // my_arr = ['tacos', 'burritos'];
 * {{ my_arr|upper|join(' & ') }}
 * // => TACOS & BURRITOS
 *
 * @param  {*}  input
 * @return {*}        Returns the same type as the input, with all strings upper-cased.
 */
exports.upper = function (input) {
  var out = iterateFilter.apply(exports.upper, arguments);
  if (out !== undefined) {
    return out;
  }

  return input.toString().toUpperCase();
};

/**
 * URL-encode a string. If an object or array is passed, all values will be URL-encoded.
 *
 * @example
 * // my_str = 'param=1&anotherParam=2';
 * {{ my_str|url_encode }}
 * // => param%3D1%26anotherParam%3D2
 *
 * @param  {*} input
 * @return {*}       URL-encoded string.
 */
exports.url_encode = function (input) {
  var out = iterateFilter.apply(exports.url_encode, arguments);
  if (out !== undefined) {
    return out;
  }
  return encodeURIComponent(input);
};

/**
 * URL-decode a string. If an object or array is passed, all values will be URL-decoded.
 *
 * @example
 * // my_str = 'param%3D1%26anotherParam%3D2';
 * {{ my_str|url_decode }}
 * // => param=1&anotherParam=2
 *
 * @param  {*} input
 * @return {*}       URL-decoded string.
 */
exports.url_decode = function (input) {
  var out = iterateFilter.apply(exports.url_decode, arguments);
  if (out !== undefined) {
    return out;
  }
  return decodeURIComponent(input);
};

},{"./dateformatter":10,"./utils":34}],12:[function(require,module,exports){
var utils = require('./utils');

/**
 * A lexer token.
 * @typedef {object} LexerToken
 * @property {string} match  The string that was matched.
 * @property {number} type   Lexer type enum.
 * @property {number} length Length of the original string processed.
 */

/**
 * Enum for token types.
 * @readonly
 * @enum {number}
 */
var TYPES = {
    /** Whitespace */
    WHITESPACE: 0,
    /** Plain string */
    STRING: 1,
    /** Variable filter */
    FILTER: 2,
    /** Empty variable filter */
    FILTEREMPTY: 3,
    /** Function */
    FUNCTION: 4,
    /** Function with no arguments */
    FUNCTIONEMPTY: 5,
    /** Open parenthesis */
    PARENOPEN: 6,
    /** Close parenthesis */
    PARENCLOSE: 7,
    /** Comma */
    COMMA: 8,
    /** Variable */
    VAR: 9,
    /** Number */
    NUMBER: 10,
    /** Math operator */
    OPERATOR: 11,
    /** Open square bracket */
    BRACKETOPEN: 12,
    /** Close square bracket */
    BRACKETCLOSE: 13,
    /** Key on an object using dot-notation */
    DOTKEY: 14,
    /** Start of an array */
    ARRAYOPEN: 15,
    /** End of an array
     * Currently unused
    ARRAYCLOSE: 16, */
    /** Open curly brace */
    CURLYOPEN: 17,
    /** Close curly brace */
    CURLYCLOSE: 18,
    /** Colon (:) */
    COLON: 19,
    /** JavaScript-valid comparator */
    COMPARATOR: 20,
    /** Boolean logic */
    LOGIC: 21,
    /** Boolean logic "not" */
    NOT: 22,
    /** true or false */
    BOOL: 23,
    /** Variable assignment */
    ASSIGNMENT: 24,
    /** Start of a method */
    METHODOPEN: 25,
    /** End of a method
     * Currently unused
    METHODEND: 26, */
    /** Unknown type */
    UNKNOWN: 100
  },
  rules = [
    {
      type: TYPES.WHITESPACE,
      regex: [
        /^\s+/
      ]
    },
    {
      type: TYPES.STRING,
      regex: [
        /^""/,
        /^".*?[^\\]"/,
        /^''/,
        /^'.*?[^\\]'/
      ]
    },
    {
      type: TYPES.FILTER,
      regex: [
        /^\|\s*(\w+)\(/
      ],
      idx: 1
    },
    {
      type: TYPES.FILTEREMPTY,
      regex: [
        /^\|\s*(\w+)/
      ],
      idx: 1
    },
    {
      type: TYPES.FUNCTIONEMPTY,
      regex: [
        /^\s*(\w+)\(\)/
      ],
      idx: 1
    },
    {
      type: TYPES.FUNCTION,
      regex: [
        /^\s*(\w+)\(/
      ],
      idx: 1
    },
    {
      type: TYPES.PARENOPEN,
      regex: [
        /^\(/
      ]
    },
    {
      type: TYPES.PARENCLOSE,
      regex: [
        /^\)/
      ]
    },
    {
      type: TYPES.COMMA,
      regex: [
        /^,/
      ]
    },
    {
      type: TYPES.LOGIC,
      regex: [
        /^(&&|\|\|)\s*/,
        /^(and|or)\s+/
      ],
      idx: 1,
      replace: {
        'and': '&&',
        'or': '||'
      }
    },
    {
      type: TYPES.COMPARATOR,
      regex: [
        /^(===|==|\!==|\!=|<=|<|>=|>|in\s|gte\s|gt\s|lte\s|lt\s)\s*/
      ],
      idx: 1,
      replace: {
        'gte': '>=',
        'gt': '>',
        'lte': '<=',
        'lt': '<'
      }
    },
    {
      type: TYPES.ASSIGNMENT,
      regex: [
        /^(=|\+=|-=|\*=|\/=)/
      ]
    },
    {
      type: TYPES.NOT,
      regex: [
        /^\!\s*/,
        /^not\s+/
      ],
      replace: {
        'not': '!'
      }
    },
    {
      type: TYPES.BOOL,
      regex: [
        /^(true|false)\s+/,
        /^(true|false)$/
      ],
      idx: 1
    },
    {
      type: TYPES.VAR,
      regex: [
        /^[a-zA-Z_$]\w*((\.\$?\w*)+)?/,
        /^[a-zA-Z_$]\w*/
      ]
    },
    {
      type: TYPES.BRACKETOPEN,
      regex: [
        /^\[/
      ]
    },
    {
      type: TYPES.BRACKETCLOSE,
      regex: [
        /^\]/
      ]
    },
    {
      type: TYPES.CURLYOPEN,
      regex: [
        /^\{/
      ]
    },
    {
      type: TYPES.COLON,
      regex: [
        /^\:/
      ]
    },
    {
      type: TYPES.CURLYCLOSE,
      regex: [
        /^\}/
      ]
    },
    {
      type: TYPES.DOTKEY,
      regex: [
        /^\.(\w+)/
      ],
      idx: 1
    },
    {
      type: TYPES.NUMBER,
      regex: [
        /^[+\-]?\d+(\.\d+)?/
      ]
    },
    {
      type: TYPES.OPERATOR,
      regex: [
        /^(\+|\-|\/|\*|%)/
      ]
    }
  ];

exports.types = TYPES;

/**
 * Return the token type object for a single chunk of a string.
 * @param  {string} str String chunk.
 * @return {LexerToken}     Defined type, potentially stripped or replaced with more suitable content.
 * @private
 */
function reader(str) {
  var matched;

  utils.some(rules, function (rule) {
    return utils.some(rule.regex, function (regex) {
      var match = str.match(regex),
        normalized;

      if (!match) {
        return;
      }

      normalized = match[rule.idx || 0].replace(/\s*$/, '');
      normalized = (rule.hasOwnProperty('replace') && rule.replace.hasOwnProperty(normalized)) ? rule.replace[normalized] : normalized;

      matched = {
        match: normalized,
        type: rule.type,
        length: match[0].length
      };
      return true;
    });
  });

  if (!matched) {
    matched = {
      match: str,
      type: TYPES.UNKNOWN,
      length: str.length
    };
  }

  return matched;
}

/**
 * Read a string and break it into separate token types.
 * @param  {string} str
 * @return {Array.LexerToken}     Array of defined types, potentially stripped or replaced with more suitable content.
 * @private
 */
exports.read = function (str) {
  var offset = 0,
    tokens = [],
    substr,
    match;
  while (offset < str.length) {
    substr = str.substring(offset);
    match = reader(substr);
    offset += match.length;
    tokens.push(match);
  }
  return tokens;
};

},{"./utils":34}],13:[function(require,module,exports){
(function (process){
var fs = require('fs'),
  path = require('path');

/**
 * Loads templates from the file system.
 * @alias swig.loaders.fs
 * @example
 * swig.setDefaults({ loader: swig.loaders.fs() });
 * @example
 * // Load Templates from a specific directory (does not require using relative paths in your templates)
 * swig.setDefaults({ loader: swig.loaders.fs(__dirname + '/templates' )});
 * @param {string}   [basepath='']     Path to the templates as string. Assigning this value allows you to use semi-absolute paths to templates instead of relative paths.
 * @param {string}   [encoding='utf8']   Template encoding
 */
module.exports = function (basepath, encoding) {
  var ret = {};

  encoding = encoding || 'utf8';
  basepath = (basepath) ? path.normalize(basepath) : null;

  /**
   * Resolves <var>to</var> to an absolute path or unique identifier. This is used for building correct, normalized, and absolute paths to a given template.
   * @alias resolve
   * @param  {string} to        Non-absolute identifier or pathname to a file.
   * @param  {string} [from]    If given, should attempt to find the <var>to</var> path in relation to this given, known path.
   * @return {string}
   */
  ret.resolve = function (to, from) {
    if (basepath) {
      from = basepath;
    } else {
      from = (from) ? path.dirname(from) : process.cwd();
    }
    return path.resolve(from, to);
  };

  /**
   * Loads a single template. Given a unique <var>identifier</var> found by the <var>resolve</var> method this should return the given template.
   * @alias load
   * @param  {string}   identifier  Unique identifier of a template (possibly an absolute path).
   * @param  {function} [cb]        Asynchronous callback function. If not provided, this method should run synchronously.
   * @return {string}               Template source string.
   */
  ret.load = function (identifier, cb) {
    if (!fs || (cb && !fs.readFile) || !fs.readFileSync) {
      throw new Error('Unable to find file ' + identifier + ' because there is no filesystem to read from.');
    }

    identifier = ret.resolve(identifier);

    if (cb) {
      fs.readFile(identifier, encoding, cb);
      return;
    }
    return fs.readFileSync(identifier, encoding);
  };

  return ret;
};

}).call(this,require('_process'))

},{"_process":3,"fs":1,"path":2}],14:[function(require,module,exports){
/**
 * @namespace TemplateLoader
 * @description Swig is able to accept custom template loaders written by you, so that your templates can come from your favorite storage medium without needing to be part of the core library.
 * A template loader consists of two methods: <var>resolve</var> and <var>load</var>. Each method is used internally by Swig to find and load the source of the template before attempting to parse and compile it.
 * @example
 * // A theoretical memcached loader
 * var path = require('path'),
 *   Memcached = require('memcached');
 * function memcachedLoader(locations, options) {
 *   var memcached = new Memcached(locations, options);
 *   return {
 *     resolve: function (to, from) {
 *       return path.resolve(from, to);
 *     },
 *     load: function (identifier, cb) {
 *       memcached.get(identifier, function (err, data) {
 *         // if (!data) { load from filesystem; }
 *         cb(err, data);
 *       });
 *     }
 *   };
 * };
 * // Tell swig about the loader:
 * swig.setDefaults({ loader: memcachedLoader(['192.168.0.2']) });
 */

/**
 * @function
 * @name resolve
 * @memberof TemplateLoader
 * @description
 * Resolves <var>to</var> to an absolute path or unique identifier. This is used for building correct, normalized, and absolute paths to a given template.
 * @param  {string} to        Non-absolute identifier or pathname to a file.
 * @param  {string} [from]    If given, should attempt to find the <var>to</var> path in relation to this given, known path.
 * @return {string}
 */

/**
 * @function
 * @name load
 * @memberof TemplateLoader
 * @description
 * Loads a single template. Given a unique <var>identifier</var> found by the <var>resolve</var> method this should return the given template.
 * @param  {string}   identifier  Unique identifier of a template (possibly an absolute path).
 * @param  {function} [cb]        Asynchronous callback function. If not provided, this method should run synchronously.
 * @return {string}               Template source string.
 */

/**
 * @private
 */
exports.fs = require('./filesystem');
exports.memory = require('./memory');

},{"./filesystem":13,"./memory":15}],15:[function(require,module,exports){
var path = require('path'),
  utils = require('../utils');

/**
 * Loads templates from a provided object mapping.
 * @alias swig.loaders.memory
 * @example
 * var templates = {
 *   "layout": "{% block content %}{% endblock %}",
 *   "home.html": "{% extends 'layout.html' %}{% block content %}...{% endblock %}"
 * };
 * swig.setDefaults({ loader: swig.loaders.memory(templates) });
 *
 * @param {object} mapping Hash object with template paths as keys and template sources as values.
 * @param {string} [basepath] Path to the templates as string. Assigning this value allows you to use semi-absolute paths to templates instead of relative paths.
 */
module.exports = function (mapping, basepath) {
  var ret = {};

  basepath = (basepath) ? path.normalize(basepath) : null;

  /**
   * Resolves <var>to</var> to an absolute path or unique identifier. This is used for building correct, normalized, and absolute paths to a given template.
   * @alias resolve
   * @param  {string} to        Non-absolute identifier or pathname to a file.
   * @param  {string} [from]    If given, should attempt to find the <var>to</var> path in relation to this given, known path.
   * @return {string}
   */
  ret.resolve = function (to, from) {
    if (basepath) {
      from = basepath;
    } else {
      from = (from) ? path.dirname(from) : '/';
    }
    return path.resolve(from, to);
  };

  /**
   * Loads a single template. Given a unique <var>identifier</var> found by the <var>resolve</var> method this should return the given template.
   * @alias load
   * @param  {string}   identifier  Unique identifier of a template (possibly an absolute path).
   * @param  {function} [cb]        Asynchronous callback function. If not provided, this method should run synchronously.
   * @return {string}               Template source string.
   */
  ret.load = function (pathname, cb) {
    var src, paths;

    paths = [pathname, pathname.replace(/^(\/|\\)/, '')];

    src = mapping[paths[0]] || mapping[paths[1]];
    if (!src) {
      utils.throwError('Unable to find template "' + pathname + '".');
    }

    if (cb) {
      cb(null, src);
      return;
    }
    return src;
  };

  return ret;
};

},{"../utils":34,"path":2}],16:[function(require,module,exports){
var utils = require('./utils'),
  lexer = require('./lexer');

var _t = lexer.types,
  _reserved = ['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with'];


/**
 * Filters are simply functions that perform transformations on their first input argument.
 * Filters are run at render time, so they may not directly modify the compiled template structure in any way.
 * All of Swig's built-in filters are written in this same way. For more examples, reference the `filters.js` file in Swig's source.
 *
 * To disable auto-escaping on a custom filter, simply add a property to the filter method `safe = true;` and the output from this will not be escaped, no matter what the global settings are for Swig.
 *
 * @typedef {function} Filter
 *
 * @example
 * // This filter will return 'bazbop' if the idx on the input is not 'foobar'
 * swig.setFilter('foobar', function (input, idx) {
 *   return input[idx] === 'foobar' ? input[idx] : 'bazbop';
 * });
 * // myvar = ['foo', 'bar', 'baz', 'bop'];
 * // => {{ myvar|foobar(3) }}
 * // Since myvar[3] !== 'foobar', we render:
 * // => bazbop
 *
 * @example
 * // This filter will disable auto-escaping on its output:
 * function bazbop (input) { return input; }
 * bazbop.safe = true;
 * swig.setFilter('bazbop', bazbop);
 * // => {{ "<p>"|bazbop }}
 * // => <p>
 *
 * @param {*} input Input argument, automatically sent from Swig's built-in parser.
 * @param {...*} [args] All other arguments are defined by the Filter author.
 * @return {*}
 */

/*!
 * Makes a string safe for a regular expression.
 * @param  {string} str
 * @return {string}
 * @private
 */
function escapeRegExp(str) {
  return str.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
}

/**
 * Parse strings of variables and tags into tokens for future compilation.
 * @class
 * @param {array}   tokens     Pre-split tokens read by the Lexer.
 * @param {object}  filters    Keyed object of filters that may be applied to variables.
 * @param {boolean} autoescape Whether or not this should be autoescaped.
 * @param {number}  line       Beginning line number for the first token.
 * @param {string}  [filename] Name of the file being parsed.
 * @private
 */
function TokenParser(tokens, filters, autoescape, line, filename) {
  this.out = [];
  this.state = [];
  this.filterApplyIdx = [];
  this._parsers = {};
  this.line = line;
  this.filename = filename;
  this.filters = filters;
  this.escape = autoescape;

  this.parse = function () {
    var self = this;

    if (self._parsers.start) {
      self._parsers.start.call(self);
    }
    utils.each(tokens, function (token, i) {
      var prevToken = tokens[i - 1];
      self.isLast = (i === tokens.length - 1);
      if (prevToken) {
        while (prevToken.type === _t.WHITESPACE) {
          i -= 1;
          prevToken = tokens[i - 1];
        }
      }
      self.prevToken = prevToken;
      self.parseToken(token);
    });
    if (self._parsers.end) {
      self._parsers.end.call(self);
    }

    if (self.escape) {
      self.filterApplyIdx = [0];
      if (typeof self.escape === 'string') {
        self.parseToken({ type: _t.FILTER, match: 'e' });
        self.parseToken({ type: _t.COMMA, match: ',' });
        self.parseToken({ type: _t.STRING, match: String(autoescape) });
        self.parseToken({ type: _t.PARENCLOSE, match: ')'});
      } else {
        self.parseToken({ type: _t.FILTEREMPTY, match: 'e' });
      }
    }

    return self.out;
  };
}

TokenParser.prototype = {
  /**
   * Set a custom method to be called when a token type is found.
   *
   * @example
   * parser.on(types.STRING, function (token) {
   *   this.out.push(token.match);
   * });
   * @example
   * parser.on('start', function () {
   *   this.out.push('something at the beginning of your args')
   * });
   * parser.on('end', function () {
   *   this.out.push('something at the end of your args');
   * });
   *
   * @param  {number}   type Token type ID. Found in the Lexer.
   * @param  {Function} fn   Callback function. Return true to continue executing the default parsing function.
   * @return {undefined}
   */
  on: function (type, fn) {
    this._parsers[type] = fn;
  },

  /**
   * Parse a single token.
   * @param  {{match: string, type: number, line: number}} token Lexer token object.
   * @return {undefined}
   * @private
   */
  parseToken: function (token) {
    var self = this,
      fn = self._parsers[token.type] || self._parsers['*'],
      match = token.match,
      prevToken = self.prevToken,
      prevTokenType = prevToken ? prevToken.type : null,
      lastState = (self.state.length) ? self.state[self.state.length - 1] : null,
      temp;

    if (fn && typeof fn === 'function') {
      if (!fn.call(this, token)) {
        return;
      }
    }

    if (lastState && prevToken &&
        lastState === _t.FILTER &&
        prevTokenType === _t.FILTER &&
        token.type !== _t.PARENCLOSE &&
        token.type !== _t.COMMA &&
        token.type !== _t.OPERATOR &&
        token.type !== _t.FILTER &&
        token.type !== _t.FILTEREMPTY) {
      self.out.push(', ');
    }

    if (lastState && lastState === _t.METHODOPEN) {
      self.state.pop();
      if (token.type !== _t.PARENCLOSE) {
        self.out.push(', ');
      }
    }

    switch (token.type) {
    case _t.WHITESPACE:
      break;

    case _t.STRING:
      self.filterApplyIdx.push(self.out.length);
      self.out.push(match.replace(/\\/g, '\\\\'));
      break;

    case _t.NUMBER:
    case _t.BOOL:
      self.filterApplyIdx.push(self.out.length);
      self.out.push(match);
      break;

    case _t.FILTER:
      if (!self.filters.hasOwnProperty(match) || typeof self.filters[match] !== "function") {
        utils.throwError('Invalid filter "' + match + '"', self.line, self.filename);
      }
      self.escape = self.filters[match].safe ? false : self.escape;
      self.out.splice(self.filterApplyIdx[self.filterApplyIdx.length - 1], 0, '_filters["' + match + '"](');
      self.state.push(token.type);
      break;

    case _t.FILTEREMPTY:
      if (!self.filters.hasOwnProperty(match) || typeof self.filters[match] !== "function") {
        utils.throwError('Invalid filter "' + match + '"', self.line, self.filename);
      }
      self.escape = self.filters[match].safe ? false : self.escape;
      self.out.splice(self.filterApplyIdx[self.filterApplyIdx.length - 1], 0, '_filters["' + match + '"](');
      self.out.push(')');
      break;

    case _t.FUNCTION:
    case _t.FUNCTIONEMPTY:
      self.out.push('((typeof _ctx.' + match + ' !== "undefined") ? _ctx.' + match +
        ' : ((typeof ' + match + ' !== "undefined") ? ' + match +
        ' : _fn))(');
      self.escape = false;
      if (token.type === _t.FUNCTIONEMPTY) {
        self.out[self.out.length - 1] = self.out[self.out.length - 1] + ')';
      } else {
        self.state.push(token.type);
      }
      self.filterApplyIdx.push(self.out.length - 1);
      break;

    case _t.PARENOPEN:
      self.state.push(token.type);
      if (self.filterApplyIdx.length) {
        self.out.splice(self.filterApplyIdx[self.filterApplyIdx.length - 1], 0, '(');
        if (prevToken && prevTokenType === _t.VAR) {
          temp = prevToken.match.split('.').slice(0, -1);
          self.out.push(' || _fn).call(' + self.checkMatch(temp));
          self.state.push(_t.METHODOPEN);
          self.escape = false;
        } else {
          self.out.push(' || _fn)(');
        }
        self.filterApplyIdx.push(self.out.length - 3);
      } else {
        self.out.push('(');
        self.filterApplyIdx.push(self.out.length - 1);
      }
      break;

    case _t.PARENCLOSE:
      temp = self.state.pop();
      if (temp !== _t.PARENOPEN && temp !== _t.FUNCTION && temp !== _t.FILTER) {
        utils.throwError('Mismatched nesting state', self.line, self.filename);
      }
      self.out.push(')');
      // Once off the previous entry
      self.filterApplyIdx.pop();
      if (temp !== _t.FILTER) {
        // Once for the open paren
        self.filterApplyIdx.pop();
      }
      break;

    case _t.COMMA:
      if (lastState !== _t.FUNCTION &&
          lastState !== _t.FILTER &&
          lastState !== _t.ARRAYOPEN &&
          lastState !== _t.CURLYOPEN &&
          lastState !== _t.PARENOPEN &&
          lastState !== _t.COLON) {
        utils.throwError('Unexpected comma', self.line, self.filename);
      }
      if (lastState === _t.COLON) {
        self.state.pop();
      }
      self.out.push(', ');
      self.filterApplyIdx.pop();
      break;

    case _t.LOGIC:
    case _t.COMPARATOR:
      if (!prevToken ||
          prevTokenType === _t.COMMA ||
          prevTokenType === token.type ||
          prevTokenType === _t.BRACKETOPEN ||
          prevTokenType === _t.CURLYOPEN ||
          prevTokenType === _t.PARENOPEN ||
          prevTokenType === _t.FUNCTION) {
        utils.throwError('Unexpected logic', self.line, self.filename);
      }
      self.out.push(token.match);
      break;

    case _t.NOT:
      self.out.push(token.match);
      break;

    case _t.VAR:
      self.parseVar(token, match, lastState);
      break;

    case _t.BRACKETOPEN:
      if (!prevToken ||
          (prevTokenType !== _t.VAR &&
            prevTokenType !== _t.BRACKETCLOSE &&
            prevTokenType !== _t.PARENCLOSE)) {
        self.state.push(_t.ARRAYOPEN);
        self.filterApplyIdx.push(self.out.length);
      } else {
        self.state.push(token.type);
      }
      self.out.push('[');
      break;

    case _t.BRACKETCLOSE:
      temp = self.state.pop();
      if (temp !== _t.BRACKETOPEN && temp !== _t.ARRAYOPEN) {
        utils.throwError('Unexpected closing square bracket', self.line, self.filename);
      }
      self.out.push(']');
      self.filterApplyIdx.pop();
      break;

    case _t.CURLYOPEN:
      self.state.push(token.type);
      self.out.push('{');
      self.filterApplyIdx.push(self.out.length - 1);
      break;

    case _t.COLON:
      if (lastState !== _t.CURLYOPEN) {
        utils.throwError('Unexpected colon', self.line, self.filename);
      }
      self.state.push(token.type);
      self.out.push(':');
      self.filterApplyIdx.pop();
      break;

    case _t.CURLYCLOSE:
      if (lastState === _t.COLON) {
        self.state.pop();
      }
      if (self.state.pop() !== _t.CURLYOPEN) {
        utils.throwError('Unexpected closing curly brace', self.line, self.filename);
      }
      self.out.push('}');

      self.filterApplyIdx.pop();
      break;

    case _t.DOTKEY:
      if (!prevToken || (
          prevTokenType !== _t.VAR &&
          prevTokenType !== _t.BRACKETCLOSE &&
          prevTokenType !== _t.DOTKEY &&
          prevTokenType !== _t.PARENCLOSE &&
          prevTokenType !== _t.FUNCTIONEMPTY &&
          prevTokenType !== _t.FILTEREMPTY &&
          prevTokenType !== _t.CURLYCLOSE
        )) {
        utils.throwError('Unexpected key "' + match + '"', self.line, self.filename);
      }
      self.out.push('.' + match);
      break;

    case _t.OPERATOR:
      self.out.push(' ' + match + ' ');
      self.filterApplyIdx.pop();
      break;
    }
  },

  /**
   * Parse variable token
   * @param  {{match: string, type: number, line: number}} token      Lexer token object.
   * @param  {string} match       Shortcut for token.match
   * @param  {number} lastState   Lexer token type state.
   * @return {undefined}
   * @private
   */
  parseVar: function (token, match, lastState) {
    var self = this;

    match = match.split('.');

    if (_reserved.indexOf(match[0]) !== -1) {
      utils.throwError('Reserved keyword "' + match[0] + '" attempted to be used as a variable', self.line, self.filename);
    }

    self.filterApplyIdx.push(self.out.length);
    if (lastState === _t.CURLYOPEN) {
      if (match.length > 1) {
        utils.throwError('Unexpected dot', self.line, self.filename);
      }
      self.out.push(match[0]);
      return;
    }

    self.out.push(self.checkMatch(match));
  },

  /**
   * Return contextual dot-check string for a match
   * @param  {string} match       Shortcut for token.match
   * @private
   */
  checkMatch: function (match) {
    var temp = match[0], result;

    function checkDot(ctx) {
      var c = ctx + temp,
        m = match,
        build = '';

      build = '(typeof ' + c + ' !== "undefined" && ' + c + ' !== null';
      utils.each(m, function (v, i) {
        if (i === 0) {
          return;
        }
        build += ' && ' + c + '.' + v + ' !== undefined && ' + c + '.' + v + ' !== null';
        c += '.' + v;
      });
      build += ')';

      return build;
    }

    function buildDot(ctx) {
      return '(' + checkDot(ctx) + ' ? ' + ctx + match.join('.') + ' : "")';
    }
    result = '(' + checkDot('_ctx.') + ' ? ' + buildDot('_ctx.') + ' : ' + buildDot('') + ')';
    return '(' + result + ' !== null ? ' + result + ' : ' + '"" )';
  }
};

/**
 * Parse a source string into tokens that are ready for compilation.
 *
 * @example
 * exports.parse('{{ tacos }}', {}, tags, filters);
 * // => [{ compile: [Function], ... }]
 *
 * @params {object} swig    The current Swig instance
 * @param  {string} source  Swig template source.
 * @param  {object} opts    Swig options object.
 * @param  {object} tags    Keyed object of tags that can be parsed and compiled.
 * @param  {object} filters Keyed object of filters that may be applied to variables.
 * @return {array}          List of tokens ready for compilation.
 */
exports.parse = function (swig, source, opts, tags, filters) {
  source = source.replace(/\r\n/g, '\n');
  var escape = opts.autoescape,
    tagOpen = opts.tagControls[0],
    tagClose = opts.tagControls[1],
    varOpen = opts.varControls[0],
    varClose = opts.varControls[1],
    escapedTagOpen = escapeRegExp(tagOpen),
    escapedTagClose = escapeRegExp(tagClose),
    escapedVarOpen = escapeRegExp(varOpen),
    escapedVarClose = escapeRegExp(varClose),
    tagStrip = new RegExp('^' + escapedTagOpen + '-?\\s*-?|-?\\s*-?' + escapedTagClose + '$', 'g'),
    tagStripBefore = new RegExp('^' + escapedTagOpen + '-'),
    tagStripAfter = new RegExp('-' + escapedTagClose + '$'),
    varStrip = new RegExp('^' + escapedVarOpen + '-?\\s*-?|-?\\s*-?' + escapedVarClose + '$', 'g'),
    varStripBefore = new RegExp('^' + escapedVarOpen + '-'),
    varStripAfter = new RegExp('-' + escapedVarClose + '$'),
    cmtOpen = opts.cmtControls[0],
    cmtClose = opts.cmtControls[1],
    anyChar = '[\\s\\S]*?',
    // Split the template source based on variable, tag, and comment blocks
    // /(\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}|\{#[\s\S]*?#\})/
    splitter = new RegExp(
      '(' +
        escapedTagOpen + anyChar + escapedTagClose + '|' +
        escapedVarOpen + anyChar + escapedVarClose + '|' +
        escapeRegExp(cmtOpen) + anyChar + escapeRegExp(cmtClose) +
        ')'
    ),
    line = 1,
    stack = [],
    parent = null,
    tokens = [],
    blocks = {},
    inRaw = false,
    stripNext;

  /**
   * Parse a variable.
   * @param  {string} str  String contents of the variable, between <i>{{</i> and <i>}}</i>
   * @param  {number} line The line number that this variable starts on.
   * @return {VarToken}      Parsed variable token object.
   * @private
   */
  function parseVariable(str, line) {
    var tokens = lexer.read(utils.strip(str)),
      parser,
      out;

    parser = new TokenParser(tokens, filters, escape, line, opts.filename);
    out = parser.parse().join('');

    if (parser.state.length) {
      utils.throwError('Unable to parse "' + str + '"', line, opts.filename);
    }

    /**
     * A parsed variable token.
     * @typedef {object} VarToken
     * @property {function} compile Method for compiling this token.
     */
    return {
      compile: function () {
        return '_output += ' + out + ';\n';
      }
    };
  }
  exports.parseVariable = parseVariable;

  /**
   * Parse a tag.
   * @param  {string} str  String contents of the tag, between <i>{%</i> and <i>%}</i>
   * @param  {number} line The line number that this tag starts on.
   * @return {TagToken}      Parsed token object.
   * @private
   */
  function parseTag(str, line) {
    var tokens, parser, chunks, tagName, tag, args, last;

    if (utils.startsWith(str, 'end')) {
      last = stack[stack.length - 1];
      if (last && last.name === str.split(/\s+/)[0].replace(/^end/, '') && last.ends) {
        switch (last.name) {
        case 'autoescape':
          escape = opts.autoescape;
          break;
        case 'raw':
          inRaw = false;
          break;
        }
        stack.pop();
        return;
      }

      if (!inRaw) {
        utils.throwError('Unexpected end of tag "' + str.replace(/^end/, '') + '"', line, opts.filename);
      }
    }

    if (inRaw) {
      return;
    }

    chunks = str.split(/\s+(.+)?/);
    tagName = chunks.shift();

    if (!tags.hasOwnProperty(tagName)) {
      utils.throwError('Unexpected tag "' + str + '"', line, opts.filename);
    }

    tokens = lexer.read(utils.strip(chunks.join(' ')));
    parser = new TokenParser(tokens, filters, false, line, opts.filename);
    tag = tags[tagName];

    /**
     * Define custom parsing methods for your tag.
     * @callback parse
     *
     * @example
     * exports.parse = function (str, line, parser, types, options, swig) {
     *   parser.on('start', function () {
     *     // ...
     *   });
     *   parser.on(types.STRING, function (token) {
     *     // ...
     *   });
     * };
     *
     * @param {string} str The full token string of the tag.
     * @param {number} line The line number that this tag appears on.
     * @param {TokenParser} parser A TokenParser instance.
     * @param {TYPES} types Lexer token type enum.
     * @param {TagToken[]} stack The current stack of open tags.
     * @param {SwigOpts} options Swig Options Object.
     * @param {object} swig The Swig instance (gives acces to loaders, parsers, etc)
     */
    if (!tag.parse(chunks[1], line, parser, _t, stack, opts, swig)) {
      utils.throwError('Unexpected tag "' + tagName + '"', line, opts.filename);
    }

    parser.parse();
    args = parser.out;

    switch (tagName) {
    case 'autoescape':
      escape = (args[0] !== 'false') ? args[0] : false;
      break;
    case 'raw':
      inRaw = true;
      break;
    }

    /**
     * A parsed tag token.
     * @typedef {Object} TagToken
     * @property {compile} [compile] Method for compiling this token.
     * @property {array} [args] Array of arguments for the tag.
     * @property {Token[]} [content=[]] An array of tokens that are children of this Token.
     * @property {boolean} [ends] Whether or not this tag requires an end tag.
     * @property {string} name The name of this tag.
     */
    return {
      block: !!tags[tagName].block,
      compile: tag.compile,
      args: args,
      content: [],
      ends: tag.ends,
      name: tagName
    };
  }

  /**
   * Strip the whitespace from the previous token, if it is a string.
   * @param  {object} token Parsed token.
   * @return {object}       If the token was a string, trailing whitespace will be stripped.
   */
  function stripPrevToken(token) {
    if (typeof token === 'string') {
      token = token.replace(/\s*$/, '');
    }
    return token;
  }

  /*!
   * Loop over the source, split via the tag/var/comment regular expression splitter.
   * Send each chunk to the appropriate parser.
   */
  utils.each(source.split(splitter), function (chunk) {
    var token, lines, stripPrev, prevToken, prevChildToken;

    if (!chunk) {
      return;
    }

    // Is a variable?
    if (!inRaw && utils.startsWith(chunk, varOpen) && utils.endsWith(chunk, varClose)) {
      stripPrev = varStripBefore.test(chunk);
      stripNext = varStripAfter.test(chunk);
      token = parseVariable(chunk.replace(varStrip, ''), line);
    // Is a tag?
    } else if (utils.startsWith(chunk, tagOpen) && utils.endsWith(chunk, tagClose)) {
      stripPrev = tagStripBefore.test(chunk);
      stripNext = tagStripAfter.test(chunk);
      token = parseTag(chunk.replace(tagStrip, ''), line);
      if (token) {
        if (token.name === 'extends') {
          parent = token.args.join('').replace(/^\'|\'$/g, '').replace(/^\"|\"$/g, '');
        } else if (token.block && !stack.length) {
          blocks[token.args.join('')] = token;
        }
      }
      if (inRaw && !token) {
        token = chunk;
      }
    // Is a content string?
    } else if (inRaw || (!utils.startsWith(chunk, cmtOpen) && !utils.endsWith(chunk, cmtClose))) {
      token = (stripNext) ? chunk.replace(/^\s*/, '') : chunk;
      stripNext = false;
    } else if (utils.startsWith(chunk, cmtOpen) && utils.endsWith(chunk, cmtClose)) {
      return;
    }

    // Did this tag ask to strip previous whitespace? <code>{%- ... %}</code> or <code>{{- ... }}</code>
    if (stripPrev && tokens.length) {
      prevToken = tokens.pop();
      if (typeof prevToken === 'string') {
        prevToken = stripPrevToken(prevToken);
      } else if (prevToken.content && prevToken.content.length) {
        prevChildToken = stripPrevToken(prevToken.content.pop());
        prevToken.content.push(prevChildToken);
      }
      tokens.push(prevToken);
    }

    // This was a comment, so let's just keep going.
    if (!token) {
      return;
    }

    // If there's an open item in the stack, add this to its content.
    if (stack.length) {
      stack[stack.length - 1].content.push(token);
    } else {
      tokens.push(token);
    }

    // If the token is a tag that requires an end tag, open it on the stack.
    if (token.name && token.ends) {
      stack.push(token);
    }

    lines = chunk.match(/\n/g);
    line += (lines) ? lines.length : 0;
  });

  return {
    name: opts.filename,
    parent: parent,
    tokens: tokens,
    blocks: blocks
  };
};


/**
 * Compile an array of tokens.
 * @param  {Token[]} template     An array of template tokens.
 * @param  {Templates[]} parents  Array of parent templates.
 * @param  {SwigOpts} [options]   Swig options object.
 * @param  {string} [blockName]   Name of the current block context.
 * @return {string}               Partial for a compiled JavaScript method that will output a rendered template.
 */
exports.compile = function (template, parents, options, blockName) {
  var out = '',
    tokens = utils.isArray(template) ? template : template.tokens;

  utils.each(tokens, function (token) {
    var o;
    if (typeof token === 'string') {
      out += '_output += "' + token.replace(/\\/g, '\\\\').replace(/\n|\r/g, '\\n').replace(/"/g, '\\"') + '";\n';
      return;
    }

    /**
     * Compile callback for VarToken and TagToken objects.
     * @callback compile
     *
     * @example
     * exports.compile = function (compiler, args, content, parents, options, blockName) {
     *   if (args[0] === 'foo') {
     *     return compiler(content, parents, options, blockName) + '\n';
     *   }
     *   return '_output += "fallback";\n';
     * };
     *
     * @param {parserCompiler} compiler
     * @param {array} [args] Array of parsed arguments on the for the token.
     * @param {array} [content] Array of content within the token.
     * @param {array} [parents] Array of parent templates for the current template context.
     * @param {SwigOpts} [options] Swig Options Object
     * @param {string} [blockName] Name of the direct block parent, if any.
     */
    o = token.compile(exports.compile, token.args ? token.args.slice(0) : [], token.content ? token.content.slice(0) : [], parents, options, blockName);
    out += o || '';
  });

  return out;
};

},{"./lexer":12,"./utils":34}],17:[function(require,module,exports){
var utils = require('./utils'),
  _tags = require('./tags'),
  _filters = require('./filters'),
  parser = require('./parser'),
  dateformatter = require('./dateformatter'),
  loaders = require('./loaders');

/**
 * Swig version number as a string.
 * @example
 * if (swig.version === "1.4.2") { ... }
 *
 * @type {String}
 */
exports.version = "1.4.2";

/**
 * Swig Options Object. This object can be passed to many of the API-level Swig methods to control various aspects of the engine. All keys are optional.
 * @typedef {Object} SwigOpts
 * @property {boolean} autoescape  Controls whether or not variable output will automatically be escaped for safe HTML output. Defaults to <code data-language="js">true</code>. Functions executed in variable statements will not be auto-escaped. Your application/functions should take care of their own auto-escaping.
 * @property {array}   varControls Open and close controls for variables. Defaults to <code data-language="js">['{{', '}}']</code>.
 * @property {array}   tagControls Open and close controls for tags. Defaults to <code data-language="js">['{%', '%}']</code>.
 * @property {array}   cmtControls Open and close controls for comments. Defaults to <code data-language="js">['{#', '#}']</code>.
 * @property {object}  locals      Default variable context to be passed to <strong>all</strong> templates.
 * @property {CacheOptions} cache Cache control for templates. Defaults to saving in <code data-language="js">'memory'</code>. Send <code data-language="js">false</code> to disable. Send an object with <code data-language="js">get</code> and <code data-language="js">set</code> functions to customize.
 * @property {TemplateLoader} loader The method that Swig will use to load templates. Defaults to <var>swig.loaders.fs</var>.
 */
var defaultOptions = {
    autoescape: true,
    varControls: ['{{', '}}'],
    tagControls: ['{%', '%}'],
    cmtControls: ['{#', '#}'],
    locals: {},
    /**
     * Cache control for templates. Defaults to saving all templates into memory.
     * @typedef {boolean|string|object} CacheOptions
     * @example
     * // Default
     * swig.setDefaults({ cache: 'memory' });
     * @example
     * // Disables caching in Swig.
     * swig.setDefaults({ cache: false });
     * @example
     * // Custom cache storage and retrieval
     * swig.setDefaults({
     *   cache: {
     *     get: function (key) { ... },
     *     set: function (key, val) { ... }
     *   }
     * });
     */
    cache: 'memory',
    /**
     * Configure Swig to use either the <var>swig.loaders.fs</var> or <var>swig.loaders.memory</var> template loader. Or, you can write your own!
     * For more information, please see the <a href="../loaders/">Template Loaders documentation</a>.
     * @typedef {class} TemplateLoader
     * @example
     * // Default, FileSystem loader
     * swig.setDefaults({ loader: swig.loaders.fs() });
     * @example
     * // FileSystem loader allowing a base path
     * // With this, you don't use relative URLs in your template references
     * swig.setDefaults({ loader: swig.loaders.fs(__dirname + '/templates') });
     * @example
     * // Memory Loader
     * swig.setDefaults({ loader: swig.loaders.memory({
     *   layout: '{% block foo %}{% endblock %}',
     *   page1: '{% extends "layout" %}{% block foo %}Tacos!{% endblock %}'
     * })});
     */
    loader: loaders.fs()
  },
  defaultInstance;

/**
 * Empty function, used in templates.
 * @return {string} Empty string
 * @private
 */
function efn() { return ''; }

/**
 * Validate the Swig options object.
 * @param  {?SwigOpts} options Swig options object.
 * @return {undefined}      This method will throw errors if anything is wrong.
 * @private
 */
function validateOptions(options) {
  if (!options) {
    return;
  }

  utils.each(['varControls', 'tagControls', 'cmtControls'], function (key) {
    if (!options.hasOwnProperty(key)) {
      return;
    }
    if (!utils.isArray(options[key]) || options[key].length !== 2) {
      throw new Error('Option "' + key + '" must be an array containing 2 different control strings.');
    }
    if (options[key][0] === options[key][1]) {
      throw new Error('Option "' + key + '" open and close controls must not be the same.');
    }
    utils.each(options[key], function (a, i) {
      if (a.length < 2) {
        throw new Error('Option "' + key + '" ' + ((i) ? 'open ' : 'close ') + 'control must be at least 2 characters. Saw "' + a + '" instead.');
      }
    });
  });

  if (options.hasOwnProperty('cache')) {
    if (options.cache && options.cache !== 'memory') {
      if (!options.cache.get || !options.cache.set) {
        throw new Error('Invalid cache option ' + JSON.stringify(options.cache) + ' found. Expected "memory" or { get: function (key) { ... }, set: function (key, value) { ... } }.');
      }
    }
  }
  if (options.hasOwnProperty('loader')) {
    if (options.loader) {
      if (!options.loader.load || !options.loader.resolve) {
        throw new Error('Invalid loader option ' + JSON.stringify(options.loader) + ' found. Expected { load: function (pathname, cb) { ... }, resolve: function (to, from) { ... } }.');
      }
    }
  }

}

/**
 * Set defaults for the base and all new Swig environments.
 *
 * @example
 * swig.setDefaults({ cache: false });
 * // => Disables Cache
 *
 * @example
 * swig.setDefaults({ locals: { now: function () { return new Date(); } }});
 * // => sets a globally accessible method for all template
 * //    contexts, allowing you to print the current date
 * // => {{ now()|date('F jS, Y') }}
 *
 * @param  {SwigOpts} [options={}] Swig options object.
 * @return {undefined}
 */
exports.setDefaults = function (options) {
  validateOptions(options);
  defaultInstance.options = utils.extend(defaultInstance.options, options);
};

/**
 * Set the default TimeZone offset for date formatting via the date filter. This is a global setting and will affect all Swig environments, old or new.
 * @param  {number} offset Offset from GMT, in minutes.
 * @return {undefined}
 */
exports.setDefaultTZOffset = function (offset) {
  dateformatter.tzOffset = offset;
};

/**
 * Create a new, separate Swig compile/render environment.
 *
 * @example
 * var swig = require('swig');
 * var myswig = new swig.Swig({varControls: ['<%=', '%>']});
 * myswig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => Tacos are delicious!
 * swig.render('Tacos are <%= tacos =>!', { locals: { tacos: 'delicious' }});
 * // => 'Tacos are <%= tacos =>!'
 *
 * @param  {SwigOpts} [opts={}] Swig options object.
 * @return {object}      New Swig environment.
 */
exports.Swig = function (opts) {
  validateOptions(opts);
  this.options = utils.extend({}, defaultOptions, opts || {});
  this.cache = {};
  this.extensions = {};
  var self = this,
    tags = _tags,
    filters = _filters;

  /**
   * Get combined locals context.
   * @param  {?SwigOpts} [options] Swig options object.
   * @return {object}         Locals context.
   * @private
   */
  function getLocals(options) {
    if (!options || !options.locals) {
      return self.options.locals;
    }

    return utils.extend({}, self.options.locals, options.locals);
  }

  /**
   * Determine whether caching is enabled via the options provided and/or defaults
   * @param  {SwigOpts} [options={}] Swig Options Object
   * @return {boolean}
   * @private
   */
  function shouldCache(options) {
    options = options || {};
    return (options.hasOwnProperty('cache') && !options.cache) || !self.options.cache;
  }

  /**
   * Get compiled template from the cache.
   * @param  {string} key           Name of template.
   * @return {object|undefined}     Template function and tokens.
   * @private
   */
  function cacheGet(key, options) {
    if (shouldCache(options)) {
      return;
    }

    if (self.options.cache === 'memory') {
      return self.cache[key];
    }

    return self.options.cache.get(key);
  }

  /**
   * Store a template in the cache.
   * @param  {string} key Name of template.
   * @param  {object} val Template function and tokens.
   * @return {undefined}
   * @private
   */
  function cacheSet(key, options, val) {
    if (shouldCache(options)) {
      return;
    }

    if (self.options.cache === 'memory') {
      self.cache[key] = val;
      return;
    }

    self.options.cache.set(key, val);
  }

  /**
   * Clears the in-memory template cache.
   *
   * @example
   * swig.invalidateCache();
   *
   * @return {undefined}
   */
  this.invalidateCache = function () {
    if (self.options.cache === 'memory') {
      self.cache = {};
    }
  };

  /**
   * Add a custom filter for swig variables.
   *
   * @example
   * function replaceMs(input) { return input.replace(/m/g, 'f'); }
   * swig.setFilter('replaceMs', replaceMs);
   * // => {{ "onomatopoeia"|replaceMs }}
   * // => onofatopeia
   *
   * @param {string}    name    Name of filter, used in templates. <strong>Will</strong> overwrite previously defined filters, if using the same name.
   * @param {function}  method  Function that acts against the input. See <a href="/docs/filters/#custom">Custom Filters</a> for more information.
   * @return {undefined}
   */
  this.setFilter = function (name, method) {
    if (typeof method !== "function") {
      throw new Error('Filter "' + name + '" is not a valid function.');
    }
    filters[name] = method;
  };

  /**
   * Add a custom tag. To expose your own extensions to compiled template code, see <code data-language="js">swig.setExtension</code>.
   *
   * For a more in-depth explanation of writing custom tags, see <a href="../extending/#tags">Custom Tags</a>.
   *
   * @example
   * var tacotag = require('./tacotag');
   * swig.setTag('tacos', tacotag.parse, tacotag.compile, tacotag.ends, tacotag.blockLevel);
   * // => {% tacos %}Make this be tacos.{% endtacos %}
   * // => Tacos tacos tacos tacos.
   *
   * @param  {string} name      Tag name.
   * @param  {function} parse   Method for parsing tokens.
   * @param  {function} compile Method for compiling renderable output.
   * @param  {boolean} [ends=false]     Whether or not this tag requires an <i>end</i> tag.
   * @param  {boolean} [blockLevel=false] If false, this tag will not be compiled outside of <code>block</code> tags when extending a parent template.
   * @return {undefined}
   */
  this.setTag = function (name, parse, compile, ends, blockLevel) {
    if (typeof parse !== 'function') {
      throw new Error('Tag "' + name + '" parse method is not a valid function.');
    }

    if (typeof compile !== 'function') {
      throw new Error('Tag "' + name + '" compile method is not a valid function.');
    }

    tags[name] = {
      parse: parse,
      compile: compile,
      ends: ends || false,
      block: !!blockLevel
    };
  };

  /**
   * Add extensions for custom tags. This allows any custom tag to access a globally available methods via a special globally available object, <var>_ext</var>, in templates.
   *
   * @example
   * swig.setExtension('trans', function (v) { return translate(v); });
   * function compileTrans(compiler, args, content, parent, options) {
   *   return '_output += _ext.trans(' + args[0] + ');'
   * };
   * swig.setTag('trans', parseTrans, compileTrans, true);
   *
   * @param  {string} name   Key name of the extension. Accessed via <code data-language="js">_ext[name]</code>.
   * @param  {*}      object The method, value, or object that should be available via the given name.
   * @return {undefined}
   */
  this.setExtension = function (name, object) {
    self.extensions[name] = object;
  };

  /**
   * Parse a given source string into tokens.
   *
   * @param  {string} source  Swig template source.
   * @param  {SwigOpts} [options={}] Swig options object.
   * @return {object} parsed  Template tokens object.
   * @private
   */
  this.parse = function (source, options) {
    validateOptions(options);

    var locals = getLocals(options),
      opts = {},
      k;

    for (k in options) {
      if (options.hasOwnProperty(k) && k !== 'locals') {
        opts[k] = options[k];
      }
    }

    options = utils.extend({}, self.options, opts);
    options.locals = locals;

    return parser.parse(this, source, options, tags, filters);
  };

  /**
   * Parse a given file into tokens.
   *
   * @param  {string} pathname  Full path to file to parse.
   * @param  {SwigOpts} [options={}]   Swig options object.
   * @return {object} parsed    Template tokens object.
   * @private
   */
  this.parseFile = function (pathname, options) {
    var src;

    if (!options) {
      options = {};
    }

    pathname = self.options.loader.resolve(pathname, options.resolveFrom);

    src = self.options.loader.load(pathname);

    if (!options.filename) {
      options = utils.extend({ filename: pathname }, options);
    }

    return self.parse(src, options);
  };

  /**
   * Re-Map blocks within a list of tokens to the template's block objects.
   * @param  {array}  tokens   List of tokens for the parent object.
   * @param  {object} template Current template that needs to be mapped to the  parent's block and token list.
   * @return {array}
   * @private
   */
  function remapBlocks(blocks, tokens) {
    return utils.map(tokens, function (token) {
      var args = token.args ? token.args.join('') : '';
      if (token.name === 'block' && blocks[args]) {
        token = blocks[args];
      }
      if (token.content && token.content.length) {
        token.content = remapBlocks(blocks, token.content);
      }
      return token;
    });
  }

  /**
   * Import block-level tags to the token list that are not actual block tags.
   * @param  {array} blocks List of block-level tags.
   * @param  {array} tokens List of tokens to render.
   * @return {undefined}
   * @private
   */
  function importNonBlocks(blocks, tokens) {
    var temp = [];
    utils.each(blocks, function (block) { temp.push(block); });
    utils.each(temp.reverse(), function (block) {
      if (block.name !== 'block') {
        tokens.unshift(block);
      }
    });
  }

  /**
   * Recursively compile and get parents of given parsed token object.
   *
   * @param  {object} tokens    Parsed tokens from template.
   * @param  {SwigOpts} [options={}]   Swig options object.
   * @return {object}           Parsed tokens from parent templates.
   * @private
   */
  function getParents(tokens, options) {
    var parentName = tokens.parent,
      parentFiles = [],
      parents = [],
      parentFile,
      parent,
      l;

    while (parentName) {
      if (!options || !options.filename) {
        throw new Error('Cannot extend "' + parentName + '" because current template has no filename.');
      }

      parentFile = parentFile || options.filename;
      parentFile = self.options.loader.resolve(parentName, parentFile);
      parent = cacheGet(parentFile, options) || self.parseFile(parentFile, utils.extend({}, options, { filename: parentFile }));
      parentName = parent.parent;

      if (parentFiles.indexOf(parentFile) !== -1) {
        throw new Error('Illegal circular extends of "' + parentFile + '".');
      }
      parentFiles.push(parentFile);

      parents.push(parent);
    }

    // Remap each parents'(1) blocks onto its own parent(2), receiving the full token list for rendering the original parent(1) on its own.
    l = parents.length;
    for (l = parents.length - 2; l >= 0; l -= 1) {
      parents[l].tokens = remapBlocks(parents[l].blocks, parents[l + 1].tokens);
      importNonBlocks(parents[l].blocks, parents[l].tokens);
    }

    return parents;
  }

  /**
   * Pre-compile a source string into a cache-able template function.
   *
   * @example
   * swig.precompile('{{ tacos }}');
   * // => {
   * //      tpl: function (_swig, _locals, _filters, _utils, _fn) { ... },
   * //      tokens: {
   * //        name: undefined,
   * //        parent: null,
   * //        tokens: [...],
   * //        blocks: {}
   * //      }
   * //    }
   *
   * In order to render a pre-compiled template, you must have access to filters and utils from Swig. <var>efn</var> is simply an empty function that does nothing.
   *
   * @param  {string} source  Swig template source string.
   * @param  {SwigOpts} [options={}] Swig options object.
   * @return {object}         Renderable function and tokens object.
   */
  this.precompile = function (source, options) {
    var tokens = self.parse(source, options),
      parents = getParents(tokens, options),
      tpl,
      err;

    if (parents.length) {
      // Remap the templates first-parent's tokens using this template's blocks.
      tokens.tokens = remapBlocks(tokens.blocks, parents[0].tokens);
      importNonBlocks(tokens.blocks, tokens.tokens);
    }

    try {
      tpl = new Function('_swig', '_ctx', '_filters', '_utils', '_fn',
        '  var _ext = _swig.extensions,\n' +
        '    _output = "";\n' +
        parser.compile(tokens, parents, options) + '\n' +
        '  return _output;\n'
        );
    } catch (e) {
      utils.throwError(e, null, options.filename);
    }

    return { tpl: tpl, tokens: tokens };
  };

  /**
   * Compile and render a template string for final output.
   *
   * When rendering a source string, a file path should be specified in the options object in order for <var>extends</var>, <var>include</var>, and <var>import</var> to work properly. Do this by adding <code data-language="js">{ filename: '/absolute/path/to/mytpl.html' }</code> to the options argument.
   *
   * @example
   * swig.render('{{ tacos }}', { locals: { tacos: 'Tacos!!!!' }});
   * // => Tacos!!!!
   *
   * @param  {string} source    Swig template source string.
   * @param  {SwigOpts} [options={}] Swig options object.
   * @return {string}           Rendered output.
   */
  this.render = function (source, options) {
    return self.compile(source, options)();
  };

  /**
   * Compile and render a template file for final output. This is most useful for libraries like Express.js.
   *
   * @example
   * swig.renderFile('./template.html', {}, function (err, output) {
   *   if (err) {
   *     throw err;
   *   }
   *   console.log(output);
   * });
   *
   * @example
   * swig.renderFile('./template.html', {});
   * // => output
   *
   * @param  {string}   pathName    File location.
   * @param  {object}   [locals={}] Template variable context.
   * @param  {Function} [cb] Asyncronous callback function. If not provided, <var>compileFile</var> will run syncronously.
   * @return {string}             Rendered output.
   */
  this.renderFile = function (pathName, locals, cb) {
    if (cb) {
      self.compileFile(pathName, {}, function (err, fn) {
        var result;

        if (err) {
          cb(err);
          return;
        }

        try {
          result = fn(locals);
        } catch (err2) {
          cb(err2);
          return;
        }

        cb(null, result);
      });
      return;
    }

    return self.compileFile(pathName)(locals);
  };

  /**
   * Compile string source into a renderable template function.
   *
   * @example
   * var tpl = swig.compile('{{ tacos }}');
   * // => {
   * //      [Function: compiled]
   * //      parent: null,
   * //      tokens: [{ compile: [Function] }],
   * //      blocks: {}
   * //    }
   * tpl({ tacos: 'Tacos!!!!' });
   * // => Tacos!!!!
   *
   * When compiling a source string, a file path should be specified in the options object in order for <var>extends</var>, <var>include</var>, and <var>import</var> to work properly. Do this by adding <code data-language="js">{ filename: '/absolute/path/to/mytpl.html' }</code> to the options argument.
   *
   * @param  {string} source    Swig template source string.
   * @param  {SwigOpts} [options={}] Swig options object.
   * @return {function}         Renderable function with keys for parent, blocks, and tokens.
   */
  this.compile = function (source, options) {
    var key = options ? options.filename : null,
      cached = key ? cacheGet(key, options) : null,
      context,
      contextLength,
      pre;

    if (cached) {
      return cached;
    }

    context = getLocals(options);
    contextLength = utils.keys(context).length;
    pre = this.precompile(source, options);

    function compiled(locals) {
      var lcls;
      if (locals && contextLength) {
        lcls = utils.extend({}, context, locals);
      } else if (locals && !contextLength) {
        lcls = locals;
      } else if (!locals && contextLength) {
        lcls = context;
      } else {
        lcls = {};
      }
      return pre.tpl(self, lcls, filters, utils, efn);
    }

    utils.extend(compiled, pre.tokens);

    if (key) {
      cacheSet(key, options, compiled);
    }

    return compiled;
  };

  /**
   * Compile a source file into a renderable template function.
   *
   * @example
   * var tpl = swig.compileFile('./mytpl.html');
   * // => {
   * //      [Function: compiled]
   * //      parent: null,
   * //      tokens: [{ compile: [Function] }],
   * //      blocks: {}
   * //    }
   * tpl({ tacos: 'Tacos!!!!' });
   * // => Tacos!!!!
   *
   * @example
   * swig.compileFile('/myfile.txt', { varControls: ['<%=', '=%>'], tagControls: ['<%', '%>']});
   * // => will compile 'myfile.txt' using the var and tag controls as specified.
   *
   * @param  {string} pathname  File location.
   * @param  {SwigOpts} [options={}] Swig options object.
   * @param  {Function} [cb] Asyncronous callback function. If not provided, <var>compileFile</var> will run syncronously.
   * @return {function}         Renderable function with keys for parent, blocks, and tokens.
   */
  this.compileFile = function (pathname, options, cb) {
    var src, cached;

    if (!options) {
      options = {};
    }

    pathname = self.options.loader.resolve(pathname, options.resolveFrom);
    if (!options.filename) {
      options = utils.extend({ filename: pathname }, options);
    }
    cached = cacheGet(pathname, options);

    if (cached) {
      if (cb) {
        cb(null, cached);
        return;
      }
      return cached;
    }

    if (cb) {
      self.options.loader.load(pathname, function (err, src) {
        if (err) {
          cb(err);
          return;
        }
        var compiled;

        try {
          compiled = self.compile(src, options);
        } catch (err2) {
          cb(err2);
          return;
        }

        cb(err, compiled);
      });
      return;
    }

    src = self.options.loader.load(pathname);
    return self.compile(src, options);
  };

  /**
   * Run a pre-compiled template function. This is most useful in the browser when you've pre-compiled your templates with the Swig command-line tool.
   *
   * @example
   * $ swig compile ./mytpl.html --wrap-start="var mytpl = " > mytpl.js
   * @example
   * <script src="mytpl.js"></script>
   * <script>
   *   swig.run(mytpl, {});
   *   // => "rendered template..."
   * </script>
   *
   * @param  {function} tpl       Pre-compiled Swig template function. Use the Swig CLI to compile your templates.
   * @param  {object} [locals={}] Template variable context.
   * @param  {string} [filepath]  Filename used for caching the template.
   * @return {string}             Rendered output.
   */
  this.run = function (tpl, locals, filepath) {
    var context = getLocals({ locals: locals });
    if (filepath) {
      cacheSet(filepath, {}, tpl);
    }
    return tpl(self, context, filters, utils, efn);
  };
};

/*!
 * Export methods publicly
 */
defaultInstance = new exports.Swig();
exports.setFilter = defaultInstance.setFilter;
exports.setTag = defaultInstance.setTag;
exports.setExtension = defaultInstance.setExtension;
exports.parseFile = defaultInstance.parseFile;
exports.precompile = defaultInstance.precompile;
exports.compile = defaultInstance.compile;
exports.compileFile = defaultInstance.compileFile;
exports.render = defaultInstance.render;
exports.renderFile = defaultInstance.renderFile;
exports.run = defaultInstance.run;
exports.invalidateCache = defaultInstance.invalidateCache;
exports.loaders = loaders;

},{"./dateformatter":10,"./filters":11,"./loaders":14,"./parser":16,"./tags":28,"./utils":34}],18:[function(require,module,exports){
var utils = require('../utils'),
  strings = ['html', 'js'];

/**
 * Control auto-escaping of variable output from within your templates.
 *
 * @alias autoescape
 *
 * @example
 * // myvar = '<foo>';
 * {% autoescape true %}{{ myvar }}{% endautoescape %}
 * // => &lt;foo&gt;
 * {% autoescape false %}{{ myvar }}{% endautoescape %}
 * // => <foo>
 *
 * @param {boolean|string} control One of `true`, `false`, `"js"` or `"html"`.
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  return compiler(content, parents, options, blockName);
};
exports.parse = function (str, line, parser, types, stack, opts) {
  var matched;
  parser.on('*', function (token) {
    if (!matched &&
        (token.type === types.BOOL ||
          (token.type === types.STRING && strings.indexOf(token.match) === -1))
        ) {
      this.out.push(token.match);
      matched = true;
      return;
    }
    utils.throwError('Unexpected token "' + token.match + '" in autoescape tag', line, opts.filename);
  });

  return true;
};
exports.ends = true;

},{"../utils":34}],19:[function(require,module,exports){
/**
 * Defines a block in a template that can be overridden by a template extending this one and/or will override the current template's parent template block of the same name.
 *
 * See <a href="#inheritance">Template Inheritance</a> for more information.
 *
 * @alias block
 *
 * @example
 * {% block body %}...{% endblock %}
 *
 * @param {literal}  name   Name of the block for use in parent and extended templates.
 */
exports.compile = function (compiler, args, content, parents, options) {
  return compiler(content, parents, options, args.join(''));
};

exports.parse = function (str, line, parser) {
  parser.on('*', function (token) {
    this.out.push(token.match);
  });
  return true;
};

exports.ends = true;
exports.block = true;

},{}],20:[function(require,module,exports){
/**
 * Used within an <code data-language="swig">{% if %}</code> tag, the code block following this tag up until <code data-language="swig">{% endif %}</code> will be rendered if the <i>if</i> statement returns false.
 *
 * @alias else
 *
 * @example
 * {% if false %}
 *   statement1
 * {% else %}
 *   statement2
 * {% endif %}
 * // => statement2
 *
 */
exports.compile = function () {
  return '} else {\n';
};

exports.parse = function (str, line, parser, types, stack) {
  parser.on('*', function (token) {
    throw new Error('"else" tag does not accept any tokens. Found "' + token.match + '" on line ' + line + '.');
  });

  return (stack.length && stack[stack.length - 1].name === 'if');
};

},{}],21:[function(require,module,exports){
var ifparser = require('./if').parse;

/**
 * Like <code data-language="swig">{% else %}</code>, except this tag can take more conditional statements.
 *
 * @alias elseif
 * @alias elif
 *
 * @example
 * {% if false %}
 *   Tacos
 * {% elseif true %}
 *   Burritos
 * {% else %}
 *   Churros
 * {% endif %}
 * // => Burritos
 *
 * @param {...mixed} conditional  Conditional statement that returns a truthy or falsy value.
 */
exports.compile = function (compiler, args) {
  return '} else if (' + args.join(' ') + ') {\n';
};

exports.parse = function (str, line, parser, types, stack) {
  var okay = ifparser(str, line, parser, types, stack);
  return okay && (stack.length && stack[stack.length - 1].name === 'if');
};

},{"./if":25}],22:[function(require,module,exports){
/**
 * Makes the current template extend a parent template. This tag must be the first item in your template.
 *
 * See <a href="#inheritance">Template Inheritance</a> for more information.
 *
 * @alias extends
 *
 * @example
 * {% extends "./layout.html" %}
 *
 * @param {string} parentFile  Relative path to the file that this template extends.
 */
exports.compile = function () {};

exports.parse = function () {
  return true;
};

exports.ends = false;

},{}],23:[function(require,module,exports){
var filters = require('../filters');

/**
 * Apply a filter to an entire block of template.
 *
 * @alias filter
 *
 * @example
 * {% filter uppercase %}oh hi, {{ name }}{% endfilter %}
 * // => OH HI, PAUL
 *
 * @example
 * {% filter replace(".", "!", "g") %}Hi. My name is Paul.{% endfilter %}
 * // => Hi! My name is Paul!
 *
 * @param {function} filter  The filter that should be applied to the contents of the tag.
 */

exports.compile = function (compiler, args, content, parents, options, blockName) {
  var filter = args.shift().replace(/\($/, ''),
    val = '(function () {\n' +
      '  var _output = "";\n' +
      compiler(content, parents, options, blockName) +
      '  return _output;\n' +
      '})()';

  if (args[args.length - 1] === ')') {
    args.pop();
  }

  args = (args.length) ? ', ' + args.join('') : '';
  return '_output += _filters["' + filter + '"](' + val + args + ');\n';
};

exports.parse = function (str, line, parser, types) {
  var filter;

  function check(filter) {
    if (!filters.hasOwnProperty(filter)) {
      throw new Error('Filter "' + filter + '" does not exist on line ' + line + '.');
    }
  }

  parser.on(types.FUNCTION, function (token) {
    if (!filter) {
      filter = token.match.replace(/\($/, '');
      check(filter);
      this.out.push(token.match);
      this.state.push(token.type);
      return;
    }
    return true;
  });

  parser.on(types.VAR, function (token) {
    if (!filter) {
      filter = token.match;
      check(filter);
      this.out.push(filter);
      return;
    }
    return true;
  });

  return true;
};

exports.ends = true;

},{"../filters":11}],24:[function(require,module,exports){
var ctx = '_ctx.',
  ctxloop = ctx + 'loop';

/**
 * Loop over objects and arrays.
 *
 * @alias for
 *
 * @example
 * // obj = { one: 'hi', two: 'bye' };
 * {% for x in obj %}
 *   {% if loop.first %}<ul>{% endif %}
 *   <li>{{ loop.index }} - {{ loop.key }}: {{ x }}</li>
 *   {% if loop.last %}</ul>{% endif %}
 * {% endfor %}
 * // => <ul>
 * //    <li>1 - one: hi</li>
 * //    <li>2 - two: bye</li>
 * //    </ul>
 *
 * @example
 * // arr = [1, 2, 3]
 * // Reverse the array, shortcut the key/index to `key`
 * {% for key, val in arr|reverse %}
 * {{ key }} -- {{ val }}
 * {% endfor %}
 * // => 0 -- 3
 * //    1 -- 2
 * //    2 -- 1
 *
 * @param {literal} [key]     A shortcut to the index of the array or current key accessor.
 * @param {literal} variable  The current value will be assigned to this variable name temporarily. The variable will be reset upon ending the for tag.
 * @param {literal} in        Literally, "in". This token is required.
 * @param {object}  object    An enumerable object that will be iterated over.
 *
 * @return {loop.index} The current iteration of the loop (1-indexed)
 * @return {loop.index0} The current iteration of the loop (0-indexed)
 * @return {loop.revindex} The number of iterations from the end of the loop (1-indexed)
 * @return {loop.revindex0} The number of iterations from the end of the loop (0-indexed)
 * @return {loop.key} If the iterator is an object, this will be the key of the current item, otherwise it will be the same as the loop.index.
 * @return {loop.first} True if the current object is the first in the object or array.
 * @return {loop.last} True if the current object is the last in the object or array.
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  var val = args.shift(),
    key = '__k',
    ctxloopcache = (ctx + '__loopcache' + Math.random()).replace(/\./g, ''),
    last;

  if (args[0] && args[0] === ',') {
    args.shift();
    key = val;
    val = args.shift();
  }

  last = args.join('');

  return [
    '(function () {\n',
    '  var __l = ' + last + ', __len = (_utils.isArray(__l) || typeof __l === "string") ? __l.length : _utils.keys(__l).length;\n',
    '  if (!__l) { return; }\n',
    '    var ' + ctxloopcache + ' = { loop: ' + ctxloop + ', ' + val + ': ' + ctx + val + ', ' + key + ': ' + ctx + key + ' };\n',
    '    ' + ctxloop + ' = { first: false, index: 1, index0: 0, revindex: __len, revindex0: __len - 1, length: __len, last: false };\n',
    '  _utils.each(__l, function (' + val + ', ' + key + ') {\n',
    '    ' + ctx + val + ' = ' + val + ';\n',
    '    ' + ctx + key + ' = ' + key + ';\n',
    '    ' + ctxloop + '.key = ' + key + ';\n',
    '    ' + ctxloop + '.first = (' + ctxloop + '.index0 === 0);\n',
    '    ' + ctxloop + '.last = (' + ctxloop + '.revindex0 === 0);\n',
    '    ' + compiler(content, parents, options, blockName),
    '    ' + ctxloop + '.index += 1; ' + ctxloop + '.index0 += 1; ' + ctxloop + '.revindex -= 1; ' + ctxloop + '.revindex0 -= 1;\n',
    '  });\n',
    '  ' + ctxloop + ' = ' + ctxloopcache + '.loop;\n',
    '  ' + ctx + val + ' = ' + ctxloopcache + '.' + val + ';\n',
    '  ' + ctx + key + ' = ' + ctxloopcache + '.' + key + ';\n',
    '  ' + ctxloopcache + ' = undefined;\n',
    '})();\n'
  ].join('');
};

exports.parse = function (str, line, parser, types) {
  var firstVar, ready;

  parser.on(types.NUMBER, function (token) {
    var lastState = this.state.length ? this.state[this.state.length - 1] : null;
    if (!ready ||
        (lastState !== types.ARRAYOPEN &&
          lastState !== types.CURLYOPEN &&
          lastState !== types.CURLYCLOSE &&
          lastState !== types.FUNCTION &&
          lastState !== types.FILTER)
        ) {
      throw new Error('Unexpected number "' + token.match + '" on line ' + line + '.');
    }
    return true;
  });

  parser.on(types.VAR, function (token) {
    if (ready && firstVar) {
      return true;
    }

    if (!this.out.length) {
      firstVar = true;
    }

    this.out.push(token.match);
  });

  parser.on(types.COMMA, function (token) {
    if (firstVar && this.prevToken.type === types.VAR) {
      this.out.push(token.match);
      return;
    }

    return true;
  });

  parser.on(types.COMPARATOR, function (token) {
    if (token.match !== 'in' || !firstVar) {
      throw new Error('Unexpected token "' + token.match + '" on line ' + line + '.');
    }
    ready = true;
    this.filterApplyIdx.push(this.out.length);
  });

  return true;
};

exports.ends = true;

},{}],25:[function(require,module,exports){
/**
 * Used to create conditional statements in templates. Accepts most JavaScript valid comparisons.
 *
 * Can be used in conjunction with <a href="#elseif"><code data-language="swig">{% elseif ... %}</code></a> and <a href="#else"><code data-language="swig">{% else %}</code></a> tags.
 *
 * @alias if
 *
 * @example
 * {% if x %}{% endif %}
 * {% if !x %}{% endif %}
 * {% if not x %}{% endif %}
 *
 * @example
 * {% if x and y %}{% endif %}
 * {% if x && y %}{% endif %}
 * {% if x or y %}{% endif %}
 * {% if x || y %}{% endif %}
 * {% if x || (y && z) %}{% endif %}
 *
 * @example
 * {% if x [operator] y %}
 *   Operators: ==, !=, <, <=, >, >=, ===, !==
 * {% endif %}
 *
 * @example
 * {% if x == 'five' %}
 *   The operands can be also be string or number literals
 * {% endif %}
 *
 * @example
 * {% if x|lower === 'tacos' %}
 *   You can use filters on any operand in the statement.
 * {% endif %}
 *
 * @example
 * {% if x in y %}
 *   If x is a value that is present in y, this will return true.
 * {% endif %}
 *
 * @param {...mixed} conditional Conditional statement that returns a truthy or falsy value.
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  return 'if (' + args.join(' ') + ') { \n' +
    compiler(content, parents, options, blockName) + '\n' +
    '}';
};

exports.parse = function (str, line, parser, types) {
  if (typeof str === "undefined") {
    throw new Error('No conditional statement provided on line ' + line + '.');
  }

  parser.on(types.COMPARATOR, function (token) {
    if (this.isLast) {
      throw new Error('Unexpected logic "' + token.match + '" on line ' + line + '.');
    }
    if (this.prevToken.type === types.NOT) {
      throw new Error('Attempted logic "not ' + token.match + '" on line ' + line + '. Use !(foo ' + token.match + ') instead.');
    }
    this.out.push(token.match);
    this.filterApplyIdx.push(this.out.length);
  });

  parser.on(types.NOT, function (token) {
    if (this.isLast) {
      throw new Error('Unexpected logic "' + token.match + '" on line ' + line + '.');
    }
    this.out.push(token.match);
  });

  parser.on(types.BOOL, function (token) {
    this.out.push(token.match);
  });

  parser.on(types.LOGIC, function (token) {
    if (!this.out.length || this.isLast) {
      throw new Error('Unexpected logic "' + token.match + '" on line ' + line + '.');
    }
    this.out.push(token.match);
    this.filterApplyIdx.pop();
  });

  return true;
};

exports.ends = true;

},{}],26:[function(require,module,exports){
var utils = require('../utils');

/**
 * Allows you to import macros from another file directly into your current context.
 * The import tag is specifically designed for importing macros into your template with a specific context scope. This is very useful for keeping your macros from overriding template context that is being injected by your server-side page generation.
 *
 * @alias import
 *
 * @example
 * {% import './formmacros.html' as forms %}
 * {{ form.input("text", "name") }}
 * // => <input type="text" name="name">
 *
 * @example
 * {% import "../shared/tags.html" as tags %}
 * {{ tags.stylesheet('global') }}
 * // => <link rel="stylesheet" href="/global.css">
 *
 * @param {string|var}  file      Relative path from the current template file to the file to import macros from.
 * @param {literal}     as        Literally, "as".
 * @param {literal}     varname   Local-accessible object name to assign the macros to.
 */
exports.compile = function (compiler, args) {
  var ctx = args.pop(),
    out = '_ctx.' + ctx + ' = {};\n  var _output = "";\n',
    replacements = utils.map(args, function (arg) {
      return {
        ex: new RegExp('_ctx.' + arg.name, 'g'),
        re: '_ctx.' + ctx + '.' + arg.name
      };
    });

  // Replace all occurrences of all macros in this file with
  // proper namespaced definitions and calls
  utils.each(args, function (arg) {
    var c = arg.compiled;
    utils.each(replacements, function (re) {
      c = c.replace(re.ex, re.re);
    });
    out += c;
  });

  return out;
};

exports.parse = function (str, line, parser, types, stack, opts, swig) {
  var compiler = require('../parser').compile,
    parseOpts = { resolveFrom: opts.filename },
    compileOpts = utils.extend({}, opts, parseOpts),
    tokens,
    ctx;

  parser.on(types.STRING, function (token) {
    var self = this;
    if (!tokens) {
      tokens = swig.parseFile(token.match.replace(/^("|')|("|')$/g, ''), parseOpts).tokens;
      utils.each(tokens, function (token) {
        var out = '',
          macroName;
        if (!token || token.name !== 'macro' || !token.compile) {
          return;
        }
        macroName = token.args[0];
        out += token.compile(compiler, token.args, token.content, [], compileOpts) + '\n';
        self.out.push({compiled: out, name: macroName});
      });
      return;
    }

    throw new Error('Unexpected string ' + token.match + ' on line ' + line + '.');
  });

  parser.on(types.VAR, function (token) {
    var self = this;
    if (!tokens || ctx) {
      throw new Error('Unexpected variable "' + token.match + '" on line ' + line + '.');
    }

    if (token.match === 'as') {
      return;
    }

    ctx = token.match;
    self.out.push(ctx);
    return false;
  });

  return true;
};

exports.block = true;

},{"../parser":16,"../utils":34}],27:[function(require,module,exports){
var ignore = 'ignore',
  missing = 'missing',
  only = 'only';

/**
 * Includes a template partial in place. The template is rendered within the current locals variable context.
 *
 * @alias include
 *
 * @example
 * // food = 'burritos';
 * // drink = 'lemonade';
 * {% include "./partial.html" %}
 * // => I like burritos and lemonade.
 *
 * @example
 * // my_obj = { food: 'tacos', drink: 'horchata' };
 * {% include "./partial.html" with my_obj only %}
 * // => I like tacos and horchata.
 *
 * @example
 * {% include "/this/file/does/not/exist" ignore missing %}
 * // => (Nothing! empty string)
 *
 * @param {string|var}  file      The path, relative to the template root, to render into the current context.
 * @param {literal}     [with]    Literally, "with".
 * @param {object}      [context] Local variable key-value object context to provide to the included file.
 * @param {literal}     [only]    Restricts to <strong>only</strong> passing the <code>with context</code> as local variables–the included template will not be aware of any other local variables in the parent template. For best performance, usage of this option is recommended if possible.
 * @param {literal}     [ignore missing] Will output empty string if not found instead of throwing an error.
 */
exports.compile = function (compiler, args) {
  var file = args.shift(),
    onlyIdx = args.indexOf(only),
    onlyCtx = onlyIdx !== -1 ? args.splice(onlyIdx, 1) : false,
    parentFile = (args.pop() || '').replace(/\\/g, '\\\\'),
    ignore = args[args.length - 1] === missing ? (args.pop()) : false,
    w = args.join('');

  return (ignore ? '  try {\n' : '') +
    '_output += _swig.compileFile(' + file + ', {' +
    'resolveFrom: "' + parentFile + '"' +
    '})(' +
    ((onlyCtx && w) ? w : (!w ? '_ctx' : '_utils.extend({}, _ctx, ' + w + ')')) +
    ');\n' +
    (ignore ? '} catch (e) {}\n' : '');
};

exports.parse = function (str, line, parser, types, stack, opts) {
  var file, w;
  parser.on(types.STRING, function (token) {
    if (!file) {
      file = token.match;
      this.out.push(file);
      return;
    }

    return true;
  });

  parser.on(types.VAR, function (token) {
    if (!file) {
      file = token.match;
      return true;
    }

    if (!w && token.match === 'with') {
      w = true;
      return;
    }

    if (w && token.match === only && this.prevToken.match !== 'with') {
      this.out.push(token.match);
      return;
    }

    if (token.match === ignore) {
      return false;
    }

    if (token.match === missing) {
      if (this.prevToken.match !== ignore) {
        throw new Error('Unexpected token "' + missing + '" on line ' + line + '.');
      }
      this.out.push(token.match);
      return false;
    }

    if (this.prevToken.match === ignore) {
      throw new Error('Expected "' + missing + '" on line ' + line + ' but found "' + token.match + '".');
    }

    return true;
  });

  parser.on('end', function () {
    this.out.push(opts.filename || null);
  });

  return true;
};

},{}],28:[function(require,module,exports){
exports.autoescape = require('./autoescape');
exports.block = require('./block');
exports["else"] = require('./else');
exports.elseif = require('./elseif');
exports.elif = exports.elseif;
exports["extends"] = require('./extends');
exports.filter = require('./filter');
exports["for"] = require('./for');
exports["if"] = require('./if');
exports["import"] = require('./import');
exports.include = require('./include');
exports.macro = require('./macro');
exports.parent = require('./parent');
exports.raw = require('./raw');
exports.set = require('./set');
exports.spaceless = require('./spaceless');

},{"./autoescape":18,"./block":19,"./else":20,"./elseif":21,"./extends":22,"./filter":23,"./for":24,"./if":25,"./import":26,"./include":27,"./macro":29,"./parent":30,"./raw":31,"./set":32,"./spaceless":33}],29:[function(require,module,exports){
/**
 * Create custom, reusable snippets within your templates.
 * Can be imported from one template to another using the <a href="#import"><code data-language="swig">{% import ... %}</code></a> tag.
 *
 * @alias macro
 *
 * @example
 * {% macro input(type, name, id, label, value, error) %}
 *   <label for="{{ name }}">{{ label }}</label>
 *   <input type="{{ type }}" name="{{ name }}" id="{{ id }}" value="{{ value }}"{% if error %} class="error"{% endif %}>
 * {% endmacro %}
 *
 * {{ input("text", "fname", "fname", "First Name", fname.value, fname.errors) }}
 * // => <label for="fname">First Name</label>
 * //    <input type="text" name="fname" id="fname" value="">
 *
 * @param {...arguments} arguments  User-defined arguments.
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  var fnName = args.shift();

  return '_ctx.' + fnName + ' = function (' + args.join('') + ') {\n' +
    '  var _output = "",\n' +
    '    __ctx = _utils.extend({}, _ctx);\n' +
    '  _utils.each(_ctx, function (v, k) {\n' +
    '    if (["' + args.join('","') + '"].indexOf(k) !== -1) { delete _ctx[k]; }\n' +
    '  });\n' +
    compiler(content, parents, options, blockName) + '\n' +
    ' _ctx = _utils.extend(_ctx, __ctx);\n' +
    '  return _output;\n' +
    '};\n' +
    '_ctx.' + fnName + '.safe = true;\n';
};

exports.parse = function (str, line, parser, types) {
  var name;

  parser.on(types.VAR, function (token) {
    if (token.match.indexOf('.') !== -1) {
      throw new Error('Unexpected dot in macro argument "' + token.match + '" on line ' + line + '.');
    }
    this.out.push(token.match);
  });

  parser.on(types.FUNCTION, function (token) {
    if (!name) {
      name = token.match;
      this.out.push(name);
      this.state.push(types.FUNCTION);
    }
  });

  parser.on(types.FUNCTIONEMPTY, function (token) {
    if (!name) {
      name = token.match;
      this.out.push(name);
    }
  });

  parser.on(types.PARENCLOSE, function () {
    if (this.isLast) {
      return;
    }
    throw new Error('Unexpected parenthesis close on line ' + line + '.');
  });

  parser.on(types.COMMA, function () {
    return true;
  });

  parser.on('*', function () {
    return;
  });

  return true;
};

exports.ends = true;
exports.block = true;

},{}],30:[function(require,module,exports){
/**
 * Inject the content from the parent template's block of the same name into the current block.
 *
 * See <a href="#inheritance">Template Inheritance</a> for more information.
 *
 * @alias parent
 *
 * @example
 * {% extends "./foo.html" %}
 * {% block content %}
 *   My content.
 *   {% parent %}
 * {% endblock %}
 *
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  if (!parents || !parents.length) {
    return '';
  }

  var parentFile = args[0],
    breaker = true,
    l = parents.length,
    i = 0,
    parent,
    block;

  for (i; i < l; i += 1) {
    parent = parents[i];
    if (!parent.blocks || !parent.blocks.hasOwnProperty(blockName)) {
      continue;
    }
    // Silly JSLint "Strange Loop" requires return to be in a conditional
    if (breaker && parentFile !== parent.name) {
      block = parent.blocks[blockName];
      return block.compile(compiler, [blockName], block.content, parents.slice(i + 1), options) + '\n';
    }
  }
};

exports.parse = function (str, line, parser, types, stack, opts) {
  parser.on('*', function (token) {
    throw new Error('Unexpected argument "' + token.match + '" on line ' + line + '.');
  });

  parser.on('end', function () {
    this.out.push(opts.filename);
  });

  return true;
};

},{}],31:[function(require,module,exports){
// Magic tag, hardcoded into parser

/**
 * Forces the content to not be auto-escaped. All swig instructions will be ignored and the content will be rendered exactly as it was given.
 *
 * @alias raw
 *
 * @example
 * // foobar = '<p>'
 * {% raw %}{{ foobar }}{% endraw %}
 * // => {{ foobar }}
 *
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  return compiler(content, parents, options, blockName);
};
exports.parse = function (str, line, parser) {
  parser.on('*', function (token) {
    throw new Error('Unexpected token "' + token.match + '" in raw tag on line ' + line + '.');
  });
  return true;
};
exports.ends = true;

},{}],32:[function(require,module,exports){
/**
 * Set a variable for re-use in the current context. This will over-write any value already set to the context for the given <var>varname</var>.
 *
 * @alias set
 *
 * @example
 * {% set foo = "anything!" %}
 * {{ foo }}
 * // => anything!
 *
 * @example
 * // index = 2;
 * {% set bar = 1 %}
 * {% set bar += index|default(3) %}
 * // => 3
 *
 * @example
 * // foods = {};
 * // food = 'chili';
 * {% set foods[food] = "con queso" %}
 * {{ foods.chili }}
 * // => con queso
 *
 * @example
 * // foods = { chili: 'chili con queso' }
 * {% set foods.chili = "guatamalan insanity pepper" %}
 * {{ foods.chili }}
 * // => guatamalan insanity pepper
 *
 * @param {literal} varname   The variable name to assign the value to.
 * @param {literal} assignement   Any valid JavaScript assignement. <code data-language="js">=, +=, *=, /=, -=</code>
 * @param {*}   value     Valid variable output.
 */
exports.compile = function (compiler, args) {
  return args.join(' ') + ';\n';
};

exports.parse = function (str, line, parser, types) {
  var nameSet = '',
    propertyName;

  parser.on(types.VAR, function (token) {
    if (propertyName) {
      // Tell the parser where to find the variable
      propertyName += '_ctx.' + token.match;
      return;
    }

    if (!parser.out.length) {
      nameSet += token.match;
      return;
    }

    return true;
  });

  parser.on(types.BRACKETOPEN, function (token) {
    if (!propertyName && !this.out.length) {
      propertyName = token.match;
      return;
    }

    return true;
  });

  parser.on(types.STRING, function (token) {
    if (propertyName && !this.out.length) {
      propertyName += token.match;
      return;
    }

    return true;
  });

  parser.on(types.BRACKETCLOSE, function (token) {
    if (propertyName && !this.out.length) {
      nameSet += propertyName + token.match;
      propertyName = undefined;
      return;
    }

    return true;
  });

  parser.on(types.DOTKEY, function (token) {
    if (!propertyName && !nameSet) {
      return true;
    }
    nameSet += '.' + token.match;
    return;
  });

  parser.on(types.ASSIGNMENT, function (token) {
    if (this.out.length || !nameSet) {
      throw new Error('Unexpected assignment "' + token.match + '" on line ' + line + '.');
    }

    this.out.push(
      // Prevent the set from spilling into global scope
      '_ctx.' + nameSet
    );
    this.out.push(token.match);
    this.filterApplyIdx.push(this.out.length);
  });

  return true;
};

exports.block = true;

},{}],33:[function(require,module,exports){
var utils = require('../utils');

/**
 * Attempts to remove whitespace between HTML tags. Use at your own risk.
 *
 * @alias spaceless
 *
 * @example
 * {% spaceless %}
 *   {% for num in foo %}
 *   <li>{{ loop.index }}</li>
 *   {% endfor %}
 * {% endspaceless %}
 * // => <li>1</li><li>2</li><li>3</li>
 *
 */
exports.compile = function (compiler, args, content, parents, options, blockName) {
  function stripWhitespace(tokens) {
    return utils.map(tokens, function (token) {
      if (token.content || typeof token !== 'string') {
        token.content = stripWhitespace(token.content);
        return token;
      }

      return token.replace(/^\s+/, '')
        .replace(/>\s+</g, '><')
        .replace(/\s+$/, '');
    });
  }

  return compiler(stripWhitespace(content), parents, options, blockName);
};

exports.parse = function (str, line, parser) {
  parser.on('*', function (token) {
    throw new Error('Unexpected token "' + token.match + '" on line ' + line + '.');
  });

  return true;
};

exports.ends = true;

},{"../utils":34}],34:[function(require,module,exports){
var isArray;

/**
 * Strip leading and trailing whitespace from a string.
 * @param  {string} input
 * @return {string}       Stripped input.
 */
exports.strip = function (input) {
  return input.replace(/^\s+|\s+$/g, '');
};

/**
 * Test if a string starts with a given prefix.
 * @param  {string} str    String to test against.
 * @param  {string} prefix Prefix to check for.
 * @return {boolean}
 */
exports.startsWith = function (str, prefix) {
  return str.indexOf(prefix) === 0;
};

/**
 * Test if a string ends with a given suffix.
 * @param  {string} str    String to test against.
 * @param  {string} suffix Suffix to check for.
 * @return {boolean}
 */
exports.endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * Iterate over an array or object.
 * @param  {array|object} obj Enumerable object.
 * @param  {Function}     fn  Callback function executed for each item.
 * @return {array|object}     The original input object.
 */
exports.each = function (obj, fn) {
  var i, l;

  if (isArray(obj)) {
    i = 0;
    l = obj.length;
    for (i; i < l; i += 1) {
      if (fn(obj[i], i, obj) === false) {
        break;
      }
    }
  } else {
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (fn(obj[i], i, obj) === false) {
          break;
        }
      }
    }
  }

  return obj;
};

/**
 * Test if an object is an Array.
 * @param {object} obj
 * @return {boolean}
 */
exports.isArray = isArray = (Array.hasOwnProperty('isArray')) ? Array.isArray : function (obj) {
  return (obj) ? (typeof obj === 'object' && Object.prototype.toString.call(obj).indexOf() !== -1) : false;
};

/**
 * Test if an item in an enumerable matches your conditions.
 * @param  {array|object}   obj   Enumerable object.
 * @param  {Function}       fn    Executed for each item. Return true if your condition is met.
 * @return {boolean}
 */
exports.some = function (obj, fn) {
  var i = 0,
    result,
    l;
  if (isArray(obj)) {
    l = obj.length;

    for (i; i < l; i += 1) {
      result = fn(obj[i], i, obj);
      if (result) {
        break;
      }
    }
  } else {
    exports.each(obj, function (value, index) {
      result = fn(value, index, obj);
      return !(result);
    });
  }
  return !!result;
};

/**
 * Return a new enumerable, mapped by a given iteration function.
 * @param  {object}   obj Enumerable object.
 * @param  {Function} fn  Executed for each item. Return the item to replace the original item with.
 * @return {object}       New mapped object.
 */
exports.map = function (obj, fn) {
  var i = 0,
    result = [],
    l;

  if (isArray(obj)) {
    l = obj.length;
    for (i; i < l; i += 1) {
      result[i] = fn(obj[i], i);
    }
  } else {
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        result[i] = fn(obj[i], i);
      }
    }
  }
  return result;
};

/**
 * Copy all of the properties in the source objects over to the destination object, and return the destination object. It's in-order, so the last source will override properties of the same name in previous arguments.
 * @param {...object} arguments
 * @return {object}
 */
exports.extend = function () {
  var args = arguments,
    target = args[0],
    objs = (args.length > 1) ? Array.prototype.slice.call(args, 1) : [],
    i = 0,
    l = objs.length,
    key,
    obj;

  for (i; i < l; i += 1) {
    obj = objs[i] || {};
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        target[key] = obj[key];
      }
    }
  }
  return target;
};

/**
 * Get all of the keys on an object.
 * @param  {object} obj
 * @return {array}
 */
exports.keys = function (obj) {
  if (!obj) {
    return [];
  }

  if (Object.keys) {
    return Object.keys(obj);
  }

  return exports.map(obj, function (v, k) {
    return k;
  });
};

/**
 * Throw an error with possible line number and source file.
 * @param  {string} message Error message
 * @param  {number} [line]  Line number in template.
 * @param  {string} [file]  Template file the error occured in.
 * @throws {Error} No seriously, the point is to throw an error.
 */
exports.throwError = function (message, line, file) {
  if (line) {
    message += ' on line ' + line;
  }
  if (file) {
    message += ' in file ' + file;
  }
  throw new Error(message + '.');
};

},{}],35:[function(require,module,exports){
var pubsub = require('organic-lib/pubsub');
var view = require('./application.view');
var projectsList = require('./projects-list/projects-list.controller');
var projectDisplay = require('./project-display/project-display.controller');

var Application = function(){};
Application.prototype.constructor = Application;
var application = module.exports = new Application();

Application.prototype.init = function(config, wrapper){
	this.$config = config || {};
    console.log('application config', config);
    this.$wrapper = wrapper || document.body;
    return view.init(this)
        .then( projectsList.init.bind(projectsList, this, this.$config) )
        .then( projectDisplay.init.bind(projectsList, this) )
        .then( view.renderPage.bind(view, 'about') );
};

Application.prototype.hashChanged = function(hash){
    var path = ( hash || window.location.hash ).replace('#/', '').split('/');
    var action = path.shift();

    switch( action ){
        case 'about':
        case 'contact':
            view.renderPage( action );
            break;
        case 'project':
            projectsList.changeProject( path.shift() );
            break;
    }
};

},{"./application.view":36,"./project-display/project-display.controller":37,"./projects-list/projects-list.controller":39,"organic-lib/pubsub":5}],36:[function(require,module,exports){
var templator = require('organic-lib/templator');

var $scope;

var ApplicationView = function(){};
ApplicationView.prototype.constructor = ApplicationView;
var applicationView = module.exports = new ApplicationView();

ApplicationView.prototype.init = function(controller){
    $scope = controller;
    //returns the promise created in templator.render
    return this.render($scope.$wrapper, $scope.$config)
        .then( registerDOM )
        .then( registerBehaviour );
};

//we expose the render method because there may come the need for the controller to render it again
ApplicationView.prototype.render = function(wrapper, locals){
    //use the templator to render the html
    return templator.render('main.html', locals, wrapper);
};

ApplicationView.prototype.renderPage = function(page){ 
    return templator.empty($scope.$DOM.projectContainer)
        .then( templator.render.bind(templator, page + '.html', $scope.$config, $scope.$DOM.projectContainer) )
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
        projectsList: document.getElementById('projects-list'),
        projectContainer: document.getElementById('project-container')
    };
};

var registerBehaviour = function(){
    window.addEventListener('hashchange', function(ev){
        ev.preventDefault();
        $scope.hashChanged();
    });
};

},{"organic-lib/templator":6}],37:[function(require,module,exports){
var pubsub = require('organic-lib/pubsub');
var view = require('./project-display.view');

var ProjectDisplay = function(){};
ProjectDisplay.prototype.constructor = ProjectDisplay;
var projectDisplay = module.exports = new ProjectDisplay();

var currentProject = null;

ProjectDisplay.prototype.init = function(parentScope, config, wrapper){
    this.$parentScope = parentScope;
    this.$config = config || {};
    this.$wrapper = wrapper || this.$parentScope.$DOM.projectContainer;
    registerNotificationInterests();
    return view.init(this);
};

var registerNotificationInterests = function(){
    var notificationInterests = [
        'project changed'
    ];

    pubsub.subscribe(notificationInterests, notificationHandler);
};

var notificationHandler = function(message, payload){
    switch(message){
        case 'project changed':
            currentProject = payload.project;
            view.renderProject( payload.project )
                .then(
                    function(){},
                    function(err){ console.error(err.stack); }
                );
            break;
    }
};


},{"./project-display.view":38,"organic-lib/pubsub":5}],38:[function(require,module,exports){
var templator = require('organic-lib/templator');

var $scope;

var ProjectDisplayView = function(){};
ProjectDisplayView.prototype.constructor = ProjectDisplayView;
var projectDisplayView = module.exports = new ProjectDisplayView();

ProjectDisplayView.prototype.init = function(controller){
    $scope = controller;
    registerDOM();
    registerBehaviour();

};

//we expose the render method because there may come the need for the controller to render it again
ProjectDisplayView.prototype.renderProject = function(project){
    var locals = {
        project: project
    };
    var isUncleNelson = project.title === 'A Monument to Uncle Nelson';
    var templateURL = isUncleNelson? 
      'project-display-nelson.html' : 'project-display.html';

    return templator.empty($scope.$wrapper)
        .then( templator.render.bind(templator, templateURL, locals, $scope.$wrapper) )
        .then( registerDOM )
        .then( function(){
          if(isUncleNelson){
            changeSlide(1); 
          }
        });
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
      slides: Array.prototype.slice.call( $scope.$wrapper.querySelectorAll('.slide') )
    };
};

var registerBehaviour = function(){
    $scope.$wrapper.addEventListener('click', wrapperClickHandler);
};

var wrapperClickHandler = function(ev){
  var elem = ev.target;
  if(elem.dataset.slide){
    ev.preventDefault();
    changeSlide(elem.dataset.slide);
  }
};

var changeSlide = function(index){console.log('changing slide', index);
  $scope.$DOM.slides.forEach(function(slide){
      if(index == slide.dataset.index){
          slide.classList.remove('hidden');
      } else {
          slide.classList.add('hidden');
      }
  });
};

},{"organic-lib/templator":6}],39:[function(require,module,exports){
var pubsub = require('organic-lib/pubsub');
var view = require('./projects-list.view');

var ProjectsList = function(){};
ProjectsList.prototype.constructor = ProjectsList;
var projectsList = module.exports = new ProjectsList();

ProjectsList.prototype.init = function(parentScope, config, wrapper){
    this.$parentScope = parentScope;
    this.$config = config || {};
    this.projects = config.projects;
    this.$wrapper = wrapper || this.$parentScope.$DOM.projectsList;
    return view.init(this);
};

ProjectsList.prototype.changeProject = function(slug){
    var project = this.projects.filter(function(item){
        return item.slug === slug;
    }).shift();
    pubsub.broadcast( 'project changed', { project: project } );
};

},{"./projects-list.view":40,"organic-lib/pubsub":5}],40:[function(require,module,exports){
var templator = require('organic-lib/templator');

var $scope;

var ProjectsListView = function(){};
ProjectsListView.prototype.constructor = ProjectsListView;
var projectsListView = module.exports = new ProjectsListView();

ProjectsListView.prototype.init = function(controller){
    $scope = controller;
    //returns the promise created in templator.render
    return this.render($scope.$wrapper, $scope.$config)
        .then( registerDOM )
        .then( registerBehaviour );
};

//we expose the render method because there may come the need for the controller to render it again
ProjectsListView.prototype.render = function(wrapper, locals){
    //use the templator to render the html
    return templator.render('projects-list.html', locals, wrapper);
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
    };
};

var registerBehaviour = function(){
    $scope.$wrapper.addEventListener('click', function(ev){
        var target = ev.target;
        if(target.dataset.project){
            ev.preventDefault();
            $scope.changeProject(target.dataset.project);
        }
    });
};

},{"organic-lib/templator":6}],41:[function(require,module,exports){
var pubsub = require('organic-lib/pubsub');
var ajax = require('organic-lib/ajax');
var application = require('./application/application.controller');

var isDevelopment = ~window.location.host.indexOf('localhost');

window.hostName = isDevelopment? 'http://localhost:3001' : '//' + window.location.host;
var CONFIGURATION_URL = window.hostName + '/get-configuration';


ajax.getJSON( CONFIGURATION_URL )
	.then( application.init.bind(application) )
    .then( function(){
        var hash = window.location.hash || 'about';
        application.hashChanged(hash);
    })
	.then (
		function(){ console.log('application started successfully'); },
		function(err){ console.error(err.stack); }
	);


pubsub.subscribe('*', function(message, payload){
	console.log('------- Message Received ----------');
	console.log('message:', message);
	console.log('payload:', payload);
    console.log('-----------------------------------');
});

},{"./application/application.controller":35,"organic-lib/ajax":4,"organic-lib/pubsub":5}]},{},[35,36,37,38,39,40,41])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvb3JnYW5pYy1saWIvYWpheC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vcmdhbmljLWxpYi9wdWJzdWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3JnYW5pYy1saWIvdGVtcGxhdG9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29yZ2FuaWMtbGliL3RlbXBsYXRvci9sb2FkZXIuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvZGF0ZWZvcm1hdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9maWx0ZXJzLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xleGVyLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xvYWRlcnMvZmlsZXN5c3RlbS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9sb2FkZXJzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xvYWRlcnMvbWVtb3J5LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3BhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9zd2lnLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvYXV0b2VzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvZWxzZS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2Vsc2VpZi5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2V4dGVuZHMuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9maWx0ZXIuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9mb3IuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9pZi5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2ltcG9ydC5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2luY2x1ZGUuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL21hY3JvLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvcGFyZW50LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvcmF3LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3Mvc2V0LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3Mvc3BhY2VsZXNzLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3V0aWxzLmpzIiwic3JjL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uLmNvbnRyb2xsZXIuanMiLCJzcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb24udmlldy5qcyIsInNyYy9hcHBsaWNhdGlvbi9wcm9qZWN0LWRpc3BsYXkvcHJvamVjdC1kaXNwbGF5LmNvbnRyb2xsZXIuanMiLCJzcmMvYXBwbGljYXRpb24vcHJvamVjdC1kaXNwbGF5L3Byb2plY3QtZGlzcGxheS52aWV3LmpzIiwic3JjL2FwcGxpY2F0aW9uL3Byb2plY3RzLWxpc3QvcHJvamVjdHMtbGlzdC5jb250cm9sbGVyLmpzIiwic3JjL2FwcGxpY2F0aW9uL3Byb2plY3RzLWxpc3QvcHJvamVjdHMtbGlzdC52aWV3LmpzIiwic3JjL2Jvb3RzdHJhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbDhEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3B1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyBwcm9taXNlZCBsaWJyYXJ5IGZvciBBamF4IHJlcXVlc3RzXG52YXIgUSA9IHJlcXVpcmUoJ3EnKTtcblxudmFyIEFqYXggPSBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIGdldDogZnVuY3Rpb24odXJsKXtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oZXYpe1xuICAgICAgICAgICAgaWYodGhpcy5zdGF0dXMgPCA0MDApe1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodGhpcy5yZXNwb25zZVRleHQpOyAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOsKgdGhpcy5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMucmVzcG9uc2VUZXh0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0sXG4gICAgZ2V0SlNPTjogZnVuY3Rpb24odXJsKXtcbiAgICAgICAgcmV0dXJuIEFqYXguZ2V0KHVybCkudGhlbihKU09OLnBhcnNlKTtcbiAgICB9XG59O1xuIiwiLy9wdWJzdWIgbW9kdWxlIHVzZWQgYnkgb3VyIGFwcGxpY2F0aW9uIGNvbnRyb2xsZXJzXG52YXIgcmVnaXN0ZXJlZEhhbmRsZXJzID0ge307XG52YXIgY2F0Y2hBbGwgPSBbXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3Vic2NyaWJlOiBzdWJzY3JpYmUsXG4gICAgYnJvYWRjYXN0OiBicm9hZGNhc3Rcbn07XG5cbmZ1bmN0aW9uIHN1YnNjcmliZSAobWVzc2FnZXMsIGhhbmRsZXIpe1xuICAgIGlmKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd5b3UgY2FuXFwndCByZWdpc3RlciBub24tbWV0aG9kcyBhcyBoYW5kbGVycycpO1xuICAgIH1cbiAgICBpZiggbWVzc2FnZXMgPT09ICcqJyApe1xuICAgICAgICBjYXRjaEFsbC5wdXNoKGhhbmRsZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbWVzc2FnZXMgPSBBcnJheS5pc0FycmF5KG1lc3NhZ2VzKT8gbWVzc2FnZXMgOiBbbWVzc2FnZXNdO1xuICAgIG1lc3NhZ2VzLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIHJlZ2lzdGVyZWRIYW5kbGVyc1ttZXNzYWdlXSA9IHJlZ2lzdGVyZWRIYW5kbGVyc1ttZXNzYWdlXSB8fCBbXTtcbiAgICAgICAgcmVnaXN0ZXJlZEhhbmRsZXJzW21lc3NhZ2VdLnB1c2goaGFuZGxlcik7XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiBicm9hZGNhc3QobWVzc2FnZSwgZGF0YSl7XG4gICAgZGF0YSA9IGRhdGEgfHwge307XG4gICAgdmFyIGhhbmRsZXJzID0gcmVnaXN0ZXJlZEhhbmRsZXJzW21lc3NhZ2VdIHx8IFtdO1xuICAgIGhhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oaGFuZGxlcil7XG4gICAgICAgIGhhbmRsZXIobWVzc2FnZSwgZGF0YSk7XG4gICAgfSk7XG4gICAgY2F0Y2hBbGwuZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKXtcbiAgICAgICAgaGFuZGxlcihtZXNzYWdlLCBkYXRhKTtcbiAgICB9KTtcbn07XG4iLCIvL3Byb21pc2VkIFRlbXBsYXRpbmcgZW5naW5lIFxudmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgc3dpZyA9IHJlcXVpcmUoJ3N3aWcnKTtcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xuXG52YXIgVGVtcGxhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24odmlld3Mpe1xuICAgICAgICBsb2FkZXIuaW5pdCh2aWV3cyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24odXJsLCBsb2NhbHMsIHdyYXBwZXIsIGJlZm9yZSl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFRlbXBsYXRlKHVybClcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbih0ZW1wbGF0ZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2UodGVtcGxhdGUsIGxvY2Fscyk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykgKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKGh0bWwpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluamVjdCh3cmFwcGVyLCBodG1sKVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpICk7XG4gICAgfSxcblxuICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbih1cmwpe1xuICAgICAgICB1cmwgPSAndmlld3MvJyArIHVybDtcbiAgICAgICAgcmV0dXJuIGxvYWRlci5sb2FkKHVybCk7XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbih0ZW1wbGF0ZSwgbG9jYWxzKXtcbiAgICAgICAgdmFyIGh0bWwgPSBzd2lnLnJlbmRlcih0ZW1wbGF0ZSwgeyBcbiAgICAgICAgICAgIGxvY2FsczogbG9jYWxzLFxuICAgICAgICAgICAgYXV0b2VzY2FwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH0sXG4gICAgXG4gICAgaW5qZWN0OiBmdW5jdGlvbih3cmFwcGVyLCBodG1sKXtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIChmdW5jdGlvbihjb250YWluZXIsIGh0bWwpe1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGNvbnRhaW5lci5jaGlsZHJlbik7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKXtcbiAgICAgICAgICAgICAgICAgICAgd3JhcHBlci5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7ICAgIFxuICAgICAgICB9KSh3cmFwcGVyLCBodG1sKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0sIFxuXG4gICAgZW1wdHk6IGZ1bmN0aW9uKGNvbnRhaW5lcil7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICAgICAgaWYoIWNvbnRhaW5lciB8fCAhY29udGFpbmVyLm5vZGVOYW1lKXtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCggRXJyb3IoXCJjb250YWluZXIgbXVzdCBiZSBhIERPTSBlbGVtZW50XCIpICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfVxufTtcbiIsInZhciBRID0gcmVxdWlyZSgncScpO1xudmFyIGFqYXggPSByZXF1aXJlKCcuLi9hamF4Jyk7XG5cbnZhciBMb2FkZXIgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbih2aWV3cyl7XG4gICAgICAgIHRoaXMudmlld3MgPSB2aWV3cztcbiAgICB9LFxuICAgIGxvYWQ6IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgIGlmKCBMb2FkZXIudmlld3MgKXtcbiAgICAgICAgICAgIHJldHVybiBsb2FkRnJvbUpTT04odXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBhamF4LmdldCh1cmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgfVxufTtcblxudmFyIGxvYWRGcm9tSlNPTiA9IGZ1bmN0aW9uKHVybCl7XG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHBhdGggPSB1cmwuc3BsaXQoJy8nKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBMb2FkZXIudmlld3M7XG4gICAgT2JqZWN0LmtleXMocGF0aCkuZm9yRWFjaChmdW5jdGlvbihrZXkpe1xuICAgICAgICBpZihrZXkgIT09IFwiMFwiIHx8IHBhdGhba2V5XSAhPT0gJ3ZpZXdzJyl7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlWyBwYXRoW2tleV0gXTtcbiAgICAgICAgICAgIGlmKCF0ZW1wbGF0ZSl7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBFcnJvcigndmlldyBub3QgZm91bmQgaW4gdmlld3MuanNvbiAnICsgdXJsKSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSggdGVtcGxhdGUgKTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07IFxuIiwiLy8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNlbGYuUSA9IGRlZmluaXRpb24oKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRUaWNrO1xufSkoKTtcblxuLy8gQXR0ZW1wdCB0byBtYWtlIGdlbmVyaWNzIHNhZmUgaW4gdGhlIGZhY2Ugb2YgZG93bnN0cmVhbVxuLy8gbW9kaWZpY2F0aW9ucy5cbi8vIFRoZXJlIGlzIG5vIHNpdHVhdGlvbiB3aGVyZSB0aGlzIGlzIG5lY2Vzc2FyeS5cbi8vIElmIHlvdSBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLCB0aGVzZSBwcmltb3JkaWFscyBuZWVkIHRvIGJlXG4vLyBkZWVwbHkgZnJvemVuIGFueXdheSwgYW5kIGlmIHlvdSBkb27igJl0IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsXG4vLyB0aGlzIGlzIGp1c3QgcGxhaW4gcGFyYW5vaWQuXG4vLyBIb3dldmVyLCB0aGlzICoqbWlnaHQqKiBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplIG9mXG4vLyB0aGUgbWluaWZpZWQgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG52YXIgb2JqZWN0X3RvU3RyaW5nID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBPYmplY3QodmFsdWUpO1xufVxuXG4vLyBnZW5lcmF0b3IgcmVsYXRlZCBzaGltc1xuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuZnVuY3Rpb24gaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iamVjdF90b1N0cmluZyhleGNlcHRpb24pID09PSBcIltvYmplY3QgU3RvcEl0ZXJhdGlvbl1cIiB8fFxuICAgICAgICBleGNlcHRpb24gaW5zdGFuY2VvZiBRUmV0dXJuVmFsdWVcbiAgICApO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaGVscGVyIGFuZCBRLnJldHVybiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpblxuLy8gU3BpZGVyTW9ua2V5LlxudmFyIFFSZXR1cm5WYWx1ZTtcbmlmICh0eXBlb2YgUmV0dXJuVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBSZXR1cm5WYWx1ZTtcbn0gZWxzZSB7XG4gICAgUVJldHVyblZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLCBwYXNzZXMgcHJvbWlzZXMgdGhyb3VnaCwgb3JcbiAqIGNvZXJjZXMgcHJvbWlzZXMgZnJvbSBkaWZmZXJlbnQgc3lzdGVtcy5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlIG9yIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gUSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBhc3NpbWlsYXRlIHRoZW5hYmxlc1xuICAgIGlmIChpc1Byb21pc2VBbGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwodmFsdWUpO1xuICAgIH1cbn1cblEucmVzb2x2ZSA9IFE7XG5cbi8qKlxuICogUGVyZm9ybXMgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm4gb2YgdGhlIGV2ZW50IGxvb3AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0YXNrXG4gKi9cblEubmV4dFRpY2sgPSBuZXh0VGljaztcblxuLyoqXG4gKiBDb250cm9scyB3aGV0aGVyIG9yIG5vdCBsb25nIHN0YWNrIHRyYWNlcyB3aWxsIGJlIG9uXG4gKi9cblEubG9uZ1N0YWNrU3VwcG9ydCA9IGZhbHNlO1xuXG4vLyBlbmFibGUgbG9uZyBzdGFja3MgaWYgUV9ERUJVRyBpcyBzZXRcbmlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LlFfREVCVUcpIHtcbiAgICBRLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSBvYmplY3QuXG4gKlxuICogYHJlc29sdmVgIGlzIGEgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggYSBtb3JlIHJlc29sdmVkIHZhbHVlIGZvciB0aGVcbiAqIHByb21pc2UuIFRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhbnkgdmFsdWUgdGhhdCBpc1xuICogbm90IGEgdGhlbmFibGUuIFRvIHJlamVjdCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGEgcmVqZWN0ZWRcbiAqIHRoZW5hYmxlLCBvciBpbnZva2UgYHJlamVjdGAgd2l0aCB0aGUgcmVhc29uIGRpcmVjdGx5LiBUbyByZXNvbHZlIHRoZVxuICogcHJvbWlzZSB0byBhbm90aGVyIHRoZW5hYmxlLCB0aHVzIHB1dHRpbmcgaXQgaW4gdGhlIHNhbWUgc3RhdGUsIGludm9rZVxuICogYHJlc29sdmVgIHdpdGggdGhhdCBvdGhlciB0aGVuYWJsZS5cbiAqL1xuUS5kZWZlciA9IGRlZmVyO1xuZnVuY3Rpb24gZGVmZXIoKSB7XG4gICAgLy8gaWYgXCJtZXNzYWdlc1wiIGlzIGFuIFwiQXJyYXlcIiwgdGhhdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJvbWlzZSBoYXMgbm90IHlldFxuICAgIC8vIGJlZW4gcmVzb2x2ZWQuICBJZiBpdCBpcyBcInVuZGVmaW5lZFwiLCBpdCBoYXMgYmVlbiByZXNvbHZlZC4gIEVhY2hcbiAgICAvLyBlbGVtZW50IG9mIHRoZSBtZXNzYWdlcyBhcnJheSBpcyBpdHNlbGYgYW4gYXJyYXkgb2YgY29tcGxldGUgYXJndW1lbnRzIHRvXG4gICAgLy8gZm9yd2FyZCB0byB0aGUgcmVzb2x2ZWQgcHJvbWlzZS4gIFdlIGNvZXJjZSB0aGUgcmVzb2x1dGlvbiB2YWx1ZSB0byBhXG4gICAgLy8gcHJvbWlzZSB1c2luZyB0aGUgYHJlc29sdmVgIGZ1bmN0aW9uIGJlY2F1c2UgaXQgaGFuZGxlcyBib3RoIGZ1bGx5XG4gICAgLy8gbm9uLXRoZW5hYmxlIHZhbHVlcyBhbmQgb3RoZXIgdGhlbmFibGVzIGdyYWNlZnVsbHkuXG4gICAgdmFyIG1lc3NhZ2VzID0gW10sIHByb2dyZXNzTGlzdGVuZXJzID0gW10sIHJlc29sdmVkUHJvbWlzZTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG9iamVjdF9jcmVhdGUoZGVmZXIucHJvdG90eXBlKTtcbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIG9wZXJhbmRzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKG9wID09PSBcIndoZW5cIiAmJiBvcGVyYW5kc1sxXSkgeyAvLyBwcm9ncmVzcyBvcGVyYW5kXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMucHVzaChvcGVyYW5kc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5ld1Byb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KG5ld1Byb21pc2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG5cbiAgICAgICAgbWVzc2FnZXMgPSB2b2lkIDA7XG4gICAgICAgIHByb2dyZXNzTGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIH1cblxuICAgIGRlZmVycmVkLnByb21pc2UgPSBwcm9taXNlO1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKFEodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoZnVsZmlsbCh2YWx1ZSkpO1xuICAgIH07XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUocmVqZWN0KHJlYXNvbikpO1xuICAgIH07XG4gICAgZGVmZXJyZWQubm90aWZ5ID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9ncmVzc0xpc3RlbmVycywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvZ3Jlc3NMaXN0ZW5lcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5Qcm9taXNlID0gcHJvbWlzZTsgLy8gRVM2XG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgfSBjYXRjaCAocmVhc29uKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxucHJvbWlzZS5yYWNlID0gcmFjZTsgLy8gRVM2XG5wcm9taXNlLmFsbCA9IGFsbDsgLy8gRVM2XG5wcm9taXNlLnJlamVjdCA9IHJlamVjdDsgLy8gRVM2XG5wcm9taXNlLnJlc29sdmUgPSBROyAvLyBFUzZcblxuLy8gWFhYIGV4cGVyaW1lbnRhbC4gIFRoaXMgbWV0aG9kIGlzIGEgd2F5IHRvIGRlbm90ZSB0aGF0IGEgbG9jYWwgdmFsdWUgaXNcbi8vIHNlcmlhbGl6YWJsZSBhbmQgc2hvdWxkIGJlIGltbWVkaWF0ZWx5IGRpc3BhdGNoZWQgdG8gYSByZW1vdGUgdXBvbiByZXF1ZXN0LFxuLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGEgcmVmZXJlbmNlLlxuUS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWYgdHdvIHByb21pc2VzIGV2ZW50dWFsbHkgZnVsZmlsbCB0byB0aGUgc2FtZSB2YWx1ZSwgcHJvbWlzZXMgdGhhdCB2YWx1ZSxcbiAqIGJ1dCBvdGhlcndpc2UgcmVqZWN0cy5cbiAqIEBwYXJhbSB4IHtBbnkqfVxuICogQHBhcmFtIHkge0FueSp9XG4gKiBAcmV0dXJucyB7QW55Kn0gYSBwcm9taXNlIGZvciB4IGFuZCB5IGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBidXQgYSByZWplY3Rpb25cbiAqIG90aGVyd2lzZS5cbiAqXG4gKi9cblEuam9pbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIFEoeCkuam9pbih5KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAodGhhdCkge1xuICAgIHJldHVybiBRKFt0aGlzLCB0aGF0XSkuc3ByZWFkKGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBcIj09PVwiIHNob3VsZCBiZSBPYmplY3QuaXMgb3IgZXF1aXZcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3Qgam9pbjogbm90IHRoZSBzYW1lOiBcIiArIHggKyBcIiBcIiArIHkpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXMgdG8gYmVjb21lIHNldHRsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBzZXR0bGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbihhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBRKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFNwcmVhZHMgdGhlIHZhbHVlcyBvZiBhIHByb21pc2VkIGFycmF5IG9mIGFyZ3VtZW50cyBpbnRvIHRoZVxuICogZnVsZmlsbG1lbnQgY2FsbGJhY2suXG4gKiBAcGFyYW0gZnVsZmlsbGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdmFyaWFkaWMgYXJndW1lbnRzIGZyb20gdGhlXG4gKiBwcm9taXNlZCBhcnJheVxuICogQHBhcmFtIHJlamVjdGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdGhlIGV4Y2VwdGlvbiBpZiB0aGUgcHJvbWlzZVxuICogaXMgcmVqZWN0ZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb3IgdGhyb3duIGV4Y2VwdGlvbiBvZlxuICogZWl0aGVyIGNhbGxiYWNrLlxuICovXG5RLnNwcmVhZCA9IHNwcmVhZDtcbmZ1bmN0aW9uIHNwcmVhZCh2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS5zcHJlYWQoZnVsZmlsbGVkLCByZWplY3RlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkudGhlbihmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGxlZC5hcHBseSh2b2lkIDAsIGFycmF5KTtcbiAgICB9LCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIFRoZSBhc3luYyBmdW5jdGlvbiBpcyBhIGRlY29yYXRvciBmb3IgZ2VuZXJhdG9yIGZ1bmN0aW9ucywgdHVybmluZ1xuICogdGhlbSBpbnRvIGFzeW5jaHJvbm91cyBnZW5lcmF0b3JzLiAgQWx0aG91Z2ggZ2VuZXJhdG9ycyBhcmUgb25seSBwYXJ0XG4gKiBvZiB0aGUgbmV3ZXN0IEVDTUFTY3JpcHQgNiBkcmFmdHMsIHRoaXMgY29kZSBkb2VzIG5vdCBjYXVzZSBzeW50YXhcbiAqIGVycm9ycyBpbiBvbGRlciBlbmdpbmVzLiAgVGhpcyBjb2RlIHNob3VsZCBjb250aW51ZSB0byB3b3JrIGFuZCB3aWxsXG4gKiBpbiBmYWN0IGltcHJvdmUgb3ZlciB0aW1lIGFzIHRoZSBsYW5ndWFnZSBpbXByb3Zlcy5cbiAqXG4gKiBFUzYgZ2VuZXJhdG9ycyBhcmUgY3VycmVudGx5IHBhcnQgb2YgVjggdmVyc2lvbiAzLjE5IHdpdGggdGhlXG4gKiAtLWhhcm1vbnktZ2VuZXJhdG9ycyBydW50aW1lIGZsYWcgZW5hYmxlZC4gIFNwaWRlck1vbmtleSBoYXMgaGFkIHRoZW1cbiAqIGZvciBsb25nZXIsIGJ1dCB1bmRlciBhbiBvbGRlciBQeXRob24taW5zcGlyZWQgZm9ybS4gIFRoaXMgZnVuY3Rpb25cbiAqIHdvcmtzIG9uIGJvdGgga2luZHMgb2YgZ2VuZXJhdG9ycy5cbiAqXG4gKiBEZWNvcmF0ZXMgYSBnZW5lcmF0b3IgZnVuY3Rpb24gc3VjaCB0aGF0OlxuICogIC0gaXQgbWF5IHlpZWxkIHByb21pc2VzXG4gKiAgLSBleGVjdXRpb24gd2lsbCBjb250aW51ZSB3aGVuIHRoYXQgcHJvbWlzZSBpcyBmdWxmaWxsZWRcbiAqICAtIHRoZSB2YWx1ZSBvZiB0aGUgeWllbGQgZXhwcmVzc2lvbiB3aWxsIGJlIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqICAtIGl0IHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlICh3aGVuIHRoZSBnZW5lcmF0b3JcbiAqICAgIHN0b3BzIGl0ZXJhdGluZylcbiAqICAtIHRoZSBkZWNvcmF0ZWQgZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqICAgIG9mIHRoZSBnZW5lcmF0b3Igb3IgdGhlIGZpcnN0IHJlamVjdGVkIHByb21pc2UgYW1vbmcgdGhvc2VcbiAqICAgIHlpZWxkZWQuXG4gKiAgLSBpZiBhbiBlcnJvciBpcyB0aHJvd24gaW4gdGhlIGdlbmVyYXRvciwgaXQgcHJvcGFnYXRlcyB0aHJvdWdoXG4gKiAgICBldmVyeSBmb2xsb3dpbmcgeWllbGQgdW50aWwgaXQgaXMgY2F1Z2h0LCBvciB1bnRpbCBpdCBlc2NhcGVzXG4gKiAgICB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uIGFsdG9nZXRoZXIsIGFuZCBpcyB0cmFuc2xhdGVkIGludG8gYVxuICogICAgcmVqZWN0aW9uIGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgZGVjb3JhdGVkIGdlbmVyYXRvci5cbiAqL1xuUS5hc3luYyA9IGFzeW5jO1xuZnVuY3Rpb24gYXN5bmMobWFrZUdlbmVyYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInNlbmRcIiwgYXJnIGlzIGEgdmFsdWVcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwidGhyb3dcIiwgYXJnIGlzIGFuIGV4Y2VwdGlvblxuICAgICAgICBmdW5jdGlvbiBjb250aW51ZXIodmVyYiwgYXJnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBVbnRpbCBWOCAzLjE5IC8gQ2hyb21pdW0gMjkgaXMgcmVsZWFzZWQsIFNwaWRlck1vbmtleSBpcyB0aGUgb25seVxuICAgICAgICAgICAgLy8gZW5naW5lIHRoYXQgaGFzIGEgZGVwbG95ZWQgYmFzZSBvZiBicm93c2VycyB0aGF0IHN1cHBvcnQgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIFNNJ3MgZ2VuZXJhdG9ycyB1c2UgdGhlIFB5dGhvbi1pbnNwaXJlZCBzZW1hbnRpY3Mgb2ZcbiAgICAgICAgICAgIC8vIG91dGRhdGVkIEVTNiBkcmFmdHMuICBXZSB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgRVM2LCBidXQgd2UnZCBhbHNvXG4gICAgICAgICAgICAvLyBsaWtlIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gdXNlIGdlbmVyYXRvcnMgaW4gZGVwbG95ZWQgYnJvd3NlcnMsIHNvXG4gICAgICAgICAgICAvLyB3ZSBhbHNvIHN1cHBvcnQgUHl0aG9uLXN0eWxlIGdlbmVyYXRvcnMuICBBdCBzb21lIHBvaW50IHdlIGNhbiByZW1vdmVcbiAgICAgICAgICAgIC8vIHRoaXMgYmxvY2suXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgU3RvcEl0ZXJhdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIC8vIEVTNiBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBRKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJNb25rZXkgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyBjYXNlIHdoZW4gU00gZG9lcyBFUzYgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShleGNlcHRpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdCwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBtYWtlR2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJuZXh0XCIpO1xuICAgICAgICB2YXIgZXJyYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJ0aHJvd1wiKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGUgc3Bhd24gZnVuY3Rpb24gaXMgYSBzbWFsbCB3cmFwcGVyIGFyb3VuZCBhc3luYyB0aGF0IGltbWVkaWF0ZWx5XG4gKiBjYWxscyB0aGUgZ2VuZXJhdG9yIGFuZCBhbHNvIGVuZHMgdGhlIHByb21pc2UgY2hhaW4sIHNvIHRoYXQgYW55XG4gKiB1bmhhbmRsZWQgZXJyb3JzIGFyZSB0aHJvd24gaW5zdGVhZCBvZiBmb3J3YXJkZWQgdG8gdGhlIGVycm9yXG4gKiBoYW5kbGVyLiBUaGlzIGlzIHVzZWZ1bCBiZWNhdXNlIGl0J3MgZXh0cmVtZWx5IGNvbW1vbiB0byBydW5cbiAqIGdlbmVyYXRvcnMgYXQgdGhlIHRvcC1sZXZlbCB0byB3b3JrIHdpdGggbGlicmFyaWVzLlxuICovXG5RLnNwYXduID0gc3Bhd247XG5mdW5jdGlvbiBzcGF3bihtYWtlR2VuZXJhdG9yKSB7XG4gICAgUS5kb25lKFEuYXN5bmMobWFrZUdlbmVyYXRvcikoKSk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBpbnRlcmZhY2Ugb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuLyoqXG4gKiBUaHJvd3MgYSBSZXR1cm5WYWx1ZSBleGNlcHRpb24gdG8gc3RvcCBhbiBhc3luY2hyb25vdXMgZ2VuZXJhdG9yLlxuICpcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIGEgc3RvcC1nYXAgbWVhc3VyZSB0byBzdXBwb3J0IGdlbmVyYXRvciByZXR1cm5cbiAqIHZhbHVlcyBpbiBvbGRlciBGaXJlZm94L1NwaWRlck1vbmtleS4gIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzZcbiAqIGdlbmVyYXRvcnMgbGlrZSBDaHJvbWl1bSAyOSwganVzdCB1c2UgXCJyZXR1cm5cIiBpbiB5b3VyIGdlbmVyYXRvclxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgc3Vycm91bmRpbmcgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB3aXRoIHRoZSB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKiAvLyBFUzYgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgcmV0dXJuIGZvbyArIGJhcjtcbiAqIH0pXG4gKiAvLyBPbGRlciBTcGlkZXJNb25rZXkgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24gKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICBRLnJldHVybihmb28gKyBiYXIpO1xuICogfSlcbiAqL1xuUVtcInJldHVyblwiXSA9IF9yZXR1cm47XG5mdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFFSZXR1cm5WYWx1ZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVGhlIHByb21pc2VkIGZ1bmN0aW9uIGRlY29yYXRvciBlbnN1cmVzIHRoYXQgYW55IHByb21pc2UgYXJndW1lbnRzXG4gKiBhcmUgc2V0dGxlZCBhbmQgcGFzc2VkIGFzIHZhbHVlcyAoYHRoaXNgIGlzIGFsc28gc2V0dGxlZCBhbmQgcGFzc2VkXG4gKiBhcyBhIHZhbHVlKS4gIEl0IHdpbGwgYWxzbyBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIGEgZnVuY3Rpb24gaXNcbiAqIGFsd2F5cyBhIHByb21pc2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhZGQgPSBRLnByb21pc2VkKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgcmV0dXJuIGEgKyBiO1xuICogfSk7XG4gKiBhZGQoUShhKSwgUShCKSk7XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGRlY29yYXRlXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBkZWNvcmF0ZWQuXG4gKi9cblEucHJvbWlzZWQgPSBwcm9taXNlZDtcbmZ1bmN0aW9uIHByb21pc2VkKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNwcmVhZChbdGhpcywgYWxsKGFyZ3VtZW50cyldLCBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIHNlbmRzIGEgbWVzc2FnZSB0byBhIHZhbHVlIGluIGEgZnV0dXJlIHR1cm5cbiAqIEBwYXJhbSBvYmplY3QqIHRoZSByZWNpcGllbnRcbiAqIEBwYXJhbSBvcCB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBvcGVyYXRpb24sIGUuZy4sIFwid2hlblwiLFxuICogQHBhcmFtIGFyZ3MgZnVydGhlciBhcmd1bWVudHMgdG8gYmUgZm9yd2FyZGVkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm5zIHJlc3VsdCB7UHJvbWlzZX0gYSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb25cbiAqL1xuUS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuZnVuY3Rpb24gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2gob3AsIGFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChvcCwgYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChkZWZlcnJlZC5yZXNvbHZlLCBvcCwgYXJncyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZGVsZXRlXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5kZWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcblEubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgaW52b2NhdGlvbiBhcmd1bWVudHNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5Qcm9taXNlLnByb3RvdHlwZS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmdW5jdGlvbiAob2JqZWN0LCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9XG5RLmZjYWxsID0gZnVuY3Rpb24gKG9iamVjdCAvKiAuLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cyldKTtcbn07XG5cbi8qKlxuICogQmluZHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uLCB0cmFuc2Zvcm1pbmcgcmV0dXJuIHZhbHVlcyBpbnRvIGEgZnVsZmlsbGVkXG4gKiBwcm9taXNlIGFuZCB0aHJvd24gZXJyb3JzIGludG8gYSByZWplY3RlZCBvbmUuXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZiaW5kID0gZnVuY3Rpb24gKG9iamVjdCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gUShvYmplY3QpO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblByb21pc2UucHJvdG90eXBlLmZiaW5kID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0cyB0aGUgbmFtZXMgb2YgdGhlIG93bmVkIHByb3BlcnRpZXMgb2YgYSBwcm9taXNlZFxuICogb2JqZWN0IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUga2V5cyBvZiB0aGUgZXZlbnR1YWxseSBzZXR0bGVkIG9iamVjdFxuICovXG5RLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkuICBJZiBhbnkgb2ZcbiAqIHRoZSBwcm9taXNlcyBnZXRzIHJlamVjdGVkLCB0aGUgd2hvbGUgYXJyYXkgaXMgcmVqZWN0ZWQgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqL1xuLy8gQnkgTWFyayBNaWxsZXJcbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPXN0cmF3bWFuOmNvbmN1cnJlbmN5JnJldj0xMzA4Nzc2NTIxI2FsbGZ1bGZpbGxlZFxuUS5hbGwgPSBhbGw7XG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc25hcHNob3Q7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNQcm9taXNlKHByb21pc2UpICYmXG4gICAgICAgICAgICAgICAgKHNuYXBzaG90ID0gcHJvbWlzZS5pbnNwZWN0KCkpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSBzbmFwc2hvdC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytwZW5kaW5nQ291bnQ7XG4gICAgICAgICAgICAgICAgd2hlbihcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHsgaW5kZXg6IGluZGV4LCB2YWx1ZTogcHJvZ3Jlc3MgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGwodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2Ugb2YgYW4gYXJyYXkuIFByaW9yIHJlamVjdGVkIHByb21pc2VzIGFyZVxuICogaWdub3JlZC4gIFJlamVjdHMgb25seSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIG9yIHByb21pc2VzIGZvciB2YWx1ZXNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2UsXG4gKiBvciBhIHJlamVjdGVkIHByb21pc2UgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqL1xuUS5hbnkgPSBhbnk7XG5cbmZ1bmN0aW9uIGFueShwcm9taXNlcykge1xuICAgIGlmIChwcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFEucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uKHByZXYsIGN1cnJlbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZXNbaW5kZXhdO1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIHdoZW4ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZChyZXN1bHQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblJlamVjdGVkKCkge1xuICAgICAgICAgICAgcGVuZGluZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDYW4ndCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgZnJvbSBhbnkgcHJvbWlzZSwgYWxsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9taXNlcyB3ZXJlIHJlamVjdGVkLlwiXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHtcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG5cbnJldHVybiBRO1xuXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvc3dpZycpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgX21vbnRocyA9IHtcbiAgICBmdWxsOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXSxcbiAgICBhYmJyOiBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11cbiAgfSxcbiAgX2RheXMgPSB7XG4gICAgZnVsbDogWydTdW5kYXknLCAnTW9uZGF5JywgJ1R1ZXNkYXknLCAnV2VkbmVzZGF5JywgJ1RodXJzZGF5JywgJ0ZyaWRheScsICdTYXR1cmRheSddLFxuICAgIGFiYnI6IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J10sXG4gICAgYWx0OiB7Jy0xJzogJ1llc3RlcmRheScsIDA6ICdUb2RheScsIDE6ICdUb21vcnJvdyd9XG4gIH07XG5cbi8qXG5EYXRlWiBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2U6XG5Db3B5cmlnaHQgKGMpIDIwMTEgVG9tbyBVbml2ZXJzYWxpcyAoaHR0cDovL3RvbW91bml2ZXJzYWxpcy5jb20pXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiovXG5leHBvcnRzLnR6T2Zmc2V0ID0gMDtcbmV4cG9ydHMuRGF0ZVogPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZW1iZXJzID0ge1xuICAgICAgJ2RlZmF1bHQnOiBbJ2dldFVUQ0RhdGUnLCAnZ2V0VVRDRGF5JywgJ2dldFVUQ0Z1bGxZZWFyJywgJ2dldFVUQ0hvdXJzJywgJ2dldFVUQ01pbGxpc2Vjb25kcycsICdnZXRVVENNaW51dGVzJywgJ2dldFVUQ01vbnRoJywgJ2dldFVUQ1NlY29uZHMnLCAndG9JU09TdHJpbmcnLCAndG9HTVRTdHJpbmcnLCAndG9VVENTdHJpbmcnLCAndmFsdWVPZicsICdnZXRUaW1lJ10sXG4gICAgICB6OiBbJ2dldERhdGUnLCAnZ2V0RGF5JywgJ2dldEZ1bGxZZWFyJywgJ2dldEhvdXJzJywgJ2dldE1pbGxpc2Vjb25kcycsICdnZXRNaW51dGVzJywgJ2dldE1vbnRoJywgJ2dldFNlY29uZHMnLCAnZ2V0WWVhcicsICd0b0RhdGVTdHJpbmcnLCAndG9Mb2NhbGVEYXRlU3RyaW5nJywgJ3RvTG9jYWxlVGltZVN0cmluZyddXG4gICAgfSxcbiAgICBkID0gdGhpcztcblxuICBkLmRhdGUgPSBkLmRhdGVaID0gKGFyZ3VtZW50cy5sZW5ndGggPiAxKSA/IG5ldyBEYXRlKERhdGUuVVRDLmFwcGx5KERhdGUsIGFyZ3VtZW50cykgKyAoKG5ldyBEYXRlKCkpLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCkpIDogKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpID8gbmV3IERhdGUobmV3IERhdGUoYXJndW1lbnRzWycwJ10pKSA6IG5ldyBEYXRlKCk7XG5cbiAgZC50aW1lem9uZU9mZnNldCA9IGQuZGF0ZVouZ2V0VGltZXpvbmVPZmZzZXQoKTtcblxuICB1dGlscy5lYWNoKG1lbWJlcnMueiwgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBkW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGQuZGF0ZVpbbmFtZV0oKTtcbiAgICB9O1xuICB9KTtcbiAgdXRpbHMuZWFjaChtZW1iZXJzWydkZWZhdWx0J10sIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgZFtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBkLmRhdGVbbmFtZV0oKTtcbiAgICB9O1xuICB9KTtcblxuICB0aGlzLnNldFRpbWV6b25lT2Zmc2V0KGV4cG9ydHMudHpPZmZzZXQpO1xufTtcbmV4cG9ydHMuRGF0ZVoucHJvdG90eXBlID0ge1xuICBnZXRUaW1lem9uZU9mZnNldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRpbWV6b25lT2Zmc2V0O1xuICB9LFxuICBzZXRUaW1lem9uZU9mZnNldDogZnVuY3Rpb24gKG9mZnNldCkge1xuICAgIHRoaXMudGltZXpvbmVPZmZzZXQgPSBvZmZzZXQ7XG4gICAgdGhpcy5kYXRlWiA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRUaW1lKCkgKyB0aGlzLmRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwMDAwIC0gdGhpcy50aW1lem9uZU9mZnNldCAqIDYwMDAwKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcblxuLy8gRGF5XG5leHBvcnRzLmQgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIChpbnB1dC5nZXREYXRlKCkgPCAxMCA/ICcwJyA6ICcnKSArIGlucHV0LmdldERhdGUoKTtcbn07XG5leHBvcnRzLkQgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIF9kYXlzLmFiYnJbaW5wdXQuZ2V0RGF5KCldO1xufTtcbmV4cG9ydHMuaiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0RGF0ZSgpO1xufTtcbmV4cG9ydHMubCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gX2RheXMuZnVsbFtpbnB1dC5nZXREYXkoKV07XG59O1xuZXhwb3J0cy5OID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBkID0gaW5wdXQuZ2V0RGF5KCk7XG4gIHJldHVybiAoZCA+PSAxKSA/IGQgOiA3O1xufTtcbmV4cG9ydHMuUyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgZCA9IGlucHV0LmdldERhdGUoKTtcbiAgcmV0dXJuIChkICUgMTAgPT09IDEgJiYgZCAhPT0gMTEgPyAnc3QnIDogKGQgJSAxMCA9PT0gMiAmJiBkICE9PSAxMiA/ICduZCcgOiAoZCAlIDEwID09PSAzICYmIGQgIT09IDEzID8gJ3JkJyA6ICd0aCcpKSk7XG59O1xuZXhwb3J0cy53ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5nZXREYXkoKTtcbn07XG5leHBvcnRzLnogPSBmdW5jdGlvbiAoaW5wdXQsIG9mZnNldCwgYWJicikge1xuICB2YXIgeWVhciA9IGlucHV0LmdldEZ1bGxZZWFyKCksXG4gICAgZSA9IG5ldyBleHBvcnRzLkRhdGVaKHllYXIsIGlucHV0LmdldE1vbnRoKCksIGlucHV0LmdldERhdGUoKSwgMTIsIDAsIDApLFxuICAgIGQgPSBuZXcgZXhwb3J0cy5EYXRlWih5ZWFyLCAwLCAxLCAxMiwgMCwgMCk7XG5cbiAgZS5zZXRUaW1lem9uZU9mZnNldChvZmZzZXQsIGFiYnIpO1xuICBkLnNldFRpbWV6b25lT2Zmc2V0KG9mZnNldCwgYWJicik7XG4gIHJldHVybiBNYXRoLnJvdW5kKChlIC0gZCkgLyA4NjQwMDAwMCk7XG59O1xuXG4vLyBXZWVrXG5leHBvcnRzLlcgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIHRhcmdldCA9IG5ldyBEYXRlKGlucHV0LnZhbHVlT2YoKSksXG4gICAgZGF5TnIgPSAoaW5wdXQuZ2V0RGF5KCkgKyA2KSAlIDcsXG4gICAgZlRodXJzO1xuXG4gIHRhcmdldC5zZXREYXRlKHRhcmdldC5nZXREYXRlKCkgLSBkYXlOciArIDMpO1xuICBmVGh1cnMgPSB0YXJnZXQudmFsdWVPZigpO1xuICB0YXJnZXQuc2V0TW9udGgoMCwgMSk7XG4gIGlmICh0YXJnZXQuZ2V0RGF5KCkgIT09IDQpIHtcbiAgICB0YXJnZXQuc2V0TW9udGgoMCwgMSArICgoNCAtIHRhcmdldC5nZXREYXkoKSkgKyA3KSAlIDcpO1xuICB9XG5cbiAgcmV0dXJuIDEgKyBNYXRoLmNlaWwoKGZUaHVycyAtIHRhcmdldCkgLyA2MDQ4MDAwMDApO1xufTtcblxuLy8gTW9udGhcbmV4cG9ydHMuRiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gX21vbnRocy5mdWxsW2lucHV0LmdldE1vbnRoKCldO1xufTtcbmV4cG9ydHMubSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gKGlucHV0LmdldE1vbnRoKCkgPCA5ID8gJzAnIDogJycpICsgKGlucHV0LmdldE1vbnRoKCkgKyAxKTtcbn07XG5leHBvcnRzLk0gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIF9tb250aHMuYWJicltpbnB1dC5nZXRNb250aCgpXTtcbn07XG5leHBvcnRzLm4gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldE1vbnRoKCkgKyAxO1xufTtcbmV4cG9ydHMudCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gMzIgLSAobmV3IERhdGUoaW5wdXQuZ2V0RnVsbFllYXIoKSwgaW5wdXQuZ2V0TW9udGgoKSwgMzIpLmdldERhdGUoKSk7XG59O1xuXG4vLyBZZWFyXG5leHBvcnRzLkwgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKGlucHV0LmdldEZ1bGxZZWFyKCksIDEsIDI5KS5nZXREYXRlKCkgPT09IDI5O1xufTtcbmV4cG9ydHMubyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgdGFyZ2V0ID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKTtcbiAgdGFyZ2V0LnNldERhdGUodGFyZ2V0LmdldERhdGUoKSAtICgoaW5wdXQuZ2V0RGF5KCkgKyA2KSAlIDcpICsgMyk7XG4gIHJldHVybiB0YXJnZXQuZ2V0RnVsbFllYXIoKTtcbn07XG5leHBvcnRzLlkgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldEZ1bGxZZWFyKCk7XG59O1xuZXhwb3J0cy55ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiAoaW5wdXQuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpKS5zdWJzdHIoMik7XG59O1xuXG4vLyBUaW1lXG5leHBvcnRzLmEgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldEhvdXJzKCkgPCAxMiA/ICdhbScgOiAncG0nO1xufTtcbmV4cG9ydHMuQSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0SG91cnMoKSA8IDEyID8gJ0FNJyA6ICdQTSc7XG59O1xuZXhwb3J0cy5CID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBob3VycyA9IGlucHV0LmdldFVUQ0hvdXJzKCksIGJlYXRzO1xuICBob3VycyA9IChob3VycyA9PT0gMjMpID8gMCA6IGhvdXJzICsgMTtcbiAgYmVhdHMgPSBNYXRoLmFicygoKCgoaG91cnMgKiA2MCkgKyBpbnB1dC5nZXRVVENNaW51dGVzKCkpICogNjApICsgaW5wdXQuZ2V0VVRDU2Vjb25kcygpKSAvIDg2LjQpLnRvRml4ZWQoMCk7XG4gIHJldHVybiAoJzAwMCcuY29uY2F0KGJlYXRzKS5zbGljZShiZWF0cy5sZW5ndGgpKTtcbn07XG5leHBvcnRzLmcgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIGggPSBpbnB1dC5nZXRIb3VycygpO1xuICByZXR1cm4gaCA9PT0gMCA/IDEyIDogKGggPiAxMiA/IGggLSAxMiA6IGgpO1xufTtcbmV4cG9ydHMuRyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0SG91cnMoKTtcbn07XG5leHBvcnRzLmggPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIGggPSBpbnB1dC5nZXRIb3VycygpO1xuICByZXR1cm4gKChoIDwgMTAgfHwgKDEyIDwgaCAmJiAyMiA+IGgpKSA/ICcwJyA6ICcnKSArICgoaCA8IDEyKSA/IGggOiBoIC0gMTIpO1xufTtcbmV4cG9ydHMuSCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgaCA9IGlucHV0LmdldEhvdXJzKCk7XG4gIHJldHVybiAoaCA8IDEwID8gJzAnIDogJycpICsgaDtcbn07XG5leHBvcnRzLmkgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG0gPSBpbnB1dC5nZXRNaW51dGVzKCk7XG4gIHJldHVybiAobSA8IDEwID8gJzAnIDogJycpICsgbTtcbn07XG5leHBvcnRzLnMgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIHMgPSBpbnB1dC5nZXRTZWNvbmRzKCk7XG4gIHJldHVybiAocyA8IDEwID8gJzAnIDogJycpICsgcztcbn07XG4vL3UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnJzsgfSxcblxuLy8gVGltZXpvbmVcbi8vZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcnOyB9LFxuLy9JID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJyc7IH0sXG5leHBvcnRzLk8gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIHR6ID0gaW5wdXQuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgcmV0dXJuICh0eiA8IDAgPyAnLScgOiAnKycpICsgKHR6IC8gNjAgPCAxMCA/ICcwJyA6ICcnKSArIE1hdGguYWJzKCh0eiAvIDYwKSkgKyAnMDAnO1xufTtcbi8vVCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcnOyB9LFxuZXhwb3J0cy5aID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5nZXRUaW1lem9uZU9mZnNldCgpICogNjA7XG59O1xuXG4vLyBGdWxsIERhdGUvVGltZVxuZXhwb3J0cy5jID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b0lTT1N0cmluZygpO1xufTtcbmV4cG9ydHMuciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9VVENTdHJpbmcoKTtcbn07XG5leHBvcnRzLlUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldFRpbWUoKSAvIDEwMDA7XG59O1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxuICBkYXRlRm9ybWF0dGVyID0gcmVxdWlyZSgnLi9kYXRlZm9ybWF0dGVyJyk7XG5cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byByZWN1cnNpdmVseSBydW4gYSBmaWx0ZXIgYWNyb3NzIGFuIG9iamVjdC9hcnJheSBhbmQgYXBwbHkgaXQgdG8gYWxsIG9mIHRoZSBvYmplY3QvYXJyYXkncyB2YWx1ZXMuXG4gKiBAcGFyYW0gIHsqfSBpbnB1dFxuICogQHJldHVybiB7Kn1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGl0ZXJhdGVGaWx0ZXIoaW5wdXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgIG91dCA9IHt9O1xuXG4gIGlmICh1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIHJldHVybiB1dGlscy5tYXAoaW5wdXQsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHNlbGYuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnKSB7XG4gICAgdXRpbHMuZWFjaChpbnB1dCwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIG91dFtrZXldID0gc2VsZi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH0pO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICByZXR1cm47XG59XG5cbi8qKlxuICogQmFja3NsYXNoLWVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgbmVlZCB0byBiZSBlc2NhcGVkLlxuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBcIlxcXCJxdW90ZWQgc3RyaW5nXFxcIlwifGFkZHNsYXNoZXMgfX1cbiAqIC8vID0+IFxcXCJxdW90ZWQgc3RyaW5nXFxcIlxuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgIEJhY2tzbGFzaC1lc2NhcGVkIHN0cmluZy5cbiAqL1xuZXhwb3J0cy5hZGRzbGFzaGVzID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMuYWRkc2xhc2hlcywgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpLnJlcGxhY2UoL1xcJy9nLCBcIlxcXFwnXCIpLnJlcGxhY2UoL1xcXCIvZywgJ1xcXFxcIicpO1xufTtcblxuLyoqXG4gKiBVcHBlci1jYXNlIHRoZSBmaXJzdCBsZXR0ZXIgb2YgdGhlIGlucHV0IGFuZCBsb3dlci1jYXNlIHRoZSByZXN0LlxuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBcImkgbGlrZSBCdXJyaXRvc1wifGNhcGl0YWxpemUgfX1cbiAqIC8vID0+IEkgbGlrZSBidXJyaXRvc1xuICpcbiAqIEBwYXJhbSAgeyp9IGlucHV0ICBJZiBnaXZlbiBhbiBhcnJheSBvciBvYmplY3QsIGVhY2ggc3RyaW5nIG1lbWJlciB3aWxsIGJlIHJ1biB0aHJvdWdoIHRoZSBmaWx0ZXIgaW5kaXZpZHVhbGx5LlxuICogQHJldHVybiB7Kn0gICAgICAgIFJldHVybnMgdGhlIHNhbWUgdHlwZSBhcyB0aGUgaW5wdXQuXG4gKi9cbmV4cG9ydHMuY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgb3V0ID0gaXRlcmF0ZUZpbHRlci5hcHBseShleHBvcnRzLmNhcGl0YWxpemUsIGFyZ3VtZW50cyk7XG4gIGlmIChvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGlucHV0LnRvU3RyaW5nKCkuc3Vic3RyKDEpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG4vKipcbiAqIEZvcm1hdCBhIGRhdGUgb3IgRGF0ZS1jb21wYXRpYmxlIHN0cmluZy5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbm93ID0gbmV3IERhdGUoKTtcbiAqIHt7IG5vd3xkYXRlKCdZLW0tZCcpIH19XG4gKiAvLyA9PiAyMDEzLTA4LTE0XG4gKiBAZXhhbXBsZVxuICogLy8gbm93ID0gbmV3IERhdGUoKTtcbiAqIHt7IG5vd3xkYXRlKCdqUyBcXG9cXGYgRicpIH19XG4gKiAvLyA9PiA0dGggb2YgSnVseVxuICpcbiAqIEBwYXJhbSAgez8oc3RyaW5nfGRhdGUpfSAgIGlucHV0XG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICBmb3JtYXQgIFBIUC1zdHlsZSBkYXRlIGZvcm1hdCBjb21wYXRpYmxlIHN0cmluZy4gRXNjYXBlIGNoYXJhY3RlcnMgd2l0aCA8Y29kZT5cXDwvY29kZT4gZm9yIHN0cmluZyBsaXRlcmFscy5cbiAqIEBwYXJhbSAge251bWJlcj19ICAgICAgICAgIG9mZnNldCAgVGltZXpvbmUgb2Zmc2V0IGZyb20gR01UIGluIG1pbnV0ZXMuXG4gKiBAcGFyYW0gIHtzdHJpbmc9fSAgICAgICAgICBhYmJyICAgIFRpbWV6b25lIGFiYnJldmlhdGlvbi4gVXNlZCBmb3Igb3V0cHV0IG9ubHkuXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgIEZvcm1hdHRlZCBkYXRlIHN0cmluZy5cbiAqL1xuZXhwb3J0cy5kYXRlID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIG9mZnNldCwgYWJicikge1xuICB2YXIgbCA9IGZvcm1hdC5sZW5ndGgsXG4gICAgZGF0ZSA9IG5ldyBkYXRlRm9ybWF0dGVyLkRhdGVaKGlucHV0KSxcbiAgICBjdXIsXG4gICAgaSA9IDAsXG4gICAgb3V0ID0gJyc7XG5cbiAgaWYgKG9mZnNldCkge1xuICAgIGRhdGUuc2V0VGltZXpvbmVPZmZzZXQob2Zmc2V0LCBhYmJyKTtcbiAgfVxuXG4gIGZvciAoaTsgaSA8IGw7IGkgKz0gMSkge1xuICAgIGN1ciA9IGZvcm1hdC5jaGFyQXQoaSk7XG4gICAgaWYgKGN1ciA9PT0gJ1xcXFwnKSB7XG4gICAgICBpICs9IDE7XG4gICAgICBvdXQgKz0gKGkgPCBsKSA/IGZvcm1hdC5jaGFyQXQoaSkgOiBjdXI7XG4gICAgfSBlbHNlIGlmIChkYXRlRm9ybWF0dGVyLmhhc093blByb3BlcnR5KGN1cikpIHtcbiAgICAgIG91dCArPSBkYXRlRm9ybWF0dGVyW2N1cl0oZGF0ZSwgb2Zmc2V0LCBhYmJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ICs9IGN1cjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSWYgdGhlIGlucHV0IGlzIGB1bmRlZmluZWRgLCBgbnVsbGAsIG9yIGBmYWxzZWAsIGEgZGVmYXVsdCByZXR1cm4gdmFsdWUgY2FuIGJlIHNwZWNpZmllZC5cbiAqXG4gKiBAZXhhbXBsZVxuICoge3sgbnVsbF92YWx1ZXxkZWZhdWx0KCdUYWNvcycpIH19XG4gKiAvLyA9PiBUYWNvc1xuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBcIkJ1cnJpdG9zXCJ8ZGVmYXVsdChcIlRhY29zXCIpIH19XG4gKiAvLyA9PiBCdXJyaXRvc1xuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHBhcmFtICB7Kn0gIGRlZiAgICAgVmFsdWUgdG8gcmV0dXJuIGlmIGBpbnB1dGAgaXMgYHVuZGVmaW5lZGAsIGBudWxsYCwgb3IgYGZhbHNlYC5cbiAqIEByZXR1cm4geyp9ICAgICAgICAgIGBpbnB1dGAgb3IgYGRlZmAgdmFsdWUuXG4gKi9cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKGlucHV0LCBkZWYpIHtcbiAgcmV0dXJuICh0eXBlb2YgaW5wdXQgIT09ICd1bmRlZmluZWQnICYmIChpbnB1dCB8fCB0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSkgPyBpbnB1dCA6IGRlZjtcbn07XG5cbi8qKlxuICogRm9yY2UgZXNjYXBlIHRoZSBvdXRwdXQgb2YgdGhlIHZhcmlhYmxlLiBPcHRpb25hbGx5IHVzZSBgZWAgYXMgYSBzaG9ydGN1dCBmaWx0ZXIgbmFtZS4gVGhpcyBmaWx0ZXIgd2lsbCBiZSBhcHBsaWVkIGJ5IGRlZmF1bHQgaWYgYXV0b2VzY2FwZSBpcyB0dXJuZWQgb24uXG4gKlxuICogQGV4YW1wbGVcbiAqIHt7IFwiPGJsYWg+XCJ8ZXNjYXBlIH19XG4gKiAvLyA9PiAmbHQ7YmxhaCZndDtcbiAqXG4gKiBAZXhhbXBsZVxuICoge3sgXCI8YmxhaD5cInxlKFwianNcIikgfX1cbiAqIC8vID0+IFxcdTAwM0NibGFoXFx1MDAzRVxuICpcbiAqIEBwYXJhbSAgeyp9IGlucHV0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IFt0eXBlPSdodG1sJ10gICBJZiB5b3UgcGFzcyB0aGUgc3RyaW5nIGpzIGluIGFzIHRoZSB0eXBlLCBvdXRwdXQgd2lsbCBiZSBlc2NhcGVkIHNvIHRoYXQgaXQgaXMgc2FmZSBmb3IgSmF2YVNjcmlwdCBleGVjdXRpb24uXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgRXNjYXBlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24gKGlucHV0LCB0eXBlKSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMuZXNjYXBlLCBhcmd1bWVudHMpLFxuICAgIGlucCA9IGlucHV0LFxuICAgIGkgPSAwLFxuICAgIGNvZGU7XG5cbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGlucHV0O1xuICB9XG5cbiAgb3V0ID0gJyc7XG5cbiAgc3dpdGNoICh0eXBlKSB7XG4gIGNhc2UgJ2pzJzpcbiAgICBpbnAgPSBpbnAucmVwbGFjZSgvXFxcXC9nLCAnXFxcXHUwMDVDJyk7XG4gICAgZm9yIChpOyBpIDwgaW5wLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb2RlID0gaW5wLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY29kZSA8IDMyKSB7XG4gICAgICAgIGNvZGUgPSBjb2RlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBjb2RlID0gKGNvZGUubGVuZ3RoIDwgMikgPyAnMCcgKyBjb2RlIDogY29kZTtcbiAgICAgICAgb3V0ICs9ICdcXFxcdTAwJyArIGNvZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQgKz0gaW5wW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0LnJlcGxhY2UoLyYvZywgJ1xcXFx1MDAyNicpXG4gICAgICAucmVwbGFjZSgvPC9nLCAnXFxcXHUwMDNDJylcbiAgICAgIC5yZXBsYWNlKC8+L2csICdcXFxcdTAwM0UnKVxuICAgICAgLnJlcGxhY2UoL1xcJy9nLCAnXFxcXHUwMDI3JylcbiAgICAgIC5yZXBsYWNlKC9cIi9nLCAnXFxcXHUwMDIyJylcbiAgICAgIC5yZXBsYWNlKC9cXD0vZywgJ1xcXFx1MDAzRCcpXG4gICAgICAucmVwbGFjZSgvLS9nLCAnXFxcXHUwMDJEJylcbiAgICAgIC5yZXBsYWNlKC87L2csICdcXFxcdTAwM0InKTtcblxuICBkZWZhdWx0OlxuICAgIHJldHVybiBpbnAucmVwbGFjZSgvJig/IWFtcDt8bHQ7fGd0O3xxdW90O3wjMzk7KS9nLCAnJmFtcDsnKVxuICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jyk7XG4gIH1cbn07XG5leHBvcnRzLmUgPSBleHBvcnRzLmVzY2FwZTtcblxuLyoqXG4gKiBHZXQgdGhlIGZpcnN0IGl0ZW0gaW4gYW4gYXJyYXkgb3IgY2hhcmFjdGVyIGluIGEgc3RyaW5nLiBBbGwgb3RoZXIgb2JqZWN0cyB3aWxsIGF0dGVtcHQgdG8gcmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSBhdmFpbGFibGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2FyciA9IFsnYScsICdiJywgJ2MnXVxuICoge3sgbXlfYXJyfGZpcnN0IH19XG4gKiAvLyA9PiBhXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X3ZhbCA9ICdUYWNvcydcbiAqIHt7IG15X3ZhbHxmaXJzdCB9fVxuICogLy8gVFxuICpcbiAqIEBwYXJhbSAgeyp9IGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgVGhlIGZpcnN0IGl0ZW0gb2YgdGhlIGFycmF5IG9yIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgc3RyaW5nIGlucHV0LlxuICovXG5leHBvcnRzLmZpcnN0ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnICYmICF1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIHZhciBrZXlzID0gdXRpbHMua2V5cyhpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0W2tleXNbMF1dO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gaW5wdXQuc3Vic3RyKDAsIDEpO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0WzBdO1xufTtcblxuLyoqXG4gKiBHcm91cCBhbiBhcnJheSBvZiBvYmplY3RzIGJ5IGEgY29tbW9uIGtleS4gSWYgYW4gYXJyYXkgaXMgbm90IHByb3ZpZGVkLCB0aGUgaW5wdXQgdmFsdWUgd2lsbCBiZSByZXR1cm5lZCB1bnRvdWNoZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHBlb3BsZSA9IFt7IGFnZTogMjMsIG5hbWU6ICdQYXVsJyB9LCB7IGFnZTogMjYsIG5hbWU6ICdKYW5lJyB9LCB7IGFnZTogMjMsIG5hbWU6ICdKaW0nIH1dO1xuICogeyUgZm9yIGFnZWdyb3VwIGluIHBlb3BsZXxncm91cEJ5KCdhZ2UnKSAlfVxuICogICA8aDI+e3sgbG9vcC5rZXkgfX08L2gyPlxuICogICA8dWw+XG4gKiAgICAgeyUgZm9yIHBlcnNvbiBpbiBhZ2Vncm91cCAlfVxuICogICAgIDxsaT57eyBwZXJzb24ubmFtZSB9fTwvbGk+XG4gKiAgICAgeyUgZW5kZm9yICV9XG4gKiAgIDwvdWw+XG4gKiB7JSBlbmRmb3IgJX1cbiAqXG4gKiBAcGFyYW0gIHsqfSAgICAgIGlucHV0IElucHV0IG9iamVjdC5cbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5ICAgS2V5IHRvIGdyb3VwIGJ5LlxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICBHcm91cGVkIGFycmF5cyBieSBnaXZlbiBrZXkuXG4gKi9cbmV4cG9ydHMuZ3JvdXBCeSA9IGZ1bmN0aW9uIChpbnB1dCwga2V5KSB7XG4gIGlmICghdXRpbHMuaXNBcnJheShpbnB1dCkpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICB2YXIgb3V0ID0ge307XG5cbiAgdXRpbHMuZWFjaChpbnB1dCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKCF2YWx1ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGtleW5hbWUgPSB2YWx1ZVtrZXldLFxuICAgICAgbmV3VmFsID0gdXRpbHMuZXh0ZW5kKHt9LCB2YWx1ZSk7XG4gICAgZGVsZXRlIHZhbHVlW2tleV07XG5cbiAgICBpZiAoIW91dFtrZXluYW1lXSkge1xuICAgICAgb3V0W2tleW5hbWVdID0gW107XG4gICAgfVxuXG4gICAgb3V0W2tleW5hbWVdLnB1c2godmFsdWUpO1xuICB9KTtcblxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBKb2luIHRoZSBpbnB1dCB3aXRoIGEgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV9hcnJheSA9IFsnZm9vJywgJ2JhcicsICdiYXonXVxuICoge3sgbXlfYXJyYXl8am9pbignLCAnKSB9fVxuICogLy8gPT4gZm9vLCBiYXIsIGJhelxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV9rZXlfb2JqZWN0ID0geyBhOiAnZm9vJywgYjogJ2JhcicsIGM6ICdiYXonIH1cbiAqIHt7IG15X2tleV9vYmplY3R8am9pbignIGFuZCAnKSB9fVxuICogLy8gPT4gZm9vIGFuZCBiYXIgYW5kIGJhelxuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHBhcmFtICB7c3RyaW5nfSBnbHVlICAgIFN0cmluZyB2YWx1ZSB0byBqb2luIGl0ZW1zIHRvZ2V0aGVyLlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbiAoaW5wdXQsIGdsdWUpIHtcbiAgaWYgKHV0aWxzLmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgcmV0dXJuIGlucHV0LmpvaW4oZ2x1ZSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0Jykge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICB1dGlscy5lYWNoKGlucHV0LCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIG91dC5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gb3V0LmpvaW4oZ2x1ZSk7XG4gIH1cbiAgcmV0dXJuIGlucHV0O1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYW4gSmF2YVNjcmlwdCBvYmplY3QuXG4gKlxuICogQmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBzd2lnQDAueC54IHVzaW5nIGBqc29uX2VuY29kZWAuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHZhbCA9IHsgYTogJ2InIH1cbiAqIHt7IHZhbHxqc29uIH19XG4gKiAvLyA9PiB7XCJhXCI6XCJiXCJ9XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHZhbCA9IHsgYTogJ2InIH1cbiAqIHt7IHZhbHxqc29uKDQpIH19XG4gKiAvLyA9PiB7XG4gKiAvLyAgICAgICAgXCJhXCI6IFwiYlwiXG4gKiAvLyAgICB9XG4gKlxuICogQHBhcmFtICB7Kn0gICAgaW5wdXRcbiAqIEBwYXJhbSAge251bWJlcn0gIFtpbmRlbnRdICBOdW1iZXIgb2Ygc3BhY2VzIHRvIGluZGVudCBmb3IgcHJldHR5LWZvcm1hdHRpbmcuXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICBBIHZhbGlkIEpTT04gc3RyaW5nLlxuICovXG5leHBvcnRzLmpzb24gPSBmdW5jdGlvbiAoaW5wdXQsIGluZGVudCkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoaW5wdXQsIG51bGwsIGluZGVudCB8fCAwKTtcbn07XG5leHBvcnRzLmpzb25fZW5jb2RlID0gZXhwb3J0cy5qc29uO1xuXG4vKipcbiAqIEdldCB0aGUgbGFzdCBpdGVtIGluIGFuIGFycmF5IG9yIGNoYXJhY3RlciBpbiBhIHN0cmluZy4gQWxsIG90aGVyIG9iamVjdHMgd2lsbCBhdHRlbXB0IHRvIHJldHVybiB0aGUgbGFzdCB2YWx1ZSBhdmFpbGFibGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2FyciA9IFsnYScsICdiJywgJ2MnXVxuICoge3sgbXlfYXJyfGxhc3QgfX1cbiAqIC8vID0+IGNcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfdmFsID0gJ1RhY29zJ1xuICoge3sgbXlfdmFsfGxhc3QgfX1cbiAqIC8vIHNcbiAqXG4gKiBAcGFyYW0gIHsqfSBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgICAgVGhlIGxhc3QgaXRlbSBvZiB0aGUgYXJyYXkgb3IgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlIHN0cmluZy5pbnB1dC5cbiAqL1xuZXhwb3J0cy5sYXN0ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnICYmICF1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIHZhciBrZXlzID0gdXRpbHMua2V5cyhpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0W2tleXNba2V5cy5sZW5ndGggLSAxXV07XG4gIH1cblxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBpbnB1dC5jaGFyQXQoaW5wdXQubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gaW5wdXRbaW5wdXQubGVuZ3RoIC0gMV07XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgaW5wdXQgaW4gYWxsIGxvd2VyY2FzZSBsZXR0ZXJzLlxuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBcIkZPT0JBUlwifGxvd2VyIH19XG4gKiAvLyA9PiBmb29iYXJcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlPYmogPSB7IGE6ICdGT08nLCBiOiAnQkFSJyB9XG4gKiB7eyBteU9ianxsb3dlcnxqb2luKCcnKSB9fVxuICogLy8gPT4gZm9vYmFyXG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgICBSZXR1cm5zIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGlucHV0LlxuICovXG5leHBvcnRzLmxvd2VyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMubG93ZXIsIGFyZ3VtZW50cyk7XG4gIGlmIChvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xufTtcblxuLyoqXG4gKiBEZXByZWNhdGVkIGluIGZhdm9yIG9mIDxhIGhyZWY9XCIjc2FmZVwiPnNhZmU8L2E+LlxuICovXG5leHBvcnRzLnJhdyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gZXhwb3J0cy5zYWZlKGlucHV0KTtcbn07XG5leHBvcnRzLnJhdy5zYWZlID0gdHJ1ZTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHN0cmluZyB3aXRoIHRoZSBtYXRjaGVkIHNlYXJjaCBwYXR0ZXJuIHJlcGxhY2VkIGJ5IHRoZSBnaXZlbiByZXBsYWNlbWVudCBzdHJpbmcuIFVzZXMgSmF2YVNjcmlwdCdzIGJ1aWx0LWluIFN0cmluZy5yZXBsYWNlKCkgbWV0aG9kLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV92YXIgPSAnZm9vYmFyJztcbiAqIHt7IG15X3ZhcnxyZXBsYWNlKCdvJywgJ2UnLCAnZycpIH19XG4gKiAvLyA9PiBmZWViYXJcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfdmFyID0gXCJmYXJmZWdudWdlblwiO1xuICoge3sgbXlfdmFyfHJlcGxhY2UoJ15mJywgJ3AnKSB9fVxuICogLy8gPT4gcGFyZmVnbnVnZW5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfdmFyID0gJ2ExYjJjMyc7XG4gKiB7eyBteV92YXJ8cmVwbGFjZSgnXFx3JywgJzAnLCAnZycpIH19XG4gKiAvLyA9PiAwMTAyMDNcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlucHV0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNlYXJjaCAgICAgIFN0cmluZyBvciBwYXR0ZXJuIHRvIHJlcGxhY2UgZnJvbSB0aGUgaW5wdXQuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHJlcGxhY2VtZW50IFN0cmluZyB0byByZXBsYWNlIG1hdGNoZWQgcGF0dGVybi5cbiAqIEBwYXJhbSAge3N0cmluZ30gW2ZsYWdzXSAgICAgIFJlZ3VsYXIgRXhwcmVzc2lvbiBmbGFncy4gJ2cnOiBnbG9iYWwgbWF0Y2gsICdpJzogaWdub3JlIGNhc2UsICdtJzogbWF0Y2ggb3ZlciBtdWx0aXBsZSBsaW5lc1xuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICBSZXBsYWNlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydHMucmVwbGFjZSA9IGZ1bmN0aW9uIChpbnB1dCwgc2VhcmNoLCByZXBsYWNlbWVudCwgZmxhZ3MpIHtcbiAgdmFyIHIgPSBuZXcgUmVnRXhwKHNlYXJjaCwgZmxhZ3MpO1xuICByZXR1cm4gaW5wdXQucmVwbGFjZShyLCByZXBsYWNlbWVudCk7XG59O1xuXG4vKipcbiAqIFJldmVyc2Ugc29ydCB0aGUgaW5wdXQuIFRoaXMgaXMgYW4gYWxpYXMgZm9yIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+e3sgaW5wdXR8c29ydCh0cnVlKSB9fTwvY29kZT4uXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHZhbCA9IFsxLCAyLCAzXTtcbiAqIHt7IHZhbHxyZXZlcnNlIH19XG4gKiAvLyA9PiAzLDIsMVxuICpcbiAqIEBwYXJhbSAge2FycmF5fSAgaW5wdXRcbiAqIEByZXR1cm4ge2FycmF5fSAgICAgICAgUmV2ZXJzZWQgYXJyYXkuIFRoZSBvcmlnaW5hbCBpbnB1dCBvYmplY3QgaXMgcmV0dXJuZWQgaWYgaXQgd2FzIG5vdCBhbiBhcnJheS5cbiAqL1xuZXhwb3J0cy5yZXZlcnNlID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBleHBvcnRzLnNvcnQoaW5wdXQsIHRydWUpO1xufTtcblxuLyoqXG4gKiBGb3JjZXMgdGhlIGlucHV0IHRvIG5vdCBiZSBhdXRvLWVzY2FwZWQuIFVzZSB0aGlzIG9ubHkgb24gY29udGVudCB0aGF0IHlvdSBrbm93IGlzIHNhZmUgdG8gYmUgcmVuZGVyZWQgb24geW91ciBwYWdlLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV92YXIgPSBcIjxwPlN0dWZmPC9wPlwiO1xuICoge3sgbXlfdmFyfHNhZmUgfX1cbiAqIC8vID0+IDxwPlN0dWZmPC9wPlxuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgICAgVGhlIGlucHV0IGV4YWN0bHkgaG93IGl0IHdhcyBnaXZlbiwgcmVnYXJkbGVzcyBvZiBhdXRvZXNjYXBpbmcgc3RhdHVzLlxuICovXG5leHBvcnRzLnNhZmUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgLy8gVGhpcyBpcyBhIG1hZ2ljIGZpbHRlci4gSXRzIGxvZ2ljIGlzIGhhcmQtY29kZWQgaW50byBTd2lnJ3MgcGFyc2VyLlxuICByZXR1cm4gaW5wdXQ7XG59O1xuZXhwb3J0cy5zYWZlLnNhZmUgPSB0cnVlO1xuXG4vKipcbiAqIFNvcnQgdGhlIGlucHV0IGluIGFuIGFzY2VuZGluZyBkaXJlY3Rpb24uXG4gKiBJZiBnaXZlbiBhbiBvYmplY3QsIHdpbGwgcmV0dXJuIHRoZSBrZXlzIGFzIGEgc29ydGVkIGFycmF5LlxuICogSWYgZ2l2ZW4gYSBzdHJpbmcsIGVhY2ggY2hhcmFjdGVyIHdpbGwgYmUgc29ydGVkIGluZGl2aWR1YWxseS5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gdmFsID0gWzIsIDYsIDRdO1xuICoge3sgdmFsfHNvcnQgfX1cbiAqIC8vID0+IDIsNCw2XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHZhbCA9ICd6YXEnO1xuICoge3sgdmFsfHNvcnQgfX1cbiAqIC8vID0+IGFxelxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyB2YWwgPSB7IGJhcjogMSwgZm9vOiAyIH1cbiAqIHt7IHZhbHxzb3J0KHRydWUpIH19XG4gKiAvLyA9PiBmb28sYmFyXG4gKlxuICogQHBhcmFtICB7Kn0gaW5wdXRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JldmVyc2U9ZmFsc2VdIE91dHB1dCBpcyBnaXZlbiByZXZlcnNlLXNvcnRlZCBpZiB0cnVlLlxuICogQHJldHVybiB7Kn0gICAgICAgIFNvcnRlZCBhcnJheTtcbiAqL1xuZXhwb3J0cy5zb3J0ID0gZnVuY3Rpb24gKGlucHV0LCByZXZlcnNlKSB7XG4gIHZhciBvdXQ7XG4gIGlmICh1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIG91dCA9IGlucHV0LnNvcnQoKTtcbiAgfSBlbHNlIHtcbiAgICBzd2l0Y2ggKHR5cGVvZiBpbnB1dCkge1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBvdXQgPSB1dGlscy5rZXlzKGlucHV0KS5zb3J0KCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgb3V0ID0gaW5wdXQuc3BsaXQoJycpO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIG91dC5yZXZlcnNlKCkuam9pbignJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0LnNvcnQoKS5qb2luKCcnKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3V0ICYmIHJldmVyc2UpIHtcbiAgICByZXR1cm4gb3V0LnJldmVyc2UoKTtcbiAgfVxuXG4gIHJldHVybiBvdXQgfHwgaW5wdXQ7XG59O1xuXG4vKipcbiAqIFN0cmlwIEhUTUwgdGFncy5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gc3R1ZmYgPSAnPHA+Zm9vYmFyPC9wPic7XG4gKiB7eyBzdHVmZnxzdHJpcHRhZ3MgfX1cbiAqIC8vID0+IGZvb2JhclxuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgIFJldHVybnMgdGhlIHNhbWUgb2JqZWN0IGFzIHRoZSBpbnB1dCwgYnV0IHdpdGggYWxsIHN0cmluZyB2YWx1ZXMgc3RyaXBwZWQgb2YgdGFncy5cbiAqL1xuZXhwb3J0cy5zdHJpcHRhZ3MgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy5zdHJpcHRhZ3MsIGFyZ3VtZW50cyk7XG4gIGlmIChvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC8oPChbXj5dKyk+KS9pZywgJycpO1xufTtcblxuLyoqXG4gKiBDYXBpdGFsaXplcyBldmVyeSB3b3JkIGdpdmVuIGFuZCBsb3dlci1jYXNlcyBhbGwgb3RoZXIgbGV0dGVycy5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfc3RyID0gJ3RoaXMgaXMgc29NZSB0ZXh0JztcbiAqIHt7IG15X3N0cnx0aXRsZSB9fVxuICogLy8gPT4gVGhpcyBJcyBTb21lIFRleHRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfYXJyID0gWydoaScsICd0aGlzJywgJ2lzJywgJ2FuJywgJ2FycmF5J107XG4gKiB7eyBteV9hcnJ8dGl0bGV8am9pbignICcpIH19XG4gKiAvLyA9PiBIaSBUaGlzIElzIEFuIEFycmF5XG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgUmV0dXJucyB0aGUgc2FtZSBvYmplY3QgYXMgdGhlIGlucHV0LCBidXQgd2l0aCBhbGwgd29yZHMgaW4gc3RyaW5ncyB0aXRsZS1jYXNlZC5cbiAqL1xuZXhwb3J0cy50aXRsZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgb3V0ID0gaXRlcmF0ZUZpbHRlci5hcHBseShleHBvcnRzLnRpdGxlLCBhcmd1bWVudHMpO1xuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZSgvXFx3XFxTKi9nLCBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgZHVwbGljYXRlIGl0ZW1zIGZyb20gYW4gYXJyYXkuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2FyciA9IFsxLCAyLCAzLCA0LCA0LCAzLCAyLCAxXTtcbiAqIHt7IG15X2Fycnx1bmlxfGpvaW4oJywnKSB9fVxuICogLy8gPT4gMSwyLDMsNFxuICpcbiAqIEBwYXJhbSAge2FycmF5fSAgaW5wdXRcbiAqIEByZXR1cm4ge2FycmF5fSAgICAgICAgQXJyYXkgd2l0aCB1bmlxdWUgaXRlbXMuIElmIGlucHV0IHdhcyBub3QgYW4gYXJyYXksIHRoZSBvcmlnaW5hbCBpdGVtIGlzIHJldHVybmVkIHVudG91Y2hlZC5cbiAqL1xuZXhwb3J0cy51bmlxID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKCFpbnB1dCB8fCAhdXRpbHMuaXNBcnJheShpbnB1dCkpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICByZXN1bHQgPSBbXTtcbiAgdXRpbHMuZWFjaChpbnB1dCwgZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAocmVzdWx0LmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICByZXN1bHQucHVzaCh2KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IHRoZSBpbnB1dCB0byBhbGwgdXBwZXJjYXNlIGxldHRlcnMuIElmIGFuIG9iamVjdCBvciBhcnJheSBpcyBwcm92aWRlZCwgYWxsIHZhbHVlcyB3aWxsIGJlIHVwcGVyY2FzZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X3N0ciA9ICd0YWNvcyc7XG4gKiB7eyBteV9zdHJ8dXBwZXIgfX1cbiAqIC8vID0+IFRBQ09TXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2FyciA9IFsndGFjb3MnLCAnYnVycml0b3MnXTtcbiAqIHt7IG15X2Fycnx1cHBlcnxqb2luKCcgJiAnKSB9fVxuICogLy8gPT4gVEFDT1MgJiBCVVJSSVRPU1xuICpcbiAqIEBwYXJhbSAgeyp9ICBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgIFJldHVybnMgdGhlIHNhbWUgdHlwZSBhcyB0aGUgaW5wdXQsIHdpdGggYWxsIHN0cmluZ3MgdXBwZXItY2FzZWQuXG4gKi9cbmV4cG9ydHMudXBwZXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy51cHBlciwgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKCk7XG59O1xuXG4vKipcbiAqIFVSTC1lbmNvZGUgYSBzdHJpbmcuIElmIGFuIG9iamVjdCBvciBhcnJheSBpcyBwYXNzZWQsIGFsbCB2YWx1ZXMgd2lsbCBiZSBVUkwtZW5jb2RlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfc3RyID0gJ3BhcmFtPTEmYW5vdGhlclBhcmFtPTInO1xuICoge3sgbXlfc3RyfHVybF9lbmNvZGUgfX1cbiAqIC8vID0+IHBhcmFtJTNEMSUyNmFub3RoZXJQYXJhbSUzRDJcbiAqXG4gKiBAcGFyYW0gIHsqfSBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgVVJMLWVuY29kZWQgc3RyaW5nLlxuICovXG5leHBvcnRzLnVybF9lbmNvZGUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy51cmxfZW5jb2RlLCBhcmd1bWVudHMpO1xuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoaW5wdXQpO1xufTtcblxuLyoqXG4gKiBVUkwtZGVjb2RlIGEgc3RyaW5nLiBJZiBhbiBvYmplY3Qgb3IgYXJyYXkgaXMgcGFzc2VkLCBhbGwgdmFsdWVzIHdpbGwgYmUgVVJMLWRlY29kZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X3N0ciA9ICdwYXJhbSUzRDElMjZhbm90aGVyUGFyYW0lM0QyJztcbiAqIHt7IG15X3N0cnx1cmxfZGVjb2RlIH19XG4gKiAvLyA9PiBwYXJhbT0xJmFub3RoZXJQYXJhbT0yXG4gKlxuICogQHBhcmFtICB7Kn0gaW5wdXRcbiAqIEByZXR1cm4geyp9ICAgICAgIFVSTC1kZWNvZGVkIHN0cmluZy5cbiAqL1xuZXhwb3J0cy51cmxfZGVjb2RlID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMudXJsX2RlY29kZSwgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KTtcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbi8qKlxuICogQSBsZXhlciB0b2tlbi5cbiAqIEB0eXBlZGVmIHtvYmplY3R9IExleGVyVG9rZW5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtYXRjaCAgVGhlIHN0cmluZyB0aGF0IHdhcyBtYXRjaGVkLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IHR5cGUgICBMZXhlciB0eXBlIGVudW0uXG4gKiBAcHJvcGVydHkge251bWJlcn0gbGVuZ3RoIExlbmd0aCBvZiB0aGUgb3JpZ2luYWwgc3RyaW5nIHByb2Nlc3NlZC5cbiAqL1xuXG4vKipcbiAqIEVudW0gZm9yIHRva2VuIHR5cGVzLlxuICogQHJlYWRvbmx5XG4gKiBAZW51bSB7bnVtYmVyfVxuICovXG52YXIgVFlQRVMgPSB7XG4gICAgLyoqIFdoaXRlc3BhY2UgKi9cbiAgICBXSElURVNQQUNFOiAwLFxuICAgIC8qKiBQbGFpbiBzdHJpbmcgKi9cbiAgICBTVFJJTkc6IDEsXG4gICAgLyoqIFZhcmlhYmxlIGZpbHRlciAqL1xuICAgIEZJTFRFUjogMixcbiAgICAvKiogRW1wdHkgdmFyaWFibGUgZmlsdGVyICovXG4gICAgRklMVEVSRU1QVFk6IDMsXG4gICAgLyoqIEZ1bmN0aW9uICovXG4gICAgRlVOQ1RJT046IDQsXG4gICAgLyoqIEZ1bmN0aW9uIHdpdGggbm8gYXJndW1lbnRzICovXG4gICAgRlVOQ1RJT05FTVBUWTogNSxcbiAgICAvKiogT3BlbiBwYXJlbnRoZXNpcyAqL1xuICAgIFBBUkVOT1BFTjogNixcbiAgICAvKiogQ2xvc2UgcGFyZW50aGVzaXMgKi9cbiAgICBQQVJFTkNMT1NFOiA3LFxuICAgIC8qKiBDb21tYSAqL1xuICAgIENPTU1BOiA4LFxuICAgIC8qKiBWYXJpYWJsZSAqL1xuICAgIFZBUjogOSxcbiAgICAvKiogTnVtYmVyICovXG4gICAgTlVNQkVSOiAxMCxcbiAgICAvKiogTWF0aCBvcGVyYXRvciAqL1xuICAgIE9QRVJBVE9SOiAxMSxcbiAgICAvKiogT3BlbiBzcXVhcmUgYnJhY2tldCAqL1xuICAgIEJSQUNLRVRPUEVOOiAxMixcbiAgICAvKiogQ2xvc2Ugc3F1YXJlIGJyYWNrZXQgKi9cbiAgICBCUkFDS0VUQ0xPU0U6IDEzLFxuICAgIC8qKiBLZXkgb24gYW4gb2JqZWN0IHVzaW5nIGRvdC1ub3RhdGlvbiAqL1xuICAgIERPVEtFWTogMTQsXG4gICAgLyoqIFN0YXJ0IG9mIGFuIGFycmF5ICovXG4gICAgQVJSQVlPUEVOOiAxNSxcbiAgICAvKiogRW5kIG9mIGFuIGFycmF5XG4gICAgICogQ3VycmVudGx5IHVudXNlZFxuICAgIEFSUkFZQ0xPU0U6IDE2LCAqL1xuICAgIC8qKiBPcGVuIGN1cmx5IGJyYWNlICovXG4gICAgQ1VSTFlPUEVOOiAxNyxcbiAgICAvKiogQ2xvc2UgY3VybHkgYnJhY2UgKi9cbiAgICBDVVJMWUNMT1NFOiAxOCxcbiAgICAvKiogQ29sb24gKDopICovXG4gICAgQ09MT046IDE5LFxuICAgIC8qKiBKYXZhU2NyaXB0LXZhbGlkIGNvbXBhcmF0b3IgKi9cbiAgICBDT01QQVJBVE9SOiAyMCxcbiAgICAvKiogQm9vbGVhbiBsb2dpYyAqL1xuICAgIExPR0lDOiAyMSxcbiAgICAvKiogQm9vbGVhbiBsb2dpYyBcIm5vdFwiICovXG4gICAgTk9UOiAyMixcbiAgICAvKiogdHJ1ZSBvciBmYWxzZSAqL1xuICAgIEJPT0w6IDIzLFxuICAgIC8qKiBWYXJpYWJsZSBhc3NpZ25tZW50ICovXG4gICAgQVNTSUdOTUVOVDogMjQsXG4gICAgLyoqIFN0YXJ0IG9mIGEgbWV0aG9kICovXG4gICAgTUVUSE9ET1BFTjogMjUsXG4gICAgLyoqIEVuZCBvZiBhIG1ldGhvZFxuICAgICAqIEN1cnJlbnRseSB1bnVzZWRcbiAgICBNRVRIT0RFTkQ6IDI2LCAqL1xuICAgIC8qKiBVbmtub3duIHR5cGUgKi9cbiAgICBVTktOT1dOOiAxMDBcbiAgfSxcbiAgcnVsZXMgPSBbXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuV0hJVEVTUEFDRSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFxzKy9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLlNUUklORyxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXCJcIi8sXG4gICAgICAgIC9eXCIuKj9bXlxcXFxdXCIvLFxuICAgICAgICAvXicnLyxcbiAgICAgICAgL14nLio/W15cXFxcXScvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5GSUxURVIsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcfFxccyooXFx3KylcXCgvXG4gICAgICBdLFxuICAgICAgaWR4OiAxXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5GSUxURVJFTVBUWSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFx8XFxzKihcXHcrKS9cbiAgICAgIF0sXG4gICAgICBpZHg6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkZVTkNUSU9ORU1QVFksXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxccyooXFx3KylcXChcXCkvXG4gICAgICBdLFxuICAgICAgaWR4OiAxXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5GVU5DVElPTixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFxzKihcXHcrKVxcKC9cbiAgICAgIF0sXG4gICAgICBpZHg6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLlBBUkVOT1BFTixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFwoL1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuUEFSRU5DTE9TRSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFwpL1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQ09NTUEsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXiwvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5MT0dJQyxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eKCYmfFxcfFxcfClcXHMqLyxcbiAgICAgICAgL14oYW5kfG9yKVxccysvXG4gICAgICBdLFxuICAgICAgaWR4OiAxLFxuICAgICAgcmVwbGFjZToge1xuICAgICAgICAnYW5kJzogJyYmJyxcbiAgICAgICAgJ29yJzogJ3x8J1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQ09NUEFSQVRPUixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eKD09PXw9PXxcXCE9PXxcXCE9fDw9fDx8Pj18Pnxpblxcc3xndGVcXHN8Z3RcXHN8bHRlXFxzfGx0XFxzKVxccyovXG4gICAgICBdLFxuICAgICAgaWR4OiAxLFxuICAgICAgcmVwbGFjZToge1xuICAgICAgICAnZ3RlJzogJz49JyxcbiAgICAgICAgJ2d0JzogJz4nLFxuICAgICAgICAnbHRlJzogJzw9JyxcbiAgICAgICAgJ2x0JzogJzwnXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5BU1NJR05NRU5ULFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL14oPXxcXCs9fC09fFxcKj18XFwvPSkvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5OT1QsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcIVxccyovLFxuICAgICAgICAvXm5vdFxccysvXG4gICAgICBdLFxuICAgICAgcmVwbGFjZToge1xuICAgICAgICAnbm90JzogJyEnXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5CT09MLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL14odHJ1ZXxmYWxzZSlcXHMrLyxcbiAgICAgICAgL14odHJ1ZXxmYWxzZSkkL1xuICAgICAgXSxcbiAgICAgIGlkeDogMVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuVkFSLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15bYS16QS1aXyRdXFx3KigoXFwuXFwkP1xcdyopKyk/LyxcbiAgICAgICAgL15bYS16QS1aXyRdXFx3Ki9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkJSQUNLRVRPUEVOLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXFsvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5CUkFDS0VUQ0xPU0UsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcXS9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkNVUkxZT1BFTixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFx7L1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQ09MT04sXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcOi9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkNVUkxZQ0xPU0UsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcfS9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkRPVEtFWSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFwuKFxcdyspL1xuICAgICAgXSxcbiAgICAgIGlkeDogMVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuTlVNQkVSLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15bK1xcLV0/XFxkKyhcXC5cXGQrKT8vXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5PUEVSQVRPUixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eKFxcK3xcXC18XFwvfFxcKnwlKS9cbiAgICAgIF1cbiAgICB9XG4gIF07XG5cbmV4cG9ydHMudHlwZXMgPSBUWVBFUztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHRva2VuIHR5cGUgb2JqZWN0IGZvciBhIHNpbmdsZSBjaHVuayBvZiBhIHN0cmluZy5cbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyIFN0cmluZyBjaHVuay5cbiAqIEByZXR1cm4ge0xleGVyVG9rZW59ICAgICBEZWZpbmVkIHR5cGUsIHBvdGVudGlhbGx5IHN0cmlwcGVkIG9yIHJlcGxhY2VkIHdpdGggbW9yZSBzdWl0YWJsZSBjb250ZW50LlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmVhZGVyKHN0cikge1xuICB2YXIgbWF0Y2hlZDtcblxuICB1dGlscy5zb21lKHJ1bGVzLCBmdW5jdGlvbiAocnVsZSkge1xuICAgIHJldHVybiB1dGlscy5zb21lKHJ1bGUucmVnZXgsIGZ1bmN0aW9uIChyZWdleCkge1xuICAgICAgdmFyIG1hdGNoID0gc3RyLm1hdGNoKHJlZ2V4KSxcbiAgICAgICAgbm9ybWFsaXplZDtcblxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG5vcm1hbGl6ZWQgPSBtYXRjaFtydWxlLmlkeCB8fCAwXS5yZXBsYWNlKC9cXHMqJC8sICcnKTtcbiAgICAgIG5vcm1hbGl6ZWQgPSAocnVsZS5oYXNPd25Qcm9wZXJ0eSgncmVwbGFjZScpICYmIHJ1bGUucmVwbGFjZS5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVkKSkgPyBydWxlLnJlcGxhY2Vbbm9ybWFsaXplZF0gOiBub3JtYWxpemVkO1xuXG4gICAgICBtYXRjaGVkID0ge1xuICAgICAgICBtYXRjaDogbm9ybWFsaXplZCxcbiAgICAgICAgdHlwZTogcnVsZS50eXBlLFxuICAgICAgICBsZW5ndGg6IG1hdGNoWzBdLmxlbmd0aFxuICAgICAgfTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoIW1hdGNoZWQpIHtcbiAgICBtYXRjaGVkID0ge1xuICAgICAgbWF0Y2g6IHN0cixcbiAgICAgIHR5cGU6IFRZUEVTLlVOS05PV04sXG4gICAgICBsZW5ndGg6IHN0ci5sZW5ndGhcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG1hdGNoZWQ7XG59XG5cbi8qKlxuICogUmVhZCBhIHN0cmluZyBhbmQgYnJlYWsgaXQgaW50byBzZXBhcmF0ZSB0b2tlbiB0eXBlcy5cbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtBcnJheS5MZXhlclRva2VufSAgICAgQXJyYXkgb2YgZGVmaW5lZCB0eXBlcywgcG90ZW50aWFsbHkgc3RyaXBwZWQgb3IgcmVwbGFjZWQgd2l0aCBtb3JlIHN1aXRhYmxlIGNvbnRlbnQuXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBvZmZzZXQgPSAwLFxuICAgIHRva2VucyA9IFtdLFxuICAgIHN1YnN0cixcbiAgICBtYXRjaDtcbiAgd2hpbGUgKG9mZnNldCA8IHN0ci5sZW5ndGgpIHtcbiAgICBzdWJzdHIgPSBzdHIuc3Vic3RyaW5nKG9mZnNldCk7XG4gICAgbWF0Y2ggPSByZWFkZXIoc3Vic3RyKTtcbiAgICBvZmZzZXQgKz0gbWF0Y2gubGVuZ3RoO1xuICAgIHRva2Vucy5wdXNoKG1hdGNoKTtcbiAgfVxuICByZXR1cm4gdG9rZW5zO1xufTtcbiIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJyksXG4gIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbi8qKlxuICogTG9hZHMgdGVtcGxhdGVzIGZyb20gdGhlIGZpbGUgc3lzdGVtLlxuICogQGFsaWFzIHN3aWcubG9hZGVycy5mc1xuICogQGV4YW1wbGVcbiAqIHN3aWcuc2V0RGVmYXVsdHMoeyBsb2FkZXI6IHN3aWcubG9hZGVycy5mcygpIH0pO1xuICogQGV4YW1wbGVcbiAqIC8vIExvYWQgVGVtcGxhdGVzIGZyb20gYSBzcGVjaWZpYyBkaXJlY3RvcnkgKGRvZXMgbm90IHJlcXVpcmUgdXNpbmcgcmVsYXRpdmUgcGF0aHMgaW4geW91ciB0ZW1wbGF0ZXMpXG4gKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBzd2lnLmxvYWRlcnMuZnMoX19kaXJuYW1lICsgJy90ZW1wbGF0ZXMnICl9KTtcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIFtiYXNlcGF0aD0nJ10gICAgIFBhdGggdG8gdGhlIHRlbXBsYXRlcyBhcyBzdHJpbmcuIEFzc2lnbmluZyB0aGlzIHZhbHVlIGFsbG93cyB5b3UgdG8gdXNlIHNlbWktYWJzb2x1dGUgcGF0aHMgdG8gdGVtcGxhdGVzIGluc3RlYWQgb2YgcmVsYXRpdmUgcGF0aHMuXG4gKiBAcGFyYW0ge3N0cmluZ30gICBbZW5jb2Rpbmc9J3V0ZjgnXSAgIFRlbXBsYXRlIGVuY29kaW5nXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2VwYXRoLCBlbmNvZGluZykge1xuICB2YXIgcmV0ID0ge307XG5cbiAgZW5jb2RpbmcgPSBlbmNvZGluZyB8fCAndXRmOCc7XG4gIGJhc2VwYXRoID0gKGJhc2VwYXRoKSA/IHBhdGgubm9ybWFsaXplKGJhc2VwYXRoKSA6IG51bGw7XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIDx2YXI+dG88L3Zhcj4gdG8gYW4gYWJzb2x1dGUgcGF0aCBvciB1bmlxdWUgaWRlbnRpZmllci4gVGhpcyBpcyB1c2VkIGZvciBidWlsZGluZyBjb3JyZWN0LCBub3JtYWxpemVkLCBhbmQgYWJzb2x1dGUgcGF0aHMgdG8gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAgICogQGFsaWFzIHJlc29sdmVcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0byAgICAgICAgTm9uLWFic29sdXRlIGlkZW50aWZpZXIgb3IgcGF0aG5hbWUgdG8gYSBmaWxlLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IFtmcm9tXSAgICBJZiBnaXZlbiwgc2hvdWxkIGF0dGVtcHQgdG8gZmluZCB0aGUgPHZhcj50bzwvdmFyPiBwYXRoIGluIHJlbGF0aW9uIHRvIHRoaXMgZ2l2ZW4sIGtub3duIHBhdGguXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHJldC5yZXNvbHZlID0gZnVuY3Rpb24gKHRvLCBmcm9tKSB7XG4gICAgaWYgKGJhc2VwYXRoKSB7XG4gICAgICBmcm9tID0gYmFzZXBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZyb20gPSAoZnJvbSkgPyBwYXRoLmRpcm5hbWUoZnJvbSkgOiBwcm9jZXNzLmN3ZCgpO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5yZXNvbHZlKGZyb20sIHRvKTtcbiAgfTtcblxuICAvKipcbiAgICogTG9hZHMgYSBzaW5nbGUgdGVtcGxhdGUuIEdpdmVuIGEgdW5pcXVlIDx2YXI+aWRlbnRpZmllcjwvdmFyPiBmb3VuZCBieSB0aGUgPHZhcj5yZXNvbHZlPC92YXI+IG1ldGhvZCB0aGlzIHNob3VsZCByZXR1cm4gdGhlIGdpdmVuIHRlbXBsYXRlLlxuICAgKiBAYWxpYXMgbG9hZFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgaWRlbnRpZmllciAgVW5pcXVlIGlkZW50aWZpZXIgb2YgYSB0ZW1wbGF0ZSAocG9zc2libHkgYW4gYWJzb2x1dGUgcGF0aCkuXG4gICAqIEBwYXJhbSAge2Z1bmN0aW9ufSBbY2JdICAgICAgICBBc3luY2hyb25vdXMgY2FsbGJhY2sgZnVuY3Rpb24uIElmIG5vdCBwcm92aWRlZCwgdGhpcyBtZXRob2Qgc2hvdWxkIHJ1biBzeW5jaHJvbm91c2x5LlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgVGVtcGxhdGUgc291cmNlIHN0cmluZy5cbiAgICovXG4gIHJldC5sb2FkID0gZnVuY3Rpb24gKGlkZW50aWZpZXIsIGNiKSB7XG4gICAgaWYgKCFmcyB8fCAoY2IgJiYgIWZzLnJlYWRGaWxlKSB8fCAhZnMucmVhZEZpbGVTeW5jKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIGZpbGUgJyArIGlkZW50aWZpZXIgKyAnIGJlY2F1c2UgdGhlcmUgaXMgbm8gZmlsZXN5c3RlbSB0byByZWFkIGZyb20uJyk7XG4gICAgfVxuXG4gICAgaWRlbnRpZmllciA9IHJldC5yZXNvbHZlKGlkZW50aWZpZXIpO1xuXG4gICAgaWYgKGNiKSB7XG4gICAgICBmcy5yZWFkRmlsZShpZGVudGlmaWVyLCBlbmNvZGluZywgY2IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGlkZW50aWZpZXIsIGVuY29kaW5nKTtcbiAgfTtcblxuICByZXR1cm4gcmV0O1xufTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBUZW1wbGF0ZUxvYWRlclxuICogQGRlc2NyaXB0aW9uIFN3aWcgaXMgYWJsZSB0byBhY2NlcHQgY3VzdG9tIHRlbXBsYXRlIGxvYWRlcnMgd3JpdHRlbiBieSB5b3UsIHNvIHRoYXQgeW91ciB0ZW1wbGF0ZXMgY2FuIGNvbWUgZnJvbSB5b3VyIGZhdm9yaXRlIHN0b3JhZ2UgbWVkaXVtIHdpdGhvdXQgbmVlZGluZyB0byBiZSBwYXJ0IG9mIHRoZSBjb3JlIGxpYnJhcnkuXG4gKiBBIHRlbXBsYXRlIGxvYWRlciBjb25zaXN0cyBvZiB0d28gbWV0aG9kczogPHZhcj5yZXNvbHZlPC92YXI+IGFuZCA8dmFyPmxvYWQ8L3Zhcj4uIEVhY2ggbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBieSBTd2lnIHRvIGZpbmQgYW5kIGxvYWQgdGhlIHNvdXJjZSBvZiB0aGUgdGVtcGxhdGUgYmVmb3JlIGF0dGVtcHRpbmcgdG8gcGFyc2UgYW5kIGNvbXBpbGUgaXQuXG4gKiBAZXhhbXBsZVxuICogLy8gQSB0aGVvcmV0aWNhbCBtZW1jYWNoZWQgbG9hZGVyXG4gKiB2YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcbiAqICAgTWVtY2FjaGVkID0gcmVxdWlyZSgnbWVtY2FjaGVkJyk7XG4gKiBmdW5jdGlvbiBtZW1jYWNoZWRMb2FkZXIobG9jYXRpb25zLCBvcHRpb25zKSB7XG4gKiAgIHZhciBtZW1jYWNoZWQgPSBuZXcgTWVtY2FjaGVkKGxvY2F0aW9ucywgb3B0aW9ucyk7XG4gKiAgIHJldHVybiB7XG4gKiAgICAgcmVzb2x2ZTogZnVuY3Rpb24gKHRvLCBmcm9tKSB7XG4gKiAgICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKGZyb20sIHRvKTtcbiAqICAgICB9LFxuICogICAgIGxvYWQ6IGZ1bmN0aW9uIChpZGVudGlmaWVyLCBjYikge1xuICogICAgICAgbWVtY2FjaGVkLmdldChpZGVudGlmaWVyLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gKiAgICAgICAgIC8vIGlmICghZGF0YSkgeyBsb2FkIGZyb20gZmlsZXN5c3RlbTsgfVxuICogICAgICAgICBjYihlcnIsIGRhdGEpO1xuICogICAgICAgfSk7XG4gKiAgICAgfVxuICogICB9O1xuICogfTtcbiAqIC8vIFRlbGwgc3dpZyBhYm91dCB0aGUgbG9hZGVyOlxuICogc3dpZy5zZXREZWZhdWx0cyh7IGxvYWRlcjogbWVtY2FjaGVkTG9hZGVyKFsnMTkyLjE2OC4wLjInXSkgfSk7XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBuYW1lIHJlc29sdmVcbiAqIEBtZW1iZXJvZiBUZW1wbGF0ZUxvYWRlclxuICogQGRlc2NyaXB0aW9uXG4gKiBSZXNvbHZlcyA8dmFyPnRvPC92YXI+IHRvIGFuIGFic29sdXRlIHBhdGggb3IgdW5pcXVlIGlkZW50aWZpZXIuIFRoaXMgaXMgdXNlZCBmb3IgYnVpbGRpbmcgY29ycmVjdCwgbm9ybWFsaXplZCwgYW5kIGFic29sdXRlIHBhdGhzIHRvIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHRvICAgICAgICBOb24tYWJzb2x1dGUgaWRlbnRpZmllciBvciBwYXRobmFtZSB0byBhIGZpbGUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IFtmcm9tXSAgICBJZiBnaXZlbiwgc2hvdWxkIGF0dGVtcHQgdG8gZmluZCB0aGUgPHZhcj50bzwvdmFyPiBwYXRoIGluIHJlbGF0aW9uIHRvIHRoaXMgZ2l2ZW4sIGtub3duIHBhdGguXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBuYW1lIGxvYWRcbiAqIEBtZW1iZXJvZiBUZW1wbGF0ZUxvYWRlclxuICogQGRlc2NyaXB0aW9uXG4gKiBMb2FkcyBhIHNpbmdsZSB0ZW1wbGF0ZS4gR2l2ZW4gYSB1bmlxdWUgPHZhcj5pZGVudGlmaWVyPC92YXI+IGZvdW5kIGJ5IHRoZSA8dmFyPnJlc29sdmU8L3Zhcj4gbWV0aG9kIHRoaXMgc2hvdWxkIHJldHVybiB0aGUgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgaWRlbnRpZmllciAgVW5pcXVlIGlkZW50aWZpZXIgb2YgYSB0ZW1wbGF0ZSAocG9zc2libHkgYW4gYWJzb2x1dGUgcGF0aCkuXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gW2NiXSAgICAgICAgQXN5bmNocm9ub3VzIGNhbGxiYWNrIGZ1bmN0aW9uLiBJZiBub3QgcHJvdmlkZWQsIHRoaXMgbWV0aG9kIHNob3VsZCBydW4gc3luY2hyb25vdXNseS5cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICBUZW1wbGF0ZSBzb3VyY2Ugc3RyaW5nLlxuICovXG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5mcyA9IHJlcXVpcmUoJy4vZmlsZXN5c3RlbScpO1xuZXhwb3J0cy5tZW1vcnkgPSByZXF1aXJlKCcuL21lbW9yeScpO1xuIiwidmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyksXG4gIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBMb2FkcyB0ZW1wbGF0ZXMgZnJvbSBhIHByb3ZpZGVkIG9iamVjdCBtYXBwaW5nLlxuICogQGFsaWFzIHN3aWcubG9hZGVycy5tZW1vcnlcbiAqIEBleGFtcGxlXG4gKiB2YXIgdGVtcGxhdGVzID0ge1xuICogICBcImxheW91dFwiOiBcInslIGJsb2NrIGNvbnRlbnQgJX17JSBlbmRibG9jayAlfVwiLFxuICogICBcImhvbWUuaHRtbFwiOiBcInslIGV4dGVuZHMgJ2xheW91dC5odG1sJyAlfXslIGJsb2NrIGNvbnRlbnQgJX0uLi57JSBlbmRibG9jayAlfVwiXG4gKiB9O1xuICogc3dpZy5zZXREZWZhdWx0cyh7IGxvYWRlcjogc3dpZy5sb2FkZXJzLm1lbW9yeSh0ZW1wbGF0ZXMpIH0pO1xuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBtYXBwaW5nIEhhc2ggb2JqZWN0IHdpdGggdGVtcGxhdGUgcGF0aHMgYXMga2V5cyBhbmQgdGVtcGxhdGUgc291cmNlcyBhcyB2YWx1ZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2Jhc2VwYXRoXSBQYXRoIHRvIHRoZSB0ZW1wbGF0ZXMgYXMgc3RyaW5nLiBBc3NpZ25pbmcgdGhpcyB2YWx1ZSBhbGxvd3MgeW91IHRvIHVzZSBzZW1pLWFic29sdXRlIHBhdGhzIHRvIHRlbXBsYXRlcyBpbnN0ZWFkIG9mIHJlbGF0aXZlIHBhdGhzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtYXBwaW5nLCBiYXNlcGF0aCkge1xuICB2YXIgcmV0ID0ge307XG5cbiAgYmFzZXBhdGggPSAoYmFzZXBhdGgpID8gcGF0aC5ub3JtYWxpemUoYmFzZXBhdGgpIDogbnVsbDtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgPHZhcj50bzwvdmFyPiB0byBhbiBhYnNvbHV0ZSBwYXRoIG9yIHVuaXF1ZSBpZGVudGlmaWVyLiBUaGlzIGlzIHVzZWQgZm9yIGJ1aWxkaW5nIGNvcnJlY3QsIG5vcm1hbGl6ZWQsIGFuZCBhYnNvbHV0ZSBwYXRocyB0byBhIGdpdmVuIHRlbXBsYXRlLlxuICAgKiBAYWxpYXMgcmVzb2x2ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHRvICAgICAgICBOb24tYWJzb2x1dGUgaWRlbnRpZmllciBvciBwYXRobmFtZSB0byBhIGZpbGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gW2Zyb21dICAgIElmIGdpdmVuLCBzaG91bGQgYXR0ZW1wdCB0byBmaW5kIHRoZSA8dmFyPnRvPC92YXI+IHBhdGggaW4gcmVsYXRpb24gdG8gdGhpcyBnaXZlbiwga25vd24gcGF0aC5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmV0LnJlc29sdmUgPSBmdW5jdGlvbiAodG8sIGZyb20pIHtcbiAgICBpZiAoYmFzZXBhdGgpIHtcbiAgICAgIGZyb20gPSBiYXNlcGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJvbSA9IChmcm9tKSA/IHBhdGguZGlybmFtZShmcm9tKSA6ICcvJztcbiAgICB9XG4gICAgcmV0dXJuIHBhdGgucmVzb2x2ZShmcm9tLCB0byk7XG4gIH07XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2luZ2xlIHRlbXBsYXRlLiBHaXZlbiBhIHVuaXF1ZSA8dmFyPmlkZW50aWZpZXI8L3Zhcj4gZm91bmQgYnkgdGhlIDx2YXI+cmVzb2x2ZTwvdmFyPiBtZXRob2QgdGhpcyBzaG91bGQgcmV0dXJuIHRoZSBnaXZlbiB0ZW1wbGF0ZS5cbiAgICogQGFsaWFzIGxvYWRcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgIGlkZW50aWZpZXIgIFVuaXF1ZSBpZGVudGlmaWVyIG9mIGEgdGVtcGxhdGUgKHBvc3NpYmx5IGFuIGFic29sdXRlIHBhdGgpLlxuICAgKiBAcGFyYW0gIHtmdW5jdGlvbn0gW2NiXSAgICAgICAgQXN5bmNocm9ub3VzIGNhbGxiYWNrIGZ1bmN0aW9uLiBJZiBub3QgcHJvdmlkZWQsIHRoaXMgbWV0aG9kIHNob3VsZCBydW4gc3luY2hyb25vdXNseS5cbiAgICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgIFRlbXBsYXRlIHNvdXJjZSBzdHJpbmcuXG4gICAqL1xuICByZXQubG9hZCA9IGZ1bmN0aW9uIChwYXRobmFtZSwgY2IpIHtcbiAgICB2YXIgc3JjLCBwYXRocztcblxuICAgIHBhdGhzID0gW3BhdGhuYW1lLCBwYXRobmFtZS5yZXBsYWNlKC9eKFxcL3xcXFxcKS8sICcnKV07XG5cbiAgICBzcmMgPSBtYXBwaW5nW3BhdGhzWzBdXSB8fCBtYXBwaW5nW3BhdGhzWzFdXTtcbiAgICBpZiAoIXNyYykge1xuICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5hYmxlIHRvIGZpbmQgdGVtcGxhdGUgXCInICsgcGF0aG5hbWUgKyAnXCIuJyk7XG4gICAgfVxuXG4gICAgaWYgKGNiKSB7XG4gICAgICBjYihudWxsLCBzcmMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gc3JjO1xuICB9O1xuXG4gIHJldHVybiByZXQ7XG59O1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxuICBsZXhlciA9IHJlcXVpcmUoJy4vbGV4ZXInKTtcblxudmFyIF90ID0gbGV4ZXIudHlwZXMsXG4gIF9yZXNlcnZlZCA9IFsnYnJlYWsnLCAnY2FzZScsICdjYXRjaCcsICdjb250aW51ZScsICdkZWJ1Z2dlcicsICdkZWZhdWx0JywgJ2RlbGV0ZScsICdkbycsICdlbHNlJywgJ2ZpbmFsbHknLCAnZm9yJywgJ2Z1bmN0aW9uJywgJ2lmJywgJ2luJywgJ2luc3RhbmNlb2YnLCAnbmV3JywgJ3JldHVybicsICdzd2l0Y2gnLCAndGhpcycsICd0aHJvdycsICd0cnknLCAndHlwZW9mJywgJ3ZhcicsICd2b2lkJywgJ3doaWxlJywgJ3dpdGgnXTtcblxuXG4vKipcbiAqIEZpbHRlcnMgYXJlIHNpbXBseSBmdW5jdGlvbnMgdGhhdCBwZXJmb3JtIHRyYW5zZm9ybWF0aW9ucyBvbiB0aGVpciBmaXJzdCBpbnB1dCBhcmd1bWVudC5cbiAqIEZpbHRlcnMgYXJlIHJ1biBhdCByZW5kZXIgdGltZSwgc28gdGhleSBtYXkgbm90IGRpcmVjdGx5IG1vZGlmeSB0aGUgY29tcGlsZWQgdGVtcGxhdGUgc3RydWN0dXJlIGluIGFueSB3YXkuXG4gKiBBbGwgb2YgU3dpZydzIGJ1aWx0LWluIGZpbHRlcnMgYXJlIHdyaXR0ZW4gaW4gdGhpcyBzYW1lIHdheS4gRm9yIG1vcmUgZXhhbXBsZXMsIHJlZmVyZW5jZSB0aGUgYGZpbHRlcnMuanNgIGZpbGUgaW4gU3dpZydzIHNvdXJjZS5cbiAqXG4gKiBUbyBkaXNhYmxlIGF1dG8tZXNjYXBpbmcgb24gYSBjdXN0b20gZmlsdGVyLCBzaW1wbHkgYWRkIGEgcHJvcGVydHkgdG8gdGhlIGZpbHRlciBtZXRob2QgYHNhZmUgPSB0cnVlO2AgYW5kIHRoZSBvdXRwdXQgZnJvbSB0aGlzIHdpbGwgbm90IGJlIGVzY2FwZWQsIG5vIG1hdHRlciB3aGF0IHRoZSBnbG9iYWwgc2V0dGluZ3MgYXJlIGZvciBTd2lnLlxuICpcbiAqIEB0eXBlZGVmIHtmdW5jdGlvbn0gRmlsdGVyXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIFRoaXMgZmlsdGVyIHdpbGwgcmV0dXJuICdiYXpib3AnIGlmIHRoZSBpZHggb24gdGhlIGlucHV0IGlzIG5vdCAnZm9vYmFyJ1xuICogc3dpZy5zZXRGaWx0ZXIoJ2Zvb2JhcicsIGZ1bmN0aW9uIChpbnB1dCwgaWR4KSB7XG4gKiAgIHJldHVybiBpbnB1dFtpZHhdID09PSAnZm9vYmFyJyA/IGlucHV0W2lkeF0gOiAnYmF6Ym9wJztcbiAqIH0pO1xuICogLy8gbXl2YXIgPSBbJ2ZvbycsICdiYXInLCAnYmF6JywgJ2JvcCddO1xuICogLy8gPT4ge3sgbXl2YXJ8Zm9vYmFyKDMpIH19XG4gKiAvLyBTaW5jZSBteXZhclszXSAhPT0gJ2Zvb2JhcicsIHdlIHJlbmRlcjpcbiAqIC8vID0+IGJhemJvcFxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBUaGlzIGZpbHRlciB3aWxsIGRpc2FibGUgYXV0by1lc2NhcGluZyBvbiBpdHMgb3V0cHV0OlxuICogZnVuY3Rpb24gYmF6Ym9wIChpbnB1dCkgeyByZXR1cm4gaW5wdXQ7IH1cbiAqIGJhemJvcC5zYWZlID0gdHJ1ZTtcbiAqIHN3aWcuc2V0RmlsdGVyKCdiYXpib3AnLCBiYXpib3ApO1xuICogLy8gPT4ge3sgXCI8cD5cInxiYXpib3AgfX1cbiAqIC8vID0+IDxwPlxuICpcbiAqIEBwYXJhbSB7Kn0gaW5wdXQgSW5wdXQgYXJndW1lbnQsIGF1dG9tYXRpY2FsbHkgc2VudCBmcm9tIFN3aWcncyBidWlsdC1pbiBwYXJzZXIuXG4gKiBAcGFyYW0gey4uLip9IFthcmdzXSBBbGwgb3RoZXIgYXJndW1lbnRzIGFyZSBkZWZpbmVkIGJ5IHRoZSBGaWx0ZXIgYXV0aG9yLlxuICogQHJldHVybiB7Kn1cbiAqL1xuXG4vKiFcbiAqIE1ha2VzIGEgc3RyaW5nIHNhZmUgZm9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFwtXFwvXFxcXFxcXiQqKz8uKCl8XFxbXFxde31dL2csICdcXFxcJCYnKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBzdHJpbmdzIG9mIHZhcmlhYmxlcyBhbmQgdGFncyBpbnRvIHRva2VucyBmb3IgZnV0dXJlIGNvbXBpbGF0aW9uLlxuICogQGNsYXNzXG4gKiBAcGFyYW0ge2FycmF5fSAgIHRva2VucyAgICAgUHJlLXNwbGl0IHRva2VucyByZWFkIGJ5IHRoZSBMZXhlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSAgZmlsdGVycyAgICBLZXllZCBvYmplY3Qgb2YgZmlsdGVycyB0aGF0IG1heSBiZSBhcHBsaWVkIHRvIHZhcmlhYmxlcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2VzY2FwZSBXaGV0aGVyIG9yIG5vdCB0aGlzIHNob3VsZCBiZSBhdXRvZXNjYXBlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSAgbGluZSAgICAgICBCZWdpbm5pbmcgbGluZSBudW1iZXIgZm9yIHRoZSBmaXJzdCB0b2tlbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgW2ZpbGVuYW1lXSBOYW1lIG9mIHRoZSBmaWxlIGJlaW5nIHBhcnNlZC5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIFRva2VuUGFyc2VyKHRva2VucywgZmlsdGVycywgYXV0b2VzY2FwZSwgbGluZSwgZmlsZW5hbWUpIHtcbiAgdGhpcy5vdXQgPSBbXTtcbiAgdGhpcy5zdGF0ZSA9IFtdO1xuICB0aGlzLmZpbHRlckFwcGx5SWR4ID0gW107XG4gIHRoaXMuX3BhcnNlcnMgPSB7fTtcbiAgdGhpcy5saW5lID0gbGluZTtcbiAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuICB0aGlzLmVzY2FwZSA9IGF1dG9lc2NhcGU7XG5cbiAgdGhpcy5wYXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoc2VsZi5fcGFyc2Vycy5zdGFydCkge1xuICAgICAgc2VsZi5fcGFyc2Vycy5zdGFydC5jYWxsKHNlbGYpO1xuICAgIH1cbiAgICB1dGlscy5lYWNoKHRva2VucywgZnVuY3Rpb24gKHRva2VuLCBpKSB7XG4gICAgICB2YXIgcHJldlRva2VuID0gdG9rZW5zW2kgLSAxXTtcbiAgICAgIHNlbGYuaXNMYXN0ID0gKGkgPT09IHRva2Vucy5sZW5ndGggLSAxKTtcbiAgICAgIGlmIChwcmV2VG9rZW4pIHtcbiAgICAgICAgd2hpbGUgKHByZXZUb2tlbi50eXBlID09PSBfdC5XSElURVNQQUNFKSB7XG4gICAgICAgICAgaSAtPSAxO1xuICAgICAgICAgIHByZXZUb2tlbiA9IHRva2Vuc1tpIC0gMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlbGYucHJldlRva2VuID0gcHJldlRva2VuO1xuICAgICAgc2VsZi5wYXJzZVRva2VuKHRva2VuKTtcbiAgICB9KTtcbiAgICBpZiAoc2VsZi5fcGFyc2Vycy5lbmQpIHtcbiAgICAgIHNlbGYuX3BhcnNlcnMuZW5kLmNhbGwoc2VsZik7XG4gICAgfVxuXG4gICAgaWYgKHNlbGYuZXNjYXBlKSB7XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4ID0gWzBdO1xuICAgICAgaWYgKHR5cGVvZiBzZWxmLmVzY2FwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgc2VsZi5wYXJzZVRva2VuKHsgdHlwZTogX3QuRklMVEVSLCBtYXRjaDogJ2UnIH0pO1xuICAgICAgICBzZWxmLnBhcnNlVG9rZW4oeyB0eXBlOiBfdC5DT01NQSwgbWF0Y2g6ICcsJyB9KTtcbiAgICAgICAgc2VsZi5wYXJzZVRva2VuKHsgdHlwZTogX3QuU1RSSU5HLCBtYXRjaDogU3RyaW5nKGF1dG9lc2NhcGUpIH0pO1xuICAgICAgICBzZWxmLnBhcnNlVG9rZW4oeyB0eXBlOiBfdC5QQVJFTkNMT1NFLCBtYXRjaDogJyknfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnBhcnNlVG9rZW4oeyB0eXBlOiBfdC5GSUxURVJFTVBUWSwgbWF0Y2g6ICdlJyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZi5vdXQ7XG4gIH07XG59XG5cblRva2VuUGFyc2VyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIFNldCBhIGN1c3RvbSBtZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gYSB0b2tlbiB0eXBlIGlzIGZvdW5kLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBwYXJzZXIub24odHlwZXMuU1RSSU5HLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICogICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICogfSk7XG4gICAqIEBleGFtcGxlXG4gICAqIHBhcnNlci5vbignc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAqICAgdGhpcy5vdXQucHVzaCgnc29tZXRoaW5nIGF0IHRoZSBiZWdpbm5pbmcgb2YgeW91ciBhcmdzJylcbiAgICogfSk7XG4gICAqIHBhcnNlci5vbignZW5kJywgZnVuY3Rpb24gKCkge1xuICAgKiAgIHRoaXMub3V0LnB1c2goJ3NvbWV0aGluZyBhdCB0aGUgZW5kIG9mIHlvdXIgYXJncycpO1xuICAgKiB9KTtcbiAgICpcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgIHR5cGUgVG9rZW4gdHlwZSBJRC4gRm91bmQgaW4gdGhlIExleGVyLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICBDYWxsYmFjayBmdW5jdGlvbi4gUmV0dXJuIHRydWUgdG8gY29udGludWUgZXhlY3V0aW5nIHRoZSBkZWZhdWx0IHBhcnNpbmcgZnVuY3Rpb24uXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIG9uOiBmdW5jdGlvbiAodHlwZSwgZm4pIHtcbiAgICB0aGlzLl9wYXJzZXJzW3R5cGVdID0gZm47XG4gIH0sXG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgc2luZ2xlIHRva2VuLlxuICAgKiBAcGFyYW0gIHt7bWF0Y2g6IHN0cmluZywgdHlwZTogbnVtYmVyLCBsaW5lOiBudW1iZXJ9fSB0b2tlbiBMZXhlciB0b2tlbiBvYmplY3QuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHBhcnNlVG9rZW46IGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIGZuID0gc2VsZi5fcGFyc2Vyc1t0b2tlbi50eXBlXSB8fCBzZWxmLl9wYXJzZXJzWycqJ10sXG4gICAgICBtYXRjaCA9IHRva2VuLm1hdGNoLFxuICAgICAgcHJldlRva2VuID0gc2VsZi5wcmV2VG9rZW4sXG4gICAgICBwcmV2VG9rZW5UeXBlID0gcHJldlRva2VuID8gcHJldlRva2VuLnR5cGUgOiBudWxsLFxuICAgICAgbGFzdFN0YXRlID0gKHNlbGYuc3RhdGUubGVuZ3RoKSA/IHNlbGYuc3RhdGVbc2VsZi5zdGF0ZS5sZW5ndGggLSAxXSA6IG51bGwsXG4gICAgICB0ZW1wO1xuXG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKCFmbi5jYWxsKHRoaXMsIHRva2VuKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxhc3RTdGF0ZSAmJiBwcmV2VG9rZW4gJiZcbiAgICAgICAgbGFzdFN0YXRlID09PSBfdC5GSUxURVIgJiZcbiAgICAgICAgcHJldlRva2VuVHlwZSA9PT0gX3QuRklMVEVSICYmXG4gICAgICAgIHRva2VuLnR5cGUgIT09IF90LlBBUkVOQ0xPU0UgJiZcbiAgICAgICAgdG9rZW4udHlwZSAhPT0gX3QuQ09NTUEgJiZcbiAgICAgICAgdG9rZW4udHlwZSAhPT0gX3QuT1BFUkFUT1IgJiZcbiAgICAgICAgdG9rZW4udHlwZSAhPT0gX3QuRklMVEVSICYmXG4gICAgICAgIHRva2VuLnR5cGUgIT09IF90LkZJTFRFUkVNUFRZKSB7XG4gICAgICBzZWxmLm91dC5wdXNoKCcsICcpO1xuICAgIH1cblxuICAgIGlmIChsYXN0U3RhdGUgJiYgbGFzdFN0YXRlID09PSBfdC5NRVRIT0RPUEVOKSB7XG4gICAgICBzZWxmLnN0YXRlLnBvcCgpO1xuICAgICAgaWYgKHRva2VuLnR5cGUgIT09IF90LlBBUkVOQ0xPU0UpIHtcbiAgICAgICAgc2VsZi5vdXQucHVzaCgnLCAnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICBjYXNlIF90LldISVRFU1BBQ0U6XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuU1RSSU5HOlxuICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wdXNoKHNlbGYub3V0Lmxlbmd0aCk7XG4gICAgICBzZWxmLm91dC5wdXNoKG1hdGNoLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90Lk5VTUJFUjpcbiAgICBjYXNlIF90LkJPT0w6XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoKTtcbiAgICAgIHNlbGYub3V0LnB1c2gobWF0Y2gpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkZJTFRFUjpcbiAgICAgIGlmICghc2VsZi5maWx0ZXJzLmhhc093blByb3BlcnR5KG1hdGNoKSB8fCB0eXBlb2Ygc2VsZi5maWx0ZXJzW21hdGNoXSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ0ludmFsaWQgZmlsdGVyIFwiJyArIG1hdGNoICsgJ1wiJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuZXNjYXBlID0gc2VsZi5maWx0ZXJzW21hdGNoXS5zYWZlID8gZmFsc2UgOiBzZWxmLmVzY2FwZTtcbiAgICAgIHNlbGYub3V0LnNwbGljZShzZWxmLmZpbHRlckFwcGx5SWR4W3NlbGYuZmlsdGVyQXBwbHlJZHgubGVuZ3RoIC0gMV0sIDAsICdfZmlsdGVyc1tcIicgKyBtYXRjaCArICdcIl0oJyk7XG4gICAgICBzZWxmLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuRklMVEVSRU1QVFk6XG4gICAgICBpZiAoIXNlbGYuZmlsdGVycy5oYXNPd25Qcm9wZXJ0eShtYXRjaCkgfHwgdHlwZW9mIHNlbGYuZmlsdGVyc1ttYXRjaF0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdJbnZhbGlkIGZpbHRlciBcIicgKyBtYXRjaCArICdcIicsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLmVzY2FwZSA9IHNlbGYuZmlsdGVyc1ttYXRjaF0uc2FmZSA/IGZhbHNlIDogc2VsZi5lc2NhcGU7XG4gICAgICBzZWxmLm91dC5zcGxpY2Uoc2VsZi5maWx0ZXJBcHBseUlkeFtzZWxmLmZpbHRlckFwcGx5SWR4Lmxlbmd0aCAtIDFdLCAwLCAnX2ZpbHRlcnNbXCInICsgbWF0Y2ggKyAnXCJdKCcpO1xuICAgICAgc2VsZi5vdXQucHVzaCgnKScpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkZVTkNUSU9OOlxuICAgIGNhc2UgX3QuRlVOQ1RJT05FTVBUWTpcbiAgICAgIHNlbGYub3V0LnB1c2goJygodHlwZW9mIF9jdHguJyArIG1hdGNoICsgJyAhPT0gXCJ1bmRlZmluZWRcIikgPyBfY3R4LicgKyBtYXRjaCArXG4gICAgICAgICcgOiAoKHR5cGVvZiAnICsgbWF0Y2ggKyAnICE9PSBcInVuZGVmaW5lZFwiKSA/ICcgKyBtYXRjaCArXG4gICAgICAgICcgOiBfZm4pKSgnKTtcbiAgICAgIHNlbGYuZXNjYXBlID0gZmFsc2U7XG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gX3QuRlVOQ1RJT05FTVBUWSkge1xuICAgICAgICBzZWxmLm91dFtzZWxmLm91dC5sZW5ndGggLSAxXSA9IHNlbGYub3V0W3NlbGYub3V0Lmxlbmd0aCAtIDFdICsgJyknO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5zdGF0ZS5wdXNoKHRva2VuLnR5cGUpO1xuICAgICAgfVxuICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wdXNoKHNlbGYub3V0Lmxlbmd0aCAtIDEpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LlBBUkVOT1BFTjpcbiAgICAgIHNlbGYuc3RhdGUucHVzaCh0b2tlbi50eXBlKTtcbiAgICAgIGlmIChzZWxmLmZpbHRlckFwcGx5SWR4Lmxlbmd0aCkge1xuICAgICAgICBzZWxmLm91dC5zcGxpY2Uoc2VsZi5maWx0ZXJBcHBseUlkeFtzZWxmLmZpbHRlckFwcGx5SWR4Lmxlbmd0aCAtIDFdLCAwLCAnKCcpO1xuICAgICAgICBpZiAocHJldlRva2VuICYmIHByZXZUb2tlblR5cGUgPT09IF90LlZBUikge1xuICAgICAgICAgIHRlbXAgPSBwcmV2VG9rZW4ubWF0Y2guc3BsaXQoJy4nKS5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgc2VsZi5vdXQucHVzaCgnIHx8IF9mbikuY2FsbCgnICsgc2VsZi5jaGVja01hdGNoKHRlbXApKTtcbiAgICAgICAgICBzZWxmLnN0YXRlLnB1c2goX3QuTUVUSE9ET1BFTik7XG4gICAgICAgICAgc2VsZi5lc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLm91dC5wdXNoKCcgfHwgX2ZuKSgnKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoIC0gMyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLm91dC5wdXNoKCcoJyk7XG4gICAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucHVzaChzZWxmLm91dC5sZW5ndGggLSAxKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5QQVJFTkNMT1NFOlxuICAgICAgdGVtcCA9IHNlbGYuc3RhdGUucG9wKCk7XG4gICAgICBpZiAodGVtcCAhPT0gX3QuUEFSRU5PUEVOICYmIHRlbXAgIT09IF90LkZVTkNUSU9OICYmIHRlbXAgIT09IF90LkZJTFRFUikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdNaXNtYXRjaGVkIG5lc3Rpbmcgc3RhdGUnLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnKScpO1xuICAgICAgLy8gT25jZSBvZmYgdGhlIHByZXZpb3VzIGVudHJ5XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgaWYgKHRlbXAgIT09IF90LkZJTFRFUikge1xuICAgICAgICAvLyBPbmNlIGZvciB0aGUgb3BlbiBwYXJlblxuICAgICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkNPTU1BOlxuICAgICAgaWYgKGxhc3RTdGF0ZSAhPT0gX3QuRlVOQ1RJT04gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IF90LkZJTFRFUiAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gX3QuQVJSQVlPUEVOICYmXG4gICAgICAgICAgbGFzdFN0YXRlICE9PSBfdC5DVVJMWU9QRU4gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IF90LlBBUkVOT1BFTiAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gX3QuQ09MT04pIHtcbiAgICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCBjb21tYScsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAobGFzdFN0YXRlID09PSBfdC5DT0xPTikge1xuICAgICAgICBzZWxmLnN0YXRlLnBvcCgpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnLCAnKTtcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuTE9HSUM6XG4gICAgY2FzZSBfdC5DT01QQVJBVE9SOlxuICAgICAgaWYgKCFwcmV2VG9rZW4gfHxcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlID09PSBfdC5DT01NQSB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IHRva2VuLnR5cGUgfHxcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlID09PSBfdC5CUkFDS0VUT1BFTiB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IF90LkNVUkxZT1BFTiB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IF90LlBBUkVOT1BFTiB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IF90LkZVTkNUSU9OKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgbG9naWMnLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuTk9UOlxuICAgICAgc2VsZi5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuVkFSOlxuICAgICAgc2VsZi5wYXJzZVZhcih0b2tlbiwgbWF0Y2gsIGxhc3RTdGF0ZSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuQlJBQ0tFVE9QRU46XG4gICAgICBpZiAoIXByZXZUb2tlbiB8fFxuICAgICAgICAgIChwcmV2VG9rZW5UeXBlICE9PSBfdC5WQVIgJiZcbiAgICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LkJSQUNLRVRDTE9TRSAmJlxuICAgICAgICAgICAgcHJldlRva2VuVHlwZSAhPT0gX3QuUEFSRU5DTE9TRSkpIHtcbiAgICAgICAgc2VsZi5zdGF0ZS5wdXNoKF90LkFSUkFZT1BFTik7XG4gICAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucHVzaChzZWxmLm91dC5sZW5ndGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5zdGF0ZS5wdXNoKHRva2VuLnR5cGUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnWycpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkJSQUNLRVRDTE9TRTpcbiAgICAgIHRlbXAgPSBzZWxmLnN0YXRlLnBvcCgpO1xuICAgICAgaWYgKHRlbXAgIT09IF90LkJSQUNLRVRPUEVOICYmIHRlbXAgIT09IF90LkFSUkFZT1BFTikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGNsb3Npbmcgc3F1YXJlIGJyYWNrZXQnLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnXScpO1xuICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wb3AoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5DVVJMWU9QRU46XG4gICAgICBzZWxmLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICBzZWxmLm91dC5wdXNoKCd7Jyk7XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoIC0gMSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuQ09MT046XG4gICAgICBpZiAobGFzdFN0YXRlICE9PSBfdC5DVVJMWU9QRU4pIHtcbiAgICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCBjb2xvbicsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICBzZWxmLm91dC5wdXNoKCc6Jyk7XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkNVUkxZQ0xPU0U6XG4gICAgICBpZiAobGFzdFN0YXRlID09PSBfdC5DT0xPTikge1xuICAgICAgICBzZWxmLnN0YXRlLnBvcCgpO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYuc3RhdGUucG9wKCkgIT09IF90LkNVUkxZT1BFTikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGNsb3NpbmcgY3VybHkgYnJhY2UnLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnfScpO1xuXG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkRPVEtFWTpcbiAgICAgIGlmICghcHJldlRva2VuIHx8IChcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5WQVIgJiZcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5CUkFDS0VUQ0xPU0UgJiZcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5ET1RLRVkgJiZcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5QQVJFTkNMT1NFICYmXG4gICAgICAgICAgcHJldlRva2VuVHlwZSAhPT0gX3QuRlVOQ1RJT05FTVBUWSAmJlxuICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LkZJTFRFUkVNUFRZICYmXG4gICAgICAgICAgcHJldlRva2VuVHlwZSAhPT0gX3QuQ1VSTFlDTE9TRVxuICAgICAgICApKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQga2V5IFwiJyArIG1hdGNoICsgJ1wiJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNlbGYub3V0LnB1c2goJy4nICsgbWF0Y2gpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90Lk9QRVJBVE9SOlxuICAgICAgc2VsZi5vdXQucHVzaCgnICcgKyBtYXRjaCArICcgJyk7XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBQYXJzZSB2YXJpYWJsZSB0b2tlblxuICAgKiBAcGFyYW0gIHt7bWF0Y2g6IHN0cmluZywgdHlwZTogbnVtYmVyLCBsaW5lOiBudW1iZXJ9fSB0b2tlbiAgICAgIExleGVyIHRva2VuIG9iamVjdC5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBtYXRjaCAgICAgICBTaG9ydGN1dCBmb3IgdG9rZW4ubWF0Y2hcbiAgICogQHBhcmFtICB7bnVtYmVyfSBsYXN0U3RhdGUgICBMZXhlciB0b2tlbiB0eXBlIHN0YXRlLlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwYXJzZVZhcjogZnVuY3Rpb24gKHRva2VuLCBtYXRjaCwgbGFzdFN0YXRlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgbWF0Y2ggPSBtYXRjaC5zcGxpdCgnLicpO1xuXG4gICAgaWYgKF9yZXNlcnZlZC5pbmRleE9mKG1hdGNoWzBdKSAhPT0gLTEpIHtcbiAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1Jlc2VydmVkIGtleXdvcmQgXCInICsgbWF0Y2hbMF0gKyAnXCIgYXR0ZW1wdGVkIHRvIGJlIHVzZWQgYXMgYSB2YXJpYWJsZScsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgfVxuXG4gICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wdXNoKHNlbGYub3V0Lmxlbmd0aCk7XG4gICAgaWYgKGxhc3RTdGF0ZSA9PT0gX3QuQ1VSTFlPUEVOKSB7XG4gICAgICBpZiAobWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGRvdCcsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKG1hdGNoWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLm91dC5wdXNoKHNlbGYuY2hlY2tNYXRjaChtYXRjaCkpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm4gY29udGV4dHVhbCBkb3QtY2hlY2sgc3RyaW5nIGZvciBhIG1hdGNoXG4gICAqIEBwYXJhbSAge3N0cmluZ30gbWF0Y2ggICAgICAgU2hvcnRjdXQgZm9yIHRva2VuLm1hdGNoXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjaGVja01hdGNoOiBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICB2YXIgdGVtcCA9IG1hdGNoWzBdLCByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBjaGVja0RvdChjdHgpIHtcbiAgICAgIHZhciBjID0gY3R4ICsgdGVtcCxcbiAgICAgICAgbSA9IG1hdGNoLFxuICAgICAgICBidWlsZCA9ICcnO1xuXG4gICAgICBidWlsZCA9ICcodHlwZW9mICcgKyBjICsgJyAhPT0gXCJ1bmRlZmluZWRcIiAmJiAnICsgYyArICcgIT09IG51bGwnO1xuICAgICAgdXRpbHMuZWFjaChtLCBmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBidWlsZCArPSAnICYmICcgKyBjICsgJy4nICsgdiArICcgIT09IHVuZGVmaW5lZCAmJiAnICsgYyArICcuJyArIHYgKyAnICE9PSBudWxsJztcbiAgICAgICAgYyArPSAnLicgKyB2O1xuICAgICAgfSk7XG4gICAgICBidWlsZCArPSAnKSc7XG5cbiAgICAgIHJldHVybiBidWlsZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZERvdChjdHgpIHtcbiAgICAgIHJldHVybiAnKCcgKyBjaGVja0RvdChjdHgpICsgJyA/ICcgKyBjdHggKyBtYXRjaC5qb2luKCcuJykgKyAnIDogXCJcIiknO1xuICAgIH1cbiAgICByZXN1bHQgPSAnKCcgKyBjaGVja0RvdCgnX2N0eC4nKSArICcgPyAnICsgYnVpbGREb3QoJ19jdHguJykgKyAnIDogJyArIGJ1aWxkRG90KCcnKSArICcpJztcbiAgICByZXR1cm4gJygnICsgcmVzdWx0ICsgJyAhPT0gbnVsbCA/ICcgKyByZXN1bHQgKyAnIDogJyArICdcIlwiICknO1xuICB9XG59O1xuXG4vKipcbiAqIFBhcnNlIGEgc291cmNlIHN0cmluZyBpbnRvIHRva2VucyB0aGF0IGFyZSByZWFkeSBmb3IgY29tcGlsYXRpb24uXG4gKlxuICogQGV4YW1wbGVcbiAqIGV4cG9ydHMucGFyc2UoJ3t7IHRhY29zIH19Jywge30sIHRhZ3MsIGZpbHRlcnMpO1xuICogLy8gPT4gW3sgY29tcGlsZTogW0Z1bmN0aW9uXSwgLi4uIH1dXG4gKlxuICogQHBhcmFtcyB7b2JqZWN0fSBzd2lnICAgIFRoZSBjdXJyZW50IFN3aWcgaW5zdGFuY2VcbiAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlICBTd2lnIHRlbXBsYXRlIHNvdXJjZS5cbiAqIEBwYXJhbSAge29iamVjdH0gb3B0cyAgICBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtICB7b2JqZWN0fSB0YWdzICAgIEtleWVkIG9iamVjdCBvZiB0YWdzIHRoYXQgY2FuIGJlIHBhcnNlZCBhbmQgY29tcGlsZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGZpbHRlcnMgS2V5ZWQgb2JqZWN0IG9mIGZpbHRlcnMgdGhhdCBtYXkgYmUgYXBwbGllZCB0byB2YXJpYWJsZXMuXG4gKiBAcmV0dXJuIHthcnJheX0gICAgICAgICAgTGlzdCBvZiB0b2tlbnMgcmVhZHkgZm9yIGNvbXBpbGF0aW9uLlxuICovXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN3aWcsIHNvdXJjZSwgb3B0cywgdGFncywgZmlsdGVycykge1xuICBzb3VyY2UgPSBzb3VyY2UucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKTtcbiAgdmFyIGVzY2FwZSA9IG9wdHMuYXV0b2VzY2FwZSxcbiAgICB0YWdPcGVuID0gb3B0cy50YWdDb250cm9sc1swXSxcbiAgICB0YWdDbG9zZSA9IG9wdHMudGFnQ29udHJvbHNbMV0sXG4gICAgdmFyT3BlbiA9IG9wdHMudmFyQ29udHJvbHNbMF0sXG4gICAgdmFyQ2xvc2UgPSBvcHRzLnZhckNvbnRyb2xzWzFdLFxuICAgIGVzY2FwZWRUYWdPcGVuID0gZXNjYXBlUmVnRXhwKHRhZ09wZW4pLFxuICAgIGVzY2FwZWRUYWdDbG9zZSA9IGVzY2FwZVJlZ0V4cCh0YWdDbG9zZSksXG4gICAgZXNjYXBlZFZhck9wZW4gPSBlc2NhcGVSZWdFeHAodmFyT3BlbiksXG4gICAgZXNjYXBlZFZhckNsb3NlID0gZXNjYXBlUmVnRXhwKHZhckNsb3NlKSxcbiAgICB0YWdTdHJpcCA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlZFRhZ09wZW4gKyAnLT9cXFxccyotP3wtP1xcXFxzKi0/JyArIGVzY2FwZWRUYWdDbG9zZSArICckJywgJ2cnKSxcbiAgICB0YWdTdHJpcEJlZm9yZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlZFRhZ09wZW4gKyAnLScpLFxuICAgIHRhZ1N0cmlwQWZ0ZXIgPSBuZXcgUmVnRXhwKCctJyArIGVzY2FwZWRUYWdDbG9zZSArICckJyksXG4gICAgdmFyU3RyaXAgPSBuZXcgUmVnRXhwKCdeJyArIGVzY2FwZWRWYXJPcGVuICsgJy0/XFxcXHMqLT98LT9cXFxccyotPycgKyBlc2NhcGVkVmFyQ2xvc2UgKyAnJCcsICdnJyksXG4gICAgdmFyU3RyaXBCZWZvcmUgPSBuZXcgUmVnRXhwKCdeJyArIGVzY2FwZWRWYXJPcGVuICsgJy0nKSxcbiAgICB2YXJTdHJpcEFmdGVyID0gbmV3IFJlZ0V4cCgnLScgKyBlc2NhcGVkVmFyQ2xvc2UgKyAnJCcpLFxuICAgIGNtdE9wZW4gPSBvcHRzLmNtdENvbnRyb2xzWzBdLFxuICAgIGNtdENsb3NlID0gb3B0cy5jbXRDb250cm9sc1sxXSxcbiAgICBhbnlDaGFyID0gJ1tcXFxcc1xcXFxTXSo/JyxcbiAgICAvLyBTcGxpdCB0aGUgdGVtcGxhdGUgc291cmNlIGJhc2VkIG9uIHZhcmlhYmxlLCB0YWcsIGFuZCBjb21tZW50IGJsb2Nrc1xuICAgIC8vIC8oXFx7JVtcXHNcXFNdKj8lXFx9fFxce1xce1tcXHNcXFNdKj9cXH1cXH18XFx7I1tcXHNcXFNdKj8jXFx9KS9cbiAgICBzcGxpdHRlciA9IG5ldyBSZWdFeHAoXG4gICAgICAnKCcgK1xuICAgICAgICBlc2NhcGVkVGFnT3BlbiArIGFueUNoYXIgKyBlc2NhcGVkVGFnQ2xvc2UgKyAnfCcgK1xuICAgICAgICBlc2NhcGVkVmFyT3BlbiArIGFueUNoYXIgKyBlc2NhcGVkVmFyQ2xvc2UgKyAnfCcgK1xuICAgICAgICBlc2NhcGVSZWdFeHAoY210T3BlbikgKyBhbnlDaGFyICsgZXNjYXBlUmVnRXhwKGNtdENsb3NlKSArXG4gICAgICAgICcpJ1xuICAgICksXG4gICAgbGluZSA9IDEsXG4gICAgc3RhY2sgPSBbXSxcbiAgICBwYXJlbnQgPSBudWxsLFxuICAgIHRva2VucyA9IFtdLFxuICAgIGJsb2NrcyA9IHt9LFxuICAgIGluUmF3ID0gZmFsc2UsXG4gICAgc3RyaXBOZXh0O1xuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHN0ciAgU3RyaW5nIGNvbnRlbnRzIG9mIHRoZSB2YXJpYWJsZSwgYmV0d2VlbiA8aT57ezwvaT4gYW5kIDxpPn19PC9pPlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGxpbmUgVGhlIGxpbmUgbnVtYmVyIHRoYXQgdGhpcyB2YXJpYWJsZSBzdGFydHMgb24uXG4gICAqIEByZXR1cm4ge1ZhclRva2VufSAgICAgIFBhcnNlZCB2YXJpYWJsZSB0b2tlbiBvYmplY3QuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZVZhcmlhYmxlKHN0ciwgbGluZSkge1xuICAgIHZhciB0b2tlbnMgPSBsZXhlci5yZWFkKHV0aWxzLnN0cmlwKHN0cikpLFxuICAgICAgcGFyc2VyLFxuICAgICAgb3V0O1xuXG4gICAgcGFyc2VyID0gbmV3IFRva2VuUGFyc2VyKHRva2VucywgZmlsdGVycywgZXNjYXBlLCBsaW5lLCBvcHRzLmZpbGVuYW1lKTtcbiAgICBvdXQgPSBwYXJzZXIucGFyc2UoKS5qb2luKCcnKTtcblxuICAgIGlmIChwYXJzZXIuc3RhdGUubGVuZ3RoKSB7XG4gICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmFibGUgdG8gcGFyc2UgXCInICsgc3RyICsgJ1wiJywgbGluZSwgb3B0cy5maWxlbmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBwYXJzZWQgdmFyaWFibGUgdG9rZW4uXG4gICAgICogQHR5cGVkZWYge29iamVjdH0gVmFyVG9rZW5cbiAgICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBjb21waWxlIE1ldGhvZCBmb3IgY29tcGlsaW5nIHRoaXMgdG9rZW4uXG4gICAgICovXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICdfb3V0cHV0ICs9ICcgKyBvdXQgKyAnO1xcbic7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBleHBvcnRzLnBhcnNlVmFyaWFibGUgPSBwYXJzZVZhcmlhYmxlO1xuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHRhZy5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBzdHIgIFN0cmluZyBjb250ZW50cyBvZiB0aGUgdGFnLCBiZXR3ZWVuIDxpPnslPC9pPiBhbmQgPGk+JX08L2k+XG4gICAqIEBwYXJhbSAge251bWJlcn0gbGluZSBUaGUgbGluZSBudW1iZXIgdGhhdCB0aGlzIHRhZyBzdGFydHMgb24uXG4gICAqIEByZXR1cm4ge1RhZ1Rva2VufSAgICAgIFBhcnNlZCB0b2tlbiBvYmplY3QuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZVRhZyhzdHIsIGxpbmUpIHtcbiAgICB2YXIgdG9rZW5zLCBwYXJzZXIsIGNodW5rcywgdGFnTmFtZSwgdGFnLCBhcmdzLCBsYXN0O1xuXG4gICAgaWYgKHV0aWxzLnN0YXJ0c1dpdGgoc3RyLCAnZW5kJykpIHtcbiAgICAgIGxhc3QgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgIGlmIChsYXN0ICYmIGxhc3QubmFtZSA9PT0gc3RyLnNwbGl0KC9cXHMrLylbMF0ucmVwbGFjZSgvXmVuZC8sICcnKSAmJiBsYXN0LmVuZHMpIHtcbiAgICAgICAgc3dpdGNoIChsYXN0Lm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYXV0b2VzY2FwZSc6XG4gICAgICAgICAgZXNjYXBlID0gb3B0cy5hdXRvZXNjYXBlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyYXcnOlxuICAgICAgICAgIGluUmF3ID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpblJhdykge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGVuZCBvZiB0YWcgXCInICsgc3RyLnJlcGxhY2UoL15lbmQvLCAnJykgKyAnXCInLCBsaW5lLCBvcHRzLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5SYXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaHVua3MgPSBzdHIuc3BsaXQoL1xccysoLispPy8pO1xuICAgIHRhZ05hbWUgPSBjaHVua3Muc2hpZnQoKTtcblxuICAgIGlmICghdGFncy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCB0YWcgXCInICsgc3RyICsgJ1wiJywgbGluZSwgb3B0cy5maWxlbmFtZSk7XG4gICAgfVxuXG4gICAgdG9rZW5zID0gbGV4ZXIucmVhZCh1dGlscy5zdHJpcChjaHVua3Muam9pbignICcpKSk7XG4gICAgcGFyc2VyID0gbmV3IFRva2VuUGFyc2VyKHRva2VucywgZmlsdGVycywgZmFsc2UsIGxpbmUsIG9wdHMuZmlsZW5hbWUpO1xuICAgIHRhZyA9IHRhZ3NbdGFnTmFtZV07XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgY3VzdG9tIHBhcnNpbmcgbWV0aG9kcyBmb3IgeW91ciB0YWcuXG4gICAgICogQGNhbGxiYWNrIHBhcnNlXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBvcHRpb25zLCBzd2lnKSB7XG4gICAgICogICBwYXJzZXIub24oJ3N0YXJ0JywgZnVuY3Rpb24gKCkge1xuICAgICAqICAgICAvLyAuLi5cbiAgICAgKiAgIH0pO1xuICAgICAqICAgcGFyc2VyLm9uKHR5cGVzLlNUUklORywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICogICAgIC8vIC4uLlxuICAgICAqICAgfSk7XG4gICAgICogfTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgVGhlIGZ1bGwgdG9rZW4gc3RyaW5nIG9mIHRoZSB0YWcuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxpbmUgVGhlIGxpbmUgbnVtYmVyIHRoYXQgdGhpcyB0YWcgYXBwZWFycyBvbi5cbiAgICAgKiBAcGFyYW0ge1Rva2VuUGFyc2VyfSBwYXJzZXIgQSBUb2tlblBhcnNlciBpbnN0YW5jZS5cbiAgICAgKiBAcGFyYW0ge1RZUEVTfSB0eXBlcyBMZXhlciB0b2tlbiB0eXBlIGVudW0uXG4gICAgICogQHBhcmFtIHtUYWdUb2tlbltdfSBzdGFjayBUaGUgY3VycmVudCBzdGFjayBvZiBvcGVuIHRhZ3MuXG4gICAgICogQHBhcmFtIHtTd2lnT3B0c30gb3B0aW9ucyBTd2lnIE9wdGlvbnMgT2JqZWN0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzd2lnIFRoZSBTd2lnIGluc3RhbmNlIChnaXZlcyBhY2NlcyB0byBsb2FkZXJzLCBwYXJzZXJzLCBldGMpXG4gICAgICovXG4gICAgaWYgKCF0YWcucGFyc2UoY2h1bmtzWzFdLCBsaW5lLCBwYXJzZXIsIF90LCBzdGFjaywgb3B0cywgc3dpZykpIHtcbiAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgdGFnIFwiJyArIHRhZ05hbWUgKyAnXCInLCBsaW5lLCBvcHRzLmZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICBwYXJzZXIucGFyc2UoKTtcbiAgICBhcmdzID0gcGFyc2VyLm91dDtcblxuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgIGNhc2UgJ2F1dG9lc2NhcGUnOlxuICAgICAgZXNjYXBlID0gKGFyZ3NbMF0gIT09ICdmYWxzZScpID8gYXJnc1swXSA6IGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIGluUmF3ID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgcGFyc2VkIHRhZyB0b2tlbi5cbiAgICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBUYWdUb2tlblxuICAgICAqIEBwcm9wZXJ0eSB7Y29tcGlsZX0gW2NvbXBpbGVdIE1ldGhvZCBmb3IgY29tcGlsaW5nIHRoaXMgdG9rZW4uXG4gICAgICogQHByb3BlcnR5IHthcnJheX0gW2FyZ3NdIEFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdGhlIHRhZy5cbiAgICAgKiBAcHJvcGVydHkge1Rva2VuW119IFtjb250ZW50PVtdXSBBbiBhcnJheSBvZiB0b2tlbnMgdGhhdCBhcmUgY2hpbGRyZW4gb2YgdGhpcyBUb2tlbi5cbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtlbmRzXSBXaGV0aGVyIG9yIG5vdCB0aGlzIHRhZyByZXF1aXJlcyBhbiBlbmQgdGFnLlxuICAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoaXMgdGFnLlxuICAgICAqL1xuICAgIHJldHVybiB7XG4gICAgICBibG9jazogISF0YWdzW3RhZ05hbWVdLmJsb2NrLFxuICAgICAgY29tcGlsZTogdGFnLmNvbXBpbGUsXG4gICAgICBhcmdzOiBhcmdzLFxuICAgICAgY29udGVudDogW10sXG4gICAgICBlbmRzOiB0YWcuZW5kcyxcbiAgICAgIG5hbWU6IHRhZ05hbWVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0cmlwIHRoZSB3aGl0ZXNwYWNlIGZyb20gdGhlIHByZXZpb3VzIHRva2VuLCBpZiBpdCBpcyBhIHN0cmluZy5cbiAgICogQHBhcmFtICB7b2JqZWN0fSB0b2tlbiBQYXJzZWQgdG9rZW4uXG4gICAqIEByZXR1cm4ge29iamVjdH0gICAgICAgSWYgdGhlIHRva2VuIHdhcyBhIHN0cmluZywgdHJhaWxpbmcgd2hpdGVzcGFjZSB3aWxsIGJlIHN0cmlwcGVkLlxuICAgKi9cbiAgZnVuY3Rpb24gc3RyaXBQcmV2VG9rZW4odG9rZW4pIHtcbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgdG9rZW4gPSB0b2tlbi5yZXBsYWNlKC9cXHMqJC8sICcnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgLyohXG4gICAqIExvb3Agb3ZlciB0aGUgc291cmNlLCBzcGxpdCB2aWEgdGhlIHRhZy92YXIvY29tbWVudCByZWd1bGFyIGV4cHJlc3Npb24gc3BsaXR0ZXIuXG4gICAqIFNlbmQgZWFjaCBjaHVuayB0byB0aGUgYXBwcm9wcmlhdGUgcGFyc2VyLlxuICAgKi9cbiAgdXRpbHMuZWFjaChzb3VyY2Uuc3BsaXQoc3BsaXR0ZXIpLCBmdW5jdGlvbiAoY2h1bmspIHtcbiAgICB2YXIgdG9rZW4sIGxpbmVzLCBzdHJpcFByZXYsIHByZXZUb2tlbiwgcHJldkNoaWxkVG9rZW47XG5cbiAgICBpZiAoIWNodW5rKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSXMgYSB2YXJpYWJsZT9cbiAgICBpZiAoIWluUmF3ICYmIHV0aWxzLnN0YXJ0c1dpdGgoY2h1bmssIHZhck9wZW4pICYmIHV0aWxzLmVuZHNXaXRoKGNodW5rLCB2YXJDbG9zZSkpIHtcbiAgICAgIHN0cmlwUHJldiA9IHZhclN0cmlwQmVmb3JlLnRlc3QoY2h1bmspO1xuICAgICAgc3RyaXBOZXh0ID0gdmFyU3RyaXBBZnRlci50ZXN0KGNodW5rKTtcbiAgICAgIHRva2VuID0gcGFyc2VWYXJpYWJsZShjaHVuay5yZXBsYWNlKHZhclN0cmlwLCAnJyksIGxpbmUpO1xuICAgIC8vIElzIGEgdGFnP1xuICAgIH0gZWxzZSBpZiAodXRpbHMuc3RhcnRzV2l0aChjaHVuaywgdGFnT3BlbikgJiYgdXRpbHMuZW5kc1dpdGgoY2h1bmssIHRhZ0Nsb3NlKSkge1xuICAgICAgc3RyaXBQcmV2ID0gdGFnU3RyaXBCZWZvcmUudGVzdChjaHVuayk7XG4gICAgICBzdHJpcE5leHQgPSB0YWdTdHJpcEFmdGVyLnRlc3QoY2h1bmspO1xuICAgICAgdG9rZW4gPSBwYXJzZVRhZyhjaHVuay5yZXBsYWNlKHRhZ1N0cmlwLCAnJyksIGxpbmUpO1xuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlbi5uYW1lID09PSAnZXh0ZW5kcycpIHtcbiAgICAgICAgICBwYXJlbnQgPSB0b2tlbi5hcmdzLmpvaW4oJycpLnJlcGxhY2UoL15cXCd8XFwnJC9nLCAnJykucmVwbGFjZSgvXlxcXCJ8XFxcIiQvZywgJycpO1xuICAgICAgICB9IGVsc2UgaWYgKHRva2VuLmJsb2NrICYmICFzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICBibG9ja3NbdG9rZW4uYXJncy5qb2luKCcnKV0gPSB0b2tlbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGluUmF3ICYmICF0b2tlbikge1xuICAgICAgICB0b2tlbiA9IGNodW5rO1xuICAgICAgfVxuICAgIC8vIElzIGEgY29udGVudCBzdHJpbmc/XG4gICAgfSBlbHNlIGlmIChpblJhdyB8fCAoIXV0aWxzLnN0YXJ0c1dpdGgoY2h1bmssIGNtdE9wZW4pICYmICF1dGlscy5lbmRzV2l0aChjaHVuaywgY210Q2xvc2UpKSkge1xuICAgICAgdG9rZW4gPSAoc3RyaXBOZXh0KSA/IGNodW5rLnJlcGxhY2UoL15cXHMqLywgJycpIDogY2h1bms7XG4gICAgICBzdHJpcE5leHQgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHV0aWxzLnN0YXJ0c1dpdGgoY2h1bmssIGNtdE9wZW4pICYmIHV0aWxzLmVuZHNXaXRoKGNodW5rLCBjbXRDbG9zZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEaWQgdGhpcyB0YWcgYXNrIHRvIHN0cmlwIHByZXZpb3VzIHdoaXRlc3BhY2U/IDxjb2RlPnslLSAuLi4gJX08L2NvZGU+IG9yIDxjb2RlPnt7LSAuLi4gfX08L2NvZGU+XG4gICAgaWYgKHN0cmlwUHJldiAmJiB0b2tlbnMubGVuZ3RoKSB7XG4gICAgICBwcmV2VG9rZW4gPSB0b2tlbnMucG9wKCk7XG4gICAgICBpZiAodHlwZW9mIHByZXZUb2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcHJldlRva2VuID0gc3RyaXBQcmV2VG9rZW4ocHJldlRva2VuKTtcbiAgICAgIH0gZWxzZSBpZiAocHJldlRva2VuLmNvbnRlbnQgJiYgcHJldlRva2VuLmNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgIHByZXZDaGlsZFRva2VuID0gc3RyaXBQcmV2VG9rZW4ocHJldlRva2VuLmNvbnRlbnQucG9wKCkpO1xuICAgICAgICBwcmV2VG9rZW4uY29udGVudC5wdXNoKHByZXZDaGlsZFRva2VuKTtcbiAgICAgIH1cbiAgICAgIHRva2Vucy5wdXNoKHByZXZUb2tlbik7XG4gICAgfVxuXG4gICAgLy8gVGhpcyB3YXMgYSBjb21tZW50LCBzbyBsZXQncyBqdXN0IGtlZXAgZ29pbmcuXG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYW4gb3BlbiBpdGVtIGluIHRoZSBzdGFjaywgYWRkIHRoaXMgdG8gaXRzIGNvbnRlbnQuXG4gICAgaWYgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uY29udGVudC5wdXNoKHRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSB0b2tlbiBpcyBhIHRhZyB0aGF0IHJlcXVpcmVzIGFuIGVuZCB0YWcsIG9wZW4gaXQgb24gdGhlIHN0YWNrLlxuICAgIGlmICh0b2tlbi5uYW1lICYmIHRva2VuLmVuZHMpIHtcbiAgICAgIHN0YWNrLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIGxpbmVzID0gY2h1bmsubWF0Y2goL1xcbi9nKTtcbiAgICBsaW5lICs9IChsaW5lcykgPyBsaW5lcy5sZW5ndGggOiAwO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IG9wdHMuZmlsZW5hbWUsXG4gICAgcGFyZW50OiBwYXJlbnQsXG4gICAgdG9rZW5zOiB0b2tlbnMsXG4gICAgYmxvY2tzOiBibG9ja3NcbiAgfTtcbn07XG5cblxuLyoqXG4gKiBDb21waWxlIGFuIGFycmF5IG9mIHRva2Vucy5cbiAqIEBwYXJhbSAge1Rva2VuW119IHRlbXBsYXRlICAgICBBbiBhcnJheSBvZiB0ZW1wbGF0ZSB0b2tlbnMuXG4gKiBAcGFyYW0gIHtUZW1wbGF0ZXNbXX0gcGFyZW50cyAgQXJyYXkgb2YgcGFyZW50IHRlbXBsYXRlcy5cbiAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9uc10gICBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBbYmxvY2tOYW1lXSAgIE5hbWUgb2YgdGhlIGN1cnJlbnQgYmxvY2sgY29udGV4dC5cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICBQYXJ0aWFsIGZvciBhIGNvbXBpbGVkIEphdmFTY3JpcHQgbWV0aG9kIHRoYXQgd2lsbCBvdXRwdXQgYSByZW5kZXJlZCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgdmFyIG91dCA9ICcnLFxuICAgIHRva2VucyA9IHV0aWxzLmlzQXJyYXkodGVtcGxhdGUpID8gdGVtcGxhdGUgOiB0ZW1wbGF0ZS50b2tlbnM7XG5cbiAgdXRpbHMuZWFjaCh0b2tlbnMsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHZhciBvO1xuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICBvdXQgKz0gJ19vdXRwdXQgKz0gXCInICsgdG9rZW4ucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKS5yZXBsYWNlKC9cXG58XFxyL2csICdcXFxcbicpLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKSArICdcIjtcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBpbGUgY2FsbGJhY2sgZm9yIFZhclRva2VuIGFuZCBUYWdUb2tlbiBvYmplY3RzLlxuICAgICAqIEBjYWxsYmFjayBjb21waWxlXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gICAgICogICBpZiAoYXJnc1swXSA9PT0gJ2ZvbycpIHtcbiAgICAgKiAgICAgcmV0dXJuIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkgKyAnXFxuJztcbiAgICAgKiAgIH1cbiAgICAgKiAgIHJldHVybiAnX291dHB1dCArPSBcImZhbGxiYWNrXCI7XFxuJztcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogQHBhcmFtIHtwYXJzZXJDb21waWxlcn0gY29tcGlsZXJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBbYXJnc10gQXJyYXkgb2YgcGFyc2VkIGFyZ3VtZW50cyBvbiB0aGUgZm9yIHRoZSB0b2tlbi5cbiAgICAgKiBAcGFyYW0ge2FycmF5fSBbY29udGVudF0gQXJyYXkgb2YgY29udGVudCB3aXRoaW4gdGhlIHRva2VuLlxuICAgICAqIEBwYXJhbSB7YXJyYXl9IFtwYXJlbnRzXSBBcnJheSBvZiBwYXJlbnQgdGVtcGxhdGVzIGZvciB0aGUgY3VycmVudCB0ZW1wbGF0ZSBjb250ZXh0LlxuICAgICAqIEBwYXJhbSB7U3dpZ09wdHN9IFtvcHRpb25zXSBTd2lnIE9wdGlvbnMgT2JqZWN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtibG9ja05hbWVdIE5hbWUgb2YgdGhlIGRpcmVjdCBibG9jayBwYXJlbnQsIGlmIGFueS5cbiAgICAgKi9cbiAgICBvID0gdG9rZW4uY29tcGlsZShleHBvcnRzLmNvbXBpbGUsIHRva2VuLmFyZ3MgPyB0b2tlbi5hcmdzLnNsaWNlKDApIDogW10sIHRva2VuLmNvbnRlbnQgPyB0b2tlbi5jb250ZW50LnNsaWNlKDApIDogW10sIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSk7XG4gICAgb3V0ICs9IG8gfHwgJyc7XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxuICBfdGFncyA9IHJlcXVpcmUoJy4vdGFncycpLFxuICBfZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpLFxuICBwYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpLFxuICBkYXRlZm9ybWF0dGVyID0gcmVxdWlyZSgnLi9kYXRlZm9ybWF0dGVyJyksXG4gIGxvYWRlcnMgPSByZXF1aXJlKCcuL2xvYWRlcnMnKTtcblxuLyoqXG4gKiBTd2lnIHZlcnNpb24gbnVtYmVyIGFzIGEgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqIGlmIChzd2lnLnZlcnNpb24gPT09IFwiMS40LjJcIikgeyAuLi4gfVxuICpcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMudmVyc2lvbiA9IFwiMS40LjJcIjtcblxuLyoqXG4gKiBTd2lnIE9wdGlvbnMgT2JqZWN0LiBUaGlzIG9iamVjdCBjYW4gYmUgcGFzc2VkIHRvIG1hbnkgb2YgdGhlIEFQSS1sZXZlbCBTd2lnIG1ldGhvZHMgdG8gY29udHJvbCB2YXJpb3VzIGFzcGVjdHMgb2YgdGhlIGVuZ2luZS4gQWxsIGtleXMgYXJlIG9wdGlvbmFsLlxuICogQHR5cGVkZWYge09iamVjdH0gU3dpZ09wdHNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYXV0b2VzY2FwZSAgQ29udHJvbHMgd2hldGhlciBvciBub3QgdmFyaWFibGUgb3V0cHV0IHdpbGwgYXV0b21hdGljYWxseSBiZSBlc2NhcGVkIGZvciBzYWZlIEhUTUwgb3V0cHV0LiBEZWZhdWx0cyB0byA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj50cnVlPC9jb2RlPi4gRnVuY3Rpb25zIGV4ZWN1dGVkIGluIHZhcmlhYmxlIHN0YXRlbWVudHMgd2lsbCBub3QgYmUgYXV0by1lc2NhcGVkLiBZb3VyIGFwcGxpY2F0aW9uL2Z1bmN0aW9ucyBzaG91bGQgdGFrZSBjYXJlIG9mIHRoZWlyIG93biBhdXRvLWVzY2FwaW5nLlxuICogQHByb3BlcnR5IHthcnJheX0gICB2YXJDb250cm9scyBPcGVuIGFuZCBjbG9zZSBjb250cm9scyBmb3IgdmFyaWFibGVzLiBEZWZhdWx0cyB0byA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5bJ3t7JywgJ319J108L2NvZGU+LlxuICogQHByb3BlcnR5IHthcnJheX0gICB0YWdDb250cm9scyBPcGVuIGFuZCBjbG9zZSBjb250cm9scyBmb3IgdGFncy4gRGVmYXVsdHMgdG8gPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+Wyd7JScsICclfSddPC9jb2RlPi5cbiAqIEBwcm9wZXJ0eSB7YXJyYXl9ICAgY210Q29udHJvbHMgT3BlbiBhbmQgY2xvc2UgY29udHJvbHMgZm9yIGNvbW1lbnRzLiBEZWZhdWx0cyB0byA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5bJ3sjJywgJyN9J108L2NvZGU+LlxuICogQHByb3BlcnR5IHtvYmplY3R9ICBsb2NhbHMgICAgICBEZWZhdWx0IHZhcmlhYmxlIGNvbnRleHQgdG8gYmUgcGFzc2VkIHRvIDxzdHJvbmc+YWxsPC9zdHJvbmc+IHRlbXBsYXRlcy5cbiAqIEBwcm9wZXJ0eSB7Q2FjaGVPcHRpb25zfSBjYWNoZSBDYWNoZSBjb250cm9sIGZvciB0ZW1wbGF0ZXMuIERlZmF1bHRzIHRvIHNhdmluZyBpbiA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj4nbWVtb3J5JzwvY29kZT4uIFNlbmQgPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+ZmFsc2U8L2NvZGU+IHRvIGRpc2FibGUuIFNlbmQgYW4gb2JqZWN0IHdpdGggPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+Z2V0PC9jb2RlPiBhbmQgPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+c2V0PC9jb2RlPiBmdW5jdGlvbnMgdG8gY3VzdG9taXplLlxuICogQHByb3BlcnR5IHtUZW1wbGF0ZUxvYWRlcn0gbG9hZGVyIFRoZSBtZXRob2QgdGhhdCBTd2lnIHdpbGwgdXNlIHRvIGxvYWQgdGVtcGxhdGVzLiBEZWZhdWx0cyB0byA8dmFyPnN3aWcubG9hZGVycy5mczwvdmFyPi5cbiAqL1xudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIGF1dG9lc2NhcGU6IHRydWUsXG4gICAgdmFyQ29udHJvbHM6IFsne3snLCAnfX0nXSxcbiAgICB0YWdDb250cm9sczogWyd7JScsICclfSddLFxuICAgIGNtdENvbnRyb2xzOiBbJ3sjJywgJyN9J10sXG4gICAgbG9jYWxzOiB7fSxcbiAgICAvKipcbiAgICAgKiBDYWNoZSBjb250cm9sIGZvciB0ZW1wbGF0ZXMuIERlZmF1bHRzIHRvIHNhdmluZyBhbGwgdGVtcGxhdGVzIGludG8gbWVtb3J5LlxuICAgICAqIEB0eXBlZGVmIHtib29sZWFufHN0cmluZ3xvYmplY3R9IENhY2hlT3B0aW9uc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gRGVmYXVsdFxuICAgICAqIHN3aWcuc2V0RGVmYXVsdHMoeyBjYWNoZTogJ21lbW9yeScgfSk7XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBEaXNhYmxlcyBjYWNoaW5nIGluIFN3aWcuXG4gICAgICogc3dpZy5zZXREZWZhdWx0cyh7IGNhY2hlOiBmYWxzZSB9KTtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIEN1c3RvbSBjYWNoZSBzdG9yYWdlIGFuZCByZXRyaWV2YWxcbiAgICAgKiBzd2lnLnNldERlZmF1bHRzKHtcbiAgICAgKiAgIGNhY2hlOiB7XG4gICAgICogICAgIGdldDogZnVuY3Rpb24gKGtleSkgeyAuLi4gfSxcbiAgICAgKiAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWwpIHsgLi4uIH1cbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBjYWNoZTogJ21lbW9yeScsXG4gICAgLyoqXG4gICAgICogQ29uZmlndXJlIFN3aWcgdG8gdXNlIGVpdGhlciB0aGUgPHZhcj5zd2lnLmxvYWRlcnMuZnM8L3Zhcj4gb3IgPHZhcj5zd2lnLmxvYWRlcnMubWVtb3J5PC92YXI+IHRlbXBsYXRlIGxvYWRlci4gT3IsIHlvdSBjYW4gd3JpdGUgeW91ciBvd24hXG4gICAgICogRm9yIG1vcmUgaW5mb3JtYXRpb24sIHBsZWFzZSBzZWUgdGhlIDxhIGhyZWY9XCIuLi9sb2FkZXJzL1wiPlRlbXBsYXRlIExvYWRlcnMgZG9jdW1lbnRhdGlvbjwvYT4uXG4gICAgICogQHR5cGVkZWYge2NsYXNzfSBUZW1wbGF0ZUxvYWRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gRGVmYXVsdCwgRmlsZVN5c3RlbSBsb2FkZXJcbiAgICAgKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBzd2lnLmxvYWRlcnMuZnMoKSB9KTtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIEZpbGVTeXN0ZW0gbG9hZGVyIGFsbG93aW5nIGEgYmFzZSBwYXRoXG4gICAgICogLy8gV2l0aCB0aGlzLCB5b3UgZG9uJ3QgdXNlIHJlbGF0aXZlIFVSTHMgaW4geW91ciB0ZW1wbGF0ZSByZWZlcmVuY2VzXG4gICAgICogc3dpZy5zZXREZWZhdWx0cyh7IGxvYWRlcjogc3dpZy5sb2FkZXJzLmZzKF9fZGlybmFtZSArICcvdGVtcGxhdGVzJykgfSk7XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBNZW1vcnkgTG9hZGVyXG4gICAgICogc3dpZy5zZXREZWZhdWx0cyh7IGxvYWRlcjogc3dpZy5sb2FkZXJzLm1lbW9yeSh7XG4gICAgICogICBsYXlvdXQ6ICd7JSBibG9jayBmb28gJX17JSBlbmRibG9jayAlfScsXG4gICAgICogICBwYWdlMTogJ3slIGV4dGVuZHMgXCJsYXlvdXRcIiAlfXslIGJsb2NrIGZvbyAlfVRhY29zIXslIGVuZGJsb2NrICV9J1xuICAgICAqIH0pfSk7XG4gICAgICovXG4gICAgbG9hZGVyOiBsb2FkZXJzLmZzKClcbiAgfSxcbiAgZGVmYXVsdEluc3RhbmNlO1xuXG4vKipcbiAqIEVtcHR5IGZ1bmN0aW9uLCB1c2VkIGluIHRlbXBsYXRlcy5cbiAqIEByZXR1cm4ge3N0cmluZ30gRW1wdHkgc3RyaW5nXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBlZm4oKSB7IHJldHVybiAnJzsgfVxuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtICB7P1N3aWdPcHRzfSBvcHRpb25zIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9ICAgICAgVGhpcyBtZXRob2Qgd2lsbCB0aHJvdyBlcnJvcnMgaWYgYW55dGhpbmcgaXMgd3JvbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnMob3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB1dGlscy5lYWNoKFsndmFyQ29udHJvbHMnLCAndGFnQ29udHJvbHMnLCAnY210Q29udHJvbHMnXSwgZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICghb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdXRpbHMuaXNBcnJheShvcHRpb25zW2tleV0pIHx8IG9wdGlvbnNba2V5XS5sZW5ndGggIT09IDIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3B0aW9uIFwiJyArIGtleSArICdcIiBtdXN0IGJlIGFuIGFycmF5IGNvbnRhaW5pbmcgMiBkaWZmZXJlbnQgY29udHJvbCBzdHJpbmdzLicpO1xuICAgIH1cbiAgICBpZiAob3B0aW9uc1trZXldWzBdID09PSBvcHRpb25zW2tleV1bMV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3B0aW9uIFwiJyArIGtleSArICdcIiBvcGVuIGFuZCBjbG9zZSBjb250cm9scyBtdXN0IG5vdCBiZSB0aGUgc2FtZS4nKTtcbiAgICB9XG4gICAgdXRpbHMuZWFjaChvcHRpb25zW2tleV0sIGZ1bmN0aW9uIChhLCBpKSB7XG4gICAgICBpZiAoYS5sZW5ndGggPCAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT3B0aW9uIFwiJyArIGtleSArICdcIiAnICsgKChpKSA/ICdvcGVuICcgOiAnY2xvc2UgJykgKyAnY29udHJvbCBtdXN0IGJlIGF0IGxlYXN0IDIgY2hhcmFjdGVycy4gU2F3IFwiJyArIGEgKyAnXCIgaW5zdGVhZC4nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2NhY2hlJykpIHtcbiAgICBpZiAob3B0aW9ucy5jYWNoZSAmJiBvcHRpb25zLmNhY2hlICE9PSAnbWVtb3J5Jykge1xuICAgICAgaWYgKCFvcHRpb25zLmNhY2hlLmdldCB8fCAhb3B0aW9ucy5jYWNoZS5zZXQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNhY2hlIG9wdGlvbiAnICsgSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5jYWNoZSkgKyAnIGZvdW5kLiBFeHBlY3RlZCBcIm1lbW9yeVwiIG9yIHsgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7IC4uLiB9LCBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7IC4uLiB9IH0uJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KCdsb2FkZXInKSkge1xuICAgIGlmIChvcHRpb25zLmxvYWRlcikge1xuICAgICAgaWYgKCFvcHRpb25zLmxvYWRlci5sb2FkIHx8ICFvcHRpb25zLmxvYWRlci5yZXNvbHZlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBsb2FkZXIgb3B0aW9uICcgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zLmxvYWRlcikgKyAnIGZvdW5kLiBFeHBlY3RlZCB7IGxvYWQ6IGZ1bmN0aW9uIChwYXRobmFtZSwgY2IpIHsgLi4uIH0sIHJlc29sdmU6IGZ1bmN0aW9uICh0bywgZnJvbSkgeyAuLi4gfSB9LicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG59XG5cbi8qKlxuICogU2V0IGRlZmF1bHRzIGZvciB0aGUgYmFzZSBhbmQgYWxsIG5ldyBTd2lnIGVudmlyb25tZW50cy5cbiAqXG4gKiBAZXhhbXBsZVxuICogc3dpZy5zZXREZWZhdWx0cyh7IGNhY2hlOiBmYWxzZSB9KTtcbiAqIC8vID0+IERpc2FibGVzIENhY2hlXG4gKlxuICogQGV4YW1wbGVcbiAqIHN3aWcuc2V0RGVmYXVsdHMoeyBsb2NhbHM6IHsgbm93OiBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgRGF0ZSgpOyB9IH19KTtcbiAqIC8vID0+IHNldHMgYSBnbG9iYWxseSBhY2Nlc3NpYmxlIG1ldGhvZCBmb3IgYWxsIHRlbXBsYXRlXG4gKiAvLyAgICBjb250ZXh0cywgYWxsb3dpbmcgeW91IHRvIHByaW50IHRoZSBjdXJyZW50IGRhdGVcbiAqIC8vID0+IHt7IG5vdygpfGRhdGUoJ0YgalMsIFknKSB9fVxuICpcbiAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuZXhwb3J0cy5zZXREZWZhdWx0cyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zKTtcbiAgZGVmYXVsdEluc3RhbmNlLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoZGVmYXVsdEluc3RhbmNlLm9wdGlvbnMsIG9wdGlvbnMpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGRlZmF1bHQgVGltZVpvbmUgb2Zmc2V0IGZvciBkYXRlIGZvcm1hdHRpbmcgdmlhIHRoZSBkYXRlIGZpbHRlci4gVGhpcyBpcyBhIGdsb2JhbCBzZXR0aW5nIGFuZCB3aWxsIGFmZmVjdCBhbGwgU3dpZyBlbnZpcm9ubWVudHMsIG9sZCBvciBuZXcuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IG9mZnNldCBPZmZzZXQgZnJvbSBHTVQsIGluIG1pbnV0ZXMuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gKi9cbmV4cG9ydHMuc2V0RGVmYXVsdFRaT2Zmc2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBkYXRlZm9ybWF0dGVyLnR6T2Zmc2V0ID0gb2Zmc2V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcsIHNlcGFyYXRlIFN3aWcgY29tcGlsZS9yZW5kZXIgZW52aXJvbm1lbnQuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBzd2lnID0gcmVxdWlyZSgnc3dpZycpO1xuICogdmFyIG15c3dpZyA9IG5ldyBzd2lnLlN3aWcoe3ZhckNvbnRyb2xzOiBbJzwlPScsICclPiddfSk7XG4gKiBteXN3aWcucmVuZGVyKCdUYWNvcyBhcmUgPCU9IHRhY29zID0+IScsIHsgbG9jYWxzOiB7IHRhY29zOiAnZGVsaWNpb3VzJyB9fSk7XG4gKiAvLyA9PiBUYWNvcyBhcmUgZGVsaWNpb3VzIVxuICogc3dpZy5yZW5kZXIoJ1RhY29zIGFyZSA8JT0gdGFjb3MgPT4hJywgeyBsb2NhbHM6IHsgdGFjb3M6ICdkZWxpY2lvdXMnIH19KTtcbiAqIC8vID0+ICdUYWNvcyBhcmUgPCU9IHRhY29zID0+ISdcbiAqXG4gKiBAcGFyYW0gIHtTd2lnT3B0c30gW29wdHM9e31dIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgTmV3IFN3aWcgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydHMuU3dpZyA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHZhbGlkYXRlT3B0aW9ucyhvcHRzKTtcbiAgdGhpcy5vcHRpb25zID0gdXRpbHMuZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0cyB8fCB7fSk7XG4gIHRoaXMuY2FjaGUgPSB7fTtcbiAgdGhpcy5leHRlbnNpb25zID0ge307XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICB0YWdzID0gX3RhZ3MsXG4gICAgZmlsdGVycyA9IF9maWx0ZXJzO1xuXG4gIC8qKlxuICAgKiBHZXQgY29tYmluZWQgbG9jYWxzIGNvbnRleHQuXG4gICAqIEBwYXJhbSAgez9Td2lnT3B0c30gW29wdGlvbnNdIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICBMb2NhbHMgY29udGV4dC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldExvY2FscyhvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmxvY2Fscykge1xuICAgICAgcmV0dXJuIHNlbGYub3B0aW9ucy5sb2NhbHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWxzLmV4dGVuZCh7fSwgc2VsZi5vcHRpb25zLmxvY2Fscywgb3B0aW9ucy5sb2NhbHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSB3aGV0aGVyIGNhY2hpbmcgaXMgZW5hYmxlZCB2aWEgdGhlIG9wdGlvbnMgcHJvdmlkZWQgYW5kL29yIGRlZmF1bHRzXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBPcHRpb25zIE9iamVjdFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hvdWxkQ2FjaGUob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHJldHVybiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnY2FjaGUnKSAmJiAhb3B0aW9ucy5jYWNoZSkgfHwgIXNlbGYub3B0aW9ucy5jYWNoZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tcGlsZWQgdGVtcGxhdGUgZnJvbSB0aGUgY2FjaGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5ICAgICAgICAgICBOYW1lIG9mIHRlbXBsYXRlLlxuICAgKiBAcmV0dXJuIHtvYmplY3R8dW5kZWZpbmVkfSAgICAgVGVtcGxhdGUgZnVuY3Rpb24gYW5kIHRva2Vucy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGNhY2hlR2V0KGtleSwgb3B0aW9ucykge1xuICAgIGlmIChzaG91bGRDYWNoZShvcHRpb25zKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzZWxmLm9wdGlvbnMuY2FjaGUgPT09ICdtZW1vcnknKSB7XG4gICAgICByZXR1cm4gc2VsZi5jYWNoZVtrZXldO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmLm9wdGlvbnMuY2FjaGUuZ2V0KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcmUgYSB0ZW1wbGF0ZSBpbiB0aGUgY2FjaGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30ga2V5IE5hbWUgb2YgdGVtcGxhdGUuXG4gICAqIEBwYXJhbSAge29iamVjdH0gdmFsIFRlbXBsYXRlIGZ1bmN0aW9uIGFuZCB0b2tlbnMuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGNhY2hlU2V0KGtleSwgb3B0aW9ucywgdmFsKSB7XG4gICAgaWYgKHNob3VsZENhY2hlKG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHNlbGYub3B0aW9ucy5jYWNoZSA9PT0gJ21lbW9yeScpIHtcbiAgICAgIHNlbGYuY2FjaGVba2V5XSA9IHZhbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLm9wdGlvbnMuY2FjaGUuc2V0KGtleSwgdmFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGluLW1lbW9yeSB0ZW1wbGF0ZSBjYWNoZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogc3dpZy5pbnZhbGlkYXRlQ2FjaGUoKTtcbiAgICpcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgdGhpcy5pbnZhbGlkYXRlQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNlbGYub3B0aW9ucy5jYWNoZSA9PT0gJ21lbW9yeScpIHtcbiAgICAgIHNlbGYuY2FjaGUgPSB7fTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEFkZCBhIGN1c3RvbSBmaWx0ZXIgZm9yIHN3aWcgdmFyaWFibGVzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBmdW5jdGlvbiByZXBsYWNlTXMoaW5wdXQpIHsgcmV0dXJuIGlucHV0LnJlcGxhY2UoL20vZywgJ2YnKTsgfVxuICAgKiBzd2lnLnNldEZpbHRlcigncmVwbGFjZU1zJywgcmVwbGFjZU1zKTtcbiAgICogLy8gPT4ge3sgXCJvbm9tYXRvcG9laWFcInxyZXBsYWNlTXMgfX1cbiAgICogLy8gPT4gb25vZmF0b3BlaWFcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgIG5hbWUgICAgTmFtZSBvZiBmaWx0ZXIsIHVzZWQgaW4gdGVtcGxhdGVzLiA8c3Ryb25nPldpbGw8L3N0cm9uZz4gb3ZlcndyaXRlIHByZXZpb3VzbHkgZGVmaW5lZCBmaWx0ZXJzLCBpZiB1c2luZyB0aGUgc2FtZSBuYW1lLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSAgbWV0aG9kICBGdW5jdGlvbiB0aGF0IGFjdHMgYWdhaW5zdCB0aGUgaW5wdXQuIFNlZSA8YSBocmVmPVwiL2RvY3MvZmlsdGVycy8jY3VzdG9tXCI+Q3VzdG9tIEZpbHRlcnM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICB0aGlzLnNldEZpbHRlciA9IGZ1bmN0aW9uIChuYW1lLCBtZXRob2QpIHtcbiAgICBpZiAodHlwZW9mIG1ldGhvZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpbHRlciBcIicgKyBuYW1lICsgJ1wiIGlzIG5vdCBhIHZhbGlkIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBmaWx0ZXJzW25hbWVdID0gbWV0aG9kO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgYSBjdXN0b20gdGFnLiBUbyBleHBvc2UgeW91ciBvd24gZXh0ZW5zaW9ucyB0byBjb21waWxlZCB0ZW1wbGF0ZSBjb2RlLCBzZWUgPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+c3dpZy5zZXRFeHRlbnNpb248L2NvZGU+LlxuICAgKlxuICAgKiBGb3IgYSBtb3JlIGluLWRlcHRoIGV4cGxhbmF0aW9uIG9mIHdyaXRpbmcgY3VzdG9tIHRhZ3MsIHNlZSA8YSBocmVmPVwiLi4vZXh0ZW5kaW5nLyN0YWdzXCI+Q3VzdG9tIFRhZ3M8L2E+LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgdGFjb3RhZyA9IHJlcXVpcmUoJy4vdGFjb3RhZycpO1xuICAgKiBzd2lnLnNldFRhZygndGFjb3MnLCB0YWNvdGFnLnBhcnNlLCB0YWNvdGFnLmNvbXBpbGUsIHRhY290YWcuZW5kcywgdGFjb3RhZy5ibG9ja0xldmVsKTtcbiAgICogLy8gPT4geyUgdGFjb3MgJX1NYWtlIHRoaXMgYmUgdGFjb3MueyUgZW5kdGFjb3MgJX1cbiAgICogLy8gPT4gVGFjb3MgdGFjb3MgdGFjb3MgdGFjb3MuXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAgICAgIFRhZyBuYW1lLlxuICAgKiBAcGFyYW0gIHtmdW5jdGlvbn0gcGFyc2UgICBNZXRob2QgZm9yIHBhcnNpbmcgdG9rZW5zLlxuICAgKiBAcGFyYW0gIHtmdW5jdGlvbn0gY29tcGlsZSBNZXRob2QgZm9yIGNvbXBpbGluZyByZW5kZXJhYmxlIG91dHB1dC5cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gW2VuZHM9ZmFsc2VdICAgICBXaGV0aGVyIG9yIG5vdCB0aGlzIHRhZyByZXF1aXJlcyBhbiA8aT5lbmQ8L2k+IHRhZy5cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gW2Jsb2NrTGV2ZWw9ZmFsc2VdIElmIGZhbHNlLCB0aGlzIHRhZyB3aWxsIG5vdCBiZSBjb21waWxlZCBvdXRzaWRlIG9mIDxjb2RlPmJsb2NrPC9jb2RlPiB0YWdzIHdoZW4gZXh0ZW5kaW5nIGEgcGFyZW50IHRlbXBsYXRlLlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICB0aGlzLnNldFRhZyA9IGZ1bmN0aW9uIChuYW1lLCBwYXJzZSwgY29tcGlsZSwgZW5kcywgYmxvY2tMZXZlbCkge1xuICAgIGlmICh0eXBlb2YgcGFyc2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGFnIFwiJyArIG5hbWUgKyAnXCIgcGFyc2UgbWV0aG9kIGlzIG5vdCBhIHZhbGlkIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY29tcGlsZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYWcgXCInICsgbmFtZSArICdcIiBjb21waWxlIG1ldGhvZCBpcyBub3QgYSB2YWxpZCBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0YWdzW25hbWVdID0ge1xuICAgICAgcGFyc2U6IHBhcnNlLFxuICAgICAgY29tcGlsZTogY29tcGlsZSxcbiAgICAgIGVuZHM6IGVuZHMgfHwgZmFsc2UsXG4gICAgICBibG9jazogISFibG9ja0xldmVsXG4gICAgfTtcbiAgfTtcblxuICAvKipcbiAgICogQWRkIGV4dGVuc2lvbnMgZm9yIGN1c3RvbSB0YWdzLiBUaGlzIGFsbG93cyBhbnkgY3VzdG9tIHRhZyB0byBhY2Nlc3MgYSBnbG9iYWxseSBhdmFpbGFibGUgbWV0aG9kcyB2aWEgYSBzcGVjaWFsIGdsb2JhbGx5IGF2YWlsYWJsZSBvYmplY3QsIDx2YXI+X2V4dDwvdmFyPiwgaW4gdGVtcGxhdGVzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBzd2lnLnNldEV4dGVuc2lvbigndHJhbnMnLCBmdW5jdGlvbiAodikgeyByZXR1cm4gdHJhbnNsYXRlKHYpOyB9KTtcbiAgICogZnVuY3Rpb24gY29tcGlsZVRyYW5zKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnQsIG9wdGlvbnMpIHtcbiAgICogICByZXR1cm4gJ19vdXRwdXQgKz0gX2V4dC50cmFucygnICsgYXJnc1swXSArICcpOydcbiAgICogfTtcbiAgICogc3dpZy5zZXRUYWcoJ3RyYW5zJywgcGFyc2VUcmFucywgY29tcGlsZVRyYW5zLCB0cnVlKTtcbiAgICpcbiAgICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgS2V5IG5hbWUgb2YgdGhlIGV4dGVuc2lvbi4gQWNjZXNzZWQgdmlhIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPl9leHRbbmFtZV08L2NvZGU+LlxuICAgKiBAcGFyYW0gIHsqfSAgICAgIG9iamVjdCBUaGUgbWV0aG9kLCB2YWx1ZSwgb3Igb2JqZWN0IHRoYXQgc2hvdWxkIGJlIGF2YWlsYWJsZSB2aWEgdGhlIGdpdmVuIG5hbWUuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIHRoaXMuc2V0RXh0ZW5zaW9uID0gZnVuY3Rpb24gKG5hbWUsIG9iamVjdCkge1xuICAgIHNlbGYuZXh0ZW5zaW9uc1tuYW1lXSA9IG9iamVjdDtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2UgYSBnaXZlbiBzb3VyY2Ugc3RyaW5nIGludG8gdG9rZW5zLlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZSAgU3dpZyB0ZW1wbGF0ZSBzb3VyY2UuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7b2JqZWN0fSBwYXJzZWQgIFRlbXBsYXRlIHRva2VucyBvYmplY3QuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICB0aGlzLnBhcnNlID0gZnVuY3Rpb24gKHNvdXJjZSwgb3B0aW9ucykge1xuICAgIHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zKTtcblxuICAgIHZhciBsb2NhbHMgPSBnZXRMb2NhbHMob3B0aW9ucyksXG4gICAgICBvcHRzID0ge30sXG4gICAgICBrO1xuXG4gICAgZm9yIChrIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGspICYmIGsgIT09ICdsb2NhbHMnKSB7XG4gICAgICAgIG9wdHNba10gPSBvcHRpb25zW2tdO1xuICAgICAgfVxuICAgIH1cblxuICAgIG9wdGlvbnMgPSB1dGlscy5leHRlbmQoe30sIHNlbGYub3B0aW9ucywgb3B0cyk7XG4gICAgb3B0aW9ucy5sb2NhbHMgPSBsb2NhbHM7XG5cbiAgICByZXR1cm4gcGFyc2VyLnBhcnNlKHRoaXMsIHNvdXJjZSwgb3B0aW9ucywgdGFncywgZmlsdGVycyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgZ2l2ZW4gZmlsZSBpbnRvIHRva2Vucy5cbiAgICpcbiAgICogQHBhcmFtICB7c3RyaW5nfSBwYXRobmFtZSAgRnVsbCBwYXRoIHRvIGZpbGUgdG8gcGFyc2UuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gICBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHBhcnNlZCAgICBUZW1wbGF0ZSB0b2tlbnMgb2JqZWN0LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgdGhpcy5wYXJzZUZpbGUgPSBmdW5jdGlvbiAocGF0aG5hbWUsIG9wdGlvbnMpIHtcbiAgICB2YXIgc3JjO1xuXG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuXG4gICAgcGF0aG5hbWUgPSBzZWxmLm9wdGlvbnMubG9hZGVyLnJlc29sdmUocGF0aG5hbWUsIG9wdGlvbnMucmVzb2x2ZUZyb20pO1xuXG4gICAgc3JjID0gc2VsZi5vcHRpb25zLmxvYWRlci5sb2FkKHBhdGhuYW1lKTtcblxuICAgIGlmICghb3B0aW9ucy5maWxlbmFtZSkge1xuICAgICAgb3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7IGZpbGVuYW1lOiBwYXRobmFtZSB9LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZi5wYXJzZShzcmMsIG9wdGlvbnMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZS1NYXAgYmxvY2tzIHdpdGhpbiBhIGxpc3Qgb2YgdG9rZW5zIHRvIHRoZSB0ZW1wbGF0ZSdzIGJsb2NrIG9iamVjdHMuXG4gICAqIEBwYXJhbSAge2FycmF5fSAgdG9rZW5zICAgTGlzdCBvZiB0b2tlbnMgZm9yIHRoZSBwYXJlbnQgb2JqZWN0LlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IHRlbXBsYXRlIEN1cnJlbnQgdGVtcGxhdGUgdGhhdCBuZWVkcyB0byBiZSBtYXBwZWQgdG8gdGhlICBwYXJlbnQncyBibG9jayBhbmQgdG9rZW4gbGlzdC5cbiAgICogQHJldHVybiB7YXJyYXl9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiByZW1hcEJsb2NrcyhibG9ja3MsIHRva2Vucykge1xuICAgIHJldHVybiB1dGlscy5tYXAodG9rZW5zLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgIHZhciBhcmdzID0gdG9rZW4uYXJncyA/IHRva2VuLmFyZ3Muam9pbignJykgOiAnJztcbiAgICAgIGlmICh0b2tlbi5uYW1lID09PSAnYmxvY2snICYmIGJsb2Nrc1thcmdzXSkge1xuICAgICAgICB0b2tlbiA9IGJsb2Nrc1thcmdzXTtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbi5jb250ZW50ICYmIHRva2VuLmNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSByZW1hcEJsb2NrcyhibG9ja3MsIHRva2VuLmNvbnRlbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBibG9jay1sZXZlbCB0YWdzIHRvIHRoZSB0b2tlbiBsaXN0IHRoYXQgYXJlIG5vdCBhY3R1YWwgYmxvY2sgdGFncy5cbiAgICogQHBhcmFtICB7YXJyYXl9IGJsb2NrcyBMaXN0IG9mIGJsb2NrLWxldmVsIHRhZ3MuXG4gICAqIEBwYXJhbSAge2FycmF5fSB0b2tlbnMgTGlzdCBvZiB0b2tlbnMgdG8gcmVuZGVyLlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBpbXBvcnROb25CbG9ja3MoYmxvY2tzLCB0b2tlbnMpIHtcbiAgICB2YXIgdGVtcCA9IFtdO1xuICAgIHV0aWxzLmVhY2goYmxvY2tzLCBmdW5jdGlvbiAoYmxvY2spIHsgdGVtcC5wdXNoKGJsb2NrKTsgfSk7XG4gICAgdXRpbHMuZWFjaCh0ZW1wLnJldmVyc2UoKSwgZnVuY3Rpb24gKGJsb2NrKSB7XG4gICAgICBpZiAoYmxvY2submFtZSAhPT0gJ2Jsb2NrJykge1xuICAgICAgICB0b2tlbnMudW5zaGlmdChibG9jayk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgY29tcGlsZSBhbmQgZ2V0IHBhcmVudHMgb2YgZ2l2ZW4gcGFyc2VkIHRva2VuIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtICB7b2JqZWN0fSB0b2tlbnMgICAgUGFyc2VkIHRva2VucyBmcm9tIHRlbXBsYXRlLlxuICAgKiBAcGFyYW0gIHtTd2lnT3B0c30gW29wdGlvbnM9e31dICAgU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgICAgUGFyc2VkIHRva2VucyBmcm9tIHBhcmVudCB0ZW1wbGF0ZXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRQYXJlbnRzKHRva2Vucywgb3B0aW9ucykge1xuICAgIHZhciBwYXJlbnROYW1lID0gdG9rZW5zLnBhcmVudCxcbiAgICAgIHBhcmVudEZpbGVzID0gW10sXG4gICAgICBwYXJlbnRzID0gW10sXG4gICAgICBwYXJlbnRGaWxlLFxuICAgICAgcGFyZW50LFxuICAgICAgbDtcblxuICAgIHdoaWxlIChwYXJlbnROYW1lKSB7XG4gICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuZmlsZW5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZXh0ZW5kIFwiJyArIHBhcmVudE5hbWUgKyAnXCIgYmVjYXVzZSBjdXJyZW50IHRlbXBsYXRlIGhhcyBubyBmaWxlbmFtZS4nKTtcbiAgICAgIH1cblxuICAgICAgcGFyZW50RmlsZSA9IHBhcmVudEZpbGUgfHwgb3B0aW9ucy5maWxlbmFtZTtcbiAgICAgIHBhcmVudEZpbGUgPSBzZWxmLm9wdGlvbnMubG9hZGVyLnJlc29sdmUocGFyZW50TmFtZSwgcGFyZW50RmlsZSk7XG4gICAgICBwYXJlbnQgPSBjYWNoZUdldChwYXJlbnRGaWxlLCBvcHRpb25zKSB8fCBzZWxmLnBhcnNlRmlsZShwYXJlbnRGaWxlLCB1dGlscy5leHRlbmQoe30sIG9wdGlvbnMsIHsgZmlsZW5hbWU6IHBhcmVudEZpbGUgfSkpO1xuICAgICAgcGFyZW50TmFtZSA9IHBhcmVudC5wYXJlbnQ7XG5cbiAgICAgIGlmIChwYXJlbnRGaWxlcy5pbmRleE9mKHBhcmVudEZpbGUpICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgY2lyY3VsYXIgZXh0ZW5kcyBvZiBcIicgKyBwYXJlbnRGaWxlICsgJ1wiLicpO1xuICAgICAgfVxuICAgICAgcGFyZW50RmlsZXMucHVzaChwYXJlbnRGaWxlKTtcblxuICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XG4gICAgfVxuXG4gICAgLy8gUmVtYXAgZWFjaCBwYXJlbnRzJygxKSBibG9ja3Mgb250byBpdHMgb3duIHBhcmVudCgyKSwgcmVjZWl2aW5nIHRoZSBmdWxsIHRva2VuIGxpc3QgZm9yIHJlbmRlcmluZyB0aGUgb3JpZ2luYWwgcGFyZW50KDEpIG9uIGl0cyBvd24uXG4gICAgbCA9IHBhcmVudHMubGVuZ3RoO1xuICAgIGZvciAobCA9IHBhcmVudHMubGVuZ3RoIC0gMjsgbCA+PSAwOyBsIC09IDEpIHtcbiAgICAgIHBhcmVudHNbbF0udG9rZW5zID0gcmVtYXBCbG9ja3MocGFyZW50c1tsXS5ibG9ja3MsIHBhcmVudHNbbCArIDFdLnRva2Vucyk7XG4gICAgICBpbXBvcnROb25CbG9ja3MocGFyZW50c1tsXS5ibG9ja3MsIHBhcmVudHNbbF0udG9rZW5zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmUtY29tcGlsZSBhIHNvdXJjZSBzdHJpbmcgaW50byBhIGNhY2hlLWFibGUgdGVtcGxhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHN3aWcucHJlY29tcGlsZSgne3sgdGFjb3MgfX0nKTtcbiAgICogLy8gPT4ge1xuICAgKiAvLyAgICAgIHRwbDogZnVuY3Rpb24gKF9zd2lnLCBfbG9jYWxzLCBfZmlsdGVycywgX3V0aWxzLCBfZm4pIHsgLi4uIH0sXG4gICAqIC8vICAgICAgdG9rZW5zOiB7XG4gICAqIC8vICAgICAgICBuYW1lOiB1bmRlZmluZWQsXG4gICAqIC8vICAgICAgICBwYXJlbnQ6IG51bGwsXG4gICAqIC8vICAgICAgICB0b2tlbnM6IFsuLi5dLFxuICAgKiAvLyAgICAgICAgYmxvY2tzOiB7fVxuICAgKiAvLyAgICAgIH1cbiAgICogLy8gICAgfVxuICAgKlxuICAgKiBJbiBvcmRlciB0byByZW5kZXIgYSBwcmUtY29tcGlsZWQgdGVtcGxhdGUsIHlvdSBtdXN0IGhhdmUgYWNjZXNzIHRvIGZpbHRlcnMgYW5kIHV0aWxzIGZyb20gU3dpZy4gPHZhcj5lZm48L3Zhcj4gaXMgc2ltcGx5IGFuIGVtcHR5IGZ1bmN0aW9uIHRoYXQgZG9lcyBub3RoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZSAgU3dpZyB0ZW1wbGF0ZSBzb3VyY2Ugc3RyaW5nLlxuICAgKiBAcGFyYW0gIHtTd2lnT3B0c30gW29wdGlvbnM9e31dIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gICAgICAgICBSZW5kZXJhYmxlIGZ1bmN0aW9uIGFuZCB0b2tlbnMgb2JqZWN0LlxuICAgKi9cbiAgdGhpcy5wcmVjb21waWxlID0gZnVuY3Rpb24gKHNvdXJjZSwgb3B0aW9ucykge1xuICAgIHZhciB0b2tlbnMgPSBzZWxmLnBhcnNlKHNvdXJjZSwgb3B0aW9ucyksXG4gICAgICBwYXJlbnRzID0gZ2V0UGFyZW50cyh0b2tlbnMsIG9wdGlvbnMpLFxuICAgICAgdHBsLFxuICAgICAgZXJyO1xuXG4gICAgaWYgKHBhcmVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBSZW1hcCB0aGUgdGVtcGxhdGVzIGZpcnN0LXBhcmVudCdzIHRva2VucyB1c2luZyB0aGlzIHRlbXBsYXRlJ3MgYmxvY2tzLlxuICAgICAgdG9rZW5zLnRva2VucyA9IHJlbWFwQmxvY2tzKHRva2Vucy5ibG9ja3MsIHBhcmVudHNbMF0udG9rZW5zKTtcbiAgICAgIGltcG9ydE5vbkJsb2Nrcyh0b2tlbnMuYmxvY2tzLCB0b2tlbnMudG9rZW5zKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdHBsID0gbmV3IEZ1bmN0aW9uKCdfc3dpZycsICdfY3R4JywgJ19maWx0ZXJzJywgJ191dGlscycsICdfZm4nLFxuICAgICAgICAnICB2YXIgX2V4dCA9IF9zd2lnLmV4dGVuc2lvbnMsXFxuJyArXG4gICAgICAgICcgICAgX291dHB1dCA9IFwiXCI7XFxuJyArXG4gICAgICAgIHBhcnNlci5jb21waWxlKHRva2VucywgcGFyZW50cywgb3B0aW9ucykgKyAnXFxuJyArXG4gICAgICAgICcgIHJldHVybiBfb3V0cHV0O1xcbidcbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1dGlscy50aHJvd0Vycm9yKGUsIG51bGwsIG9wdGlvbnMuZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHRwbDogdHBsLCB0b2tlbnM6IHRva2VucyB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlIGFuZCByZW5kZXIgYSB0ZW1wbGF0ZSBzdHJpbmcgZm9yIGZpbmFsIG91dHB1dC5cbiAgICpcbiAgICogV2hlbiByZW5kZXJpbmcgYSBzb3VyY2Ugc3RyaW5nLCBhIGZpbGUgcGF0aCBzaG91bGQgYmUgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zIG9iamVjdCBpbiBvcmRlciBmb3IgPHZhcj5leHRlbmRzPC92YXI+LCA8dmFyPmluY2x1ZGU8L3Zhcj4sIGFuZCA8dmFyPmltcG9ydDwvdmFyPiB0byB3b3JrIHByb3Blcmx5LiBEbyB0aGlzIGJ5IGFkZGluZyA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj57IGZpbGVuYW1lOiAnL2Fic29sdXRlL3BhdGgvdG8vbXl0cGwuaHRtbCcgfTwvY29kZT4gdG8gdGhlIG9wdGlvbnMgYXJndW1lbnQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHN3aWcucmVuZGVyKCd7eyB0YWNvcyB9fScsIHsgbG9jYWxzOiB7IHRhY29zOiAnVGFjb3MhISEhJyB9fSk7XG4gICAqIC8vID0+IFRhY29zISEhIVxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZSAgICBTd2lnIHRlbXBsYXRlIHNvdXJjZSBzdHJpbmcuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgUmVuZGVyZWQgb3V0cHV0LlxuICAgKi9cbiAgdGhpcy5yZW5kZXIgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHNlbGYuY29tcGlsZShzb3VyY2UsIG9wdGlvbnMpKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgYW5kIHJlbmRlciBhIHRlbXBsYXRlIGZpbGUgZm9yIGZpbmFsIG91dHB1dC4gVGhpcyBpcyBtb3N0IHVzZWZ1bCBmb3IgbGlicmFyaWVzIGxpa2UgRXhwcmVzcy5qcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogc3dpZy5yZW5kZXJGaWxlKCcuL3RlbXBsYXRlLmh0bWwnLCB7fSwgZnVuY3Rpb24gKGVyciwgb3V0cHV0KSB7XG4gICAqICAgaWYgKGVycikge1xuICAgKiAgICAgdGhyb3cgZXJyO1xuICAgKiAgIH1cbiAgICogICBjb25zb2xlLmxvZyhvdXRwdXQpO1xuICAgKiB9KTtcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogc3dpZy5yZW5kZXJGaWxlKCcuL3RlbXBsYXRlLmh0bWwnLCB7fSk7XG4gICAqIC8vID0+IG91dHB1dFxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgcGF0aE5hbWUgICAgRmlsZSBsb2NhdGlvbi5cbiAgICogQHBhcmFtICB7b2JqZWN0fSAgIFtsb2NhbHM9e31dIFRlbXBsYXRlIHZhcmlhYmxlIGNvbnRleHQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbY2JdIEFzeW5jcm9ub3VzIGNhbGxiYWNrIGZ1bmN0aW9uLiBJZiBub3QgcHJvdmlkZWQsIDx2YXI+Y29tcGlsZUZpbGU8L3Zhcj4gd2lsbCBydW4gc3luY3Jvbm91c2x5LlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgIFJlbmRlcmVkIG91dHB1dC5cbiAgICovXG4gIHRoaXMucmVuZGVyRmlsZSA9IGZ1bmN0aW9uIChwYXRoTmFtZSwgbG9jYWxzLCBjYikge1xuICAgIGlmIChjYikge1xuICAgICAgc2VsZi5jb21waWxlRmlsZShwYXRoTmFtZSwge30sIGZ1bmN0aW9uIChlcnIsIGZuKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXN1bHQgPSBmbihsb2NhbHMpO1xuICAgICAgICB9IGNhdGNoIChlcnIyKSB7XG4gICAgICAgICAgY2IoZXJyMik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2IobnVsbCwgcmVzdWx0KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmLmNvbXBpbGVGaWxlKHBhdGhOYW1lKShsb2NhbHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlIHN0cmluZyBzb3VyY2UgaW50byBhIHJlbmRlcmFibGUgdGVtcGxhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB0cGwgPSBzd2lnLmNvbXBpbGUoJ3t7IHRhY29zIH19Jyk7XG4gICAqIC8vID0+IHtcbiAgICogLy8gICAgICBbRnVuY3Rpb246IGNvbXBpbGVkXVxuICAgKiAvLyAgICAgIHBhcmVudDogbnVsbCxcbiAgICogLy8gICAgICB0b2tlbnM6IFt7IGNvbXBpbGU6IFtGdW5jdGlvbl0gfV0sXG4gICAqIC8vICAgICAgYmxvY2tzOiB7fVxuICAgKiAvLyAgICB9XG4gICAqIHRwbCh7IHRhY29zOiAnVGFjb3MhISEhJyB9KTtcbiAgICogLy8gPT4gVGFjb3MhISEhXG4gICAqXG4gICAqIFdoZW4gY29tcGlsaW5nIGEgc291cmNlIHN0cmluZywgYSBmaWxlIHBhdGggc2hvdWxkIGJlIHNwZWNpZmllZCBpbiB0aGUgb3B0aW9ucyBvYmplY3QgaW4gb3JkZXIgZm9yIDx2YXI+ZXh0ZW5kczwvdmFyPiwgPHZhcj5pbmNsdWRlPC92YXI+LCBhbmQgPHZhcj5pbXBvcnQ8L3Zhcj4gdG8gd29yayBwcm9wZXJseS4gRG8gdGhpcyBieSBhZGRpbmcgPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+eyBmaWxlbmFtZTogJy9hYnNvbHV0ZS9wYXRoL3RvL215dHBsLmh0bWwnIH08L2NvZGU+IHRvIHRoZSBvcHRpb25zIGFyZ3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZSAgICBTd2lnIHRlbXBsYXRlIHNvdXJjZSBzdHJpbmcuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7ZnVuY3Rpb259ICAgICAgICAgUmVuZGVyYWJsZSBmdW5jdGlvbiB3aXRoIGtleXMgZm9yIHBhcmVudCwgYmxvY2tzLCBhbmQgdG9rZW5zLlxuICAgKi9cbiAgdGhpcy5jb21waWxlID0gZnVuY3Rpb24gKHNvdXJjZSwgb3B0aW9ucykge1xuICAgIHZhciBrZXkgPSBvcHRpb25zID8gb3B0aW9ucy5maWxlbmFtZSA6IG51bGwsXG4gICAgICBjYWNoZWQgPSBrZXkgPyBjYWNoZUdldChrZXksIG9wdGlvbnMpIDogbnVsbCxcbiAgICAgIGNvbnRleHQsXG4gICAgICBjb250ZXh0TGVuZ3RoLFxuICAgICAgcHJlO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICB9XG5cbiAgICBjb250ZXh0ID0gZ2V0TG9jYWxzKG9wdGlvbnMpO1xuICAgIGNvbnRleHRMZW5ndGggPSB1dGlscy5rZXlzKGNvbnRleHQpLmxlbmd0aDtcbiAgICBwcmUgPSB0aGlzLnByZWNvbXBpbGUoc291cmNlLCBvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIGNvbXBpbGVkKGxvY2Fscykge1xuICAgICAgdmFyIGxjbHM7XG4gICAgICBpZiAobG9jYWxzICYmIGNvbnRleHRMZW5ndGgpIHtcbiAgICAgICAgbGNscyA9IHV0aWxzLmV4dGVuZCh7fSwgY29udGV4dCwgbG9jYWxzKTtcbiAgICAgIH0gZWxzZSBpZiAobG9jYWxzICYmICFjb250ZXh0TGVuZ3RoKSB7XG4gICAgICAgIGxjbHMgPSBsb2NhbHM7XG4gICAgICB9IGVsc2UgaWYgKCFsb2NhbHMgJiYgY29udGV4dExlbmd0aCkge1xuICAgICAgICBsY2xzID0gY29udGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxjbHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmUudHBsKHNlbGYsIGxjbHMsIGZpbHRlcnMsIHV0aWxzLCBlZm4pO1xuICAgIH1cblxuICAgIHV0aWxzLmV4dGVuZChjb21waWxlZCwgcHJlLnRva2Vucyk7XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBjYWNoZVNldChrZXksIG9wdGlvbnMsIGNvbXBpbGVkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcGlsZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgYSBzb3VyY2UgZmlsZSBpbnRvIGEgcmVuZGVyYWJsZSB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHRwbCA9IHN3aWcuY29tcGlsZUZpbGUoJy4vbXl0cGwuaHRtbCcpO1xuICAgKiAvLyA9PiB7XG4gICAqIC8vICAgICAgW0Z1bmN0aW9uOiBjb21waWxlZF1cbiAgICogLy8gICAgICBwYXJlbnQ6IG51bGwsXG4gICAqIC8vICAgICAgdG9rZW5zOiBbeyBjb21waWxlOiBbRnVuY3Rpb25dIH1dLFxuICAgKiAvLyAgICAgIGJsb2Nrczoge31cbiAgICogLy8gICAgfVxuICAgKiB0cGwoeyB0YWNvczogJ1RhY29zISEhIScgfSk7XG4gICAqIC8vID0+IFRhY29zISEhIVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBzd2lnLmNvbXBpbGVGaWxlKCcvbXlmaWxlLnR4dCcsIHsgdmFyQ29udHJvbHM6IFsnPCU9JywgJz0lPiddLCB0YWdDb250cm9sczogWyc8JScsICclPiddfSk7XG4gICAqIC8vID0+IHdpbGwgY29tcGlsZSAnbXlmaWxlLnR4dCcgdXNpbmcgdGhlIHZhciBhbmQgdGFnIGNvbnRyb2xzIGFzIHNwZWNpZmllZC5cbiAgICpcbiAgICogQHBhcmFtICB7c3RyaW5nfSBwYXRobmFtZSAgRmlsZSBsb2NhdGlvbi5cbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gW2NiXSBBc3luY3Jvbm91cyBjYWxsYmFjayBmdW5jdGlvbi4gSWYgbm90IHByb3ZpZGVkLCA8dmFyPmNvbXBpbGVGaWxlPC92YXI+IHdpbGwgcnVuIHN5bmNyb25vdXNseS5cbiAgICogQHJldHVybiB7ZnVuY3Rpb259ICAgICAgICAgUmVuZGVyYWJsZSBmdW5jdGlvbiB3aXRoIGtleXMgZm9yIHBhcmVudCwgYmxvY2tzLCBhbmQgdG9rZW5zLlxuICAgKi9cbiAgdGhpcy5jb21waWxlRmlsZSA9IGZ1bmN0aW9uIChwYXRobmFtZSwgb3B0aW9ucywgY2IpIHtcbiAgICB2YXIgc3JjLCBjYWNoZWQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBwYXRobmFtZSA9IHNlbGYub3B0aW9ucy5sb2FkZXIucmVzb2x2ZShwYXRobmFtZSwgb3B0aW9ucy5yZXNvbHZlRnJvbSk7XG4gICAgaWYgKCFvcHRpb25zLmZpbGVuYW1lKSB7XG4gICAgICBvcHRpb25zID0gdXRpbHMuZXh0ZW5kKHsgZmlsZW5hbWU6IHBhdGhuYW1lIH0sIG9wdGlvbnMpO1xuICAgIH1cbiAgICBjYWNoZWQgPSBjYWNoZUdldChwYXRobmFtZSwgb3B0aW9ucyk7XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBpZiAoY2IpIHtcbiAgICAgICAgY2IobnVsbCwgY2FjaGVkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICB9XG5cbiAgICBpZiAoY2IpIHtcbiAgICAgIHNlbGYub3B0aW9ucy5sb2FkZXIubG9hZChwYXRobmFtZSwgZnVuY3Rpb24gKGVyciwgc3JjKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29tcGlsZWQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb21waWxlZCA9IHNlbGYuY29tcGlsZShzcmMsIG9wdGlvbnMpO1xuICAgICAgICB9IGNhdGNoIChlcnIyKSB7XG4gICAgICAgICAgY2IoZXJyMik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2IoZXJyLCBjb21waWxlZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzcmMgPSBzZWxmLm9wdGlvbnMubG9hZGVyLmxvYWQocGF0aG5hbWUpO1xuICAgIHJldHVybiBzZWxmLmNvbXBpbGUoc3JjLCBvcHRpb25zKTtcbiAgfTtcblxuICAvKipcbiAgICogUnVuIGEgcHJlLWNvbXBpbGVkIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGlzIGlzIG1vc3QgdXNlZnVsIGluIHRoZSBicm93c2VyIHdoZW4geW91J3ZlIHByZS1jb21waWxlZCB5b3VyIHRlbXBsYXRlcyB3aXRoIHRoZSBTd2lnIGNvbW1hbmQtbGluZSB0b29sLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAkIHN3aWcgY29tcGlsZSAuL215dHBsLmh0bWwgLS13cmFwLXN0YXJ0PVwidmFyIG15dHBsID0gXCIgPiBteXRwbC5qc1xuICAgKiBAZXhhbXBsZVxuICAgKiA8c2NyaXB0IHNyYz1cIm15dHBsLmpzXCI+PC9zY3JpcHQ+XG4gICAqIDxzY3JpcHQ+XG4gICAqICAgc3dpZy5ydW4obXl0cGwsIHt9KTtcbiAgICogICAvLyA9PiBcInJlbmRlcmVkIHRlbXBsYXRlLi4uXCJcbiAgICogPC9zY3JpcHQ+XG4gICAqXG4gICAqIEBwYXJhbSAge2Z1bmN0aW9ufSB0cGwgICAgICAgUHJlLWNvbXBpbGVkIFN3aWcgdGVtcGxhdGUgZnVuY3Rpb24uIFVzZSB0aGUgU3dpZyBDTEkgdG8gY29tcGlsZSB5b3VyIHRlbXBsYXRlcy5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBbbG9jYWxzPXt9XSBUZW1wbGF0ZSB2YXJpYWJsZSBjb250ZXh0LlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IFtmaWxlcGF0aF0gIEZpbGVuYW1lIHVzZWQgZm9yIGNhY2hpbmcgdGhlIHRlbXBsYXRlLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgIFJlbmRlcmVkIG91dHB1dC5cbiAgICovXG4gIHRoaXMucnVuID0gZnVuY3Rpb24gKHRwbCwgbG9jYWxzLCBmaWxlcGF0aCkge1xuICAgIHZhciBjb250ZXh0ID0gZ2V0TG9jYWxzKHsgbG9jYWxzOiBsb2NhbHMgfSk7XG4gICAgaWYgKGZpbGVwYXRoKSB7XG4gICAgICBjYWNoZVNldChmaWxlcGF0aCwge30sIHRwbCk7XG4gICAgfVxuICAgIHJldHVybiB0cGwoc2VsZiwgY29udGV4dCwgZmlsdGVycywgdXRpbHMsIGVmbik7XG4gIH07XG59O1xuXG4vKiFcbiAqIEV4cG9ydCBtZXRob2RzIHB1YmxpY2x5XG4gKi9cbmRlZmF1bHRJbnN0YW5jZSA9IG5ldyBleHBvcnRzLlN3aWcoKTtcbmV4cG9ydHMuc2V0RmlsdGVyID0gZGVmYXVsdEluc3RhbmNlLnNldEZpbHRlcjtcbmV4cG9ydHMuc2V0VGFnID0gZGVmYXVsdEluc3RhbmNlLnNldFRhZztcbmV4cG9ydHMuc2V0RXh0ZW5zaW9uID0gZGVmYXVsdEluc3RhbmNlLnNldEV4dGVuc2lvbjtcbmV4cG9ydHMucGFyc2VGaWxlID0gZGVmYXVsdEluc3RhbmNlLnBhcnNlRmlsZTtcbmV4cG9ydHMucHJlY29tcGlsZSA9IGRlZmF1bHRJbnN0YW5jZS5wcmVjb21waWxlO1xuZXhwb3J0cy5jb21waWxlID0gZGVmYXVsdEluc3RhbmNlLmNvbXBpbGU7XG5leHBvcnRzLmNvbXBpbGVGaWxlID0gZGVmYXVsdEluc3RhbmNlLmNvbXBpbGVGaWxlO1xuZXhwb3J0cy5yZW5kZXIgPSBkZWZhdWx0SW5zdGFuY2UucmVuZGVyO1xuZXhwb3J0cy5yZW5kZXJGaWxlID0gZGVmYXVsdEluc3RhbmNlLnJlbmRlckZpbGU7XG5leHBvcnRzLnJ1biA9IGRlZmF1bHRJbnN0YW5jZS5ydW47XG5leHBvcnRzLmludmFsaWRhdGVDYWNoZSA9IGRlZmF1bHRJbnN0YW5jZS5pbnZhbGlkYXRlQ2FjaGU7XG5leHBvcnRzLmxvYWRlcnMgPSBsb2FkZXJzO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKSxcbiAgc3RyaW5ncyA9IFsnaHRtbCcsICdqcyddO1xuXG4vKipcbiAqIENvbnRyb2wgYXV0by1lc2NhcGluZyBvZiB2YXJpYWJsZSBvdXRwdXQgZnJvbSB3aXRoaW4geW91ciB0ZW1wbGF0ZXMuXG4gKlxuICogQGFsaWFzIGF1dG9lc2NhcGVcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXl2YXIgPSAnPGZvbz4nO1xuICogeyUgYXV0b2VzY2FwZSB0cnVlICV9e3sgbXl2YXIgfX17JSBlbmRhdXRvZXNjYXBlICV9XG4gKiAvLyA9PiAmbHQ7Zm9vJmd0O1xuICogeyUgYXV0b2VzY2FwZSBmYWxzZSAlfXt7IG15dmFyIH19eyUgZW5kYXV0b2VzY2FwZSAlfVxuICogLy8gPT4gPGZvbz5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW58c3RyaW5nfSBjb250cm9sIE9uZSBvZiBgdHJ1ZWAsIGBmYWxzZWAsIGBcImpzXCJgIG9yIGBcImh0bWxcImAuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHJldHVybiBjb21waWxlcihjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpO1xufTtcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBzdGFjaywgb3B0cykge1xuICB2YXIgbWF0Y2hlZDtcbiAgcGFyc2VyLm9uKCcqJywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCFtYXRjaGVkICYmXG4gICAgICAgICh0b2tlbi50eXBlID09PSB0eXBlcy5CT09MIHx8XG4gICAgICAgICAgKHRva2VuLnR5cGUgPT09IHR5cGVzLlNUUklORyAmJiBzdHJpbmdzLmluZGV4T2YodG9rZW4ubWF0Y2gpID09PSAtMSkpXG4gICAgICAgICkge1xuICAgICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCB0b2tlbiBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBpbiBhdXRvZXNjYXBlIHRhZycsIGxpbmUsIG9wdHMuZmlsZW5hbWUpO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuIiwiLyoqXG4gKiBEZWZpbmVzIGEgYmxvY2sgaW4gYSB0ZW1wbGF0ZSB0aGF0IGNhbiBiZSBvdmVycmlkZGVuIGJ5IGEgdGVtcGxhdGUgZXh0ZW5kaW5nIHRoaXMgb25lIGFuZC9vciB3aWxsIG92ZXJyaWRlIHRoZSBjdXJyZW50IHRlbXBsYXRlJ3MgcGFyZW50IHRlbXBsYXRlIGJsb2NrIG9mIHRoZSBzYW1lIG5hbWUuXG4gKlxuICogU2VlIDxhIGhyZWY9XCIjaW5oZXJpdGFuY2VcIj5UZW1wbGF0ZSBJbmhlcml0YW5jZTwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQGFsaWFzIGJsb2NrXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGJsb2NrIGJvZHkgJX0uLi57JSBlbmRibG9jayAlfVxuICpcbiAqIEBwYXJhbSB7bGl0ZXJhbH0gIG5hbWUgICBOYW1lIG9mIHRoZSBibG9jayBmb3IgdXNlIGluIHBhcmVudCBhbmQgZXh0ZW5kZWQgdGVtcGxhdGVzLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MsIGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGFyZ3Muam9pbignJykpO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlcikge1xuICBwYXJzZXIub24oJyonLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgfSk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lbmRzID0gdHJ1ZTtcbmV4cG9ydHMuYmxvY2sgPSB0cnVlO1xuIiwiLyoqXG4gKiBVc2VkIHdpdGhpbiBhbiA8Y29kZSBkYXRhLWxhbmd1YWdlPVwic3dpZ1wiPnslIGlmICV9PC9jb2RlPiB0YWcsIHRoZSBjb2RlIGJsb2NrIGZvbGxvd2luZyB0aGlzIHRhZyB1cCB1bnRpbCA8Y29kZSBkYXRhLWxhbmd1YWdlPVwic3dpZ1wiPnslIGVuZGlmICV9PC9jb2RlPiB3aWxsIGJlIHJlbmRlcmVkIGlmIHRoZSA8aT5pZjwvaT4gc3RhdGVtZW50IHJldHVybnMgZmFsc2UuXG4gKlxuICogQGFsaWFzIGVsc2VcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgZmFsc2UgJX1cbiAqICAgc3RhdGVtZW50MVxuICogeyUgZWxzZSAlfVxuICogICBzdGF0ZW1lbnQyXG4gKiB7JSBlbmRpZiAlfVxuICogLy8gPT4gc3RhdGVtZW50MlxuICpcbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJ30gZWxzZSB7XFxuJztcbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBzdGFjaykge1xuICBwYXJzZXIub24oJyonLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiZWxzZVwiIHRhZyBkb2VzIG5vdCBhY2NlcHQgYW55IHRva2Vucy4gRm91bmQgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gIH0pO1xuXG4gIHJldHVybiAoc3RhY2subGVuZ3RoICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLm5hbWUgPT09ICdpZicpO1xufTtcbiIsInZhciBpZnBhcnNlciA9IHJlcXVpcmUoJy4vaWYnKS5wYXJzZTtcblxuLyoqXG4gKiBMaWtlIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+eyUgZWxzZSAlfTwvY29kZT4sIGV4Y2VwdCB0aGlzIHRhZyBjYW4gdGFrZSBtb3JlIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMuXG4gKlxuICogQGFsaWFzIGVsc2VpZlxuICogQGFsaWFzIGVsaWZcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgZmFsc2UgJX1cbiAqICAgVGFjb3NcbiAqIHslIGVsc2VpZiB0cnVlICV9XG4gKiAgIEJ1cnJpdG9zXG4gKiB7JSBlbHNlICV9XG4gKiAgIENodXJyb3NcbiAqIHslIGVuZGlmICV9XG4gKiAvLyA9PiBCdXJyaXRvc1xuICpcbiAqIEBwYXJhbSB7Li4ubWl4ZWR9IGNvbmRpdGlvbmFsICBDb25kaXRpb25hbCBzdGF0ZW1lbnQgdGhhdCByZXR1cm5zIGEgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MpIHtcbiAgcmV0dXJuICd9IGVsc2UgaWYgKCcgKyBhcmdzLmpvaW4oJyAnKSArICcpIHtcXG4nO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrKSB7XG4gIHZhciBva2F5ID0gaWZwYXJzZXIoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBzdGFjayk7XG4gIHJldHVybiBva2F5ICYmIChzdGFjay5sZW5ndGggJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ubmFtZSA9PT0gJ2lmJyk7XG59O1xuIiwiLyoqXG4gKiBNYWtlcyB0aGUgY3VycmVudCB0ZW1wbGF0ZSBleHRlbmQgYSBwYXJlbnQgdGVtcGxhdGUuIFRoaXMgdGFnIG11c3QgYmUgdGhlIGZpcnN0IGl0ZW0gaW4geW91ciB0ZW1wbGF0ZS5cbiAqXG4gKiBTZWUgPGEgaHJlZj1cIiNpbmhlcml0YW5jZVwiPlRlbXBsYXRlIEluaGVyaXRhbmNlPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAYWxpYXMgZXh0ZW5kc1xuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBleHRlbmRzIFwiLi9sYXlvdXQuaHRtbFwiICV9XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhcmVudEZpbGUgIFJlbGF0aXZlIHBhdGggdG8gdGhlIGZpbGUgdGhhdCB0aGlzIHRlbXBsYXRlIGV4dGVuZHMuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uICgpIHt9O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuZW5kcyA9IGZhbHNlO1xuIiwidmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuLi9maWx0ZXJzJyk7XG5cbi8qKlxuICogQXBwbHkgYSBmaWx0ZXIgdG8gYW4gZW50aXJlIGJsb2NrIG9mIHRlbXBsYXRlLlxuICpcbiAqIEBhbGlhcyBmaWx0ZXJcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgZmlsdGVyIHVwcGVyY2FzZSAlfW9oIGhpLCB7eyBuYW1lIH19eyUgZW5kZmlsdGVyICV9XG4gKiAvLyA9PiBPSCBISSwgUEFVTFxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBmaWx0ZXIgcmVwbGFjZShcIi5cIiwgXCIhXCIsIFwiZ1wiKSAlfUhpLiBNeSBuYW1lIGlzIFBhdWwueyUgZW5kZmlsdGVyICV9XG4gKiAvLyA9PiBIaSEgTXkgbmFtZSBpcyBQYXVsIVxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZpbHRlciAgVGhlIGZpbHRlciB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSBjb250ZW50cyBvZiB0aGUgdGFnLlxuICovXG5cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHZhciBmaWx0ZXIgPSBhcmdzLnNoaWZ0KCkucmVwbGFjZSgvXFwoJC8sICcnKSxcbiAgICB2YWwgPSAnKGZ1bmN0aW9uICgpIHtcXG4nICtcbiAgICAgICcgIHZhciBfb3V0cHV0ID0gXCJcIjtcXG4nICtcbiAgICAgIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkgK1xuICAgICAgJyAgcmV0dXJuIF9vdXRwdXQ7XFxuJyArXG4gICAgICAnfSkoKSc7XG5cbiAgaWYgKGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJyknKSB7XG4gICAgYXJncy5wb3AoKTtcbiAgfVxuXG4gIGFyZ3MgPSAoYXJncy5sZW5ndGgpID8gJywgJyArIGFyZ3Muam9pbignJykgOiAnJztcbiAgcmV0dXJuICdfb3V0cHV0ICs9IF9maWx0ZXJzW1wiJyArIGZpbHRlciArICdcIl0oJyArIHZhbCArIGFyZ3MgKyAnKTtcXG4nO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMpIHtcbiAgdmFyIGZpbHRlcjtcblxuICBmdW5jdGlvbiBjaGVjayhmaWx0ZXIpIHtcbiAgICBpZiAoIWZpbHRlcnMuaGFzT3duUHJvcGVydHkoZmlsdGVyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWx0ZXIgXCInICsgZmlsdGVyICsgJ1wiIGRvZXMgbm90IGV4aXN0IG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlci5vbih0eXBlcy5GVU5DVElPTiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCFmaWx0ZXIpIHtcbiAgICAgIGZpbHRlciA9IHRva2VuLm1hdGNoLnJlcGxhY2UoL1xcKCQvLCAnJyk7XG4gICAgICBjaGVjayhmaWx0ZXIpO1xuICAgICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICB0aGlzLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuVkFSLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIWZpbHRlcikge1xuICAgICAgZmlsdGVyID0gdG9rZW4ubWF0Y2g7XG4gICAgICBjaGVjayhmaWx0ZXIpO1xuICAgICAgdGhpcy5vdXQucHVzaChmaWx0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuIiwidmFyIGN0eCA9ICdfY3R4LicsXG4gIGN0eGxvb3AgPSBjdHggKyAnbG9vcCc7XG5cbi8qKlxuICogTG9vcCBvdmVyIG9iamVjdHMgYW5kIGFycmF5cy5cbiAqXG4gKiBAYWxpYXMgZm9yXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG9iaiA9IHsgb25lOiAnaGknLCB0d286ICdieWUnIH07XG4gKiB7JSBmb3IgeCBpbiBvYmogJX1cbiAqICAgeyUgaWYgbG9vcC5maXJzdCAlfTx1bD57JSBlbmRpZiAlfVxuICogICA8bGk+e3sgbG9vcC5pbmRleCB9fSAtIHt7IGxvb3Aua2V5IH19OiB7eyB4IH19PC9saT5cbiAqICAgeyUgaWYgbG9vcC5sYXN0ICV9PC91bD57JSBlbmRpZiAlfVxuICogeyUgZW5kZm9yICV9XG4gKiAvLyA9PiA8dWw+XG4gKiAvLyAgICA8bGk+MSAtIG9uZTogaGk8L2xpPlxuICogLy8gICAgPGxpPjIgLSB0d286IGJ5ZTwvbGk+XG4gKiAvLyAgICA8L3VsPlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBhcnIgPSBbMSwgMiwgM11cbiAqIC8vIFJldmVyc2UgdGhlIGFycmF5LCBzaG9ydGN1dCB0aGUga2V5L2luZGV4IHRvIGBrZXlgXG4gKiB7JSBmb3Iga2V5LCB2YWwgaW4gYXJyfHJldmVyc2UgJX1cbiAqIHt7IGtleSB9fSAtLSB7eyB2YWwgfX1cbiAqIHslIGVuZGZvciAlfVxuICogLy8gPT4gMCAtLSAzXG4gKiAvLyAgICAxIC0tIDJcbiAqIC8vICAgIDIgLS0gMVxuICpcbiAqIEBwYXJhbSB7bGl0ZXJhbH0gW2tleV0gICAgIEEgc2hvcnRjdXQgdG8gdGhlIGluZGV4IG9mIHRoZSBhcnJheSBvciBjdXJyZW50IGtleSBhY2Nlc3Nvci5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gdmFyaWFibGUgIFRoZSBjdXJyZW50IHZhbHVlIHdpbGwgYmUgYXNzaWduZWQgdG8gdGhpcyB2YXJpYWJsZSBuYW1lIHRlbXBvcmFyaWx5LiBUaGUgdmFyaWFibGUgd2lsbCBiZSByZXNldCB1cG9uIGVuZGluZyB0aGUgZm9yIHRhZy5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gaW4gICAgICAgIExpdGVyYWxseSwgXCJpblwiLiBUaGlzIHRva2VuIGlzIHJlcXVpcmVkLlxuICogQHBhcmFtIHtvYmplY3R9ICBvYmplY3QgICAgQW4gZW51bWVyYWJsZSBvYmplY3QgdGhhdCB3aWxsIGJlIGl0ZXJhdGVkIG92ZXIuXG4gKlxuICogQHJldHVybiB7bG9vcC5pbmRleH0gVGhlIGN1cnJlbnQgaXRlcmF0aW9uIG9mIHRoZSBsb29wICgxLWluZGV4ZWQpXG4gKiBAcmV0dXJuIHtsb29wLmluZGV4MH0gVGhlIGN1cnJlbnQgaXRlcmF0aW9uIG9mIHRoZSBsb29wICgwLWluZGV4ZWQpXG4gKiBAcmV0dXJuIHtsb29wLnJldmluZGV4fSBUaGUgbnVtYmVyIG9mIGl0ZXJhdGlvbnMgZnJvbSB0aGUgZW5kIG9mIHRoZSBsb29wICgxLWluZGV4ZWQpXG4gKiBAcmV0dXJuIHtsb29wLnJldmluZGV4MH0gVGhlIG51bWJlciBvZiBpdGVyYXRpb25zIGZyb20gdGhlIGVuZCBvZiB0aGUgbG9vcCAoMC1pbmRleGVkKVxuICogQHJldHVybiB7bG9vcC5rZXl9IElmIHRoZSBpdGVyYXRvciBpcyBhbiBvYmplY3QsIHRoaXMgd2lsbCBiZSB0aGUga2V5IG9mIHRoZSBjdXJyZW50IGl0ZW0sIG90aGVyd2lzZSBpdCB3aWxsIGJlIHRoZSBzYW1lIGFzIHRoZSBsb29wLmluZGV4LlxuICogQHJldHVybiB7bG9vcC5maXJzdH0gVHJ1ZSBpZiB0aGUgY3VycmVudCBvYmplY3QgaXMgdGhlIGZpcnN0IGluIHRoZSBvYmplY3Qgb3IgYXJyYXkuXG4gKiBAcmV0dXJuIHtsb29wLmxhc3R9IFRydWUgaWYgdGhlIGN1cnJlbnQgb2JqZWN0IGlzIHRoZSBsYXN0IGluIHRoZSBvYmplY3Qgb3IgYXJyYXkuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHZhciB2YWwgPSBhcmdzLnNoaWZ0KCksXG4gICAga2V5ID0gJ19faycsXG4gICAgY3R4bG9vcGNhY2hlID0gKGN0eCArICdfX2xvb3BjYWNoZScgKyBNYXRoLnJhbmRvbSgpKS5yZXBsYWNlKC9cXC4vZywgJycpLFxuICAgIGxhc3Q7XG5cbiAgaWYgKGFyZ3NbMF0gJiYgYXJnc1swXSA9PT0gJywnKSB7XG4gICAgYXJncy5zaGlmdCgpO1xuICAgIGtleSA9IHZhbDtcbiAgICB2YWwgPSBhcmdzLnNoaWZ0KCk7XG4gIH1cblxuICBsYXN0ID0gYXJncy5qb2luKCcnKTtcblxuICByZXR1cm4gW1xuICAgICcoZnVuY3Rpb24gKCkge1xcbicsXG4gICAgJyAgdmFyIF9fbCA9ICcgKyBsYXN0ICsgJywgX19sZW4gPSAoX3V0aWxzLmlzQXJyYXkoX19sKSB8fCB0eXBlb2YgX19sID09PSBcInN0cmluZ1wiKSA/IF9fbC5sZW5ndGggOiBfdXRpbHMua2V5cyhfX2wpLmxlbmd0aDtcXG4nLFxuICAgICcgIGlmICghX19sKSB7IHJldHVybjsgfVxcbicsXG4gICAgJyAgICB2YXIgJyArIGN0eGxvb3BjYWNoZSArICcgPSB7IGxvb3A6ICcgKyBjdHhsb29wICsgJywgJyArIHZhbCArICc6ICcgKyBjdHggKyB2YWwgKyAnLCAnICsga2V5ICsgJzogJyArIGN0eCArIGtleSArICcgfTtcXG4nLFxuICAgICcgICAgJyArIGN0eGxvb3AgKyAnID0geyBmaXJzdDogZmFsc2UsIGluZGV4OiAxLCBpbmRleDA6IDAsIHJldmluZGV4OiBfX2xlbiwgcmV2aW5kZXgwOiBfX2xlbiAtIDEsIGxlbmd0aDogX19sZW4sIGxhc3Q6IGZhbHNlIH07XFxuJyxcbiAgICAnICBfdXRpbHMuZWFjaChfX2wsIGZ1bmN0aW9uICgnICsgdmFsICsgJywgJyArIGtleSArICcpIHtcXG4nLFxuICAgICcgICAgJyArIGN0eCArIHZhbCArICcgPSAnICsgdmFsICsgJztcXG4nLFxuICAgICcgICAgJyArIGN0eCArIGtleSArICcgPSAnICsga2V5ICsgJztcXG4nLFxuICAgICcgICAgJyArIGN0eGxvb3AgKyAnLmtleSA9ICcgKyBrZXkgKyAnO1xcbicsXG4gICAgJyAgICAnICsgY3R4bG9vcCArICcuZmlyc3QgPSAoJyArIGN0eGxvb3AgKyAnLmluZGV4MCA9PT0gMCk7XFxuJyxcbiAgICAnICAgICcgKyBjdHhsb29wICsgJy5sYXN0ID0gKCcgKyBjdHhsb29wICsgJy5yZXZpbmRleDAgPT09IDApO1xcbicsXG4gICAgJyAgICAnICsgY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSxcbiAgICAnICAgICcgKyBjdHhsb29wICsgJy5pbmRleCArPSAxOyAnICsgY3R4bG9vcCArICcuaW5kZXgwICs9IDE7ICcgKyBjdHhsb29wICsgJy5yZXZpbmRleCAtPSAxOyAnICsgY3R4bG9vcCArICcucmV2aW5kZXgwIC09IDE7XFxuJyxcbiAgICAnICB9KTtcXG4nLFxuICAgICcgICcgKyBjdHhsb29wICsgJyA9ICcgKyBjdHhsb29wY2FjaGUgKyAnLmxvb3A7XFxuJyxcbiAgICAnICAnICsgY3R4ICsgdmFsICsgJyA9ICcgKyBjdHhsb29wY2FjaGUgKyAnLicgKyB2YWwgKyAnO1xcbicsXG4gICAgJyAgJyArIGN0eCArIGtleSArICcgPSAnICsgY3R4bG9vcGNhY2hlICsgJy4nICsga2V5ICsgJztcXG4nLFxuICAgICcgICcgKyBjdHhsb29wY2FjaGUgKyAnID0gdW5kZWZpbmVkO1xcbicsXG4gICAgJ30pKCk7XFxuJ1xuICBdLmpvaW4oJycpO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMpIHtcbiAgdmFyIGZpcnN0VmFyLCByZWFkeTtcblxuICBwYXJzZXIub24odHlwZXMuTlVNQkVSLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB2YXIgbGFzdFN0YXRlID0gdGhpcy5zdGF0ZS5sZW5ndGggPyB0aGlzLnN0YXRlW3RoaXMuc3RhdGUubGVuZ3RoIC0gMV0gOiBudWxsO1xuICAgIGlmICghcmVhZHkgfHxcbiAgICAgICAgKGxhc3RTdGF0ZSAhPT0gdHlwZXMuQVJSQVlPUEVOICYmXG4gICAgICAgICAgbGFzdFN0YXRlICE9PSB0eXBlcy5DVVJMWU9QRU4gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IHR5cGVzLkNVUkxZQ0xPU0UgJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IHR5cGVzLkZVTkNUSU9OICYmXG4gICAgICAgICAgbGFzdFN0YXRlICE9PSB0eXBlcy5GSUxURVIpXG4gICAgICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIG51bWJlciBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5WQVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmIChyZWFkeSAmJiBmaXJzdFZhcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm91dC5sZW5ndGgpIHtcbiAgICAgIGZpcnN0VmFyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkNPTU1BLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoZmlyc3RWYXIgJiYgdGhpcy5wcmV2VG9rZW4udHlwZSA9PT0gdHlwZXMuVkFSKSB7XG4gICAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkNPTVBBUkFUT1IsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICh0b2tlbi5tYXRjaCAhPT0gJ2luJyB8fCAhZmlyc3RWYXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCB0b2tlbiBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgICB9XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHRoaXMuZmlsdGVyQXBwbHlJZHgucHVzaCh0aGlzLm91dC5sZW5ndGgpO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuZW5kcyA9IHRydWU7XG4iLCIvKipcbiAqIFVzZWQgdG8gY3JlYXRlIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gdGVtcGxhdGVzLiBBY2NlcHRzIG1vc3QgSmF2YVNjcmlwdCB2YWxpZCBjb21wYXJpc29ucy5cbiAqXG4gKiBDYW4gYmUgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIDxhIGhyZWY9XCIjZWxzZWlmXCI+PGNvZGUgZGF0YS1sYW5ndWFnZT1cInN3aWdcIj57JSBlbHNlaWYgLi4uICV9PC9jb2RlPjwvYT4gYW5kIDxhIGhyZWY9XCIjZWxzZVwiPjxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+eyUgZWxzZSAlfTwvY29kZT48L2E+IHRhZ3MuXG4gKlxuICogQGFsaWFzIGlmXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGlmIHggJX17JSBlbmRpZiAlfVxuICogeyUgaWYgIXggJX17JSBlbmRpZiAlfVxuICogeyUgaWYgbm90IHggJX17JSBlbmRpZiAlfVxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiB4IGFuZCB5ICV9eyUgZW5kaWYgJX1cbiAqIHslIGlmIHggJiYgeSAlfXslIGVuZGlmICV9XG4gKiB7JSBpZiB4IG9yIHkgJX17JSBlbmRpZiAlfVxuICogeyUgaWYgeCB8fCB5ICV9eyUgZW5kaWYgJX1cbiAqIHslIGlmIHggfHwgKHkgJiYgeikgJX17JSBlbmRpZiAlfVxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiB4IFtvcGVyYXRvcl0geSAlfVxuICogICBPcGVyYXRvcnM6ID09LCAhPSwgPCwgPD0sID4sID49LCA9PT0sICE9PVxuICogeyUgZW5kaWYgJX1cbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgeCA9PSAnZml2ZScgJX1cbiAqICAgVGhlIG9wZXJhbmRzIGNhbiBiZSBhbHNvIGJlIHN0cmluZyBvciBudW1iZXIgbGl0ZXJhbHNcbiAqIHslIGVuZGlmICV9XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGlmIHh8bG93ZXIgPT09ICd0YWNvcycgJX1cbiAqICAgWW91IGNhbiB1c2UgZmlsdGVycyBvbiBhbnkgb3BlcmFuZCBpbiB0aGUgc3RhdGVtZW50LlxuICogeyUgZW5kaWYgJX1cbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgeCBpbiB5ICV9XG4gKiAgIElmIHggaXMgYSB2YWx1ZSB0aGF0IGlzIHByZXNlbnQgaW4geSwgdGhpcyB3aWxsIHJldHVybiB0cnVlLlxuICogeyUgZW5kaWYgJX1cbiAqXG4gKiBAcGFyYW0gey4uLm1peGVkfSBjb25kaXRpb25hbCBDb25kaXRpb25hbCBzdGF0ZW1lbnQgdGhhdCByZXR1cm5zIGEgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MsIGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkge1xuICByZXR1cm4gJ2lmICgnICsgYXJncy5qb2luKCcgJykgKyAnKSB7IFxcbicgK1xuICAgIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkgKyAnXFxuJyArXG4gICAgJ30nO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMpIHtcbiAgaWYgKHR5cGVvZiBzdHIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGNvbmRpdGlvbmFsIHN0YXRlbWVudCBwcm92aWRlZCBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfVxuXG4gIHBhcnNlci5vbih0eXBlcy5DT01QQVJBVE9SLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAodGhpcy5pc0xhc3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBsb2dpYyBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJldlRva2VuLnR5cGUgPT09IHR5cGVzLk5PVCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgbG9naWMgXCJub3QgJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLiBVc2UgIShmb28gJyArIHRva2VuLm1hdGNoICsgJykgaW5zdGVhZC4nKTtcbiAgICB9XG4gICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgdGhpcy5maWx0ZXJBcHBseUlkeC5wdXNoKHRoaXMub3V0Lmxlbmd0aCk7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5OT1QsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICh0aGlzLmlzTGFzdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIGxvZ2ljIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkJPT0wsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuTE9HSUMsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghdGhpcy5vdXQubGVuZ3RoIHx8IHRoaXMuaXNMYXN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgbG9naWMgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgIHRoaXMuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lbmRzID0gdHJ1ZTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogQWxsb3dzIHlvdSB0byBpbXBvcnQgbWFjcm9zIGZyb20gYW5vdGhlciBmaWxlIGRpcmVjdGx5IGludG8geW91ciBjdXJyZW50IGNvbnRleHQuXG4gKiBUaGUgaW1wb3J0IHRhZyBpcyBzcGVjaWZpY2FsbHkgZGVzaWduZWQgZm9yIGltcG9ydGluZyBtYWNyb3MgaW50byB5b3VyIHRlbXBsYXRlIHdpdGggYSBzcGVjaWZpYyBjb250ZXh0IHNjb3BlLiBUaGlzIGlzIHZlcnkgdXNlZnVsIGZvciBrZWVwaW5nIHlvdXIgbWFjcm9zIGZyb20gb3ZlcnJpZGluZyB0ZW1wbGF0ZSBjb250ZXh0IHRoYXQgaXMgYmVpbmcgaW5qZWN0ZWQgYnkgeW91ciBzZXJ2ZXItc2lkZSBwYWdlIGdlbmVyYXRpb24uXG4gKlxuICogQGFsaWFzIGltcG9ydFxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpbXBvcnQgJy4vZm9ybW1hY3Jvcy5odG1sJyBhcyBmb3JtcyAlfVxuICoge3sgZm9ybS5pbnB1dChcInRleHRcIiwgXCJuYW1lXCIpIH19XG4gKiAvLyA9PiA8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwibmFtZVwiPlxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpbXBvcnQgXCIuLi9zaGFyZWQvdGFncy5odG1sXCIgYXMgdGFncyAlfVxuICoge3sgdGFncy5zdHlsZXNoZWV0KCdnbG9iYWwnKSB9fVxuICogLy8gPT4gPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCIvZ2xvYmFsLmNzc1wiPlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfHZhcn0gIGZpbGUgICAgICBSZWxhdGl2ZSBwYXRoIGZyb20gdGhlIGN1cnJlbnQgdGVtcGxhdGUgZmlsZSB0byB0aGUgZmlsZSB0byBpbXBvcnQgbWFjcm9zIGZyb20uXG4gKiBAcGFyYW0ge2xpdGVyYWx9ICAgICBhcyAgICAgICAgTGl0ZXJhbGx5LCBcImFzXCIuXG4gKiBAcGFyYW0ge2xpdGVyYWx9ICAgICB2YXJuYW1lICAgTG9jYWwtYWNjZXNzaWJsZSBvYmplY3QgbmFtZSB0byBhc3NpZ24gdGhlIG1hY3JvcyB0by5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzKSB7XG4gIHZhciBjdHggPSBhcmdzLnBvcCgpLFxuICAgIG91dCA9ICdfY3R4LicgKyBjdHggKyAnID0ge307XFxuICB2YXIgX291dHB1dCA9IFwiXCI7XFxuJyxcbiAgICByZXBsYWNlbWVudHMgPSB1dGlscy5tYXAoYXJncywgZnVuY3Rpb24gKGFyZykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXg6IG5ldyBSZWdFeHAoJ19jdHguJyArIGFyZy5uYW1lLCAnZycpLFxuICAgICAgICByZTogJ19jdHguJyArIGN0eCArICcuJyArIGFyZy5uYW1lXG4gICAgICB9O1xuICAgIH0pO1xuXG4gIC8vIFJlcGxhY2UgYWxsIG9jY3VycmVuY2VzIG9mIGFsbCBtYWNyb3MgaW4gdGhpcyBmaWxlIHdpdGhcbiAgLy8gcHJvcGVyIG5hbWVzcGFjZWQgZGVmaW5pdGlvbnMgYW5kIGNhbGxzXG4gIHV0aWxzLmVhY2goYXJncywgZnVuY3Rpb24gKGFyZykge1xuICAgIHZhciBjID0gYXJnLmNvbXBpbGVkO1xuICAgIHV0aWxzLmVhY2gocmVwbGFjZW1lbnRzLCBmdW5jdGlvbiAocmUpIHtcbiAgICAgIGMgPSBjLnJlcGxhY2UocmUuZXgsIHJlLnJlKTtcbiAgICB9KTtcbiAgICBvdXQgKz0gYztcbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBzdGFjaywgb3B0cywgc3dpZykge1xuICB2YXIgY29tcGlsZXIgPSByZXF1aXJlKCcuLi9wYXJzZXInKS5jb21waWxlLFxuICAgIHBhcnNlT3B0cyA9IHsgcmVzb2x2ZUZyb206IG9wdHMuZmlsZW5hbWUgfSxcbiAgICBjb21waWxlT3B0cyA9IHV0aWxzLmV4dGVuZCh7fSwgb3B0cywgcGFyc2VPcHRzKSxcbiAgICB0b2tlbnMsXG4gICAgY3R4O1xuXG4gIHBhcnNlci5vbih0eXBlcy5TVFJJTkcsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIXRva2Vucykge1xuICAgICAgdG9rZW5zID0gc3dpZy5wYXJzZUZpbGUodG9rZW4ubWF0Y2gucmVwbGFjZSgvXihcInwnKXwoXCJ8JykkL2csICcnKSwgcGFyc2VPcHRzKS50b2tlbnM7XG4gICAgICB1dGlscy5lYWNoKHRva2VucywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIHZhciBvdXQgPSAnJyxcbiAgICAgICAgICBtYWNyb05hbWU7XG4gICAgICAgIGlmICghdG9rZW4gfHwgdG9rZW4ubmFtZSAhPT0gJ21hY3JvJyB8fCAhdG9rZW4uY29tcGlsZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBtYWNyb05hbWUgPSB0b2tlbi5hcmdzWzBdO1xuICAgICAgICBvdXQgKz0gdG9rZW4uY29tcGlsZShjb21waWxlciwgdG9rZW4uYXJncywgdG9rZW4uY29udGVudCwgW10sIGNvbXBpbGVPcHRzKSArICdcXG4nO1xuICAgICAgICBzZWxmLm91dC5wdXNoKHtjb21waWxlZDogb3V0LCBuYW1lOiBtYWNyb05hbWV9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBzdHJpbmcgJyArIHRva2VuLm1hdGNoICsgJyBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlZBUiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghdG9rZW5zIHx8IGN0eCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHZhcmlhYmxlIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cblxuICAgIGlmICh0b2tlbi5tYXRjaCA9PT0gJ2FzJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGN0eCA9IHRva2VuLm1hdGNoO1xuICAgIHNlbGYub3V0LnB1c2goY3R4KTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5ibG9jayA9IHRydWU7XG4iLCJ2YXIgaWdub3JlID0gJ2lnbm9yZScsXG4gIG1pc3NpbmcgPSAnbWlzc2luZycsXG4gIG9ubHkgPSAnb25seSc7XG5cbi8qKlxuICogSW5jbHVkZXMgYSB0ZW1wbGF0ZSBwYXJ0aWFsIGluIHBsYWNlLiBUaGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgd2l0aGluIHRoZSBjdXJyZW50IGxvY2FscyB2YXJpYWJsZSBjb250ZXh0LlxuICpcbiAqIEBhbGlhcyBpbmNsdWRlXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGZvb2QgPSAnYnVycml0b3MnO1xuICogLy8gZHJpbmsgPSAnbGVtb25hZGUnO1xuICogeyUgaW5jbHVkZSBcIi4vcGFydGlhbC5odG1sXCIgJX1cbiAqIC8vID0+IEkgbGlrZSBidXJyaXRvcyBhbmQgbGVtb25hZGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X29iaiA9IHsgZm9vZDogJ3RhY29zJywgZHJpbms6ICdob3JjaGF0YScgfTtcbiAqIHslIGluY2x1ZGUgXCIuL3BhcnRpYWwuaHRtbFwiIHdpdGggbXlfb2JqIG9ubHkgJX1cbiAqIC8vID0+IEkgbGlrZSB0YWNvcyBhbmQgaG9yY2hhdGEuXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGluY2x1ZGUgXCIvdGhpcy9maWxlL2RvZXMvbm90L2V4aXN0XCIgaWdub3JlIG1pc3NpbmcgJX1cbiAqIC8vID0+IChOb3RoaW5nISBlbXB0eSBzdHJpbmcpXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8dmFyfSAgZmlsZSAgICAgIFRoZSBwYXRoLCByZWxhdGl2ZSB0byB0aGUgdGVtcGxhdGUgcm9vdCwgdG8gcmVuZGVyIGludG8gdGhlIGN1cnJlbnQgY29udGV4dC5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gICAgIFt3aXRoXSAgICBMaXRlcmFsbHksIFwid2l0aFwiLlxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgW2NvbnRleHRdIExvY2FsIHZhcmlhYmxlIGtleS12YWx1ZSBvYmplY3QgY29udGV4dCB0byBwcm92aWRlIHRvIHRoZSBpbmNsdWRlZCBmaWxlLlxuICogQHBhcmFtIHtsaXRlcmFsfSAgICAgW29ubHldICAgIFJlc3RyaWN0cyB0byA8c3Ryb25nPm9ubHk8L3N0cm9uZz4gcGFzc2luZyB0aGUgPGNvZGU+d2l0aCBjb250ZXh0PC9jb2RlPiBhcyBsb2NhbCB2YXJpYWJsZXPigJN0aGUgaW5jbHVkZWQgdGVtcGxhdGUgd2lsbCBub3QgYmUgYXdhcmUgb2YgYW55IG90aGVyIGxvY2FsIHZhcmlhYmxlcyBpbiB0aGUgcGFyZW50IHRlbXBsYXRlLiBGb3IgYmVzdCBwZXJmb3JtYW5jZSwgdXNhZ2Ugb2YgdGhpcyBvcHRpb24gaXMgcmVjb21tZW5kZWQgaWYgcG9zc2libGUuXG4gKiBAcGFyYW0ge2xpdGVyYWx9ICAgICBbaWdub3JlIG1pc3NpbmddIFdpbGwgb3V0cHV0IGVtcHR5IHN0cmluZyBpZiBub3QgZm91bmQgaW5zdGVhZCBvZiB0aHJvd2luZyBhbiBlcnJvci5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzKSB7XG4gIHZhciBmaWxlID0gYXJncy5zaGlmdCgpLFxuICAgIG9ubHlJZHggPSBhcmdzLmluZGV4T2Yob25seSksXG4gICAgb25seUN0eCA9IG9ubHlJZHggIT09IC0xID8gYXJncy5zcGxpY2Uob25seUlkeCwgMSkgOiBmYWxzZSxcbiAgICBwYXJlbnRGaWxlID0gKGFyZ3MucG9wKCkgfHwgJycpLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJyksXG4gICAgaWdub3JlID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSBtaXNzaW5nID8gKGFyZ3MucG9wKCkpIDogZmFsc2UsXG4gICAgdyA9IGFyZ3Muam9pbignJyk7XG5cbiAgcmV0dXJuIChpZ25vcmUgPyAnICB0cnkge1xcbicgOiAnJykgK1xuICAgICdfb3V0cHV0ICs9IF9zd2lnLmNvbXBpbGVGaWxlKCcgKyBmaWxlICsgJywgeycgK1xuICAgICdyZXNvbHZlRnJvbTogXCInICsgcGFyZW50RmlsZSArICdcIicgK1xuICAgICd9KSgnICtcbiAgICAoKG9ubHlDdHggJiYgdykgPyB3IDogKCF3ID8gJ19jdHgnIDogJ191dGlscy5leHRlbmQoe30sIF9jdHgsICcgKyB3ICsgJyknKSkgK1xuICAgICcpO1xcbicgK1xuICAgIChpZ25vcmUgPyAnfSBjYXRjaCAoZSkge31cXG4nIDogJycpO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrLCBvcHRzKSB7XG4gIHZhciBmaWxlLCB3O1xuICBwYXJzZXIub24odHlwZXMuU1RSSU5HLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIWZpbGUpIHtcbiAgICAgIGZpbGUgPSB0b2tlbi5tYXRjaDtcbiAgICAgIHRoaXMub3V0LnB1c2goZmlsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5WQVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghZmlsZSkge1xuICAgICAgZmlsZSA9IHRva2VuLm1hdGNoO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCF3ICYmIHRva2VuLm1hdGNoID09PSAnd2l0aCcpIHtcbiAgICAgIHcgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh3ICYmIHRva2VuLm1hdGNoID09PSBvbmx5ICYmIHRoaXMucHJldlRva2VuLm1hdGNoICE9PSAnd2l0aCcpIHtcbiAgICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0b2tlbi5tYXRjaCA9PT0gaWdub3JlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLm1hdGNoID09PSBtaXNzaW5nKSB7XG4gICAgICBpZiAodGhpcy5wcmV2VG9rZW4ubWF0Y2ggIT09IGlnbm9yZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgdG9rZW4gXCInICsgbWlzc2luZyArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgICAgIH1cbiAgICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByZXZUb2tlbi5tYXRjaCA9PT0gaWdub3JlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIFwiJyArIG1pc3NpbmcgKyAnXCIgb24gbGluZSAnICsgbGluZSArICcgYnV0IGZvdW5kIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiLicpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm91dC5wdXNoKG9wdHMuZmlsZW5hbWUgfHwgbnVsbCk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsImV4cG9ydHMuYXV0b2VzY2FwZSA9IHJlcXVpcmUoJy4vYXV0b2VzY2FwZScpO1xuZXhwb3J0cy5ibG9jayA9IHJlcXVpcmUoJy4vYmxvY2snKTtcbmV4cG9ydHNbXCJlbHNlXCJdID0gcmVxdWlyZSgnLi9lbHNlJyk7XG5leHBvcnRzLmVsc2VpZiA9IHJlcXVpcmUoJy4vZWxzZWlmJyk7XG5leHBvcnRzLmVsaWYgPSBleHBvcnRzLmVsc2VpZjtcbmV4cG9ydHNbXCJleHRlbmRzXCJdID0gcmVxdWlyZSgnLi9leHRlbmRzJyk7XG5leHBvcnRzLmZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyJyk7XG5leHBvcnRzW1wiZm9yXCJdID0gcmVxdWlyZSgnLi9mb3InKTtcbmV4cG9ydHNbXCJpZlwiXSA9IHJlcXVpcmUoJy4vaWYnKTtcbmV4cG9ydHNbXCJpbXBvcnRcIl0gPSByZXF1aXJlKCcuL2ltcG9ydCcpO1xuZXhwb3J0cy5pbmNsdWRlID0gcmVxdWlyZSgnLi9pbmNsdWRlJyk7XG5leHBvcnRzLm1hY3JvID0gcmVxdWlyZSgnLi9tYWNybycpO1xuZXhwb3J0cy5wYXJlbnQgPSByZXF1aXJlKCcuL3BhcmVudCcpO1xuZXhwb3J0cy5yYXcgPSByZXF1aXJlKCcuL3JhdycpO1xuZXhwb3J0cy5zZXQgPSByZXF1aXJlKCcuL3NldCcpO1xuZXhwb3J0cy5zcGFjZWxlc3MgPSByZXF1aXJlKCcuL3NwYWNlbGVzcycpO1xuIiwiLyoqXG4gKiBDcmVhdGUgY3VzdG9tLCByZXVzYWJsZSBzbmlwcGV0cyB3aXRoaW4geW91ciB0ZW1wbGF0ZXMuXG4gKiBDYW4gYmUgaW1wb3J0ZWQgZnJvbSBvbmUgdGVtcGxhdGUgdG8gYW5vdGhlciB1c2luZyB0aGUgPGEgaHJlZj1cIiNpbXBvcnRcIj48Y29kZSBkYXRhLWxhbmd1YWdlPVwic3dpZ1wiPnslIGltcG9ydCAuLi4gJX08L2NvZGU+PC9hPiB0YWcuXG4gKlxuICogQGFsaWFzIG1hY3JvXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIG1hY3JvIGlucHV0KHR5cGUsIG5hbWUsIGlkLCBsYWJlbCwgdmFsdWUsIGVycm9yKSAlfVxuICogICA8bGFiZWwgZm9yPVwie3sgbmFtZSB9fVwiPnt7IGxhYmVsIH19PC9sYWJlbD5cbiAqICAgPGlucHV0IHR5cGU9XCJ7eyB0eXBlIH19XCIgbmFtZT1cInt7IG5hbWUgfX1cIiBpZD1cInt7IGlkIH19XCIgdmFsdWU9XCJ7eyB2YWx1ZSB9fVwieyUgaWYgZXJyb3IgJX0gY2xhc3M9XCJlcnJvclwieyUgZW5kaWYgJX0+XG4gKiB7JSBlbmRtYWNybyAlfVxuICpcbiAqIHt7IGlucHV0KFwidGV4dFwiLCBcImZuYW1lXCIsIFwiZm5hbWVcIiwgXCJGaXJzdCBOYW1lXCIsIGZuYW1lLnZhbHVlLCBmbmFtZS5lcnJvcnMpIH19XG4gKiAvLyA9PiA8bGFiZWwgZm9yPVwiZm5hbWVcIj5GaXJzdCBOYW1lPC9sYWJlbD5cbiAqIC8vICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJmbmFtZVwiIGlkPVwiZm5hbWVcIiB2YWx1ZT1cIlwiPlxuICpcbiAqIEBwYXJhbSB7Li4uYXJndW1lbnRzfSBhcmd1bWVudHMgIFVzZXItZGVmaW5lZCBhcmd1bWVudHMuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHZhciBmbk5hbWUgPSBhcmdzLnNoaWZ0KCk7XG5cbiAgcmV0dXJuICdfY3R4LicgKyBmbk5hbWUgKyAnID0gZnVuY3Rpb24gKCcgKyBhcmdzLmpvaW4oJycpICsgJykge1xcbicgK1xuICAgICcgIHZhciBfb3V0cHV0ID0gXCJcIixcXG4nICtcbiAgICAnICAgIF9fY3R4ID0gX3V0aWxzLmV4dGVuZCh7fSwgX2N0eCk7XFxuJyArXG4gICAgJyAgX3V0aWxzLmVhY2goX2N0eCwgZnVuY3Rpb24gKHYsIGspIHtcXG4nICtcbiAgICAnICAgIGlmIChbXCInICsgYXJncy5qb2luKCdcIixcIicpICsgJ1wiXS5pbmRleE9mKGspICE9PSAtMSkgeyBkZWxldGUgX2N0eFtrXTsgfVxcbicgK1xuICAgICcgIH0pO1xcbicgK1xuICAgIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkgKyAnXFxuJyArXG4gICAgJyBfY3R4ID0gX3V0aWxzLmV4dGVuZChfY3R4LCBfX2N0eCk7XFxuJyArXG4gICAgJyAgcmV0dXJuIF9vdXRwdXQ7XFxuJyArXG4gICAgJ307XFxuJyArXG4gICAgJ19jdHguJyArIGZuTmFtZSArICcuc2FmZSA9IHRydWU7XFxuJztcbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzKSB7XG4gIHZhciBuYW1lO1xuXG4gIHBhcnNlci5vbih0eXBlcy5WQVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICh0b2tlbi5tYXRjaC5pbmRleE9mKCcuJykgIT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgZG90IGluIG1hY3JvIGFyZ3VtZW50IFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkZVTkNUSU9OLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIG5hbWUgPSB0b2tlbi5tYXRjaDtcbiAgICAgIHRoaXMub3V0LnB1c2gobmFtZSk7XG4gICAgICB0aGlzLnN0YXRlLnB1c2godHlwZXMuRlVOQ1RJT04pO1xuICAgIH1cbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkZVTkNUSU9ORU1QVFksIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghbmFtZSkge1xuICAgICAgbmFtZSA9IHRva2VuLm1hdGNoO1xuICAgICAgdGhpcy5vdXQucHVzaChuYW1lKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5QQVJFTkNMT1NFLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNMYXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBwYXJlbnRoZXNpcyBjbG9zZSBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkNPTU1BLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbignKicsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm47XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lbmRzID0gdHJ1ZTtcbmV4cG9ydHMuYmxvY2sgPSB0cnVlO1xuIiwiLyoqXG4gKiBJbmplY3QgdGhlIGNvbnRlbnQgZnJvbSB0aGUgcGFyZW50IHRlbXBsYXRlJ3MgYmxvY2sgb2YgdGhlIHNhbWUgbmFtZSBpbnRvIHRoZSBjdXJyZW50IGJsb2NrLlxuICpcbiAqIFNlZSA8YSBocmVmPVwiI2luaGVyaXRhbmNlXCI+VGVtcGxhdGUgSW5oZXJpdGFuY2U8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqIEBhbGlhcyBwYXJlbnRcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgZXh0ZW5kcyBcIi4vZm9vLmh0bWxcIiAlfVxuICogeyUgYmxvY2sgY29udGVudCAlfVxuICogICBNeSBjb250ZW50LlxuICogICB7JSBwYXJlbnQgJX1cbiAqIHslIGVuZGJsb2NrICV9XG4gKlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MsIGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkge1xuICBpZiAoIXBhcmVudHMgfHwgIXBhcmVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgdmFyIHBhcmVudEZpbGUgPSBhcmdzWzBdLFxuICAgIGJyZWFrZXIgPSB0cnVlLFxuICAgIGwgPSBwYXJlbnRzLmxlbmd0aCxcbiAgICBpID0gMCxcbiAgICBwYXJlbnQsXG4gICAgYmxvY2s7XG5cbiAgZm9yIChpOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgcGFyZW50ID0gcGFyZW50c1tpXTtcbiAgICBpZiAoIXBhcmVudC5ibG9ja3MgfHwgIXBhcmVudC5ibG9ja3MuaGFzT3duUHJvcGVydHkoYmxvY2tOYW1lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIFNpbGx5IEpTTGludCBcIlN0cmFuZ2UgTG9vcFwiIHJlcXVpcmVzIHJldHVybiB0byBiZSBpbiBhIGNvbmRpdGlvbmFsXG4gICAgaWYgKGJyZWFrZXIgJiYgcGFyZW50RmlsZSAhPT0gcGFyZW50Lm5hbWUpIHtcbiAgICAgIGJsb2NrID0gcGFyZW50LmJsb2Nrc1tibG9ja05hbWVdO1xuICAgICAgcmV0dXJuIGJsb2NrLmNvbXBpbGUoY29tcGlsZXIsIFtibG9ja05hbWVdLCBibG9jay5jb250ZW50LCBwYXJlbnRzLnNsaWNlKGkgKyAxKSwgb3B0aW9ucykgKyAnXFxuJztcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzLCBzdGFjaywgb3B0cykge1xuICBwYXJzZXIub24oJyonLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgYXJndW1lbnQgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gIH0pO1xuXG4gIHBhcnNlci5vbignZW5kJywgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub3V0LnB1c2gob3B0cy5maWxlbmFtZSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIE1hZ2ljIHRhZywgaGFyZGNvZGVkIGludG8gcGFyc2VyXG5cbi8qKlxuICogRm9yY2VzIHRoZSBjb250ZW50IHRvIG5vdCBiZSBhdXRvLWVzY2FwZWQuIEFsbCBzd2lnIGluc3RydWN0aW9ucyB3aWxsIGJlIGlnbm9yZWQgYW5kIHRoZSBjb250ZW50IHdpbGwgYmUgcmVuZGVyZWQgZXhhY3RseSBhcyBpdCB3YXMgZ2l2ZW4uXG4gKlxuICogQGFsaWFzIHJhd1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBmb29iYXIgPSAnPHA+J1xuICogeyUgcmF3ICV9e3sgZm9vYmFyIH19eyUgZW5kcmF3ICV9XG4gKiAvLyA9PiB7eyBmb29iYXIgfX1cbiAqXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHJldHVybiBjb21waWxlcihjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpO1xufTtcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIpIHtcbiAgcGFyc2VyLm9uKCcqJywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHRva2VuIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIGluIHJhdyB0YWcgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuIiwiLyoqXG4gKiBTZXQgYSB2YXJpYWJsZSBmb3IgcmUtdXNlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuIFRoaXMgd2lsbCBvdmVyLXdyaXRlIGFueSB2YWx1ZSBhbHJlYWR5IHNldCB0byB0aGUgY29udGV4dCBmb3IgdGhlIGdpdmVuIDx2YXI+dmFybmFtZTwvdmFyPi5cbiAqXG4gKiBAYWxpYXMgc2V0XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIHNldCBmb28gPSBcImFueXRoaW5nIVwiICV9XG4gKiB7eyBmb28gfX1cbiAqIC8vID0+IGFueXRoaW5nIVxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBpbmRleCA9IDI7XG4gKiB7JSBzZXQgYmFyID0gMSAlfVxuICogeyUgc2V0IGJhciArPSBpbmRleHxkZWZhdWx0KDMpICV9XG4gKiAvLyA9PiAzXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGZvb2RzID0ge307XG4gKiAvLyBmb29kID0gJ2NoaWxpJztcbiAqIHslIHNldCBmb29kc1tmb29kXSA9IFwiY29uIHF1ZXNvXCIgJX1cbiAqIHt7IGZvb2RzLmNoaWxpIH19XG4gKiAvLyA9PiBjb24gcXVlc29cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gZm9vZHMgPSB7IGNoaWxpOiAnY2hpbGkgY29uIHF1ZXNvJyB9XG4gKiB7JSBzZXQgZm9vZHMuY2hpbGkgPSBcImd1YXRhbWFsYW4gaW5zYW5pdHkgcGVwcGVyXCIgJX1cbiAqIHt7IGZvb2RzLmNoaWxpIH19XG4gKiAvLyA9PiBndWF0YW1hbGFuIGluc2FuaXR5IHBlcHBlclxuICpcbiAqIEBwYXJhbSB7bGl0ZXJhbH0gdmFybmFtZSAgIFRoZSB2YXJpYWJsZSBuYW1lIHRvIGFzc2lnbiB0aGUgdmFsdWUgdG8uXG4gKiBAcGFyYW0ge2xpdGVyYWx9IGFzc2lnbmVtZW50ICAgQW55IHZhbGlkIEphdmFTY3JpcHQgYXNzaWduZW1lbnQuIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPj0sICs9LCAqPSwgLz0sIC09PC9jb2RlPlxuICogQHBhcmFtIHsqfSAgIHZhbHVlICAgICBWYWxpZCB2YXJpYWJsZSBvdXRwdXQuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncykge1xuICByZXR1cm4gYXJncy5qb2luKCcgJykgKyAnO1xcbic7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcykge1xuICB2YXIgbmFtZVNldCA9ICcnLFxuICAgIHByb3BlcnR5TmFtZTtcblxuICBwYXJzZXIub24odHlwZXMuVkFSLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAocHJvcGVydHlOYW1lKSB7XG4gICAgICAvLyBUZWxsIHRoZSBwYXJzZXIgd2hlcmUgdG8gZmluZCB0aGUgdmFyaWFibGVcbiAgICAgIHByb3BlcnR5TmFtZSArPSAnX2N0eC4nICsgdG9rZW4ubWF0Y2g7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFwYXJzZXIub3V0Lmxlbmd0aCkge1xuICAgICAgbmFtZVNldCArPSB0b2tlbi5tYXRjaDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkJSQUNLRVRPUEVOLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIXByb3BlcnR5TmFtZSAmJiAhdGhpcy5vdXQubGVuZ3RoKSB7XG4gICAgICBwcm9wZXJ0eU5hbWUgPSB0b2tlbi5tYXRjaDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlNUUklORywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHByb3BlcnR5TmFtZSAmJiAhdGhpcy5vdXQubGVuZ3RoKSB7XG4gICAgICBwcm9wZXJ0eU5hbWUgKz0gdG9rZW4ubWF0Y2g7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5CUkFDS0VUQ0xPU0UsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmIChwcm9wZXJ0eU5hbWUgJiYgIXRoaXMub3V0Lmxlbmd0aCkge1xuICAgICAgbmFtZVNldCArPSBwcm9wZXJ0eU5hbWUgKyB0b2tlbi5tYXRjaDtcbiAgICAgIHByb3BlcnR5TmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkRPVEtFWSwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCFwcm9wZXJ0eU5hbWUgJiYgIW5hbWVTZXQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBuYW1lU2V0ICs9ICcuJyArIHRva2VuLm1hdGNoO1xuICAgIHJldHVybjtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkFTU0lHTk1FTlQsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICh0aGlzLm91dC5sZW5ndGggfHwgIW5hbWVTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBhc3NpZ25tZW50IFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cblxuICAgIHRoaXMub3V0LnB1c2goXG4gICAgICAvLyBQcmV2ZW50IHRoZSBzZXQgZnJvbSBzcGlsbGluZyBpbnRvIGdsb2JhbCBzY29wZVxuICAgICAgJ19jdHguJyArIG5hbWVTZXRcbiAgICApO1xuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgIHRoaXMuZmlsdGVyQXBwbHlJZHgucHVzaCh0aGlzLm91dC5sZW5ndGgpO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuYmxvY2sgPSB0cnVlO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBBdHRlbXB0cyB0byByZW1vdmUgd2hpdGVzcGFjZSBiZXR3ZWVuIEhUTUwgdGFncy4gVXNlIGF0IHlvdXIgb3duIHJpc2suXG4gKlxuICogQGFsaWFzIHNwYWNlbGVzc1xuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBzcGFjZWxlc3MgJX1cbiAqICAgeyUgZm9yIG51bSBpbiBmb28gJX1cbiAqICAgPGxpPnt7IGxvb3AuaW5kZXggfX08L2xpPlxuICogICB7JSBlbmRmb3IgJX1cbiAqIHslIGVuZHNwYWNlbGVzcyAlfVxuICogLy8gPT4gPGxpPjE8L2xpPjxsaT4yPC9saT48bGk+MzwvbGk+XG4gKlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MsIGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkge1xuICBmdW5jdGlvbiBzdHJpcFdoaXRlc3BhY2UodG9rZW5zKSB7XG4gICAgcmV0dXJuIHV0aWxzLm1hcCh0b2tlbnMsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgaWYgKHRva2VuLmNvbnRlbnQgfHwgdHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gc3RyaXBXaGl0ZXNwYWNlKHRva2VuLmNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0b2tlbi5yZXBsYWNlKC9eXFxzKy8sICcnKVxuICAgICAgICAucmVwbGFjZSgvPlxccys8L2csICc+PCcpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBjb21waWxlcihzdHJpcFdoaXRlc3BhY2UoY29udGVudCksIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSk7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyKSB7XG4gIHBhcnNlci5vbignKicsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCB0b2tlbiBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuIiwidmFyIGlzQXJyYXk7XG5cbi8qKlxuICogU3RyaXAgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSBmcm9tIGEgc3RyaW5nLlxuICogQHBhcmFtICB7c3RyaW5nfSBpbnB1dFxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICBTdHJpcHBlZCBpbnB1dC5cbiAqL1xuZXhwb3J0cy5zdHJpcCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xufTtcblxuLyoqXG4gKiBUZXN0IGlmIGEgc3RyaW5nIHN0YXJ0cyB3aXRoIGEgZ2l2ZW4gcHJlZml4LlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHIgICAgU3RyaW5nIHRvIHRlc3QgYWdhaW5zdC5cbiAqIEBwYXJhbSAge3N0cmluZ30gcHJlZml4IFByZWZpeCB0byBjaGVjayBmb3IuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnRzLnN0YXJ0c1dpdGggPSBmdW5jdGlvbiAoc3RyLCBwcmVmaXgpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKHByZWZpeCkgPT09IDA7XG59O1xuXG4vKipcbiAqIFRlc3QgaWYgYSBzdHJpbmcgZW5kcyB3aXRoIGEgZ2l2ZW4gc3VmZml4LlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHIgICAgU3RyaW5nIHRvIHRlc3QgYWdhaW5zdC5cbiAqIEBwYXJhbSAge3N0cmluZ30gc3VmZml4IFN1ZmZpeCB0byBjaGVjayBmb3IuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnRzLmVuZHNXaXRoID0gZnVuY3Rpb24gKHN0ciwgc3VmZml4KSB7XG4gIHJldHVybiBzdHIuaW5kZXhPZihzdWZmaXgsIHN0ci5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIEl0ZXJhdGUgb3ZlciBhbiBhcnJheSBvciBvYmplY3QuXG4gKiBAcGFyYW0gIHthcnJheXxvYmplY3R9IG9iaiBFbnVtZXJhYmxlIG9iamVjdC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgZm4gIENhbGxiYWNrIGZ1bmN0aW9uIGV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0uXG4gKiBAcmV0dXJuIHthcnJheXxvYmplY3R9ICAgICBUaGUgb3JpZ2luYWwgaW5wdXQgb2JqZWN0LlxuICovXG5leHBvcnRzLmVhY2ggPSBmdW5jdGlvbiAob2JqLCBmbikge1xuICB2YXIgaSwgbDtcblxuICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgaSA9IDA7XG4gICAgbCA9IG9iai5sZW5ndGg7XG4gICAgZm9yIChpOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICBpZiAoZm4ob2JqW2ldLCBpLCBvYmopID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpIGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICBpZiAoZm4ob2JqW2ldLCBpLCBvYmopID09PSBmYWxzZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogVGVzdCBpZiBhbiBvYmplY3QgaXMgYW4gQXJyYXkuXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5ID0gKEFycmF5Lmhhc093blByb3BlcnR5KCdpc0FycmF5JykpID8gQXJyYXkuaXNBcnJheSA6IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIChvYmopID8gKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLmluZGV4T2YoKSAhPT0gLTEpIDogZmFsc2U7XG59O1xuXG4vKipcbiAqIFRlc3QgaWYgYW4gaXRlbSBpbiBhbiBlbnVtZXJhYmxlIG1hdGNoZXMgeW91ciBjb25kaXRpb25zLlxuICogQHBhcmFtICB7YXJyYXl8b2JqZWN0fSAgIG9iaiAgIEVudW1lcmFibGUgb2JqZWN0LlxuICogQHBhcmFtICB7RnVuY3Rpb259ICAgICAgIGZuICAgIEV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0uIFJldHVybiB0cnVlIGlmIHlvdXIgY29uZGl0aW9uIGlzIG1ldC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydHMuc29tZSA9IGZ1bmN0aW9uIChvYmosIGZuKSB7XG4gIHZhciBpID0gMCxcbiAgICByZXN1bHQsXG4gICAgbDtcbiAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgIGwgPSBvYmoubGVuZ3RoO1xuXG4gICAgZm9yIChpOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICByZXN1bHQgPSBmbihvYmpbaV0sIGksIG9iaik7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBleHBvcnRzLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG4gICAgICByZXN1bHQgPSBmbih2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICByZXR1cm4gIShyZXN1bHQpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiAhIXJlc3VsdDtcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbmV3IGVudW1lcmFibGUsIG1hcHBlZCBieSBhIGdpdmVuIGl0ZXJhdGlvbiBmdW5jdGlvbi5cbiAqIEBwYXJhbSAge29iamVjdH0gICBvYmogRW51bWVyYWJsZSBvYmplY3QuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gIEV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0uIFJldHVybiB0aGUgaXRlbSB0byByZXBsYWNlIHRoZSBvcmlnaW5hbCBpdGVtIHdpdGguXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIE5ldyBtYXBwZWQgb2JqZWN0LlxuICovXG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uIChvYmosIGZuKSB7XG4gIHZhciBpID0gMCxcbiAgICByZXN1bHQgPSBbXSxcbiAgICBsO1xuXG4gIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICBsID0gb2JqLmxlbmd0aDtcbiAgICBmb3IgKGk7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgIHJlc3VsdFtpXSA9IGZuKG9ialtpXSwgaSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gZm4ob2JqW2ldLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ29weSBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhlIHNvdXJjZSBvYmplY3RzIG92ZXIgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCwgYW5kIHJldHVybiB0aGUgZGVzdGluYXRpb24gb2JqZWN0LiBJdCdzIGluLW9yZGVyLCBzbyB0aGUgbGFzdCBzb3VyY2Ugd2lsbCBvdmVycmlkZSBwcm9wZXJ0aWVzIG9mIHRoZSBzYW1lIG5hbWUgaW4gcHJldmlvdXMgYXJndW1lbnRzLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IGFyZ3VtZW50c1xuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5leHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgdGFyZ2V0ID0gYXJnc1swXSxcbiAgICBvYmpzID0gKGFyZ3MubGVuZ3RoID4gMSkgPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSA6IFtdLFxuICAgIGkgPSAwLFxuICAgIGwgPSBvYmpzLmxlbmd0aCxcbiAgICBrZXksXG4gICAgb2JqO1xuXG4gIGZvciAoaTsgaSA8IGw7IGkgKz0gMSkge1xuICAgIG9iaiA9IG9ianNbaV0gfHwge307XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8qKlxuICogR2V0IGFsbCBvZiB0aGUga2V5cyBvbiBhbiBvYmplY3QuXG4gKiBAcGFyYW0gIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7YXJyYXl9XG4gKi9cbmV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKCFvYmopIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoT2JqZWN0LmtleXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKTtcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzLm1hcChvYmosIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgcmV0dXJuIGs7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBUaHJvdyBhbiBlcnJvciB3aXRoIHBvc3NpYmxlIGxpbmUgbnVtYmVyIGFuZCBzb3VyY2UgZmlsZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gbWVzc2FnZSBFcnJvciBtZXNzYWdlXG4gKiBAcGFyYW0gIHtudW1iZXJ9IFtsaW5lXSAgTGluZSBudW1iZXIgaW4gdGVtcGxhdGUuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IFtmaWxlXSAgVGVtcGxhdGUgZmlsZSB0aGUgZXJyb3Igb2NjdXJlZCBpbi5cbiAqIEB0aHJvd3Mge0Vycm9yfSBObyBzZXJpb3VzbHksIHRoZSBwb2ludCBpcyB0byB0aHJvdyBhbiBlcnJvci5cbiAqL1xuZXhwb3J0cy50aHJvd0Vycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGxpbmUsIGZpbGUpIHtcbiAgaWYgKGxpbmUpIHtcbiAgICBtZXNzYWdlICs9ICcgb24gbGluZSAnICsgbGluZTtcbiAgfVxuICBpZiAoZmlsZSkge1xuICAgIG1lc3NhZ2UgKz0gJyBpbiBmaWxlICcgKyBmaWxlO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihtZXNzYWdlICsgJy4nKTtcbn07XG4iLCJ2YXIgcHVic3ViID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvcHVic3ViJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vYXBwbGljYXRpb24udmlldycpO1xudmFyIHByb2plY3RzTGlzdCA9IHJlcXVpcmUoJy4vcHJvamVjdHMtbGlzdC9wcm9qZWN0cy1saXN0LmNvbnRyb2xsZXInKTtcbnZhciBwcm9qZWN0RGlzcGxheSA9IHJlcXVpcmUoJy4vcHJvamVjdC1kaXNwbGF5L3Byb2plY3QtZGlzcGxheS5jb250cm9sbGVyJyk7XG5cbnZhciBBcHBsaWNhdGlvbiA9IGZ1bmN0aW9uKCl7fTtcbkFwcGxpY2F0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFwcGxpY2F0aW9uO1xudmFyIGFwcGxpY2F0aW9uID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgQXBwbGljYXRpb24oKTtcblxuQXBwbGljYXRpb24ucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihjb25maWcsIHdyYXBwZXIpe1xuXHR0aGlzLiRjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uc29sZS5sb2coJ2FwcGxpY2F0aW9uIGNvbmZpZycsIGNvbmZpZyk7XG4gICAgdGhpcy4kd3JhcHBlciA9IHdyYXBwZXIgfHwgZG9jdW1lbnQuYm9keTtcbiAgICByZXR1cm4gdmlldy5pbml0KHRoaXMpXG4gICAgICAgIC50aGVuKCBwcm9qZWN0c0xpc3QuaW5pdC5iaW5kKHByb2plY3RzTGlzdCwgdGhpcywgdGhpcy4kY29uZmlnKSApXG4gICAgICAgIC50aGVuKCBwcm9qZWN0RGlzcGxheS5pbml0LmJpbmQocHJvamVjdHNMaXN0LCB0aGlzKSApXG4gICAgICAgIC50aGVuKCB2aWV3LnJlbmRlclBhZ2UuYmluZCh2aWV3LCAnYWJvdXQnKSApO1xufTtcblxuQXBwbGljYXRpb24ucHJvdG90eXBlLmhhc2hDaGFuZ2VkID0gZnVuY3Rpb24oaGFzaCl7XG4gICAgdmFyIHBhdGggPSAoIGhhc2ggfHwgd2luZG93LmxvY2F0aW9uLmhhc2ggKS5yZXBsYWNlKCcjLycsICcnKS5zcGxpdCgnLycpO1xuICAgIHZhciBhY3Rpb24gPSBwYXRoLnNoaWZ0KCk7XG5cbiAgICBzd2l0Y2goIGFjdGlvbiApe1xuICAgICAgICBjYXNlICdhYm91dCc6XG4gICAgICAgIGNhc2UgJ2NvbnRhY3QnOlxuICAgICAgICAgICAgdmlldy5yZW5kZXJQYWdlKCBhY3Rpb24gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwcm9qZWN0JzpcbiAgICAgICAgICAgIHByb2plY3RzTGlzdC5jaGFuZ2VQcm9qZWN0KCBwYXRoLnNoaWZ0KCkgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG4iLCJ2YXIgdGVtcGxhdG9yID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvdGVtcGxhdG9yJyk7XG5cbnZhciAkc2NvcGU7XG5cbnZhciBBcHBsaWNhdGlvblZpZXcgPSBmdW5jdGlvbigpe307XG5BcHBsaWNhdGlvblZpZXcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXBwbGljYXRpb25WaWV3O1xudmFyIGFwcGxpY2F0aW9uVmlldyA9IG1vZHVsZS5leHBvcnRzID0gbmV3IEFwcGxpY2F0aW9uVmlldygpO1xuXG5BcHBsaWNhdGlvblZpZXcucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihjb250cm9sbGVyKXtcbiAgICAkc2NvcGUgPSBjb250cm9sbGVyO1xuICAgIC8vcmV0dXJucyB0aGUgcHJvbWlzZSBjcmVhdGVkIGluIHRlbXBsYXRvci5yZW5kZXJcbiAgICByZXR1cm4gdGhpcy5yZW5kZXIoJHNjb3BlLiR3cmFwcGVyLCAkc2NvcGUuJGNvbmZpZylcbiAgICAgICAgLnRoZW4oIHJlZ2lzdGVyRE9NIClcbiAgICAgICAgLnRoZW4oIHJlZ2lzdGVyQmVoYXZpb3VyICk7XG59O1xuXG4vL3dlIGV4cG9zZSB0aGUgcmVuZGVyIG1ldGhvZCBiZWNhdXNlIHRoZXJlIG1heSBjb21lIHRoZSBuZWVkIGZvciB0aGUgY29udHJvbGxlciB0byByZW5kZXIgaXQgYWdhaW5cbkFwcGxpY2F0aW9uVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24od3JhcHBlciwgbG9jYWxzKXtcbiAgICAvL3VzZSB0aGUgdGVtcGxhdG9yIHRvIHJlbmRlciB0aGUgaHRtbFxuICAgIHJldHVybiB0ZW1wbGF0b3IucmVuZGVyKCdtYWluLmh0bWwnLCBsb2NhbHMsIHdyYXBwZXIpO1xufTtcblxuQXBwbGljYXRpb25WaWV3LnByb3RvdHlwZS5yZW5kZXJQYWdlID0gZnVuY3Rpb24ocGFnZSl7IFxuICAgIHJldHVybiB0ZW1wbGF0b3IuZW1wdHkoJHNjb3BlLiRET00ucHJvamVjdENvbnRhaW5lcilcbiAgICAgICAgLnRoZW4oIHRlbXBsYXRvci5yZW5kZXIuYmluZCh0ZW1wbGF0b3IsIHBhZ2UgKyAnLmh0bWwnLCAkc2NvcGUuJGNvbmZpZywgJHNjb3BlLiRET00ucHJvamVjdENvbnRhaW5lcikgKVxufTtcblxuLy93ZSBjYWNoZSBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSdsbCB1c2UgbGF0ZXJcbnZhciByZWdpc3RlckRPTSA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLiRET00gPSB7XG4gICAgICAgIHByb2plY3RzTGlzdDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2plY3RzLWxpc3QnKSxcbiAgICAgICAgcHJvamVjdENvbnRhaW5lcjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2plY3QtY29udGFpbmVyJylcbiAgICB9O1xufTtcblxudmFyIHJlZ2lzdGVyQmVoYXZpb3VyID0gZnVuY3Rpb24oKXtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGV2KXtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJHNjb3BlLmhhc2hDaGFuZ2VkKCk7XG4gICAgfSk7XG59O1xuIiwidmFyIHB1YnN1YiA9IHJlcXVpcmUoJ29yZ2FuaWMtbGliL3B1YnN1YicpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuL3Byb2plY3QtZGlzcGxheS52aWV3Jyk7XG5cbnZhciBQcm9qZWN0RGlzcGxheSA9IGZ1bmN0aW9uKCl7fTtcblByb2plY3REaXNwbGF5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByb2plY3REaXNwbGF5O1xudmFyIHByb2plY3REaXNwbGF5ID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJvamVjdERpc3BsYXkoKTtcblxudmFyIGN1cnJlbnRQcm9qZWN0ID0gbnVsbDtcblxuUHJvamVjdERpc3BsYXkucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihwYXJlbnRTY29wZSwgY29uZmlnLCB3cmFwcGVyKXtcbiAgICB0aGlzLiRwYXJlbnRTY29wZSA9IHBhcmVudFNjb3BlO1xuICAgIHRoaXMuJGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICB0aGlzLiR3cmFwcGVyID0gd3JhcHBlciB8fCB0aGlzLiRwYXJlbnRTY29wZS4kRE9NLnByb2plY3RDb250YWluZXI7XG4gICAgcmVnaXN0ZXJOb3RpZmljYXRpb25JbnRlcmVzdHMoKTtcbiAgICByZXR1cm4gdmlldy5pbml0KHRoaXMpO1xufTtcblxudmFyIHJlZ2lzdGVyTm90aWZpY2F0aW9uSW50ZXJlc3RzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbm90aWZpY2F0aW9uSW50ZXJlc3RzID0gW1xuICAgICAgICAncHJvamVjdCBjaGFuZ2VkJ1xuICAgIF07XG5cbiAgICBwdWJzdWIuc3Vic2NyaWJlKG5vdGlmaWNhdGlvbkludGVyZXN0cywgbm90aWZpY2F0aW9uSGFuZGxlcik7XG59O1xuXG52YXIgbm90aWZpY2F0aW9uSGFuZGxlciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHBheWxvYWQpe1xuICAgIHN3aXRjaChtZXNzYWdlKXtcbiAgICAgICAgY2FzZSAncHJvamVjdCBjaGFuZ2VkJzpcbiAgICAgICAgICAgIGN1cnJlbnRQcm9qZWN0ID0gcGF5bG9hZC5wcm9qZWN0O1xuICAgICAgICAgICAgdmlldy5yZW5kZXJQcm9qZWN0KCBwYXlsb2FkLnByb2plY3QgKVxuICAgICAgICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe30sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycil7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG4iLCJ2YXIgdGVtcGxhdG9yID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvdGVtcGxhdG9yJyk7XG5cbnZhciAkc2NvcGU7XG5cbnZhciBQcm9qZWN0RGlzcGxheVZpZXcgPSBmdW5jdGlvbigpe307XG5Qcm9qZWN0RGlzcGxheVZpZXcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvamVjdERpc3BsYXlWaWV3O1xudmFyIHByb2plY3REaXNwbGF5VmlldyA9IG1vZHVsZS5leHBvcnRzID0gbmV3IFByb2plY3REaXNwbGF5VmlldygpO1xuXG5Qcm9qZWN0RGlzcGxheVZpZXcucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihjb250cm9sbGVyKXtcbiAgICAkc2NvcGUgPSBjb250cm9sbGVyO1xuICAgIHJlZ2lzdGVyRE9NKCk7XG4gICAgcmVnaXN0ZXJCZWhhdmlvdXIoKTtcblxufTtcblxuLy93ZSBleHBvc2UgdGhlIHJlbmRlciBtZXRob2QgYmVjYXVzZSB0aGVyZSBtYXkgY29tZSB0aGUgbmVlZCBmb3IgdGhlIGNvbnRyb2xsZXIgdG8gcmVuZGVyIGl0IGFnYWluXG5Qcm9qZWN0RGlzcGxheVZpZXcucHJvdG90eXBlLnJlbmRlclByb2plY3QgPSBmdW5jdGlvbihwcm9qZWN0KXtcbiAgICB2YXIgbG9jYWxzID0ge1xuICAgICAgICBwcm9qZWN0OiBwcm9qZWN0XG4gICAgfTtcbiAgICB2YXIgaXNVbmNsZU5lbHNvbiA9IHByb2plY3QudGl0bGUgPT09ICdBIE1vbnVtZW50IHRvIFVuY2xlIE5lbHNvbic7XG4gICAgdmFyIHRlbXBsYXRlVVJMID0gaXNVbmNsZU5lbHNvbj8gXG4gICAgICAncHJvamVjdC1kaXNwbGF5LW5lbHNvbi5odG1sJyA6ICdwcm9qZWN0LWRpc3BsYXkuaHRtbCc7XG5cbiAgICByZXR1cm4gdGVtcGxhdG9yLmVtcHR5KCRzY29wZS4kd3JhcHBlcilcbiAgICAgICAgLnRoZW4oIHRlbXBsYXRvci5yZW5kZXIuYmluZCh0ZW1wbGF0b3IsIHRlbXBsYXRlVVJMLCBsb2NhbHMsICRzY29wZS4kd3JhcHBlcikgKVxuICAgICAgICAudGhlbiggcmVnaXN0ZXJET00gKVxuICAgICAgICAudGhlbiggZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZihpc1VuY2xlTmVsc29uKXtcbiAgICAgICAgICAgIGNoYW5nZVNsaWRlKDEpOyBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xufTtcblxuLy93ZSBjYWNoZSBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSdsbCB1c2UgbGF0ZXJcbnZhciByZWdpc3RlckRPTSA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLiRET00gPSB7XG4gICAgICBzbGlkZXM6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCAkc2NvcGUuJHdyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJykgKVxuICAgIH07XG59O1xuXG52YXIgcmVnaXN0ZXJCZWhhdmlvdXIgPSBmdW5jdGlvbigpe1xuICAgICRzY29wZS4kd3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHdyYXBwZXJDbGlja0hhbmRsZXIpO1xufTtcblxudmFyIHdyYXBwZXJDbGlja0hhbmRsZXIgPSBmdW5jdGlvbihldil7XG4gIHZhciBlbGVtID0gZXYudGFyZ2V0O1xuICBpZihlbGVtLmRhdGFzZXQuc2xpZGUpe1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2hhbmdlU2xpZGUoZWxlbS5kYXRhc2V0LnNsaWRlKTtcbiAgfVxufTtcblxudmFyIGNoYW5nZVNsaWRlID0gZnVuY3Rpb24oaW5kZXgpe2NvbnNvbGUubG9nKCdjaGFuZ2luZyBzbGlkZScsIGluZGV4KTtcbiAgJHNjb3BlLiRET00uc2xpZGVzLmZvckVhY2goZnVuY3Rpb24oc2xpZGUpe1xuICAgICAgaWYoaW5kZXggPT0gc2xpZGUuZGF0YXNldC5pbmRleCl7XG4gICAgICAgICAgc2xpZGUuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNsaWRlLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICAgICAgfVxuICB9KTtcbn07XG4iLCJ2YXIgcHVic3ViID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvcHVic3ViJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vcHJvamVjdHMtbGlzdC52aWV3Jyk7XG5cbnZhciBQcm9qZWN0c0xpc3QgPSBmdW5jdGlvbigpe307XG5Qcm9qZWN0c0xpc3QucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvamVjdHNMaXN0O1xudmFyIHByb2plY3RzTGlzdCA9IG1vZHVsZS5leHBvcnRzID0gbmV3IFByb2plY3RzTGlzdCgpO1xuXG5Qcm9qZWN0c0xpc3QucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbihwYXJlbnRTY29wZSwgY29uZmlnLCB3cmFwcGVyKXtcbiAgICB0aGlzLiRwYXJlbnRTY29wZSA9IHBhcmVudFNjb3BlO1xuICAgIHRoaXMuJGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICB0aGlzLnByb2plY3RzID0gY29uZmlnLnByb2plY3RzO1xuICAgIHRoaXMuJHdyYXBwZXIgPSB3cmFwcGVyIHx8IHRoaXMuJHBhcmVudFNjb3BlLiRET00ucHJvamVjdHNMaXN0O1xuICAgIHJldHVybiB2aWV3LmluaXQodGhpcyk7XG59O1xuXG5Qcm9qZWN0c0xpc3QucHJvdG90eXBlLmNoYW5nZVByb2plY3QgPSBmdW5jdGlvbihzbHVnKXtcbiAgICB2YXIgcHJvamVjdCA9IHRoaXMucHJvamVjdHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICByZXR1cm4gaXRlbS5zbHVnID09PSBzbHVnO1xuICAgIH0pLnNoaWZ0KCk7XG4gICAgcHVic3ViLmJyb2FkY2FzdCggJ3Byb2plY3QgY2hhbmdlZCcsIHsgcHJvamVjdDogcHJvamVjdCB9ICk7XG59O1xuIiwidmFyIHRlbXBsYXRvciA9IHJlcXVpcmUoJ29yZ2FuaWMtbGliL3RlbXBsYXRvcicpO1xuXG52YXIgJHNjb3BlO1xuXG52YXIgUHJvamVjdHNMaXN0VmlldyA9IGZ1bmN0aW9uKCl7fTtcblByb2plY3RzTGlzdFZpZXcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvamVjdHNMaXN0VmlldztcbnZhciBwcm9qZWN0c0xpc3RWaWV3ID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJvamVjdHNMaXN0VmlldygpO1xuXG5Qcm9qZWN0c0xpc3RWaWV3LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oY29udHJvbGxlcil7XG4gICAgJHNjb3BlID0gY29udHJvbGxlcjtcbiAgICAvL3JldHVybnMgdGhlIHByb21pc2UgY3JlYXRlZCBpbiB0ZW1wbGF0b3IucmVuZGVyXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyKCRzY29wZS4kd3JhcHBlciwgJHNjb3BlLiRjb25maWcpXG4gICAgICAgIC50aGVuKCByZWdpc3RlckRPTSApXG4gICAgICAgIC50aGVuKCByZWdpc3RlckJlaGF2aW91ciApO1xufTtcblxuLy93ZSBleHBvc2UgdGhlIHJlbmRlciBtZXRob2QgYmVjYXVzZSB0aGVyZSBtYXkgY29tZSB0aGUgbmVlZCBmb3IgdGhlIGNvbnRyb2xsZXIgdG8gcmVuZGVyIGl0IGFnYWluXG5Qcm9qZWN0c0xpc3RWaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbih3cmFwcGVyLCBsb2NhbHMpe1xuICAgIC8vdXNlIHRoZSB0ZW1wbGF0b3IgdG8gcmVuZGVyIHRoZSBodG1sXG4gICAgcmV0dXJuIHRlbXBsYXRvci5yZW5kZXIoJ3Byb2plY3RzLWxpc3QuaHRtbCcsIGxvY2Fscywgd3JhcHBlcik7XG59O1xuXG4vL3dlIGNhY2hlIGFsbCB0aGUgRE9NIGVsZW1lbnRzIHdlJ2xsIHVzZSBsYXRlclxudmFyIHJlZ2lzdGVyRE9NID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuJERPTSA9IHtcbiAgICB9O1xufTtcblxudmFyIHJlZ2lzdGVyQmVoYXZpb3VyID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuJHdyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldil7XG4gICAgICAgIHZhciB0YXJnZXQgPSBldi50YXJnZXQ7XG4gICAgICAgIGlmKHRhcmdldC5kYXRhc2V0LnByb2plY3Qpe1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS5jaGFuZ2VQcm9qZWN0KHRhcmdldC5kYXRhc2V0LnByb2plY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwidmFyIHB1YnN1YiA9IHJlcXVpcmUoJ29yZ2FuaWMtbGliL3B1YnN1YicpO1xudmFyIGFqYXggPSByZXF1aXJlKCdvcmdhbmljLWxpYi9hamF4Jyk7XG52YXIgYXBwbGljYXRpb24gPSByZXF1aXJlKCcuL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uLmNvbnRyb2xsZXInKTtcblxudmFyIGlzRGV2ZWxvcG1lbnQgPSB+d2luZG93LmxvY2F0aW9uLmhvc3QuaW5kZXhPZignbG9jYWxob3N0Jyk7XG5cbndpbmRvdy5ob3N0TmFtZSA9IGlzRGV2ZWxvcG1lbnQ/ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnIDogJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xudmFyIENPTkZJR1VSQVRJT05fVVJMID0gd2luZG93Lmhvc3ROYW1lICsgJy9nZXQtY29uZmlndXJhdGlvbic7XG5cblxuYWpheC5nZXRKU09OKCBDT05GSUdVUkFUSU9OX1VSTCApXG5cdC50aGVuKCBhcHBsaWNhdGlvbi5pbml0LmJpbmQoYXBwbGljYXRpb24pIClcbiAgICAudGhlbiggZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaCB8fCAnYWJvdXQnO1xuICAgICAgICBhcHBsaWNhdGlvbi5oYXNoQ2hhbmdlZChoYXNoKTtcbiAgICB9KVxuXHQudGhlbiAoXG5cdFx0ZnVuY3Rpb24oKXsgY29uc29sZS5sb2coJ2FwcGxpY2F0aW9uIHN0YXJ0ZWQgc3VjY2Vzc2Z1bGx5Jyk7IH0sXG5cdFx0ZnVuY3Rpb24oZXJyKXsgY29uc29sZS5lcnJvcihlcnIuc3RhY2spOyB9XG5cdCk7XG5cblxucHVic3ViLnN1YnNjcmliZSgnKicsIGZ1bmN0aW9uKG1lc3NhZ2UsIHBheWxvYWQpe1xuXHRjb25zb2xlLmxvZygnLS0tLS0tLSBNZXNzYWdlIFJlY2VpdmVkIC0tLS0tLS0tLS0nKTtcblx0Y29uc29sZS5sb2coJ21lc3NhZ2U6JywgbWVzc2FnZSk7XG5cdGNvbnNvbGUubG9nKCdwYXlsb2FkOicsIHBheWxvYWQpO1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xufSk7XG4iXX0=
