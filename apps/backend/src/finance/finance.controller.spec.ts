import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { FinanceController } from './finance.controller';

type ControllerRoute = {
  methodName: keyof FinanceController;
  path: string;
  requestMethod: RequestMethod;
};

function getControllerPath(controller: object): string {
  return Reflect.getMetadata(PATH_METADATA, controller) as string;
}

function getRouteMetadata(methodName: keyof FinanceController) {
  const handler = FinanceController.prototype[methodName];

  return {
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    requestMethod: Reflect.getMetadata(
      METHOD_METADATA,
      handler,
    ) as RequestMethod,
  };
}

describe('FinanceController routes', () => {
  it.each<ControllerRoute>([
    {
      methodName: 'saveIncome',
      path: 'income',
      requestMethod: RequestMethod.POST,
    },
    {
      methodName: 'saveExpense',
      path: 'expense',
      requestMethod: RequestMethod.POST,
    },
    {
      methodName: 'deleteIncome',
      path: 'income/:id',
      requestMethod: RequestMethod.DELETE,
    },
    {
      methodName: 'deleteExpense',
      path: 'expense/:id',
      requestMethod: RequestMethod.DELETE,
    },
  ])(
    'registers %s for granular finance transactions',
    ({ methodName, path, requestMethod }) => {
      expect(getControllerPath(FinanceController)).toBe('finance');
      expect(getRouteMetadata(methodName)).toEqual({ path, requestMethod });
    },
  );
});
