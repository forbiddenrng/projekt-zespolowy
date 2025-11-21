import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MaxNow(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'maxNow',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === null || value === undefined || value === '')
            return true;
          const date = typeof value === 'string' ? new Date(value) : value;
          if (isNaN(date.getTime())) return false;
          return date.getTime() <= Date.now();
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          const msg = (validationOptions as any)?.message;
          if (typeof msg === 'function') {
            return msg(validationArguments as ValidationArguments);
          }
          return (
            (typeof msg === 'string' && msg) ??
            `${validationArguments?.property ?? 'value'} must be on or before now`
          );
        },
      },
    });
  };
}
