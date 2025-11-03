export class BaseError extends Error {
	type = "";
	statusCode;

	constructor({
		message,
		statusCode,
	}: {
		message: string;
		statusCode: number;
	}) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
	}
}

export class RouteNotFoundError extends BaseError {
  constructor(route: string, method: string) {
    super({
      message: `No handler defined for ${method.toUpperCase()}: ${route.split('?')[0]} route.`,
      statusCode: 404,
    });
  }
}

export class NotFoundError extends BaseError {
	constructor(message: string = "This resource was not found") {
		super({ message, statusCode: 404 });
	}
}

export class InternalServerError extends BaseError {
	constructor(
		message: string = "Something unexpected went wrong, please try again later!"
	) {
		super({ message, statusCode: 500 });
	}
}

export class BadRequestError extends BaseError {
	constructor(
		message: string = "The request was invalid or cannot be served."
	) {
		super({ message, statusCode: 400 });
	}
}

export class UnprocessableEntityError extends BaseError {
	constructor(
		message: string = "The request was well-formed but was unable to be followed due to semantic errors."
	) {
		super({ message, statusCode: 422 });
	}
}

export class DataConflictError extends BaseError {
	constructor(
		message: string = "The request could not be completed due to a conflict with the current state of the target resource."
	) {
		super({ message, statusCode: 409 });
	}
}
