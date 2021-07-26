/** ExpressError extends normal JS error so we can
 *  add a status when we make an instance of it.
 *
 *  The error-handling middleware will return this.
*/

class ExpressError extends Error {
    constructor(message, status) {
        super();
        this.message = message;
        this.status = status;
    }
}

/** 404 NOT FOUND error. */

class NotFoundError extends ExpressError {
    constructor(message = "Not Found") {
      super(message, 404);
    }
}

module.exports = { 
    ExpressError,
    NotFoundError 
}