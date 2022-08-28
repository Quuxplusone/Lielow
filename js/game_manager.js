function GameManager(InputManager, Actuator, StorageManager, AIPlayer) {
    this.inputManager   = new InputManager;
    this.storageManager = new StorageManager("lielow");
    this.actuator       = new Actuator;
    this.aiPlayer       = new AIPlayer;

    this.inputManager.on("arrow", this.arrow.bind(this));
    this.inputManager.on("enter", this.enter.bind(this));
    this.inputManager.on("click", this.click.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));

    this.setup();
}

// Return true if the game is over
GameManager.prototype.isGameTerminated = function () {
    return (this.winner !== null);
};

// Restart the game
GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.actuator.clearMessage(); // Clear the game won/lost message
    this.setup();
};

GameManager.prototype.serialize = function () {
    return {
        grid: this.grid.serialize(),
        aiPlayer: this.aiPlayer.serialize(),
        winner: this.winner,
    };
};

GameManager.prototype.setup = function () {
    var previousState = this.storageManager.getGameState();

    // Reload the game from a previous game if present
    if (previousState) {
        this.grid = Grid.fromPreviousState(previousState.grid);
        this.aiPlayer = AIPlayer.fromPreviousState(previousState.aiPlayer);
        this.winner = previousState.winner;
    } else {
        this.grid = Grid.newGame();
        this.aiPlayer = AIPlayer.newGame();
        this.winner = null;
    }

    // Input UI states:
    // 0: Still stepping the "selected tile" highlight region around the screen.
    // 1: Have actually selected a tile (with one of my stacks on it).
    // 2: Have indicated the (valid) target space onto which to move that stack.
    // The next step is to confirm the move, which puts us back into state 0.
    this.inputState = 0;
    this.highlightedTile = {x: 2, y: 2};

    if (this.grid.isAITurn) {
        var self = this;
        window.setTimeout(function () {
            var result = self.aiPlayer.chooseMove(self);
            self.commitMoveForAI(result.source, result.target);
            self.actuate();
        }, 500);
    } else {
        this.actuate();
    }
};

GameManager.prototype.actuate = function () {
    if (this.isGameTerminated()) {
        this.storageManager.clearGameState();
    } else {
        this.storageManager.setGameState(this.serialize());
    }

    this.grid.clearHighlights();
    if (this.inputState === 0) {
        this.grid.highlightTile('light', this.highlightedTile);
    } else {
        this.grid.highlightTile('light', this.selectedStack);
        this.grid.highlightTile('dark', this.highlightedTile);
    }

    this.actuator.actuate(this.grid, {
        lost:       (this.winner === 'ai'),
        won:        (this.winner === 'human'),
    });
};

GameManager.prototype.arrow = function (direction) {
    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    // Input UI states:
    // 0: Still stepping the "select a stack" highlight region around the screen.
    // 1: Have selected a stack; now selecting its target space.
    var d = Util.getVector(direction);
    if (this.inputState === 0) {
        this.highlightedTile = {
            x: Math.min(Math.max(0, this.highlightedTile.x + d.x), 7),
            y: Math.min(Math.max(0, this.highlightedTile.y + d.y), 7),
        };
    } else if (this.inputState === 1) {
        // If suicide is legal in this direction, allow stepping onto the suicide cell.
        var height = this.grid.at(this.selectedStack).height;
        let minX = (this.selectedStack.x < height) ? -1 : 0;
        let minY = (this.selectedStack.y < height) ? -1 : 0;
        let maxX = (this.selectedStack.x > 7 - height) ? 8 : 7;
        let maxY = (this.selectedStack.y > 7 - height) ? 8 : 7;
        this.highlightedTile = {
            x: Math.min(Math.max(minX, this.highlightedTile.x + d.x), maxX),
            y: Math.min(Math.max(minY, this.highlightedTile.y + d.y), maxY),
        };
    }
    this.actuate();
};

GameManager.prototype.enter = function (dummy) {
    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    // Input UI states:
    // 0: Still stepping the "select a stack" highlight region around the screen.
    // 1: Have selected a stack; now selecting its target space.

    if (this.inputState === 0) {
        var tile = this.grid.at(this.highlightedTile);
        if (tile.owner === 'human') {
            this.selectedStack = {x: tile.x, y: tile.y};
            this.inputState = 1;
        } else {
            this.selectedStack = {x: -1, y: -1};
            this.inputState = 0;
        }
    } else if (this.inputState === 1) {
        if (this.grid.isLegalMove(this.selectedStack, this.highlightedTile)) {
            this.commitMoveForHuman(this.selectedStack, this.highlightedTile);
        } else if (Util.isWithinBounds(this.highlightedTile) && this.grid.at(this.highlightedTile).owner === 'human') {
            this.selectedStack = {x: tile.x, y: tile.y};
            this.inputState = 1;
        } else {
            this.selectedStack = {x: -1, y: -1};
            this.inputState = 0;
        }
    }
    this.actuate();
};

GameManager.prototype.click = function (position) {
    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    // Clicking on a tile is like navigating to it and hitting "Enter",
    // except that we should take extra care not to highlight the suicide tile
    // if the selected stack isn't able to reach it.

    if (!Util.isWithinBounds(position)) {
        if (this.inputState === 0) return;
        if (!this.grid.isLegalMove(this.selectedStack, position)) return;
    }

    this.highlightedTile = {x: position.x, y: position.y};
    this.enter(null);
};

GameManager.prototype.commitMoveForHuman = function (source, target) {
    this.grid.commitMove(source, target);
    if (Util.isWithinBounds(target)) {
        this.grid.at(target).previousPosition = {x: source.x, y: source.y};
    }
    this.winner = this.grid.winner;

    this.highlightedTile = Util.isWithinBounds(target) ? target : source;
    this.inputState = 0;

    if (this.winner === null) {
        var self = this;
        window.setTimeout(function () {
            var result = self.aiPlayer.chooseMove(self);
            self.commitMoveForAI(result.source, result.target);
            self.actuate();
        }, 500);
    }
};

GameManager.prototype.commitMoveForAI = function (source, target) {
    this.grid.commitMove(source, target);
    if (Util.isWithinBounds(target)) {
        this.grid.at(target).previousPosition = {x: source.x, y: source.y};
    }
    this.winner = this.grid.winner;
};
