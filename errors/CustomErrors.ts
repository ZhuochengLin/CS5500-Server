/**
 * An error class for "user does not exist" error
 */

export class NoSuchUserError extends Error {

    constructor() {
        super("No such user.");
    }

}

/**
 * An error class for "tuit does not exist" error
 */
export class NoSuchTuitError extends Error {
    constructor() {
        super("No such tuit.");
    }

}

/**
 * An error class for "no user is logged in" error
 */
export class NoUserLoggedInError extends Error {

    constructor() {
        super("Please login first.");
    }

}

/**
 * An error class for "user already exists" error
 */
export class UserAlreadyExistsError extends Error {

    constructor() {
        super("User already exists.");
    }

}

/**
 * An error class for "username and password do not match" error
 */
export class IncorrectCredentialError extends Error {

    constructor() {
        super("Username and password do not match.");
    }

}

/**
 * An error class for "tuit has empty content" error
 */
export class EmptyTuitError extends Error {

    constructor() {
        super("Empty tuit content");
    }

}

export class InvalidInputError extends Error {

    constructor(msg: string = "Received invalid inputs.") {
        super(msg);
    }

}

export class MultiTypeMediaError extends Error {

    constructor(msg: string = "Received both image and video content") {
        super(msg);
    }

}

export class MediaContentExceedsLimitError extends Error {

    constructor(msg: string = "Received media content that exceeds limit.") {
        super(msg);
    }

}

export class NoPermissionError extends Error {

    constructor(msg: string = "No permission on this operation.") {
        super(msg);
    }

}