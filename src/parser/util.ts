export const LINE_SPLITE = '\r\n';

/**
 * 根据换行符拆分文本
 * @param content 内容
 * @returns 所有行
 */
export const splitLine = (content: string): string[] => {
    if (content.indexOf(LINE_SPLITE) >= 0) {
        return content.split(LINE_SPLITE);
    }
    if (content.indexOf('\n') >= 0) {
        return content.split('\n');
    }
    if (content.indexOf('\r') >= 0) {
        return content.split('\r');
    }
    return [content];
};

/**
 * 合并行
 * @param lines 行
 * @returns 内容
 */
export const joinLine = (lines: string[]): string => {
    return lines.join(LINE_SPLITE);
};
