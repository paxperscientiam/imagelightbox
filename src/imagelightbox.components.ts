const $arrowLeftObject = $('<button/>',{
    type: 'button',
    class: 'imagelightbox-arrow imagelightbox-arrow-left'});

const $arrowRightObject = $('<button/>',{
    type: 'button',
    class: 'imagelightbox-arrow imagelightbox-arrow-right'});

export const $components = {
    $activityObject: $('<div/>')
        .attr('class','imagelightbox-loading')
        .append($('<div/>')),
    $arrows: $arrowLeftObject.add($arrowRightObject),
    $captionObject: $('<div/>', {
        class: 'imagelightbox-caption',
        html: '&nbsp;',
    }),
    $buttonObject:  $('<button/>', {
        type: 'button',
        class: 'imagelightbox-close'
    }),
    $overlayObject: $('<div/>', {
        class:'imagelightbox-overlay'
    }),
    $navItem: $('<a/>', {
        href:'#',
        class:'imagelightbox-navitem'
    }),
    $navObject: $('<div/>', {
        class: 'imagelightbox-nav'
    }),
    $wrapper: $('<div/>', {
        class: 'imagelightbox-wrapper'
    }),
};
