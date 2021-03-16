export const LINE_SPLITE = '\r\n';

/**
 * 根据换行符拆分文本
 * @param content 内容
 * @returns 所有行
 */
export const splitLine = (content: string): string[] => {
    if (content.indexOf(LINE_SPLITE) > 0) {
        return content.split(LINE_SPLITE);
    }
    if (content.indexOf('\n')) {
        return content.split('\n');
    }
    if (content.indexOf('\r')) {
        return content.split('\r');
    }
    return [content];
};
