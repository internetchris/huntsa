/*!
 * Shadowbox.js, version 3.0.3
 * http://shadowbox-js.com/
 *
 * Copyright 2007-2010, Michael J. I. Jackson
 * Date: Sat Mar 12 16:22:36 -0700 2011
 */
(function(window, undefined) {

/**
 * The Shadowbox object.
 *
 * @type    {Object}
 * @public
 */
var S = {

    /**
     * The current version of Shadowbox.
     *
     * @type    {String}
     * @public
     */
    version: "3.0.3"

}

var ua = navigator.userAgent.toLowerCase();

// operating system detection
if (ua.indexOf('windows') > -1 || ua.indexOf('win32') > -1) {
    S.isWindows = true;
} else if (ua.indexOf('macintosh') > -1 || ua.indexOf('mac os x') > -1) {
    S.isMac = true;
} else if (ua.indexOf('linux') > -1) {
    S.isLinux = true;
}

// browser detection -- deprecated. the goal is to use object detection
// instead of the user agent string
S.isIE = ua.indexOf('msie') > -1;
S.isIE6 = ua.indexOf('msie 6') > -1;
S.isIE7 = ua.indexOf('msie 7') > -1;
S.isGecko = ua.indexOf('gecko') > -1 && ua.indexOf('safari') == -1;
S.isWebKit = ua.indexOf('applewebkit/') > -1;

var inlineId = /#(.+)$/,
    galleryName = /^(light|shadow)box\[(.*?)\]/i,
    inlineParam = /\s*([a-z_]*?)\s*=\s*(.+)\s*/,
    fileExtension = /[0-9a-z]+$/i,
    scriptPath = /(.+\/)shadowbox\.js/i;

/**
 * True if Shadowbox is currently open, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
var open = false,

/**
 * True if Shadowbox has been initialized, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
initialized = false,

/**
 * The previous set of options that were used before Shadowbox.applyOptions was
 * called.
 *
 * @type    {Object}
 * @private
 */
lastOptions = {},

/**
 * The delay in milliseconds that the current gallery uses.
 *
 * @type    {Number}
 * @private
 */
slideDelay = 0,

/**
 * The time at which the current slideshow frame appeared.
 *
 * @type    {Number}
 * @private
 */
slideStart,

/**
 * The timeout id for the slideshow transition function.
 *
 * @type    {Number}
 * @private
 */
slideTimer;

/**
 * The index of the current object in the gallery array.
 *
 * @type    {Number}
 * @public
 */
S.current = -1;

/**
 * The current dimensions of Shadowbox.
 *
 * @type    {Object}
 * @public
 */
S.dimensions = null;

/**
 * Easing function used for animations. Based on a cubic polynomial.
 *
 * @param   {Number}    state   The state of the animation (% complete)
 * @return  {Number}            The adjusted easing value
 * @public
 */
S.ease = function(state) {
    return 1 + Math.pow(state - 1, 3);
}

/**
 * An object containing names of plugins and links to their respective download pages.
 *
 * @type    {Object}
 * @public
 */
S.errorInfo = {
    fla: {
        name: "Flash",
        url:  "http://www.adobe.com/products/flashplayer/"
    },
    qt: {
        name: "QuickTime",
        url:  "http://www.apple.com/quicktime/download/"
    },
    wmp: {
        name: "Windows Media Player",
        url:  "http://www.microsoft.com/windows/windowsmedia/"
    },
    f4m: {
        name: "Flip4Mac",
        url:  "http://www.flip4mac.com/wmv_download.htm"
    }
};

/**
 * The content objects in the current set.
 *
 * @type    {Array}
 * @public
 */
S.gallery = [];

/**
 * A function that will be called as soon as the DOM is ready.
 *
 * @type    {Function}
 * @public
 */
S.onReady = noop;

/**
 * The URL path to the Shadowbox script.
 *
 * @type    {String}
 * @public
 */
S.path = null;

/**
 * The current player object.
 *
 * @type    {Object}
 * @public
 */
S.player = null;

/**
 * The id to use for the Shadowbox player element.
 *
 * @type    {String}
 * @public
 */
S.playerId = "sb-player";

/**
 * Various options that control Shadowbox' behavior.
 *
 * @type    {Object}
 * @public
 */
S.options = {

    /**
     * True to enable animations.
     *
     * @type    {Boolean}
     */
    animate: true,

    /**
     * True to enable opacity animations.
     *
     * @type    {Boolean}
     */
    animateFade: true,

    /**
     * True to automatically play movies when the load.
     *
     * @type    {Boolean}
     */
    autoplayMovies: true,

    /**
     * True to enable the user to skip to the first item in a gallery from the last using
     * next.
     *
     * @type    {Boolean}
     */
    continuous: false,

    /**
     * True to enable keyboard navigation.
     *
     * @type    {Boolean}
     */
    enableKeys: true,

    /**
     * Parameters to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashParams: {
        bgcolor: "#000000",
        allowfullscreen: true
    },

    /**
     * Variables to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashVars: {},

    /**
     * The minimum required Flash version.
     *
     * Note: The default is 9.0.115. This is the minimum version suggested by
     * the JW FLV player.
     *
     * @type    {String}
     */
    flashVersion: "9.0.115",

    /**
     * Determines how oversized content is handled. If set to "resize" the
     * content will be resized while preserving aspect ratio. If "drag" will display
     * the image at its original resolution but it will be draggable. If "none" will
     * display the content at its original resolution but it may be cropped.
     *
     * @type    {String}
     */
    handleOversize: "resize",

    /**
     * Determines how unsupported content is handled. If set to "remove" will
     * remove the content from the gallery. If "link" will display a helpful
     * link to a page where the necessary browser plugin can be installed.
     *
     * @type    {String}
     */
    handleUnsupported: "link",

    /**
     * A hook function to be fired when changing from one gallery item to the
     * next. Is passed the item that is about to be displayed as its only argument.
     *
     * @type    {Function}
     */
    onChange: noop,

    /**
     * A hook function to be fired when closing. Is passed the most recent item
     * as its only argument.
     *
     * @type    {Function}
     */
    onClose: noop,

    /**
     * A hook funciton to be fires when content is finished loading. Is passed the
     * current gallery item as its only argument.
     *
     * @type    {Function}
     */
    onFinish: noop,

    /**
     * A hook function to be fired when opening. Is passed the current gallery item
     * as its only argument.
     *
     * @type    {Function}
     */
    onOpen: noop,

    /**
     * True to enable movie controls on movie players.
     *
     * @type    {Boolean}
     */
    showMovieControls: true,

    /**
     * True to skip calling setup during init.
     *
     * @type    {Boolean}
     */
    skipSetup: false,

    /**
     * The delay (in seconds) to use when displaying a gallery in slideshow mode. Setting
     * this option to any value other than 0 will trigger slideshow mode.
     *
     * @type    {Number}
     */
    slideshowDelay: 0,

    /**
     * The ammount of padding (in pixels) to maintain around the edge of the viewport at all
     * times.
     *
     * @type    {Number}
     */
    viewportPadding: 20

};

/**
 * Gets the object that is currently being displayed.
 *
 * @return  {Object}
 * @public
 */
S.getCurrent = function() {
    return S.current > -1 ? S.gallery[S.current] : null;
}

/**
 * Returns true if there is another object to display after the current.
 *
 * @return  {Boolean}
 * @public
 */
S.hasNext = function() {
    return S.gallery.length > 1 && (S.current != S.gallery.length - 1 || S.options.continuous);
}

/**
 * Returns true if Shadowbox is currently open.
 *
 * @return  {Boolean}
 * @public
 */
S.isOpen = function() {
    return open;
}

/**
 * Returns true if Shadowbox is currently paused.
 *
 * @return  {Boolean}
 * @public
 */
S.isPaused = function() {
    return slideTimer == "pause";
}

/**
 * Applies the given set of options to Shadowbox' options. May be undone with revertOptions().
 *
 * @param   {Object}    options
 * @public
 */
S.applyOptions = function(options) {
    lastOptions = apply({}, S.options);
    apply(S.options, options);
}

/**
 * Reverts to whatever the options were before applyOptions() was called.
 *
 * @public
 */
S.revertOptions = function() {
    apply(S.options, lastOptions);
}

/**
 * Initializes the Shadowbox environment. If options are given here, they
 * will override the defaults. A callback may be provided that will be called
 * when the document is ready. This function can be used for setting up links
 * using Shadowbox.setup.
 *
 * @param   {Object}    options
 * @param   {Function}  callback
 * @public
 */
S.init = function(options, callback) {
    if (initialized)
        return;

    initialized = true;

    if (S.skin.options)
        apply(S.options, S.skin.options);

    if (options)
        apply(S.options, options);

    if (!S.path) {
        // determine script path automatically
        var path, scripts = document.getElementsByTagName("script");
        for (var i = 0, len = scripts.length; i < len; ++i) {
            path = scriptPath.exec(scripts[i].src);
            if (path) {
                S.path = path[1];
                break;
            }
        }
    }

    if (callback)
        S.onReady = callback;

    bindLoad();
}

/**
 * Opens the given object in Shadowbox. This object may be any of the following:
 *
 * - A URL specifying the location of some content to display
 * - An HTML link object (A or AREA tag) that links to some content
 * - A custom object similar to one produced by Shadowbox.makeObject
 * - An array of any of the above
 *
 * Note: When a single link object is given, Shadowbox will automatically search
 * for other cached link objects that have been set up in the same gallery and
 * display them all together.
 *
 * @param   {mixed}     obj
 * @public
 */
S.open = function(obj) {
    if (open)
        return;

    var gc = S.makeGallery(obj);
    S.gallery = gc[0];
    S.current = gc[1];

    obj = S.getCurrent();

    if (obj == null)
        return;

    S.applyOptions(obj.options || {});

    filterGallery();

    // anything left to display?
    if (S.gallery.length) {
        obj = S.getCurrent();

        if (S.options.onOpen(obj) === false)
            return;

        open = true;

        S.skin.onOpen(obj, load);
    }
}

/**
 * Closes Shadowbox.
 *
 * @public
 */
S.close = function() {
    if (!open)
        return;

    open = false;

    if (S.player) {
        S.player.remove();
        S.player = null;
    }

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
    }
    slideDelay = 0;

    listenKeys(false);

    S.options.onClose(S.getCurrent());

    S.skin.onClose();

    S.revertOptions();
}

/**
 * Starts a slideshow when a gallery is being displayed. Is called automatically
 * when the slideshowDelay option is set to anything other than 0.
 *
 * @public
 */
S.play = function() {
    if (!S.hasNext())
        return;

    if (!slideDelay)
        slideDelay = S.options.slideshowDelay * 1000;

    if (slideDelay) {
        slideStart = now();
        slideTimer = setTimeout(function(){
            slideDelay = slideStart = 0; // reset slideshow
            S.next();
        }, slideDelay);

        if(S.skin.onPlay)
            S.skin.onPlay();
    }
}

/**
 * Pauses a slideshow on the current object.
 *
 * @public
 */
S.pause = function() {
    if (typeof slideTimer != "number")
        return;

    slideDelay = Math.max(0, slideDelay - (now() - slideStart));

    // if there's any time left on current slide, pause the timer
    if (slideDelay) {
        clearTimeout(slideTimer);
        slideTimer = "pause";

        if(S.skin.onPause)
            S.skin.onPause();
    }
}

/**
 * Changes Shadowbox to display the item in the gallery specified by index.
 *
 * @param   {Number}    index
 * @public
 */
S.change = function(index) {
    if (!(index in S.gallery)) {
        if (S.options.continuous) {
            index = (index < 0 ? S.gallery.length + index : 0); // loop
            if (!(index in S.gallery))
                return;
        } else {
            return;
        }
    }

    S.current = index;

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
        slideDelay = slideStart = 0;
    }

    S.options.onChange(S.getCurrent());

    load(true);
}

/**
 * Advances to the next item in the gallery.
 *
 * @public
 */
S.next = function() {
    S.change(S.current + 1);
}

/**
 * Rewinds to the previous gallery item.
 *
 * @public
 */
S.previous = function() {
    S.change(S.current - 1);
}

/**
 * Calculates the dimensions for Shadowbox.
 *
 * @param   {Number}    height          The height of the object
 * @param   {Number}    width           The width of the object
 * @param   {Number}    maxHeight       The maximum available height
 * @param   {Number}    maxWidth        The maximum available width
 * @param   {Number}    topBottom       The extra top/bottom required for borders/toolbars
 * @param   {Number}    leftRight       The extra left/right required for borders/toolbars
 * @param   {Number}    padding         The amount of padding (in pixels) to maintain around
 *                                      the edge of the viewport
 * @param   {Boolean}   preserveAspect  True to preserve the original aspect ratio when the
 *                                      given dimensions are too large
 * @return  {Object}                    The new dimensions object
 * @public
 */
S.setDimensions = function(height, width, maxHeight, maxWidth, topBottom, leftRight, padding, preserveAspect) {
    var originalHeight = height,
        originalWidth = width;

    // constrain height/width to max
    var extraHeight = 2 * padding + topBottom;
    if (height + extraHeight > maxHeight)
        height = maxHeight - extraHeight;
    var extraWidth = 2 * padding + leftRight;
    if (width + extraWidth > maxWidth)
        width = maxWidth - extraWidth;

    // determine if object is oversized
    var changeHeight = (originalHeight - height) / originalHeight,
        changeWidth = (originalWidth - width) / originalWidth,
        oversized = (changeHeight > 0 || changeWidth > 0);

    // adjust height/width if too large
    if (preserveAspect && oversized) {
        // preserve aspect ratio according to greatest change
        if (changeHeight > changeWidth) {
            width = Math.round((originalWidth / originalHeight) * height);
        } else if (changeWidth > changeHeight) {
            height = Math.round((originalHeight / originalWidth) * width);
        }
    }

    S.dimensions = {
        height:         height + topBottom,
        width:          width + leftRight,
        innerHeight:    height,
        innerWidth:     width,
        top:            Math.floor((maxHeight - (height + extraHeight)) / 2 + padding),
        left:           Math.floor((maxWidth - (width + extraWidth)) / 2 + padding),
        oversized:      oversized
    };

    return S.dimensions;
}

/**
 * Returns an array with two elements. The first is an array of objects that
 * constitutes the gallery, and the second is the index of the given object in
 * that array.
 *
 * @param   {mixed}     obj
 * @return  {Array}     An array containing the gallery and current index
 * @public
 */
S.makeGallery = function(obj) {
    var gallery = [], current = -1;

    if (typeof obj == "string")
        obj = [obj];

    if (typeof obj.length == "number") {
        each(obj, function(i, o) {
            if (o.content) {
                gallery[i] = o;
            } else {
                gallery[i] = {content: o};
            }
        });
        current = 0;
    } else {
        if (obj.tagName) {
            // check the cache for this object before building one on the fly
            var cacheObj = S.getCache(obj);
            obj = cacheObj ? cacheObj : S.makeObject(obj);
        }

        if (obj.gallery) {
            // gallery object, build gallery from cached gallery objects
            gallery = [];

            var o;
            for (var key in S.cache) {
                o = S.cache[key];
                if (o.gallery && o.gallery == obj.gallery) {
                    if (current == -1 && o.content == obj.content)
                        current = gallery.length;
                    gallery.push(o);
                }
            }

            if (current == -1) {
                gallery.unshift(obj);
                current = 0;
            }
        } else {
            // single object, no gallery
            gallery = [obj];
            current = 0;
        }
    }

    // use apply to break references to each gallery object here because
    // the code may modify certain properties of these objects from here
    // on out and we want to preserve the original in case the same object
    // is used again in a future call
    each(gallery, function(i, o) {
        gallery[i] = apply({}, o);
    });

    return [gallery, current];
}

/**
 * Extracts parameters from a link element and returns an object containing
 * (most of) the following keys:
 *
 * - content:  The URL of the linked to content
 * - player:   The abbreviated name of the player to use for the object (can automatically
 *             be determined in most cases)
 * - title:    The title to use for the object (optional)
 * - gallery:  The name of the gallery the object belongs to (optional)
 * - height:   The height of the object (in pixels, only required for movies and Flash)
 * - width:    The width of the object (in pixels, only required for movies and Flash)
 * - options:  A set of options to use for this object (optional)
 * - link:     A reference to the original link element
 *
 * A custom set of options may be passed in here that will be applied when
 * this object is displayed. However, any options that are specified in
 * the link's HTML markup will trump options given here.
 *
 * @param   {HTMLElement}   link
 * @param   {Object}        options
 * @return  {Object}        An object representing the link
 * @public
 */
S.makeObject = function(link, options) {
    var obj = {
        // accessing the href attribute directly here (instead of using
        // getAttribute) should give a full URL instead of a relative one
        content:    link.href,
        title:      link.getAttribute("title") || "",
        link:       link
    };

    // remove link-level options from top-level options
    if (options) {
        options = apply({}, options);
        each(["player", "title", "height", "width", "gallery"], function(i, o) {
            if (typeof options[o] != "undefined") {
                obj[o] = options[o];
                delete options[o];
            }
        });
        obj.options = options;
    } else {
        obj.options = {};
    }

    if (!obj.player)
        obj.player = S.getPlayer(obj.content);

    // HTML options always trump JavaScript options, so do these last
    var rel = link.getAttribute("rel");
    if (rel) {
        // extract gallery name from shadowbox[name] format
        var match = rel.match(galleryName);
        if (match)
            obj.gallery = escape(match[2]);

        // extract any other parameters
        each(rel.split(';'), function(i, p) {
            match = p.match(inlineParam);
            if (match)
                obj[match[1]] = match[2];
        });
    }

    return obj;
}

/**
 * Attempts to automatically determine the correct player to use for an object based
 * on its content attribute. Defaults to "iframe" when the content type cannot
 * automatically be determined.
 *
 * @param   {String}    content     The content attribute of the object
 * @return  {String}                The name of the player to use
 * @public
 */
S.getPlayer = function(content) {
    if (content.indexOf("#") > -1 && content.indexOf(document.location.href) == 0)
        return "inline";

    // strip query string for player detection purposes
    var q = content.indexOf("?");
    if (q > -1)
        content = content.substring(0, q);

    // get file extension
    var ext, m = content.match(fileExtension);
    if (m)
        ext = m[0].toLowerCase();

    if (ext) {
        if (S.img && S.img.ext.indexOf(ext) > -1)
            return "img";
        if (S.swf && S.swf.ext.indexOf(ext) > -1)
            return "swf";
        if (S.flv && S.flv.ext.indexOf(ext) > -1)
            return "flv";
        if (S.qt && S.qt.ext.indexOf(ext) > -1) {
            if (S.wmp && S.wmp.ext.indexOf(ext) > -1) {
                return "qtwmp"; // can be played by either QuickTime or Windows Media Player
            } else {
                return "qt";
            }
        }
        if (S.wmp && S.wmp.ext.indexOf(ext) > -1)
            return "wmp";
    }

    return "iframe";
}

/**
 * Filters the current gallery for unsupported objects.
 *
 * @private
 */
function filterGallery() {
    var err = S.errorInfo, plugins = S.plugins, obj, remove, needed,
        m, format, replace, inlineEl, flashVersion;

    for (var i = 0; i < S.gallery.length; ++i) {
        obj = S.gallery[i]

        remove = false; // remove the object?
        needed = null; // what plugins are needed?

        switch (obj.player) {
        case "flv":
        case "swf":
            if (!plugins.fla)
                needed = "fla";
            break;
        case "qt":
            if (!plugins.qt)
                needed = "qt";
            break;
        case "wmp":
            if (S.isMac) {
                if (plugins.qt && plugins.f4m) {
                    obj.player = "qt";
                } else {
                    needed = "qtf4m";
                }
            } else if (!plugins.wmp) {
                needed = "wmp";
            }
            break;
        case "qtwmp":
            if (plugins.qt) {
                obj.player = "qt";
            } else if (plugins.wmp) {
                obj.player = "wmp";
            } else {
                needed = "qtwmp";
            }
            break;
        }

        // handle unsupported elements
        if (needed) {
            if (S.options.handleUnsupported == "link") {
                // generate a link to the appropriate plugin download page(s)
                switch (needed) {
                case "qtf4m":
                    format = "shared";
                    replace = [err.qt.url, err.qt.name, err.f4m.url, err.f4m.name];
                    break;
                case "qtwmp":
                    format = "either";
                    replace = [err.qt.url, err.qt.name, err.wmp.url, err.wmp.name];
                    break;
                default:
                    format = "single";
                    replace = [err[needed].url, err[needed].name];
                }

                obj.player = "html";
                obj.content = '<div class="sb-message">' + sprintf(S.lang.errors[format], replace) + '</div>';
            } else {
                remove = true;
            }
        } else if (obj.player == "inline") {
            // inline element, retrieve innerHTML
            m = inlineId.exec(obj.content);
            if (m) {
                inlineEl = get(m[1]);
                if (inlineEl) {
                    obj.content = inlineEl.innerHTML;
                } else {
                    // cannot find element with id
                    remove = true;
                }
            } else {
                // cannot determine element id from content string
                remove = true;
            }
        } else if (obj.player == "swf" || obj.player == "flv") {
            flashVersion = (obj.options && obj.options.flashVersion) || S.options.flashVersion;

            if (S.flash && !S.flash.hasFlashPlayerVersion(flashVersion)) {
                // express install will be triggered because the client does not meet the
                // minimum required version of Flash. set height and width to those of expressInstall.swf
                obj.width = 310;
                // minimum height is 127, but +20 pixels on top and bottom looks better
                obj.height = 177;
            }
        }

        if (remove) {
            S.gallery.splice(i, 1);

            if (i < S.current) {
                --S.current; // maintain integrity of S.current
            } else if (i == S.current) {
                S.current = i > 0 ? i - 1 : i; // look for supported neighbor
            }

            // decrement index for next loop
            --i;
        }
    }
}

/**
 * Sets up a listener on the document for keydown events.
 *
 * @param   {Boolean}   on      True to enable the listener, false to disable
 * @private
 */
function listenKeys(on) {
    if (!S.options.enableKeys)
        return;

    (on ? addEvent : removeEvent)(document, "keydown", handleKey);
}

/**
 * A listener function that is fired when a key is pressed.
 *
 * @param   {Event}     e   The keydown event
 * @private
 */
function handleKey(e) {
    // don't handle events with modifier keys
    if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey)
        return;

    var code = keyCode(e), handler;

    switch (code) {
    case 81: // q
    case 88: // x
    case 27: // esc
        handler = S.close;
        break;
    case 37: // left
        handler = S.previous;
        break;
    case 39: // right
        handler = S.next;
        break;
    case 32: // space
        handler = typeof slideTimer == "number" ? S.pause : S.play;
        break;
    }

    if (handler) {
        preventDefault(e);
        handler();
    }
}

/**
 * Loads the current object.
 *
 * @param   {Boolean}   True if changing from a previous object
 * @private
 */
function load(changing) {
    listenKeys(false);

    var obj = S.getCurrent();

    // determine player, inline is really just html
    var player = (obj.player == "inline" ? "html" : obj.player);

    if (typeof S[player] != "function")
        throw "unknown player " + player;

    if (changing) {
        S.player.remove();
        S.revertOptions();
        S.applyOptions(obj.options || {});
    }

    S.player = new S[player](obj, S.playerId);

    // preload neighboring gallery images
    if (S.gallery.length > 1) {
        var next = S.gallery[S.current + 1] || S.gallery[0];
        if (next.player == "img") {
            var a = new Image();
            a.src = next.content;
        }
        var prev = S.gallery[S.current - 1] || S.gallery[S.gallery.length - 1];
        if (prev.player == "img") {
            var b = new Image();
            b.src = prev.content;
        }
    }

    S.skin.onLoad(changing, waitReady);
}

/**
 * Waits until the current object is ready to be displayed.
 *
 * @private
 */
function waitReady() {
    if (!open)
        return;

    if (typeof S.player.ready != "undefined") {
        // wait for content to be ready before loading
        var timer = setInterval(function() {
            if (open) {
                if (S.player.ready) {
                    clearInterval(timer);
                    timer = null;
                    S.skin.onReady(show);
                }
            } else {
                clearInterval(timer);
                timer = null;
            }
        }, 10);
    } else {
        S.skin.onReady(show);
    }
}

/**
 * Displays the current object.
 *
 * @private
 */
function show() {
    if (!open)
        return;

    S.player.append(S.skin.body, S.dimensions);

    S.skin.onShow(finish);
}

/**
 * Finishes up any remaining tasks after the object is displayed.
 *
 * @private
 */
function finish() {
    if (!open)
        return;

    if (S.player.onLoad)
        S.player.onLoad();

    S.options.onFinish(S.getCurrent());

    if (!S.isPaused())
        S.play(); // kick off next slide

    listenKeys(true);
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, from) {
        var len = this.length >>> 0;

        from = from || 0;
        if (from < 0)
            from += len;

        for (; from < len; ++from) {
            if (from in this && this[from] === obj)
                return from;
        }

        return -1;
    }
}

/**
 * Gets the current time in milliseconds.
 *
 * @return  {Number}
 * @private
 */
function now() {
    return (new Date).getTime();
}

/**
 * Applies all properties of extension to original.
 *
 * @param   {Object}    original
 * @param   {Object}    extension
 * @return  {Object}    The original object
 * @private
 */
function apply(original, extension) {
    for (var property in extension)
        original[property] = extension[property];
    return original;
}

/**
 * Calls the given callback function for each element in obj. Note: obj must be an array-like
 * object.
 *
 * @param   {Array|mixed}   obj
 * @param   {Function}      callback
 * @private
 */
function each(obj, callback) {
    var i = 0, len = obj.length;
    for (var value = obj[0]; i < len && callback.call(value, i, value) !== false; value = obj[++i]) {}
}

/**
 * Formats a string with the elements in the replacement array. The string should contain
 * tokens in the format {n} where n corresponds to the index of property name of the replacement
 * in the replace object.
 *
 * Example:
 *
 * format('Hello {0}', ['World']); // "Hello World"
 * format('Hello {world}', {world: "World"}); // "Hello World"
 *
 * @param   {String}        str         The format spec string
 * @param   {Array|Object}  replace     The array/object of replacement values
 * @return  {String}                    The formatted string
 * @private
 */
function sprintf(str, replace) {
    return str.replace(/\{(\w+?)\}/g, function(match, i) {
        return replace[i];
    });
}

/**
 * A no-op function.
 *
 * @private
 */
function noop() {}

/**
 * Gets the element with the given id.
 *
 * @param   {String}        id
 * @return  {HTMLElement}
 * @private
 */
function get(id) {
    return document.getElementById(id);
}

/**
 * Removes an element from the DOM.
 *
 * @param   {HTMLElement}   el          The element to remove
 * @private
 */
function remove(el) {
    el.parentNode.removeChild(el);
}

/**
 * True if this browser supports opacity.
 *
 * @type    {Boolean}
 * @private
 */
var supportsOpacity = true,

/**
 * True if the browser supports fixed positioning.
 *
 * @type    {Boolean}
 * @private
 */
supportsFixed = true;

/**
 * Checks the level of support the browser provides. Should be called when
 * the DOM is ready to be manipulated.
 *
 * @private
 */
function checkSupport() {
    var body = document.body,
        div = document.createElement("div");

    // detect opacity support
    supportsOpacity = typeof div.style.opacity === "string";

    // detect support for fixed positioning
    div.style.position = "fixed";
    div.style.margin = 0;
    div.style.top = "20px";
    body.appendChild(div, body.firstChild);
    supportsFixed = div.offsetTop == 20;
    body.removeChild(div);
}

/**
 * Gets the computed value of the style on the given element.
 *
 * Note: This function is not safe for retrieving float values or non-pixel values
 * in IE.
 *
 * @param   {HTMLElement}   el          The element
 * @param   {String}        style       The camel-cased name of the style
 * @return  {mixed}                     The computed value of the given style
 * @public
 */
S.getStyle = (function() {
    var opacity = /opacity=([^)]*)/,
        getComputedStyle = document.defaultView && document.defaultView.getComputedStyle;

    return function(el, style) {
        var ret;

        if (!supportsOpacity && style == "opacity" && el.currentStyle) {
            ret = opacity.test(el.currentStyle.filter || "") ? (parseFloat(RegExp.$1) / 100) + "" : "";
            return ret === "" ? "1" : ret;
        }

        if (getComputedStyle) {
            var computedStyle = getComputedStyle(el, null);

            if (computedStyle)
                ret = computedStyle[style];

            if (style == "opacity" && ret == "")
                ret = "1";
        } else {
            ret = el.currentStyle[style];
        }

        return ret;
    }
})();

/**
 * Appends an HTML fragment to the given element.
 *
 * @param   {HTMLElement}   el
 * @param   {String}        html    The HTML fragment to use
 * @public
 */
S.appendHTML = function(el, html) {
    if (el.insertAdjacentHTML) {
        el.insertAdjacentHTML("BeforeEnd", html);
    } else if (el.lastChild) {
        var range = el.ownerDocument.createRange();
        range.setStartAfter(el.lastChild);
        var frag = range.createContextualFragment(html);
        el.appendChild(frag);
    } else {
        el.innerHTML = html;
    }
}

/**
 * Gets the window size. The dimension may be either "Height" or "Width".
 *
 * @param   {String}    dimension
 * @return  {Number}
 * @public
 */
S.getWindowSize = function(dimension) {
    if (document.compatMode === "CSS1Compat")
        return document.documentElement["client" + dimension];

    return document.body["client" + dimension];
}

/**
 * Sets an element's opacity.
 *
 * @param   {HTMLElement}   el
 * @param   {Number}        opacity
 * @public
 */
S.setOpacity = function(el, opacity) {
    var style = el.style;
    if (supportsOpacity) {
        style.opacity = (opacity == 1 ? "" : opacity);
    } else {
        style.zoom = 1; // trigger hasLayout
        if (opacity == 1) {
            if (typeof style.filter == "string" && (/alpha/i).test(style.filter))
                style.filter = style.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
        } else {
            style.filter = (style.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
                " alpha(opacity=" + (opacity * 100) + ")";
        }
    }
}

/**
 * Clears the opacity setting on the given element. Needed for some cases in IE.
 *
 * @param   {HTMLElement}   el
 * @public
 */
S.clearOpacity = function(el) {
    S.setOpacity(el, 1);
}

/**
 * The base adapter for Shadowbox.
 */

/**
 * Gets the target of the given event. The event object passed will be
 * the same object that is passed to listeners registered with
 * addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {HTMLElement}       The event's target element
 * @private
 */
function getTarget(e) {
    var target = e.target ? e.target : e.srcElement;
    return target.nodeType == 3 ? target.parentNode : target;
}

/**
 * Gets the page X/Y coordinates of the mouse event in an [x, y] array.
 * The page coordinates should be relative to the document, and not the
 * viewport. The event object provided here will be the same object that
 * is passed to listeners registered with addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {Array}             The page X/Y coordinates
 * @private
 */
function getPageXY(e) {
    var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft)),
        y = e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
    return [x, y];
}

/**
 * Prevents the event's default behavior. The event object passed will
 * be the same object that is passed to listeners registered with
 * addEvent().
 *
 * @param   {Event}     e       The event object
 * @private
 */
function preventDefault(e) {
    e.preventDefault();
}

/**
 * Gets the key code of the given event object (keydown). The event
 * object here will be the same object that is passed to listeners
 * registered with addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {Number}            The key code of the event
 * @private
 */
function keyCode(e) {
    return e.which ? e.which : e.keyCode;
}

// Event handling functions below modified from original by Dean Edwards
// http://dean.edwards.name/my/events.js

/**
 * Adds an event handler to the given element. The handler should be called
 * in the scope of the element with the event object as its only argument.
 *
 * @param   {HTMLElement}   el          The element to listen to
 * @param   {String}        type        The type of the event to add
 * @param   {Function}      handler     The event handler function
 * @private
 */
function addEvent(el, type, handler) {
    if (el.addEventListener) {
        el.addEventListener(type, handler, false);
    } else {
        if (el.nodeType === 3 || el.nodeType === 8)
            return;

        if (el.setInterval && (el !== window && !el.frameElement))
            el = window;

        if (!handler.__guid)
            handler.__guid = addEvent.guid++;

        if (!el.events)
            el.events = {};

        var handlers = el.events[type];
        if (!handlers) {
            handlers = el.events[type] = {};

            if (el["on" + type])
                handlers[0] = el["on" + type];
        }

        handlers[handler.__guid] = handler;

        el["on" + type] = addEvent.handleEvent;
    }
}

addEvent.guid = 1;

addEvent.handleEvent = function(event) {
    var result = true;
    event = event || addEvent.fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    var handlers = this.events[event.type];

    for (var i in handlers) {
        this.__handleEvent = handlers[i];
        if (this.__handleEvent(event) === false)
            result = false;
    }

    return result;
}

addEvent.preventDefault = function() {
    this.returnValue = false;
}

addEvent.stopPropagation = function() {
    this.cancelBubble = true;
}

addEvent.fixEvent = function(e) {
    e.preventDefault = addEvent.preventDefault;
    e.stopPropagation = addEvent.stopPropagation;
    return e;
}

/**
 * Removes an event handler from the given element.
 *
 * @param   {HTMLElement}   el          The DOM element to stop listening to
 * @param   {String}        type        The type of the event to remove
 * @param   {Function}      handler     The event handler function
 * @private
 */
function removeEvent(el, type, handler) {
    if (el.removeEventListener) {
        el.removeEventListener(type, handler, false);
    } else {
        if (el.events && el.events[type])
            delete el.events[type][handler.__guid];
    }
}

// The code in this file is adapted for Shadowbox from the jQuery JavaScript library

/**
 * True if Shadowbox has been loaded into the DOM, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
var loaded = false,

/**
 * The callback function for the DOMContentLoaded browser event.
 *
 * @type    {Function}
 * @private
 */
DOMContentLoaded;

if (document.addEventListener) {
    DOMContentLoaded = function() {
        document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
        S.load();
    }
} else if (document.attachEvent) {
    DOMContentLoaded = function() {
        if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", DOMContentLoaded);
            S.load();
        }
    }
}

/**
 * A DOM ready check for IE.
 *
 * @private
 */
function doScrollCheck() {
    if (loaded)
        return;

    try {
        document.documentElement.doScroll("left");
    } catch (e) {
        setTimeout(doScrollCheck, 1);
        return;
    }

    S.load();
}

/**
 * Waits for the DOM to be ready before firing the given callback function.
 *
 * @param   {Function}  callback
 * @private
 */
function bindLoad() {
    if (document.readyState === "complete")
        return S.load();

    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
        window.addEventListener("load", S.load, false);
    } else if (document.attachEvent) {
        document.attachEvent("onreadystatechange", DOMContentLoaded);
        window.attachEvent("onload", S.load);

        var topLevel = false;
        try {
            topLevel = window.frameElement === null;
        } catch (e) {}

        if (document.documentElement.doScroll && topLevel)
            doScrollCheck();
    }
}

/**
 * Loads the Shadowbox code into the DOM. Is called automatically when the document
 * is ready.
 *
 * @public
 */
S.load = function() {
    if (loaded)
        return;

    if (!document.body)
        return setTimeout(S.load, 13);

    loaded = true;

    checkSupport();

    S.onReady();

    if (!S.options.skipSetup)
        S.setup();

    S.skin.init();
}

/**
 * Contains plugin support information. Each property of this object is a
 * boolean indicating whether that plugin is supported. Keys are:
 *
 * - fla: Flash player
 * - qt: QuickTime player
 * - wmp: Windows Media player
 * - f4m: Flip4Mac plugin
 *
 * @type    {Object}
 * @public
 */
S.plugins = {};

if (navigator.plugins && navigator.plugins.length) {
    var names = [];
    each(navigator.plugins, function(i, p) {
        names.push(p.name);
    });
    names = names.join(',');

    var f4m = names.indexOf('Flip4Mac') > -1;

    S.plugins = {
        fla:    names.indexOf('Shockwave Flash') > -1,
        qt:     names.indexOf('QuickTime') > -1,
        wmp:    !f4m && names.indexOf('Windows Media') > -1, // if it's Flip4Mac, it's not really WMP
        f4m:    f4m
    };
} else {
    var detectPlugin = function(name) {
        var axo;
        try {
            axo = new ActiveXObject(name);
        } catch(e) {}
        return !!axo;
    }

    S.plugins = {
        fla:    detectPlugin('ShockwaveFlash.ShockwaveFlash'),
        qt:     detectPlugin('QuickTime.QuickTime'),
        wmp:    detectPlugin('wmplayer.ocx'),
        f4m:    false
    };
}

// used to match the rel attribute of links
var relAttr = /^(light|shadow)box/i,

/**
 * The name of the expando property that Shadowbox uses on HTML elements
 * to store the cache index of that element.
 *
 * @type    {String}
 * @private
 */
expando = "shadowboxCacheKey",

/**
 * A unique id counter.
 *
 * @type    {Number}
 * @private
 */
cacheKey = 1;

/**
 * Contains all link objects that have been cached.
 *
 * @type    {Object}
 * @public
 */
S.cache = {};

/**
 * Resolves a link selector. The selector may be omitted to select all anchor elements
 * on the page with rel="shadowbox" or, if Shadowbox.find is used, it may be a single CSS
 * selector or an array of [selector, [context]].
 *
 * @param   {mixed}     selector
 * @return  {Array}     An array of matching link elements
 * @public
 */
S.select = function(selector) {
    var links = [];

    if (!selector) {
        var rel;
        each(document.getElementsByTagName("a"), function(i, el) {
            rel = el.getAttribute("rel");
            if (rel && relAttr.test(rel))
                links.push(el);
        });
    } else {
        var length = selector.length;
        if (length) {
            if (typeof selector == "string") {
                if (S.find)
                    links = S.find(selector); // css selector
            } else if (length == 2 && typeof selector[0] == "string" && selector[1].nodeType) {
                if (S.find)
                    links = S.find(selector[0], selector[1]); // css selector + context
            } else {
                // array of links (or node list)
                for (var i = 0; i < length; ++i)
                    links[i] = selector[i];
            }
        } else {
            links.push(selector); // single link
        }
    }

    return links;
}

/**
 * Adds all links specified by the given selector to the cache. If no selector
 * is provided, will select every anchor element on the page with rel="shadowbox".
 *
 * Note: Options given here apply only to links selected by the given selector.
 * Also, because <area> elements do not support the rel attribute, they must be
 * explicitly passed to this method.
 *
 * @param   {mixed}     selector
 * @param   {Object}    options     Some options to use for the given links
 * @public
 */
S.setup = function(selector, options) {
    each(S.select(selector), function(i, link) {
        S.addCache(link, options);
    });
}

/**
 * Removes all links specified by the given selector from the cache.
 *
 * @param   {mixed}     selector
 * @public
 */
S.teardown = function(selector) {
    each(S.select(selector), function(i, link) {
        S.removeCache(link);
    });
}

/**
 * Adds the given link element to the cache with the given options.
 *
 * @param   {HTMLElement}   link
 * @param   {Object}        options
 * @public
 */
S.addCache = function(link, options) {
    var key = link[expando];

    if (key == undefined) {
        key = cacheKey++;
        // assign cache key expando, use integer primitive to avoid memory leak in IE
        link[expando] = key;
        // add onclick listener
        addEvent(link, "click", handleClick);
    }

    S.cache[key] = S.makeObject(link, options);
}

/**
 * Removes the given link element from the cache.
 *
 * @param   {HTMLElement}   link
 * @public
 */
S.removeCache = function(link) {
    removeEvent(link, "click", handleClick);
    delete S.cache[link[expando]];
    link[expando] = null;
}

/**
 * Gets the object from cache representative of the given link element (if there is one).
 *
 * @param   {HTMLElement}   link
 * @return  {Object}
 * @public
 */
S.getCache = function(link) {
    var key = link[expando];
    return (key in S.cache && S.cache[key]);
}

/**
 * Removes all onclick listeners from elements that have previously been setup with
 * Shadowbox and clears all objects from cache.
 *
 * @public
 */
S.clearCache = function() {
    for (var key in S.cache)
        S.removeCache(S.cache[key].link);

    S.cache = {};
}

/**
 * Handles all clicks on links that have been set up to work with Shadowbox
 * and cancels the default event behavior when appropriate.
 *
 * @param   {Event}     e   The click event
 * @private
 */
function handleClick(e) {
    //preventDefault(e); // good for debugging

    S.open(this);

    if (S.gallery.length)
        preventDefault(e);
}

/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 *
 * Modified for inclusion in Shadowbox.js
 */
S.find = (function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	// Reset the position of the chunker regexp (start from head)
	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}

				set = posProcess( selector, set );
			}
		}
	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = part.toLowerCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			return match[1].toLowerCase();
		},
		CHILD: function(match){
			if ( match[1] === "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 === i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			} else {
				throw "Syntax error, unrecognized expression: " + name;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}
					if ( type === "first" ) {
						return true;
					}
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) {
							return false;
						}
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first === 0 ) {
						return diff === 0;
					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.compareDocumentPosition ? -1 : 1;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.sourceIndex ? -1 : 1;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.ownerDocument ? -1 : 1;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Utility function for retreiving the text value of an array of DOM nodes
function getText( elems ) {
	var ret = "", elem;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += getText( elem.childNodes );
		}
	}

	return ret;
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle, div = document.createElement("div");
		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}

		Sizzle = function(query, context, extra, seed){
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && context.nodeType === 9 && !isXML(context) ) {
				try {
					return makeArray( context.querySelectorAll(query), extra );
				} catch(e){}
			}

			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		div = null; // release memory in IE
	})();
}

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ? function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

//window.Sizzle = Sizzle;
return Sizzle;

})();

/*!
 * SWFObject v2.1 <http://code.google.com/p/swfobject/>
 * Copyright (c) 2007-2008 Geoff Stearns, Michael Williams, and Bobby van der Sluis
 * This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 * Modified for inclusion in Shadowbox.js
 */
S.flash = (function(){

var swfobject = function() {

	var UNDEF = "undefined",
		OBJECT = "object",
		SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
		FLASH_MIME_TYPE = "application/x-shockwave-flash",
		EXPRESS_INSTALL_ID = "SWFObjectExprInst",

		win = window,
		doc = document,
		nav = navigator,

		domLoadFnArr = [],
		regObjArr = [],
		objIdArr = [],
		listenersArr = [],
		script,
		timer = null,
		storedAltContent = null,
		storedAltContentId = null,
		isDomLoaded = false,
		isExpressInstallActive = false;

	/* Centralized function for browser feature detection
		- Proprietary feature detection (conditional compiling) is used to detect Internet Explorer's features
		- User agent string detection is only used when no alternative is possible
		- Is executed directly for optimal performance
	*/
	var ua = function() {
		var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
			playerVersion = [0,0,0],
			d = null;
		if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
			d = nav.plugins[SHOCKWAVE_FLASH].description;
			if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
				playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
				playerVersion[2] = /r/.test(d) ? parseInt(d.replace(/^.*r(.*)$/, "$1"), 10) : 0;
			}
		}
		else if (typeof win.ActiveXObject != UNDEF) {
			var a = null, fp6Crash = false;
			try {
				a = new ActiveXObject(SHOCKWAVE_FLASH_AX + ".7");
			}
			catch(e) {
				try {
					a = new ActiveXObject(SHOCKWAVE_FLASH_AX + ".6");
					playerVersion = [6,0,21];
					a.AllowScriptAccess = "always";	 // Introduced in fp6.0.47
				}
				catch(e) {
					if (playerVersion[0] == 6) {
						fp6Crash = true;
					}
				}
				if (!fp6Crash) {
					try {
						a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
					}
					catch(e) {}
				}
			}
			if (!fp6Crash && a) { // a will return null when ActiveX is disabled
				try {
					d = a.GetVariable("$version");	// Will crash fp6.0.21/23/29
					if (d) {
						d = d.split(" ")[1].split(",");
						playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				catch(e) {}
			}
		}
		var u = nav.userAgent.toLowerCase(),
			p = nav.platform.toLowerCase(),
			webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
			ie = false,
			windows = p ? /win/.test(p) : /win/.test(u),
			mac = p ? /mac/.test(p) : /mac/.test(u);
		/*@cc_on
			ie = true;
			@if (@_win32)
				windows = true;
			@elif (@_mac)
				mac = true;
			@end
		@*/
		return { w3cdom:w3cdom, pv:playerVersion, webkit:webkit, ie:ie, win:windows, mac:mac };
	}();

	/* Cross-browser onDomLoad
		- Based on Dean Edwards' solution: http://dean.edwards.name/weblog/2006/06/again/
		- Will fire an event as soon as the DOM of a page is loaded (supported by Gecko based browsers - like Firefox -, IE, Opera9+, Safari)
	*/
	var onDomLoad = function() {
		if (!ua.w3cdom) {
			return;
		}
		addDomLoadEvent(main);
		if (ua.ie && ua.win) {
			try {	 // Avoid a possible Operation Aborted error
				doc.write("<scr" + "ipt id=__ie_ondomload defer=true src=//:></scr" + "ipt>"); // String is split into pieces to avoid Norton AV to add code that can cause errors
				script = getElementById("__ie_ondomload");
				if (script) {
					addListener(script, "onreadystatechange", checkReadyState);
				}
			}
			catch(e) {}
		}
		if (ua.webkit && typeof doc.readyState != UNDEF) {
			timer = setInterval(function() { if (/loaded|complete/.test(doc.readyState)) { callDomLoadFunctions(); }}, 10);
		}
		if (typeof doc.addEventListener != UNDEF) {
			doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, null);
		}
		addLoadEvent(callDomLoadFunctions);
	}();

	function checkReadyState() {
		if (script.readyState == "complete") {
			script.parentNode.removeChild(script);
			callDomLoadFunctions();
		}
	}

	function callDomLoadFunctions() {
		if (isDomLoaded) {
			return;
		}
		if (ua.ie && ua.win) { // Test if we can really add elements to the DOM; we don't want to fire it too early
			var s = createElement("span");
			try { // Avoid a possible Operation Aborted error
				var t = doc.getElementsByTagName("body")[0].appendChild(s);
				t.parentNode.removeChild(t);
			}
			catch (e) {
				return;
			}
		}
		isDomLoaded = true;
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		var dl = domLoadFnArr.length;
		for (var i = 0; i < dl; i++) {
			domLoadFnArr[i]();
		}
	}

	function addDomLoadEvent(fn) {
		if (isDomLoaded) {
			fn();
		}
		else {
			domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
		}
	}

	/* Cross-browser onload
		- Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
		- Will fire an event as soon as a web page including all of its assets are loaded
	 */
	function addLoadEvent(fn) {
		if (typeof win.addEventListener != UNDEF) {
			win.addEventListener("load", fn, false);
		}
		else if (typeof doc.addEventListener != UNDEF) {
			doc.addEventListener("load", fn, false);
		}
		else if (typeof win.attachEvent != UNDEF) {
			addListener(win, "onload", fn);
		}
		else if (typeof win.onload == "function") {
			var fnOld = win.onload;
			win.onload = function() {
				fnOld();
				fn();
			};
		}
		else {
			win.onload = fn;
		}
	}

	/* Main function
		- Will preferably execute onDomLoad, otherwise onload (as a fallback)
	*/
	function main() { // Static publishing only
		var rl = regObjArr.length;
		for (var i = 0; i < rl; i++) { // For each registered object element
			var id = regObjArr[i].id;
			if (ua.pv[0] > 0) {
				var obj = getElementById(id);
				if (obj) {
					regObjArr[i].width = obj.getAttribute("width") ? obj.getAttribute("width") : "0";
					regObjArr[i].height = obj.getAttribute("height") ? obj.getAttribute("height") : "0";
					if (hasPlayerVersion(regObjArr[i].swfVersion)) { // Flash plug-in version >= Flash content version: Houston, we have a match!
						if (ua.webkit && ua.webkit < 312) { // Older webkit engines ignore the object element's nested param elements
							fixParams(obj);
						}
						setVisibility(id, true);
					}
					else if (regObjArr[i].expressInstall && !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac)) { // Show the Adobe Express Install dialog if set by the web page author and if supported (fp6.0.65+ on Win/Mac OS only)
						showExpressInstall(regObjArr[i]);
					}
					else { // Flash plug-in and Flash content version mismatch: display alternative content instead of Flash content
						displayAltContent(obj);
					}
				}
			}
			else {	// If no fp is installed, we let the object element do its job (show alternative content)
				setVisibility(id, true);
			}
		}
	}

	/* Fix nested param elements, which are ignored by older webkit engines
		- This includes Safari up to and including version 1.2.2 on Mac OS 10.3
		- Fall back to the proprietary embed element
	*/
	function fixParams(obj) {
		var nestedObj = obj.getElementsByTagName(OBJECT)[0];
		if (nestedObj) {
			var e = createElement("embed"), a = nestedObj.attributes;
			if (a) {
				var al = a.length;
				for (var i = 0; i < al; i++) {
					if (a[i].nodeName == "DATA") {
						e.setAttribute("src", a[i].nodeValue);
					}
					else {
						e.setAttribute(a[i].nodeName, a[i].nodeValue);
					}
				}
			}
			var c = nestedObj.childNodes;
			if (c) {
				var cl = c.length;
				for (var j = 0; j < cl; j++) {
					if (c[j].nodeType == 1 && c[j].nodeName == "PARAM") {
						e.setAttribute(c[j].getAttribute("name"), c[j].getAttribute("value"));
					}
				}
			}
			obj.parentNode.replaceChild(e, obj);
		}
	}

	/* Show the Adobe Express Install dialog
		- Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
	*/
	function showExpressInstall(regObj) {
		isExpressInstallActive = true;
		var obj = getElementById(regObj.id);
		if (obj) {
			if (regObj.altContentId) {
				var ac = getElementById(regObj.altContentId);
				if (ac) {
					storedAltContent = ac;
					storedAltContentId = regObj.altContentId;
				}
			}
			else {
				storedAltContent = abstractAltContent(obj);
			}
			if (!(/%$/.test(regObj.width)) && parseInt(regObj.width, 10) < 310) {
				regObj.width = "310";
			}
			if (!(/%$/.test(regObj.height)) && parseInt(regObj.height, 10) < 137) {
				regObj.height = "137";
			}
			doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
			var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn",
				dt = doc.title,
				fv = "MMredirectURL=" + win.location + "&MMplayerType=" + pt + "&MMdoctitle=" + dt,
				replaceId = regObj.id;
			// For IE when a SWF is loading (AND: not available in cache) wait for the onload event to fire to remove the original object element
			// In IE you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			if (ua.ie && ua.win && obj.readyState != 4) {
				var newObj = createElement("div");
				replaceId += "SWFObjectNew";
				newObj.setAttribute("id", replaceId);
				obj.parentNode.insertBefore(newObj, obj); // Insert placeholder div that will be replaced by the object element that loads expressinstall.swf
				obj.style.display = "none";
				var fn = function() {
					obj.parentNode.removeChild(obj);
				};
				addListener(win, "onload", fn);
			}
			createSWF({ data:regObj.expressInstall, id:EXPRESS_INSTALL_ID, width:regObj.width, height:regObj.height }, { flashvars:fv }, replaceId);
		}
	}

	/* Functions to abstract and display alternative content
	*/
	function displayAltContent(obj) {
		if (ua.ie && ua.win && obj.readyState != 4) {
			// For IE when a SWF is loading (AND: not available in cache) wait for the onload event to fire to remove the original object element
			// In IE you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			var el = createElement("div");
			obj.parentNode.insertBefore(el, obj); // Insert placeholder div that will be replaced by the alternative content
			el.parentNode.replaceChild(abstractAltContent(obj), el);
			obj.style.display = "none";
			var fn = function() {
				obj.parentNode.removeChild(obj);
			};
			addListener(win, "onload", fn);
		}
		else {
			obj.parentNode.replaceChild(abstractAltContent(obj), obj);
		}
	}

	function abstractAltContent(obj) {
		var ac = createElement("div");
		if (ua.win && ua.ie) {
			ac.innerHTML = obj.innerHTML;
		}
		else {
			var nestedObj = obj.getElementsByTagName(OBJECT)[0];
			if (nestedObj) {
				var c = nestedObj.childNodes;
				if (c) {
					var cl = c.length;
					for (var i = 0; i < cl; i++) {
						if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
							ac.appendChild(c[i].cloneNode(true));
						}
					}
				}
			}
		}
		return ac;
	}

	/* Cross-browser dynamic SWF creation
	*/
	function createSWF(attObj, parObj, id) {
		var r, el = getElementById(id);
		if (el) {
			if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
				attObj.id = id;
			}
			if (ua.ie && ua.win) { // IE, the object element and W3C DOM methods do not combine: fall back to outerHTML
				var att = "";
				for (var i in attObj) {
					if (attObj[i] != Object.prototype[i]) { // Filter out prototype additions from other potential libraries, like Object.prototype.toJSONString = function() {}
						if (i.toLowerCase() == "data") {
							parObj.movie = attObj[i];
						}
						else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							att += ' class="' + attObj[i] + '"';
						}
						else if (i.toLowerCase() != "classid") {
							att += ' ' + i + '="' + attObj[i] + '"';
						}
					}
				}
				var par = "";
				for (var j in parObj) {
					if (parObj[j] != Object.prototype[j]) { // Filter out prototype additions from other potential libraries
						par += '<param name="' + j + '" value="' + parObj[j] + '" />';
					}
				}
				el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
				objIdArr[objIdArr.length] = attObj.id; // Stored to fix object 'leaks' on unload (dynamic publishing only)
				r = getElementById(attObj.id);
			}
			else if (ua.webkit && ua.webkit < 312) { // Older webkit engines ignore the object element's nested param elements: fall back to the proprietary embed element
				var e = createElement("embed");
				e.setAttribute("type", FLASH_MIME_TYPE);
				for (var k in attObj) {
					if (attObj[k] != Object.prototype[k]) { // Filter out prototype additions from other potential libraries
						if (k.toLowerCase() == "data") {
							e.setAttribute("src", attObj[k]);
						}
						else if (k.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							e.setAttribute("class", attObj[k]);
						}
						else if (k.toLowerCase() != "classid") { // Filter out IE specific attribute
							e.setAttribute(k, attObj[k]);
						}
					}
				}
				for (var l in parObj) {
					if (parObj[l] != Object.prototype[l]) { // Filter out prototype additions from other potential libraries
						if (l.toLowerCase() != "movie") { // Filter out IE specific param element
							e.setAttribute(l, parObj[l]);
						}
					}
				}
				el.parentNode.replaceChild(e, el);
				r = e;
			}
			else { // Well-behaving browsers
				var o = createElement(OBJECT);
				o.setAttribute("type", FLASH_MIME_TYPE);
				for (var m in attObj) {
					if (attObj[m] != Object.prototype[m]) { // Filter out prototype additions from other potential libraries
						if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							o.setAttribute("class", attObj[m]);
						}
						else if (m.toLowerCase() != "classid") { // Filter out IE specific attribute
							o.setAttribute(m, attObj[m]);
						}
					}
				}
				for (var n in parObj) {
					if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // Filter out prototype additions from other potential libraries and IE specific param element
						createObjParam(o, n, parObj[n]);
					}
				}
				el.parentNode.replaceChild(o, el);
				r = o;
			}
		}
		return r;
	}

	function createObjParam(el, pName, pValue) {
		var p = createElement("param");
		p.setAttribute("name", pName);
		p.setAttribute("value", pValue);
		el.appendChild(p);
	}

	/* Cross-browser SWF removal
		- Especially needed to safely and completely remove a SWF in Internet Explorer
	*/
	function removeSWF(id) {
		var obj = getElementById(id);
		if (obj && (obj.nodeName == "OBJECT" || obj.nodeName == "EMBED")) {
			if (ua.ie && ua.win) {
				if (obj.readyState == 4) {
					removeObjectInIE(id);
				}
				else {
					win.attachEvent("onload", function() {
						removeObjectInIE(id);
					});
				}
			}
			else {
				obj.parentNode.removeChild(obj);
			}
		}
	}

	function removeObjectInIE(id) {
		var obj = getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}
	}

	/* Functions to optimize JavaScript compression
	*/
	function getElementById(id) {
		var el = null;
		try {
			el = doc.getElementById(id);
		}
		catch (e) {}
		return el;
	}

	function createElement(el) {
		return doc.createElement(el);
	}

	/* Updated attachEvent function for Internet Explorer
		- Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
	*/
	function addListener(target, eventType, fn) {
		target.attachEvent(eventType, fn);
		listenersArr[listenersArr.length] = [target, eventType, fn];
	}

	/* Flash Player and SWF content version matching
	*/
	function hasPlayerVersion(rv) {
		var pv = ua.pv, v = rv.split(".");
		v[0] = parseInt(v[0], 10);
		v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
		v[2] = parseInt(v[2], 10) || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	}

	/* Cross-browser dynamic CSS creation
		- Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
	*/
	function createCSS(sel, decl) {
		if (ua.ie && ua.mac) {
			return;
		}
		var h = doc.getElementsByTagName("head")[0], s = createElement("style");
		s.setAttribute("type", "text/css");
		s.setAttribute("media", "screen");
		if (!(ua.ie && ua.win) && typeof doc.createTextNode != UNDEF) {
			s.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
		}
		h.appendChild(s);
		if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
			var ls = doc.styleSheets[doc.styleSheets.length - 1];
			if (typeof ls.addRule == OBJECT) {
				ls.addRule(sel, decl);
			}
		}
	}

	function setVisibility(id, isVisible) {
		var v = isVisible ? "visible" : "hidden";
		if (isDomLoaded && getElementById(id)) {
			getElementById(id).style.visibility = v;
		}
		else {
			createCSS("#" + id, "visibility:" + v);
		}
	}

	/* Filter to avoid XSS attacks
	*/
	function urlEncodeIfNecessary(s) {
		var regex = /[\\\"<>\.;]/;
		var hasBadChars = regex.exec(s) != null;
		return hasBadChars ? encodeURIComponent(s) : s;
	}

	/* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
	*/
	var cleanup = function() {
		if (ua.ie && ua.win) {
			window.attachEvent("onunload", function() {
				// remove listeners to avoid memory leaks
				var ll = listenersArr.length;
				for (var i = 0; i < ll; i++) {
					listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
				}
				// cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
				var il = objIdArr.length;
				for (var j = 0; j < il; j++) {
					removeSWF(objIdArr[j]);
				}
				// cleanup library's main closures to avoid memory leaks
				for (var k in ua) {
					ua[k] = null;
				}
				ua = null;
				for (var l in swfobject) {
					swfobject[l] = null;
				}
				swfobject = null;
			});
		}
	}();


	return {
		/* Public API
			- Reference: http://code.google.com/p/swfobject/wiki/SWFObject_2_0_documentation
		*/
		registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr) {
			if (!ua.w3cdom || !objectIdStr || !swfVersionStr) {
				return;
			}
			var regObj = {};
			regObj.id = objectIdStr;
			regObj.swfVersion = swfVersionStr;
			regObj.expressInstall = xiSwfUrlStr ? xiSwfUrlStr : false;
			regObjArr[regObjArr.length] = regObj;
			setVisibility(objectIdStr, false);
		},

		getObjectById: function(objectIdStr) {
			var r = null;
			if (ua.w3cdom) {
				var o = getElementById(objectIdStr);
				if (o) {
					var n = o.getElementsByTagName(OBJECT)[0];
					if (!n || (n && typeof o.SetVariable != UNDEF)) {
							r = o;
					}
					else if (typeof n.SetVariable != UNDEF) {
						r = n;
					}
				}
			}
			return r;
		},

		embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj) {
			if (!ua.w3cdom || !swfUrlStr || !replaceElemIdStr || !widthStr || !heightStr || !swfVersionStr) {
				return;
			}
			widthStr += ""; // Auto-convert to string
			heightStr += "";
			if (hasPlayerVersion(swfVersionStr)) {
				setVisibility(replaceElemIdStr, false);
				var att = {};
				if (attObj && typeof attObj === OBJECT) {
					for (var i in attObj) {
						if (attObj[i] != Object.prototype[i]) { // Filter out prototype additions from other potential libraries
							att[i] = attObj[i];
						}
					}
				}
				att.data = swfUrlStr;
				att.width = widthStr;
				att.height = heightStr;
				var par = {};
				if (parObj && typeof parObj === OBJECT) {
					for (var j in parObj) {
						if (parObj[j] != Object.prototype[j]) { // Filter out prototype additions from other potential libraries
							par[j] = parObj[j];
						}
					}
				}
				if (flashvarsObj && typeof flashvarsObj === OBJECT) {
					for (var k in flashvarsObj) {
						if (flashvarsObj[k] != Object.prototype[k]) { // Filter out prototype additions from other potential libraries
							if (typeof par.flashvars != UNDEF) {
								par.flashvars += "&" + k + "=" + flashvarsObj[k];
							}
							else {
								par.flashvars = k + "=" + flashvarsObj[k];
							}
						}
					}
				}
				addDomLoadEvent(function() {
					createSWF(att, par, replaceElemIdStr);
					if (att.id == replaceElemIdStr) {
						setVisibility(replaceElemIdStr, true);
					}
				});
			}
			else if (xiSwfUrlStr && !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac)) {
				isExpressInstallActive = true; // deferred execution
				setVisibility(replaceElemIdStr, false);
				addDomLoadEvent(function() {
					var regObj = {};
					regObj.id = regObj.altContentId = replaceElemIdStr;
					regObj.width = widthStr;
					regObj.height = heightStr;
					regObj.expressInstall = xiSwfUrlStr;
					showExpressInstall(regObj);
				});
			}
		},

		getFlashPlayerVersion: function() {
			return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
		},

		hasFlashPlayerVersion: hasPlayerVersion,

		createSWF: function(attObj, parObj, replaceElemIdStr) {
			if (ua.w3cdom) {
				return createSWF(attObj, parObj, replaceElemIdStr);
			}
			else {
				return undefined;
			}
		},

		removeSWF: function(objElemIdStr) {
			if (ua.w3cdom) {
				removeSWF(objElemIdStr);
			}
		},

		createCSS: function(sel, decl) {
			if (ua.w3cdom) {
				createCSS(sel, decl);
			}
		},

		addDomLoadEvent: addDomLoadEvent,

		addLoadEvent: addLoadEvent,

		getQueryParamValue: function(param) {
			var q = doc.location.search || doc.location.hash;
			if (param == null) {
				return urlEncodeIfNecessary(q);
			}
			if (q) {
				var pairs = q.substring(1).split("&");
				for (var i = 0; i < pairs.length; i++) {
					if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
						return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
					}
				}
			}
			return "";
		},

		// For internal usage only
		expressInstallCallback: function() {
			if (isExpressInstallActive && storedAltContent) {
				var obj = getElementById(EXPRESS_INSTALL_ID);
				if (obj) {
					obj.parentNode.replaceChild(storedAltContent, obj);
					if (storedAltContentId) {
						setVisibility(storedAltContentId, true);
						if (ua.ie && ua.win) {
							storedAltContent.style.display = "block";
						}
					}
					storedAltContent = null;
					storedAltContentId = null;
					isExpressInstallActive = false;
				}
			}
		}
	};
}();

return swfobject;

})();

/**
 * The English language translation for Shadowbox.
 */

S.lang = {
    code:       'en',
    of:         'of',
    loading:    'loading',
    cancel:     'Cancel',
    next:       'Next',
    previous:   'Previous',
    play:       'Play',
    pause:      'Pause',
    close:      'Close',
    errors:     {
        single: 'You must install the <a href="{0}">{1}</a> browser plugin to view this content.',
        shared: 'You must install both the <a href="{0}">{1}</a> and <a href="{2}">{3}</a> browser plugins to view this content.',
        either: 'You must install either the <a href="{0}">{1}</a> or the <a href="{2}">{3}</a> browser plugin to view this content.'
    }
}

/**
 * The FLV player for Shadowbox.
 */

/**
 * The height (in pixels) of the JW FLV player controller.
 *
 * @type    {Number}
 * @private
 */
var jwControllerHeight = 20;

/**
 * Constructor. The Flash video player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.flv = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += jwControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.flv.ext = ["flv", "m4v"];

S.flv.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        // append temporary content element to replace
        var tmp = document.createElement('div');
        tmp.id = this.id;
        body.appendChild(tmp);

        var height = dims.innerHeight,
            width = dims.innerWidth,
            swf = S.path + "player.swf",
            version = S.options.flashVersion,
            express = S.path + "expressInstall.swf",
            flashvars = apply({
                file:       this.obj.content,
                height:     height,
                width:      width,
                autostart:  (S.options.autoplayMovies ? "true" : "false"),
                controlbar: (S.options.showMovieControls ? "bottom" : "none"),
                backcolor:  "0x000000",
                frontcolor: "0xCCCCCC",
                lightcolor: "0x557722"
            }, S.options.flashVars),
            params = S.options.flashParams;

        S.flash.embedSWF(swf, this.id, width, height, version, express, flashvars, params);
    },

    /**
     * Removes this movie from the document.
     *
     * @public
     */
    remove: function() {
        // call express install callback here in case express install is
        // active and user has not selected anything
        S.flash.expressInstallCallback();
        S.flash.removeSWF(this.id);
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions,
            el = get(this.id);
        el.height = dims.innerHeight;
        el.width = dims.innerWidth;
    }

}

/**
 * The HTML player for Shadowbox.
 */

/**
 * Constructor. The HTML player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.html = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height defaults to 300, width defaults to 500
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    this.width = obj.width ? parseInt(obj.width, 10) : 500;
}

S.html.prototype = {

    /**
     * Appends this object to the DOM.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var div = document.createElement("div");
        div.id = this.id;
        div.className = "html"; // give special class to enable scrolling
        div.innerHTML = this.obj.content;

        body.appendChild(div);
    },

    /**
     * Removes this object from the DOM.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el)
            remove(el);
    }

}

/**
 * The iframe player for Shadowbox.
 */

/**
 * Constructor. The iframe player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.iframe = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to full viewport height/width
    var overlay = get("sb-overlay");
    this.height = obj.height ? parseInt(obj.height, 10) : overlay.offsetHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : overlay.offsetWidth;
}

S.iframe.prototype = {

    /**
     * Appends this iframe to the DOM.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var html = '<iframe id="' + this.id + '" name="' + this.id + '" height="100%" ' +
            'width="100%" frameborder="0" marginwidth="0" marginheight="0" ' +
            'style="visibility:hidden" onload="this.style.visibility=\'visible\'" ' +
            'scrolling="auto"';

        if (S.isIE) {
            // prevent brief whiteout while loading iframe source
            html += ' allowtransparency="true"';

            // prevent "secure content" warning for https on IE6
            // see http://www.zachleat.com/web/2007/04/24/adventures-in-i-frame-shims-or-how-i-learned-to-love-the-bomb/
            if (S.isIE6)
                html += ' src="javascript:false;document.write(\'\');"';
        }

        html += '></iframe>';

        // use innerHTML method of insertion here instead of appendChild
        // because IE renders frameborder otherwise
        body.innerHTML = html;
    },

    /**
     * Removes this iframe from the DOM.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el) {
            remove(el);
            if (S.isGecko)
                delete window.frames[this.id]; // needed for Firefox
        }
    },

    /**
     * An optional callback function to process after this content has been loaded.
     *
     * @public
     */
    onLoad: function() {
        var win = S.isIE ? get(this.id).contentWindow : window.frames[this.id];
        win.location.href = this.obj.content;
    }

}

/**
 * The image player for Shadowbox.
 */

/**
 * Resource used to preload images. It's class-level so that when a new image is requested,
 * the same resource can be reassigned, cancelling the original's callback.
 *
 * @type    {Image}
 * @private
 */
var pre,

/**
 * The id to use for the drag proxy element.
 *
 * @type    {String}
 * @private
 */
proxyId = "sb-drag-proxy",

/**
 * Keeps track of 4 floating values (x, y, startx, & starty) that are used in the drag calculations.
 *
 * @type    {Object}
 * @private
 */
dragData,

/**
 * The transparent element that is used to listen for drag events.
 *
 * @type    {HTMLElement}
 * @private
 */
dragProxy,

/**
 * The draggable element.
 *
 * @type    {HTMLElement}
 * @private
 */
dragTarget;

/**
 * Resets the class drag variable.
 *
 * @private
 */
function resetDrag() {
    dragData = {
        x:      0,
        y:      0,
        startX: null,
        startY: null
    };
}

/**
 * Updates the drag proxy dimensions.
 *
 * @private
 */
function updateProxy() {
    var dims = S.dimensions;
    apply(dragProxy.style, {
        height: dims.innerHeight + "px",
        width: dims.innerWidth + "px"
    });
}

/**
 * Enables a transparent drag layer on top of images.
 *
 * @private
 */
function enableDrag() {
    resetDrag();

    // add transparent proxy layer to prevent browser dragging of actual image
    var style = [
        "position:absolute",
        "cursor:" + (S.isGecko ? "-moz-grab" : "move"),
        "background-color:" + (S.isIE ? "#fff;filter:alpha(opacity=0)" : "transparent")
    ].join(";");
    S.appendHTML(S.skin.body, '<div id="' + proxyId + '" style="' + style + '"></div>');

    dragProxy = get(proxyId);
    updateProxy();

    addEvent(dragProxy, "mousedown", startDrag);
}

/**
 * Disables the drag layer.
 *
 * @private
 */
function disableDrag() {
    if (dragProxy) {
        removeEvent(dragProxy, "mousedown", startDrag);
        remove(dragProxy);
        dragProxy = null;
    }

    dragTarget = null;
}

/**
 * Sets up a drag listener on the document.
 *
 * @param   {Event}     e   The mousedown event
 * @private
 */
function startDrag(e) {
    // prevent browser dragging
    preventDefault(e);

    var xy = getPageXY(e);
    dragData.startX = xy[0];
    dragData.startY = xy[1];

    dragTarget = get(S.player.id);

    addEvent(document, "mousemove", positionDrag);
    addEvent(document, "mouseup", endDrag);

    if (S.isGecko)
        dragProxy.style.cursor = "-moz-grabbing";
}

/**
 * Positions an oversized image on drag.
 *
 * @param   {Event}     e   The mousemove event
 * @private
 */
function positionDrag(e) {
    var player = S.player,
        dims = S.dimensions,
        xy = getPageXY(e);

    var moveX = xy[0] - dragData.startX;
    dragData.startX += moveX;
    dragData.x = Math.max(Math.min(0, dragData.x + moveX), dims.innerWidth - player.width);

    var moveY = xy[1] - dragData.startY;
    dragData.startY += moveY;
    dragData.y = Math.max(Math.min(0, dragData.y + moveY), dims.innerHeight - player.height);

    apply(dragTarget.style, {
        left: dragData.x + "px",
        top: dragData.y + "px"
    });
}

/**
 * Removes the drag listener from the document.
 *
 * @private
 */
function endDrag() {
    removeEvent(document, "mousemove", positionDrag);
    removeEvent(document, "mouseup", endDrag);

    if (S.isGecko)
        dragProxy.style.cursor = "-moz-grab";
}

/**
 * Constructor. The image player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.img = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // preload the image
    this.ready = false;
    var self = this;
    pre = new Image();
    pre.onload = function() {
        // height/width defaults to image height/width
        self.height = obj.height ? parseInt(obj.height, 10) : pre.height;
        self.width = obj.width ? parseInt(obj.width, 10) : pre.width;

        // ready to go
        self.ready = true;

        // clean up to prevent memory leak in IE
        pre.onload = null;
        pre = null;
    }
    pre.src = obj.content;
}

S.img.ext = ["bmp", "gif", "jpg", "jpeg", "png"];

S.img.prototype = {

    /**
     * Appends this image to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var img = document.createElement("img");
        img.id = this.id;
        img.src = this.obj.content;
        img.style.position = "absolute";

        var height, width;
        if (dims.oversized && S.options.handleOversize == "resize") {
            height = dims.innerHeight;
            width = dims.innerWidth;
        } else {
            height = this.height;
            width = this.width;
        }

        // need to use setAttribute here for IE's sake
        img.setAttribute("height", height);
        img.setAttribute("width", width);

        body.appendChild(img);
    },

    /**
     * Removes this image from the document.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el)
            remove(el);

        disableDrag();

        // prevent old image requests from loading
        if (pre) {
            pre.onload = null;
            pre = null;
        }
    },

    /**
     * An optional callback function to process after this content has been
     * loaded.
     *
     * @public
     */
    onLoad: function() {
        var dims = S.dimensions;

        // listen for drag when image is oversized
        if (dims.oversized && S.options.handleOversize == "drag")
            enableDrag();
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions;

        switch (S.options.handleOversize) {
        case "resize":
            var el = get(this.id);
            el.height = dims.innerHeight;
            el.width = dims.innerWidth;
            break;
        case "drag":
            if (dragTarget) {
                var top = parseInt(S.getStyle(dragTarget, "top")),
                    left = parseInt(S.getStyle(dragTarget, "left"));

                // fix positioning when viewport is enlarged
                if (top + this.height < dims.innerHeight)
                    dragTarget.style.top = dims.innerHeight - this.height + "px";
                if (left + this.width < dims.innerWidth)
                    dragTarget.style.left = dims.innerWidth - this.width + "px";

                updateProxy();
            }
            break;
        }
    }

}

/**
 * The QuickTime player for Shadowbox.
 */

/**
 * The height (in pixels) of the QuickTime controller.
 *
 * @type    {Number}
 * @private
 */
var qtControllerHeight = 16;

/**
 * Constructor. The QuickTime player class for Shadowbox.
 *
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.qt = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += qtControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.qt.ext = ["dv", "mov", "moov", "movie", "mp4", "avi", "mpg", "mpeg"];

S.qt.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var opt = S.options,
            autoplay = String(opt.autoplayMovies),
            controls = String(opt.showMovieControls);

        var html = "<object",
            movie = {
                id:         this.id,
                name:       this.id,
                height:     this.height,
                width:      this.width,
                kioskmode:  "true"
            };

        if (S.isIE) {
            movie.classid = "clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B";
            movie.codebase = "http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0";
        } else {
            movie.type = "video/quicktime";
            movie.data = this.obj.content;
        }

        for (var m in movie)
            html += " " + m + '="' + movie[m] + '"';
        html += ">";

        var params = {
            src:        this.obj.content,
            scale:      "aspect",
            controller: controls,
            autoplay:   autoplay
        };

        for (var p in params)
            html += '<param name="' + p + '" value="' + params[p] + '">';
        html += "</object>";

        body.innerHTML = html;
    },

    /**
     * Removes this movie from the DOM.
     *
     * @public
     */
    remove: function() {
        try {
            document[this.id].Stop(); // stop QT video stream
        } catch(e) {}

        var el = get(this.id);
        if (el)
            remove(el);
    }

}

/**
 * The SWF player for Shadowbox.
 */

/**
 * Constructor. The SWF movie player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.swf = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.swf.ext = ["swf"];

S.swf.prototype = {

    /**
     * Appends this swf to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims){
        // append temporary content element to replace
        var tmp = document.createElement("div");
        tmp.id = this.id;
        body.appendChild(tmp);

        var height = dims.innerHeight,
            width = dims.innerWidth,
            swf = this.obj.content,
            version = S.options.flashVersion,
            express = S.path + "expressInstall.swf",
            flashvars = S.options.flashVars,
            params = S.options.flashParams;

        S.flash.embedSWF(swf, this.id, width, height, version, express, flashvars, params);
    },

    /**
     * Removes this swf from the document.
     *
     * @public
     */
    remove: function() {
        // call express install callback here in case express install is
        // active and user has not selected anything
        S.flash.expressInstallCallback();
        S.flash.removeSWF(this.id);
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions,
            el = get(this.id);
        el.height = dims.innerHeight;
        el.width = dims.innerWidth;
    }

}

/**
 * The WMP player for Shadowbox.
 */

/**
 * The height (in pixels) of the Windows Media Player controller.
 *
 * @type    {Number}
 * @private
 */
var wmpControllerHeight = (S.isIE ? 70 : 45);

/**
 * Constructor. The Windows Media player class for Shadowbox.
 *
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.wmp = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += wmpControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.wmp.ext = ["asf", "avi", "mpg", "mpeg", "wm", "wmv"];

S.wmp.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var opt = S.options,
            autoplay = opt.autoplayMovies ? 1 : 0;

        var movie = '<object id="' + this.id +
            '" name="' + this.id +
            '" height="' + this.height +
            '" width="' + this.width + '"',
            params = { autostart: opt.autoplayMovies ? 1 : 0 };

        if (S.isIE) {
            // movie += ' type="application/x-oleobject"';
            movie += ' classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6"';
            params.url = this.obj.content;
            params.uimode = opt.showMovieControls ? "full" : "none";
        } else {
            movie += ' type="video/x-ms-wmv"';
            movie += ' data="' + this.obj.content + '"'
            params.showcontrols = opt.showMovieControls ? 1 : 0;
        }

        movie += ">";

        for (var p in params)
            movie += '<param name="' + p + '" value="' + params[p] + '">';

        movie += "</object>";

        body.innerHTML = movie;
    },

    /**
     * Removes this movie from the document.
     *
     * @return  void
     * @public
     */
    remove: function(){
        if (S.isIE) {
            try {
                window[this.id].controls.stop(); // stop the movie
                window[this.id].URL = "movie" + now() + ".wmv"; // force player refresh
                window[this.id] = function(){}; // remove from window object
            } catch(e) {}
        }

        var el = get(this.id);
        if (el) {
            // using setTimeout here prevents browser crashes with WMP
            setTimeout(function() {
                remove(el);
            }, 10);
        }
    }

}

/**
 * Keeps track of whether or not the overlay is activated.
 *
 * @type    {Boolean}
 * @private
 */
var overlayOn = false,

/**
 * A cache of elements that are troublesome for modal overlays.
 *
 * @type    {Array}
 * @private
 */
visibilityCache = [],

/**
 * Id's of elements that need transparent PNG support.
 *
 * @type    {Array}
 * @private
 */
pngIds = [
    "sb-nav-close",
    "sb-nav-next",
    "sb-nav-play",
    "sb-nav-pause",
    "sb-nav-previous"
],

/**
 * The container element.
 *
 * @type    {HTMLElement}
 * @private
 */
container,

/**
 * The overlay element.
 *
 * @type    {HTMLElement}
 * @private
 */
overlay,

/**
 * The wrapper element.
 *
 * @type    {HTMLElement}
 * @private
 */
wrapper,

/**
 * True if the window resize event is allowed to fire.
 *
 * @type    {Boolean}
 * @private
 */
doWindowResize = true;

/**
 * Animates the given property of el to the given value over a specified duration. If a
 * callback is provided, it will be called when the animation is finished.
 *
 * @param   {HTMLElement}   el
 * @param   {String}        property
 * @param   {mixed}         to
 * @param   {Number}        duration
 * @param   {Function}      callback
 * @private
 */
function animate(el, property, to, duration, callback) {
    var isOpacity = (property == "opacity"),
    anim = isOpacity ? S.setOpacity : function(el, value) {
        // default unit is px for properties other than opacity
        el.style[property] = "" +
            value + "px";
    };

    if (duration == 0 || (!isOpacity && !S.options.animate) || (isOpacity && !S.options.animateFade)) {
        anim(el, to);
        if (callback)
            callback();
        return;
    }

    var from = parseFloat(S.getStyle(el, property)) || 0;
    var delta = to - from;
    if (delta == 0) {
        if (callback)
            callback();
        return; // nothing to animate
    }

    duration *= 1000; // convert to milliseconds

    var begin = now(),
        ease = S.ease,
        end = begin + duration,
        time;

    var interval = setInterval(function() {
        time = now();
        if (time >= end) {
            clearInterval(interval);
            interval = null;
            anim(el, to);
            if (callback)
                callback();
        } else {
            anim(el, from + ease((time - begin) / duration) * delta);
        }
    }, 10); // 10 ms interval is minimum on WebKit
}

/**
 * Sets the size of the container element.
 *
 * @private
 */
function setSize() {
    container.style.height = S.getWindowSize("Height") + "px";
    container.style.width = S.getWindowSize("Width") + "px";
}

/**
 * Sets the top of the container element. This is only necessary in browsers that
 * don't support fixed positioning, such as IE6.
 *
 * @private
 */
function setPosition() {
    container.style.top = document.documentElement.scrollTop + "px";
    container.style.left = document.documentElement.scrollLeft + "px";
}

/**
 * Toggles the visibility of elements that are troublesome for overlays.
 *
 * @param   {Boolean}   on  True to make visible, false to hide
 * @private
 */
function toggleTroubleElements(on) {
    if (on) {
        each(visibilityCache, function(i, el){
            el[0].style.visibility = el[1] || '';
        });
    } else {
        visibilityCache = [];
        each(S.options.troubleElements, function(i, tag) {
            each(document.getElementsByTagName(tag), function(j, el) {
                visibilityCache.push([el, el.style.visibility]);
                el.style.visibility = "hidden";
            });
        });
    }
}

/**
 * Toggles the display of the nav control with the given id.
 *
 * @param   {String}    id      The id of the navigation control
 * @param   {Boolean}   on      True to toggle on, false to toggle off
 * @private
 */
function toggleNav(id, on) {
    var el = get("sb-nav-" + id);
    if (el)
        el.style.display = on ? "" : "none";
}

/**
 * Toggles the visibility of the loading layer.
 *
 * @param   {Boolean}   on          True to toggle on, false to toggle off
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function toggleLoading(on, callback) {
    var loading = get("sb-loading"),
        playerName = S.getCurrent().player,
        anim = (playerName == "img" || playerName == "html"); // fade on images & html

    if (on) {
        S.setOpacity(loading, 0);
        loading.style.display = "block";

        var wrapped = function() {
            S.clearOpacity(loading);
            if (callback)
                callback();
        }

        if (anim) {
            animate(loading, "opacity", 1, S.options.fadeDuration, wrapped);
        } else {
            wrapped();
        }
    } else {
        var wrapped = function() {
            loading.style.display = "none";
            S.clearOpacity(loading);
            if (callback)
                callback();
        }

        if (anim) {
            animate(loading, "opacity", 0, S.options.fadeDuration, wrapped);
        } else {
            wrapped();
        }
    }
}

/**
 * Builds the content for the title and information bars.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function buildBars(callback) {
    var obj = S.getCurrent();

    get("sb-title-inner").innerHTML = obj.title || "";

    // build the nav
    var close, next, play, pause, previous;
    if (S.options.displayNav) {
        close = true;
        var len = S.gallery.length;
        if (len > 1) {
            if (S.options.continuous) {
                next = previous = true;
            } else {
                next = (len - 1) > S.current; // not last in gallery, show next
                previous = S.current > 0; // not first in gallery, show previous
            }
        }
        // in a slideshow?
        if (S.options.slideshowDelay > 0 && S.hasNext()) {
            pause = !S.isPaused();
            play = !pause;
        }
    } else {
        close = next = play = pause = previous = false;
    }
    toggleNav("close", close);
    toggleNav("next", next);
    toggleNav("play", play);
    toggleNav("pause", pause);
    toggleNav("previous", previous);

    // build the counter
    var counter = "";
    if (S.options.displayCounter && S.gallery.length > 1) {
        var len = S.gallery.length;
        if (S.options.counterType == "skip") {
            // limit the counter?
            var i = 0,
                end = len,
                limit = parseInt(S.options.counterLimit) || 0;

            if (limit < len && limit > 2) { // support large galleries
                var h = Math.floor(limit / 2);
                i = S.current - h;
                if (i < 0)
                    i += len;
                end = S.current + (limit - h);
                if (end > len)
                    end -= len;
            }

            while (i != end) {
                if (i == len)
                    i = 0;
                counter += '<a onclick="Shadowbox.change(' + i + ');"'
                if (i == S.current)
                    counter += ' class="sb-counter-current"';
                counter += ">" + (++i) + "</a>";
            }
        } else {
            counter = [S.current + 1, S.lang.of, len].join(' ');
        }
    }

    get("sb-counter").innerHTML = counter;

    callback();
}

/**
 * Shows the title and info bars.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function showBars(callback) {
    var titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        duration = 0.35;

    // clear visibility before animating into view
    titleInner.style.visibility = infoInner.style.visibility = "";

    if (titleInner.innerHTML != "")
        animate(titleInner, "marginTop", 0, duration);
    animate(infoInner, "marginTop", 0, duration, callback);
}

/**
 * Hides the title and info bars.
 *
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function hideBars(anim, callback) {
    var title = get("sb-title"),
        info = get("sb-info"),
        titleHeight = title.offsetHeight,
        infoHeight = info.offsetHeight,
        titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        duration = (anim ? 0.35 : 0);

    animate(titleInner, "marginTop", titleHeight, duration);
    animate(infoInner, "marginTop", infoHeight * -1, duration, function() {
        titleInner.style.visibility = infoInner.style.visibility = "hidden";
        callback();
    });
}

/**
 * Adjusts the height of #sb-wrapper-inner and centers #sb-wrapper vertically
 * in the viewport.
 *
 * @param   {Number}    height      The height (in pixels)
 * @param   {Number}    top         The top (in pixels)
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustHeight(height, top, anim, callback) {
    var wrapperInner = get("sb-wrapper-inner"),
        duration = (anim ? S.options.resizeDuration : 0);

    animate(wrapper, "top", top, duration);
    animate(wrapperInner, "height", height, duration, callback);
}

/**
 * Adjusts the width and left position of #sb-wrapper.
 *
 * @param   {Number}    width       The width (in pixels)
 * @param   {Number}    left        The left (in pixels)
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustWidth(width, left, anim, callback) {
    var duration = (anim ? S.options.resizeDuration : 0);

    animate(wrapper, "left", left, duration);
    animate(wrapper, "width", width, duration, callback);
}

/**
 * Calculates the dimensions for Shadowbox.
 *
 * @param   {Number}    height      The content height
 * @param   {Number}    width       The content width
 * @return  {Object}                The new dimensions object
 * @private
 */
function setDimensions(height, width) {
    var bodyInner = get("sb-body-inner"),
        height = parseInt(height),
        width = parseInt(width),
        topBottom = wrapper.offsetHeight - bodyInner.offsetHeight,
        leftRight = wrapper.offsetWidth - bodyInner.offsetWidth,

        // overlay should provide proper window dimensions here
        maxHeight = overlay.offsetHeight,
        maxWidth = overlay.offsetWidth,

        // default to the default viewport padding
        padding = parseInt(S.options.viewportPadding) || 20,

        // only preserve aspect ratio if there is something to display and
        // it's not draggable
        preserveAspect = (S.player && S.options.handleOversize != "drag");

    return S.setDimensions(height, width, maxHeight, maxWidth, topBottom, leftRight, padding, preserveAspect);
}

/**
 * The Shadowbox.skin object.
 *
 * @type    {Object}
 * @public
 */
var K = {};

/**
 * The HTML markup to use.
 *
 * @type    {String}
 * @public
 */
K.markup = "" +
'<div id="sb-container">' +
    '<div id="sb-overlay"></div>' +
    '<div id="sb-wrapper">' +
        '<div id="sb-title">' +
            '<div id="sb-title-inner"></div>' +
        '</div>' +
        '<div id="sb-wrapper-inner">' +
            '<div id="sb-body">' +
                '<div id="sb-body-inner"></div>' +
                '<div id="sb-loading">' +
                    '<div id="sb-loading-inner"><span>{loading}</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div id="sb-info">' +
            '<div id="sb-info-inner">' +
                '<div id="sb-counter"></div>' +
                '<div id="sb-nav">' +
                    '<a id="sb-nav-close" title="{close}" onclick="Shadowbox.close()"></a>' +
                    '<a id="sb-nav-next" title="{next}" onclick="Shadowbox.next()"></a>' +
                    '<a id="sb-nav-play" title="{play}" onclick="Shadowbox.play()"></a>' +
                    '<a id="sb-nav-pause" title="{pause}" onclick="Shadowbox.pause()"></a>' +
                    '<a id="sb-nav-previous" title="{previous}" onclick="Shadowbox.previous()"></a>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';

/**
 * Various options that control the behavior of Shadowbox' skin.
 *
 * @type    {Object}
 * @public
 */
K.options = {

    /**
     * The sequence of the resizing animations. "hw" will resize height, then width. "wh" resizes
     * width, then height. "sync" resizes both simultaneously.
     *
     * @type    {String}
     */
    animSequence: "sync",

    /**
     * The limit to the number of counter links that are displayed in a "skip"-style counter.
     *
     * @type    {Number}
     */
    counterLimit: 10,

    /**
     * The counter type to use. May be either "default" or "skip". A skip counter displays a
     * link for each object in the gallery.
     *
     * @type    {String}
     */
    counterType: "default",

    /**
     * True to display the gallery counter.
     *
     * @type    {Boolean}
     */
    displayCounter: true,

    /**
     * True to show the navigation controls.
     *
     * @type    {Boolean}
     */
    displayNav: true,

    /**
     * The duration (in seconds) of opacity animations.
     *
     * @type    {Number}
     */
    fadeDuration: 0.35,

    /**
     * The initial height (in pixels).
     *
     * @type    {Number}
     */
    initialHeight: 160,

    /**
     * The initial width (in pixels).
     *
     * @type    {Number}
     */
    initialWidth: 320,

    /**
     * True to trigger Shadowbox.close when the overlay is clicked.
     *
     * @type    {Boolean}
     */
    modal: false,

    /**
     * The color (in hex) to use for the overlay.
     *
     * @type    {String}
     */
    overlayColor: "#000",

    /**
     * The opacity to use for the overlay.
     *
     * @type    {Number}
     */
    overlayOpacity: 0.5,

    /**
     * The duration (in seconds) to use for resizing animations.
     *
     * @type    {Number}
     */
    resizeDuration: 0.35,

    /**
     * True to show the overlay, false to hide it.
     *
     * @type    {Boolean}
     */
    showOverlay: true,

    /**
     * Names of elements that should be hidden when the overlay is enabled.
     *
     * @type    {String}
     */
    troubleElements: ["select", "object", "embed", "canvas"]

};

/**
 * Initialization function. Called immediately after this skin's markup has been
 * appended to the document with all of the necessary language replacements done.
 *
 * @public
 */
K.init = function() {
    S.appendHTML(document.body, sprintf(K.markup, S.lang));

    K.body = get("sb-body-inner");

    // cache oft-used elements
    container = get("sb-container");
    overlay = get("sb-overlay");
    wrapper = get("sb-wrapper");

    // use absolute positioning in browsers that don't support fixed
    if (!supportsFixed)
        container.style.position = "absolute";

    if (!supportsOpacity) {
        // support transparent PNG's via AlphaImageLoader
        var el, m, re = /url\("(.*\.png)"\)/;
        each(pngIds, function(i, id) {
            el = get(id);
            if (el) {
                m = S.getStyle(el, "backgroundImage").match(re);
                if (m) {
                    el.style.backgroundImage = "none";
                    el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true,src=" +
                        m[1] + ",sizingMethod=scale);";
                }
            }
        });
    }

    // add window resize event handler, use 10 ms buffer to prevent jerky resizing
    var timer;
    addEvent(window, "resize", function() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        if (open)
            timer = setTimeout(K.onWindowResize, 10);
    });
}

/**
 * Called when Shadowbox opens.
 *
 * @param   {Object}    obj         The object to open
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onOpen = function(obj, callback) {
    // prevent window resize events from firing until we're finished
    doWindowResize = false;

    container.style.display = "block";

    setSize();

    var dims = setDimensions(S.options.initialHeight, S.options.initialWidth);
    adjustHeight(dims.innerHeight, dims.top);
    adjustWidth(dims.width, dims.left);

    if (S.options.showOverlay) {
        overlay.style.backgroundColor = S.options.overlayColor;
        S.setOpacity(overlay, 0);

        if (!S.options.modal)
            addEvent(overlay, "click", S.close);

        overlayOn = true;
    }

    if (!supportsFixed) {
        setPosition();
        addEvent(window, "scroll", setPosition);
    }

    toggleTroubleElements();
    container.style.visibility = "visible";

    if (overlayOn) {
        animate(overlay, "opacity", S.options.overlayOpacity, S.options.fadeDuration, callback);
    } else {
        callback();
    }
}

/**
 * Called when a new object is being loaded.
 *
 * @param   {Boolean}   changing    True if the content is changing from some
 *                                  previous object
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onLoad = function(changing, callback) {
    toggleLoading(true);

    // make sure the body doesn't have any children
    while (K.body.firstChild)
        remove(K.body.firstChild);

    hideBars(changing, function() {
        if (!open)
            return;

        if (!changing)
            wrapper.style.visibility = "visible";

        buildBars(callback);
    });
}

/**
 * Called when the content is ready to be loaded (e.g. when the image has finished
 * loading). Should resize the content box and make any other necessary adjustments.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onReady = function(callback) {
    if (!open)
        return;

    var player = S.player,
        dims = setDimensions(player.height, player.width);

    var wrapped = function() {
        showBars(callback);
    }

    switch (S.options.animSequence) {
    case "hw":
        adjustHeight(dims.innerHeight, dims.top, true, function() {
            adjustWidth(dims.width, dims.left, true, wrapped);
        });
        break;
    case "wh":
        adjustWidth(dims.width, dims.left, true, function() {
            adjustHeight(dims.innerHeight, dims.top, true, wrapped);
        });
        break;
    default: // sync
        adjustWidth(dims.width, dims.left, true);
        adjustHeight(dims.innerHeight, dims.top, true, wrapped);
    }
}

/**
 * Called when the content is loaded into the box and is ready to be displayed.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onShow = function(callback) {
    toggleLoading(false, callback);

    // re-enable window resize events
    doWindowResize = true;
}

/**
 * Called in Shadowbox.close.
 *
 * @public
 */
K.onClose = function() {
    if (!supportsFixed)
        removeEvent(window, "scroll", setPosition);

    removeEvent(overlay, "click", S.close);

    wrapper.style.visibility = "hidden";

    var callback = function() {
        container.style.visibility = "hidden";
        container.style.display = "none";
        toggleTroubleElements(true);
    }

    if (overlayOn) {
        animate(overlay, "opacity", 0, S.options.fadeDuration, callback);
    } else {
        callback();
    }
}

/**
 * Called in Shadowbox.play.
 *
 * @public
 */
K.onPlay = function() {
    toggleNav("play", false);
    toggleNav("pause", true);
}

/**
 * Called in Shadowbox.pause.
 *
 * @public
 */
K.onPause = function() {
    toggleNav("pause", false);
    toggleNav("play", true);
}

/**
 * Called when the window is resized.
 *
 * @public
 */
K.onWindowResize = function() {
    if (!doWindowResize)
        return;

    setSize();

    var player = S.player,
        dims = setDimensions(player.height, player.width);

    // adjust width first to eliminate horizontal scroll bar
    adjustWidth(dims.width, dims.left);
    adjustHeight(dims.innerHeight, dims.top);

    if (player.onWindowResize)
        player.onWindowResize();
}

S.skin = K;

// expose
window['Shadowbox'] = S;

})(window);

