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

};

//we expose the render method because there may come the need for the controller to render it again
ProjectDisplayView.prototype.renderProject = function(project){
    var locals = {
        project: project
    };
    return templator.empty($scope.$wrapper)
        .then( templator.render.bind(templator, 'project-display.html', locals, $scope.$wrapper) );
};

//we cache all the DOM elements we'll use later
var registerDOM = function(){
    $scope.$DOM = {
    };
};

var registerBehaviour = function(){
    
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvb3JnYW5pYy1saWIvYWpheC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vcmdhbmljLWxpYi9wdWJzdWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3JnYW5pYy1saWIvdGVtcGxhdG9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29yZ2FuaWMtbGliL3RlbXBsYXRvci9sb2FkZXIuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvZGF0ZWZvcm1hdHRlci5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9maWx0ZXJzLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xleGVyLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xvYWRlcnMvZmlsZXN5c3RlbS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9sb2FkZXJzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL2xvYWRlcnMvbWVtb3J5LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3BhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi9zd2lnLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvYXV0b2VzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvZWxzZS5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2Vsc2VpZi5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2V4dGVuZHMuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9maWx0ZXIuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9mb3IuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9pZi5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2ltcG9ydC5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL2luY2x1ZGUuanMiLCJub2RlX21vZHVsZXMvc3dpZy9saWIvdGFncy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zd2lnL2xpYi90YWdzL21hY3JvLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvcGFyZW50LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3MvcmF3LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3Mvc2V0LmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3RhZ3Mvc3BhY2VsZXNzLmpzIiwibm9kZV9tb2R1bGVzL3N3aWcvbGliL3V0aWxzLmpzIiwic3JjL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uLmNvbnRyb2xsZXIuanMiLCJzcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb24udmlldy5qcyIsInNyYy9hcHBsaWNhdGlvbi9wcm9qZWN0LWRpc3BsYXkvcHJvamVjdC1kaXNwbGF5LmNvbnRyb2xsZXIuanMiLCJzcmMvYXBwbGljYXRpb24vcHJvamVjdC1kaXNwbGF5L3Byb2plY3QtZGlzcGxheS52aWV3LmpzIiwic3JjL2FwcGxpY2F0aW9uL3Byb2plY3RzLWxpc3QvcHJvamVjdHMtbGlzdC5jb250cm9sbGVyLmpzIiwic3JjL2FwcGxpY2F0aW9uL3Byb2plY3RzLWxpc3QvcHJvamVjdHMtbGlzdC52aWV3LmpzIiwic3JjL2Jvb3RzdHJhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbDhEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3B1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8vIHByb21pc2VkIGxpYnJhcnkgZm9yIEFqYXggcmVxdWVzdHNcbnZhciBRID0gcmVxdWlyZSgncScpO1xuXG52YXIgQWpheCA9IG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgZ2V0OiBmdW5jdGlvbih1cmwpe1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbihldil7XG4gICAgICAgICAgICBpZih0aGlzLnN0YXR1cyA8IDQwMCl7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh0aGlzLnJlc3BvbnNlVGV4dCk7ICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6wqB0aGlzLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdGhpcy5yZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSxcbiAgICBnZXRKU09OOiBmdW5jdGlvbih1cmwpe1xuICAgICAgICByZXR1cm4gQWpheC5nZXQodXJsKS50aGVuKEpTT04ucGFyc2UpO1xuICAgIH1cbn07XG4iLCIvL3B1YnN1YiBtb2R1bGUgdXNlZCBieSBvdXIgYXBwbGljYXRpb24gY29udHJvbGxlcnNcbnZhciByZWdpc3RlcmVkSGFuZGxlcnMgPSB7fTtcbnZhciBjYXRjaEFsbCA9IFtdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdWJzY3JpYmU6IHN1YnNjcmliZSxcbiAgICBicm9hZGNhc3Q6IGJyb2FkY2FzdFxufTtcblxuZnVuY3Rpb24gc3Vic2NyaWJlIChtZXNzYWdlcywgaGFuZGxlcil7XG4gICAgaWYodHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3lvdSBjYW5cXCd0IHJlZ2lzdGVyIG5vbi1tZXRob2RzIGFzIGhhbmRsZXJzJyk7XG4gICAgfVxuICAgIGlmKCBtZXNzYWdlcyA9PT0gJyonICl7XG4gICAgICAgIGNhdGNoQWxsLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtZXNzYWdlcyA9IEFycmF5LmlzQXJyYXkobWVzc2FnZXMpPyBtZXNzYWdlcyA6IFttZXNzYWdlc107XG4gICAgbWVzc2FnZXMuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKXtcbiAgICAgICAgcmVnaXN0ZXJlZEhhbmRsZXJzW21lc3NhZ2VdID0gcmVnaXN0ZXJlZEhhbmRsZXJzW21lc3NhZ2VdIHx8IFtdO1xuICAgICAgICByZWdpc3RlcmVkSGFuZGxlcnNbbWVzc2FnZV0ucHVzaChoYW5kbGVyKTtcbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdChtZXNzYWdlLCBkYXRhKXtcbiAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICB2YXIgaGFuZGxlcnMgPSByZWdpc3RlcmVkSGFuZGxlcnNbbWVzc2FnZV0gfHwgW107XG4gICAgaGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihoYW5kbGVyKXtcbiAgICAgICAgaGFuZGxlcihtZXNzYWdlLCBkYXRhKTtcbiAgICB9KTtcbiAgICBjYXRjaEFsbC5mb3JFYWNoKGZ1bmN0aW9uKGhhbmRsZXIpe1xuICAgICAgICBoYW5kbGVyKG1lc3NhZ2UsIGRhdGEpO1xuICAgIH0pO1xufTtcbiIsIi8vcHJvbWlzZWQgVGVtcGxhdGluZyBlbmdpbmUgXG52YXIgUSA9IHJlcXVpcmUoJ3EnKTtcbnZhciBzd2lnID0gcmVxdWlyZSgnc3dpZycpO1xudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XG5cbnZhciBUZW1wbGF0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbih2aWV3cyl7XG4gICAgICAgIGxvYWRlci5pbml0KHZpZXdzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbih1cmwsIGxvY2Fscywgd3JhcHBlciwgYmVmb3JlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGVtcGxhdGUodXJsKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKHRlbXBsYXRlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZSh0ZW1wbGF0ZSwgbG9jYWxzKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSApXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24oaHRtbCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0KHdyYXBwZXIsIGh0bWwpXG4gICAgICAgICAgICB9LmJpbmQodGhpcykgKTtcbiAgICB9LFxuXG4gICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgIHVybCA9ICd2aWV3cy8nICsgdXJsO1xuICAgICAgICByZXR1cm4gbG9hZGVyLmxvYWQodXJsKTtcbiAgICB9LFxuXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHRlbXBsYXRlLCBsb2NhbHMpe1xuICAgICAgICB2YXIgaHRtbCA9IHN3aWcucmVuZGVyKHRlbXBsYXRlLCB7IFxuICAgICAgICAgICAgbG9jYWxzOiBsb2NhbHMsXG4gICAgICAgICAgICBhdXRvZXNjYXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcbiAgICBcbiAgICBpbmplY3Q6IGZ1bmN0aW9uKHdyYXBwZXIsIGh0bWwpe1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgKGZ1bmN0aW9uKGNvbnRhaW5lciwgaHRtbCl7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoY29udGFpbmVyLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xuICAgICAgICAgICAgICAgICAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTsgICAgXG4gICAgICAgIH0pKHdyYXBwZXIsIGh0bWwpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSwgXG5cbiAgICBlbXB0eTogZnVuY3Rpb24oY29udGFpbmVyKXtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgICAgICBpZighY29udGFpbmVyIHx8ICFjb250YWluZXIubm9kZU5hbWUpe1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBFcnJvcihcImNvbnRhaW5lciBtdXN0IGJlIGEgRE9NIGVsZW1lbnRcIikgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG59O1xuIiwidmFyIFEgPSByZXF1aXJlKCdxJyk7XG52YXIgYWpheCA9IHJlcXVpcmUoJy4uL2FqYXgnKTtcblxudmFyIExvYWRlciA9IG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKHZpZXdzKXtcbiAgICAgICAgdGhpcy52aWV3cyA9IHZpZXdzO1xuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odXJsKXtcbiAgICAgICAgaWYoIExvYWRlci52aWV3cyApe1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRGcm9tSlNPTih1cmwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGFqYXguZ2V0KHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICB9XG59O1xuXG52YXIgbG9hZEZyb21KU09OID0gZnVuY3Rpb24odXJsKXtcbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgcGF0aCA9IHVybC5zcGxpdCgnLycpO1xuICAgIHZhciB0ZW1wbGF0ZSA9IExvYWRlci52aWV3cztcbiAgICBPYmplY3Qua2V5cyhwYXRoKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XG4gICAgICAgIGlmKGtleSAhPT0gXCIwXCIgfHwgcGF0aFtrZXldICE9PSAndmlld3MnKXtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGVbIHBhdGhba2V5XSBdO1xuICAgICAgICAgICAgaWYoIXRlbXBsYXRlKXtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoIEVycm9yKCd2aWV3IG5vdCBmb3VuZCBpbiB2aWV3cy5qc29uICcgKyB1cmwpICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlKCB0ZW1wbGF0ZSApO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTsgXG4iLCIvLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuXG4gICAgLy8gUmVxdWlyZUpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG5cbiAgICAvLyBTRVMgKFNlY3VyZSBFY21hU2NyaXB0KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIXNlcy5vaygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXMubWFrZVEgPSBkZWZpbml0aW9uO1xuICAgICAgICB9XG5cbiAgICAvLyA8c2NyaXB0PlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2VsZi5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBlbnZpcm9ubWVudCB3YXMgbm90IGFudGljaXBhdGVkIGJ5IFEuIFBsZWFzZSBmaWxlIGEgYnVnLlwiKTtcbiAgICB9XG5cbn0pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzU3RhY2tzID0gZmFsc2U7XG50cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xufSBjYXRjaCAoZSkge1xuICAgIGhhc1N0YWNrcyA9ICEhZS5zdGFjaztcbn1cblxuLy8gQWxsIGNvZGUgYWZ0ZXIgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzIHJlcG9ydGVkXG4vLyBieSBRLlxudmFyIHFTdGFydGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xudmFyIHFGaWxlTmFtZTtcblxuLy8gc2hpbXNcblxuLy8gdXNlZCBmb3IgZmFsbGJhY2sgaW4gXCJhbGxSZXNvbHZlZFwiXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG52YXIgbmV4dFRpY2sgPShmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG4gICAgdmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbiAgICB2YXIgdGFpbCA9IGhlYWQ7XG4gICAgdmFyIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgdmFyIHJlcXVlc3RUaWNrID0gdm9pZCAwO1xuICAgIHZhciBpc05vZGVKUyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuXG4gICAgICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgICAgICB2YXIgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgICAgIC8vIE5vZGUuanMgYmVmb3JlIDAuOS4gTm90ZSB0aGF0IHNvbWUgZmFrZS1Ob2RlIGVudmlyb25tZW50cywgbGlrZSB0aGVcbiAgICAgICAgLy8gTW9jaGEgdGVzdCBydW5uZXIsIGludHJvZHVjZSBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2AuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgKiptaWdodCoqIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemUgb2Zcbi8vIHRoZSBtaW5pZmllZCBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KClcbi8vIFNlZSBNYXJrIE1pbGxlcuKAmXMgZXhwbGFuYXRpb24gb2Ygd2hhdCB0aGlzIGRvZXMuXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbnZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbmZ1bmN0aW9uIHVuY3VycnlUaGlzKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIGxvbmcgc3RhY2sgdHJhY2VzXG5cbnZhciBTVEFDS19KVU1QX1NFUEFSQVRPUiA9IFwiRnJvbSBwcmV2aW91cyBldmVudDpcIjtcblxuZnVuY3Rpb24gbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKSB7XG4gICAgLy8gSWYgcG9zc2libGUsIHRyYW5zZm9ybSB0aGUgZXJyb3Igc3RhY2sgdHJhY2UgYnkgcmVtb3ZpbmcgTm9kZSBhbmQgUVxuICAgIC8vIGNydWZ0LCB0aGVuIGNvbmNhdGVuYXRpbmcgd2l0aCB0aGUgc3RhY2sgdHJhY2Ugb2YgYHByb21pc2VgLiBTZWUgIzU3LlxuICAgIGlmIChoYXNTdGFja3MgJiZcbiAgICAgICAgcHJvbWlzZS5zdGFjayAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2sgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2suaW5kZXhPZihTVEFDS19KVU1QX1NFUEFSQVRPUikgPT09IC0xXG4gICAgKSB7XG4gICAgICAgIHZhciBzdGFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcCA9IHByb21pc2U7ICEhcDsgcCA9IHAuc291cmNlKSB7XG4gICAgICAgICAgICBpZiAocC5zdGFjaykge1xuICAgICAgICAgICAgICAgIHN0YWNrcy51bnNoaWZ0KHAuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrcy51bnNoaWZ0KGVycm9yLnN0YWNrKTtcblxuICAgICAgICB2YXIgY29uY2F0ZWRTdGFja3MgPSBzdGFja3Muam9pbihcIlxcblwiICsgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgKyBcIlxcblwiKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBmaWx0ZXJTdGFja1N0cmluZyhjb25jYXRlZFN0YWNrcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJTdGFja1N0cmluZyhzdGFja1N0cmluZykge1xuICAgIHZhciBsaW5lcyA9IHN0YWNrU3RyaW5nLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBkZXNpcmVkTGluZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgICAgaWYgKCFpc0ludGVybmFsRnJhbWUobGluZSkgJiYgIWlzTm9kZUZyYW1lKGxpbmUpICYmIGxpbmUpIHtcbiAgICAgICAgICAgIGRlc2lyZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXNpcmVkTGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gaXNOb2RlRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgcmV0dXJuIHN0YWNrTGluZS5pbmRleE9mKFwiKG1vZHVsZS5qczpcIikgIT09IC0xIHx8XG4gICAgICAgICAgIHN0YWNrTGluZS5pbmRleE9mKFwiKG5vZGUuanM6XCIpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSkge1xuICAgIC8vIE5hbWVkIGZ1bmN0aW9uczogXCJhdCBmdW5jdGlvbk5hbWUgKGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyKVwiXG4gICAgLy8gSW4gSUUxMCBmdW5jdGlvbiBuYW1lIGNhbiBoYXZlIHNwYWNlcyAoXCJBbm9ueW1vdXMgZnVuY3Rpb25cIikgT19vXG4gICAgdmFyIGF0dGVtcHQxID0gL2F0IC4rIFxcKCguKyk6KFxcZCspOig/OlxcZCspXFwpJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0MSkge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQxWzFdLCBOdW1iZXIoYXR0ZW1wdDFbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb25zOiBcImF0IGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDIgPSAvYXQgKFteIF0rKTooXFxkKyk6KD86XFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQyKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDJbMV0sIE51bWJlcihhdHRlbXB0MlsyXSldO1xuICAgIH1cblxuICAgIC8vIEZpcmVmb3ggc3R5bGU6IFwiZnVuY3Rpb25AZmlsZW5hbWU6bGluZU51bWJlciBvciBAZmlsZW5hbWU6bGluZU51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQzID0gLy4qQCguKyk6KFxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mykge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQzWzFdLCBOdW1iZXIoYXR0ZW1wdDNbMl0pXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxGcmFtZShzdGFja0xpbmUpIHtcbiAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSk7XG5cbiAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgIHZhciBsaW5lTnVtYmVyID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuXG4gICAgcmV0dXJuIGZpbGVOYW1lID09PSBxRmlsZU5hbWUgJiZcbiAgICAgICAgbGluZU51bWJlciA+PSBxU3RhcnRpbmdMaW5lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPD0gcUVuZGluZ0xpbmU7XG59XG5cbi8vIGRpc2NvdmVyIG93biBmaWxlIG5hbWUgYW5kIGxpbmUgbnVtYmVyIHJhbmdlIGZvciBmaWx0ZXJpbmcgc3RhY2tcbi8vIHRyYWNlc1xuZnVuY3Rpb24gY2FwdHVyZUxpbmUoKSB7XG4gICAgaWYgKCFoYXNTdGFja3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdmFyIGZpcnN0TGluZSA9IGxpbmVzWzBdLmluZGV4T2YoXCJAXCIpID4gMCA/IGxpbmVzWzFdIDogbGluZXNbMl07XG4gICAgICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoZmlyc3RMaW5lKTtcbiAgICAgICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHFGaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShjYWxsYmFjaywgbmFtZSwgYWx0ZXJuYXRpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLCB1c2UgXCIgKyBhbHRlcm5hdGl2ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgXCIgaW5zdGVhZC5cIiwgbmV3IEVycm9yKFwiXCIpLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLy8gZW5kIG9mIHNoaW1zXG4vLyBiZWdpbm5pbmcgb2YgcmVhbCB3b3JrXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbHJlYWR5IGEgUHJvbWlzZSwgcmV0dXJuIGl0IGRpcmVjdGx5LiAgVGhpcyBlbmFibGVzXG4gICAgLy8gdGhlIHJlc29sdmUgZnVuY3Rpb24gdG8gYm90aCBiZSB1c2VkIHRvIGNyZWF0ZWQgcmVmZXJlbmNlcyBmcm9tIG9iamVjdHMsXG4gICAgLy8gYnV0IHRvIHRvbGVyYWJseSBjb2VyY2Ugbm9uLXByb21pc2VzIHRvIHByb21pc2VzLlxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8vIGVuYWJsZSBsb25nIHN0YWNrcyBpZiBRX0RFQlVHIGlzIHNldFxuaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUV9ERUJVRykge1xuICAgIFEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZWFyZXJWYWx1ZSA9IG5lYXJlcihyZXNvbHZlZFByb21pc2UpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKG5lYXJlclZhbHVlKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmVhcmVyVmFsdWU7IC8vIHNob3J0ZW4gY2hhaW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVyVmFsdWU7XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXRlOiBcInBlbmRpbmdcIiB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICBpZiAoUS5sb25nU3RhY2tTdXBwb3J0ICYmIGhhc1N0YWNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IHRyeSB0byB1c2UgYEVycm9yLmNhcHR1cmVTdGFja1RyYWNlYCBvciB0cmFuc2ZlciB0aGVcbiAgICAgICAgICAgIC8vIGFjY2Vzc29yIGFyb3VuZDsgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtzIGFzIHBlciBHSC0xMTEuIEp1c3RcbiAgICAgICAgICAgIC8vIHJlaWZ5IHRoZSBzdGFjayB0cmFjZSBhcyBhIHN0cmluZyBBU0FQLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEF0IHRoZSBzYW1lIHRpbWUsIGN1dCBvZmYgdGhlIGZpcnN0IGxpbmU7IGl0J3MgYWx3YXlzIGp1c3RcbiAgICAgICAgICAgIC8vIFwiW29iamVjdCBQcm9taXNlXVxcblwiLCBhcyBwZXIgdGhlIGB0b1N0cmluZ2AuXG4gICAgICAgICAgICBwcm9taXNlLnN0YWNrID0gZS5zdGFjay5zdWJzdHJpbmcoZS5zdGFjay5pbmRleE9mKFwiXFxuXCIpICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiB3ZSBkbyB0aGUgY2hlY2tzIGZvciBgcmVzb2x2ZWRQcm9taXNlYCBpbiBlYWNoIG1ldGhvZCwgaW5zdGVhZCBvZlxuICAgIC8vIGNvbnNvbGlkYXRpbmcgdGhlbSBpbnRvIGBiZWNvbWVgLCBzaW5jZSBvdGhlcndpc2Ugd2UnZCBjcmVhdGUgbmV3XG4gICAgLy8gcHJvbWlzZXMgd2l0aCB0aGUgbGluZXMgYGJlY29tZSh3aGF0ZXZlcih2YWx1ZSkpYC4gU2VlIGUuZy4gR0gtMjUyLlxuXG4gICAgZnVuY3Rpb24gYmVjb21lKG5ld1Byb21pc2UpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmV3UHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5zb3VyY2UgPSBuZXdQcm9taXNlO1xuXG4gICAgICAgIGFycmF5X3JlZHVjZShtZXNzYWdlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgc2V0dGxlZC5cbiAqIEBwYXJhbSBhbnN3ZXJzIHtBcnJheVtBbnkqXX0gcHJvbWlzZXMgdG8gcmFjZVxuICogQHJldHVybnMge0FueSp9IHRoZSBmaXJzdCBwcm9taXNlIHRvIGJlIHNldHRsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uKGFuc3dlclApIHtcbiAgICAgICAgLy8gICAgIFEoYW5zd2VyUCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gVXNlIHRoaXMgaW4gdGhlIG1lYW50aW1lXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhbnN3ZXJQcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgUShhbnN3ZXJQc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihRLnJhY2UpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInBlbmRpbmdcIiB8fFxuICAgICAgICAgICAgICAgIGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgZG9uZSA9IGZhbHNlOyAgIC8vIGVuc3VyZSB0aGUgdW50cnVzdGVkIHByb21pc2UgbWFrZXMgYXQgbW9zdCBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgY2FsbCB0byBvbmUgb2YgdGhlIGNhbGxiYWNrc1xuXG4gICAgZnVuY3Rpb24gX2Z1bGZpbGxlZCh2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmdWxmaWxsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bGZpbGxlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0ZWQoZXhjZXB0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGV4Y2VwdGlvbiwgc2VsZik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3RlZChleGNlcHRpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAobmV3RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXdFeGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcHJvZ3Jlc3NlZCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHByb2dyZXNzZWQgPT09IFwiZnVuY3Rpb25cIiA/IHByb2dyZXNzZWQodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuXG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5RLnRhcCA9IGZ1bmN0aW9uIChwcm9taXNlLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRhcChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFdvcmtzIGFsbW9zdCBsaWtlIFwiZmluYWxseVwiLCBidXQgbm90IGNhbGxlZCBmb3IgcmVqZWN0aW9ucy5cbiAqIE9yaWdpbmFsIHJlc29sdXRpb24gdmFsdWUgaXMgcGFzc2VkIHRocm91Z2ggY2FsbGJhY2sgdW5hZmZlY3RlZC5cbiAqIENhbGxiYWNrIG1heSByZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBiZSBhd2FpdGVkIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7US5Qcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGRvU29tZXRoaW5nKClcbiAqICAgLnRoZW4oLi4uKVxuICogICAudGFwKGNvbnNvbGUubG9nKVxuICogICAudGhlbiguLi4pO1xuICovXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKHZhbHVlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblEudGhlblJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuUS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHByb21pc2UsIHJlYXNvbikge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZWplY3QocmVhc29uKTtcbn07XG5cbi8qKlxuICogSWYgYW4gb2JqZWN0IGlzIG5vdCBhIHByb21pc2UsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlLlxuICogSWYgYSBwcm9taXNlIGlzIHJlamVjdGVkLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZSB0b28uXG4gKiBJZiBpdOKAmXMgYSBmdWxmaWxsZWQgcHJvbWlzZSwgdGhlIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5lYXJlci5cbiAqIElmIGl04oCZcyBhIGRlZmVycmVkIHByb21pc2UgYW5kIHRoZSBkZWZlcnJlZCBoYXMgYmVlbiByZXNvbHZlZCwgdGhlXG4gKiByZXNvbHV0aW9uIGlzIFwibmVhcmVyXCIuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBtb3N0IHJlc29sdmVkIChuZWFyZXN0KSBmb3JtIG9mIHRoZSBvYmplY3RcbiAqL1xuXG4vLyBYWFggc2hvdWxkIHdlIHJlLWRvIHRoaXM/XG5RLm5lYXJlciA9IG5lYXJlcjtcbmZ1bmN0aW9uIG5lYXJlcih2YWx1ZSkge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSB2YWx1ZS5pbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHByb21pc2UuXG4gKiBPdGhlcndpc2UgaXQgaXMgYSBmdWxmaWxsZWQgdmFsdWUuXG4gKi9cblEuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBQcm9taXNlO1xufVxuXG5RLmlzUHJvbWlzZUFsaWtlID0gaXNQcm9taXNlQWxpa2U7XG5mdW5jdGlvbiBpc1Byb21pc2VBbGlrZShvYmplY3QpIHtcbiAgICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSAmJiB0eXBlb2Ygb2JqZWN0LnRoZW4gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwZW5kaW5nIHByb21pc2UsIG1lYW5pbmcgbm90XG4gKiBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG4gKi9cblEuaXNQZW5kaW5nID0gaXNQZW5kaW5nO1xuZnVuY3Rpb24gaXNQZW5kaW5nKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHZhbHVlIG9yIGZ1bGZpbGxlZFxuICogcHJvbWlzZS5cbiAqL1xuUS5pc0Z1bGZpbGxlZCA9IGlzRnVsZmlsbGVkO1xuZnVuY3Rpb24gaXNGdWxmaWxsZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuICFpc1Byb21pc2Uob2JqZWN0KSB8fCBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHJlamVjdGVkIHByb21pc2UuXG4gKi9cblEuaXNSZWplY3RlZCA9IGlzUmVqZWN0ZWQ7XG5mdW5jdGlvbiBpc1JlamVjdGVkKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59O1xuXG4vLy8vIEJFR0lOIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLy8gVGhpcyBwcm9taXNlIGxpYnJhcnkgY29uc3VtZXMgZXhjZXB0aW9ucyB0aHJvd24gaW4gaGFuZGxlcnMgc28gdGhleSBjYW4gYmVcbi8vIGhhbmRsZWQgYnkgYSBzdWJzZXF1ZW50IHByb21pc2UuICBUaGUgZXhjZXB0aW9ucyBnZXQgYWRkZWQgdG8gdGhpcyBhcnJheSB3aGVuXG4vLyB0aGV5IGFyZSBjcmVhdGVkLCBhbmQgcmVtb3ZlZCB3aGVuIHRoZXkgYXJlIGhhbmRsZWQuICBOb3RlIHRoYXQgaW4gRVM2IG9yXG4vLyBzaGltbWVkIGVudmlyb25tZW50cywgdGhpcyB3b3VsZCBuYXR1cmFsbHkgYmUgYSBgU2V0YC5cbnZhciB1bmhhbmRsZWRSZWFzb25zID0gW107XG52YXIgdW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5cbmZ1bmN0aW9uIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpIHtcbiAgICB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aCA9IDA7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5sZW5ndGggPSAwO1xuXG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYWNrUmVqZWN0aW9uKHByb21pc2UsIHJlYXNvbikge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgaWYgKHJlYXNvbiAmJiB0eXBlb2YgcmVhc29uLnN0YWNrICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChyZWFzb24uc3RhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChcIihubyBzdGFjaykgXCIgKyByZWFzb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdW50cmFja1JlamVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhdCA9IGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgaWYgKGF0ICE9PSAtMSkge1xuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc3AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzcCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFuIG9iamVjdCBzdWNoIHRoYXQgaXQgd2lsbCBuZXZlciBiZVxuICogdHJhbnNmZXJyZWQgYXdheSBmcm9tIHRoaXMgcHJvY2VzcyBvdmVyIGFueSBwcm9taXNlXG4gKiBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBwcm9taXNlIGEgd3JhcHBpbmcgb2YgdGhhdCBvYmplY3QgdGhhdFxuICogYWRkaXRpb25hbGx5IHJlc3BvbmRzIHRvIHRoZSBcImlzRGVmXCIgbWVzc2FnZVxuICogd2l0aG91dCBhIHJlamVjdGlvbi5cbiAqL1xuUS5tYXN0ZXIgPSBtYXN0ZXI7XG5mdW5jdGlvbiBtYXN0ZXIob2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcImlzRGVmXCI6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2sob3AsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFEob2JqZWN0KS5pbnNwZWN0KCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogU3ByZWFkcyB0aGUgdmFsdWVzIG9mIGEgcHJvbWlzZWQgYXJyYXkgb2YgYXJndW1lbnRzIGludG8gdGhlXG4gKiBmdWxmaWxsbWVudCBjYWxsYmFjay5cbiAqIEBwYXJhbSBmdWxmaWxsZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB2YXJpYWRpYyBhcmd1bWVudHMgZnJvbSB0aGVcbiAqIHByb21pc2VkIGFycmF5XG4gKiBAcGFyYW0gcmVqZWN0ZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB0aGUgZXhjZXB0aW9uIGlmIHRoZSBwcm9taXNlXG4gKiBpcyByZWplY3RlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvciB0aHJvd24gZXhjZXB0aW9uIG9mXG4gKiBlaXRoZXIgY2FsbGJhY2suXG4gKi9cblEuc3ByZWFkID0gc3ByZWFkO1xuZnVuY3Rpb24gc3ByZWFkKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnNwcmVhZChmdWxmaWxsZWQsIHJlamVjdGVkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS50aGVuKGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgYXJyYXkpO1xuICAgIH0sIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogVGhlIGFzeW5jIGZ1bmN0aW9uIGlzIGEgZGVjb3JhdG9yIGZvciBnZW5lcmF0b3IgZnVuY3Rpb25zLCB0dXJuaW5nXG4gKiB0aGVtIGludG8gYXN5bmNocm9ub3VzIGdlbmVyYXRvcnMuICBBbHRob3VnaCBnZW5lcmF0b3JzIGFyZSBvbmx5IHBhcnRcbiAqIG9mIHRoZSBuZXdlc3QgRUNNQVNjcmlwdCA2IGRyYWZ0cywgdGhpcyBjb2RlIGRvZXMgbm90IGNhdXNlIHN5bnRheFxuICogZXJyb3JzIGluIG9sZGVyIGVuZ2luZXMuICBUaGlzIGNvZGUgc2hvdWxkIGNvbnRpbnVlIHRvIHdvcmsgYW5kIHdpbGxcbiAqIGluIGZhY3QgaW1wcm92ZSBvdmVyIHRpbWUgYXMgdGhlIGxhbmd1YWdlIGltcHJvdmVzLlxuICpcbiAqIEVTNiBnZW5lcmF0b3JzIGFyZSBjdXJyZW50bHkgcGFydCBvZiBWOCB2ZXJzaW9uIDMuMTkgd2l0aCB0aGVcbiAqIC0taGFybW9ueS1nZW5lcmF0b3JzIHJ1bnRpbWUgZmxhZyBlbmFibGVkLiAgU3BpZGVyTW9ua2V5IGhhcyBoYWQgdGhlbVxuICogZm9yIGxvbmdlciwgYnV0IHVuZGVyIGFuIG9sZGVyIFB5dGhvbi1pbnNwaXJlZCBmb3JtLiAgVGhpcyBmdW5jdGlvblxuICogd29ya3Mgb24gYm90aCBraW5kcyBvZiBnZW5lcmF0b3JzLlxuICpcbiAqIERlY29yYXRlcyBhIGdlbmVyYXRvciBmdW5jdGlvbiBzdWNoIHRoYXQ6XG4gKiAgLSBpdCBtYXkgeWllbGQgcHJvbWlzZXNcbiAqICAtIGV4ZWN1dGlvbiB3aWxsIGNvbnRpbnVlIHdoZW4gdGhhdCBwcm9taXNlIGlzIGZ1bGZpbGxlZFxuICogIC0gdGhlIHZhbHVlIG9mIHRoZSB5aWVsZCBleHByZXNzaW9uIHdpbGwgYmUgdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogIC0gaXQgcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgKHdoZW4gdGhlIGdlbmVyYXRvclxuICogICAgc3RvcHMgaXRlcmF0aW5nKVxuICogIC0gdGhlIGRlY29yYXRlZCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICogICAgb2YgdGhlIGdlbmVyYXRvciBvciB0aGUgZmlyc3QgcmVqZWN0ZWQgcHJvbWlzZSBhbW9uZyB0aG9zZVxuICogICAgeWllbGRlZC5cbiAqICAtIGlmIGFuIGVycm9yIGlzIHRocm93biBpbiB0aGUgZ2VuZXJhdG9yLCBpdCBwcm9wYWdhdGVzIHRocm91Z2hcbiAqICAgIGV2ZXJ5IGZvbGxvd2luZyB5aWVsZCB1bnRpbCBpdCBpcyBjYXVnaHQsIG9yIHVudGlsIGl0IGVzY2FwZXNcbiAqICAgIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gYWx0b2dldGhlciwgYW5kIGlzIHRyYW5zbGF0ZWQgaW50byBhXG4gKiAgICByZWplY3Rpb24gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IHRoZSBkZWNvcmF0ZWQgZ2VuZXJhdG9yLlxuICovXG5RLmFzeW5jID0gYXN5bmM7XG5mdW5jdGlvbiBhc3luYyhtYWtlR2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwic2VuZFwiLCBhcmcgaXMgYSB2YWx1ZVxuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJ0aHJvd1wiLCBhcmcgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlcih2ZXJiLCBhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgICAgIC8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4gICAgICAgICAgICAvLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuICAgICAgICAgICAgLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbiAgICAgICAgICAgIC8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbiAgICAgICAgICAgIC8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuICAgICAgICAgICAgLy8gdGhpcyBibG9jay5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBTdG9wSXRlcmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gRVM2IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNwaWRlck1vbmtleSBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIGNhc2Ugd2hlbiBTTSBkb2VzIEVTNiBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBRKGV4Y2VwdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IG1ha2VHZW5lcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcIm5leHRcIik7XG4gICAgICAgIHZhciBlcnJiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcInRocm93XCIpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFRoZSBzcGF3biBmdW5jdGlvbiBpcyBhIHNtYWxsIHdyYXBwZXIgYXJvdW5kIGFzeW5jIHRoYXQgaW1tZWRpYXRlbHlcbiAqIGNhbGxzIHRoZSBnZW5lcmF0b3IgYW5kIGFsc28gZW5kcyB0aGUgcHJvbWlzZSBjaGFpbiwgc28gdGhhdCBhbnlcbiAqIHVuaGFuZGxlZCBlcnJvcnMgYXJlIHRocm93biBpbnN0ZWFkIG9mIGZvcndhcmRlZCB0byB0aGUgZXJyb3JcbiAqIGhhbmRsZXIuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2UgaXQncyBleHRyZW1lbHkgY29tbW9uIHRvIHJ1blxuICogZ2VuZXJhdG9ycyBhdCB0aGUgdG9wLWxldmVsIHRvIHdvcmsgd2l0aCBsaWJyYXJpZXMuXG4gKi9cblEuc3Bhd24gPSBzcGF3bjtcbmZ1bmN0aW9uIHNwYXduKG1ha2VHZW5lcmF0b3IpIHtcbiAgICBRLmRvbmUoUS5hc3luYyhtYWtlR2VuZXJhdG9yKSgpKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGludGVyZmFjZSBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG4vKipcbiAqIFRocm93cyBhIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB0byBzdG9wIGFuIGFzeW5jaHJvbm91cyBnZW5lcmF0b3IuXG4gKlxuICogVGhpcyBpbnRlcmZhY2UgaXMgYSBzdG9wLWdhcCBtZWFzdXJlIHRvIHN1cHBvcnQgZ2VuZXJhdG9yIHJldHVyblxuICogdmFsdWVzIGluIG9sZGVyIEZpcmVmb3gvU3BpZGVyTW9ua2V5LiAgSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEVTNlxuICogZ2VuZXJhdG9ycyBsaWtlIENocm9taXVtIDI5LCBqdXN0IHVzZSBcInJldHVyblwiIGluIHlvdXIgZ2VuZXJhdG9yXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSByZXR1cm4gdmFsdWUgZm9yIHRoZSBzdXJyb3VuZGluZyBnZW5lcmF0b3JcbiAqIEB0aHJvd3MgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHdpdGggdGhlIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqIC8vIEVTNiBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiogKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICByZXR1cm4gZm9vICsgYmFyO1xuICogfSlcbiAqIC8vIE9sZGVyIFNwaWRlck1vbmtleSBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIFEucmV0dXJuKGZvbyArIGJhcik7XG4gKiB9KVxuICovXG5RW1wicmV0dXJuXCJdID0gX3JldHVybjtcbmZ1bmN0aW9uIF9yZXR1cm4odmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgUVJldHVyblZhbHVlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJvbWlzZWQgZnVuY3Rpb24gZGVjb3JhdG9yIGVuc3VyZXMgdGhhdCBhbnkgcHJvbWlzZSBhcmd1bWVudHNcbiAqIGFyZSBzZXR0bGVkIGFuZCBwYXNzZWQgYXMgdmFsdWVzIChgdGhpc2AgaXMgYWxzbyBzZXR0bGVkIGFuZCBwYXNzZWRcbiAqIGFzIGEgdmFsdWUpLiAgSXQgd2lsbCBhbHNvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgYSBmdW5jdGlvbiBpc1xuICogYWx3YXlzIGEgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFkZCA9IFEucHJvbWlzZWQoZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICByZXR1cm4gYSArIGI7XG4gKiB9KTtcbiAqIGFkZChRKGEpLCBRKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChvcCwgYXJncyk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKG9wLCBhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK3BlbmRpbmdDb3VudDtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSBvZiBhbiBhcnJheS4gUHJpb3IgcmVqZWN0ZWQgcHJvbWlzZXMgYXJlXG4gKiBpZ25vcmVkLiAgUmVqZWN0cyBvbmx5IGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgb3IgcHJvbWlzZXMgZm9yIHZhbHVlc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSxcbiAqIG9yIGEgcmVqZWN0ZWQgcHJvbWlzZSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICovXG5RLmFueSA9IGFueTtcblxuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24ocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gYW55KHRoaXMpO1xufTtcblxuLyoqXG4gKiBXYWl0cyBmb3IgYWxsIHByb21pc2VzIHRvIGJlIHNldHRsZWQsIGVpdGhlciBmdWxmaWxsZWQgb3JcbiAqIHJlamVjdGVkLiAgVGhpcyBpcyBkaXN0aW5jdCBmcm9tIGBhbGxgIHNpbmNlIHRoYXQgd291bGQgc3RvcFxuICogd2FpdGluZyBhdCB0aGUgZmlyc3QgcmVqZWN0aW9uLiAgVGhlIHByb21pc2UgcmV0dXJuZWQgYnlcbiAqIGBhbGxSZXNvbHZlZGAgd2lsbCBuZXZlciBiZSByZWplY3RlZC5cbiAqIEBwYXJhbSBwcm9taXNlcyBhIHByb21pc2UgZm9yIGFuIGFycmF5IChvciBhbiBhcnJheSkgb2YgcHJvbWlzZXNcbiAqIChvciB2YWx1ZXMpXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgcHJvbWlzZXNcbiAqL1xuUS5hbGxSZXNvbHZlZCA9IGRlcHJlY2F0ZShhbGxSZXNvbHZlZCwgXCJhbGxSZXNvbHZlZFwiLCBcImFsbFNldHRsZWRcIik7XG5mdW5jdGlvbiBhbGxSZXNvbHZlZChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZXMgPSBhcnJheV9tYXAocHJvbWlzZXMsIFEpO1xuICAgICAgICByZXR1cm4gd2hlbihhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgbm9vcCwgbm9vcCk7XG4gICAgICAgIH0pKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbFJlc29sdmVkKHRoaXMpO1xufTtcblxuLyoqXG4gKiBAc2VlIFByb21pc2UjYWxsU2V0dGxlZFxuICovXG5RLmFsbFNldHRsZWQgPSBhbGxTZXR0bGVkO1xuZnVuY3Rpb24gYWxsU2V0dGxlZChwcm9taXNlcykge1xuICAgIHJldHVybiBRKHByb21pc2VzKS5hbGxTZXR0bGVkKCk7XG59XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZWlyIHN0YXRlcyAoYXNcbiAqIHJldHVybmVkIGJ5IGBpbnNwZWN0YCkgd2hlbiB0aGV5IGhhdmUgYWxsIHNldHRsZWQuXG4gKiBAcGFyYW0ge0FycmF5W0FueSpdfSB2YWx1ZXMgYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMge0FycmF5W1N0YXRlXX0gYW4gYXJyYXkgb2Ygc3RhdGVzIGZvciB0aGUgcmVzcGVjdGl2ZSB2YWx1ZXMuXG4gKi9cblByb21pc2UucHJvdG90eXBlLmFsbFNldHRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcmV0dXJuIGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gUShwcm9taXNlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlZ2FyZGxlc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuaW5zcGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZWdhcmRsZXNzLCByZWdhcmRsZXNzKTtcbiAgICAgICAgfSkpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDYXB0dXJlcyB0aGUgZmFpbHVyZSBvZiBhIHByb21pc2UsIGdpdmluZyBhbiBvcG9ydHVuaXR5IHRvIHJlY292ZXJcbiAqIHdpdGggYSBjYWxsYmFjay4gIElmIHRoZSBnaXZlbiBwcm9taXNlIGlzIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gKiBwcm9taXNlIGlzIGZ1bGZpbGxlZC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBmdWxmaWxsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlmIHRoZVxuICogZ2l2ZW4gcHJvbWlzZSBpcyByZWplY3RlZFxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBjYWxsYmFja1xuICovXG5RLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogQXR0YWNoZXMgYSBsaXN0ZW5lciB0aGF0IGNhbiByZXNwb25kIHRvIHByb2dyZXNzIG5vdGlmaWNhdGlvbnMgZnJvbSBhXG4gKiBwcm9taXNlJ3Mgb3JpZ2luYXRpbmcgZGVmZXJyZWQuIFRoaXMgbGlzdGVuZXIgcmVjZWl2ZXMgdGhlIGV4YWN0IGFyZ3VtZW50c1xuICogcGFzc2VkIHRvIGBgZGVmZXJyZWQubm90aWZ5YGAuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gcmVjZWl2ZSBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybnMgdGhlIGdpdmVuIHByb21pc2UsIHVuY2hhbmdlZFxuICovXG5RLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5mdW5jdGlvbiBwcm9ncmVzcyhvYmplY3QsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIG9ic2VydmUgdGhlIHNldHRsaW5nIG9mIGEgcHJvbWlzZSxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBGb3J3YXJkc1xuICogdGhlIHJlc29sdXRpb24gdG8gdGhlIHJldHVybmVkIHByb21pc2Ugd2hlbiB0aGUgY2FsbGJhY2sgaXMgZG9uZS5cbiAqIFRoZSBjYWxsYmFjayBjYW4gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBjb21wbGV0aW9uLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBvYnNlcnZlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlblxuICogcHJvbWlzZSwgdGFrZXMgbm8gYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSB3aGVuXG4gKiBgYGZpbmBgIGlzIGRvbmUuXG4gKi9cblEuZmluID0gLy8gWFhYIGxlZ2FjeVxuUVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdClbXCJmaW5hbGx5XCJdKGNhbGxiYWNrKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZpbiA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gVE9ETyBhdHRlbXB0IHRvIHJlY3ljbGUgdGhlIHJlamVjdGlvbiB3aXRoIFwidGhpc1wiLlxuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFRlcm1pbmF0ZXMgYSBjaGFpbiBvZiBwcm9taXNlcywgZm9yY2luZyByZWplY3Rpb25zIHRvIGJlXG4gKiB0aHJvd24gYXMgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBhdCB0aGUgZW5kIG9mIGEgY2hhaW4gb2YgcHJvbWlzZXNcbiAqIEByZXR1cm5zIG5vdGhpbmdcbiAqL1xuUS5kb25lID0gZnVuY3Rpb24gKG9iamVjdCwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRvbmUoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHZhciBvblVuaGFuZGxlZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIGZvcndhcmQgdG8gYSBmdXR1cmUgdHVybiBzbyB0aGF0IGBgd2hlbmBgXG4gICAgICAgIC8vIGRvZXMgbm90IGNhdGNoIGl0IGFuZCB0dXJuIGl0IGludG8gYSByZWplY3Rpb24uXG4gICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHVubmVjZXNzYXJ5IGBuZXh0VGlja2BpbmcgdmlhIGFuIHVubmVjZXNzYXJ5IGB3aGVuYC5cbiAgICB2YXIgcHJvbWlzZSA9IGZ1bGZpbGxlZCB8fCByZWplY3RlZCB8fCBwcm9ncmVzcyA/XG4gICAgICAgIHRoaXMudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykgOlxuICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5kb21haW4pIHtcbiAgICAgICAgb25VbmhhbmRsZWRFcnJvciA9IHByb2Nlc3MuZG9tYWluLmJpbmQob25VbmhhbmRsZWRFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvbWlzZS50aGVuKHZvaWQgMCwgb25VbmhhbmRsZWRFcnJvcik7XG59O1xuXG4vKipcbiAqIENhdXNlcyBhIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQgaWYgaXQgZG9lcyBub3QgZ2V0IGZ1bGZpbGxlZCBiZWZvcmVcbiAqIHNvbWUgbWlsbGlzZWNvbmRzIHRpbWUgb3V0LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzIHRpbWVvdXRcbiAqIEBwYXJhbSB7QW55Kn0gY3VzdG9tIGVycm9yIG1lc3NhZ2Ugb3IgRXJyb3Igb2JqZWN0IChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIGVycm9yKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aW1lb3V0KG1zLCBlcnJvcik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKG1zLCBlcnJvcikge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWVycm9yIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBlcnJvcikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3IgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpO1xuICAgICAgICAgICAgZXJyb3IuY29kZSA9IFwiRVRJTUVET1VUXCI7XG4gICAgICAgIH1cbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9zd2lnJyk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBfbW9udGhzID0ge1xuICAgIGZ1bGw6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddLFxuICAgIGFiYnI6IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVxuICB9LFxuICBfZGF5cyA9IHtcbiAgICBmdWxsOiBbJ1N1bmRheScsICdNb25kYXknLCAnVHVlc2RheScsICdXZWRuZXNkYXknLCAnVGh1cnNkYXknLCAnRnJpZGF5JywgJ1NhdHVyZGF5J10sXG4gICAgYWJicjogWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcbiAgICBhbHQ6IHsnLTEnOiAnWWVzdGVyZGF5JywgMDogJ1RvZGF5JywgMTogJ1RvbW9ycm93J31cbiAgfTtcblxuLypcbkRhdGVaIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZTpcbkNvcHlyaWdodCAoYykgMjAxMSBUb21vIFVuaXZlcnNhbGlzIChodHRwOi8vdG9tb3VuaXZlcnNhbGlzLmNvbSlcblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuKi9cbmV4cG9ydHMudHpPZmZzZXQgPSAwO1xuZXhwb3J0cy5EYXRlWiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1lbWJlcnMgPSB7XG4gICAgICAnZGVmYXVsdCc6IFsnZ2V0VVRDRGF0ZScsICdnZXRVVENEYXknLCAnZ2V0VVRDRnVsbFllYXInLCAnZ2V0VVRDSG91cnMnLCAnZ2V0VVRDTWlsbGlzZWNvbmRzJywgJ2dldFVUQ01pbnV0ZXMnLCAnZ2V0VVRDTW9udGgnLCAnZ2V0VVRDU2Vjb25kcycsICd0b0lTT1N0cmluZycsICd0b0dNVFN0cmluZycsICd0b1VUQ1N0cmluZycsICd2YWx1ZU9mJywgJ2dldFRpbWUnXSxcbiAgICAgIHo6IFsnZ2V0RGF0ZScsICdnZXREYXknLCAnZ2V0RnVsbFllYXInLCAnZ2V0SG91cnMnLCAnZ2V0TWlsbGlzZWNvbmRzJywgJ2dldE1pbnV0ZXMnLCAnZ2V0TW9udGgnLCAnZ2V0U2Vjb25kcycsICdnZXRZZWFyJywgJ3RvRGF0ZVN0cmluZycsICd0b0xvY2FsZURhdGVTdHJpbmcnLCAndG9Mb2NhbGVUaW1lU3RyaW5nJ11cbiAgICB9LFxuICAgIGQgPSB0aGlzO1xuXG4gIGQuZGF0ZSA9IGQuZGF0ZVogPSAoYXJndW1lbnRzLmxlbmd0aCA+IDEpID8gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkoRGF0ZSwgYXJndW1lbnRzKSArICgobmV3IERhdGUoKSkuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwMDAwKSkgOiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgPyBuZXcgRGF0ZShuZXcgRGF0ZShhcmd1bWVudHNbJzAnXSkpIDogbmV3IERhdGUoKTtcblxuICBkLnRpbWV6b25lT2Zmc2V0ID0gZC5kYXRlWi5nZXRUaW1lem9uZU9mZnNldCgpO1xuXG4gIHV0aWxzLmVhY2gobWVtYmVycy56LCBmdW5jdGlvbiAobmFtZSkge1xuICAgIGRbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZC5kYXRlWltuYW1lXSgpO1xuICAgIH07XG4gIH0pO1xuICB1dGlscy5lYWNoKG1lbWJlcnNbJ2RlZmF1bHQnXSwgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBkW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGQuZGF0ZVtuYW1lXSgpO1xuICAgIH07XG4gIH0pO1xuXG4gIHRoaXMuc2V0VGltZXpvbmVPZmZzZXQoZXhwb3J0cy50ek9mZnNldCk7XG59O1xuZXhwb3J0cy5EYXRlWi5wcm90b3R5cGUgPSB7XG4gIGdldFRpbWV6b25lT2Zmc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGltZXpvbmVPZmZzZXQ7XG4gIH0sXG4gIHNldFRpbWV6b25lT2Zmc2V0OiBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gICAgdGhpcy50aW1lem9uZU9mZnNldCA9IG9mZnNldDtcbiAgICB0aGlzLmRhdGVaID0gbmV3IERhdGUodGhpcy5kYXRlLmdldFRpbWUoKSArIHRoaXMuZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpICogNjAwMDAgLSB0aGlzLnRpbWV6b25lT2Zmc2V0ICogNjAwMDApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuXG4vLyBEYXlcbmV4cG9ydHMuZCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gKGlucHV0LmdldERhdGUoKSA8IDEwID8gJzAnIDogJycpICsgaW5wdXQuZ2V0RGF0ZSgpO1xufTtcbmV4cG9ydHMuRCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gX2RheXMuYWJicltpbnB1dC5nZXREYXkoKV07XG59O1xuZXhwb3J0cy5qID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5nZXREYXRlKCk7XG59O1xuZXhwb3J0cy5sID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBfZGF5cy5mdWxsW2lucHV0LmdldERheSgpXTtcbn07XG5leHBvcnRzLk4gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIGQgPSBpbnB1dC5nZXREYXkoKTtcbiAgcmV0dXJuIChkID49IDEpID8gZCA6IDc7XG59O1xuZXhwb3J0cy5TID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBkID0gaW5wdXQuZ2V0RGF0ZSgpO1xuICByZXR1cm4gKGQgJSAxMCA9PT0gMSAmJiBkICE9PSAxMSA/ICdzdCcgOiAoZCAlIDEwID09PSAyICYmIGQgIT09IDEyID8gJ25kJyA6IChkICUgMTAgPT09IDMgJiYgZCAhPT0gMTMgPyAncmQnIDogJ3RoJykpKTtcbn07XG5leHBvcnRzLncgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldERheSgpO1xufTtcbmV4cG9ydHMueiA9IGZ1bmN0aW9uIChpbnB1dCwgb2Zmc2V0LCBhYmJyKSB7XG4gIHZhciB5ZWFyID0gaW5wdXQuZ2V0RnVsbFllYXIoKSxcbiAgICBlID0gbmV3IGV4cG9ydHMuRGF0ZVooeWVhciwgaW5wdXQuZ2V0TW9udGgoKSwgaW5wdXQuZ2V0RGF0ZSgpLCAxMiwgMCwgMCksXG4gICAgZCA9IG5ldyBleHBvcnRzLkRhdGVaKHllYXIsIDAsIDEsIDEyLCAwLCAwKTtcblxuICBlLnNldFRpbWV6b25lT2Zmc2V0KG9mZnNldCwgYWJicik7XG4gIGQuc2V0VGltZXpvbmVPZmZzZXQob2Zmc2V0LCBhYmJyKTtcbiAgcmV0dXJuIE1hdGgucm91bmQoKGUgLSBkKSAvIDg2NDAwMDAwKTtcbn07XG5cbi8vIFdlZWtcbmV4cG9ydHMuVyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgdGFyZ2V0ID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKSxcbiAgICBkYXlOciA9IChpbnB1dC5nZXREYXkoKSArIDYpICUgNyxcbiAgICBmVGh1cnM7XG5cbiAgdGFyZ2V0LnNldERhdGUodGFyZ2V0LmdldERhdGUoKSAtIGRheU5yICsgMyk7XG4gIGZUaHVycyA9IHRhcmdldC52YWx1ZU9mKCk7XG4gIHRhcmdldC5zZXRNb250aCgwLCAxKTtcbiAgaWYgKHRhcmdldC5nZXREYXkoKSAhPT0gNCkge1xuICAgIHRhcmdldC5zZXRNb250aCgwLCAxICsgKCg0IC0gdGFyZ2V0LmdldERheSgpKSArIDcpICUgNyk7XG4gIH1cblxuICByZXR1cm4gMSArIE1hdGguY2VpbCgoZlRodXJzIC0gdGFyZ2V0KSAvIDYwNDgwMDAwMCk7XG59O1xuXG4vLyBNb250aFxuZXhwb3J0cy5GID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBfbW9udGhzLmZ1bGxbaW5wdXQuZ2V0TW9udGgoKV07XG59O1xuZXhwb3J0cy5tID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiAoaW5wdXQuZ2V0TW9udGgoKSA8IDkgPyAnMCcgOiAnJykgKyAoaW5wdXQuZ2V0TW9udGgoKSArIDEpO1xufTtcbmV4cG9ydHMuTSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gX21vbnRocy5hYmJyW2lucHV0LmdldE1vbnRoKCldO1xufTtcbmV4cG9ydHMubiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0TW9udGgoKSArIDE7XG59O1xuZXhwb3J0cy50ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiAzMiAtIChuZXcgRGF0ZShpbnB1dC5nZXRGdWxsWWVhcigpLCBpbnB1dC5nZXRNb250aCgpLCAzMikuZ2V0RGF0ZSgpKTtcbn07XG5cbi8vIFllYXJcbmV4cG9ydHMuTCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gbmV3IERhdGUoaW5wdXQuZ2V0RnVsbFllYXIoKSwgMSwgMjkpLmdldERhdGUoKSA9PT0gMjk7XG59O1xuZXhwb3J0cy5vID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciB0YXJnZXQgPSBuZXcgRGF0ZShpbnB1dC52YWx1ZU9mKCkpO1xuICB0YXJnZXQuc2V0RGF0ZSh0YXJnZXQuZ2V0RGF0ZSgpIC0gKChpbnB1dC5nZXREYXkoKSArIDYpICUgNykgKyAzKTtcbiAgcmV0dXJuIHRhcmdldC5nZXRGdWxsWWVhcigpO1xufTtcbmV4cG9ydHMuWSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0RnVsbFllYXIoKTtcbn07XG5leHBvcnRzLnkgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIChpbnB1dC5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkpLnN1YnN0cigyKTtcbn07XG5cbi8vIFRpbWVcbmV4cG9ydHMuYSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0SG91cnMoKSA8IDEyID8gJ2FtJyA6ICdwbSc7XG59O1xuZXhwb3J0cy5BID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5nZXRIb3VycygpIDwgMTIgPyAnQU0nIDogJ1BNJztcbn07XG5leHBvcnRzLkIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIGhvdXJzID0gaW5wdXQuZ2V0VVRDSG91cnMoKSwgYmVhdHM7XG4gIGhvdXJzID0gKGhvdXJzID09PSAyMykgPyAwIDogaG91cnMgKyAxO1xuICBiZWF0cyA9IE1hdGguYWJzKCgoKChob3VycyAqIDYwKSArIGlucHV0LmdldFVUQ01pbnV0ZXMoKSkgKiA2MCkgKyBpbnB1dC5nZXRVVENTZWNvbmRzKCkpIC8gODYuNCkudG9GaXhlZCgwKTtcbiAgcmV0dXJuICgnMDAwJy5jb25jYXQoYmVhdHMpLnNsaWNlKGJlYXRzLmxlbmd0aCkpO1xufTtcbmV4cG9ydHMuZyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgaCA9IGlucHV0LmdldEhvdXJzKCk7XG4gIHJldHVybiBoID09PSAwID8gMTIgOiAoaCA+IDEyID8gaCAtIDEyIDogaCk7XG59O1xuZXhwb3J0cy5HID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5nZXRIb3VycygpO1xufTtcbmV4cG9ydHMuaCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgaCA9IGlucHV0LmdldEhvdXJzKCk7XG4gIHJldHVybiAoKGggPCAxMCB8fCAoMTIgPCBoICYmIDIyID4gaCkpID8gJzAnIDogJycpICsgKChoIDwgMTIpID8gaCA6IGggLSAxMik7XG59O1xuZXhwb3J0cy5IID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBoID0gaW5wdXQuZ2V0SG91cnMoKTtcbiAgcmV0dXJuIChoIDwgMTAgPyAnMCcgOiAnJykgKyBoO1xufTtcbmV4cG9ydHMuaSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgbSA9IGlucHV0LmdldE1pbnV0ZXMoKTtcbiAgcmV0dXJuIChtIDwgMTAgPyAnMCcgOiAnJykgKyBtO1xufTtcbmV4cG9ydHMucyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgcyA9IGlucHV0LmdldFNlY29uZHMoKTtcbiAgcmV0dXJuIChzIDwgMTAgPyAnMCcgOiAnJykgKyBzO1xufTtcbi8vdSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcnOyB9LFxuXG4vLyBUaW1lem9uZVxuLy9lID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJyc7IH0sXG4vL0kgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnJzsgfSxcbmV4cG9ydHMuTyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgdHogPSBpbnB1dC5nZXRUaW1lem9uZU9mZnNldCgpO1xuICByZXR1cm4gKHR6IDwgMCA/ICctJyA6ICcrJykgKyAodHogLyA2MCA8IDEwID8gJzAnIDogJycpICsgTWF0aC5hYnMoKHR6IC8gNjApKSArICcwMCc7XG59O1xuLy9UID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJyc7IH0sXG5leHBvcnRzLlogPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDtcbn07XG5cbi8vIEZ1bGwgRGF0ZS9UaW1lXG5leHBvcnRzLmMgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnRvSVNPU3RyaW5nKCk7XG59O1xuZXhwb3J0cy5yID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1VUQ1N0cmluZygpO1xufTtcbmV4cG9ydHMuVSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQuZ2V0VGltZSgpIC8gMTAwMDtcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gIGRhdGVGb3JtYXR0ZXIgPSByZXF1aXJlKCcuL2RhdGVmb3JtYXR0ZXInKTtcblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIHJlY3Vyc2l2ZWx5IHJ1biBhIGZpbHRlciBhY3Jvc3MgYW4gb2JqZWN0L2FycmF5IGFuZCBhcHBseSBpdCB0byBhbGwgb2YgdGhlIG9iamVjdC9hcnJheSdzIHZhbHVlcy5cbiAqIEBwYXJhbSAgeyp9IGlucHV0XG4gKiBAcmV0dXJuIHsqfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaXRlcmF0ZUZpbHRlcihpbnB1dCkge1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgb3V0ID0ge307XG5cbiAgaWYgKHV0aWxzLmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgcmV0dXJuIHV0aWxzLm1hcChpbnB1dCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gc2VsZi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcpIHtcbiAgICB1dGlscy5lYWNoKGlucHV0LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgb3V0W2tleV0gPSBzZWxmLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybjtcbn1cblxuLyoqXG4gKiBCYWNrc2xhc2gtZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBuZWVkIHRvIGJlIGVzY2FwZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIHt7IFwiXFxcInF1b3RlZCBzdHJpbmdcXFwiXCJ8YWRkc2xhc2hlcyB9fVxuICogLy8gPT4gXFxcInF1b3RlZCBzdHJpbmdcXFwiXG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgQmFja3NsYXNoLWVzY2FwZWQgc3RyaW5nLlxuICovXG5leHBvcnRzLmFkZHNsYXNoZXMgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy5hZGRzbGFzaGVzLCBhcmd1bWVudHMpO1xuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykucmVwbGFjZSgvXFwnL2csIFwiXFxcXCdcIikucmVwbGFjZSgvXFxcIi9nLCAnXFxcXFwiJyk7XG59O1xuXG4vKipcbiAqIFVwcGVyLWNhc2UgdGhlIGZpcnN0IGxldHRlciBvZiB0aGUgaW5wdXQgYW5kIGxvd2VyLWNhc2UgdGhlIHJlc3QuXG4gKlxuICogQGV4YW1wbGVcbiAqIHt7IFwiaSBsaWtlIEJ1cnJpdG9zXCJ8Y2FwaXRhbGl6ZSB9fVxuICogLy8gPT4gSSBsaWtlIGJ1cnJpdG9zXG4gKlxuICogQHBhcmFtICB7Kn0gaW5wdXQgIElmIGdpdmVuIGFuIGFycmF5IG9yIG9iamVjdCwgZWFjaCBzdHJpbmcgbWVtYmVyIHdpbGwgYmUgcnVuIHRocm91Z2ggdGhlIGZpbHRlciBpbmRpdmlkdWFsbHkuXG4gKiBAcmV0dXJuIHsqfSAgICAgICAgUmV0dXJucyB0aGUgc2FtZSB0eXBlIGFzIHRoZSBpbnB1dC5cbiAqL1xuZXhwb3J0cy5jYXBpdGFsaXplID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMuY2FwaXRhbGl6ZSwgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgaW5wdXQudG9TdHJpbmcoKS5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcbn07XG5cbi8qKlxuICogRm9ybWF0IGEgZGF0ZSBvciBEYXRlLWNvbXBhdGlibGUgc3RyaW5nLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBub3cgPSBuZXcgRGF0ZSgpO1xuICoge3sgbm93fGRhdGUoJ1ktbS1kJykgfX1cbiAqIC8vID0+IDIwMTMtMDgtMTRcbiAqIEBleGFtcGxlXG4gKiAvLyBub3cgPSBuZXcgRGF0ZSgpO1xuICoge3sgbm93fGRhdGUoJ2pTIFxcb1xcZiBGJykgfX1cbiAqIC8vID0+IDR0aCBvZiBKdWx5XG4gKlxuICogQHBhcmFtICB7PyhzdHJpbmd8ZGF0ZSl9ICAgaW5wdXRcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgIGZvcm1hdCAgUEhQLXN0eWxlIGRhdGUgZm9ybWF0IGNvbXBhdGlibGUgc3RyaW5nLiBFc2NhcGUgY2hhcmFjdGVycyB3aXRoIDxjb2RlPlxcPC9jb2RlPiBmb3Igc3RyaW5nIGxpdGVyYWxzLlxuICogQHBhcmFtICB7bnVtYmVyPX0gICAgICAgICAgb2Zmc2V0ICBUaW1lem9uZSBvZmZzZXQgZnJvbSBHTVQgaW4gbWludXRlcy5cbiAqIEBwYXJhbSAge3N0cmluZz19ICAgICAgICAgIGFiYnIgICAgVGltZXpvbmUgYWJicmV2aWF0aW9uLiBVc2VkIGZvciBvdXRwdXQgb25seS5cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgRm9ybWF0dGVkIGRhdGUgc3RyaW5nLlxuICovXG5leHBvcnRzLmRhdGUgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgb2Zmc2V0LCBhYmJyKSB7XG4gIHZhciBsID0gZm9ybWF0Lmxlbmd0aCxcbiAgICBkYXRlID0gbmV3IGRhdGVGb3JtYXR0ZXIuRGF0ZVooaW5wdXQpLFxuICAgIGN1cixcbiAgICBpID0gMCxcbiAgICBvdXQgPSAnJztcblxuICBpZiAob2Zmc2V0KSB7XG4gICAgZGF0ZS5zZXRUaW1lem9uZU9mZnNldChvZmZzZXQsIGFiYnIpO1xuICB9XG5cbiAgZm9yIChpOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgY3VyID0gZm9ybWF0LmNoYXJBdChpKTtcbiAgICBpZiAoY3VyID09PSAnXFxcXCcpIHtcbiAgICAgIGkgKz0gMTtcbiAgICAgIG91dCArPSAoaSA8IGwpID8gZm9ybWF0LmNoYXJBdChpKSA6IGN1cjtcbiAgICB9IGVsc2UgaWYgKGRhdGVGb3JtYXR0ZXIuaGFzT3duUHJvcGVydHkoY3VyKSkge1xuICAgICAgb3V0ICs9IGRhdGVGb3JtYXR0ZXJbY3VyXShkYXRlLCBvZmZzZXQsIGFiYnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gY3VyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJZiB0aGUgaW5wdXQgaXMgYHVuZGVmaW5lZGAsIGBudWxsYCwgb3IgYGZhbHNlYCwgYSBkZWZhdWx0IHJldHVybiB2YWx1ZSBjYW4gYmUgc3BlY2lmaWVkLlxuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBudWxsX3ZhbHVlfGRlZmF1bHQoJ1RhY29zJykgfX1cbiAqIC8vID0+IFRhY29zXG4gKlxuICogQGV4YW1wbGVcbiAqIHt7IFwiQnVycml0b3NcInxkZWZhdWx0KFwiVGFjb3NcIikgfX1cbiAqIC8vID0+IEJ1cnJpdG9zXG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcGFyYW0gIHsqfSAgZGVmICAgICBWYWx1ZSB0byByZXR1cm4gaWYgYGlucHV0YCBpcyBgdW5kZWZpbmVkYCwgYG51bGxgLCBvciBgZmFsc2VgLlxuICogQHJldHVybiB7Kn0gICAgICAgICAgYGlucHV0YCBvciBgZGVmYCB2YWx1ZS5cbiAqL1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoaW5wdXQsIGRlZikge1xuICByZXR1cm4gKHR5cGVvZiBpbnB1dCAhPT0gJ3VuZGVmaW5lZCcgJiYgKGlucHV0IHx8IHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpKSA/IGlucHV0IDogZGVmO1xufTtcblxuLyoqXG4gKiBGb3JjZSBlc2NhcGUgdGhlIG91dHB1dCBvZiB0aGUgdmFyaWFibGUuIE9wdGlvbmFsbHkgdXNlIGBlYCBhcyBhIHNob3J0Y3V0IGZpbHRlciBuYW1lLiBUaGlzIGZpbHRlciB3aWxsIGJlIGFwcGxpZWQgYnkgZGVmYXVsdCBpZiBhdXRvZXNjYXBlIGlzIHR1cm5lZCBvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICoge3sgXCI8YmxhaD5cInxlc2NhcGUgfX1cbiAqIC8vID0+ICZsdDtibGFoJmd0O1xuICpcbiAqIEBleGFtcGxlXG4gKiB7eyBcIjxibGFoPlwifGUoXCJqc1wiKSB9fVxuICogLy8gPT4gXFx1MDAzQ2JsYWhcXHUwMDNFXG4gKlxuICogQHBhcmFtICB7Kn0gaW5wdXRcbiAqIEBwYXJhbSAge3N0cmluZ30gW3R5cGU9J2h0bWwnXSAgIElmIHlvdSBwYXNzIHRoZSBzdHJpbmcganMgaW4gYXMgdGhlIHR5cGUsIG91dHB1dCB3aWxsIGJlIGVzY2FwZWQgc28gdGhhdCBpdCBpcyBzYWZlIGZvciBKYXZhU2NyaXB0IGV4ZWN1dGlvbi5cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICBFc2NhcGVkIHN0cmluZy5cbiAqL1xuZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbiAoaW5wdXQsIHR5cGUpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy5lc2NhcGUsIGFyZ3VtZW50cyksXG4gICAgaW5wID0gaW5wdXQsXG4gICAgaSA9IDAsXG4gICAgY29kZTtcblxuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICBvdXQgPSAnJztcblxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgY2FzZSAnanMnOlxuICAgIGlucCA9IGlucC5yZXBsYWNlKC9cXFxcL2csICdcXFxcdTAwNUMnKTtcbiAgICBmb3IgKGk7IGkgPCBpbnAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvZGUgPSBpbnAuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlIDwgMzIpIHtcbiAgICAgICAgY29kZSA9IGNvZGUudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGNvZGUgPSAoY29kZS5sZW5ndGggPCAyKSA/ICcwJyArIGNvZGUgOiBjb2RlO1xuICAgICAgICBvdXQgKz0gJ1xcXFx1MDAnICsgY29kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dCArPSBpbnBbaV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQucmVwbGFjZSgvJi9nLCAnXFxcXHUwMDI2JylcbiAgICAgIC5yZXBsYWNlKC88L2csICdcXFxcdTAwM0MnKVxuICAgICAgLnJlcGxhY2UoLz4vZywgJ1xcXFx1MDAzRScpXG4gICAgICAucmVwbGFjZSgvXFwnL2csICdcXFxcdTAwMjcnKVxuICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFxcdTAwMjInKVxuICAgICAgLnJlcGxhY2UoL1xcPS9nLCAnXFxcXHUwMDNEJylcbiAgICAgIC5yZXBsYWNlKC8tL2csICdcXFxcdTAwMkQnKVxuICAgICAgLnJlcGxhY2UoLzsvZywgJ1xcXFx1MDAzQicpO1xuXG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIGlucC5yZXBsYWNlKC8mKD8hYW1wO3xsdDt8Z3Q7fHF1b3Q7fCMzOTspL2csICcmYW1wOycpXG4gICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbiAgfVxufTtcbmV4cG9ydHMuZSA9IGV4cG9ydHMuZXNjYXBlO1xuXG4vKipcbiAqIEdldCB0aGUgZmlyc3QgaXRlbSBpbiBhbiBhcnJheSBvciBjaGFyYWN0ZXIgaW4gYSBzdHJpbmcuIEFsbCBvdGhlciBvYmplY3RzIHdpbGwgYXR0ZW1wdCB0byByZXR1cm4gdGhlIGZpcnN0IHZhbHVlIGF2YWlsYWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfYXJyID0gWydhJywgJ2InLCAnYyddXG4gKiB7eyBteV9hcnJ8Zmlyc3QgfX1cbiAqIC8vID0+IGFcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfdmFsID0gJ1RhY29zJ1xuICoge3sgbXlfdmFsfGZpcnN0IH19XG4gKiAvLyBUXG4gKlxuICogQHBhcmFtICB7Kn0gaW5wdXRcbiAqIEByZXR1cm4geyp9ICAgICAgICBUaGUgZmlyc3QgaXRlbSBvZiB0aGUgYXJyYXkgb3IgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBzdHJpbmcgaW5wdXQuXG4gKi9cbmV4cG9ydHMuZmlyc3QgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgIXV0aWxzLmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgdmFyIGtleXMgPSB1dGlscy5rZXlzKGlucHV0KTtcbiAgICByZXR1cm4gaW5wdXRba2V5c1swXV07XG4gIH1cblxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBpbnB1dC5zdWJzdHIoMCwgMSk7XG4gIH1cblxuICByZXR1cm4gaW5wdXRbMF07XG59O1xuXG4vKipcbiAqIEdyb3VwIGFuIGFycmF5IG9mIG9iamVjdHMgYnkgYSBjb21tb24ga2V5LiBJZiBhbiBhcnJheSBpcyBub3QgcHJvdmlkZWQsIHRoZSBpbnB1dCB2YWx1ZSB3aWxsIGJlIHJldHVybmVkIHVudG91Y2hlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gcGVvcGxlID0gW3sgYWdlOiAyMywgbmFtZTogJ1BhdWwnIH0sIHsgYWdlOiAyNiwgbmFtZTogJ0phbmUnIH0sIHsgYWdlOiAyMywgbmFtZTogJ0ppbScgfV07XG4gKiB7JSBmb3IgYWdlZ3JvdXAgaW4gcGVvcGxlfGdyb3VwQnkoJ2FnZScpICV9XG4gKiAgIDxoMj57eyBsb29wLmtleSB9fTwvaDI+XG4gKiAgIDx1bD5cbiAqICAgICB7JSBmb3IgcGVyc29uIGluIGFnZWdyb3VwICV9XG4gKiAgICAgPGxpPnt7IHBlcnNvbi5uYW1lIH19PC9saT5cbiAqICAgICB7JSBlbmRmb3IgJX1cbiAqICAgPC91bD5cbiAqIHslIGVuZGZvciAlfVxuICpcbiAqIEBwYXJhbSAgeyp9ICAgICAgaW5wdXQgSW5wdXQgb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICBLZXkgdG8gZ3JvdXAgYnkuXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIEdyb3VwZWQgYXJyYXlzIGJ5IGdpdmVuIGtleS5cbiAqL1xuZXhwb3J0cy5ncm91cEJ5ID0gZnVuY3Rpb24gKGlucHV0LCBrZXkpIHtcbiAgaWYgKCF1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIHJldHVybiBpbnB1dDtcbiAgfVxuXG4gIHZhciBvdXQgPSB7fTtcblxuICB1dGlscy5lYWNoKGlucHV0LCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoIXZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIga2V5bmFtZSA9IHZhbHVlW2tleV0sXG4gICAgICBuZXdWYWwgPSB1dGlscy5leHRlbmQoe30sIHZhbHVlKTtcbiAgICBkZWxldGUgdmFsdWVba2V5XTtcblxuICAgIGlmICghb3V0W2tleW5hbWVdKSB7XG4gICAgICBvdXRba2V5bmFtZV0gPSBbXTtcbiAgICB9XG5cbiAgICBvdXRba2V5bmFtZV0ucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEpvaW4gdGhlIGlucHV0IHdpdGggYSBzdHJpbmcuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2FycmF5ID0gWydmb28nLCAnYmFyJywgJ2JheiddXG4gKiB7eyBteV9hcnJheXxqb2luKCcsICcpIH19XG4gKiAvLyA9PiBmb28sIGJhciwgYmF6XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X2tleV9vYmplY3QgPSB7IGE6ICdmb28nLCBiOiAnYmFyJywgYzogJ2JheicgfVxuICoge3sgbXlfa2V5X29iamVjdHxqb2luKCcgYW5kICcpIH19XG4gKiAvLyA9PiBmb28gYW5kIGJhciBhbmQgYmF6XG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcGFyYW0gIHtzdHJpbmd9IGdsdWUgICAgU3RyaW5nIHZhbHVlIHRvIGpvaW4gaXRlbXMgdG9nZXRoZXIuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uIChpbnB1dCwgZ2x1ZSkge1xuICBpZiAodXRpbHMuaXNBcnJheShpbnB1dCkpIHtcbiAgICByZXR1cm4gaW5wdXQuam9pbihnbHVlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIHV0aWxzLmVhY2goaW5wdXQsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgb3V0LnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBvdXQuam9pbihnbHVlKTtcbiAgfVxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbiBKYXZhU2NyaXB0IG9iamVjdC5cbiAqXG4gKiBCYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIHN3aWdAMC54LnggdXNpbmcgYGpzb25fZW5jb2RlYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gdmFsID0geyBhOiAnYicgfVxuICoge3sgdmFsfGpzb24gfX1cbiAqIC8vID0+IHtcImFcIjpcImJcIn1cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gdmFsID0geyBhOiAnYicgfVxuICoge3sgdmFsfGpzb24oNCkgfX1cbiAqIC8vID0+IHtcbiAqIC8vICAgICAgICBcImFcIjogXCJiXCJcbiAqIC8vICAgIH1cbiAqXG4gKiBAcGFyYW0gIHsqfSAgICBpbnB1dFxuICogQHBhcmFtICB7bnVtYmVyfSAgW2luZGVudF0gIE51bWJlciBvZiBzcGFjZXMgdG8gaW5kZW50IGZvciBwcmV0dHktZm9ybWF0dGluZy5cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgIEEgdmFsaWQgSlNPTiBzdHJpbmcuXG4gKi9cbmV4cG9ydHMuanNvbiA9IGZ1bmN0aW9uIChpbnB1dCwgaW5kZW50KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShpbnB1dCwgbnVsbCwgaW5kZW50IHx8IDApO1xufTtcbmV4cG9ydHMuanNvbl9lbmNvZGUgPSBleHBvcnRzLmpzb247XG5cbi8qKlxuICogR2V0IHRoZSBsYXN0IGl0ZW0gaW4gYW4gYXJyYXkgb3IgY2hhcmFjdGVyIGluIGEgc3RyaW5nLiBBbGwgb3RoZXIgb2JqZWN0cyB3aWxsIGF0dGVtcHQgdG8gcmV0dXJuIHRoZSBsYXN0IHZhbHVlIGF2YWlsYWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfYXJyID0gWydhJywgJ2InLCAnYyddXG4gKiB7eyBteV9hcnJ8bGFzdCB9fVxuICogLy8gPT4gY1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV92YWwgPSAnVGFjb3MnXG4gKiB7eyBteV92YWx8bGFzdCB9fVxuICogLy8gc1xuICpcbiAqIEBwYXJhbSAgeyp9IGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgICBUaGUgbGFzdCBpdGVtIG9mIHRoZSBhcnJheSBvciBsYXN0IGNoYXJhY3RlciBvZiB0aGUgc3RyaW5nLmlucHV0LlxuICovXG5leHBvcnRzLmxhc3QgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgIXV0aWxzLmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgdmFyIGtleXMgPSB1dGlscy5rZXlzKGlucHV0KTtcbiAgICByZXR1cm4gaW5wdXRba2V5c1trZXlzLmxlbmd0aCAtIDFdXTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGlucHV0LmNoYXJBdChpbnB1dC5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiBpbnB1dFtpbnB1dC5sZW5ndGggLSAxXTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBpbnB1dCBpbiBhbGwgbG93ZXJjYXNlIGxldHRlcnMuXG4gKlxuICogQGV4YW1wbGVcbiAqIHt7IFwiRk9PQkFSXCJ8bG93ZXIgfX1cbiAqIC8vID0+IGZvb2JhclxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteU9iaiA9IHsgYTogJ0ZPTycsIGI6ICdCQVInIH1cbiAqIHt7IG15T2JqfGxvd2VyfGpvaW4oJycpIH19XG4gKiAvLyA9PiBmb29iYXJcbiAqXG4gKiBAcGFyYW0gIHsqfSAgaW5wdXRcbiAqIEByZXR1cm4geyp9ICAgICAgICAgIFJldHVybnMgdGhlIHNhbWUgdHlwZSBhcyB0aGUgaW5wdXQuXG4gKi9cbmV4cG9ydHMubG93ZXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy5sb3dlciwgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG4vKipcbiAqIERlcHJlY2F0ZWQgaW4gZmF2b3Igb2YgPGEgaHJlZj1cIiNzYWZlXCI+c2FmZTwvYT4uXG4gKi9cbmV4cG9ydHMucmF3ID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBleHBvcnRzLnNhZmUoaW5wdXQpO1xufTtcbmV4cG9ydHMucmF3LnNhZmUgPSB0cnVlO1xuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgc3RyaW5nIHdpdGggdGhlIG1hdGNoZWQgc2VhcmNoIHBhdHRlcm4gcmVwbGFjZWQgYnkgdGhlIGdpdmVuIHJlcGxhY2VtZW50IHN0cmluZy4gVXNlcyBKYXZhU2NyaXB0J3MgYnVpbHQtaW4gU3RyaW5nLnJlcGxhY2UoKSBtZXRob2QuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X3ZhciA9ICdmb29iYXInO1xuICoge3sgbXlfdmFyfHJlcGxhY2UoJ28nLCAnZScsICdnJykgfX1cbiAqIC8vID0+IGZlZWJhclxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV92YXIgPSBcImZhcmZlZ251Z2VuXCI7XG4gKiB7eyBteV92YXJ8cmVwbGFjZSgnXmYnLCAncCcpIH19XG4gKiAvLyA9PiBwYXJmZWdudWdlblxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV92YXIgPSAnYTFiMmMzJztcbiAqIHt7IG15X3ZhcnxyZXBsYWNlKCdcXHcnLCAnMCcsICdnJykgfX1cbiAqIC8vID0+IDAxMDIwM1xuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gaW5wdXRcbiAqIEBwYXJhbSAge3N0cmluZ30gc2VhcmNoICAgICAgU3RyaW5nIG9yIHBhdHRlcm4gdG8gcmVwbGFjZSBmcm9tIHRoZSBpbnB1dC5cbiAqIEBwYXJhbSAge3N0cmluZ30gcmVwbGFjZW1lbnQgU3RyaW5nIHRvIHJlcGxhY2UgbWF0Y2hlZCBwYXR0ZXJuLlxuICogQHBhcmFtICB7c3RyaW5nfSBbZmxhZ3NdICAgICAgUmVndWxhciBFeHByZXNzaW9uIGZsYWdzLiAnZyc6IGdsb2JhbCBtYXRjaCwgJ2knOiBpZ25vcmUgY2FzZSwgJ20nOiBtYXRjaCBvdmVyIG11bHRpcGxlIGxpbmVzXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgIFJlcGxhY2VkIHN0cmluZy5cbiAqL1xuZXhwb3J0cy5yZXBsYWNlID0gZnVuY3Rpb24gKGlucHV0LCBzZWFyY2gsIHJlcGxhY2VtZW50LCBmbGFncykge1xuICB2YXIgciA9IG5ldyBSZWdFeHAoc2VhcmNoLCBmbGFncyk7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKHIsIHJlcGxhY2VtZW50KTtcbn07XG5cbi8qKlxuICogUmV2ZXJzZSBzb3J0IHRoZSBpbnB1dC4gVGhpcyBpcyBhbiBhbGlhcyBmb3IgPGNvZGUgZGF0YS1sYW5ndWFnZT1cInN3aWdcIj57eyBpbnB1dHxzb3J0KHRydWUpIH19PC9jb2RlPi5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gdmFsID0gWzEsIDIsIDNdO1xuICoge3sgdmFsfHJldmVyc2UgfX1cbiAqIC8vID0+IDMsMiwxXG4gKlxuICogQHBhcmFtICB7YXJyYXl9ICBpbnB1dFxuICogQHJldHVybiB7YXJyYXl9ICAgICAgICBSZXZlcnNlZCBhcnJheS4gVGhlIG9yaWdpbmFsIGlucHV0IG9iamVjdCBpcyByZXR1cm5lZCBpZiBpdCB3YXMgbm90IGFuIGFycmF5LlxuICovXG5leHBvcnRzLnJldmVyc2UgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgcmV0dXJuIGV4cG9ydHMuc29ydChpbnB1dCwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIEZvcmNlcyB0aGUgaW5wdXQgdG8gbm90IGJlIGF1dG8tZXNjYXBlZC4gVXNlIHRoaXMgb25seSBvbiBjb250ZW50IHRoYXQgeW91IGtub3cgaXMgc2FmZSB0byBiZSByZW5kZXJlZCBvbiB5b3VyIHBhZ2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIG15X3ZhciA9IFwiPHA+U3R1ZmY8L3A+XCI7XG4gKiB7eyBteV92YXJ8c2FmZSB9fVxuICogLy8gPT4gPHA+U3R1ZmY8L3A+XG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgICBUaGUgaW5wdXQgZXhhY3RseSBob3cgaXQgd2FzIGdpdmVuLCByZWdhcmRsZXNzIG9mIGF1dG9lc2NhcGluZyBzdGF0dXMuXG4gKi9cbmV4cG9ydHMuc2FmZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAvLyBUaGlzIGlzIGEgbWFnaWMgZmlsdGVyLiBJdHMgbG9naWMgaXMgaGFyZC1jb2RlZCBpbnRvIFN3aWcncyBwYXJzZXIuXG4gIHJldHVybiBpbnB1dDtcbn07XG5leHBvcnRzLnNhZmUuc2FmZSA9IHRydWU7XG5cbi8qKlxuICogU29ydCB0aGUgaW5wdXQgaW4gYW4gYXNjZW5kaW5nIGRpcmVjdGlvbi5cbiAqIElmIGdpdmVuIGFuIG9iamVjdCwgd2lsbCByZXR1cm4gdGhlIGtleXMgYXMgYSBzb3J0ZWQgYXJyYXkuXG4gKiBJZiBnaXZlbiBhIHN0cmluZywgZWFjaCBjaGFyYWN0ZXIgd2lsbCBiZSBzb3J0ZWQgaW5kaXZpZHVhbGx5LlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyB2YWwgPSBbMiwgNiwgNF07XG4gKiB7eyB2YWx8c29ydCB9fVxuICogLy8gPT4gMiw0LDZcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gdmFsID0gJ3phcSc7XG4gKiB7eyB2YWx8c29ydCB9fVxuICogLy8gPT4gYXF6XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIHZhbCA9IHsgYmFyOiAxLCBmb286IDIgfVxuICoge3sgdmFsfHNvcnQodHJ1ZSkgfX1cbiAqIC8vID0+IGZvbyxiYXJcbiAqXG4gKiBAcGFyYW0gIHsqfSBpbnB1dFxuICogQHBhcmFtIHtib29sZWFufSBbcmV2ZXJzZT1mYWxzZV0gT3V0cHV0IGlzIGdpdmVuIHJldmVyc2Utc29ydGVkIGlmIHRydWUuXG4gKiBAcmV0dXJuIHsqfSAgICAgICAgU29ydGVkIGFycmF5O1xuICovXG5leHBvcnRzLnNvcnQgPSBmdW5jdGlvbiAoaW5wdXQsIHJldmVyc2UpIHtcbiAgdmFyIG91dDtcbiAgaWYgKHV0aWxzLmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgb3V0ID0gaW5wdXQuc29ydCgpO1xuICB9IGVsc2Uge1xuICAgIHN3aXRjaCAodHlwZW9mIGlucHV0KSB7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIG91dCA9IHV0aWxzLmtleXMoaW5wdXQpLnNvcnQoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICBvdXQgPSBpbnB1dC5zcGxpdCgnJyk7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gb3V0LnJldmVyc2UoKS5qb2luKCcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvdXQuc29ydCgpLmpvaW4oJycpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvdXQgJiYgcmV2ZXJzZSkge1xuICAgIHJldHVybiBvdXQucmV2ZXJzZSgpO1xuICB9XG5cbiAgcmV0dXJuIG91dCB8fCBpbnB1dDtcbn07XG5cbi8qKlxuICogU3RyaXAgSFRNTCB0YWdzLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBzdHVmZiA9ICc8cD5mb29iYXI8L3A+JztcbiAqIHt7IHN0dWZmfHN0cmlwdGFncyB9fVxuICogLy8gPT4gZm9vYmFyXG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgUmV0dXJucyB0aGUgc2FtZSBvYmplY3QgYXMgdGhlIGlucHV0LCBidXQgd2l0aCBhbGwgc3RyaW5nIHZhbHVlcyBzdHJpcHBlZCBvZiB0YWdzLlxuICovXG5leHBvcnRzLnN0cmlwdGFncyA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgb3V0ID0gaXRlcmF0ZUZpbHRlci5hcHBseShleHBvcnRzLnN0cmlwdGFncywgYXJndW1lbnRzKTtcbiAgaWYgKG91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCAnJyk7XG59O1xuXG4vKipcbiAqIENhcGl0YWxpemVzIGV2ZXJ5IHdvcmQgZ2l2ZW4gYW5kIGxvd2VyLWNhc2VzIGFsbCBvdGhlciBsZXR0ZXJzLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV9zdHIgPSAndGhpcyBpcyBzb01lIHRleHQnO1xuICoge3sgbXlfc3RyfHRpdGxlIH19XG4gKiAvLyA9PiBUaGlzIElzIFNvbWUgVGV4dFxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV9hcnIgPSBbJ2hpJywgJ3RoaXMnLCAnaXMnLCAnYW4nLCAnYXJyYXknXTtcbiAqIHt7IG15X2Fycnx0aXRsZXxqb2luKCcgJykgfX1cbiAqIC8vID0+IEhpIFRoaXMgSXMgQW4gQXJyYXlcbiAqXG4gKiBAcGFyYW0gIHsqfSAgaW5wdXRcbiAqIEByZXR1cm4geyp9ICAgICAgICBSZXR1cm5zIHRoZSBzYW1lIG9iamVjdCBhcyB0aGUgaW5wdXQsIGJ1dCB3aXRoIGFsbCB3b3JkcyBpbiBzdHJpbmdzIHRpdGxlLWNhc2VkLlxuICovXG5leHBvcnRzLnRpdGxlID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHZhciBvdXQgPSBpdGVyYXRlRmlsdGVyLmFwcGx5KGV4cG9ydHMudGl0bGUsIGFyZ3VtZW50cyk7XG4gIGlmIChvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC9cXHdcXFMqL2csIGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBkdXBsaWNhdGUgaXRlbXMgZnJvbSBhbiBhcnJheS5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfYXJyID0gWzEsIDIsIDMsIDQsIDQsIDMsIDIsIDFdO1xuICoge3sgbXlfYXJyfHVuaXF8am9pbignLCcpIH19XG4gKiAvLyA9PiAxLDIsMyw0XG4gKlxuICogQHBhcmFtICB7YXJyYXl9ICBpbnB1dFxuICogQHJldHVybiB7YXJyYXl9ICAgICAgICBBcnJheSB3aXRoIHVuaXF1ZSBpdGVtcy4gSWYgaW5wdXQgd2FzIG5vdCBhbiBhcnJheSwgdGhlIG9yaWdpbmFsIGl0ZW0gaXMgcmV0dXJuZWQgdW50b3VjaGVkLlxuICovXG5leHBvcnRzLnVuaXEgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIHJlc3VsdDtcblxuICBpZiAoIWlucHV0IHx8ICF1dGlscy5pc0FycmF5KGlucHV0KSkge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIHJlc3VsdCA9IFtdO1xuICB1dGlscy5lYWNoKGlucHV0LCBmdW5jdGlvbiAodikge1xuICAgIGlmIChyZXN1bHQuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHYpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgdGhlIGlucHV0IHRvIGFsbCB1cHBlcmNhc2UgbGV0dGVycy4gSWYgYW4gb2JqZWN0IG9yIGFycmF5IGlzIHByb3ZpZGVkLCBhbGwgdmFsdWVzIHdpbGwgYmUgdXBwZXJjYXNlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfc3RyID0gJ3RhY29zJztcbiAqIHt7IG15X3N0cnx1cHBlciB9fVxuICogLy8gPT4gVEFDT1NcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfYXJyID0gWyd0YWNvcycsICdidXJyaXRvcyddO1xuICoge3sgbXlfYXJyfHVwcGVyfGpvaW4oJyAmICcpIH19XG4gKiAvLyA9PiBUQUNPUyAmIEJVUlJJVE9TXG4gKlxuICogQHBhcmFtICB7Kn0gIGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICAgUmV0dXJucyB0aGUgc2FtZSB0eXBlIGFzIHRoZSBpbnB1dCwgd2l0aCBhbGwgc3RyaW5ncyB1cHBlci1jYXNlZC5cbiAqL1xuZXhwb3J0cy51cHBlciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgb3V0ID0gaXRlcmF0ZUZpbHRlci5hcHBseShleHBvcnRzLnVwcGVyLCBhcmd1bWVudHMpO1xuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKTtcbn07XG5cbi8qKlxuICogVVJMLWVuY29kZSBhIHN0cmluZy4gSWYgYW4gb2JqZWN0IG9yIGFycmF5IGlzIHBhc3NlZCwgYWxsIHZhbHVlcyB3aWxsIGJlIFVSTC1lbmNvZGVkLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteV9zdHIgPSAncGFyYW09MSZhbm90aGVyUGFyYW09Mic7XG4gKiB7eyBteV9zdHJ8dXJsX2VuY29kZSB9fVxuICogLy8gPT4gcGFyYW0lM0QxJTI2YW5vdGhlclBhcmFtJTNEMlxuICpcbiAqIEBwYXJhbSAgeyp9IGlucHV0XG4gKiBAcmV0dXJuIHsqfSAgICAgICBVUkwtZW5jb2RlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydHMudXJsX2VuY29kZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICB2YXIgb3V0ID0gaXRlcmF0ZUZpbHRlci5hcHBseShleHBvcnRzLnVybF9lbmNvZGUsIGFyZ3VtZW50cyk7XG4gIGlmIChvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChpbnB1dCk7XG59O1xuXG4vKipcbiAqIFVSTC1kZWNvZGUgYSBzdHJpbmcuIElmIGFuIG9iamVjdCBvciBhcnJheSBpcyBwYXNzZWQsIGFsbCB2YWx1ZXMgd2lsbCBiZSBVUkwtZGVjb2RlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfc3RyID0gJ3BhcmFtJTNEMSUyNmFub3RoZXJQYXJhbSUzRDInO1xuICoge3sgbXlfc3RyfHVybF9kZWNvZGUgfX1cbiAqIC8vID0+IHBhcmFtPTEmYW5vdGhlclBhcmFtPTJcbiAqXG4gKiBAcGFyYW0gIHsqfSBpbnB1dFxuICogQHJldHVybiB7Kn0gICAgICAgVVJMLWRlY29kZWQgc3RyaW5nLlxuICovXG5leHBvcnRzLnVybF9kZWNvZGUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgdmFyIG91dCA9IGl0ZXJhdGVGaWx0ZXIuYXBwbHkoZXhwb3J0cy51cmxfZGVjb2RlLCBhcmd1bWVudHMpO1xuICBpZiAob3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoaW5wdXQpO1xufTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuLyoqXG4gKiBBIGxleGVyIHRva2VuLlxuICogQHR5cGVkZWYge29iamVjdH0gTGV4ZXJUb2tlblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1hdGNoICBUaGUgc3RyaW5nIHRoYXQgd2FzIG1hdGNoZWQuXG4gKiBAcHJvcGVydHkge251bWJlcn0gdHlwZSAgIExleGVyIHR5cGUgZW51bS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsZW5ndGggTGVuZ3RoIG9mIHRoZSBvcmlnaW5hbCBzdHJpbmcgcHJvY2Vzc2VkLlxuICovXG5cbi8qKlxuICogRW51bSBmb3IgdG9rZW4gdHlwZXMuXG4gKiBAcmVhZG9ubHlcbiAqIEBlbnVtIHtudW1iZXJ9XG4gKi9cbnZhciBUWVBFUyA9IHtcbiAgICAvKiogV2hpdGVzcGFjZSAqL1xuICAgIFdISVRFU1BBQ0U6IDAsXG4gICAgLyoqIFBsYWluIHN0cmluZyAqL1xuICAgIFNUUklORzogMSxcbiAgICAvKiogVmFyaWFibGUgZmlsdGVyICovXG4gICAgRklMVEVSOiAyLFxuICAgIC8qKiBFbXB0eSB2YXJpYWJsZSBmaWx0ZXIgKi9cbiAgICBGSUxURVJFTVBUWTogMyxcbiAgICAvKiogRnVuY3Rpb24gKi9cbiAgICBGVU5DVElPTjogNCxcbiAgICAvKiogRnVuY3Rpb24gd2l0aCBubyBhcmd1bWVudHMgKi9cbiAgICBGVU5DVElPTkVNUFRZOiA1LFxuICAgIC8qKiBPcGVuIHBhcmVudGhlc2lzICovXG4gICAgUEFSRU5PUEVOOiA2LFxuICAgIC8qKiBDbG9zZSBwYXJlbnRoZXNpcyAqL1xuICAgIFBBUkVOQ0xPU0U6IDcsXG4gICAgLyoqIENvbW1hICovXG4gICAgQ09NTUE6IDgsXG4gICAgLyoqIFZhcmlhYmxlICovXG4gICAgVkFSOiA5LFxuICAgIC8qKiBOdW1iZXIgKi9cbiAgICBOVU1CRVI6IDEwLFxuICAgIC8qKiBNYXRoIG9wZXJhdG9yICovXG4gICAgT1BFUkFUT1I6IDExLFxuICAgIC8qKiBPcGVuIHNxdWFyZSBicmFja2V0ICovXG4gICAgQlJBQ0tFVE9QRU46IDEyLFxuICAgIC8qKiBDbG9zZSBzcXVhcmUgYnJhY2tldCAqL1xuICAgIEJSQUNLRVRDTE9TRTogMTMsXG4gICAgLyoqIEtleSBvbiBhbiBvYmplY3QgdXNpbmcgZG90LW5vdGF0aW9uICovXG4gICAgRE9US0VZOiAxNCxcbiAgICAvKiogU3RhcnQgb2YgYW4gYXJyYXkgKi9cbiAgICBBUlJBWU9QRU46IDE1LFxuICAgIC8qKiBFbmQgb2YgYW4gYXJyYXlcbiAgICAgKiBDdXJyZW50bHkgdW51c2VkXG4gICAgQVJSQVlDTE9TRTogMTYsICovXG4gICAgLyoqIE9wZW4gY3VybHkgYnJhY2UgKi9cbiAgICBDVVJMWU9QRU46IDE3LFxuICAgIC8qKiBDbG9zZSBjdXJseSBicmFjZSAqL1xuICAgIENVUkxZQ0xPU0U6IDE4LFxuICAgIC8qKiBDb2xvbiAoOikgKi9cbiAgICBDT0xPTjogMTksXG4gICAgLyoqIEphdmFTY3JpcHQtdmFsaWQgY29tcGFyYXRvciAqL1xuICAgIENPTVBBUkFUT1I6IDIwLFxuICAgIC8qKiBCb29sZWFuIGxvZ2ljICovXG4gICAgTE9HSUM6IDIxLFxuICAgIC8qKiBCb29sZWFuIGxvZ2ljIFwibm90XCIgKi9cbiAgICBOT1Q6IDIyLFxuICAgIC8qKiB0cnVlIG9yIGZhbHNlICovXG4gICAgQk9PTDogMjMsXG4gICAgLyoqIFZhcmlhYmxlIGFzc2lnbm1lbnQgKi9cbiAgICBBU1NJR05NRU5UOiAyNCxcbiAgICAvKiogU3RhcnQgb2YgYSBtZXRob2QgKi9cbiAgICBNRVRIT0RPUEVOOiAyNSxcbiAgICAvKiogRW5kIG9mIGEgbWV0aG9kXG4gICAgICogQ3VycmVudGx5IHVudXNlZFxuICAgIE1FVEhPREVORDogMjYsICovXG4gICAgLyoqIFVua25vd24gdHlwZSAqL1xuICAgIFVOS05PV046IDEwMFxuICB9LFxuICBydWxlcyA9IFtcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5XSElURVNQQUNFLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXHMrL1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuU1RSSU5HLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cIlwiLyxcbiAgICAgICAgL15cIi4qP1teXFxcXF1cIi8sXG4gICAgICAgIC9eJycvLFxuICAgICAgICAvXicuKj9bXlxcXFxdJy9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkZJTFRFUixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFx8XFxzKihcXHcrKVxcKC9cbiAgICAgIF0sXG4gICAgICBpZHg6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkZJTFRFUkVNUFRZLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXHxcXHMqKFxcdyspL1xuICAgICAgXSxcbiAgICAgIGlkeDogMVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuRlVOQ1RJT05FTVBUWSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFxzKihcXHcrKVxcKFxcKS9cbiAgICAgIF0sXG4gICAgICBpZHg6IDFcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkZVTkNUSU9OLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXHMqKFxcdyspXFwoL1xuICAgICAgXSxcbiAgICAgIGlkeDogMVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuUEFSRU5PUEVOLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXCgvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5QQVJFTkNMT1NFLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXCkvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5DT01NQSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eLC9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkxPR0lDLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL14oJiZ8XFx8XFx8KVxccyovLFxuICAgICAgICAvXihhbmR8b3IpXFxzKy9cbiAgICAgIF0sXG4gICAgICBpZHg6IDEsXG4gICAgICByZXBsYWNlOiB7XG4gICAgICAgICdhbmQnOiAnJiYnLFxuICAgICAgICAnb3InOiAnfHwnXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5DT01QQVJBVE9SLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL14oPT09fD09fFxcIT09fFxcIT18PD18PHw+PXw+fGluXFxzfGd0ZVxcc3xndFxcc3xsdGVcXHN8bHRcXHMpXFxzKi9cbiAgICAgIF0sXG4gICAgICBpZHg6IDEsXG4gICAgICByZXBsYWNlOiB7XG4gICAgICAgICdndGUnOiAnPj0nLFxuICAgICAgICAnZ3QnOiAnPicsXG4gICAgICAgICdsdGUnOiAnPD0nLFxuICAgICAgICAnbHQnOiAnPCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkFTU0lHTk1FTlQsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXig9fFxcKz18LT18XFwqPXxcXC89KS9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLk5PVCxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFwhXFxzKi8sXG4gICAgICAgIC9ebm90XFxzKy9cbiAgICAgIF0sXG4gICAgICByZXBsYWNlOiB7XG4gICAgICAgICdub3QnOiAnISdcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkJPT0wsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXih0cnVlfGZhbHNlKVxccysvLFxuICAgICAgICAvXih0cnVlfGZhbHNlKSQvXG4gICAgICBdLFxuICAgICAgaWR4OiAxXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5WQVIsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlthLXpBLVpfJF1cXHcqKChcXC5cXCQ/XFx3KikrKT8vLFxuICAgICAgICAvXlthLXpBLVpfJF1cXHcqL1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQlJBQ0tFVE9QRU4sXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlxcWy9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLkJSQUNLRVRDTE9TRSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFxdL1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQ1VSTFlPUEVOLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXHsvXG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5DT0xPTixcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFw6L1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuQ1VSTFlDTE9TRSxcbiAgICAgIHJlZ2V4OiBbXG4gICAgICAgIC9eXFx9L1xuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogVFlQRVMuRE9US0VZLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL15cXC4oXFx3KykvXG4gICAgICBdLFxuICAgICAgaWR4OiAxXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBUWVBFUy5OVU1CRVIsXG4gICAgICByZWdleDogW1xuICAgICAgICAvXlsrXFwtXT9cXGQrKFxcLlxcZCspPy9cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFRZUEVTLk9QRVJBVE9SLFxuICAgICAgcmVnZXg6IFtcbiAgICAgICAgL14oXFwrfFxcLXxcXC98XFwqfCUpL1xuICAgICAgXVxuICAgIH1cbiAgXTtcblxuZXhwb3J0cy50eXBlcyA9IFRZUEVTO1xuXG4vKipcbiAqIFJldHVybiB0aGUgdG9rZW4gdHlwZSBvYmplY3QgZm9yIGEgc2luZ2xlIGNodW5rIG9mIGEgc3RyaW5nLlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHIgU3RyaW5nIGNodW5rLlxuICogQHJldHVybiB7TGV4ZXJUb2tlbn0gICAgIERlZmluZWQgdHlwZSwgcG90ZW50aWFsbHkgc3RyaXBwZWQgb3IgcmVwbGFjZWQgd2l0aCBtb3JlIHN1aXRhYmxlIGNvbnRlbnQuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiByZWFkZXIoc3RyKSB7XG4gIHZhciBtYXRjaGVkO1xuXG4gIHV0aWxzLnNvbWUocnVsZXMsIGZ1bmN0aW9uIChydWxlKSB7XG4gICAgcmV0dXJuIHV0aWxzLnNvbWUocnVsZS5yZWdleCwgZnVuY3Rpb24gKHJlZ2V4KSB7XG4gICAgICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpLFxuICAgICAgICBub3JtYWxpemVkO1xuXG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbm9ybWFsaXplZCA9IG1hdGNoW3J1bGUuaWR4IHx8IDBdLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgICAgbm9ybWFsaXplZCA9IChydWxlLmhhc093blByb3BlcnR5KCdyZXBsYWNlJykgJiYgcnVsZS5yZXBsYWNlLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZWQpKSA/IHJ1bGUucmVwbGFjZVtub3JtYWxpemVkXSA6IG5vcm1hbGl6ZWQ7XG5cbiAgICAgIG1hdGNoZWQgPSB7XG4gICAgICAgIG1hdGNoOiBub3JtYWxpemVkLFxuICAgICAgICB0eXBlOiBydWxlLnR5cGUsXG4gICAgICAgIGxlbmd0aDogbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGlmICghbWF0Y2hlZCkge1xuICAgIG1hdGNoZWQgPSB7XG4gICAgICBtYXRjaDogc3RyLFxuICAgICAgdHlwZTogVFlQRVMuVU5LTk9XTixcbiAgICAgIGxlbmd0aDogc3RyLmxlbmd0aFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gbWF0Y2hlZDtcbn1cblxuLyoqXG4gKiBSZWFkIGEgc3RyaW5nIGFuZCBicmVhayBpdCBpbnRvIHNlcGFyYXRlIHRva2VuIHR5cGVzLlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0FycmF5LkxleGVyVG9rZW59ICAgICBBcnJheSBvZiBkZWZpbmVkIHR5cGVzLCBwb3RlbnRpYWxseSBzdHJpcHBlZCBvciByZXBsYWNlZCB3aXRoIG1vcmUgc3VpdGFibGUgY29udGVudC5cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgdmFyIG9mZnNldCA9IDAsXG4gICAgdG9rZW5zID0gW10sXG4gICAgc3Vic3RyLFxuICAgIG1hdGNoO1xuICB3aGlsZSAob2Zmc2V0IDwgc3RyLmxlbmd0aCkge1xuICAgIHN1YnN0ciA9IHN0ci5zdWJzdHJpbmcob2Zmc2V0KTtcbiAgICBtYXRjaCA9IHJlYWRlcihzdWJzdHIpO1xuICAgIG9mZnNldCArPSBtYXRjaC5sZW5ndGg7XG4gICAgdG9rZW5zLnB1c2gobWF0Y2gpO1xuICB9XG4gIHJldHVybiB0b2tlbnM7XG59O1xuIiwidmFyIGZzID0gcmVxdWlyZSgnZnMnKSxcbiAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuLyoqXG4gKiBMb2FkcyB0ZW1wbGF0ZXMgZnJvbSB0aGUgZmlsZSBzeXN0ZW0uXG4gKiBAYWxpYXMgc3dpZy5sb2FkZXJzLmZzXG4gKiBAZXhhbXBsZVxuICogc3dpZy5zZXREZWZhdWx0cyh7IGxvYWRlcjogc3dpZy5sb2FkZXJzLmZzKCkgfSk7XG4gKiBAZXhhbXBsZVxuICogLy8gTG9hZCBUZW1wbGF0ZXMgZnJvbSBhIHNwZWNpZmljIGRpcmVjdG9yeSAoZG9lcyBub3QgcmVxdWlyZSB1c2luZyByZWxhdGl2ZSBwYXRocyBpbiB5b3VyIHRlbXBsYXRlcylcbiAqIHN3aWcuc2V0RGVmYXVsdHMoeyBsb2FkZXI6IHN3aWcubG9hZGVycy5mcyhfX2Rpcm5hbWUgKyAnL3RlbXBsYXRlcycgKX0pO1xuICogQHBhcmFtIHtzdHJpbmd9ICAgW2Jhc2VwYXRoPScnXSAgICAgUGF0aCB0byB0aGUgdGVtcGxhdGVzIGFzIHN0cmluZy4gQXNzaWduaW5nIHRoaXMgdmFsdWUgYWxsb3dzIHlvdSB0byB1c2Ugc2VtaS1hYnNvbHV0ZSBwYXRocyB0byB0ZW1wbGF0ZXMgaW5zdGVhZCBvZiByZWxhdGl2ZSBwYXRocy5cbiAqIEBwYXJhbSB7c3RyaW5nfSAgIFtlbmNvZGluZz0ndXRmOCddICAgVGVtcGxhdGUgZW5jb2RpbmdcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZXBhdGgsIGVuY29kaW5nKSB7XG4gIHZhciByZXQgPSB7fTtcblxuICBlbmNvZGluZyA9IGVuY29kaW5nIHx8ICd1dGY4JztcbiAgYmFzZXBhdGggPSAoYmFzZXBhdGgpID8gcGF0aC5ub3JtYWxpemUoYmFzZXBhdGgpIDogbnVsbDtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgPHZhcj50bzwvdmFyPiB0byBhbiBhYnNvbHV0ZSBwYXRoIG9yIHVuaXF1ZSBpZGVudGlmaWVyLiBUaGlzIGlzIHVzZWQgZm9yIGJ1aWxkaW5nIGNvcnJlY3QsIG5vcm1hbGl6ZWQsIGFuZCBhYnNvbHV0ZSBwYXRocyB0byBhIGdpdmVuIHRlbXBsYXRlLlxuICAgKiBAYWxpYXMgcmVzb2x2ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHRvICAgICAgICBOb24tYWJzb2x1dGUgaWRlbnRpZmllciBvciBwYXRobmFtZSB0byBhIGZpbGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gW2Zyb21dICAgIElmIGdpdmVuLCBzaG91bGQgYXR0ZW1wdCB0byBmaW5kIHRoZSA8dmFyPnRvPC92YXI+IHBhdGggaW4gcmVsYXRpb24gdG8gdGhpcyBnaXZlbiwga25vd24gcGF0aC5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmV0LnJlc29sdmUgPSBmdW5jdGlvbiAodG8sIGZyb20pIHtcbiAgICBpZiAoYmFzZXBhdGgpIHtcbiAgICAgIGZyb20gPSBiYXNlcGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJvbSA9IChmcm9tKSA/IHBhdGguZGlybmFtZShmcm9tKSA6IHByb2Nlc3MuY3dkKCk7XG4gICAgfVxuICAgIHJldHVybiBwYXRoLnJlc29sdmUoZnJvbSwgdG8pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpbmdsZSB0ZW1wbGF0ZS4gR2l2ZW4gYSB1bmlxdWUgPHZhcj5pZGVudGlmaWVyPC92YXI+IGZvdW5kIGJ5IHRoZSA8dmFyPnJlc29sdmU8L3Zhcj4gbWV0aG9kIHRoaXMgc2hvdWxkIHJldHVybiB0aGUgZ2l2ZW4gdGVtcGxhdGUuXG4gICAqIEBhbGlhcyBsb2FkXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICBpZGVudGlmaWVyICBVbmlxdWUgaWRlbnRpZmllciBvZiBhIHRlbXBsYXRlIChwb3NzaWJseSBhbiBhYnNvbHV0ZSBwYXRoKS5cbiAgICogQHBhcmFtICB7ZnVuY3Rpb259IFtjYl0gICAgICAgIEFzeW5jaHJvbm91cyBjYWxsYmFjayBmdW5jdGlvbi4gSWYgbm90IHByb3ZpZGVkLCB0aGlzIG1ldGhvZCBzaG91bGQgcnVuIHN5bmNocm9ub3VzbHkuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICBUZW1wbGF0ZSBzb3VyY2Ugc3RyaW5nLlxuICAgKi9cbiAgcmV0LmxvYWQgPSBmdW5jdGlvbiAoaWRlbnRpZmllciwgY2IpIHtcbiAgICBpZiAoIWZzIHx8IChjYiAmJiAhZnMucmVhZEZpbGUpIHx8ICFmcy5yZWFkRmlsZVN5bmMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGZpbmQgZmlsZSAnICsgaWRlbnRpZmllciArICcgYmVjYXVzZSB0aGVyZSBpcyBubyBmaWxlc3lzdGVtIHRvIHJlYWQgZnJvbS4nKTtcbiAgICB9XG5cbiAgICBpZGVudGlmaWVyID0gcmV0LnJlc29sdmUoaWRlbnRpZmllcik7XG5cbiAgICBpZiAoY2IpIHtcbiAgICAgIGZzLnJlYWRGaWxlKGlkZW50aWZpZXIsIGVuY29kaW5nLCBjYik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoaWRlbnRpZmllciwgZW5jb2RpbmcpO1xuICB9O1xuXG4gIHJldHVybiByZXQ7XG59O1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIFRlbXBsYXRlTG9hZGVyXG4gKiBAZGVzY3JpcHRpb24gU3dpZyBpcyBhYmxlIHRvIGFjY2VwdCBjdXN0b20gdGVtcGxhdGUgbG9hZGVycyB3cml0dGVuIGJ5IHlvdSwgc28gdGhhdCB5b3VyIHRlbXBsYXRlcyBjYW4gY29tZSBmcm9tIHlvdXIgZmF2b3JpdGUgc3RvcmFnZSBtZWRpdW0gd2l0aG91dCBuZWVkaW5nIHRvIGJlIHBhcnQgb2YgdGhlIGNvcmUgbGlicmFyeS5cbiAqIEEgdGVtcGxhdGUgbG9hZGVyIGNvbnNpc3RzIG9mIHR3byBtZXRob2RzOiA8dmFyPnJlc29sdmU8L3Zhcj4gYW5kIDx2YXI+bG9hZDwvdmFyPi4gRWFjaCBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IFN3aWcgdG8gZmluZCBhbmQgbG9hZCB0aGUgc291cmNlIG9mIHRoZSB0ZW1wbGF0ZSBiZWZvcmUgYXR0ZW1wdGluZyB0byBwYXJzZSBhbmQgY29tcGlsZSBpdC5cbiAqIEBleGFtcGxlXG4gKiAvLyBBIHRoZW9yZXRpY2FsIG1lbWNhY2hlZCBsb2FkZXJcbiAqIHZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxuICogICBNZW1jYWNoZWQgPSByZXF1aXJlKCdtZW1jYWNoZWQnKTtcbiAqIGZ1bmN0aW9uIG1lbWNhY2hlZExvYWRlcihsb2NhdGlvbnMsIG9wdGlvbnMpIHtcbiAqICAgdmFyIG1lbWNhY2hlZCA9IG5ldyBNZW1jYWNoZWQobG9jYXRpb25zLCBvcHRpb25zKTtcbiAqICAgcmV0dXJuIHtcbiAqICAgICByZXNvbHZlOiBmdW5jdGlvbiAodG8sIGZyb20pIHtcbiAqICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUoZnJvbSwgdG8pO1xuICogICAgIH0sXG4gKiAgICAgbG9hZDogZnVuY3Rpb24gKGlkZW50aWZpZXIsIGNiKSB7XG4gKiAgICAgICBtZW1jYWNoZWQuZ2V0KGlkZW50aWZpZXIsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAqICAgICAgICAgLy8gaWYgKCFkYXRhKSB7IGxvYWQgZnJvbSBmaWxlc3lzdGVtOyB9XG4gKiAgICAgICAgIGNiKGVyciwgZGF0YSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9XG4gKiAgIH07XG4gKiB9O1xuICogLy8gVGVsbCBzd2lnIGFib3V0IHRoZSBsb2FkZXI6XG4gKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBtZW1jYWNoZWRMb2FkZXIoWycxOTIuMTY4LjAuMiddKSB9KTtcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgcmVzb2x2ZVxuICogQG1lbWJlcm9mIFRlbXBsYXRlTG9hZGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqIFJlc29sdmVzIDx2YXI+dG88L3Zhcj4gdG8gYW4gYWJzb2x1dGUgcGF0aCBvciB1bmlxdWUgaWRlbnRpZmllci4gVGhpcyBpcyB1c2VkIGZvciBidWlsZGluZyBjb3JyZWN0LCBub3JtYWxpemVkLCBhbmQgYWJzb2x1dGUgcGF0aHMgdG8gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gdG8gICAgICAgIE5vbi1hYnNvbHV0ZSBpZGVudGlmaWVyIG9yIHBhdGhuYW1lIHRvIGEgZmlsZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gW2Zyb21dICAgIElmIGdpdmVuLCBzaG91bGQgYXR0ZW1wdCB0byBmaW5kIHRoZSA8dmFyPnRvPC92YXI+IHBhdGggaW4gcmVsYXRpb24gdG8gdGhpcyBnaXZlbiwga25vd24gcGF0aC5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgbG9hZFxuICogQG1lbWJlcm9mIFRlbXBsYXRlTG9hZGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqIExvYWRzIGEgc2luZ2xlIHRlbXBsYXRlLiBHaXZlbiBhIHVuaXF1ZSA8dmFyPmlkZW50aWZpZXI8L3Zhcj4gZm91bmQgYnkgdGhlIDx2YXI+cmVzb2x2ZTwvdmFyPiBtZXRob2QgdGhpcyBzaG91bGQgcmV0dXJuIHRoZSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gICBpZGVudGlmaWVyICBVbmlxdWUgaWRlbnRpZmllciBvZiBhIHRlbXBsYXRlIChwb3NzaWJseSBhbiBhYnNvbHV0ZSBwYXRoKS5cbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBbY2JdICAgICAgICBBc3luY2hyb25vdXMgY2FsbGJhY2sgZnVuY3Rpb24uIElmIG5vdCBwcm92aWRlZCwgdGhpcyBtZXRob2Qgc2hvdWxkIHJ1biBzeW5jaHJvbm91c2x5LlxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgIFRlbXBsYXRlIHNvdXJjZSBzdHJpbmcuXG4gKi9cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmZzID0gcmVxdWlyZSgnLi9maWxlc3lzdGVtJyk7XG5leHBvcnRzLm1lbW9yeSA9IHJlcXVpcmUoJy4vbWVtb3J5Jyk7XG4iLCJ2YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcbiAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIExvYWRzIHRlbXBsYXRlcyBmcm9tIGEgcHJvdmlkZWQgb2JqZWN0IG1hcHBpbmcuXG4gKiBAYWxpYXMgc3dpZy5sb2FkZXJzLm1lbW9yeVxuICogQGV4YW1wbGVcbiAqIHZhciB0ZW1wbGF0ZXMgPSB7XG4gKiAgIFwibGF5b3V0XCI6IFwieyUgYmxvY2sgY29udGVudCAlfXslIGVuZGJsb2NrICV9XCIsXG4gKiAgIFwiaG9tZS5odG1sXCI6IFwieyUgZXh0ZW5kcyAnbGF5b3V0Lmh0bWwnICV9eyUgYmxvY2sgY29udGVudCAlfS4uLnslIGVuZGJsb2NrICV9XCJcbiAqIH07XG4gKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBzd2lnLmxvYWRlcnMubWVtb3J5KHRlbXBsYXRlcykgfSk7XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG1hcHBpbmcgSGFzaCBvYmplY3Qgd2l0aCB0ZW1wbGF0ZSBwYXRocyBhcyBrZXlzIGFuZCB0ZW1wbGF0ZSBzb3VyY2VzIGFzIHZhbHVlcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbYmFzZXBhdGhdIFBhdGggdG8gdGhlIHRlbXBsYXRlcyBhcyBzdHJpbmcuIEFzc2lnbmluZyB0aGlzIHZhbHVlIGFsbG93cyB5b3UgdG8gdXNlIHNlbWktYWJzb2x1dGUgcGF0aHMgdG8gdGVtcGxhdGVzIGluc3RlYWQgb2YgcmVsYXRpdmUgcGF0aHMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1hcHBpbmcsIGJhc2VwYXRoKSB7XG4gIHZhciByZXQgPSB7fTtcblxuICBiYXNlcGF0aCA9IChiYXNlcGF0aCkgPyBwYXRoLm5vcm1hbGl6ZShiYXNlcGF0aCkgOiBudWxsO1xuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyA8dmFyPnRvPC92YXI+IHRvIGFuIGFic29sdXRlIHBhdGggb3IgdW5pcXVlIGlkZW50aWZpZXIuIFRoaXMgaXMgdXNlZCBmb3IgYnVpbGRpbmcgY29ycmVjdCwgbm9ybWFsaXplZCwgYW5kIGFic29sdXRlIHBhdGhzIHRvIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gICAqIEBhbGlhcyByZXNvbHZlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdG8gICAgICAgIE5vbi1hYnNvbHV0ZSBpZGVudGlmaWVyIG9yIHBhdGhuYW1lIHRvIGEgZmlsZS5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBbZnJvbV0gICAgSWYgZ2l2ZW4sIHNob3VsZCBhdHRlbXB0IHRvIGZpbmQgdGhlIDx2YXI+dG88L3Zhcj4gcGF0aCBpbiByZWxhdGlvbiB0byB0aGlzIGdpdmVuLCBrbm93biBwYXRoLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICByZXQucmVzb2x2ZSA9IGZ1bmN0aW9uICh0bywgZnJvbSkge1xuICAgIGlmIChiYXNlcGF0aCkge1xuICAgICAgZnJvbSA9IGJhc2VwYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcm9tID0gKGZyb20pID8gcGF0aC5kaXJuYW1lKGZyb20pIDogJy8nO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5yZXNvbHZlKGZyb20sIHRvKTtcbiAgfTtcblxuICAvKipcbiAgICogTG9hZHMgYSBzaW5nbGUgdGVtcGxhdGUuIEdpdmVuIGEgdW5pcXVlIDx2YXI+aWRlbnRpZmllcjwvdmFyPiBmb3VuZCBieSB0aGUgPHZhcj5yZXNvbHZlPC92YXI+IG1ldGhvZCB0aGlzIHNob3VsZCByZXR1cm4gdGhlIGdpdmVuIHRlbXBsYXRlLlxuICAgKiBAYWxpYXMgbG9hZFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgaWRlbnRpZmllciAgVW5pcXVlIGlkZW50aWZpZXIgb2YgYSB0ZW1wbGF0ZSAocG9zc2libHkgYW4gYWJzb2x1dGUgcGF0aCkuXG4gICAqIEBwYXJhbSAge2Z1bmN0aW9ufSBbY2JdICAgICAgICBBc3luY2hyb25vdXMgY2FsbGJhY2sgZnVuY3Rpb24uIElmIG5vdCBwcm92aWRlZCwgdGhpcyBtZXRob2Qgc2hvdWxkIHJ1biBzeW5jaHJvbm91c2x5LlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgVGVtcGxhdGUgc291cmNlIHN0cmluZy5cbiAgICovXG4gIHJldC5sb2FkID0gZnVuY3Rpb24gKHBhdGhuYW1lLCBjYikge1xuICAgIHZhciBzcmMsIHBhdGhzO1xuXG4gICAgcGF0aHMgPSBbcGF0aG5hbWUsIHBhdGhuYW1lLnJlcGxhY2UoL14oXFwvfFxcXFwpLywgJycpXTtcblxuICAgIHNyYyA9IG1hcHBpbmdbcGF0aHNbMF1dIHx8IG1hcHBpbmdbcGF0aHNbMV1dO1xuICAgIGlmICghc3JjKSB7XG4gICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmFibGUgdG8gZmluZCB0ZW1wbGF0ZSBcIicgKyBwYXRobmFtZSArICdcIi4nKTtcbiAgICB9XG5cbiAgICBpZiAoY2IpIHtcbiAgICAgIGNiKG51bGwsIHNyYyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBzcmM7XG4gIH07XG5cbiAgcmV0dXJuIHJldDtcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gIGxleGVyID0gcmVxdWlyZSgnLi9sZXhlcicpO1xuXG52YXIgX3QgPSBsZXhlci50eXBlcyxcbiAgX3Jlc2VydmVkID0gWydicmVhaycsICdjYXNlJywgJ2NhdGNoJywgJ2NvbnRpbnVlJywgJ2RlYnVnZ2VyJywgJ2RlZmF1bHQnLCAnZGVsZXRlJywgJ2RvJywgJ2Vsc2UnLCAnZmluYWxseScsICdmb3InLCAnZnVuY3Rpb24nLCAnaWYnLCAnaW4nLCAnaW5zdGFuY2VvZicsICduZXcnLCAncmV0dXJuJywgJ3N3aXRjaCcsICd0aGlzJywgJ3Rocm93JywgJ3RyeScsICd0eXBlb2YnLCAndmFyJywgJ3ZvaWQnLCAnd2hpbGUnLCAnd2l0aCddO1xuXG5cbi8qKlxuICogRmlsdGVycyBhcmUgc2ltcGx5IGZ1bmN0aW9ucyB0aGF0IHBlcmZvcm0gdHJhbnNmb3JtYXRpb25zIG9uIHRoZWlyIGZpcnN0IGlucHV0IGFyZ3VtZW50LlxuICogRmlsdGVycyBhcmUgcnVuIGF0IHJlbmRlciB0aW1lLCBzbyB0aGV5IG1heSBub3QgZGlyZWN0bHkgbW9kaWZ5IHRoZSBjb21waWxlZCB0ZW1wbGF0ZSBzdHJ1Y3R1cmUgaW4gYW55IHdheS5cbiAqIEFsbCBvZiBTd2lnJ3MgYnVpbHQtaW4gZmlsdGVycyBhcmUgd3JpdHRlbiBpbiB0aGlzIHNhbWUgd2F5LiBGb3IgbW9yZSBleGFtcGxlcywgcmVmZXJlbmNlIHRoZSBgZmlsdGVycy5qc2AgZmlsZSBpbiBTd2lnJ3Mgc291cmNlLlxuICpcbiAqIFRvIGRpc2FibGUgYXV0by1lc2NhcGluZyBvbiBhIGN1c3RvbSBmaWx0ZXIsIHNpbXBseSBhZGQgYSBwcm9wZXJ0eSB0byB0aGUgZmlsdGVyIG1ldGhvZCBgc2FmZSA9IHRydWU7YCBhbmQgdGhlIG91dHB1dCBmcm9tIHRoaXMgd2lsbCBub3QgYmUgZXNjYXBlZCwgbm8gbWF0dGVyIHdoYXQgdGhlIGdsb2JhbCBzZXR0aW5ncyBhcmUgZm9yIFN3aWcuXG4gKlxuICogQHR5cGVkZWYge2Z1bmN0aW9ufSBGaWx0ZXJcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gVGhpcyBmaWx0ZXIgd2lsbCByZXR1cm4gJ2JhemJvcCcgaWYgdGhlIGlkeCBvbiB0aGUgaW5wdXQgaXMgbm90ICdmb29iYXInXG4gKiBzd2lnLnNldEZpbHRlcignZm9vYmFyJywgZnVuY3Rpb24gKGlucHV0LCBpZHgpIHtcbiAqICAgcmV0dXJuIGlucHV0W2lkeF0gPT09ICdmb29iYXInID8gaW5wdXRbaWR4XSA6ICdiYXpib3AnO1xuICogfSk7XG4gKiAvLyBteXZhciA9IFsnZm9vJywgJ2JhcicsICdiYXonLCAnYm9wJ107XG4gKiAvLyA9PiB7eyBteXZhcnxmb29iYXIoMykgfX1cbiAqIC8vIFNpbmNlIG15dmFyWzNdICE9PSAnZm9vYmFyJywgd2UgcmVuZGVyOlxuICogLy8gPT4gYmF6Ym9wXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIFRoaXMgZmlsdGVyIHdpbGwgZGlzYWJsZSBhdXRvLWVzY2FwaW5nIG9uIGl0cyBvdXRwdXQ6XG4gKiBmdW5jdGlvbiBiYXpib3AgKGlucHV0KSB7IHJldHVybiBpbnB1dDsgfVxuICogYmF6Ym9wLnNhZmUgPSB0cnVlO1xuICogc3dpZy5zZXRGaWx0ZXIoJ2JhemJvcCcsIGJhemJvcCk7XG4gKiAvLyA9PiB7eyBcIjxwPlwifGJhemJvcCB9fVxuICogLy8gPT4gPHA+XG4gKlxuICogQHBhcmFtIHsqfSBpbnB1dCBJbnB1dCBhcmd1bWVudCwgYXV0b21hdGljYWxseSBzZW50IGZyb20gU3dpZydzIGJ1aWx0LWluIHBhcnNlci5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ3NdIEFsbCBvdGhlciBhcmd1bWVudHMgYXJlIGRlZmluZWQgYnkgdGhlIEZpbHRlciBhdXRob3IuXG4gKiBAcmV0dXJuIHsqfVxuICovXG5cbi8qIVxuICogTWFrZXMgYSBzdHJpbmcgc2FmZSBmb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXC9cXFxcXFxeJCorPy4oKXxcXFtcXF17fV0vZywgJ1xcXFwkJicpO1xufVxuXG4vKipcbiAqIFBhcnNlIHN0cmluZ3Mgb2YgdmFyaWFibGVzIGFuZCB0YWdzIGludG8gdG9rZW5zIGZvciBmdXR1cmUgY29tcGlsYXRpb24uXG4gKiBAY2xhc3NcbiAqIEBwYXJhbSB7YXJyYXl9ICAgdG9rZW5zICAgICBQcmUtc3BsaXQgdG9rZW5zIHJlYWQgYnkgdGhlIExleGVyLlxuICogQHBhcmFtIHtvYmplY3R9ICBmaWx0ZXJzICAgIEtleWVkIG9iamVjdCBvZiBmaWx0ZXJzIHRoYXQgbWF5IGJlIGFwcGxpZWQgdG8gdmFyaWFibGVzLlxuICogQHBhcmFtIHtib29sZWFufSBhdXRvZXNjYXBlIFdoZXRoZXIgb3Igbm90IHRoaXMgc2hvdWxkIGJlIGF1dG9lc2NhcGVkLlxuICogQHBhcmFtIHtudW1iZXJ9ICBsaW5lICAgICAgIEJlZ2lubmluZyBsaW5lIG51bWJlciBmb3IgdGhlIGZpcnN0IHRva2VuLlxuICogQHBhcmFtIHtzdHJpbmd9ICBbZmlsZW5hbWVdIE5hbWUgb2YgdGhlIGZpbGUgYmVpbmcgcGFyc2VkLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gVG9rZW5QYXJzZXIodG9rZW5zLCBmaWx0ZXJzLCBhdXRvZXNjYXBlLCBsaW5lLCBmaWxlbmFtZSkge1xuICB0aGlzLm91dCA9IFtdO1xuICB0aGlzLnN0YXRlID0gW107XG4gIHRoaXMuZmlsdGVyQXBwbHlJZHggPSBbXTtcbiAgdGhpcy5fcGFyc2VycyA9IHt9O1xuICB0aGlzLmxpbmUgPSBsaW5lO1xuICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gIHRoaXMuZmlsdGVycyA9IGZpbHRlcnM7XG4gIHRoaXMuZXNjYXBlID0gYXV0b2VzY2FwZTtcblxuICB0aGlzLnBhcnNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmIChzZWxmLl9wYXJzZXJzLnN0YXJ0KSB7XG4gICAgICBzZWxmLl9wYXJzZXJzLnN0YXJ0LmNhbGwoc2VsZik7XG4gICAgfVxuICAgIHV0aWxzLmVhY2godG9rZW5zLCBmdW5jdGlvbiAodG9rZW4sIGkpIHtcbiAgICAgIHZhciBwcmV2VG9rZW4gPSB0b2tlbnNbaSAtIDFdO1xuICAgICAgc2VsZi5pc0xhc3QgPSAoaSA9PT0gdG9rZW5zLmxlbmd0aCAtIDEpO1xuICAgICAgaWYgKHByZXZUb2tlbikge1xuICAgICAgICB3aGlsZSAocHJldlRva2VuLnR5cGUgPT09IF90LldISVRFU1BBQ0UpIHtcbiAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgcHJldlRva2VuID0gdG9rZW5zW2kgLSAxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2VsZi5wcmV2VG9rZW4gPSBwcmV2VG9rZW47XG4gICAgICBzZWxmLnBhcnNlVG9rZW4odG9rZW4pO1xuICAgIH0pO1xuICAgIGlmIChzZWxmLl9wYXJzZXJzLmVuZCkge1xuICAgICAgc2VsZi5fcGFyc2Vycy5lbmQuY2FsbChzZWxmKTtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5lc2NhcGUpIHtcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHggPSBbMF07XG4gICAgICBpZiAodHlwZW9mIHNlbGYuZXNjYXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICBzZWxmLnBhcnNlVG9rZW4oeyB0eXBlOiBfdC5GSUxURVIsIG1hdGNoOiAnZScgfSk7XG4gICAgICAgIHNlbGYucGFyc2VUb2tlbih7IHR5cGU6IF90LkNPTU1BLCBtYXRjaDogJywnIH0pO1xuICAgICAgICBzZWxmLnBhcnNlVG9rZW4oeyB0eXBlOiBfdC5TVFJJTkcsIG1hdGNoOiBTdHJpbmcoYXV0b2VzY2FwZSkgfSk7XG4gICAgICAgIHNlbGYucGFyc2VUb2tlbih7IHR5cGU6IF90LlBBUkVOQ0xPU0UsIG1hdGNoOiAnKSd9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYucGFyc2VUb2tlbih7IHR5cGU6IF90LkZJTFRFUkVNUFRZLCBtYXRjaDogJ2UnIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmLm91dDtcbiAgfTtcbn1cblxuVG9rZW5QYXJzZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogU2V0IGEgY3VzdG9tIG1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiBhIHRva2VuIHR5cGUgaXMgZm91bmQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHBhcnNlci5vbih0eXBlcy5TVFJJTkcsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgKiAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgKiB9KTtcbiAgICogQGV4YW1wbGVcbiAgICogcGFyc2VyLm9uKCdzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICogICB0aGlzLm91dC5wdXNoKCdzb21ldGhpbmcgYXQgdGhlIGJlZ2lubmluZyBvZiB5b3VyIGFyZ3MnKVxuICAgKiB9KTtcbiAgICogcGFyc2VyLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAqICAgdGhpcy5vdXQucHVzaCgnc29tZXRoaW5nIGF0IHRoZSBlbmQgb2YgeW91ciBhcmdzJyk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgdHlwZSBUb2tlbiB0eXBlIElELiBGb3VuZCBpbiB0aGUgTGV4ZXIuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgIENhbGxiYWNrIGZ1bmN0aW9uLiBSZXR1cm4gdHJ1ZSB0byBjb250aW51ZSBleGVjdXRpbmcgdGhlIGRlZmF1bHQgcGFyc2luZyBmdW5jdGlvbi5cbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgb246IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIHRoaXMuX3BhcnNlcnNbdHlwZV0gPSBmbjtcbiAgfSxcblxuICAvKipcbiAgICogUGFyc2UgYSBzaW5nbGUgdG9rZW4uXG4gICAqIEBwYXJhbSAge3ttYXRjaDogc3RyaW5nLCB0eXBlOiBudW1iZXIsIGxpbmU6IG51bWJlcn19IHRva2VuIExleGVyIHRva2VuIG9iamVjdC5cbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcGFyc2VUb2tlbjogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgZm4gPSBzZWxmLl9wYXJzZXJzW3Rva2VuLnR5cGVdIHx8IHNlbGYuX3BhcnNlcnNbJyonXSxcbiAgICAgIG1hdGNoID0gdG9rZW4ubWF0Y2gsXG4gICAgICBwcmV2VG9rZW4gPSBzZWxmLnByZXZUb2tlbixcbiAgICAgIHByZXZUb2tlblR5cGUgPSBwcmV2VG9rZW4gPyBwcmV2VG9rZW4udHlwZSA6IG51bGwsXG4gICAgICBsYXN0U3RhdGUgPSAoc2VsZi5zdGF0ZS5sZW5ndGgpID8gc2VsZi5zdGF0ZVtzZWxmLnN0YXRlLmxlbmd0aCAtIDFdIDogbnVsbCxcbiAgICAgIHRlbXA7XG5cbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoIWZuLmNhbGwodGhpcywgdG9rZW4pKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGFzdFN0YXRlICYmIHByZXZUb2tlbiAmJlxuICAgICAgICBsYXN0U3RhdGUgPT09IF90LkZJTFRFUiAmJlxuICAgICAgICBwcmV2VG9rZW5UeXBlID09PSBfdC5GSUxURVIgJiZcbiAgICAgICAgdG9rZW4udHlwZSAhPT0gX3QuUEFSRU5DTE9TRSAmJlxuICAgICAgICB0b2tlbi50eXBlICE9PSBfdC5DT01NQSAmJlxuICAgICAgICB0b2tlbi50eXBlICE9PSBfdC5PUEVSQVRPUiAmJlxuICAgICAgICB0b2tlbi50eXBlICE9PSBfdC5GSUxURVIgJiZcbiAgICAgICAgdG9rZW4udHlwZSAhPT0gX3QuRklMVEVSRU1QVFkpIHtcbiAgICAgIHNlbGYub3V0LnB1c2goJywgJyk7XG4gICAgfVxuXG4gICAgaWYgKGxhc3RTdGF0ZSAmJiBsYXN0U3RhdGUgPT09IF90Lk1FVEhPRE9QRU4pIHtcbiAgICAgIHNlbGYuc3RhdGUucG9wKCk7XG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gX3QuUEFSRU5DTE9TRSkge1xuICAgICAgICBzZWxmLm91dC5wdXNoKCcsICcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgIGNhc2UgX3QuV0hJVEVTUEFDRTpcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5TVFJJTkc6XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoKTtcbiAgICAgIHNlbGYub3V0LnB1c2gobWF0Y2gucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuTlVNQkVSOlxuICAgIGNhc2UgX3QuQk9PTDpcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucHVzaChzZWxmLm91dC5sZW5ndGgpO1xuICAgICAgc2VsZi5vdXQucHVzaChtYXRjaCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuRklMVEVSOlxuICAgICAgaWYgKCFzZWxmLmZpbHRlcnMuaGFzT3duUHJvcGVydHkobWF0Y2gpIHx8IHR5cGVvZiBzZWxmLmZpbHRlcnNbbWF0Y2hdICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdXRpbHMudGhyb3dFcnJvcignSW52YWxpZCBmaWx0ZXIgXCInICsgbWF0Y2ggKyAnXCInLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5lc2NhcGUgPSBzZWxmLmZpbHRlcnNbbWF0Y2hdLnNhZmUgPyBmYWxzZSA6IHNlbGYuZXNjYXBlO1xuICAgICAgc2VsZi5vdXQuc3BsaWNlKHNlbGYuZmlsdGVyQXBwbHlJZHhbc2VsZi5maWx0ZXJBcHBseUlkeC5sZW5ndGggLSAxXSwgMCwgJ19maWx0ZXJzW1wiJyArIG1hdGNoICsgJ1wiXSgnKTtcbiAgICAgIHNlbGYuc3RhdGUucHVzaCh0b2tlbi50eXBlKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5GSUxURVJFTVBUWTpcbiAgICAgIGlmICghc2VsZi5maWx0ZXJzLmhhc093blByb3BlcnR5KG1hdGNoKSB8fCB0eXBlb2Ygc2VsZi5maWx0ZXJzW21hdGNoXSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ0ludmFsaWQgZmlsdGVyIFwiJyArIG1hdGNoICsgJ1wiJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuZXNjYXBlID0gc2VsZi5maWx0ZXJzW21hdGNoXS5zYWZlID8gZmFsc2UgOiBzZWxmLmVzY2FwZTtcbiAgICAgIHNlbGYub3V0LnNwbGljZShzZWxmLmZpbHRlckFwcGx5SWR4W3NlbGYuZmlsdGVyQXBwbHlJZHgubGVuZ3RoIC0gMV0sIDAsICdfZmlsdGVyc1tcIicgKyBtYXRjaCArICdcIl0oJyk7XG4gICAgICBzZWxmLm91dC5wdXNoKCcpJyk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuRlVOQ1RJT046XG4gICAgY2FzZSBfdC5GVU5DVElPTkVNUFRZOlxuICAgICAgc2VsZi5vdXQucHVzaCgnKCh0eXBlb2YgX2N0eC4nICsgbWF0Y2ggKyAnICE9PSBcInVuZGVmaW5lZFwiKSA/IF9jdHguJyArIG1hdGNoICtcbiAgICAgICAgJyA6ICgodHlwZW9mICcgKyBtYXRjaCArICcgIT09IFwidW5kZWZpbmVkXCIpID8gJyArIG1hdGNoICtcbiAgICAgICAgJyA6IF9mbikpKCcpO1xuICAgICAgc2VsZi5lc2NhcGUgPSBmYWxzZTtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBfdC5GVU5DVElPTkVNUFRZKSB7XG4gICAgICAgIHNlbGYub3V0W3NlbGYub3V0Lmxlbmd0aCAtIDFdID0gc2VsZi5vdXRbc2VsZi5vdXQubGVuZ3RoIC0gMV0gKyAnKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICB9XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoIC0gMSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuUEFSRU5PUEVOOlxuICAgICAgc2VsZi5zdGF0ZS5wdXNoKHRva2VuLnR5cGUpO1xuICAgICAgaWYgKHNlbGYuZmlsdGVyQXBwbHlJZHgubGVuZ3RoKSB7XG4gICAgICAgIHNlbGYub3V0LnNwbGljZShzZWxmLmZpbHRlckFwcGx5SWR4W3NlbGYuZmlsdGVyQXBwbHlJZHgubGVuZ3RoIC0gMV0sIDAsICcoJyk7XG4gICAgICAgIGlmIChwcmV2VG9rZW4gJiYgcHJldlRva2VuVHlwZSA9PT0gX3QuVkFSKSB7XG4gICAgICAgICAgdGVtcCA9IHByZXZUb2tlbi5tYXRjaC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICBzZWxmLm91dC5wdXNoKCcgfHwgX2ZuKS5jYWxsKCcgKyBzZWxmLmNoZWNrTWF0Y2godGVtcCkpO1xuICAgICAgICAgIHNlbGYuc3RhdGUucHVzaChfdC5NRVRIT0RPUEVOKTtcbiAgICAgICAgICBzZWxmLmVzY2FwZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYub3V0LnB1c2goJyB8fCBfZm4pKCcpO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucHVzaChzZWxmLm91dC5sZW5ndGggLSAzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYub3V0LnB1c2goJygnKTtcbiAgICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wdXNoKHNlbGYub3V0Lmxlbmd0aCAtIDEpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LlBBUkVOQ0xPU0U6XG4gICAgICB0ZW1wID0gc2VsZi5zdGF0ZS5wb3AoKTtcbiAgICAgIGlmICh0ZW1wICE9PSBfdC5QQVJFTk9QRU4gJiYgdGVtcCAhPT0gX3QuRlVOQ1RJT04gJiYgdGVtcCAhPT0gX3QuRklMVEVSKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ01pc21hdGNoZWQgbmVzdGluZyBzdGF0ZScsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKCcpJyk7XG4gICAgICAvLyBPbmNlIG9mZiB0aGUgcHJldmlvdXMgZW50cnlcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICBpZiAodGVtcCAhPT0gX3QuRklMVEVSKSB7XG4gICAgICAgIC8vIE9uY2UgZm9yIHRoZSBvcGVuIHBhcmVuXG4gICAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuQ09NTUE6XG4gICAgICBpZiAobGFzdFN0YXRlICE9PSBfdC5GVU5DVElPTiAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gX3QuRklMVEVSICYmXG4gICAgICAgICAgbGFzdFN0YXRlICE9PSBfdC5BUlJBWU9QRU4gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IF90LkNVUkxZT1BFTiAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gX3QuUEFSRU5PUEVOICYmXG4gICAgICAgICAgbGFzdFN0YXRlICE9PSBfdC5DT0xPTikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGNvbW1hJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChsYXN0U3RhdGUgPT09IF90LkNPTE9OKSB7XG4gICAgICAgIHNlbGYuc3RhdGUucG9wKCk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKCcsICcpO1xuICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wb3AoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5MT0dJQzpcbiAgICBjYXNlIF90LkNPTVBBUkFUT1I6XG4gICAgICBpZiAoIXByZXZUb2tlbiB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IF90LkNPTU1BIHx8XG4gICAgICAgICAgcHJldlRva2VuVHlwZSA9PT0gdG9rZW4udHlwZSB8fFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgPT09IF90LkJSQUNLRVRPUEVOIHx8XG4gICAgICAgICAgcHJldlRva2VuVHlwZSA9PT0gX3QuQ1VSTFlPUEVOIHx8XG4gICAgICAgICAgcHJldlRva2VuVHlwZSA9PT0gX3QuUEFSRU5PUEVOIHx8XG4gICAgICAgICAgcHJldlRva2VuVHlwZSA9PT0gX3QuRlVOQ1RJT04pIHtcbiAgICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCBsb2dpYycsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5OT1Q6XG4gICAgICBzZWxmLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5WQVI6XG4gICAgICBzZWxmLnBhcnNlVmFyKHRva2VuLCBtYXRjaCwgbGFzdFN0YXRlKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5CUkFDS0VUT1BFTjpcbiAgICAgIGlmICghcHJldlRva2VuIHx8XG4gICAgICAgICAgKHByZXZUb2tlblR5cGUgIT09IF90LlZBUiAmJlxuICAgICAgICAgICAgcHJldlRva2VuVHlwZSAhPT0gX3QuQlJBQ0tFVENMT1NFICYmXG4gICAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5QQVJFTkNMT1NFKSkge1xuICAgICAgICBzZWxmLnN0YXRlLnB1c2goX3QuQVJSQVlPUEVOKTtcbiAgICAgICAgc2VsZi5maWx0ZXJBcHBseUlkeC5wdXNoKHNlbGYub3V0Lmxlbmd0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnN0YXRlLnB1c2godG9rZW4udHlwZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKCdbJyk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuQlJBQ0tFVENMT1NFOlxuICAgICAgdGVtcCA9IHNlbGYuc3RhdGUucG9wKCk7XG4gICAgICBpZiAodGVtcCAhPT0gX3QuQlJBQ0tFVE9QRU4gJiYgdGVtcCAhPT0gX3QuQVJSQVlPUEVOKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgY2xvc2luZyBzcXVhcmUgYnJhY2tldCcsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKCddJyk7XG4gICAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnBvcCgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIF90LkNVUkxZT1BFTjpcbiAgICAgIHNlbGYuc3RhdGUucHVzaCh0b2tlbi50eXBlKTtcbiAgICAgIHNlbGYub3V0LnB1c2goJ3snKTtcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucHVzaChzZWxmLm91dC5sZW5ndGggLSAxKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBfdC5DT0xPTjpcbiAgICAgIGlmIChsYXN0U3RhdGUgIT09IF90LkNVUkxZT1BFTikge1xuICAgICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIGNvbG9uJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuc3RhdGUucHVzaCh0b2tlbi50eXBlKTtcbiAgICAgIHNlbGYub3V0LnB1c2goJzonKTtcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuQ1VSTFlDTE9TRTpcbiAgICAgIGlmIChsYXN0U3RhdGUgPT09IF90LkNPTE9OKSB7XG4gICAgICAgIHNlbGYuc3RhdGUucG9wKCk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5zdGF0ZS5wb3AoKSAhPT0gX3QuQ1VSTFlPUEVOKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgY2xvc2luZyBjdXJseSBicmFjZScsIHNlbGYubGluZSwgc2VsZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dC5wdXNoKCd9Jyk7XG5cbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuRE9US0VZOlxuICAgICAgaWYgKCFwcmV2VG9rZW4gfHwgKFxuICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LlZBUiAmJlxuICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LkJSQUNLRVRDTE9TRSAmJlxuICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LkRPVEtFWSAmJlxuICAgICAgICAgIHByZXZUb2tlblR5cGUgIT09IF90LlBBUkVOQ0xPU0UgJiZcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5GVU5DVElPTkVNUFRZICYmXG4gICAgICAgICAgcHJldlRva2VuVHlwZSAhPT0gX3QuRklMVEVSRU1QVFkgJiZcbiAgICAgICAgICBwcmV2VG9rZW5UeXBlICE9PSBfdC5DVVJMWUNMT1NFXG4gICAgICAgICkpIHtcbiAgICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCBrZXkgXCInICsgbWF0Y2ggKyAnXCInLCBzZWxmLmxpbmUsIHNlbGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXQucHVzaCgnLicgKyBtYXRjaCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgX3QuT1BFUkFUT1I6XG4gICAgICBzZWxmLm91dC5wdXNoKCcgJyArIG1hdGNoICsgJyAnKTtcbiAgICAgIHNlbGYuZmlsdGVyQXBwbHlJZHgucG9wKCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFBhcnNlIHZhcmlhYmxlIHRva2VuXG4gICAqIEBwYXJhbSAge3ttYXRjaDogc3RyaW5nLCB0eXBlOiBudW1iZXIsIGxpbmU6IG51bWJlcn19IHRva2VuICAgICAgTGV4ZXIgdG9rZW4gb2JqZWN0LlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG1hdGNoICAgICAgIFNob3J0Y3V0IGZvciB0b2tlbi5tYXRjaFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGxhc3RTdGF0ZSAgIExleGVyIHRva2VuIHR5cGUgc3RhdGUuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHBhcnNlVmFyOiBmdW5jdGlvbiAodG9rZW4sIG1hdGNoLCBsYXN0U3RhdGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBtYXRjaCA9IG1hdGNoLnNwbGl0KCcuJyk7XG5cbiAgICBpZiAoX3Jlc2VydmVkLmluZGV4T2YobWF0Y2hbMF0pICE9PSAtMSkge1xuICAgICAgdXRpbHMudGhyb3dFcnJvcignUmVzZXJ2ZWQga2V5d29yZCBcIicgKyBtYXRjaFswXSArICdcIiBhdHRlbXB0ZWQgdG8gYmUgdXNlZCBhcyBhIHZhcmlhYmxlJywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICBzZWxmLmZpbHRlckFwcGx5SWR4LnB1c2goc2VsZi5vdXQubGVuZ3RoKTtcbiAgICBpZiAobGFzdFN0YXRlID09PSBfdC5DVVJMWU9QRU4pIHtcbiAgICAgIGlmIChtYXRjaC5sZW5ndGggPiAxKSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgZG90Jywgc2VsZi5saW5lLCBzZWxmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNlbGYub3V0LnB1c2gobWF0Y2hbMF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYub3V0LnB1c2goc2VsZi5jaGVja01hdGNoKG1hdGNoKSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybiBjb250ZXh0dWFsIGRvdC1jaGVjayBzdHJpbmcgZm9yIGEgbWF0Y2hcbiAgICogQHBhcmFtICB7c3RyaW5nfSBtYXRjaCAgICAgICBTaG9ydGN1dCBmb3IgdG9rZW4ubWF0Y2hcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNoZWNrTWF0Y2g6IGZ1bmN0aW9uIChtYXRjaCkge1xuICAgIHZhciB0ZW1wID0gbWF0Y2hbMF0sIHJlc3VsdDtcblxuICAgIGZ1bmN0aW9uIGNoZWNrRG90KGN0eCkge1xuICAgICAgdmFyIGMgPSBjdHggKyB0ZW1wLFxuICAgICAgICBtID0gbWF0Y2gsXG4gICAgICAgIGJ1aWxkID0gJyc7XG5cbiAgICAgIGJ1aWxkID0gJyh0eXBlb2YgJyArIGMgKyAnICE9PSBcInVuZGVmaW5lZFwiICYmICcgKyBjICsgJyAhPT0gbnVsbCc7XG4gICAgICB1dGlscy5lYWNoKG0sIGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGJ1aWxkICs9ICcgJiYgJyArIGMgKyAnLicgKyB2ICsgJyAhPT0gdW5kZWZpbmVkICYmICcgKyBjICsgJy4nICsgdiArICcgIT09IG51bGwnO1xuICAgICAgICBjICs9ICcuJyArIHY7XG4gICAgICB9KTtcbiAgICAgIGJ1aWxkICs9ICcpJztcblxuICAgICAgcmV0dXJuIGJ1aWxkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkRG90KGN0eCkge1xuICAgICAgcmV0dXJuICcoJyArIGNoZWNrRG90KGN0eCkgKyAnID8gJyArIGN0eCArIG1hdGNoLmpvaW4oJy4nKSArICcgOiBcIlwiKSc7XG4gICAgfVxuICAgIHJlc3VsdCA9ICcoJyArIGNoZWNrRG90KCdfY3R4LicpICsgJyA/ICcgKyBidWlsZERvdCgnX2N0eC4nKSArICcgOiAnICsgYnVpbGREb3QoJycpICsgJyknO1xuICAgIHJldHVybiAnKCcgKyByZXN1bHQgKyAnICE9PSBudWxsID8gJyArIHJlc3VsdCArICcgOiAnICsgJ1wiXCIgKSc7XG4gIH1cbn07XG5cbi8qKlxuICogUGFyc2UgYSBzb3VyY2Ugc3RyaW5nIGludG8gdG9rZW5zIHRoYXQgYXJlIHJlYWR5IGZvciBjb21waWxhdGlvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogZXhwb3J0cy5wYXJzZSgne3sgdGFjb3MgfX0nLCB7fSwgdGFncywgZmlsdGVycyk7XG4gKiAvLyA9PiBbeyBjb21waWxlOiBbRnVuY3Rpb25dLCAuLi4gfV1cbiAqXG4gKiBAcGFyYW1zIHtvYmplY3R9IHN3aWcgICAgVGhlIGN1cnJlbnQgU3dpZyBpbnN0YW5jZVxuICogQHBhcmFtICB7c3RyaW5nfSBzb3VyY2UgIFN3aWcgdGVtcGxhdGUgc291cmNlLlxuICogQHBhcmFtICB7b2JqZWN0fSBvcHRzICAgIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhZ3MgICAgS2V5ZWQgb2JqZWN0IG9mIHRhZ3MgdGhhdCBjYW4gYmUgcGFyc2VkIGFuZCBjb21waWxlZC5cbiAqIEBwYXJhbSAge29iamVjdH0gZmlsdGVycyBLZXllZCBvYmplY3Qgb2YgZmlsdGVycyB0aGF0IG1heSBiZSBhcHBsaWVkIHRvIHZhcmlhYmxlcy5cbiAqIEByZXR1cm4ge2FycmF5fSAgICAgICAgICBMaXN0IG9mIHRva2VucyByZWFkeSBmb3IgY29tcGlsYXRpb24uXG4gKi9cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3dpZywgc291cmNlLCBvcHRzLCB0YWdzLCBmaWx0ZXJzKSB7XG4gIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpO1xuICB2YXIgZXNjYXBlID0gb3B0cy5hdXRvZXNjYXBlLFxuICAgIHRhZ09wZW4gPSBvcHRzLnRhZ0NvbnRyb2xzWzBdLFxuICAgIHRhZ0Nsb3NlID0gb3B0cy50YWdDb250cm9sc1sxXSxcbiAgICB2YXJPcGVuID0gb3B0cy52YXJDb250cm9sc1swXSxcbiAgICB2YXJDbG9zZSA9IG9wdHMudmFyQ29udHJvbHNbMV0sXG4gICAgZXNjYXBlZFRhZ09wZW4gPSBlc2NhcGVSZWdFeHAodGFnT3BlbiksXG4gICAgZXNjYXBlZFRhZ0Nsb3NlID0gZXNjYXBlUmVnRXhwKHRhZ0Nsb3NlKSxcbiAgICBlc2NhcGVkVmFyT3BlbiA9IGVzY2FwZVJlZ0V4cCh2YXJPcGVuKSxcbiAgICBlc2NhcGVkVmFyQ2xvc2UgPSBlc2NhcGVSZWdFeHAodmFyQ2xvc2UpLFxuICAgIHRhZ1N0cmlwID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVkVGFnT3BlbiArICctP1xcXFxzKi0/fC0/XFxcXHMqLT8nICsgZXNjYXBlZFRhZ0Nsb3NlICsgJyQnLCAnZycpLFxuICAgIHRhZ1N0cmlwQmVmb3JlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVkVGFnT3BlbiArICctJyksXG4gICAgdGFnU3RyaXBBZnRlciA9IG5ldyBSZWdFeHAoJy0nICsgZXNjYXBlZFRhZ0Nsb3NlICsgJyQnKSxcbiAgICB2YXJTdHJpcCA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlZFZhck9wZW4gKyAnLT9cXFxccyotP3wtP1xcXFxzKi0/JyArIGVzY2FwZWRWYXJDbG9zZSArICckJywgJ2cnKSxcbiAgICB2YXJTdHJpcEJlZm9yZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlZFZhck9wZW4gKyAnLScpLFxuICAgIHZhclN0cmlwQWZ0ZXIgPSBuZXcgUmVnRXhwKCctJyArIGVzY2FwZWRWYXJDbG9zZSArICckJyksXG4gICAgY210T3BlbiA9IG9wdHMuY210Q29udHJvbHNbMF0sXG4gICAgY210Q2xvc2UgPSBvcHRzLmNtdENvbnRyb2xzWzFdLFxuICAgIGFueUNoYXIgPSAnW1xcXFxzXFxcXFNdKj8nLFxuICAgIC8vIFNwbGl0IHRoZSB0ZW1wbGF0ZSBzb3VyY2UgYmFzZWQgb24gdmFyaWFibGUsIHRhZywgYW5kIGNvbW1lbnQgYmxvY2tzXG4gICAgLy8gLyhcXHslW1xcc1xcU10qPyVcXH18XFx7XFx7W1xcc1xcU10qP1xcfVxcfXxcXHsjW1xcc1xcU10qPyNcXH0pL1xuICAgIHNwbGl0dGVyID0gbmV3IFJlZ0V4cChcbiAgICAgICcoJyArXG4gICAgICAgIGVzY2FwZWRUYWdPcGVuICsgYW55Q2hhciArIGVzY2FwZWRUYWdDbG9zZSArICd8JyArXG4gICAgICAgIGVzY2FwZWRWYXJPcGVuICsgYW55Q2hhciArIGVzY2FwZWRWYXJDbG9zZSArICd8JyArXG4gICAgICAgIGVzY2FwZVJlZ0V4cChjbXRPcGVuKSArIGFueUNoYXIgKyBlc2NhcGVSZWdFeHAoY210Q2xvc2UpICtcbiAgICAgICAgJyknXG4gICAgKSxcbiAgICBsaW5lID0gMSxcbiAgICBzdGFjayA9IFtdLFxuICAgIHBhcmVudCA9IG51bGwsXG4gICAgdG9rZW5zID0gW10sXG4gICAgYmxvY2tzID0ge30sXG4gICAgaW5SYXcgPSBmYWxzZSxcbiAgICBzdHJpcE5leHQ7XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgdmFyaWFibGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc3RyICBTdHJpbmcgY29udGVudHMgb2YgdGhlIHZhcmlhYmxlLCBiZXR3ZWVuIDxpPnt7PC9pPiBhbmQgPGk+fX08L2k+XG4gICAqIEBwYXJhbSAge251bWJlcn0gbGluZSBUaGUgbGluZSBudW1iZXIgdGhhdCB0aGlzIHZhcmlhYmxlIHN0YXJ0cyBvbi5cbiAgICogQHJldHVybiB7VmFyVG9rZW59ICAgICAgUGFyc2VkIHZhcmlhYmxlIHRva2VuIG9iamVjdC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHBhcnNlVmFyaWFibGUoc3RyLCBsaW5lKSB7XG4gICAgdmFyIHRva2VucyA9IGxleGVyLnJlYWQodXRpbHMuc3RyaXAoc3RyKSksXG4gICAgICBwYXJzZXIsXG4gICAgICBvdXQ7XG5cbiAgICBwYXJzZXIgPSBuZXcgVG9rZW5QYXJzZXIodG9rZW5zLCBmaWx0ZXJzLCBlc2NhcGUsIGxpbmUsIG9wdHMuZmlsZW5hbWUpO1xuICAgIG91dCA9IHBhcnNlci5wYXJzZSgpLmpvaW4oJycpO1xuXG4gICAgaWYgKHBhcnNlci5zdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuYWJsZSB0byBwYXJzZSBcIicgKyBzdHIgKyAnXCInLCBsaW5lLCBvcHRzLmZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHBhcnNlZCB2YXJpYWJsZSB0b2tlbi5cbiAgICAgKiBAdHlwZWRlZiB7b2JqZWN0fSBWYXJUb2tlblxuICAgICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGNvbXBpbGUgTWV0aG9kIGZvciBjb21waWxpbmcgdGhpcyB0b2tlbi5cbiAgICAgKi9cbiAgICByZXR1cm4ge1xuICAgICAgY29tcGlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJ19vdXRwdXQgKz0gJyArIG91dCArICc7XFxuJztcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGV4cG9ydHMucGFyc2VWYXJpYWJsZSA9IHBhcnNlVmFyaWFibGU7XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgdGFnLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHN0ciAgU3RyaW5nIGNvbnRlbnRzIG9mIHRoZSB0YWcsIGJldHdlZW4gPGk+eyU8L2k+IGFuZCA8aT4lfTwvaT5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBsaW5lIFRoZSBsaW5lIG51bWJlciB0aGF0IHRoaXMgdGFnIHN0YXJ0cyBvbi5cbiAgICogQHJldHVybiB7VGFnVG9rZW59ICAgICAgUGFyc2VkIHRva2VuIG9iamVjdC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHBhcnNlVGFnKHN0ciwgbGluZSkge1xuICAgIHZhciB0b2tlbnMsIHBhcnNlciwgY2h1bmtzLCB0YWdOYW1lLCB0YWcsIGFyZ3MsIGxhc3Q7XG5cbiAgICBpZiAodXRpbHMuc3RhcnRzV2l0aChzdHIsICdlbmQnKSkge1xuICAgICAgbGFzdCA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGxhc3QgJiYgbGFzdC5uYW1lID09PSBzdHIuc3BsaXQoL1xccysvKVswXS5yZXBsYWNlKC9eZW5kLywgJycpICYmIGxhc3QuZW5kcykge1xuICAgICAgICBzd2l0Y2ggKGxhc3QubmFtZSkge1xuICAgICAgICBjYXNlICdhdXRvZXNjYXBlJzpcbiAgICAgICAgICBlc2NhcGUgPSBvcHRzLmF1dG9lc2NhcGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICAgICAgaW5SYXcgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWluUmF3KSB7XG4gICAgICAgIHV0aWxzLnRocm93RXJyb3IoJ1VuZXhwZWN0ZWQgZW5kIG9mIHRhZyBcIicgKyBzdHIucmVwbGFjZSgvXmVuZC8sICcnKSArICdcIicsIGxpbmUsIG9wdHMuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpblJhdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNodW5rcyA9IHN0ci5zcGxpdCgvXFxzKyguKyk/Lyk7XG4gICAgdGFnTmFtZSA9IGNodW5rcy5zaGlmdCgpO1xuXG4gICAgaWYgKCF0YWdzLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIHRhZyBcIicgKyBzdHIgKyAnXCInLCBsaW5lLCBvcHRzLmZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICB0b2tlbnMgPSBsZXhlci5yZWFkKHV0aWxzLnN0cmlwKGNodW5rcy5qb2luKCcgJykpKTtcbiAgICBwYXJzZXIgPSBuZXcgVG9rZW5QYXJzZXIodG9rZW5zLCBmaWx0ZXJzLCBmYWxzZSwgbGluZSwgb3B0cy5maWxlbmFtZSk7XG4gICAgdGFnID0gdGFnc1t0YWdOYW1lXTtcblxuICAgIC8qKlxuICAgICAqIERlZmluZSBjdXN0b20gcGFyc2luZyBtZXRob2RzIGZvciB5b3VyIHRhZy5cbiAgICAgKiBAY2FsbGJhY2sgcGFyc2VcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIG9wdGlvbnMsIHN3aWcpIHtcbiAgICAgKiAgIHBhcnNlci5vbignc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICogICAgIC8vIC4uLlxuICAgICAqICAgfSk7XG4gICAgICogICBwYXJzZXIub24odHlwZXMuU1RSSU5HLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgKiAgICAgLy8gLi4uXG4gICAgICogICB9KTtcbiAgICAgKiB9O1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0ciBUaGUgZnVsbCB0b2tlbiBzdHJpbmcgb2YgdGhlIHRhZy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGluZSBUaGUgbGluZSBudW1iZXIgdGhhdCB0aGlzIHRhZyBhcHBlYXJzIG9uLlxuICAgICAqIEBwYXJhbSB7VG9rZW5QYXJzZXJ9IHBhcnNlciBBIFRva2VuUGFyc2VyIGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSB7VFlQRVN9IHR5cGVzIExleGVyIHRva2VuIHR5cGUgZW51bS5cbiAgICAgKiBAcGFyYW0ge1RhZ1Rva2VuW119IHN0YWNrIFRoZSBjdXJyZW50IHN0YWNrIG9mIG9wZW4gdGFncy5cbiAgICAgKiBAcGFyYW0ge1N3aWdPcHRzfSBvcHRpb25zIFN3aWcgT3B0aW9ucyBPYmplY3QuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHN3aWcgVGhlIFN3aWcgaW5zdGFuY2UgKGdpdmVzIGFjY2VzIHRvIGxvYWRlcnMsIHBhcnNlcnMsIGV0YylcbiAgICAgKi9cbiAgICBpZiAoIXRhZy5wYXJzZShjaHVua3NbMV0sIGxpbmUsIHBhcnNlciwgX3QsIHN0YWNrLCBvcHRzLCBzd2lnKSkge1xuICAgICAgdXRpbHMudGhyb3dFcnJvcignVW5leHBlY3RlZCB0YWcgXCInICsgdGFnTmFtZSArICdcIicsIGxpbmUsIG9wdHMuZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIHBhcnNlci5wYXJzZSgpO1xuICAgIGFyZ3MgPSBwYXJzZXIub3V0O1xuXG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgY2FzZSAnYXV0b2VzY2FwZSc6XG4gICAgICBlc2NhcGUgPSAoYXJnc1swXSAhPT0gJ2ZhbHNlJykgPyBhcmdzWzBdIDogZmFsc2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyYXcnOlxuICAgICAgaW5SYXcgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBwYXJzZWQgdGFnIHRva2VuLlxuICAgICAqIEB0eXBlZGVmIHtPYmplY3R9IFRhZ1Rva2VuXG4gICAgICogQHByb3BlcnR5IHtjb21waWxlfSBbY29tcGlsZV0gTWV0aG9kIGZvciBjb21waWxpbmcgdGhpcyB0b2tlbi5cbiAgICAgKiBAcHJvcGVydHkge2FycmF5fSBbYXJnc10gQXJyYXkgb2YgYXJndW1lbnRzIGZvciB0aGUgdGFnLlxuICAgICAqIEBwcm9wZXJ0eSB7VG9rZW5bXX0gW2NvbnRlbnQ9W11dIEFuIGFycmF5IG9mIHRva2VucyB0aGF0IGFyZSBjaGlsZHJlbiBvZiB0aGlzIFRva2VuLlxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2VuZHNdIFdoZXRoZXIgb3Igbm90IHRoaXMgdGFnIHJlcXVpcmVzIGFuIGVuZCB0YWcuXG4gICAgICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhpcyB0YWcuXG4gICAgICovXG4gICAgcmV0dXJuIHtcbiAgICAgIGJsb2NrOiAhIXRhZ3NbdGFnTmFtZV0uYmxvY2ssXG4gICAgICBjb21waWxlOiB0YWcuY29tcGlsZSxcbiAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICBjb250ZW50OiBbXSxcbiAgICAgIGVuZHM6IHRhZy5lbmRzLFxuICAgICAgbmFtZTogdGFnTmFtZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU3RyaXAgdGhlIHdoaXRlc3BhY2UgZnJvbSB0aGUgcHJldmlvdXMgdG9rZW4sIGlmIGl0IGlzIGEgc3RyaW5nLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IHRva2VuIFBhcnNlZCB0b2tlbi5cbiAgICogQHJldHVybiB7b2JqZWN0fSAgICAgICBJZiB0aGUgdG9rZW4gd2FzIGEgc3RyaW5nLCB0cmFpbGluZyB3aGl0ZXNwYWNlIHdpbGwgYmUgc3RyaXBwZWQuXG4gICAqL1xuICBmdW5jdGlvbiBzdHJpcFByZXZUb2tlbih0b2tlbikge1xuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICB0b2tlbiA9IHRva2VuLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gdG9rZW47XG4gIH1cblxuICAvKiFcbiAgICogTG9vcCBvdmVyIHRoZSBzb3VyY2UsIHNwbGl0IHZpYSB0aGUgdGFnL3Zhci9jb21tZW50IHJlZ3VsYXIgZXhwcmVzc2lvbiBzcGxpdHRlci5cbiAgICogU2VuZCBlYWNoIGNodW5rIHRvIHRoZSBhcHByb3ByaWF0ZSBwYXJzZXIuXG4gICAqL1xuICB1dGlscy5lYWNoKHNvdXJjZS5zcGxpdChzcGxpdHRlciksIGZ1bmN0aW9uIChjaHVuaykge1xuICAgIHZhciB0b2tlbiwgbGluZXMsIHN0cmlwUHJldiwgcHJldlRva2VuLCBwcmV2Q2hpbGRUb2tlbjtcblxuICAgIGlmICghY2h1bmspIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJcyBhIHZhcmlhYmxlP1xuICAgIGlmICghaW5SYXcgJiYgdXRpbHMuc3RhcnRzV2l0aChjaHVuaywgdmFyT3BlbikgJiYgdXRpbHMuZW5kc1dpdGgoY2h1bmssIHZhckNsb3NlKSkge1xuICAgICAgc3RyaXBQcmV2ID0gdmFyU3RyaXBCZWZvcmUudGVzdChjaHVuayk7XG4gICAgICBzdHJpcE5leHQgPSB2YXJTdHJpcEFmdGVyLnRlc3QoY2h1bmspO1xuICAgICAgdG9rZW4gPSBwYXJzZVZhcmlhYmxlKGNodW5rLnJlcGxhY2UodmFyU3RyaXAsICcnKSwgbGluZSk7XG4gICAgLy8gSXMgYSB0YWc/XG4gICAgfSBlbHNlIGlmICh1dGlscy5zdGFydHNXaXRoKGNodW5rLCB0YWdPcGVuKSAmJiB1dGlscy5lbmRzV2l0aChjaHVuaywgdGFnQ2xvc2UpKSB7XG4gICAgICBzdHJpcFByZXYgPSB0YWdTdHJpcEJlZm9yZS50ZXN0KGNodW5rKTtcbiAgICAgIHN0cmlwTmV4dCA9IHRhZ1N0cmlwQWZ0ZXIudGVzdChjaHVuayk7XG4gICAgICB0b2tlbiA9IHBhcnNlVGFnKGNodW5rLnJlcGxhY2UodGFnU3RyaXAsICcnKSwgbGluZSk7XG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuLm5hbWUgPT09ICdleHRlbmRzJykge1xuICAgICAgICAgIHBhcmVudCA9IHRva2VuLmFyZ3Muam9pbignJykucmVwbGFjZSgvXlxcJ3xcXCckL2csICcnKS5yZXBsYWNlKC9eXFxcInxcXFwiJC9nLCAnJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodG9rZW4uYmxvY2sgJiYgIXN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgIGJsb2Nrc1t0b2tlbi5hcmdzLmpvaW4oJycpXSA9IHRva2VuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaW5SYXcgJiYgIXRva2VuKSB7XG4gICAgICAgIHRva2VuID0gY2h1bms7XG4gICAgICB9XG4gICAgLy8gSXMgYSBjb250ZW50IHN0cmluZz9cbiAgICB9IGVsc2UgaWYgKGluUmF3IHx8ICghdXRpbHMuc3RhcnRzV2l0aChjaHVuaywgY210T3BlbikgJiYgIXV0aWxzLmVuZHNXaXRoKGNodW5rLCBjbXRDbG9zZSkpKSB7XG4gICAgICB0b2tlbiA9IChzdHJpcE5leHQpID8gY2h1bmsucmVwbGFjZSgvXlxccyovLCAnJykgOiBjaHVuaztcbiAgICAgIHN0cmlwTmV4dCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodXRpbHMuc3RhcnRzV2l0aChjaHVuaywgY210T3BlbikgJiYgdXRpbHMuZW5kc1dpdGgoY2h1bmssIGNtdENsb3NlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERpZCB0aGlzIHRhZyBhc2sgdG8gc3RyaXAgcHJldmlvdXMgd2hpdGVzcGFjZT8gPGNvZGU+eyUtIC4uLiAlfTwvY29kZT4gb3IgPGNvZGU+e3stIC4uLiB9fTwvY29kZT5cbiAgICBpZiAoc3RyaXBQcmV2ICYmIHRva2Vucy5sZW5ndGgpIHtcbiAgICAgIHByZXZUb2tlbiA9IHRva2Vucy5wb3AoKTtcbiAgICAgIGlmICh0eXBlb2YgcHJldlRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwcmV2VG9rZW4gPSBzdHJpcFByZXZUb2tlbihwcmV2VG9rZW4pO1xuICAgICAgfSBlbHNlIGlmIChwcmV2VG9rZW4uY29udGVudCAmJiBwcmV2VG9rZW4uY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgcHJldkNoaWxkVG9rZW4gPSBzdHJpcFByZXZUb2tlbihwcmV2VG9rZW4uY29udGVudC5wb3AoKSk7XG4gICAgICAgIHByZXZUb2tlbi5jb250ZW50LnB1c2gocHJldkNoaWxkVG9rZW4pO1xuICAgICAgfVxuICAgICAgdG9rZW5zLnB1c2gocHJldlRva2VuKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIHdhcyBhIGNvbW1lbnQsIHNvIGxldCdzIGp1c3Qga2VlcCBnb2luZy5cbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUncyBhbiBvcGVuIGl0ZW0gaW4gdGhlIHN0YWNrLCBhZGQgdGhpcyB0byBpdHMgY29udGVudC5cbiAgICBpZiAoc3RhY2subGVuZ3RoKSB7XG4gICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5jb250ZW50LnB1c2godG9rZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHRva2VuIGlzIGEgdGFnIHRoYXQgcmVxdWlyZXMgYW4gZW5kIHRhZywgb3BlbiBpdCBvbiB0aGUgc3RhY2suXG4gICAgaWYgKHRva2VuLm5hbWUgJiYgdG9rZW4uZW5kcykge1xuICAgICAgc3RhY2sucHVzaCh0b2tlbik7XG4gICAgfVxuXG4gICAgbGluZXMgPSBjaHVuay5tYXRjaCgvXFxuL2cpO1xuICAgIGxpbmUgKz0gKGxpbmVzKSA/IGxpbmVzLmxlbmd0aCA6IDA7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogb3B0cy5maWxlbmFtZSxcbiAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICB0b2tlbnM6IHRva2VucyxcbiAgICBibG9ja3M6IGJsb2Nrc1xuICB9O1xufTtcblxuXG4vKipcbiAqIENvbXBpbGUgYW4gYXJyYXkgb2YgdG9rZW5zLlxuICogQHBhcmFtICB7VG9rZW5bXX0gdGVtcGxhdGUgICAgIEFuIGFycmF5IG9mIHRlbXBsYXRlIHRva2Vucy5cbiAqIEBwYXJhbSAge1RlbXBsYXRlc1tdfSBwYXJlbnRzICBBcnJheSBvZiBwYXJlbnQgdGVtcGxhdGVzLlxuICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zXSAgIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IFtibG9ja05hbWVdICAgTmFtZSBvZiB0aGUgY3VycmVudCBibG9jayBjb250ZXh0LlxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgIFBhcnRpYWwgZm9yIGEgY29tcGlsZWQgSmF2YVNjcmlwdCBtZXRob2QgdGhhdCB3aWxsIG91dHB1dCBhIHJlbmRlcmVkIHRlbXBsYXRlLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSkge1xuICB2YXIgb3V0ID0gJycsXG4gICAgdG9rZW5zID0gdXRpbHMuaXNBcnJheSh0ZW1wbGF0ZSkgPyB0ZW1wbGF0ZSA6IHRlbXBsYXRlLnRva2VucztcblxuICB1dGlscy5lYWNoKHRva2VucywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdmFyIG87XG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG91dCArPSAnX291dHB1dCArPSBcIicgKyB0b2tlbi5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpLnJlcGxhY2UoL1xcbnxcXHIvZywgJ1xcXFxuJykucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiO1xcbic7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcGlsZSBjYWxsYmFjayBmb3IgVmFyVG9rZW4gYW5kIFRhZ1Rva2VuIG9iamVjdHMuXG4gICAgICogQGNhbGxiYWNrIGNvbXBpbGVcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgICAgKiAgIGlmIChhcmdzWzBdID09PSAnZm9vJykge1xuICAgICAqICAgICByZXR1cm4gY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSArICdcXG4nO1xuICAgICAqICAgfVxuICAgICAqICAgcmV0dXJuICdfb3V0cHV0ICs9IFwiZmFsbGJhY2tcIjtcXG4nO1xuICAgICAqIH07XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3BhcnNlckNvbXBpbGVyfSBjb21waWxlclxuICAgICAqIEBwYXJhbSB7YXJyYXl9IFthcmdzXSBBcnJheSBvZiBwYXJzZWQgYXJndW1lbnRzIG9uIHRoZSBmb3IgdGhlIHRva2VuLlxuICAgICAqIEBwYXJhbSB7YXJyYXl9IFtjb250ZW50XSBBcnJheSBvZiBjb250ZW50IHdpdGhpbiB0aGUgdG9rZW4uXG4gICAgICogQHBhcmFtIHthcnJheX0gW3BhcmVudHNdIEFycmF5IG9mIHBhcmVudCB0ZW1wbGF0ZXMgZm9yIHRoZSBjdXJyZW50IHRlbXBsYXRlIGNvbnRleHQuXG4gICAgICogQHBhcmFtIHtTd2lnT3B0c30gW29wdGlvbnNdIFN3aWcgT3B0aW9ucyBPYmplY3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2Jsb2NrTmFtZV0gTmFtZSBvZiB0aGUgZGlyZWN0IGJsb2NrIHBhcmVudCwgaWYgYW55LlxuICAgICAqL1xuICAgIG8gPSB0b2tlbi5jb21waWxlKGV4cG9ydHMuY29tcGlsZSwgdG9rZW4uYXJncyA/IHRva2VuLmFyZ3Muc2xpY2UoMCkgOiBbXSwgdG9rZW4uY29udGVudCA/IHRva2VuLmNvbnRlbnQuc2xpY2UoMCkgOiBbXSwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKTtcbiAgICBvdXQgKz0gbyB8fCAnJztcbiAgfSk7XG5cbiAgcmV0dXJuIG91dDtcbn07XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gIF90YWdzID0gcmVxdWlyZSgnLi90YWdzJyksXG4gIF9maWx0ZXJzID0gcmVxdWlyZSgnLi9maWx0ZXJzJyksXG4gIHBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJyksXG4gIGRhdGVmb3JtYXR0ZXIgPSByZXF1aXJlKCcuL2RhdGVmb3JtYXR0ZXInKSxcbiAgbG9hZGVycyA9IHJlcXVpcmUoJy4vbG9hZGVycycpO1xuXG4vKipcbiAqIFN3aWcgdmVyc2lvbiBudW1iZXIgYXMgYSBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICogaWYgKHN3aWcudmVyc2lvbiA9PT0gXCIxLjQuMlwiKSB7IC4uLiB9XG4gKlxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuZXhwb3J0cy52ZXJzaW9uID0gXCIxLjQuMlwiO1xuXG4vKipcbiAqIFN3aWcgT3B0aW9ucyBPYmplY3QuIFRoaXMgb2JqZWN0IGNhbiBiZSBwYXNzZWQgdG8gbWFueSBvZiB0aGUgQVBJLWxldmVsIFN3aWcgbWV0aG9kcyB0byBjb250cm9sIHZhcmlvdXMgYXNwZWN0cyBvZiB0aGUgZW5naW5lLiBBbGwga2V5cyBhcmUgb3B0aW9uYWwuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTd2lnT3B0c1xuICogQHByb3BlcnR5IHtib29sZWFufSBhdXRvZXNjYXBlICBDb250cm9scyB3aGV0aGVyIG9yIG5vdCB2YXJpYWJsZSBvdXRwdXQgd2lsbCBhdXRvbWF0aWNhbGx5IGJlIGVzY2FwZWQgZm9yIHNhZmUgSFRNTCBvdXRwdXQuIERlZmF1bHRzIHRvIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPnRydWU8L2NvZGU+LiBGdW5jdGlvbnMgZXhlY3V0ZWQgaW4gdmFyaWFibGUgc3RhdGVtZW50cyB3aWxsIG5vdCBiZSBhdXRvLWVzY2FwZWQuIFlvdXIgYXBwbGljYXRpb24vZnVuY3Rpb25zIHNob3VsZCB0YWtlIGNhcmUgb2YgdGhlaXIgb3duIGF1dG8tZXNjYXBpbmcuXG4gKiBAcHJvcGVydHkge2FycmF5fSAgIHZhckNvbnRyb2xzIE9wZW4gYW5kIGNsb3NlIGNvbnRyb2xzIGZvciB2YXJpYWJsZXMuIERlZmF1bHRzIHRvIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPlsne3snLCAnfX0nXTwvY29kZT4uXG4gKiBAcHJvcGVydHkge2FycmF5fSAgIHRhZ0NvbnRyb2xzIE9wZW4gYW5kIGNsb3NlIGNvbnRyb2xzIGZvciB0YWdzLiBEZWZhdWx0cyB0byA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5bJ3slJywgJyV9J108L2NvZGU+LlxuICogQHByb3BlcnR5IHthcnJheX0gICBjbXRDb250cm9scyBPcGVuIGFuZCBjbG9zZSBjb250cm9scyBmb3IgY29tbWVudHMuIERlZmF1bHRzIHRvIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPlsneyMnLCAnI30nXTwvY29kZT4uXG4gKiBAcHJvcGVydHkge29iamVjdH0gIGxvY2FscyAgICAgIERlZmF1bHQgdmFyaWFibGUgY29udGV4dCB0byBiZSBwYXNzZWQgdG8gPHN0cm9uZz5hbGw8L3N0cm9uZz4gdGVtcGxhdGVzLlxuICogQHByb3BlcnR5IHtDYWNoZU9wdGlvbnN9IGNhY2hlIENhY2hlIGNvbnRyb2wgZm9yIHRlbXBsYXRlcy4gRGVmYXVsdHMgdG8gc2F2aW5nIGluIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPidtZW1vcnknPC9jb2RlPi4gU2VuZCA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5mYWxzZTwvY29kZT4gdG8gZGlzYWJsZS4gU2VuZCBhbiBvYmplY3Qgd2l0aCA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5nZXQ8L2NvZGU+IGFuZCA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5zZXQ8L2NvZGU+IGZ1bmN0aW9ucyB0byBjdXN0b21pemUuXG4gKiBAcHJvcGVydHkge1RlbXBsYXRlTG9hZGVyfSBsb2FkZXIgVGhlIG1ldGhvZCB0aGF0IFN3aWcgd2lsbCB1c2UgdG8gbG9hZCB0ZW1wbGF0ZXMuIERlZmF1bHRzIHRvIDx2YXI+c3dpZy5sb2FkZXJzLmZzPC92YXI+LlxuICovXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgYXV0b2VzY2FwZTogdHJ1ZSxcbiAgICB2YXJDb250cm9sczogWyd7eycsICd9fSddLFxuICAgIHRhZ0NvbnRyb2xzOiBbJ3slJywgJyV9J10sXG4gICAgY210Q29udHJvbHM6IFsneyMnLCAnI30nXSxcbiAgICBsb2NhbHM6IHt9LFxuICAgIC8qKlxuICAgICAqIENhY2hlIGNvbnRyb2wgZm9yIHRlbXBsYXRlcy4gRGVmYXVsdHMgdG8gc2F2aW5nIGFsbCB0ZW1wbGF0ZXMgaW50byBtZW1vcnkuXG4gICAgICogQHR5cGVkZWYge2Jvb2xlYW58c3RyaW5nfG9iamVjdH0gQ2FjaGVPcHRpb25zXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBEZWZhdWx0XG4gICAgICogc3dpZy5zZXREZWZhdWx0cyh7IGNhY2hlOiAnbWVtb3J5JyB9KTtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIERpc2FibGVzIGNhY2hpbmcgaW4gU3dpZy5cbiAgICAgKiBzd2lnLnNldERlZmF1bHRzKHsgY2FjaGU6IGZhbHNlIH0pO1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gQ3VzdG9tIGNhY2hlIHN0b3JhZ2UgYW5kIHJldHJpZXZhbFxuICAgICAqIHN3aWcuc2V0RGVmYXVsdHMoe1xuICAgICAqICAgY2FjaGU6IHtcbiAgICAgKiAgICAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7IC4uLiB9LFxuICAgICAqICAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbCkgeyAuLi4gfVxuICAgICAqICAgfVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGNhY2hlOiAnbWVtb3J5JyxcbiAgICAvKipcbiAgICAgKiBDb25maWd1cmUgU3dpZyB0byB1c2UgZWl0aGVyIHRoZSA8dmFyPnN3aWcubG9hZGVycy5mczwvdmFyPiBvciA8dmFyPnN3aWcubG9hZGVycy5tZW1vcnk8L3Zhcj4gdGVtcGxhdGUgbG9hZGVyLiBPciwgeW91IGNhbiB3cml0ZSB5b3VyIG93biFcbiAgICAgKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgcGxlYXNlIHNlZSB0aGUgPGEgaHJlZj1cIi4uL2xvYWRlcnMvXCI+VGVtcGxhdGUgTG9hZGVycyBkb2N1bWVudGF0aW9uPC9hPi5cbiAgICAgKiBAdHlwZWRlZiB7Y2xhc3N9IFRlbXBsYXRlTG9hZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyBEZWZhdWx0LCBGaWxlU3lzdGVtIGxvYWRlclxuICAgICAqIHN3aWcuc2V0RGVmYXVsdHMoeyBsb2FkZXI6IHN3aWcubG9hZGVycy5mcygpIH0pO1xuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gRmlsZVN5c3RlbSBsb2FkZXIgYWxsb3dpbmcgYSBiYXNlIHBhdGhcbiAgICAgKiAvLyBXaXRoIHRoaXMsIHlvdSBkb24ndCB1c2UgcmVsYXRpdmUgVVJMcyBpbiB5b3VyIHRlbXBsYXRlIHJlZmVyZW5jZXNcbiAgICAgKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBzd2lnLmxvYWRlcnMuZnMoX19kaXJuYW1lICsgJy90ZW1wbGF0ZXMnKSB9KTtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIE1lbW9yeSBMb2FkZXJcbiAgICAgKiBzd2lnLnNldERlZmF1bHRzKHsgbG9hZGVyOiBzd2lnLmxvYWRlcnMubWVtb3J5KHtcbiAgICAgKiAgIGxheW91dDogJ3slIGJsb2NrIGZvbyAlfXslIGVuZGJsb2NrICV9JyxcbiAgICAgKiAgIHBhZ2UxOiAneyUgZXh0ZW5kcyBcImxheW91dFwiICV9eyUgYmxvY2sgZm9vICV9VGFjb3MheyUgZW5kYmxvY2sgJX0nXG4gICAgICogfSl9KTtcbiAgICAgKi9cbiAgICBsb2FkZXI6IGxvYWRlcnMuZnMoKVxuICB9LFxuICBkZWZhdWx0SW5zdGFuY2U7XG5cbi8qKlxuICogRW1wdHkgZnVuY3Rpb24sIHVzZWQgaW4gdGVtcGxhdGVzLlxuICogQHJldHVybiB7c3RyaW5nfSBFbXB0eSBzdHJpbmdcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGVmbigpIHsgcmV0dXJuICcnOyB9XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0gIHs/U3dpZ09wdHN9IG9wdGlvbnMgU3dpZyBvcHRpb25zIG9iamVjdC5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gICAgICBUaGlzIG1ldGhvZCB3aWxsIHRocm93IGVycm9ycyBpZiBhbnl0aGluZyBpcyB3cm9uZy5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHV0aWxzLmVhY2goWyd2YXJDb250cm9scycsICd0YWdDb250cm9scycsICdjbXRDb250cm9scyddLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKCFvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF1dGlscy5pc0FycmF5KG9wdGlvbnNba2V5XSkgfHwgb3B0aW9uc1trZXldLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcHRpb24gXCInICsga2V5ICsgJ1wiIG11c3QgYmUgYW4gYXJyYXkgY29udGFpbmluZyAyIGRpZmZlcmVudCBjb250cm9sIHN0cmluZ3MuJyk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zW2tleV1bMF0gPT09IG9wdGlvbnNba2V5XVsxXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcHRpb24gXCInICsga2V5ICsgJ1wiIG9wZW4gYW5kIGNsb3NlIGNvbnRyb2xzIG11c3Qgbm90IGJlIHRoZSBzYW1lLicpO1xuICAgIH1cbiAgICB1dGlscy5lYWNoKG9wdGlvbnNba2V5XSwgZnVuY3Rpb24gKGEsIGkpIHtcbiAgICAgIGlmIChhLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcHRpb24gXCInICsga2V5ICsgJ1wiICcgKyAoKGkpID8gJ29wZW4gJyA6ICdjbG9zZSAnKSArICdjb250cm9sIG11c3QgYmUgYXQgbGVhc3QgMiBjaGFyYWN0ZXJzLiBTYXcgXCInICsgYSArICdcIiBpbnN0ZWFkLicpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnY2FjaGUnKSkge1xuICAgIGlmIChvcHRpb25zLmNhY2hlICYmIG9wdGlvbnMuY2FjaGUgIT09ICdtZW1vcnknKSB7XG4gICAgICBpZiAoIW9wdGlvbnMuY2FjaGUuZ2V0IHx8ICFvcHRpb25zLmNhY2hlLnNldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2FjaGUgb3B0aW9uICcgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zLmNhY2hlKSArICcgZm91bmQuIEV4cGVjdGVkIFwibWVtb3J5XCIgb3IgeyBnZXQ6IGZ1bmN0aW9uIChrZXkpIHsgLi4uIH0sIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHsgLi4uIH0gfS4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2xvYWRlcicpKSB7XG4gICAgaWYgKG9wdGlvbnMubG9hZGVyKSB7XG4gICAgICBpZiAoIW9wdGlvbnMubG9hZGVyLmxvYWQgfHwgIW9wdGlvbnMubG9hZGVyLnJlc29sdmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxvYWRlciBvcHRpb24gJyArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMubG9hZGVyKSArICcgZm91bmQuIEV4cGVjdGVkIHsgbG9hZDogZnVuY3Rpb24gKHBhdGhuYW1lLCBjYikgeyAuLi4gfSwgcmVzb2x2ZTogZnVuY3Rpb24gKHRvLCBmcm9tKSB7IC4uLiB9IH0uJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn1cblxuLyoqXG4gKiBTZXQgZGVmYXVsdHMgZm9yIHRoZSBiYXNlIGFuZCBhbGwgbmV3IFN3aWcgZW52aXJvbm1lbnRzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBzd2lnLnNldERlZmF1bHRzKHsgY2FjaGU6IGZhbHNlIH0pO1xuICogLy8gPT4gRGlzYWJsZXMgQ2FjaGVcbiAqXG4gKiBAZXhhbXBsZVxuICogc3dpZy5zZXREZWZhdWx0cyh7IGxvY2FsczogeyBub3c6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBEYXRlKCk7IH0gfX0pO1xuICogLy8gPT4gc2V0cyBhIGdsb2JhbGx5IGFjY2Vzc2libGUgbWV0aG9kIGZvciBhbGwgdGVtcGxhdGVcbiAqIC8vICAgIGNvbnRleHRzLCBhbGxvd2luZyB5b3UgdG8gcHJpbnQgdGhlIGN1cnJlbnQgZGF0ZVxuICogLy8gPT4ge3sgbm93KCl8ZGF0ZSgnRiBqUywgWScpIH19XG4gKlxuICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICogQHJldHVybiB7dW5kZWZpbmVkfVxuICovXG5leHBvcnRzLnNldERlZmF1bHRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgdmFsaWRhdGVPcHRpb25zKG9wdGlvbnMpO1xuICBkZWZhdWx0SW5zdGFuY2Uub3B0aW9ucyA9IHV0aWxzLmV4dGVuZChkZWZhdWx0SW5zdGFuY2Uub3B0aW9ucywgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgZGVmYXVsdCBUaW1lWm9uZSBvZmZzZXQgZm9yIGRhdGUgZm9ybWF0dGluZyB2aWEgdGhlIGRhdGUgZmlsdGVyLiBUaGlzIGlzIGEgZ2xvYmFsIHNldHRpbmcgYW5kIHdpbGwgYWZmZWN0IGFsbCBTd2lnIGVudmlyb25tZW50cywgb2xkIG9yIG5ldy5cbiAqIEBwYXJhbSAge251bWJlcn0gb2Zmc2V0IE9mZnNldCBmcm9tIEdNVCwgaW4gbWludXRlcy5cbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAqL1xuZXhwb3J0cy5zZXREZWZhdWx0VFpPZmZzZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGRhdGVmb3JtYXR0ZXIudHpPZmZzZXQgPSBvZmZzZXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldywgc2VwYXJhdGUgU3dpZyBjb21waWxlL3JlbmRlciBlbnZpcm9ubWVudC5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIHN3aWcgPSByZXF1aXJlKCdzd2lnJyk7XG4gKiB2YXIgbXlzd2lnID0gbmV3IHN3aWcuU3dpZyh7dmFyQ29udHJvbHM6IFsnPCU9JywgJyU+J119KTtcbiAqIG15c3dpZy5yZW5kZXIoJ1RhY29zIGFyZSA8JT0gdGFjb3MgPT4hJywgeyBsb2NhbHM6IHsgdGFjb3M6ICdkZWxpY2lvdXMnIH19KTtcbiAqIC8vID0+IFRhY29zIGFyZSBkZWxpY2lvdXMhXG4gKiBzd2lnLnJlbmRlcignVGFjb3MgYXJlIDwlPSB0YWNvcyA9PiEnLCB7IGxvY2FsczogeyB0YWNvczogJ2RlbGljaW91cycgfX0pO1xuICogLy8gPT4gJ1RhY29zIGFyZSA8JT0gdGFjb3MgPT4hJ1xuICpcbiAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0cz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICBOZXcgU3dpZyBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0cy5Td2lnID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgdmFsaWRhdGVPcHRpb25zKG9wdHMpO1xuICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLCBvcHRzIHx8IHt9KTtcbiAgdGhpcy5jYWNoZSA9IHt9O1xuICB0aGlzLmV4dGVuc2lvbnMgPSB7fTtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgIHRhZ3MgPSBfdGFncyxcbiAgICBmaWx0ZXJzID0gX2ZpbHRlcnM7XG5cbiAgLyoqXG4gICAqIEdldCBjb21iaW5lZCBsb2NhbHMgY29udGV4dC5cbiAgICogQHBhcmFtICB7P1N3aWdPcHRzfSBbb3B0aW9uc10gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgIExvY2FscyBjb250ZXh0LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0TG9jYWxzKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMubG9jYWxzKSB7XG4gICAgICByZXR1cm4gc2VsZi5vcHRpb25zLmxvY2FscztcbiAgICB9XG5cbiAgICByZXR1cm4gdXRpbHMuZXh0ZW5kKHt9LCBzZWxmLm9wdGlvbnMubG9jYWxzLCBvcHRpb25zLmxvY2Fscyk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHdoZXRoZXIgY2FjaGluZyBpcyBlbmFibGVkIHZpYSB0aGUgb3B0aW9ucyBwcm92aWRlZCBhbmQvb3IgZGVmYXVsdHNcbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIE9wdGlvbnMgT2JqZWN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBzaG91bGRDYWNoZShvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIChvcHRpb25zLmhhc093blByb3BlcnR5KCdjYWNoZScpICYmICFvcHRpb25zLmNhY2hlKSB8fCAhc2VsZi5vcHRpb25zLmNhY2hlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjb21waWxlZCB0ZW1wbGF0ZSBmcm9tIHRoZSBjYWNoZS5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICAgICAgICAgIE5hbWUgb2YgdGVtcGxhdGUuXG4gICAqIEByZXR1cm4ge29iamVjdHx1bmRlZmluZWR9ICAgICBUZW1wbGF0ZSBmdW5jdGlvbiBhbmQgdG9rZW5zLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY2FjaGVHZXQoa2V5LCBvcHRpb25zKSB7XG4gICAgaWYgKHNob3VsZENhY2hlKG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHNlbGYub3B0aW9ucy5jYWNoZSA9PT0gJ21lbW9yeScpIHtcbiAgICAgIHJldHVybiBzZWxmLmNhY2hlW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGYub3B0aW9ucy5jYWNoZS5nZXQoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSBhIHRlbXBsYXRlIGluIHRoZSBjYWNoZS5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXkgTmFtZSBvZiB0ZW1wbGF0ZS5cbiAgICogQHBhcmFtICB7b2JqZWN0fSB2YWwgVGVtcGxhdGUgZnVuY3Rpb24gYW5kIHRva2Vucy5cbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY2FjaGVTZXQoa2V5LCBvcHRpb25zLCB2YWwpIHtcbiAgICBpZiAoc2hvdWxkQ2FjaGUob3B0aW9ucykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5vcHRpb25zLmNhY2hlID09PSAnbWVtb3J5Jykge1xuICAgICAgc2VsZi5jYWNoZVtrZXldID0gdmFsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYub3B0aW9ucy5jYWNoZS5zZXQoa2V5LCB2YWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgaW4tbWVtb3J5IHRlbXBsYXRlIGNhY2hlLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBzd2lnLmludmFsaWRhdGVDYWNoZSgpO1xuICAgKlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICB0aGlzLmludmFsaWRhdGVDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2VsZi5vcHRpb25zLmNhY2hlID09PSAnbWVtb3J5Jykge1xuICAgICAgc2VsZi5jYWNoZSA9IHt9O1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQWRkIGEgY3VzdG9tIGZpbHRlciBmb3Igc3dpZyB2YXJpYWJsZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGZ1bmN0aW9uIHJlcGxhY2VNcyhpbnB1dCkgeyByZXR1cm4gaW5wdXQucmVwbGFjZSgvbS9nLCAnZicpOyB9XG4gICAqIHN3aWcuc2V0RmlsdGVyKCdyZXBsYWNlTXMnLCByZXBsYWNlTXMpO1xuICAgKiAvLyA9PiB7eyBcIm9ub21hdG9wb2VpYVwifHJlcGxhY2VNcyB9fVxuICAgKiAvLyA9PiBvbm9mYXRvcGVpYVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgbmFtZSAgICBOYW1lIG9mIGZpbHRlciwgdXNlZCBpbiB0ZW1wbGF0ZXMuIDxzdHJvbmc+V2lsbDwvc3Ryb25nPiBvdmVyd3JpdGUgcHJldmlvdXNseSBkZWZpbmVkIGZpbHRlcnMsIGlmIHVzaW5nIHRoZSBzYW1lIG5hbWUuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259ICBtZXRob2QgIEZ1bmN0aW9uIHRoYXQgYWN0cyBhZ2FpbnN0IHRoZSBpbnB1dC4gU2VlIDxhIGhyZWY9XCIvZG9jcy9maWx0ZXJzLyNjdXN0b21cIj5DdXN0b20gRmlsdGVyczwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIHRoaXMuc2V0RmlsdGVyID0gZnVuY3Rpb24gKG5hbWUsIG1ldGhvZCkge1xuICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmlsdGVyIFwiJyArIG5hbWUgKyAnXCIgaXMgbm90IGEgdmFsaWQgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIGZpbHRlcnNbbmFtZV0gPSBtZXRob2Q7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFkZCBhIGN1c3RvbSB0YWcuIFRvIGV4cG9zZSB5b3VyIG93biBleHRlbnNpb25zIHRvIGNvbXBpbGVkIHRlbXBsYXRlIGNvZGUsIHNlZSA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj5zd2lnLnNldEV4dGVuc2lvbjwvY29kZT4uXG4gICAqXG4gICAqIEZvciBhIG1vcmUgaW4tZGVwdGggZXhwbGFuYXRpb24gb2Ygd3JpdGluZyBjdXN0b20gdGFncywgc2VlIDxhIGhyZWY9XCIuLi9leHRlbmRpbmcvI3RhZ3NcIj5DdXN0b20gVGFnczwvYT4uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciB0YWNvdGFnID0gcmVxdWlyZSgnLi90YWNvdGFnJyk7XG4gICAqIHN3aWcuc2V0VGFnKCd0YWNvcycsIHRhY290YWcucGFyc2UsIHRhY290YWcuY29tcGlsZSwgdGFjb3RhZy5lbmRzLCB0YWNvdGFnLmJsb2NrTGV2ZWwpO1xuICAgKiAvLyA9PiB7JSB0YWNvcyAlfU1ha2UgdGhpcyBiZSB0YWNvcy57JSBlbmR0YWNvcyAlfVxuICAgKiAvLyA9PiBUYWNvcyB0YWNvcyB0YWNvcyB0YWNvcy5cbiAgICpcbiAgICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgICAgVGFnIG5hbWUuXG4gICAqIEBwYXJhbSAge2Z1bmN0aW9ufSBwYXJzZSAgIE1ldGhvZCBmb3IgcGFyc2luZyB0b2tlbnMuXG4gICAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjb21waWxlIE1ldGhvZCBmb3IgY29tcGlsaW5nIHJlbmRlcmFibGUgb3V0cHV0LlxuICAgKiBAcGFyYW0gIHtib29sZWFufSBbZW5kcz1mYWxzZV0gICAgIFdoZXRoZXIgb3Igbm90IHRoaXMgdGFnIHJlcXVpcmVzIGFuIDxpPmVuZDwvaT4gdGFnLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSBbYmxvY2tMZXZlbD1mYWxzZV0gSWYgZmFsc2UsIHRoaXMgdGFnIHdpbGwgbm90IGJlIGNvbXBpbGVkIG91dHNpZGUgb2YgPGNvZGU+YmxvY2s8L2NvZGU+IHRhZ3Mgd2hlbiBleHRlbmRpbmcgYSBwYXJlbnQgdGVtcGxhdGUuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIHRoaXMuc2V0VGFnID0gZnVuY3Rpb24gKG5hbWUsIHBhcnNlLCBjb21waWxlLCBlbmRzLCBibG9ja0xldmVsKSB7XG4gICAgaWYgKHR5cGVvZiBwYXJzZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYWcgXCInICsgbmFtZSArICdcIiBwYXJzZSBtZXRob2QgaXMgbm90IGEgdmFsaWQgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjb21waWxlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhZyBcIicgKyBuYW1lICsgJ1wiIGNvbXBpbGUgbWV0aG9kIGlzIG5vdCBhIHZhbGlkIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRhZ3NbbmFtZV0gPSB7XG4gICAgICBwYXJzZTogcGFyc2UsXG4gICAgICBjb21waWxlOiBjb21waWxlLFxuICAgICAgZW5kczogZW5kcyB8fCBmYWxzZSxcbiAgICAgIGJsb2NrOiAhIWJsb2NrTGV2ZWxcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZXh0ZW5zaW9ucyBmb3IgY3VzdG9tIHRhZ3MuIFRoaXMgYWxsb3dzIGFueSBjdXN0b20gdGFnIHRvIGFjY2VzcyBhIGdsb2JhbGx5IGF2YWlsYWJsZSBtZXRob2RzIHZpYSBhIHNwZWNpYWwgZ2xvYmFsbHkgYXZhaWxhYmxlIG9iamVjdCwgPHZhcj5fZXh0PC92YXI+LCBpbiB0ZW1wbGF0ZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHN3aWcuc2V0RXh0ZW5zaW9uKCd0cmFucycsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB0cmFuc2xhdGUodik7IH0pO1xuICAgKiBmdW5jdGlvbiBjb21waWxlVHJhbnMoY29tcGlsZXIsIGFyZ3MsIGNvbnRlbnQsIHBhcmVudCwgb3B0aW9ucykge1xuICAgKiAgIHJldHVybiAnX291dHB1dCArPSBfZXh0LnRyYW5zKCcgKyBhcmdzWzBdICsgJyk7J1xuICAgKiB9O1xuICAgKiBzd2lnLnNldFRhZygndHJhbnMnLCBwYXJzZVRyYW5zLCBjb21waWxlVHJhbnMsIHRydWUpO1xuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgICBLZXkgbmFtZSBvZiB0aGUgZXh0ZW5zaW9uLiBBY2Nlc3NlZCB2aWEgPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+X2V4dFtuYW1lXTwvY29kZT4uXG4gICAqIEBwYXJhbSAgeyp9ICAgICAgb2JqZWN0IFRoZSBtZXRob2QsIHZhbHVlLCBvciBvYmplY3QgdGhhdCBzaG91bGQgYmUgYXZhaWxhYmxlIHZpYSB0aGUgZ2l2ZW4gbmFtZS5cbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgdGhpcy5zZXRFeHRlbnNpb24gPSBmdW5jdGlvbiAobmFtZSwgb2JqZWN0KSB7XG4gICAgc2VsZi5leHRlbnNpb25zW25hbWVdID0gb2JqZWN0O1xuICB9O1xuXG4gIC8qKlxuICAgKiBQYXJzZSBhIGdpdmVuIHNvdXJjZSBzdHJpbmcgaW50byB0b2tlbnMuXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlICBTd2lnIHRlbXBsYXRlIHNvdXJjZS5cbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHBhcnNlZCAgVGVtcGxhdGUgdG9rZW5zIG9iamVjdC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHRoaXMucGFyc2UgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFsaWRhdGVPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgdmFyIGxvY2FscyA9IGdldExvY2FscyhvcHRpb25zKSxcbiAgICAgIG9wdHMgPSB7fSxcbiAgICAgIGs7XG5cbiAgICBmb3IgKGsgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaykgJiYgayAhPT0gJ2xvY2FscycpIHtcbiAgICAgICAgb3B0c1trXSA9IG9wdGlvbnNba107XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7fSwgc2VsZi5vcHRpb25zLCBvcHRzKTtcbiAgICBvcHRpb25zLmxvY2FscyA9IGxvY2FscztcblxuICAgIHJldHVybiBwYXJzZXIucGFyc2UodGhpcywgc291cmNlLCBvcHRpb25zLCB0YWdzLCBmaWx0ZXJzKTtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2UgYSBnaXZlbiBmaWxlIGludG8gdG9rZW5zLlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGhuYW1lICBGdWxsIHBhdGggdG8gZmlsZSB0byBwYXJzZS5cbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSAgIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gcGFyc2VkICAgIFRlbXBsYXRlIHRva2VucyBvYmplY3QuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICB0aGlzLnBhcnNlRmlsZSA9IGZ1bmN0aW9uIChwYXRobmFtZSwgb3B0aW9ucykge1xuICAgIHZhciBzcmM7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBwYXRobmFtZSA9IHNlbGYub3B0aW9ucy5sb2FkZXIucmVzb2x2ZShwYXRobmFtZSwgb3B0aW9ucy5yZXNvbHZlRnJvbSk7XG5cbiAgICBzcmMgPSBzZWxmLm9wdGlvbnMubG9hZGVyLmxvYWQocGF0aG5hbWUpO1xuXG4gICAgaWYgKCFvcHRpb25zLmZpbGVuYW1lKSB7XG4gICAgICBvcHRpb25zID0gdXRpbHMuZXh0ZW5kKHsgZmlsZW5hbWU6IHBhdGhuYW1lIH0sIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmLnBhcnNlKHNyYywgb3B0aW9ucyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlLU1hcCBibG9ja3Mgd2l0aGluIGEgbGlzdCBvZiB0b2tlbnMgdG8gdGhlIHRlbXBsYXRlJ3MgYmxvY2sgb2JqZWN0cy5cbiAgICogQHBhcmFtICB7YXJyYXl9ICB0b2tlbnMgICBMaXN0IG9mIHRva2VucyBmb3IgdGhlIHBhcmVudCBvYmplY3QuXG4gICAqIEBwYXJhbSAge29iamVjdH0gdGVtcGxhdGUgQ3VycmVudCB0ZW1wbGF0ZSB0aGF0IG5lZWRzIHRvIGJlIG1hcHBlZCB0byB0aGUgIHBhcmVudCdzIGJsb2NrIGFuZCB0b2tlbiBsaXN0LlxuICAgKiBAcmV0dXJuIHthcnJheX1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHJlbWFwQmxvY2tzKGJsb2NrcywgdG9rZW5zKSB7XG4gICAgcmV0dXJuIHV0aWxzLm1hcCh0b2tlbnMsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgdmFyIGFyZ3MgPSB0b2tlbi5hcmdzID8gdG9rZW4uYXJncy5qb2luKCcnKSA6ICcnO1xuICAgICAgaWYgKHRva2VuLm5hbWUgPT09ICdibG9jaycgJiYgYmxvY2tzW2FyZ3NdKSB7XG4gICAgICAgIHRva2VuID0gYmxvY2tzW2FyZ3NdO1xuICAgICAgfVxuICAgICAgaWYgKHRva2VuLmNvbnRlbnQgJiYgdG9rZW4uY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgdG9rZW4uY29udGVudCA9IHJlbWFwQmxvY2tzKGJsb2NrcywgdG9rZW4uY29udGVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IGJsb2NrLWxldmVsIHRhZ3MgdG8gdGhlIHRva2VuIGxpc3QgdGhhdCBhcmUgbm90IGFjdHVhbCBibG9jayB0YWdzLlxuICAgKiBAcGFyYW0gIHthcnJheX0gYmxvY2tzIExpc3Qgb2YgYmxvY2stbGV2ZWwgdGFncy5cbiAgICogQHBhcmFtICB7YXJyYXl9IHRva2VucyBMaXN0IG9mIHRva2VucyB0byByZW5kZXIuXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGltcG9ydE5vbkJsb2NrcyhibG9ja3MsIHRva2Vucykge1xuICAgIHZhciB0ZW1wID0gW107XG4gICAgdXRpbHMuZWFjaChibG9ja3MsIGZ1bmN0aW9uIChibG9jaykgeyB0ZW1wLnB1c2goYmxvY2spOyB9KTtcbiAgICB1dGlscy5lYWNoKHRlbXAucmV2ZXJzZSgpLCBmdW5jdGlvbiAoYmxvY2spIHtcbiAgICAgIGlmIChibG9jay5uYW1lICE9PSAnYmxvY2snKSB7XG4gICAgICAgIHRva2Vucy51bnNoaWZ0KGJsb2NrKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBjb21waWxlIGFuZCBnZXQgcGFyZW50cyBvZiBnaXZlbiBwYXJzZWQgdG9rZW4gb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IHRva2VucyAgICBQYXJzZWQgdG9rZW5zIGZyb20gdGVtcGxhdGUuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gICBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICAgICBQYXJzZWQgdG9rZW5zIGZyb20gcGFyZW50IHRlbXBsYXRlcy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldFBhcmVudHModG9rZW5zLCBvcHRpb25zKSB7XG4gICAgdmFyIHBhcmVudE5hbWUgPSB0b2tlbnMucGFyZW50LFxuICAgICAgcGFyZW50RmlsZXMgPSBbXSxcbiAgICAgIHBhcmVudHMgPSBbXSxcbiAgICAgIHBhcmVudEZpbGUsXG4gICAgICBwYXJlbnQsXG4gICAgICBsO1xuXG4gICAgd2hpbGUgKHBhcmVudE5hbWUpIHtcbiAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5maWxlbmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBleHRlbmQgXCInICsgcGFyZW50TmFtZSArICdcIiBiZWNhdXNlIGN1cnJlbnQgdGVtcGxhdGUgaGFzIG5vIGZpbGVuYW1lLicpO1xuICAgICAgfVxuXG4gICAgICBwYXJlbnRGaWxlID0gcGFyZW50RmlsZSB8fCBvcHRpb25zLmZpbGVuYW1lO1xuICAgICAgcGFyZW50RmlsZSA9IHNlbGYub3B0aW9ucy5sb2FkZXIucmVzb2x2ZShwYXJlbnROYW1lLCBwYXJlbnRGaWxlKTtcbiAgICAgIHBhcmVudCA9IGNhY2hlR2V0KHBhcmVudEZpbGUsIG9wdGlvbnMpIHx8IHNlbGYucGFyc2VGaWxlKHBhcmVudEZpbGUsIHV0aWxzLmV4dGVuZCh7fSwgb3B0aW9ucywgeyBmaWxlbmFtZTogcGFyZW50RmlsZSB9KSk7XG4gICAgICBwYXJlbnROYW1lID0gcGFyZW50LnBhcmVudDtcblxuICAgICAgaWYgKHBhcmVudEZpbGVzLmluZGV4T2YocGFyZW50RmlsZSkgIT09IC0xKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBjaXJjdWxhciBleHRlbmRzIG9mIFwiJyArIHBhcmVudEZpbGUgKyAnXCIuJyk7XG4gICAgICB9XG4gICAgICBwYXJlbnRGaWxlcy5wdXNoKHBhcmVudEZpbGUpO1xuXG4gICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBSZW1hcCBlYWNoIHBhcmVudHMnKDEpIGJsb2NrcyBvbnRvIGl0cyBvd24gcGFyZW50KDIpLCByZWNlaXZpbmcgdGhlIGZ1bGwgdG9rZW4gbGlzdCBmb3IgcmVuZGVyaW5nIHRoZSBvcmlnaW5hbCBwYXJlbnQoMSkgb24gaXRzIG93bi5cbiAgICBsID0gcGFyZW50cy5sZW5ndGg7XG4gICAgZm9yIChsID0gcGFyZW50cy5sZW5ndGggLSAyOyBsID49IDA7IGwgLT0gMSkge1xuICAgICAgcGFyZW50c1tsXS50b2tlbnMgPSByZW1hcEJsb2NrcyhwYXJlbnRzW2xdLmJsb2NrcywgcGFyZW50c1tsICsgMV0udG9rZW5zKTtcbiAgICAgIGltcG9ydE5vbkJsb2NrcyhwYXJlbnRzW2xdLmJsb2NrcywgcGFyZW50c1tsXS50b2tlbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJlbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZS1jb21waWxlIGEgc291cmNlIHN0cmluZyBpbnRvIGEgY2FjaGUtYWJsZSB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogc3dpZy5wcmVjb21waWxlKCd7eyB0YWNvcyB9fScpO1xuICAgKiAvLyA9PiB7XG4gICAqIC8vICAgICAgdHBsOiBmdW5jdGlvbiAoX3N3aWcsIF9sb2NhbHMsIF9maWx0ZXJzLCBfdXRpbHMsIF9mbikgeyAuLi4gfSxcbiAgICogLy8gICAgICB0b2tlbnM6IHtcbiAgICogLy8gICAgICAgIG5hbWU6IHVuZGVmaW5lZCxcbiAgICogLy8gICAgICAgIHBhcmVudDogbnVsbCxcbiAgICogLy8gICAgICAgIHRva2VuczogWy4uLl0sXG4gICAqIC8vICAgICAgICBibG9ja3M6IHt9XG4gICAqIC8vICAgICAgfVxuICAgKiAvLyAgICB9XG4gICAqXG4gICAqIEluIG9yZGVyIHRvIHJlbmRlciBhIHByZS1jb21waWxlZCB0ZW1wbGF0ZSwgeW91IG11c3QgaGF2ZSBhY2Nlc3MgdG8gZmlsdGVycyBhbmQgdXRpbHMgZnJvbSBTd2lnLiA8dmFyPmVmbjwvdmFyPiBpcyBzaW1wbHkgYW4gZW1wdHkgZnVuY3Rpb24gdGhhdCBkb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlICBTd2lnIHRlbXBsYXRlIHNvdXJjZSBzdHJpbmcuXG4gICAqIEBwYXJhbSAge1N3aWdPcHRzfSBbb3B0aW9ucz17fV0gU3dpZyBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgIFJlbmRlcmFibGUgZnVuY3Rpb24gYW5kIHRva2VucyBvYmplY3QuXG4gICAqL1xuICB0aGlzLnByZWNvbXBpbGUgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIHRva2VucyA9IHNlbGYucGFyc2Uoc291cmNlLCBvcHRpb25zKSxcbiAgICAgIHBhcmVudHMgPSBnZXRQYXJlbnRzKHRva2Vucywgb3B0aW9ucyksXG4gICAgICB0cGwsXG4gICAgICBlcnI7XG5cbiAgICBpZiAocGFyZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIFJlbWFwIHRoZSB0ZW1wbGF0ZXMgZmlyc3QtcGFyZW50J3MgdG9rZW5zIHVzaW5nIHRoaXMgdGVtcGxhdGUncyBibG9ja3MuXG4gICAgICB0b2tlbnMudG9rZW5zID0gcmVtYXBCbG9ja3ModG9rZW5zLmJsb2NrcywgcGFyZW50c1swXS50b2tlbnMpO1xuICAgICAgaW1wb3J0Tm9uQmxvY2tzKHRva2Vucy5ibG9ja3MsIHRva2Vucy50b2tlbnMpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0cGwgPSBuZXcgRnVuY3Rpb24oJ19zd2lnJywgJ19jdHgnLCAnX2ZpbHRlcnMnLCAnX3V0aWxzJywgJ19mbicsXG4gICAgICAgICcgIHZhciBfZXh0ID0gX3N3aWcuZXh0ZW5zaW9ucyxcXG4nICtcbiAgICAgICAgJyAgICBfb3V0cHV0ID0gXCJcIjtcXG4nICtcbiAgICAgICAgcGFyc2VyLmNvbXBpbGUodG9rZW5zLCBwYXJlbnRzLCBvcHRpb25zKSArICdcXG4nICtcbiAgICAgICAgJyAgcmV0dXJuIF9vdXRwdXQ7XFxuJ1xuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHV0aWxzLnRocm93RXJyb3IoZSwgbnVsbCwgb3B0aW9ucy5maWxlbmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHBsOiB0cGwsIHRva2VuczogdG9rZW5zIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgYW5kIHJlbmRlciBhIHRlbXBsYXRlIHN0cmluZyBmb3IgZmluYWwgb3V0cHV0LlxuICAgKlxuICAgKiBXaGVuIHJlbmRlcmluZyBhIHNvdXJjZSBzdHJpbmcsIGEgZmlsZSBwYXRoIHNob3VsZCBiZSBzcGVjaWZpZWQgaW4gdGhlIG9wdGlvbnMgb2JqZWN0IGluIG9yZGVyIGZvciA8dmFyPmV4dGVuZHM8L3Zhcj4sIDx2YXI+aW5jbHVkZTwvdmFyPiwgYW5kIDx2YXI+aW1wb3J0PC92YXI+IHRvIHdvcmsgcHJvcGVybHkuIERvIHRoaXMgYnkgYWRkaW5nIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJqc1wiPnsgZmlsZW5hbWU6ICcvYWJzb2x1dGUvcGF0aC90by9teXRwbC5odG1sJyB9PC9jb2RlPiB0byB0aGUgb3B0aW9ucyBhcmd1bWVudC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogc3dpZy5yZW5kZXIoJ3t7IHRhY29zIH19JywgeyBsb2NhbHM6IHsgdGFjb3M6ICdUYWNvcyEhISEnIH19KTtcbiAgICogLy8gPT4gVGFjb3MhISEhXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlICAgIFN3aWcgdGVtcGxhdGUgc291cmNlIHN0cmluZy5cbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICBSZW5kZXJlZCBvdXRwdXQuXG4gICAqL1xuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uIChzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gc2VsZi5jb21waWxlKHNvdXJjZSwgb3B0aW9ucykoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ29tcGlsZSBhbmQgcmVuZGVyIGEgdGVtcGxhdGUgZmlsZSBmb3IgZmluYWwgb3V0cHV0LiBUaGlzIGlzIG1vc3QgdXNlZnVsIGZvciBsaWJyYXJpZXMgbGlrZSBFeHByZXNzLmpzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBzd2lnLnJlbmRlckZpbGUoJy4vdGVtcGxhdGUuaHRtbCcsIHt9LCBmdW5jdGlvbiAoZXJyLCBvdXRwdXQpIHtcbiAgICogICBpZiAoZXJyKSB7XG4gICAqICAgICB0aHJvdyBlcnI7XG4gICAqICAgfVxuICAgKiAgIGNvbnNvbGUubG9nKG91dHB1dCk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBzd2lnLnJlbmRlckZpbGUoJy4vdGVtcGxhdGUuaHRtbCcsIHt9KTtcbiAgICogLy8gPT4gb3V0cHV0XG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICBwYXRoTmFtZSAgICBGaWxlIGxvY2F0aW9uLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9ICAgW2xvY2Fscz17fV0gVGVtcGxhdGUgdmFyaWFibGUgY29udGV4dC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IFtjYl0gQXN5bmNyb25vdXMgY2FsbGJhY2sgZnVuY3Rpb24uIElmIG5vdCBwcm92aWRlZCwgPHZhcj5jb21waWxlRmlsZTwvdmFyPiB3aWxsIHJ1biBzeW5jcm9ub3VzbHkuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgUmVuZGVyZWQgb3V0cHV0LlxuICAgKi9cbiAgdGhpcy5yZW5kZXJGaWxlID0gZnVuY3Rpb24gKHBhdGhOYW1lLCBsb2NhbHMsIGNiKSB7XG4gICAgaWYgKGNiKSB7XG4gICAgICBzZWxmLmNvbXBpbGVGaWxlKHBhdGhOYW1lLCB7fSwgZnVuY3Rpb24gKGVyciwgZm4pIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3VsdCA9IGZuKGxvY2Fscyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbiAgICAgICAgICBjYihlcnIyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYihudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGYuY29tcGlsZUZpbGUocGF0aE5hbWUpKGxvY2Fscyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgc3RyaW5nIHNvdXJjZSBpbnRvIGEgcmVuZGVyYWJsZSB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIHRwbCA9IHN3aWcuY29tcGlsZSgne3sgdGFjb3MgfX0nKTtcbiAgICogLy8gPT4ge1xuICAgKiAvLyAgICAgIFtGdW5jdGlvbjogY29tcGlsZWRdXG4gICAqIC8vICAgICAgcGFyZW50OiBudWxsLFxuICAgKiAvLyAgICAgIHRva2VuczogW3sgY29tcGlsZTogW0Z1bmN0aW9uXSB9XSxcbiAgICogLy8gICAgICBibG9ja3M6IHt9XG4gICAqIC8vICAgIH1cbiAgICogdHBsKHsgdGFjb3M6ICdUYWNvcyEhISEnIH0pO1xuICAgKiAvLyA9PiBUYWNvcyEhISFcbiAgICpcbiAgICogV2hlbiBjb21waWxpbmcgYSBzb3VyY2Ugc3RyaW5nLCBhIGZpbGUgcGF0aCBzaG91bGQgYmUgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zIG9iamVjdCBpbiBvcmRlciBmb3IgPHZhcj5leHRlbmRzPC92YXI+LCA8dmFyPmluY2x1ZGU8L3Zhcj4sIGFuZCA8dmFyPmltcG9ydDwvdmFyPiB0byB3b3JrIHByb3Blcmx5LiBEbyB0aGlzIGJ5IGFkZGluZyA8Y29kZSBkYXRhLWxhbmd1YWdlPVwianNcIj57IGZpbGVuYW1lOiAnL2Fic29sdXRlL3BhdGgvdG8vbXl0cGwuaHRtbCcgfTwvY29kZT4gdG8gdGhlIG9wdGlvbnMgYXJndW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlICAgIFN3aWcgdGVtcGxhdGUgc291cmNlIHN0cmluZy5cbiAgICogQHBhcmFtICB7U3dpZ09wdHN9IFtvcHRpb25zPXt9XSBTd2lnIG9wdGlvbnMgb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gICAgICAgICBSZW5kZXJhYmxlIGZ1bmN0aW9uIHdpdGgga2V5cyBmb3IgcGFyZW50LCBibG9ja3MsIGFuZCB0b2tlbnMuXG4gICAqL1xuICB0aGlzLmNvbXBpbGUgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIGtleSA9IG9wdGlvbnMgPyBvcHRpb25zLmZpbGVuYW1lIDogbnVsbCxcbiAgICAgIGNhY2hlZCA9IGtleSA/IGNhY2hlR2V0KGtleSwgb3B0aW9ucykgOiBudWxsLFxuICAgICAgY29udGV4dCxcbiAgICAgIGNvbnRleHRMZW5ndGgsXG4gICAgICBwcmU7XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cblxuICAgIGNvbnRleHQgPSBnZXRMb2NhbHMob3B0aW9ucyk7XG4gICAgY29udGV4dExlbmd0aCA9IHV0aWxzLmtleXMoY29udGV4dCkubGVuZ3RoO1xuICAgIHByZSA9IHRoaXMucHJlY29tcGlsZShzb3VyY2UsIG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gY29tcGlsZWQobG9jYWxzKSB7XG4gICAgICB2YXIgbGNscztcbiAgICAgIGlmIChsb2NhbHMgJiYgY29udGV4dExlbmd0aCkge1xuICAgICAgICBsY2xzID0gdXRpbHMuZXh0ZW5kKHt9LCBjb250ZXh0LCBsb2NhbHMpO1xuICAgICAgfSBlbHNlIGlmIChsb2NhbHMgJiYgIWNvbnRleHRMZW5ndGgpIHtcbiAgICAgICAgbGNscyA9IGxvY2FscztcbiAgICAgIH0gZWxzZSBpZiAoIWxvY2FscyAmJiBjb250ZXh0TGVuZ3RoKSB7XG4gICAgICAgIGxjbHMgPSBjb250ZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGNscyA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZS50cGwoc2VsZiwgbGNscywgZmlsdGVycywgdXRpbHMsIGVmbik7XG4gICAgfVxuXG4gICAgdXRpbHMuZXh0ZW5kKGNvbXBpbGVkLCBwcmUudG9rZW5zKTtcblxuICAgIGlmIChrZXkpIHtcbiAgICAgIGNhY2hlU2V0KGtleSwgb3B0aW9ucywgY29tcGlsZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBjb21waWxlZDtcbiAgfTtcblxuICAvKipcbiAgICogQ29tcGlsZSBhIHNvdXJjZSBmaWxlIGludG8gYSByZW5kZXJhYmxlIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiB2YXIgdHBsID0gc3dpZy5jb21waWxlRmlsZSgnLi9teXRwbC5odG1sJyk7XG4gICAqIC8vID0+IHtcbiAgICogLy8gICAgICBbRnVuY3Rpb246IGNvbXBpbGVkXVxuICAgKiAvLyAgICAgIHBhcmVudDogbnVsbCxcbiAgICogLy8gICAgICB0b2tlbnM6IFt7IGNvbXBpbGU6IFtGdW5jdGlvbl0gfV0sXG4gICAqIC8vICAgICAgYmxvY2tzOiB7fVxuICAgKiAvLyAgICB9XG4gICAqIHRwbCh7IHRhY29zOiAnVGFjb3MhISEhJyB9KTtcbiAgICogLy8gPT4gVGFjb3MhISEhXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHN3aWcuY29tcGlsZUZpbGUoJy9teWZpbGUudHh0JywgeyB2YXJDb250cm9sczogWyc8JT0nLCAnPSU+J10sIHRhZ0NvbnRyb2xzOiBbJzwlJywgJyU+J119KTtcbiAgICogLy8gPT4gd2lsbCBjb21waWxlICdteWZpbGUudHh0JyB1c2luZyB0aGUgdmFyIGFuZCB0YWcgY29udHJvbHMgYXMgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGhuYW1lICBGaWxlIGxvY2F0aW9uLlxuICAgKiBAcGFyYW0gIHtTd2lnT3B0c30gW29wdGlvbnM9e31dIFN3aWcgb3B0aW9ucyBvYmplY3QuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBbY2JdIEFzeW5jcm9ub3VzIGNhbGxiYWNrIGZ1bmN0aW9uLiBJZiBub3QgcHJvdmlkZWQsIDx2YXI+Y29tcGlsZUZpbGU8L3Zhcj4gd2lsbCBydW4gc3luY3Jvbm91c2x5LlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gICAgICAgICBSZW5kZXJhYmxlIGZ1bmN0aW9uIHdpdGgga2V5cyBmb3IgcGFyZW50LCBibG9ja3MsIGFuZCB0b2tlbnMuXG4gICAqL1xuICB0aGlzLmNvbXBpbGVGaWxlID0gZnVuY3Rpb24gKHBhdGhuYW1lLCBvcHRpb25zLCBjYikge1xuICAgIHZhciBzcmMsIGNhY2hlZDtcblxuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIHBhdGhuYW1lID0gc2VsZi5vcHRpb25zLmxvYWRlci5yZXNvbHZlKHBhdGhuYW1lLCBvcHRpb25zLnJlc29sdmVGcm9tKTtcbiAgICBpZiAoIW9wdGlvbnMuZmlsZW5hbWUpIHtcbiAgICAgIG9wdGlvbnMgPSB1dGlscy5leHRlbmQoeyBmaWxlbmFtZTogcGF0aG5hbWUgfSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIGNhY2hlZCA9IGNhY2hlR2V0KHBhdGhuYW1lLCBvcHRpb25zKTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIGlmIChjYikge1xuICAgICAgICBjYihudWxsLCBjYWNoZWQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cblxuICAgIGlmIChjYikge1xuICAgICAgc2VsZi5vcHRpb25zLmxvYWRlci5sb2FkKHBhdGhuYW1lLCBmdW5jdGlvbiAoZXJyLCBzcmMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb21waWxlZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbXBpbGVkID0gc2VsZi5jb21waWxlKHNyYywgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbiAgICAgICAgICBjYihlcnIyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYihlcnIsIGNvbXBpbGVkKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNyYyA9IHNlbGYub3B0aW9ucy5sb2FkZXIubG9hZChwYXRobmFtZSk7XG4gICAgcmV0dXJuIHNlbGYuY29tcGlsZShzcmMsIG9wdGlvbnMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSdW4gYSBwcmUtY29tcGlsZWQgdGVtcGxhdGUgZnVuY3Rpb24uIFRoaXMgaXMgbW9zdCB1c2VmdWwgaW4gdGhlIGJyb3dzZXIgd2hlbiB5b3UndmUgcHJlLWNvbXBpbGVkIHlvdXIgdGVtcGxhdGVzIHdpdGggdGhlIFN3aWcgY29tbWFuZC1saW5lIHRvb2wuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICQgc3dpZyBjb21waWxlIC4vbXl0cGwuaHRtbCAtLXdyYXAtc3RhcnQ9XCJ2YXIgbXl0cGwgPSBcIiA+IG15dHBsLmpzXG4gICAqIEBleGFtcGxlXG4gICAqIDxzY3JpcHQgc3JjPVwibXl0cGwuanNcIj48L3NjcmlwdD5cbiAgICogPHNjcmlwdD5cbiAgICogICBzd2lnLnJ1bihteXRwbCwge30pO1xuICAgKiAgIC8vID0+IFwicmVuZGVyZWQgdGVtcGxhdGUuLi5cIlxuICAgKiA8L3NjcmlwdD5cbiAgICpcbiAgICogQHBhcmFtICB7ZnVuY3Rpb259IHRwbCAgICAgICBQcmUtY29tcGlsZWQgU3dpZyB0ZW1wbGF0ZSBmdW5jdGlvbi4gVXNlIHRoZSBTd2lnIENMSSB0byBjb21waWxlIHlvdXIgdGVtcGxhdGVzLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IFtsb2NhbHM9e31dIFRlbXBsYXRlIHZhcmlhYmxlIGNvbnRleHQuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gW2ZpbGVwYXRoXSAgRmlsZW5hbWUgdXNlZCBmb3IgY2FjaGluZyB0aGUgdGVtcGxhdGUuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgUmVuZGVyZWQgb3V0cHV0LlxuICAgKi9cbiAgdGhpcy5ydW4gPSBmdW5jdGlvbiAodHBsLCBsb2NhbHMsIGZpbGVwYXRoKSB7XG4gICAgdmFyIGNvbnRleHQgPSBnZXRMb2NhbHMoeyBsb2NhbHM6IGxvY2FscyB9KTtcbiAgICBpZiAoZmlsZXBhdGgpIHtcbiAgICAgIGNhY2hlU2V0KGZpbGVwYXRoLCB7fSwgdHBsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRwbChzZWxmLCBjb250ZXh0LCBmaWx0ZXJzLCB1dGlscywgZWZuKTtcbiAgfTtcbn07XG5cbi8qIVxuICogRXhwb3J0IG1ldGhvZHMgcHVibGljbHlcbiAqL1xuZGVmYXVsdEluc3RhbmNlID0gbmV3IGV4cG9ydHMuU3dpZygpO1xuZXhwb3J0cy5zZXRGaWx0ZXIgPSBkZWZhdWx0SW5zdGFuY2Uuc2V0RmlsdGVyO1xuZXhwb3J0cy5zZXRUYWcgPSBkZWZhdWx0SW5zdGFuY2Uuc2V0VGFnO1xuZXhwb3J0cy5zZXRFeHRlbnNpb24gPSBkZWZhdWx0SW5zdGFuY2Uuc2V0RXh0ZW5zaW9uO1xuZXhwb3J0cy5wYXJzZUZpbGUgPSBkZWZhdWx0SW5zdGFuY2UucGFyc2VGaWxlO1xuZXhwb3J0cy5wcmVjb21waWxlID0gZGVmYXVsdEluc3RhbmNlLnByZWNvbXBpbGU7XG5leHBvcnRzLmNvbXBpbGUgPSBkZWZhdWx0SW5zdGFuY2UuY29tcGlsZTtcbmV4cG9ydHMuY29tcGlsZUZpbGUgPSBkZWZhdWx0SW5zdGFuY2UuY29tcGlsZUZpbGU7XG5leHBvcnRzLnJlbmRlciA9IGRlZmF1bHRJbnN0YW5jZS5yZW5kZXI7XG5leHBvcnRzLnJlbmRlckZpbGUgPSBkZWZhdWx0SW5zdGFuY2UucmVuZGVyRmlsZTtcbmV4cG9ydHMucnVuID0gZGVmYXVsdEluc3RhbmNlLnJ1bjtcbmV4cG9ydHMuaW52YWxpZGF0ZUNhY2hlID0gZGVmYXVsdEluc3RhbmNlLmludmFsaWRhdGVDYWNoZTtcbmV4cG9ydHMubG9hZGVycyA9IGxvYWRlcnM7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpLFxuICBzdHJpbmdzID0gWydodG1sJywgJ2pzJ107XG5cbi8qKlxuICogQ29udHJvbCBhdXRvLWVzY2FwaW5nIG9mIHZhcmlhYmxlIG91dHB1dCBmcm9tIHdpdGhpbiB5b3VyIHRlbXBsYXRlcy5cbiAqXG4gKiBAYWxpYXMgYXV0b2VzY2FwZVxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBteXZhciA9ICc8Zm9vPic7XG4gKiB7JSBhdXRvZXNjYXBlIHRydWUgJX17eyBteXZhciB9fXslIGVuZGF1dG9lc2NhcGUgJX1cbiAqIC8vID0+ICZsdDtmb28mZ3Q7XG4gKiB7JSBhdXRvZXNjYXBlIGZhbHNlICV9e3sgbXl2YXIgfX17JSBlbmRhdXRvZXNjYXBlICV9XG4gKiAvLyA9PiA8Zm9vPlxuICpcbiAqIEBwYXJhbSB7Ym9vbGVhbnxzdHJpbmd9IGNvbnRyb2wgT25lIG9mIGB0cnVlYCwgYGZhbHNlYCwgYFwianNcImAgb3IgYFwiaHRtbFwiYC5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgcmV0dXJuIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSk7XG59O1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrLCBvcHRzKSB7XG4gIHZhciBtYXRjaGVkO1xuICBwYXJzZXIub24oJyonLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIW1hdGNoZWQgJiZcbiAgICAgICAgKHRva2VuLnR5cGUgPT09IHR5cGVzLkJPT0wgfHxcbiAgICAgICAgICAodG9rZW4udHlwZSA9PT0gdHlwZXMuU1RSSU5HICYmIHN0cmluZ3MuaW5kZXhPZih0b2tlbi5tYXRjaCkgPT09IC0xKSlcbiAgICAgICAgKSB7XG4gICAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB1dGlscy50aHJvd0Vycm9yKCdVbmV4cGVjdGVkIHRva2VuIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIGluIGF1dG9lc2NhcGUgdGFnJywgbGluZSwgb3B0cy5maWxlbmFtZSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbmV4cG9ydHMuZW5kcyA9IHRydWU7XG4iLCIvKipcbiAqIERlZmluZXMgYSBibG9jayBpbiBhIHRlbXBsYXRlIHRoYXQgY2FuIGJlIG92ZXJyaWRkZW4gYnkgYSB0ZW1wbGF0ZSBleHRlbmRpbmcgdGhpcyBvbmUgYW5kL29yIHdpbGwgb3ZlcnJpZGUgdGhlIGN1cnJlbnQgdGVtcGxhdGUncyBwYXJlbnQgdGVtcGxhdGUgYmxvY2sgb2YgdGhlIHNhbWUgbmFtZS5cbiAqXG4gKiBTZWUgPGEgaHJlZj1cIiNpbmhlcml0YW5jZVwiPlRlbXBsYXRlIEluaGVyaXRhbmNlPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAYWxpYXMgYmxvY2tcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgYmxvY2sgYm9keSAlfS4uLnslIGVuZGJsb2NrICV9XG4gKlxuICogQHBhcmFtIHtsaXRlcmFsfSAgbmFtZSAgIE5hbWUgb2YgdGhlIGJsb2NrIGZvciB1c2UgaW4gcGFyZW50IGFuZCBleHRlbmRlZCB0ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucykge1xuICByZXR1cm4gY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYXJncy5qb2luKCcnKSk7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyKSB7XG4gIHBhcnNlci5vbignKicsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICB9KTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuZXhwb3J0cy5ibG9jayA9IHRydWU7XG4iLCIvKipcbiAqIFVzZWQgd2l0aGluIGFuIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+eyUgaWYgJX08L2NvZGU+IHRhZywgdGhlIGNvZGUgYmxvY2sgZm9sbG93aW5nIHRoaXMgdGFnIHVwIHVudGlsIDxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+eyUgZW5kaWYgJX08L2NvZGU+IHdpbGwgYmUgcmVuZGVyZWQgaWYgdGhlIDxpPmlmPC9pPiBzdGF0ZW1lbnQgcmV0dXJucyBmYWxzZS5cbiAqXG4gKiBAYWxpYXMgZWxzZVxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiBmYWxzZSAlfVxuICogICBzdGF0ZW1lbnQxXG4gKiB7JSBlbHNlICV9XG4gKiAgIHN0YXRlbWVudDJcbiAqIHslIGVuZGlmICV9XG4gKiAvLyA9PiBzdGF0ZW1lbnQyXG4gKlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAnfSBlbHNlIHtcXG4nO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrKSB7XG4gIHBhcnNlci5vbignKicsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHRocm93IG5ldyBFcnJvcignXCJlbHNlXCIgdGFnIGRvZXMgbm90IGFjY2VwdCBhbnkgdG9rZW5zLiBGb3VuZCBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG5cbiAgcmV0dXJuIChzdGFjay5sZW5ndGggJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ubmFtZSA9PT0gJ2lmJyk7XG59O1xuIiwidmFyIGlmcGFyc2VyID0gcmVxdWlyZSgnLi9pZicpLnBhcnNlO1xuXG4vKipcbiAqIExpa2UgPGNvZGUgZGF0YS1sYW5ndWFnZT1cInN3aWdcIj57JSBlbHNlICV9PC9jb2RlPiwgZXhjZXB0IHRoaXMgdGFnIGNhbiB0YWtlIG1vcmUgY29uZGl0aW9uYWwgc3RhdGVtZW50cy5cbiAqXG4gKiBAYWxpYXMgZWxzZWlmXG4gKiBAYWxpYXMgZWxpZlxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiBmYWxzZSAlfVxuICogICBUYWNvc1xuICogeyUgZWxzZWlmIHRydWUgJX1cbiAqICAgQnVycml0b3NcbiAqIHslIGVsc2UgJX1cbiAqICAgQ2h1cnJvc1xuICogeyUgZW5kaWYgJX1cbiAqIC8vID0+IEJ1cnJpdG9zXG4gKlxuICogQHBhcmFtIHsuLi5taXhlZH0gY29uZGl0aW9uYWwgIENvbmRpdGlvbmFsIHN0YXRlbWVudCB0aGF0IHJldHVybnMgYSB0cnV0aHkgb3IgZmFsc3kgdmFsdWUuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncykge1xuICByZXR1cm4gJ30gZWxzZSBpZiAoJyArIGFyZ3Muam9pbignICcpICsgJykge1xcbic7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcywgc3RhY2spIHtcbiAgdmFyIG9rYXkgPSBpZnBhcnNlcihzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrKTtcbiAgcmV0dXJuIG9rYXkgJiYgKHN0YWNrLmxlbmd0aCAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5uYW1lID09PSAnaWYnKTtcbn07XG4iLCIvKipcbiAqIE1ha2VzIHRoZSBjdXJyZW50IHRlbXBsYXRlIGV4dGVuZCBhIHBhcmVudCB0ZW1wbGF0ZS4gVGhpcyB0YWcgbXVzdCBiZSB0aGUgZmlyc3QgaXRlbSBpbiB5b3VyIHRlbXBsYXRlLlxuICpcbiAqIFNlZSA8YSBocmVmPVwiI2luaGVyaXRhbmNlXCI+VGVtcGxhdGUgSW5oZXJpdGFuY2U8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqIEBhbGlhcyBleHRlbmRzXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGV4dGVuZHMgXCIuL2xheW91dC5odG1sXCIgJX1cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGFyZW50RmlsZSAgUmVsYXRpdmUgcGF0aCB0byB0aGUgZmlsZSB0aGF0IHRoaXMgdGVtcGxhdGUgZXh0ZW5kcy5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKCkge307XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lbmRzID0gZmFsc2U7XG4iLCJ2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4uL2ZpbHRlcnMnKTtcblxuLyoqXG4gKiBBcHBseSBhIGZpbHRlciB0byBhbiBlbnRpcmUgYmxvY2sgb2YgdGVtcGxhdGUuXG4gKlxuICogQGFsaWFzIGZpbHRlclxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBmaWx0ZXIgdXBwZXJjYXNlICV9b2ggaGksIHt7IG5hbWUgfX17JSBlbmRmaWx0ZXIgJX1cbiAqIC8vID0+IE9IIEhJLCBQQVVMXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGZpbHRlciByZXBsYWNlKFwiLlwiLCBcIiFcIiwgXCJnXCIpICV9SGkuIE15IG5hbWUgaXMgUGF1bC57JSBlbmRmaWx0ZXIgJX1cbiAqIC8vID0+IEhpISBNeSBuYW1lIGlzIFBhdWwhXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZmlsdGVyICBUaGUgZmlsdGVyIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGNvbnRlbnRzIG9mIHRoZSB0YWcuXG4gKi9cblxuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgdmFyIGZpbHRlciA9IGFyZ3Muc2hpZnQoKS5yZXBsYWNlKC9cXCgkLywgJycpLFxuICAgIHZhbCA9ICcoZnVuY3Rpb24gKCkge1xcbicgK1xuICAgICAgJyAgdmFyIF9vdXRwdXQgPSBcIlwiO1xcbicgK1xuICAgICAgY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSArXG4gICAgICAnICByZXR1cm4gX291dHB1dDtcXG4nICtcbiAgICAgICd9KSgpJztcblxuICBpZiAoYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnKScpIHtcbiAgICBhcmdzLnBvcCgpO1xuICB9XG5cbiAgYXJncyA9IChhcmdzLmxlbmd0aCkgPyAnLCAnICsgYXJncy5qb2luKCcnKSA6ICcnO1xuICByZXR1cm4gJ19vdXRwdXQgKz0gX2ZpbHRlcnNbXCInICsgZmlsdGVyICsgJ1wiXSgnICsgdmFsICsgYXJncyArICcpO1xcbic7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcykge1xuICB2YXIgZmlsdGVyO1xuXG4gIGZ1bmN0aW9uIGNoZWNrKGZpbHRlcikge1xuICAgIGlmICghZmlsdGVycy5oYXNPd25Qcm9wZXJ0eShmaWx0ZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpbHRlciBcIicgKyBmaWx0ZXIgKyAnXCIgZG9lcyBub3QgZXhpc3Qgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkZVTkNUSU9OLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIWZpbHRlcikge1xuICAgICAgZmlsdGVyID0gdG9rZW4ubWF0Y2gucmVwbGFjZSgvXFwoJC8sICcnKTtcbiAgICAgIGNoZWNrKGZpbHRlcik7XG4gICAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICAgIHRoaXMuc3RhdGUucHVzaCh0b2tlbi50eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5WQVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghZmlsdGVyKSB7XG4gICAgICBmaWx0ZXIgPSB0b2tlbi5tYXRjaDtcbiAgICAgIGNoZWNrKGZpbHRlcik7XG4gICAgICB0aGlzLm91dC5wdXNoKGZpbHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuZW5kcyA9IHRydWU7XG4iLCJ2YXIgY3R4ID0gJ19jdHguJyxcbiAgY3R4bG9vcCA9IGN0eCArICdsb29wJztcblxuLyoqXG4gKiBMb29wIG92ZXIgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICpcbiAqIEBhbGlhcyBmb3JcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gb2JqID0geyBvbmU6ICdoaScsIHR3bzogJ2J5ZScgfTtcbiAqIHslIGZvciB4IGluIG9iaiAlfVxuICogICB7JSBpZiBsb29wLmZpcnN0ICV9PHVsPnslIGVuZGlmICV9XG4gKiAgIDxsaT57eyBsb29wLmluZGV4IH19IC0ge3sgbG9vcC5rZXkgfX06IHt7IHggfX08L2xpPlxuICogICB7JSBpZiBsb29wLmxhc3QgJX08L3VsPnslIGVuZGlmICV9XG4gKiB7JSBlbmRmb3IgJX1cbiAqIC8vID0+IDx1bD5cbiAqIC8vICAgIDxsaT4xIC0gb25lOiBoaTwvbGk+XG4gKiAvLyAgICA8bGk+MiAtIHR3bzogYnllPC9saT5cbiAqIC8vICAgIDwvdWw+XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGFyciA9IFsxLCAyLCAzXVxuICogLy8gUmV2ZXJzZSB0aGUgYXJyYXksIHNob3J0Y3V0IHRoZSBrZXkvaW5kZXggdG8gYGtleWBcbiAqIHslIGZvciBrZXksIHZhbCBpbiBhcnJ8cmV2ZXJzZSAlfVxuICoge3sga2V5IH19IC0tIHt7IHZhbCB9fVxuICogeyUgZW5kZm9yICV9XG4gKiAvLyA9PiAwIC0tIDNcbiAqIC8vICAgIDEgLS0gMlxuICogLy8gICAgMiAtLSAxXG4gKlxuICogQHBhcmFtIHtsaXRlcmFsfSBba2V5XSAgICAgQSBzaG9ydGN1dCB0byB0aGUgaW5kZXggb2YgdGhlIGFycmF5IG9yIGN1cnJlbnQga2V5IGFjY2Vzc29yLlxuICogQHBhcmFtIHtsaXRlcmFsfSB2YXJpYWJsZSAgVGhlIGN1cnJlbnQgdmFsdWUgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGlzIHZhcmlhYmxlIG5hbWUgdGVtcG9yYXJpbHkuIFRoZSB2YXJpYWJsZSB3aWxsIGJlIHJlc2V0IHVwb24gZW5kaW5nIHRoZSBmb3IgdGFnLlxuICogQHBhcmFtIHtsaXRlcmFsfSBpbiAgICAgICAgTGl0ZXJhbGx5LCBcImluXCIuIFRoaXMgdG9rZW4gaXMgcmVxdWlyZWQuXG4gKiBAcGFyYW0ge29iamVjdH0gIG9iamVjdCAgICBBbiBlbnVtZXJhYmxlIG9iamVjdCB0aGF0IHdpbGwgYmUgaXRlcmF0ZWQgb3Zlci5cbiAqXG4gKiBAcmV0dXJuIHtsb29wLmluZGV4fSBUaGUgY3VycmVudCBpdGVyYXRpb24gb2YgdGhlIGxvb3AgKDEtaW5kZXhlZClcbiAqIEByZXR1cm4ge2xvb3AuaW5kZXgwfSBUaGUgY3VycmVudCBpdGVyYXRpb24gb2YgdGhlIGxvb3AgKDAtaW5kZXhlZClcbiAqIEByZXR1cm4ge2xvb3AucmV2aW5kZXh9IFRoZSBudW1iZXIgb2YgaXRlcmF0aW9ucyBmcm9tIHRoZSBlbmQgb2YgdGhlIGxvb3AgKDEtaW5kZXhlZClcbiAqIEByZXR1cm4ge2xvb3AucmV2aW5kZXgwfSBUaGUgbnVtYmVyIG9mIGl0ZXJhdGlvbnMgZnJvbSB0aGUgZW5kIG9mIHRoZSBsb29wICgwLWluZGV4ZWQpXG4gKiBAcmV0dXJuIHtsb29wLmtleX0gSWYgdGhlIGl0ZXJhdG9yIGlzIGFuIG9iamVjdCwgdGhpcyB3aWxsIGJlIHRoZSBrZXkgb2YgdGhlIGN1cnJlbnQgaXRlbSwgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdGhlIHNhbWUgYXMgdGhlIGxvb3AuaW5kZXguXG4gKiBAcmV0dXJuIHtsb29wLmZpcnN0fSBUcnVlIGlmIHRoZSBjdXJyZW50IG9iamVjdCBpcyB0aGUgZmlyc3QgaW4gdGhlIG9iamVjdCBvciBhcnJheS5cbiAqIEByZXR1cm4ge2xvb3AubGFzdH0gVHJ1ZSBpZiB0aGUgY3VycmVudCBvYmplY3QgaXMgdGhlIGxhc3QgaW4gdGhlIG9iamVjdCBvciBhcnJheS5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgdmFyIHZhbCA9IGFyZ3Muc2hpZnQoKSxcbiAgICBrZXkgPSAnX19rJyxcbiAgICBjdHhsb29wY2FjaGUgPSAoY3R4ICsgJ19fbG9vcGNhY2hlJyArIE1hdGgucmFuZG9tKCkpLnJlcGxhY2UoL1xcLi9nLCAnJyksXG4gICAgbGFzdDtcblxuICBpZiAoYXJnc1swXSAmJiBhcmdzWzBdID09PSAnLCcpIHtcbiAgICBhcmdzLnNoaWZ0KCk7XG4gICAga2V5ID0gdmFsO1xuICAgIHZhbCA9IGFyZ3Muc2hpZnQoKTtcbiAgfVxuXG4gIGxhc3QgPSBhcmdzLmpvaW4oJycpO1xuXG4gIHJldHVybiBbXG4gICAgJyhmdW5jdGlvbiAoKSB7XFxuJyxcbiAgICAnICB2YXIgX19sID0gJyArIGxhc3QgKyAnLCBfX2xlbiA9IChfdXRpbHMuaXNBcnJheShfX2wpIHx8IHR5cGVvZiBfX2wgPT09IFwic3RyaW5nXCIpID8gX19sLmxlbmd0aCA6IF91dGlscy5rZXlzKF9fbCkubGVuZ3RoO1xcbicsXG4gICAgJyAgaWYgKCFfX2wpIHsgcmV0dXJuOyB9XFxuJyxcbiAgICAnICAgIHZhciAnICsgY3R4bG9vcGNhY2hlICsgJyA9IHsgbG9vcDogJyArIGN0eGxvb3AgKyAnLCAnICsgdmFsICsgJzogJyArIGN0eCArIHZhbCArICcsICcgKyBrZXkgKyAnOiAnICsgY3R4ICsga2V5ICsgJyB9O1xcbicsXG4gICAgJyAgICAnICsgY3R4bG9vcCArICcgPSB7IGZpcnN0OiBmYWxzZSwgaW5kZXg6IDEsIGluZGV4MDogMCwgcmV2aW5kZXg6IF9fbGVuLCByZXZpbmRleDA6IF9fbGVuIC0gMSwgbGVuZ3RoOiBfX2xlbiwgbGFzdDogZmFsc2UgfTtcXG4nLFxuICAgICcgIF91dGlscy5lYWNoKF9fbCwgZnVuY3Rpb24gKCcgKyB2YWwgKyAnLCAnICsga2V5ICsgJykge1xcbicsXG4gICAgJyAgICAnICsgY3R4ICsgdmFsICsgJyA9ICcgKyB2YWwgKyAnO1xcbicsXG4gICAgJyAgICAnICsgY3R4ICsga2V5ICsgJyA9ICcgKyBrZXkgKyAnO1xcbicsXG4gICAgJyAgICAnICsgY3R4bG9vcCArICcua2V5ID0gJyArIGtleSArICc7XFxuJyxcbiAgICAnICAgICcgKyBjdHhsb29wICsgJy5maXJzdCA9ICgnICsgY3R4bG9vcCArICcuaW5kZXgwID09PSAwKTtcXG4nLFxuICAgICcgICAgJyArIGN0eGxvb3AgKyAnLmxhc3QgPSAoJyArIGN0eGxvb3AgKyAnLnJldmluZGV4MCA9PT0gMCk7XFxuJyxcbiAgICAnICAgICcgKyBjb21waWxlcihjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpLFxuICAgICcgICAgJyArIGN0eGxvb3AgKyAnLmluZGV4ICs9IDE7ICcgKyBjdHhsb29wICsgJy5pbmRleDAgKz0gMTsgJyArIGN0eGxvb3AgKyAnLnJldmluZGV4IC09IDE7ICcgKyBjdHhsb29wICsgJy5yZXZpbmRleDAgLT0gMTtcXG4nLFxuICAgICcgIH0pO1xcbicsXG4gICAgJyAgJyArIGN0eGxvb3AgKyAnID0gJyArIGN0eGxvb3BjYWNoZSArICcubG9vcDtcXG4nLFxuICAgICcgICcgKyBjdHggKyB2YWwgKyAnID0gJyArIGN0eGxvb3BjYWNoZSArICcuJyArIHZhbCArICc7XFxuJyxcbiAgICAnICAnICsgY3R4ICsga2V5ICsgJyA9ICcgKyBjdHhsb29wY2FjaGUgKyAnLicgKyBrZXkgKyAnO1xcbicsXG4gICAgJyAgJyArIGN0eGxvb3BjYWNoZSArICcgPSB1bmRlZmluZWQ7XFxuJyxcbiAgICAnfSkoKTtcXG4nXG4gIF0uam9pbignJyk7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcykge1xuICB2YXIgZmlyc3RWYXIsIHJlYWR5O1xuXG4gIHBhcnNlci5vbih0eXBlcy5OVU1CRVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHZhciBsYXN0U3RhdGUgPSB0aGlzLnN0YXRlLmxlbmd0aCA/IHRoaXMuc3RhdGVbdGhpcy5zdGF0ZS5sZW5ndGggLSAxXSA6IG51bGw7XG4gICAgaWYgKCFyZWFkeSB8fFxuICAgICAgICAobGFzdFN0YXRlICE9PSB0eXBlcy5BUlJBWU9QRU4gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IHR5cGVzLkNVUkxZT1BFTiAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gdHlwZXMuQ1VSTFlDTE9TRSAmJlxuICAgICAgICAgIGxhc3RTdGF0ZSAhPT0gdHlwZXMuRlVOQ1RJT04gJiZcbiAgICAgICAgICBsYXN0U3RhdGUgIT09IHR5cGVzLkZJTFRFUilcbiAgICAgICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgbnVtYmVyIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlZBUiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHJlYWR5ICYmIGZpcnN0VmFyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3V0Lmxlbmd0aCkge1xuICAgICAgZmlyc3RWYXIgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQ09NTUEsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmIChmaXJzdFZhciAmJiB0aGlzLnByZXZUb2tlbi50eXBlID09PSB0eXBlcy5WQVIpIHtcbiAgICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQ09NUEFSQVRPUiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHRva2VuLm1hdGNoICE9PSAnaW4nIHx8ICFmaXJzdFZhcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHRva2VuIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgICByZWFkeSA9IHRydWU7XG4gICAgdGhpcy5maWx0ZXJBcHBseUlkeC5wdXNoKHRoaXMub3V0Lmxlbmd0aCk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lbmRzID0gdHJ1ZTtcbiIsIi8qKlxuICogVXNlZCB0byBjcmVhdGUgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBpbiB0ZW1wbGF0ZXMuIEFjY2VwdHMgbW9zdCBKYXZhU2NyaXB0IHZhbGlkIGNvbXBhcmlzb25zLlxuICpcbiAqIENhbiBiZSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggPGEgaHJlZj1cIiNlbHNlaWZcIj48Y29kZSBkYXRhLWxhbmd1YWdlPVwic3dpZ1wiPnslIGVsc2VpZiAuLi4gJX08L2NvZGU+PC9hPiBhbmQgPGEgaHJlZj1cIiNlbHNlXCI+PGNvZGUgZGF0YS1sYW5ndWFnZT1cInN3aWdcIj57JSBlbHNlICV9PC9jb2RlPjwvYT4gdGFncy5cbiAqXG4gKiBAYWxpYXMgaWZcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgeCAlfXslIGVuZGlmICV9XG4gKiB7JSBpZiAheCAlfXslIGVuZGlmICV9XG4gKiB7JSBpZiBub3QgeCAlfXslIGVuZGlmICV9XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGlmIHggYW5kIHkgJX17JSBlbmRpZiAlfVxuICogeyUgaWYgeCAmJiB5ICV9eyUgZW5kaWYgJX1cbiAqIHslIGlmIHggb3IgeSAlfXslIGVuZGlmICV9XG4gKiB7JSBpZiB4IHx8IHkgJX17JSBlbmRpZiAlfVxuICogeyUgaWYgeCB8fCAoeSAmJiB6KSAlfXslIGVuZGlmICV9XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGlmIHggW29wZXJhdG9yXSB5ICV9XG4gKiAgIE9wZXJhdG9yczogPT0sICE9LCA8LCA8PSwgPiwgPj0sID09PSwgIT09XG4gKiB7JSBlbmRpZiAlfVxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiB4ID09ICdmaXZlJyAlfVxuICogICBUaGUgb3BlcmFuZHMgY2FuIGJlIGFsc28gYmUgc3RyaW5nIG9yIG51bWJlciBsaXRlcmFsc1xuICogeyUgZW5kaWYgJX1cbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaWYgeHxsb3dlciA9PT0gJ3RhY29zJyAlfVxuICogICBZb3UgY2FuIHVzZSBmaWx0ZXJzIG9uIGFueSBvcGVyYW5kIGluIHRoZSBzdGF0ZW1lbnQuXG4gKiB7JSBlbmRpZiAlfVxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBpZiB4IGluIHkgJX1cbiAqICAgSWYgeCBpcyBhIHZhbHVlIHRoYXQgaXMgcHJlc2VudCBpbiB5LCB0aGlzIHdpbGwgcmV0dXJuIHRydWUuXG4gKiB7JSBlbmRpZiAlfVxuICpcbiAqIEBwYXJhbSB7Li4ubWl4ZWR9IGNvbmRpdGlvbmFsIENvbmRpdGlvbmFsIHN0YXRlbWVudCB0aGF0IHJldHVybnMgYSB0cnV0aHkgb3IgZmFsc3kgdmFsdWUuXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIHJldHVybiAnaWYgKCcgKyBhcmdzLmpvaW4oJyAnKSArICcpIHsgXFxuJyArXG4gICAgY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSArICdcXG4nICtcbiAgICAnfSc7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcykge1xuICBpZiAodHlwZW9mIHN0ciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gY29uZGl0aW9uYWwgc3RhdGVtZW50IHByb3ZpZGVkIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICB9XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkNPTVBBUkFUT1IsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICh0aGlzLmlzTGFzdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIGxvZ2ljIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcmV2VG9rZW4udHlwZSA9PT0gdHlwZXMuTk9UKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHRlZCBsb2dpYyBcIm5vdCAnICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuIFVzZSAhKGZvbyAnICsgdG9rZW4ubWF0Y2ggKyAnKSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICB0aGlzLm91dC5wdXNoKHRva2VuLm1hdGNoKTtcbiAgICB0aGlzLmZpbHRlckFwcGx5SWR4LnB1c2godGhpcy5vdXQubGVuZ3RoKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLk5PVCwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHRoaXMuaXNMYXN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgbG9naWMgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQk9PTCwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gIH0pO1xuXG4gIHBhcnNlci5vbih0eXBlcy5MT0dJQywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCF0aGlzLm91dC5sZW5ndGggfHwgdGhpcy5pc0xhc3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBsb2dpYyBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgICB9XG4gICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgdGhpcy5maWx0ZXJBcHBseUlkeC5wb3AoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBBbGxvd3MgeW91IHRvIGltcG9ydCBtYWNyb3MgZnJvbSBhbm90aGVyIGZpbGUgZGlyZWN0bHkgaW50byB5b3VyIGN1cnJlbnQgY29udGV4dC5cbiAqIFRoZSBpbXBvcnQgdGFnIGlzIHNwZWNpZmljYWxseSBkZXNpZ25lZCBmb3IgaW1wb3J0aW5nIG1hY3JvcyBpbnRvIHlvdXIgdGVtcGxhdGUgd2l0aCBhIHNwZWNpZmljIGNvbnRleHQgc2NvcGUuIFRoaXMgaXMgdmVyeSB1c2VmdWwgZm9yIGtlZXBpbmcgeW91ciBtYWNyb3MgZnJvbSBvdmVycmlkaW5nIHRlbXBsYXRlIGNvbnRleHQgdGhhdCBpcyBiZWluZyBpbmplY3RlZCBieSB5b3VyIHNlcnZlci1zaWRlIHBhZ2UgZ2VuZXJhdGlvbi5cbiAqXG4gKiBAYWxpYXMgaW1wb3J0XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGltcG9ydCAnLi9mb3JtbWFjcm9zLmh0bWwnIGFzIGZvcm1zICV9XG4gKiB7eyBmb3JtLmlucHV0KFwidGV4dFwiLCBcIm5hbWVcIikgfX1cbiAqIC8vID0+IDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJuYW1lXCI+XG4gKlxuICogQGV4YW1wbGVcbiAqIHslIGltcG9ydCBcIi4uL3NoYXJlZC90YWdzLmh0bWxcIiBhcyB0YWdzICV9XG4gKiB7eyB0YWdzLnN0eWxlc2hlZXQoJ2dsb2JhbCcpIH19XG4gKiAvLyA9PiA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi9nbG9iYWwuY3NzXCI+XG4gKlxuICogQHBhcmFtIHtzdHJpbmd8dmFyfSAgZmlsZSAgICAgIFJlbGF0aXZlIHBhdGggZnJvbSB0aGUgY3VycmVudCB0ZW1wbGF0ZSBmaWxlIHRvIHRoZSBmaWxlIHRvIGltcG9ydCBtYWNyb3MgZnJvbS5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gICAgIGFzICAgICAgICBMaXRlcmFsbHksIFwiYXNcIi5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gICAgIHZhcm5hbWUgICBMb2NhbC1hY2Nlc3NpYmxlIG9iamVjdCBuYW1lIHRvIGFzc2lnbiB0aGUgbWFjcm9zIHRvLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MpIHtcbiAgdmFyIGN0eCA9IGFyZ3MucG9wKCksXG4gICAgb3V0ID0gJ19jdHguJyArIGN0eCArICcgPSB7fTtcXG4gIHZhciBfb3V0cHV0ID0gXCJcIjtcXG4nLFxuICAgIHJlcGxhY2VtZW50cyA9IHV0aWxzLm1hcChhcmdzLCBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBleDogbmV3IFJlZ0V4cCgnX2N0eC4nICsgYXJnLm5hbWUsICdnJyksXG4gICAgICAgIHJlOiAnX2N0eC4nICsgY3R4ICsgJy4nICsgYXJnLm5hbWVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgLy8gUmVwbGFjZSBhbGwgb2NjdXJyZW5jZXMgb2YgYWxsIG1hY3JvcyBpbiB0aGlzIGZpbGUgd2l0aFxuICAvLyBwcm9wZXIgbmFtZXNwYWNlZCBkZWZpbml0aW9ucyBhbmQgY2FsbHNcbiAgdXRpbHMuZWFjaChhcmdzLCBmdW5jdGlvbiAoYXJnKSB7XG4gICAgdmFyIGMgPSBhcmcuY29tcGlsZWQ7XG4gICAgdXRpbHMuZWFjaChyZXBsYWNlbWVudHMsIGZ1bmN0aW9uIChyZSkge1xuICAgICAgYyA9IGMucmVwbGFjZShyZS5leCwgcmUucmUpO1xuICAgIH0pO1xuICAgIG91dCArPSBjO1xuICB9KTtcblxuICByZXR1cm4gb3V0O1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrLCBvcHRzLCBzd2lnKSB7XG4gIHZhciBjb21waWxlciA9IHJlcXVpcmUoJy4uL3BhcnNlcicpLmNvbXBpbGUsXG4gICAgcGFyc2VPcHRzID0geyByZXNvbHZlRnJvbTogb3B0cy5maWxlbmFtZSB9LFxuICAgIGNvbXBpbGVPcHRzID0gdXRpbHMuZXh0ZW5kKHt9LCBvcHRzLCBwYXJzZU9wdHMpLFxuICAgIHRva2VucyxcbiAgICBjdHg7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlNUUklORywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghdG9rZW5zKSB7XG4gICAgICB0b2tlbnMgPSBzd2lnLnBhcnNlRmlsZSh0b2tlbi5tYXRjaC5yZXBsYWNlKC9eKFwifCcpfChcInwnKSQvZywgJycpLCBwYXJzZU9wdHMpLnRva2VucztcbiAgICAgIHV0aWxzLmVhY2godG9rZW5zLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgdmFyIG91dCA9ICcnLFxuICAgICAgICAgIG1hY3JvTmFtZTtcbiAgICAgICAgaWYgKCF0b2tlbiB8fCB0b2tlbi5uYW1lICE9PSAnbWFjcm8nIHx8ICF0b2tlbi5jb21waWxlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG1hY3JvTmFtZSA9IHRva2VuLmFyZ3NbMF07XG4gICAgICAgIG91dCArPSB0b2tlbi5jb21waWxlKGNvbXBpbGVyLCB0b2tlbi5hcmdzLCB0b2tlbi5jb250ZW50LCBbXSwgY29tcGlsZU9wdHMpICsgJ1xcbic7XG4gICAgICAgIHNlbGYub3V0LnB1c2goe2NvbXBpbGVkOiBvdXQsIG5hbWU6IG1hY3JvTmFtZX0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHN0cmluZyAnICsgdG9rZW4ubWF0Y2ggKyAnIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuVkFSLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCF0b2tlbnMgfHwgY3R4KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgdmFyaWFibGUgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLm1hdGNoID09PSAnYXMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY3R4ID0gdG9rZW4ubWF0Y2g7XG4gICAgc2VsZi5vdXQucHVzaChjdHgpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmJsb2NrID0gdHJ1ZTtcbiIsInZhciBpZ25vcmUgPSAnaWdub3JlJyxcbiAgbWlzc2luZyA9ICdtaXNzaW5nJyxcbiAgb25seSA9ICdvbmx5JztcblxuLyoqXG4gKiBJbmNsdWRlcyBhIHRlbXBsYXRlIHBhcnRpYWwgaW4gcGxhY2UuIFRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCB3aXRoaW4gdGhlIGN1cnJlbnQgbG9jYWxzIHZhcmlhYmxlIGNvbnRleHQuXG4gKlxuICogQGFsaWFzIGluY2x1ZGVcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gZm9vZCA9ICdidXJyaXRvcyc7XG4gKiAvLyBkcmluayA9ICdsZW1vbmFkZSc7XG4gKiB7JSBpbmNsdWRlIFwiLi9wYXJ0aWFsLmh0bWxcIiAlfVxuICogLy8gPT4gSSBsaWtlIGJ1cnJpdG9zIGFuZCBsZW1vbmFkZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gbXlfb2JqID0geyBmb29kOiAndGFjb3MnLCBkcmluazogJ2hvcmNoYXRhJyB9O1xuICogeyUgaW5jbHVkZSBcIi4vcGFydGlhbC5odG1sXCIgd2l0aCBteV9vYmogb25seSAlfVxuICogLy8gPT4gSSBsaWtlIHRhY29zIGFuZCBob3JjaGF0YS5cbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgaW5jbHVkZSBcIi90aGlzL2ZpbGUvZG9lcy9ub3QvZXhpc3RcIiBpZ25vcmUgbWlzc2luZyAlfVxuICogLy8gPT4gKE5vdGhpbmchIGVtcHR5IHN0cmluZylcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3x2YXJ9ICBmaWxlICAgICAgVGhlIHBhdGgsIHJlbGF0aXZlIHRvIHRoZSB0ZW1wbGF0ZSByb290LCB0byByZW5kZXIgaW50byB0aGUgY3VycmVudCBjb250ZXh0LlxuICogQHBhcmFtIHtsaXRlcmFsfSAgICAgW3dpdGhdICAgIExpdGVyYWxseSwgXCJ3aXRoXCIuXG4gKiBAcGFyYW0ge29iamVjdH0gICAgICBbY29udGV4dF0gTG9jYWwgdmFyaWFibGUga2V5LXZhbHVlIG9iamVjdCBjb250ZXh0IHRvIHByb3ZpZGUgdG8gdGhlIGluY2x1ZGVkIGZpbGUuXG4gKiBAcGFyYW0ge2xpdGVyYWx9ICAgICBbb25seV0gICAgUmVzdHJpY3RzIHRvIDxzdHJvbmc+b25seTwvc3Ryb25nPiBwYXNzaW5nIHRoZSA8Y29kZT53aXRoIGNvbnRleHQ8L2NvZGU+IGFzIGxvY2FsIHZhcmlhYmxlc+KAk3RoZSBpbmNsdWRlZCB0ZW1wbGF0ZSB3aWxsIG5vdCBiZSBhd2FyZSBvZiBhbnkgb3RoZXIgbG9jYWwgdmFyaWFibGVzIGluIHRoZSBwYXJlbnQgdGVtcGxhdGUuIEZvciBiZXN0IHBlcmZvcm1hbmNlLCB1c2FnZSBvZiB0aGlzIG9wdGlvbiBpcyByZWNvbW1lbmRlZCBpZiBwb3NzaWJsZS5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gICAgIFtpZ25vcmUgbWlzc2luZ10gV2lsbCBvdXRwdXQgZW1wdHkgc3RyaW5nIGlmIG5vdCBmb3VuZCBpbnN0ZWFkIG9mIHRocm93aW5nIGFuIGVycm9yLlxuICovXG5leHBvcnRzLmNvbXBpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXIsIGFyZ3MpIHtcbiAgdmFyIGZpbGUgPSBhcmdzLnNoaWZ0KCksXG4gICAgb25seUlkeCA9IGFyZ3MuaW5kZXhPZihvbmx5KSxcbiAgICBvbmx5Q3R4ID0gb25seUlkeCAhPT0gLTEgPyBhcmdzLnNwbGljZShvbmx5SWR4LCAxKSA6IGZhbHNlLFxuICAgIHBhcmVudEZpbGUgPSAoYXJncy5wb3AoKSB8fCAnJykucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSxcbiAgICBpZ25vcmUgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IG1pc3NpbmcgPyAoYXJncy5wb3AoKSkgOiBmYWxzZSxcbiAgICB3ID0gYXJncy5qb2luKCcnKTtcblxuICByZXR1cm4gKGlnbm9yZSA/ICcgIHRyeSB7XFxuJyA6ICcnKSArXG4gICAgJ19vdXRwdXQgKz0gX3N3aWcuY29tcGlsZUZpbGUoJyArIGZpbGUgKyAnLCB7JyArXG4gICAgJ3Jlc29sdmVGcm9tOiBcIicgKyBwYXJlbnRGaWxlICsgJ1wiJyArXG4gICAgJ30pKCcgK1xuICAgICgob25seUN0eCAmJiB3KSA/IHcgOiAoIXcgPyAnX2N0eCcgOiAnX3V0aWxzLmV4dGVuZCh7fSwgX2N0eCwgJyArIHcgKyAnKScpKSArXG4gICAgJyk7XFxuJyArXG4gICAgKGlnbm9yZSA/ICd9IGNhdGNoIChlKSB7fVxcbicgOiAnJyk7XG59O1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0ciwgbGluZSwgcGFyc2VyLCB0eXBlcywgc3RhY2ssIG9wdHMpIHtcbiAgdmFyIGZpbGUsIHc7XG4gIHBhcnNlci5vbih0eXBlcy5TVFJJTkcsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghZmlsZSkge1xuICAgICAgZmlsZSA9IHRva2VuLm1hdGNoO1xuICAgICAgdGhpcy5vdXQucHVzaChmaWxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlZBUiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICBmaWxlID0gdG9rZW4ubWF0Y2g7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXcgJiYgdG9rZW4ubWF0Y2ggPT09ICd3aXRoJykge1xuICAgICAgdyA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHcgJiYgdG9rZW4ubWF0Y2ggPT09IG9ubHkgJiYgdGhpcy5wcmV2VG9rZW4ubWF0Y2ggIT09ICd3aXRoJykge1xuICAgICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLm1hdGNoID09PSBpZ25vcmUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodG9rZW4ubWF0Y2ggPT09IG1pc3NpbmcpIHtcbiAgICAgIGlmICh0aGlzLnByZXZUb2tlbi5tYXRjaCAhPT0gaWdub3JlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCB0b2tlbiBcIicgKyBtaXNzaW5nICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICAgICAgfVxuICAgICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJldlRva2VuLm1hdGNoID09PSBpZ25vcmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgXCInICsgbWlzc2luZyArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJyBidXQgZm91bmQgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuXG4gIHBhcnNlci5vbignZW5kJywgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub3V0LnB1c2gob3B0cy5maWxlbmFtZSB8fCBudWxsKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiZXhwb3J0cy5hdXRvZXNjYXBlID0gcmVxdWlyZSgnLi9hdXRvZXNjYXBlJyk7XG5leHBvcnRzLmJsb2NrID0gcmVxdWlyZSgnLi9ibG9jaycpO1xuZXhwb3J0c1tcImVsc2VcIl0gPSByZXF1aXJlKCcuL2Vsc2UnKTtcbmV4cG9ydHMuZWxzZWlmID0gcmVxdWlyZSgnLi9lbHNlaWYnKTtcbmV4cG9ydHMuZWxpZiA9IGV4cG9ydHMuZWxzZWlmO1xuZXhwb3J0c1tcImV4dGVuZHNcIl0gPSByZXF1aXJlKCcuL2V4dGVuZHMnKTtcbmV4cG9ydHMuZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKTtcbmV4cG9ydHNbXCJmb3JcIl0gPSByZXF1aXJlKCcuL2ZvcicpO1xuZXhwb3J0c1tcImlmXCJdID0gcmVxdWlyZSgnLi9pZicpO1xuZXhwb3J0c1tcImltcG9ydFwiXSA9IHJlcXVpcmUoJy4vaW1wb3J0Jyk7XG5leHBvcnRzLmluY2x1ZGUgPSByZXF1aXJlKCcuL2luY2x1ZGUnKTtcbmV4cG9ydHMubWFjcm8gPSByZXF1aXJlKCcuL21hY3JvJyk7XG5leHBvcnRzLnBhcmVudCA9IHJlcXVpcmUoJy4vcGFyZW50Jyk7XG5leHBvcnRzLnJhdyA9IHJlcXVpcmUoJy4vcmF3Jyk7XG5leHBvcnRzLnNldCA9IHJlcXVpcmUoJy4vc2V0Jyk7XG5leHBvcnRzLnNwYWNlbGVzcyA9IHJlcXVpcmUoJy4vc3BhY2VsZXNzJyk7XG4iLCIvKipcbiAqIENyZWF0ZSBjdXN0b20sIHJldXNhYmxlIHNuaXBwZXRzIHdpdGhpbiB5b3VyIHRlbXBsYXRlcy5cbiAqIENhbiBiZSBpbXBvcnRlZCBmcm9tIG9uZSB0ZW1wbGF0ZSB0byBhbm90aGVyIHVzaW5nIHRoZSA8YSBocmVmPVwiI2ltcG9ydFwiPjxjb2RlIGRhdGEtbGFuZ3VhZ2U9XCJzd2lnXCI+eyUgaW1wb3J0IC4uLiAlfTwvY29kZT48L2E+IHRhZy5cbiAqXG4gKiBAYWxpYXMgbWFjcm9cbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgbWFjcm8gaW5wdXQodHlwZSwgbmFtZSwgaWQsIGxhYmVsLCB2YWx1ZSwgZXJyb3IpICV9XG4gKiAgIDxsYWJlbCBmb3I9XCJ7eyBuYW1lIH19XCI+e3sgbGFiZWwgfX08L2xhYmVsPlxuICogICA8aW5wdXQgdHlwZT1cInt7IHR5cGUgfX1cIiBuYW1lPVwie3sgbmFtZSB9fVwiIGlkPVwie3sgaWQgfX1cIiB2YWx1ZT1cInt7IHZhbHVlIH19XCJ7JSBpZiBlcnJvciAlfSBjbGFzcz1cImVycm9yXCJ7JSBlbmRpZiAlfT5cbiAqIHslIGVuZG1hY3JvICV9XG4gKlxuICoge3sgaW5wdXQoXCJ0ZXh0XCIsIFwiZm5hbWVcIiwgXCJmbmFtZVwiLCBcIkZpcnN0IE5hbWVcIiwgZm5hbWUudmFsdWUsIGZuYW1lLmVycm9ycykgfX1cbiAqIC8vID0+IDxsYWJlbCBmb3I9XCJmbmFtZVwiPkZpcnN0IE5hbWU8L2xhYmVsPlxuICogLy8gICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cImZuYW1lXCIgaWQ9XCJmbmFtZVwiIHZhbHVlPVwiXCI+XG4gKlxuICogQHBhcmFtIHsuLi5hcmd1bWVudHN9IGFyZ3VtZW50cyAgVXNlci1kZWZpbmVkIGFyZ3VtZW50cy5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgdmFyIGZuTmFtZSA9IGFyZ3Muc2hpZnQoKTtcblxuICByZXR1cm4gJ19jdHguJyArIGZuTmFtZSArICcgPSBmdW5jdGlvbiAoJyArIGFyZ3Muam9pbignJykgKyAnKSB7XFxuJyArXG4gICAgJyAgdmFyIF9vdXRwdXQgPSBcIlwiLFxcbicgK1xuICAgICcgICAgX19jdHggPSBfdXRpbHMuZXh0ZW5kKHt9LCBfY3R4KTtcXG4nICtcbiAgICAnICBfdXRpbHMuZWFjaChfY3R4LCBmdW5jdGlvbiAodiwgaykge1xcbicgK1xuICAgICcgICAgaWYgKFtcIicgKyBhcmdzLmpvaW4oJ1wiLFwiJykgKyAnXCJdLmluZGV4T2YoaykgIT09IC0xKSB7IGRlbGV0ZSBfY3R4W2tdOyB9XFxuJyArXG4gICAgJyAgfSk7XFxuJyArXG4gICAgY29tcGlsZXIoY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSArICdcXG4nICtcbiAgICAnIF9jdHggPSBfdXRpbHMuZXh0ZW5kKF9jdHgsIF9fY3R4KTtcXG4nICtcbiAgICAnICByZXR1cm4gX291dHB1dDtcXG4nICtcbiAgICAnfTtcXG4nICtcbiAgICAnX2N0eC4nICsgZm5OYW1lICsgJy5zYWZlID0gdHJ1ZTtcXG4nO1xufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMpIHtcbiAgdmFyIG5hbWU7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlZBUiwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHRva2VuLm1hdGNoLmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBkb3QgaW4gbWFjcm8gYXJndW1lbnQgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuICAgIHRoaXMub3V0LnB1c2godG9rZW4ubWF0Y2gpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuRlVOQ1RJT04sIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghbmFtZSkge1xuICAgICAgbmFtZSA9IHRva2VuLm1hdGNoO1xuICAgICAgdGhpcy5vdXQucHVzaChuYW1lKTtcbiAgICAgIHRoaXMuc3RhdGUucHVzaCh0eXBlcy5GVU5DVElPTik7XG4gICAgfVxuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuRlVOQ1RJT05FTVBUWSwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICBuYW1lID0gdG9rZW4ubWF0Y2g7XG4gICAgICB0aGlzLm91dC5wdXNoKG5hbWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLlBBUkVOQ0xPU0UsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0xhc3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHBhcmVudGhlc2lzIGNsb3NlIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQ09NTUEsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKCcqJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybjtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmVuZHMgPSB0cnVlO1xuZXhwb3J0cy5ibG9jayA9IHRydWU7XG4iLCIvKipcbiAqIEluamVjdCB0aGUgY29udGVudCBmcm9tIHRoZSBwYXJlbnQgdGVtcGxhdGUncyBibG9jayBvZiB0aGUgc2FtZSBuYW1lIGludG8gdGhlIGN1cnJlbnQgYmxvY2suXG4gKlxuICogU2VlIDxhIGhyZWY9XCIjaW5oZXJpdGFuY2VcIj5UZW1wbGF0ZSBJbmhlcml0YW5jZTwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQGFsaWFzIHBhcmVudFxuICpcbiAqIEBleGFtcGxlXG4gKiB7JSBleHRlbmRzIFwiLi9mb28uaHRtbFwiICV9XG4gKiB7JSBibG9jayBjb250ZW50ICV9XG4gKiAgIE15IGNvbnRlbnQuXG4gKiAgIHslIHBhcmVudCAlfVxuICogeyUgZW5kYmxvY2sgJX1cbiAqXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIGlmICghcGFyZW50cyB8fCAhcGFyZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICB2YXIgcGFyZW50RmlsZSA9IGFyZ3NbMF0sXG4gICAgYnJlYWtlciA9IHRydWUsXG4gICAgbCA9IHBhcmVudHMubGVuZ3RoLFxuICAgIGkgPSAwLFxuICAgIHBhcmVudCxcbiAgICBibG9jaztcblxuICBmb3IgKGk7IGkgPCBsOyBpICs9IDEpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnRzW2ldO1xuICAgIGlmICghcGFyZW50LmJsb2NrcyB8fCAhcGFyZW50LmJsb2Nrcy5oYXNPd25Qcm9wZXJ0eShibG9ja05hbWUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gU2lsbHkgSlNMaW50IFwiU3RyYW5nZSBMb29wXCIgcmVxdWlyZXMgcmV0dXJuIHRvIGJlIGluIGEgY29uZGl0aW9uYWxcbiAgICBpZiAoYnJlYWtlciAmJiBwYXJlbnRGaWxlICE9PSBwYXJlbnQubmFtZSkge1xuICAgICAgYmxvY2sgPSBwYXJlbnQuYmxvY2tzW2Jsb2NrTmFtZV07XG4gICAgICByZXR1cm4gYmxvY2suY29tcGlsZShjb21waWxlciwgW2Jsb2NrTmFtZV0sIGJsb2NrLmNvbnRlbnQsIHBhcmVudHMuc2xpY2UoaSArIDEpLCBvcHRpb25zKSArICdcXG4nO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlciwgdHlwZXMsIHN0YWNrLCBvcHRzKSB7XG4gIHBhcnNlci5vbignKicsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBhcmd1bWVudCBcIicgKyB0b2tlbi5tYXRjaCArICdcIiBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vdXQucHVzaChvcHRzLmZpbGVuYW1lKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gTWFnaWMgdGFnLCBoYXJkY29kZWQgaW50byBwYXJzZXJcblxuLyoqXG4gKiBGb3JjZXMgdGhlIGNvbnRlbnQgdG8gbm90IGJlIGF1dG8tZXNjYXBlZC4gQWxsIHN3aWcgaW5zdHJ1Y3Rpb25zIHdpbGwgYmUgaWdub3JlZCBhbmQgdGhlIGNvbnRlbnQgd2lsbCBiZSByZW5kZXJlZCBleGFjdGx5IGFzIGl0IHdhcyBnaXZlbi5cbiAqXG4gKiBAYWxpYXMgcmF3XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGZvb2JhciA9ICc8cD4nXG4gKiB7JSByYXcgJX17eyBmb29iYXIgfX17JSBlbmRyYXcgJX1cbiAqIC8vID0+IHt7IGZvb2JhciB9fVxuICpcbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzLCBjb250ZW50LCBwYXJlbnRzLCBvcHRpb25zLCBibG9ja05hbWUpIHtcbiAgcmV0dXJuIGNvbXBpbGVyKGNvbnRlbnQsIHBhcmVudHMsIG9wdGlvbnMsIGJsb2NrTmFtZSk7XG59O1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIGxpbmUsIHBhcnNlcikge1xuICBwYXJzZXIub24oJyonLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgdG9rZW4gXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgaW4gcmF3IHRhZyBvbiBsaW5lICcgKyBsaW5lICsgJy4nKTtcbiAgfSk7XG4gIHJldHVybiB0cnVlO1xufTtcbmV4cG9ydHMuZW5kcyA9IHRydWU7XG4iLCIvKipcbiAqIFNldCBhIHZhcmlhYmxlIGZvciByZS11c2UgaW4gdGhlIGN1cnJlbnQgY29udGV4dC4gVGhpcyB3aWxsIG92ZXItd3JpdGUgYW55IHZhbHVlIGFscmVhZHkgc2V0IHRvIHRoZSBjb250ZXh0IGZvciB0aGUgZ2l2ZW4gPHZhcj52YXJuYW1lPC92YXI+LlxuICpcbiAqIEBhbGlhcyBzZXRcbiAqXG4gKiBAZXhhbXBsZVxuICogeyUgc2V0IGZvbyA9IFwiYW55dGhpbmchXCIgJX1cbiAqIHt7IGZvbyB9fVxuICogLy8gPT4gYW55dGhpbmchXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGluZGV4ID0gMjtcbiAqIHslIHNldCBiYXIgPSAxICV9XG4gKiB7JSBzZXQgYmFyICs9IGluZGV4fGRlZmF1bHQoMykgJX1cbiAqIC8vID0+IDNcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gZm9vZHMgPSB7fTtcbiAqIC8vIGZvb2QgPSAnY2hpbGknO1xuICogeyUgc2V0IGZvb2RzW2Zvb2RdID0gXCJjb24gcXVlc29cIiAlfVxuICoge3sgZm9vZHMuY2hpbGkgfX1cbiAqIC8vID0+IGNvbiBxdWVzb1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBmb29kcyA9IHsgY2hpbGk6ICdjaGlsaSBjb24gcXVlc28nIH1cbiAqIHslIHNldCBmb29kcy5jaGlsaSA9IFwiZ3VhdGFtYWxhbiBpbnNhbml0eSBwZXBwZXJcIiAlfVxuICoge3sgZm9vZHMuY2hpbGkgfX1cbiAqIC8vID0+IGd1YXRhbWFsYW4gaW5zYW5pdHkgcGVwcGVyXG4gKlxuICogQHBhcmFtIHtsaXRlcmFsfSB2YXJuYW1lICAgVGhlIHZhcmlhYmxlIG5hbWUgdG8gYXNzaWduIHRoZSB2YWx1ZSB0by5cbiAqIEBwYXJhbSB7bGl0ZXJhbH0gYXNzaWduZW1lbnQgICBBbnkgdmFsaWQgSmF2YVNjcmlwdCBhc3NpZ25lbWVudC4gPGNvZGUgZGF0YS1sYW5ndWFnZT1cImpzXCI+PSwgKz0sICo9LCAvPSwgLT08L2NvZGU+XG4gKiBAcGFyYW0geyp9ICAgdmFsdWUgICAgIFZhbGlkIHZhcmlhYmxlIG91dHB1dC5cbiAqL1xuZXhwb3J0cy5jb21waWxlID0gZnVuY3Rpb24gKGNvbXBpbGVyLCBhcmdzKSB7XG4gIHJldHVybiBhcmdzLmpvaW4oJyAnKSArICc7XFxuJztcbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIsIHR5cGVzKSB7XG4gIHZhciBuYW1lU2V0ID0gJycsXG4gICAgcHJvcGVydHlOYW1lO1xuXG4gIHBhcnNlci5vbih0eXBlcy5WQVIsIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmIChwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIC8vIFRlbGwgdGhlIHBhcnNlciB3aGVyZSB0byBmaW5kIHRoZSB2YXJpYWJsZVxuICAgICAgcHJvcGVydHlOYW1lICs9ICdfY3R4LicgKyB0b2tlbi5tYXRjaDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXBhcnNlci5vdXQubGVuZ3RoKSB7XG4gICAgICBuYW1lU2V0ICs9IHRva2VuLm1hdGNoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQlJBQ0tFVE9QRU4sIGZ1bmN0aW9uICh0b2tlbikge1xuICAgIGlmICghcHJvcGVydHlOYW1lICYmICF0aGlzLm91dC5sZW5ndGgpIHtcbiAgICAgIHByb3BlcnR5TmFtZSA9IHRva2VuLm1hdGNoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuU1RSSU5HLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAocHJvcGVydHlOYW1lICYmICF0aGlzLm91dC5sZW5ndGgpIHtcbiAgICAgIHByb3BlcnR5TmFtZSArPSB0b2tlbi5tYXRjaDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgcGFyc2VyLm9uKHR5cGVzLkJSQUNLRVRDTE9TRSwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHByb3BlcnR5TmFtZSAmJiAhdGhpcy5vdXQubGVuZ3RoKSB7XG4gICAgICBuYW1lU2V0ICs9IHByb3BlcnR5TmFtZSArIHRva2VuLm1hdGNoO1xuICAgICAgcHJvcGVydHlOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuRE9US0VZLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICBpZiAoIXByb3BlcnR5TmFtZSAmJiAhbmFtZVNldCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5hbWVTZXQgKz0gJy4nICsgdG9rZW4ubWF0Y2g7XG4gICAgcmV0dXJuO1xuICB9KTtcblxuICBwYXJzZXIub24odHlwZXMuQVNTSUdOTUVOVCwgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgaWYgKHRoaXMub3V0Lmxlbmd0aCB8fCAhbmFtZVNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIGFzc2lnbm1lbnQgXCInICsgdG9rZW4ubWF0Y2ggKyAnXCIgb24gbGluZSAnICsgbGluZSArICcuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5vdXQucHVzaChcbiAgICAgIC8vIFByZXZlbnQgdGhlIHNldCBmcm9tIHNwaWxsaW5nIGludG8gZ2xvYmFsIHNjb3BlXG4gICAgICAnX2N0eC4nICsgbmFtZVNldFxuICAgICk7XG4gICAgdGhpcy5vdXQucHVzaCh0b2tlbi5tYXRjaCk7XG4gICAgdGhpcy5maWx0ZXJBcHBseUlkeC5wdXNoKHRoaXMub3V0Lmxlbmd0aCk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5ibG9jayA9IHRydWU7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHJlbW92ZSB3aGl0ZXNwYWNlIGJldHdlZW4gSFRNTCB0YWdzLiBVc2UgYXQgeW91ciBvd24gcmlzay5cbiAqXG4gKiBAYWxpYXMgc3BhY2VsZXNzXG4gKlxuICogQGV4YW1wbGVcbiAqIHslIHNwYWNlbGVzcyAlfVxuICogICB7JSBmb3IgbnVtIGluIGZvbyAlfVxuICogICA8bGk+e3sgbG9vcC5pbmRleCB9fTwvbGk+XG4gKiAgIHslIGVuZGZvciAlfVxuICogeyUgZW5kc3BhY2VsZXNzICV9XG4gKiAvLyA9PiA8bGk+MTwvbGk+PGxpPjI8L2xpPjxsaT4zPC9saT5cbiAqXG4gKi9cbmV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uIChjb21waWxlciwgYXJncywgY29udGVudCwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKSB7XG4gIGZ1bmN0aW9uIHN0cmlwV2hpdGVzcGFjZSh0b2tlbnMpIHtcbiAgICByZXR1cm4gdXRpbHMubWFwKHRva2VucywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICBpZiAodG9rZW4uY29udGVudCB8fCB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSBzdHJpcFdoaXRlc3BhY2UodG9rZW4uY29udGVudCk7XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRva2VuLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC8+XFxzKzwvZywgJz48JylcbiAgICAgICAgLnJlcGxhY2UoL1xccyskLywgJycpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBpbGVyKHN0cmlwV2hpdGVzcGFjZShjb250ZW50KSwgcGFyZW50cywgb3B0aW9ucywgYmxvY2tOYW1lKTtcbn07XG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBsaW5lLCBwYXJzZXIpIHtcbiAgcGFyc2VyLm9uKCcqJywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHRva2VuIFwiJyArIHRva2VuLm1hdGNoICsgJ1wiIG9uIGxpbmUgJyArIGxpbmUgKyAnLicpO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuZW5kcyA9IHRydWU7XG4iLCJ2YXIgaXNBcnJheTtcblxuLyoqXG4gKiBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlIGZyb20gYSBzdHJpbmcuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlucHV0XG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgIFN0cmlwcGVkIGlucHV0LlxuICovXG5leHBvcnRzLnN0cmlwID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG59O1xuXG4vKipcbiAqIFRlc3QgaWYgYSBzdHJpbmcgc3RhcnRzIHdpdGggYSBnaXZlbiBwcmVmaXguXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0ciAgICBTdHJpbmcgdG8gdGVzdCBhZ2FpbnN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBwcmVmaXggUHJlZml4IHRvIGNoZWNrIGZvci5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydHMuc3RhcnRzV2l0aCA9IGZ1bmN0aW9uIChzdHIsIHByZWZpeCkge1xuICByZXR1cm4gc3RyLmluZGV4T2YocHJlZml4KSA9PT0gMDtcbn07XG5cbi8qKlxuICogVGVzdCBpZiBhIHN0cmluZyBlbmRzIHdpdGggYSBnaXZlbiBzdWZmaXguXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHN0ciAgICBTdHJpbmcgdG8gdGVzdCBhZ2FpbnN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBzdWZmaXggU3VmZml4IHRvIGNoZWNrIGZvci5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydHMuZW5kc1dpdGggPSBmdW5jdGlvbiAoc3RyLCBzdWZmaXgpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKHN1ZmZpeCwgc3RyLmxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgpICE9PSAtMTtcbn07XG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGFuIGFycmF5IG9yIG9iamVjdC5cbiAqIEBwYXJhbSAge2FycmF5fG9iamVjdH0gb2JqIEVudW1lcmFibGUgb2JqZWN0LlxuICogQHBhcmFtICB7RnVuY3Rpb259ICAgICBmbiAgQ2FsbGJhY2sgZnVuY3Rpb24gZXhlY3V0ZWQgZm9yIGVhY2ggaXRlbS5cbiAqIEByZXR1cm4ge2FycmF5fG9iamVjdH0gICAgIFRoZSBvcmlnaW5hbCBpbnB1dCBvYmplY3QuXG4gKi9cbmV4cG9ydHMuZWFjaCA9IGZ1bmN0aW9uIChvYmosIGZuKSB7XG4gIHZhciBpLCBsO1xuXG4gIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICBpID0gMDtcbiAgICBsID0gb2JqLmxlbmd0aDtcbiAgICBmb3IgKGk7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgIGlmIChmbihvYmpbaV0sIGksIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIGlmIChmbihvYmpbaV0sIGksIG9iaikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBUZXN0IGlmIGFuIG9iamVjdCBpcyBhbiBBcnJheS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXkgPSAoQXJyYXkuaGFzT3duUHJvcGVydHkoJ2lzQXJyYXknKSkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKG9iaikgPyAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuaW5kZXhPZigpICE9PSAtMSkgOiBmYWxzZTtcbn07XG5cbi8qKlxuICogVGVzdCBpZiBhbiBpdGVtIGluIGFuIGVudW1lcmFibGUgbWF0Y2hlcyB5b3VyIGNvbmRpdGlvbnMuXG4gKiBAcGFyYW0gIHthcnJheXxvYmplY3R9ICAgb2JqICAgRW51bWVyYWJsZSBvYmplY3QuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgICAgZm4gICAgRXhlY3V0ZWQgZm9yIGVhY2ggaXRlbS4gUmV0dXJuIHRydWUgaWYgeW91ciBjb25kaXRpb24gaXMgbWV0LlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0cy5zb21lID0gZnVuY3Rpb24gKG9iaiwgZm4pIHtcbiAgdmFyIGkgPSAwLFxuICAgIHJlc3VsdCxcbiAgICBsO1xuICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgbCA9IG9iai5sZW5ndGg7XG5cbiAgICBmb3IgKGk7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgIHJlc3VsdCA9IGZuKG9ialtpXSwgaSwgb2JqKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGV4cG9ydHMuZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIHJlc3VsdCA9IGZuKHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgIHJldHVybiAhKHJlc3VsdCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuICEhcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBuZXcgZW51bWVyYWJsZSwgbWFwcGVkIGJ5IGEgZ2l2ZW4gaXRlcmF0aW9uIGZ1bmN0aW9uLlxuICogQHBhcmFtICB7b2JqZWN0fSAgIG9iaiBFbnVtZXJhYmxlIG9iamVjdC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgRXhlY3V0ZWQgZm9yIGVhY2ggaXRlbS4gUmV0dXJuIHRoZSBpdGVtIHRvIHJlcGxhY2UgdGhlIG9yaWdpbmFsIGl0ZW0gd2l0aC5cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgTmV3IG1hcHBlZCBvYmplY3QuXG4gKi9cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gKG9iaiwgZm4pIHtcbiAgdmFyIGkgPSAwLFxuICAgIHJlc3VsdCA9IFtdLFxuICAgIGw7XG5cbiAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgIGwgPSBvYmoubGVuZ3RoO1xuICAgIGZvciAoaTsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgcmVzdWx0W2ldID0gZm4ob2JqW2ldLCBpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpIGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICByZXN1bHRbaV0gPSBmbihvYmpbaV0sIGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDb3B5IGFsbCBvZiB0aGUgcHJvcGVydGllcyBpbiB0aGUgc291cmNlIG9iamVjdHMgb3ZlciB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LCBhbmQgcmV0dXJuIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIEl0J3MgaW4tb3JkZXIsIHNvIHRoZSBsYXN0IHNvdXJjZSB3aWxsIG92ZXJyaWRlIHByb3BlcnRpZXMgb2YgdGhlIHNhbWUgbmFtZSBpbiBwcmV2aW91cyBhcmd1bWVudHMuXG4gKiBAcGFyYW0gey4uLm9iamVjdH0gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICB0YXJnZXQgPSBhcmdzWzBdLFxuICAgIG9ianMgPSAoYXJncy5sZW5ndGggPiAxKSA/IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDEpIDogW10sXG4gICAgaSA9IDAsXG4gICAgbCA9IG9ianMubGVuZ3RoLFxuICAgIGtleSxcbiAgICBvYmo7XG5cbiAgZm9yIChpOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgb2JqID0gb2Jqc1tpXSB8fCB7fTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICB0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIG9mIHRoZSBrZXlzIG9uIGFuIG9iamVjdC5cbiAqIEBwYXJhbSAge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHthcnJheX1cbiAqL1xuZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAoIW9iaikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmIChPYmplY3Qua2V5cykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopO1xuICB9XG5cbiAgcmV0dXJuIGV4cG9ydHMubWFwKG9iaiwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICByZXR1cm4gaztcbiAgfSk7XG59O1xuXG4vKipcbiAqIFRocm93IGFuIGVycm9yIHdpdGggcG9zc2libGUgbGluZSBudW1iZXIgYW5kIHNvdXJjZSBmaWxlLlxuICogQHBhcmFtICB7c3RyaW5nfSBtZXNzYWdlIEVycm9yIG1lc3NhZ2VcbiAqIEBwYXJhbSAge251bWJlcn0gW2xpbmVdICBMaW5lIG51bWJlciBpbiB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gW2ZpbGVdICBUZW1wbGF0ZSBmaWxlIHRoZSBlcnJvciBvY2N1cmVkIGluLlxuICogQHRocm93cyB7RXJyb3J9IE5vIHNlcmlvdXNseSwgdGhlIHBvaW50IGlzIHRvIHRocm93IGFuIGVycm9yLlxuICovXG5leHBvcnRzLnRocm93RXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSwgbGluZSwgZmlsZSkge1xuICBpZiAobGluZSkge1xuICAgIG1lc3NhZ2UgKz0gJyBvbiBsaW5lICcgKyBsaW5lO1xuICB9XG4gIGlmIChmaWxlKSB7XG4gICAgbWVzc2FnZSArPSAnIGluIGZpbGUgJyArIGZpbGU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgKyAnLicpO1xufTtcbiIsInZhciBwdWJzdWIgPSByZXF1aXJlKCdvcmdhbmljLWxpYi9wdWJzdWInKTtcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi9hcHBsaWNhdGlvbi52aWV3Jyk7XG52YXIgcHJvamVjdHNMaXN0ID0gcmVxdWlyZSgnLi9wcm9qZWN0cy1saXN0L3Byb2plY3RzLWxpc3QuY29udHJvbGxlcicpO1xudmFyIHByb2plY3REaXNwbGF5ID0gcmVxdWlyZSgnLi9wcm9qZWN0LWRpc3BsYXkvcHJvamVjdC1kaXNwbGF5LmNvbnRyb2xsZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0gZnVuY3Rpb24oKXt9O1xuQXBwbGljYXRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXBwbGljYXRpb247XG52YXIgYXBwbGljYXRpb24gPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBBcHBsaWNhdGlvbigpO1xuXG5BcHBsaWNhdGlvbi5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGNvbmZpZywgd3JhcHBlcil7XG5cdHRoaXMuJGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25zb2xlLmxvZygnYXBwbGljYXRpb24gY29uZmlnJywgY29uZmlnKTtcbiAgICB0aGlzLiR3cmFwcGVyID0gd3JhcHBlciB8fCBkb2N1bWVudC5ib2R5O1xuICAgIHJldHVybiB2aWV3LmluaXQodGhpcylcbiAgICAgICAgLnRoZW4oIHByb2plY3RzTGlzdC5pbml0LmJpbmQocHJvamVjdHNMaXN0LCB0aGlzLCB0aGlzLiRjb25maWcpIClcbiAgICAgICAgLnRoZW4oIHByb2plY3REaXNwbGF5LmluaXQuYmluZChwcm9qZWN0c0xpc3QsIHRoaXMpIClcbiAgICAgICAgLnRoZW4oIHZpZXcucmVuZGVyUGFnZS5iaW5kKHZpZXcsICdhYm91dCcpICk7XG59O1xuXG5BcHBsaWNhdGlvbi5wcm90b3R5cGUuaGFzaENoYW5nZWQgPSBmdW5jdGlvbihoYXNoKXtcbiAgICB2YXIgcGF0aCA9ICggaGFzaCB8fCB3aW5kb3cubG9jYXRpb24uaGFzaCApLnJlcGxhY2UoJyMvJywgJycpLnNwbGl0KCcvJyk7XG4gICAgdmFyIGFjdGlvbiA9IHBhdGguc2hpZnQoKTtcblxuICAgIHN3aXRjaCggYWN0aW9uICl7XG4gICAgICAgIGNhc2UgJ2Fib3V0JzpcbiAgICAgICAgY2FzZSAnY29udGFjdCc6XG4gICAgICAgICAgICB2aWV3LnJlbmRlclBhZ2UoIGFjdGlvbiApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3Byb2plY3QnOlxuICAgICAgICAgICAgcHJvamVjdHNMaXN0LmNoYW5nZVByb2plY3QoIHBhdGguc2hpZnQoKSApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcbiIsInZhciB0ZW1wbGF0b3IgPSByZXF1aXJlKCdvcmdhbmljLWxpYi90ZW1wbGF0b3InKTtcblxudmFyICRzY29wZTtcblxudmFyIEFwcGxpY2F0aW9uVmlldyA9IGZ1bmN0aW9uKCl7fTtcbkFwcGxpY2F0aW9uVmlldy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBcHBsaWNhdGlvblZpZXc7XG52YXIgYXBwbGljYXRpb25WaWV3ID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgQXBwbGljYXRpb25WaWV3KCk7XG5cbkFwcGxpY2F0aW9uVmlldy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGNvbnRyb2xsZXIpe1xuICAgICRzY29wZSA9IGNvbnRyb2xsZXI7XG4gICAgLy9yZXR1cm5zIHRoZSBwcm9taXNlIGNyZWF0ZWQgaW4gdGVtcGxhdG9yLnJlbmRlclxuICAgIHJldHVybiB0aGlzLnJlbmRlcigkc2NvcGUuJHdyYXBwZXIsICRzY29wZS4kY29uZmlnKVxuICAgICAgICAudGhlbiggcmVnaXN0ZXJET00gKVxuICAgICAgICAudGhlbiggcmVnaXN0ZXJCZWhhdmlvdXIgKTtcbn07XG5cbi8vd2UgZXhwb3NlIHRoZSByZW5kZXIgbWV0aG9kIGJlY2F1c2UgdGhlcmUgbWF5IGNvbWUgdGhlIG5lZWQgZm9yIHRoZSBjb250cm9sbGVyIHRvIHJlbmRlciBpdCBhZ2FpblxuQXBwbGljYXRpb25WaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbih3cmFwcGVyLCBsb2NhbHMpe1xuICAgIC8vdXNlIHRoZSB0ZW1wbGF0b3IgdG8gcmVuZGVyIHRoZSBodG1sXG4gICAgcmV0dXJuIHRlbXBsYXRvci5yZW5kZXIoJ21haW4uaHRtbCcsIGxvY2Fscywgd3JhcHBlcik7XG59O1xuXG5BcHBsaWNhdGlvblZpZXcucHJvdG90eXBlLnJlbmRlclBhZ2UgPSBmdW5jdGlvbihwYWdlKXsgXG4gICAgcmV0dXJuIHRlbXBsYXRvci5lbXB0eSgkc2NvcGUuJERPTS5wcm9qZWN0Q29udGFpbmVyKVxuICAgICAgICAudGhlbiggdGVtcGxhdG9yLnJlbmRlci5iaW5kKHRlbXBsYXRvciwgcGFnZSArICcuaHRtbCcsICRzY29wZS4kY29uZmlnLCAkc2NvcGUuJERPTS5wcm9qZWN0Q29udGFpbmVyKSApXG59O1xuXG4vL3dlIGNhY2hlIGFsbCB0aGUgRE9NIGVsZW1lbnRzIHdlJ2xsIHVzZSBsYXRlclxudmFyIHJlZ2lzdGVyRE9NID0gZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuJERPTSA9IHtcbiAgICAgICAgcHJvamVjdHNMaXN0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvamVjdHMtbGlzdCcpLFxuICAgICAgICBwcm9qZWN0Q29udGFpbmVyOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvamVjdC1jb250YWluZXInKVxuICAgIH07XG59O1xuXG52YXIgcmVnaXN0ZXJCZWhhdmlvdXIgPSBmdW5jdGlvbigpe1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgZnVuY3Rpb24oZXYpe1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkc2NvcGUuaGFzaENoYW5nZWQoKTtcbiAgICB9KTtcbn07XG4iLCJ2YXIgcHVic3ViID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvcHVic3ViJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vcHJvamVjdC1kaXNwbGF5LnZpZXcnKTtcblxudmFyIFByb2plY3REaXNwbGF5ID0gZnVuY3Rpb24oKXt9O1xuUHJvamVjdERpc3BsYXkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvamVjdERpc3BsYXk7XG52YXIgcHJvamVjdERpc3BsYXkgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBQcm9qZWN0RGlzcGxheSgpO1xuXG5Qcm9qZWN0RGlzcGxheS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHBhcmVudFNjb3BlLCBjb25maWcsIHdyYXBwZXIpe1xuICAgIHRoaXMuJHBhcmVudFNjb3BlID0gcGFyZW50U2NvcGU7XG4gICAgdGhpcy4kY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIHRoaXMuJHdyYXBwZXIgPSB3cmFwcGVyIHx8IHRoaXMuJHBhcmVudFNjb3BlLiRET00ucHJvamVjdENvbnRhaW5lcjtcbiAgICByZWdpc3Rlck5vdGlmaWNhdGlvbkludGVyZXN0cygpO1xuICAgIHJldHVybiB2aWV3LmluaXQodGhpcyk7XG59O1xuXG52YXIgcmVnaXN0ZXJOb3RpZmljYXRpb25JbnRlcmVzdHMgPSBmdW5jdGlvbigpe1xuICAgIHZhciBub3RpZmljYXRpb25JbnRlcmVzdHMgPSBbXG4gICAgICAgICdwcm9qZWN0IGNoYW5nZWQnXG4gICAgXTtcblxuICAgIHB1YnN1Yi5zdWJzY3JpYmUobm90aWZpY2F0aW9uSW50ZXJlc3RzLCBub3RpZmljYXRpb25IYW5kbGVyKTtcbn07XG5cbnZhciBub3RpZmljYXRpb25IYW5kbGVyID0gZnVuY3Rpb24obWVzc2FnZSwgcGF5bG9hZCl7XG4gICAgc3dpdGNoKG1lc3NhZ2Upe1xuICAgICAgICBjYXNlICdwcm9qZWN0IGNoYW5nZWQnOlxuICAgICAgICAgICAgdmlldy5yZW5kZXJQcm9qZWN0KCBwYXlsb2FkLnByb2plY3QgKVxuICAgICAgICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe30sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycil7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuIiwidmFyIHRlbXBsYXRvciA9IHJlcXVpcmUoJ29yZ2FuaWMtbGliL3RlbXBsYXRvcicpO1xuXG52YXIgJHNjb3BlO1xuXG52YXIgUHJvamVjdERpc3BsYXlWaWV3ID0gZnVuY3Rpb24oKXt9O1xuUHJvamVjdERpc3BsYXlWaWV3LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByb2plY3REaXNwbGF5VmlldztcbnZhciBwcm9qZWN0RGlzcGxheVZpZXcgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBQcm9qZWN0RGlzcGxheVZpZXcoKTtcblxuUHJvamVjdERpc3BsYXlWaWV3LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oY29udHJvbGxlcil7XG4gICAgJHNjb3BlID0gY29udHJvbGxlcjtcblxufTtcblxuLy93ZSBleHBvc2UgdGhlIHJlbmRlciBtZXRob2QgYmVjYXVzZSB0aGVyZSBtYXkgY29tZSB0aGUgbmVlZCBmb3IgdGhlIGNvbnRyb2xsZXIgdG8gcmVuZGVyIGl0IGFnYWluXG5Qcm9qZWN0RGlzcGxheVZpZXcucHJvdG90eXBlLnJlbmRlclByb2plY3QgPSBmdW5jdGlvbihwcm9qZWN0KXtcbiAgICB2YXIgbG9jYWxzID0ge1xuICAgICAgICBwcm9qZWN0OiBwcm9qZWN0XG4gICAgfTtcbiAgICByZXR1cm4gdGVtcGxhdG9yLmVtcHR5KCRzY29wZS4kd3JhcHBlcilcbiAgICAgICAgLnRoZW4oIHRlbXBsYXRvci5yZW5kZXIuYmluZCh0ZW1wbGF0b3IsICdwcm9qZWN0LWRpc3BsYXkuaHRtbCcsIGxvY2FscywgJHNjb3BlLiR3cmFwcGVyKSApO1xufTtcblxuLy93ZSBjYWNoZSBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSdsbCB1c2UgbGF0ZXJcbnZhciByZWdpc3RlckRPTSA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLiRET00gPSB7XG4gICAgfTtcbn07XG5cbnZhciByZWdpc3RlckJlaGF2aW91ciA9IGZ1bmN0aW9uKCl7XG4gICAgXG59O1xuIiwidmFyIHB1YnN1YiA9IHJlcXVpcmUoJ29yZ2FuaWMtbGliL3B1YnN1YicpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuL3Byb2plY3RzLWxpc3QudmlldycpO1xuXG52YXIgUHJvamVjdHNMaXN0ID0gZnVuY3Rpb24oKXt9O1xuUHJvamVjdHNMaXN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByb2plY3RzTGlzdDtcbnZhciBwcm9qZWN0c0xpc3QgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBQcm9qZWN0c0xpc3QoKTtcblxuUHJvamVjdHNMaXN0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24ocGFyZW50U2NvcGUsIGNvbmZpZywgd3JhcHBlcil7XG4gICAgdGhpcy4kcGFyZW50U2NvcGUgPSBwYXJlbnRTY29wZTtcbiAgICB0aGlzLiRjb25maWcgPSBjb25maWcgfHwge307XG4gICAgdGhpcy5wcm9qZWN0cyA9IGNvbmZpZy5wcm9qZWN0cztcbiAgICB0aGlzLiR3cmFwcGVyID0gd3JhcHBlciB8fCB0aGlzLiRwYXJlbnRTY29wZS4kRE9NLnByb2plY3RzTGlzdDtcbiAgICByZXR1cm4gdmlldy5pbml0KHRoaXMpO1xufTtcblxuUHJvamVjdHNMaXN0LnByb3RvdHlwZS5jaGFuZ2VQcm9qZWN0ID0gZnVuY3Rpb24oc2x1Zyl7XG4gICAgdmFyIHByb2plY3QgPSB0aGlzLnByb2plY3RzLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgcmV0dXJuIGl0ZW0uc2x1ZyA9PT0gc2x1ZztcbiAgICB9KS5zaGlmdCgpO1xuICAgIHB1YnN1Yi5icm9hZGNhc3QoICdwcm9qZWN0IGNoYW5nZWQnLCB7IHByb2plY3Q6IHByb2plY3QgfSApO1xufTtcbiIsInZhciB0ZW1wbGF0b3IgPSByZXF1aXJlKCdvcmdhbmljLWxpYi90ZW1wbGF0b3InKTtcblxudmFyICRzY29wZTtcblxudmFyIFByb2plY3RzTGlzdFZpZXcgPSBmdW5jdGlvbigpe307XG5Qcm9qZWN0c0xpc3RWaWV3LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByb2plY3RzTGlzdFZpZXc7XG52YXIgcHJvamVjdHNMaXN0VmlldyA9IG1vZHVsZS5leHBvcnRzID0gbmV3IFByb2plY3RzTGlzdFZpZXcoKTtcblxuUHJvamVjdHNMaXN0Vmlldy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGNvbnRyb2xsZXIpe1xuICAgICRzY29wZSA9IGNvbnRyb2xsZXI7XG4gICAgLy9yZXR1cm5zIHRoZSBwcm9taXNlIGNyZWF0ZWQgaW4gdGVtcGxhdG9yLnJlbmRlclxuICAgIHJldHVybiB0aGlzLnJlbmRlcigkc2NvcGUuJHdyYXBwZXIsICRzY29wZS4kY29uZmlnKVxuICAgICAgICAudGhlbiggcmVnaXN0ZXJET00gKVxuICAgICAgICAudGhlbiggcmVnaXN0ZXJCZWhhdmlvdXIgKTtcbn07XG5cbi8vd2UgZXhwb3NlIHRoZSByZW5kZXIgbWV0aG9kIGJlY2F1c2UgdGhlcmUgbWF5IGNvbWUgdGhlIG5lZWQgZm9yIHRoZSBjb250cm9sbGVyIHRvIHJlbmRlciBpdCBhZ2FpblxuUHJvamVjdHNMaXN0Vmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24od3JhcHBlciwgbG9jYWxzKXtcbiAgICAvL3VzZSB0aGUgdGVtcGxhdG9yIHRvIHJlbmRlciB0aGUgaHRtbFxuICAgIHJldHVybiB0ZW1wbGF0b3IucmVuZGVyKCdwcm9qZWN0cy1saXN0Lmh0bWwnLCBsb2NhbHMsIHdyYXBwZXIpO1xufTtcblxuLy93ZSBjYWNoZSBhbGwgdGhlIERPTSBlbGVtZW50cyB3ZSdsbCB1c2UgbGF0ZXJcbnZhciByZWdpc3RlckRPTSA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLiRET00gPSB7XG4gICAgfTtcbn07XG5cbnZhciByZWdpc3RlckJlaGF2aW91ciA9IGZ1bmN0aW9uKCl7XG4gICAgJHNjb3BlLiR3cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXYpe1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXYudGFyZ2V0O1xuICAgICAgICBpZih0YXJnZXQuZGF0YXNldC5wcm9qZWN0KXtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUuY2hhbmdlUHJvamVjdCh0YXJnZXQuZGF0YXNldC5wcm9qZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcbiIsInZhciBwdWJzdWIgPSByZXF1aXJlKCdvcmdhbmljLWxpYi9wdWJzdWInKTtcbnZhciBhamF4ID0gcmVxdWlyZSgnb3JnYW5pYy1saWIvYWpheCcpO1xudmFyIGFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbi5jb250cm9sbGVyJyk7XG5cbnZhciBpc0RldmVsb3BtZW50ID0gfndpbmRvdy5sb2NhdGlvbi5ob3N0LmluZGV4T2YoJ2xvY2FsaG9zdCcpO1xuXG53aW5kb3cuaG9zdE5hbWUgPSBpc0RldmVsb3BtZW50PyAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyA6ICcvLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcbnZhciBDT05GSUdVUkFUSU9OX1VSTCA9IHdpbmRvdy5ob3N0TmFtZSArICcvZ2V0LWNvbmZpZ3VyYXRpb24nO1xuXG5cbmFqYXguZ2V0SlNPTiggQ09ORklHVVJBVElPTl9VUkwgKVxuXHQudGhlbiggYXBwbGljYXRpb24uaW5pdC5iaW5kKGFwcGxpY2F0aW9uKSApXG4gICAgLnRoZW4oIGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2ggfHwgJ2Fib3V0JztcbiAgICAgICAgYXBwbGljYXRpb24uaGFzaENoYW5nZWQoaGFzaCk7XG4gICAgfSlcblx0LnRoZW4gKFxuXHRcdGZ1bmN0aW9uKCl7IGNvbnNvbGUubG9nKCdhcHBsaWNhdGlvbiBzdGFydGVkIHN1Y2Nlc3NmdWxseScpOyB9LFxuXHRcdGZ1bmN0aW9uKGVycil7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuXHQpO1xuXG5cbnB1YnN1Yi5zdWJzY3JpYmUoJyonLCBmdW5jdGlvbihtZXNzYWdlLCBwYXlsb2FkKXtcblx0Y29uc29sZS5sb2coJy0tLS0tLS0gTWVzc2FnZSBSZWNlaXZlZCAtLS0tLS0tLS0tJyk7XG5cdGNvbnNvbGUubG9nKCdtZXNzYWdlOicsIG1lc3NhZ2UpO1xuXHRjb25zb2xlLmxvZygncGF5bG9hZDonLCBwYXlsb2FkKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn0pO1xuIl19
