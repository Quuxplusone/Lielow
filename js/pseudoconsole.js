(function () {
    var old = console.log;
    var logger = document.querySelector(".pseudoconsole");
    console.log = function () {
      for (var i = 0; i < arguments.length; i++) {
        let a = arguments[i];
        if (typeof a == 'undefined') {
            logger.innerHTML += ' undefined';
        } else if (a === null) {
            logger.innerHTML += ' null';
        } else if (typeof a == 'number') {
            logger.innerHTML += ' ' + a.toString();
        } else if (typeof a == 'string') {
            logger.innerHTML += ' ' + a;
        } else if (a instanceof Error) {
            logger.innerHTML += ' Error' + JSON.stringify(err, ["message", "arguments", "type", "name"], 2);
        } else if (typeof a == 'object') {
            if (a.constructor.name) {
                logger.innerHTML += ' ' + a.constructor.name + JSON.stringify(a, undefined, 2);
            } else {
                logger.innerHTML += ' ' + JSON.stringify(a, undefined, 2);
            }
        } else {
            logger.innerHTML += ' ' + (typeof a) + '(';
            logger.innerHTML += a;
            logger.innerHTML += ')';
        }
      }
      logger.innerHTML += '<br/>'
      old(...arguments);
    }
})();
