function AIPlayer() {
}

AIPlayer.newGame = function () {
    var self = new AIPlayer();
    return self;
};

AIPlayer.fromPreviousState = function (previousState) {
    var self = new AIPlayer();
    return self;
};

AIPlayer.prototype.serialize = function () {
    return {};
};

AIPlayer.prototype.legalMoves = function (grid) {
    var moves = [];
    for (var x=0; x < 8; ++x) {
        for (var y=0; y < 8; ++y) {
            var source = {x: x, y: y};
            var tile = grid.at(source);
            if (tile.owner === 'ai') {
                var height = tile.height;
                var targets = [
                    {x: x - height, y: y - height},
                    {x: x - height, y: y},
                    {x: x - height, y: y + height},
                    {x: x, y: y - height},
                    {x: x, y: y + height},
                    {x: x + height, y: y - height},
                    {x: x + height, y: y},
                    {x: x + height, y: y + height},
                ];
                for (var i = 0; i < 8; ++i) {
                    if (Util.isWithinBounds(targets[i]) && grid.isLegalMove(source, targets[i])) {
                        moves.push({source: source, target: targets[i]});
                    }
                }
                var suicide = {x: -1, y: -1};
                if (grid.isLegalMove(source, suicide)) {
                    moves.push({source: source, target: suicide});
                }
            }
        }
    }
    return moves;
};

AIPlayer.prototype.chooseMove = function (gameManager) {
    var self = this;
    var grid = gameManager.grid;

    var moves = this.legalMoves(grid);
    Util.shuffleArray(moves);

    return moves[0];
};
