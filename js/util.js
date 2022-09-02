Util = {};

Util.shuffleArray = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

Util.maxByMetric = function (array, keyfunction) {
    console.assert(array.length >= 1);
    let besti = 0;
    let bestk = keyfunction(array[0]);
    for (let i = 1; i < array.length; ++i) {
        let k = keyfunction(array[i]);
        if (k > bestk) {
            bestk = k;
            besti = i;
        }
    }
    return array[besti];
};

Util.getVector = function (direction) {
    var map = {
        0: { x: 0,  y: -1 }, // Up
        1: { x: 1,  y: 0 },  // Right
        2: { x: 0,  y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };
    return map[direction];
};

Util.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

Util.isWithinBounds = function (position) {
    return 0 <= position.x && position.x <= 7 &&
           0 <= position.y && position.y <= 7;
};

Util.isHumanStartPosition = function (position) {
    return position.y == 6;
};

Util.isAIStartPosition = function (position) {
    return position.y == 1;
};

Util.moveToString = function (source, target) {
    console.assert(Util.isWithinBounds(source));
    let ss = "abcdefgh"[source.x] + "87654321"[source.y];
    let ts = Util.isWithinBounds(target) ?
        "abcdefgh"[target.x] + "87654321"[target.y] :
        "xx";
    return ss + ">" + ts;
};

Util.stringToMove = function (s) {
    if (s.length !== 5 || s[2] !== '>') {
        return { source: {x: -1, y: -1}, target: {x: -1, y: -1} };
    }
    let source = { x: "abcdefghx".indexOf(s[0]), y: "87654321x".indexOf(s[1]) };
    let target = { x: "abcdefghx".indexOf(s[3]), y: "87654321x".indexOf(s[4]) };
    return { source: source, target: target };
};

Util.doThisButNoFasterThan = function (timeoutMillis, task, completion) {
    let deadlineMillis = Date.now() + timeoutMillis;
    window.setTimeout(function () {
        var result = task();
        let remainingMillis = Math.max(deadlineMillis - Date.now(), 0);
        window.setTimeout(function () {
            completion(result);
        }, remainingMillis);
    }, 0);
};
