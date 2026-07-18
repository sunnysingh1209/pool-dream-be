import { Between, FindOperator, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

/**
 * Builds an inclusive date-range filter for a `timestamptz` column from
 * date-only (or ISO) strings. fromDate is treated as start-of-day UTC,
 * toDate as end-of-day UTC.
 */
export function buildDateRangeFilter(
  fromDate?: string,
  toDate?: string,
): FindOperator<Date> | undefined {
  if (fromDate && toDate) {
    return Between(
      new Date(`${fromDate}T00:00:00.000Z`),
      new Date(`${toDate}T23:59:59.999Z`),
    );
  }
  if (fromDate) {
    return MoreThanOrEqual(new Date(`${fromDate}T00:00:00.000Z`));
  }
  if (toDate) {
    return LessThanOrEqual(new Date(`${toDate}T23:59:59.999Z`));
  }
  return undefined;
}
