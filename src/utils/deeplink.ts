export const openLink = (link: string) => {
    if (!link || link.length < 1 || link.charAt(0) === '#' || link.indexOf('javascript:') === 0) {
        return;
    }
    // {Scheme}://{Action}/{Target}/{Method}/{Param}?{Key}={Value}
    // deeplink://goto/index
    const items = link.split('://');
    const schema = items[0];
    if (schema === 'http' || schema === 'https') {
        wx.navigateTo({url: '/pages/browser/index?url=' + encodeURIComponent(link),});
        return;
    }
    if (schema !== 'deeplink') {
        return;
    }
    
}
