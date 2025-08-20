import { HttpStatus } from '@nestjs/common';
import { ReasonPhrases } from '@app/core/reason-phrases.core';
import { Response } from 'express';

class SuccessResponse {
  status: number;
  message: string;
  metadata: any;
  options: Record<string, any>;

  constructor({
    message = '',
    statusCode = HttpStatus.OK,
    reasonCode = ReasonPhrases.OK,
    metadata = {},
    options = {},
  }) {
    this.message = message ?? reasonCode;
    this.status = statusCode;
    this.metadata = metadata;
    this.options = options;
  }

  send(res: Response) {
    return res.status(this.status).json(this);
  }
}

/**
 * Represents a successful response with a status code of 200 OK.
 *
 */
export class OK extends SuccessResponse {
  constructor({ message = '', metadata = {}, options = {} }) {
    super({ message, metadata, options });
  }
}

/**
 * Represents a successful response with a status code of 201 Created.
 */
export class Created extends SuccessResponse {
  constructor({
    message = '',
    statusCode = HttpStatus.CREATED,
    reasonCode = ReasonPhrases.CREATED,
    metadata = {},
    options = {},
  }) {
    super({ message, metadata, reasonCode, statusCode });
    this.options = options;
  }
}
