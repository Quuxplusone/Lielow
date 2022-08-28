function Grid() {}

Grid.newGame = function () {
    var self = new Grid();
    self.isAITurn = (Math.round(Math.random()) == 0);
    self.cells = self.cellsFromState(null);
    self.winner = null;

    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y) {
            var position = {x: x, y: y};
            if (Util.isHumanStartPosition(position)) {
                self.cells[x][y] = new Tile(position, 1, 'human', false);
            } else if (Util.isAIStartPosition(position)) {
                self.cells[x][y] = new Tile(position, 1, 'ai', false);
            } else {
                self.cells[x][y] = new Tile(position, null, null, false);
            }
        }
    }
    return self;
};

Grid.fromPreviousState = function (previousState) {
    var self = new Grid();
    self.isAITurn = previousState.isAITurn;
    self.cells = self.cellsFromState(previousState.cells);
    self.winner = null;
    return self;
};

Grid.prototype.cellsFromState = function (state) {
    var cells = [];
    for (var x = 0; x < 8; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < 8; y++) {
            row.push(state ? Tile.fromPreviousState(state[x][y]) : null);
        }
    }
    return cells;
};

Grid.prototype.serialize = function () {
    var cellState = [];
    for (var x = 0; x < 8; x++) {
        var row = cellState[x] = [];
        for (var y = 0; y < 8; y++) {
            row.push(this.cells[x][y].serialize());
        }
    }
    return {
        cells: cellState,
        isAITurn: this.isAITurn,
        winner: null,
    };
};

Grid.prototype.clone = function () {
    var self = new Grid();
    self.isAITurn = this.isAITurn;
    self.cells = self.cellsFromState(this.cells);
    self.winner = this.winner;
    return self;
};

Grid.prototype.at = function (position) {
    console.assert(Util.isWithinBounds(position));
    return this.cells[position.x][position.y];
};

Grid.prototype.clearHighlights = function () {
    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y) {
            this.cells[x][y].highlightType = null;
        }
    }
};

Grid.prototype.highlightTile = function (highlightType, position) {
    console.assert(Util.isWithinBounds(position));
    if (position !== null) {
        var selectedTile = this.cells[position.x][position.y];
        selectedTile.highlightType = highlightType;
    }
};

Grid.prototype.isLegalMove = function (source, target) {
    var who = (this.isAITurn ? 'ai' : 'human');
    if (source === null || target === null) {
        return false;
    }
    if (!Util.isWithinBounds(source)) {
        return false;
    }
    var sourceTile = this.at(source);
    if (sourceTile.owner !== who) {
        return false;
    }
    var height = sourceTile.height;
    if (!Util.isWithinBounds(target)) {
        // This piece is suiciding.
        return Math.min(source.x, source.y, 7 - source.x, 7 - source.y) < height;
    }
    var targetTile = this.at(target);
    if (targetTile.owner === who) {
        return false;
    }       
    var dx = Math.abs(source.x - target.x);
    var dy = Math.abs(source.y - target.y);
    console.assert(0 <= dx && dx <= 7);
    console.assert(0 <= dy && dy <= 7);
    return (dx == 0 || dx == height) && (dy == 0 || dy == height);
};

Grid.prototype.commitMove = function (source, target) {
    var sourceTile = this.at(source);
    console.assert(sourceTile.owner === (this.isAITurn ? 'ai' : 'human'));

    if (!Util.isWithinBounds(target)) {
        // This piece is suiciding.
        if (sourceTile.isKing) {
            this.winner = (this.isAITurn ? 'human' : 'ai');
        }
    } else {
        // This piece is moving or capturing.
        var targetTile = this.at(target);
        console.assert(targetTile.owner !== sourceTile.owner);
        if (targetTile.isKing) {
            console.assert(targetTile.owner === (this.isAITurn ? 'human' : 'ai'));
            this.winner = (this.isAITurn ? 'ai' : 'human');
        }
        if (targetTile.owner === null) {
            targetTile.height = sourceTile.height + 1;
        } else {
            targetTile.height = 1;
        }
        targetTile.owner = sourceTile.owner;
        targetTile.isKing = sourceTile.isKing;
    }
    sourceTile.owner = null;
    sourceTile.height = null;
    sourceTile.isKing = false;
    if (this.winner !== 'ai') {
        this.reassignCrown('human');
    }
    if (this.winner !== 'human') {
        this.reassignCrown('ai');
    }
    this.isAITurn = !this.isAITurn;
};

Grid.prototype.reassignCrown = function (who) {
    var maxHeight = 0;
    var positions = [];
    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y) {
            var tile = this.at({x: x, y: y});
            if (tile.owner !== who) {
                continue;
            }
            if (tile.height > maxHeight) {
                maxHeight = tile.height;
                positions = [{x: x, y: y}];
            } else if (tile.height == maxHeight) {
                positions.push({x: x, y: y});
            }
        }
    }
    if (positions.length === 1) {
        // There is a unique tallest stack. Move the crown.
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                var tile = this.at({x: x, y: y});
                if (tile.owner === who) {
                    tile.isKing = false;
                }
            }
        }
        this.at(positions[0]).isKing = true;
    }
};
