/**
 * Returns the current date as a triple
 */
export const getDate = (): [number, number, number] => {
    const date = new Date();
    return [date.getFullYear(), (date.getMonth() + 1), date.getDate()]
}

/**
 * Returns the given date as a string.
 *
 * @param date date triple
 */
export const getDateString = (date: [number, number, number] = getDate()): string => {
    return "" + date[0] + date[1] + date[2];
}