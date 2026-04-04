import type { Express, Request, Response } from 'express';
import { invokeExpressServer } from './main';

describe('invokeExpressServer', () => {
  it('sends 500 when the express pipeline reports an error', () => {
    const status = jest.fn().mockReturnThis();
    const send = jest.fn();
    const res = {
      headersSent: false,
      status,
      send,
    } as unknown as Response;
    const req = {} as Request;
    const server = ((_: Request, __: Response, next: (error?: unknown) => void) =>
      next(new Error('boom'))) as unknown as Express;

    invokeExpressServer(server, req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith('Internal Server Error');
  });

  it('does not write a response when headers have already been sent', () => {
    const status = jest.fn().mockReturnThis();
    const send = jest.fn();
    const res = {
      headersSent: true,
      status,
      send,
    } as unknown as Response;
    const req = {} as Request;
    const server = ((_: Request, __: Response, next: (error?: unknown) => void) =>
      next(new Error('boom'))) as unknown as Express;

    invokeExpressServer(server, req, res);

    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
