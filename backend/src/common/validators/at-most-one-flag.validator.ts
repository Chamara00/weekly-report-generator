import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

/**
 * Validates that at most one item in an array has the named boolean flag set.
 *
 * Used for "exactly one key blocker" and "exactly one key achievement": the
 * schema cannot express this (it would need a partial unique index per
 * version), so it is enforced at the edge instead.
 *
 * Zero flagged items is allowed -- a report may legitimately have blockers that
 * are all routine.
 */
export function AtMostOneFlag(
  flag: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atMostOneFlag',
      target: object.constructor,
      propertyName,
      constraints: [flag],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!Array.isArray(value)) return true; // Other decorators cover this.

          const [flagName] = args.constraints as [string];
          const flagged = value.filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              (item as Record<string, unknown>)[flagName] === true,
          );

          return flagged.length <= 1;
        },
        defaultMessage(args: ValidationArguments) {
          const [flagName] = args.constraints as [string];
          return `${args.property} may contain at most one item with ${flagName} set to true`;
        },
      },
    });
  };
}
