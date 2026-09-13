"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONEY_PATTERN = void 0;
exports.parseMoney = parseMoney;
exports.convertMoneySql = convertMoneySql;
exports.MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;
function parseMoney(value, allowZero = false) {
    const text = String(value !== null && value !== void 0 ? value : '').trim().replace(',', '.');
    if (!exports.MONEY_PATTERN.test(text))
        return null;
    if (!allowZero && /^0(?:\.0{1,3})?$/.test(text))
        return null;
    return text;
}
function convertMoneySql(column, currencyColumn) {
    return `(CASE WHEN ${currencyColumn} = 'USD' THEN ${column} * 7.68::numeric ELSE ${column} END)`;
}
