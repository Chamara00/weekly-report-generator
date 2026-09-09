import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

// Validates that an ISO date string falls on a Monday (in UTC).
export function IsMonday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMonday',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;

          // 1 = Monday in UTC terms.
          return date.getUTCDay() === 1;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a Monday (the first day of the reporting week)`;
        },
      },
    });
  };
}
