import express from 'express';
import { createAppConfig } from '@config/app';
import { env } from '@config/env';
import { errorHandler, notFoundHandler } from '@shared/middlewares/errorHandler';
import { requestLogger } from '@shared/middlewares/requestLogger';
import { authRouter } from '@modules/auth/routes/auth.routes';

export function createApp(): express.Application {
  const app = express();

  createAppConfig(app);
  app.use(requestLogger);

  app.get(`/api/${env.app.apiVersion}/health`, (_req, res) => {
    res.json({
      success: true,
      message: 'GoBasket API is running',
      environment: env.app.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(`/api/${env.app.apiVersion}/auth`, authRouter());

  // TODO: Mount as built
  // app.use(`/api/${env.app.apiVersion}/users`, usersRouter());
  // app.use(`/api/${env.app.apiVersion}/products`, productsRouter());
  // app.use(`/api/${env.app.apiVersion}/categories`, categoriesRouter());
  // app.use(`/api/${env.app.apiVersion}/carts`, cartsRouter());
  // app.use(`/api/${env.app.apiVersion}/orders`, ordersRouter());
  // app.use(`/api/${env.app.apiVersion}/inventory`, inventoryRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
