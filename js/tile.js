function Tile(position, height, owner, isKing) {
    this.x = position.x;
    this.y = position.y;
    this.height = height;  // 1 through 8, or null
    this.owner = owner;  // 'human' or 'ai', or null
    this.isKing = isKing;
}

Tile.fromPreviousState = function (previousState) {
    return new Tile(previousState, previousState.height, previousState.owner, previousState.isKing);
};

Tile.prototype.serialize = function () {
    return {
        x: this.x,
        y: this.y,
        height: this.height,
        owner: this.owner,
        isKing: this.isKing,
    };
};
