function KeyboardInputManager() {
    this.events = {};

    if (window.navigator.msPointerEnabled) {
        //Internet Explorer 10 style
        this.eventTouchstart = "MSPointerDown";
        this.eventTouchmove = "MSPointerMove";
        this.eventTouchend = "MSPointerUp";
    } else {
        this.eventTouchstart = "touchstart";
        this.eventTouchmove = "touchmove";
        this.eventTouchend = "touchend";
    }

    this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

KeyboardInputManager.prototype.listen = function () {
    var self = this;

    var map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3, // Left
        75: 0, // Vim up
        76: 1, // Vim right
        74: 2, // Vim down
        72: 3, // Vim left
        87: 0, // W
        68: 1, // D
        83: 2, // S
        65: 3, // A
        13: 4, // Enter
    };

    // Respond to direction keys
    document.addEventListener("keydown", function (event) {
        var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
        var mapped = map[event.which];

        // Ignore the event if it's happening in a text field
        if (self.targetIsInput(event)) return;

        if (!modifiers) {
            if (mapped === 4) {
                event.preventDefault();
                self.emit("enter", null);
            } else if (mapped !== undefined) {
                event.preventDefault();
                self.emit("arrow", mapped);
            }
        }

        // R key restarts the game
        if (!modifiers && event.which === 82) {
          self.restart.call(self, event);
        }
    });

    self.touchStartPosition = {x: -1, y: -1};
    for (var x=0; x < 8; ++x) {
        for (var y=0; y < 8; ++y) {
            self.addTileEventListeners(x, y);
        }
    }
    self.addTileEventListeners(98, 98);

    // Respond to button presses
    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
};

KeyboardInputManager.prototype.addTileEventListeners = function (x, y) {
    var self = this;
    let position = {x: x, y: y};
    let button = document.querySelector(`.grid-position-${x+1}-${y+1}`);
    console.assert(button);
    button.x = position.x;
    button.y = position.y;

    var dispatch = function (source, target) {
        if (Util.positionsEqual(target, source)) {
            self.emit("click", target);
        }
    };

    button.addEventListener(this.eventTouchstart, function (event) {
        if (event.touches.length >= 2) {
            self.touchStartPosition = {x: -1, y: -1};
            return;  // Ignore multitouch.
        }
        self.touchStartPosition = position;
    });
    button.addEventListener(this.eventTouchend, function (event) {
        if (event.touches.length >= 1 || event.changedTouches.length != 1) {
            self.touchStartPosition = {x: -1, y: -1};
            return;  // Ignore if the touch is still going on.
        }
        var changedTouch = event.changedTouches[0];
        var element = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
        var position = {x: element.x, y: element.y};
        var source = self.touchStartPosition;
        self.touchStartPosition = {x: -1, y: -1};
        dispatch(source, position);

        // The browser might generate a "click" event for this, if we let it. Don't let it.
        event.preventDefault();
    });

    button.addEventListener("mousedown", function (event) {
        self.touchStartPosition = position;
    });
    button.addEventListener("mouseup", function (event) {
        var source = self.touchStartPosition;
        self.touchStartPosition = {x: -1, y: -1};
        dispatch(source, position);
    });
};

KeyboardInputManager.prototype.restart = function (event) {
    event.preventDefault();
    this.emit("restart");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
    var button = document.querySelector(selector);
    if (button) {
        button.addEventListener("click", fn.bind(this));
        button.addEventListener(this.eventTouchend, fn.bind(this));
    }
};

KeyboardInputManager.prototype.targetIsInput = function (event) {
    return event.target.tagName.toLowerCase() === "input";
};
