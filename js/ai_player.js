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
    if (grid.winner !== null) {
        return [];
    }
    let who = (grid.isAITurn ? 'ai' : 'human');
    var moves = [];
    for (var x=0; x < 8; ++x) {
        for (var y=0; y < 8; ++y) {
            var source = {x: x, y: y};
            var tile = grid.at(source);
            if (tile.owner === who) {
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

AIPlayer.prototype.staticEvaluate = function (grid) {
    // Evaluate this grid's desirability from the point of view
    // of the player who is about to move.
    // For now, let's go purely by number-of-moves-available.

    if (grid.winner !== null) {
        let aiToMove = grid.isAITurn;
        let aiJustWon = (grid.winner === 'ai');
        return (aiToMove === aiJustWon) ? Infinity : -Infinity;
    }

    let countMyMoves = this.legalMoves(grid).length;
    grid.isAITurn = !grid.isAITurn;
    let countHisMoves = this.legalMoves(grid).length;
    grid.isAITurn = !grid.isAITurn;

    return (countMyMoves - countHisMoves);
};

AIPlayer.prototype.negamax = function (depth, grid, alpha, beta) {
    // Evaluate this grid's desirability from the point of view
    // of the player who is about to move.

    console.assert(alpha <= beta);
    if (depth === 0) {
        return this.staticEvaluate(grid);
    }
    var moves = this.legalMoves(grid);
    if (moves.length === 0) {
        console.assert(grid.winner !== null);
        return this.staticEvaluate(grid);
    }
    Util.shuffleArray(moves);
    var bestScore = -Infinity;
    for (var i = 0; i < moves.length; ++i) {
        let m = moves[i];
        var newgrid = Grid.fromPreviousState(grid);
        newgrid.commitMove(m.source, m.target);
        if (newgrid.winner === (grid.isAITurn ? 'ai' : 'human')) {
            // If we have a winning move, we should take it, specifically.
            return Infinity;
        }
        let score = Math.min(Math.max(alpha, -this.negamax(depth - 1, newgrid, -beta, -alpha)), beta);
        if (score > bestScore) {
            bestScore = score;
            if (score > alpha) {
                alpha = score;
                if (score > beta) {
                    return beta;
                }
            }
        }
    }
    return bestScore;
};

AIPlayer.prototype.chooseMove = function (gameManager) {
    var self = this;
    var grid = gameManager.grid;

    var moves = this.legalMoves(grid);
    Util.shuffleArray(moves);
    let startMillis = Date.now();

    var movesAndGrids = [];
    for (var i = 0; i < moves.length; ++i) {
        let m = moves[i];
        var newgrid = Grid.fromPreviousState(grid);
        newgrid.commitMove(m.source, m.target);
        movesAndGrids.push({m: m, g: newgrid});
    }
    var bestMG = Util.maxByMetric(movesAndGrids, function (mg) {
        let score = -self.negamax(2, mg.g, -1e20, +1e20);
        return score;
    });
    movesAndGrids = [bestMG].concat(movesAndGrids);
    bestMG = Util.maxByMetric(movesAndGrids, function (mg) {
        if (Date.now() - startMillis >= 500) return -Infinity;
        let score = -self.negamax(3, mg.g, -1e20, +1e20);
        return score;
    });
    return bestMG.m;
};
