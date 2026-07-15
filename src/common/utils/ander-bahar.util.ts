import { AnderBaharPosition } from '../enums/ander-bahar-position.enum';

/** Every Ander/Bahar digit-group always contains exactly this many numbers. */
export const ANDER_BAHAR_GROUP_SIZE = 10;

/**
 * Pairs run 00-99 (100 combos), with "00" stored as the number 0. Ander(d) is
 * the 10 pairs with tens-digit d ("d0".."d9"). Bahar(d) is the 10 pairs with
 * ones-digit d. Both groups' digit=0 case includes the "00" pair as 0.
 */
export function getAnderBaharNumbers(
    digit: number,
    position: AnderBaharPosition,
): number[] {
    if (position === AnderBaharPosition.ANDER) {
        return digit === 0
            ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            : range(digit * 10, digit * 10 + 9);
    }

    if (digit === 0) {
        return [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    }
    return range(0, 9).map((tens) => digit + tens * 10);
}

function range(start: number, end: number): number[] {
    const result: number[] = [];
    for (let n = start; n <= end; n++) {
        result.push(n);
    }
    return result;
}
