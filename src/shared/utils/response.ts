import { Response } from 'express';
import { HTTP_STATUS } from '@shared/constants';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode: number = HTTP_STATUS.OK,
): Response {
  const body: SuccessResponse<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created'): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Success',
): Response {
  return res.status(HTTP_STATUS.OK).json({ success: true, message, data, meta });
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}
