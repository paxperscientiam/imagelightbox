// http://blog.npmjs.org/post/112712169830/making-your-jquery-plugin-work-better-with-npm
// If there is a variable named module and it has an exports property,
// then we're working in a Node-like environment. Use require to load
// the jQuery object that the module system is using and pass it in.
// Otherwise, we're working in a browser, so just pass in the global
// jQuery object.

import {
    cssTransitionTranslateX,
    //
    hasCssTransitionSupport,
    hasFullscreenSupport,
    hasHistorySupport,
    hasPointers,
    hasTouch,
} from './imagelightbox.support';

import { $components } from './imagelightbox.components';

const PROJECT_NAME = 'imageLightbox';

export class ImageLightbox implements ImageLightboxPlugin {
    currentIndex: number = 0;
    image: JQuery<HTMLElement> = $();
    inProgress: boolean = false;
    swipeDiff: number = 0;
    target: JQuery<HTMLElement> = $();
    targetIndex: number = -1;

    targets: JQuery = $([]);
    targetSet: string = '';
    videos: Array<PreloadedVideo> = [];

    options: ILBOptions|Partial<ILBOptions>;

    constructor(options: Partial<ILBOptions>, element: JQuery) {
        this.options = options;
    }

    _onStart(): void {
        if (this.options.arrows) {
            this.arrowsOn();
        }
        if (this.options.navigation) {
            this.navigationOn();
        }
        if (this.options.overlay) {
            this.overlayOn();
        }
        if (this.options.button) {
            this.closeButtonOn();
        }
        if (this.options.caption) {
            $components.$wrapper.append($components.$captionObject);
        }
    }

    _onLoadStart(): void {
        if (this.options.activity) {
            this.activityIndicatorOn();
        }
        if (this.options.caption) {
            this.captionReset();
        }
    }

    _onLoadEnd(): void {
        if (this.options.activity) {
            this.activityIndicatorOff();
        }
        if (this.options.arrows) {
            $components.$arrows.css('display', 'block');
        }
    }

    _addQueryField(query: string, key: string, value: string): string {
        const newField = key + '=' + value;
        let newQuery = '?' + newField;

        if (query) {
            const keyRegex = new RegExp('([?&])' + key + '=[^&]*');
            if (keyRegex.exec(query) !== null) {
                newQuery = query.replace(keyRegex, '$1' + newField);
            } else {
                newQuery = query + '&' + newField;
            }
        }
        return newQuery;
    }

    _pushToHistory(): void {
        if(!hasHistorySupport || !this.options.history) {
            return;
        }
        let newIndex = targets[targetIndex].dataset.ilb2Id;
        if(!newIndex) {
            newIndex = targetIndex.toString();
        }
        const newState = {imageLightboxIndex: newIndex, imageLightboxSet: ''};
        const set = targets[targetIndex].dataset.imagelightbox;
        if(set) {
            newState.imageLightboxSet = set;
        }
        let newQuery = _addQueryField(document.location.search, 'imageLightboxIndex', newIndex);
        if(set) {
            newQuery = _addQueryField(newQuery, 'imageLightboxSet', set);
        }
        window.history.pushState(newState, '', document.location.pathname + newQuery);
    }

    _removeQueryField(query: string, key: string): string {
        let newQuery = query;
        if (newQuery) {
            const keyRegex1 = new RegExp('\\?' + key + '=[^&]*');
            const keyRegex2 = new RegExp('&' + key + '=[^&]*');
            newQuery = newQuery.replace(keyRegex1, '?');
            newQuery = newQuery.replace(keyRegex2, '');
        }
        return newQuery;
    }

    _pushQuitToHistory(): void {
        if(!hasHistorySupport || !this.options.history) {
            return;
        }
        let newQuery = this._removeQueryField(document.location.search, 'imageLightboxIndex');
        newQuery = this._removeQueryField(newQuery, 'imageLightboxSet');
        window.history.pushState({}, '', document.location.pathname + newQuery);
    }

    _getQueryField(key: string): string|undefined {
        const keyValuePair = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)').exec(document.location.search);
        if(!keyValuePair || !keyValuePair[2]) {
            return undefined;
        }
        return decodeURIComponent(keyValuePair[2].replace(/\+/g, ' '));
    }

    _openHistory(): void {
        if(!hasHistorySupport || !this.options.history) {
            return;
        }
        const id = this._getQueryField('imageLightboxIndex');
        if(!id) {
            return;
        }
        let element = targets.filter('[data-ilb2-id="' + id + '"]');
        if(element.length > 0) {
            targetIndex = targets.index(element);
        } else {
            targetIndex = parseInt(id);
            element = $(targets[targetIndex]);
        }
        const set = this._getQueryField('imageLightboxSet');
        if(!element[0] || (!!set && set !== element[0].dataset.imagelightbox)) {
            return;
        }
        this._openImageLightbox(element, true);
    }

    _popHistory(event: BaseJQueryEventObject): void {
        const newState = (event.originalEvent as PopStateEvent).state;
        if(!newState) {
            this._quitImageLightbox(true);
            return;
        }
        const newId = newState.imageLightboxIndex;
        if(newId === undefined) {
            this._quitImageLightbox(true);
            return;
        }
        let element = targets.filter('[data-ilb2-id="' + newId + '"]');
        let newIndex = newId;
        if(element.length > 0) {
            newIndex = targets.index(element);
        } else {
            element = $(targets[newIndex]);
        }
        if(!element[0] || (newState.imageLightboxSet && newState.imageLightboxSet !== element[0].dataset.imagelightbox)) {
            return;
        }
        if(targetIndex < 0) {
            _openImageLightbox(element, true);
            return;
        }
        let direction = +1;
        if(newIndex > targetIndex) {
            direction = -1;
        }
        target = element;
        targetIndex = newIndex;
        this._loadImage(direction);
    }

    _nextTarget(): void {
        targetIndex++;
        if (targetIndex >= targets.length) {
            if (this.options.quitOnEnd === true) {
                this._quitImageLightbox();
                return;
            }
            else {
                targetIndex = 0;
            }
        }
        this._pushToHistory();
        target = targets.eq(targetIndex);
        $components.$wrapper.trigger('next.ilb2', target);
        this._loadImage(-1);
    }

    activityIndicatorOn(): void {
        $components.$wrapper.append($components.$activityObject);
    }

    activityIndicatorOff(): void {
        $('.imagelightbox-loading').remove();
    }

    overlayOn(): void {
        $components.$wrapper.append($components.$overlayObject);
    }

    closeButtonOn(): void {
        $components.$buttonObject.appendTo($components.$wrapper).on('click.ilb7', function (): boolean {
            this._quitImageLightbox();
            return false;
        });
    }

    captionReset(): void {
        $components.$captionObject.css('opacity', '0');
        $components.$captionObject.html('&nbsp;');
        if ($(target).data('ilb2-caption')) {
            $components.$captionObject.css('opacity', '1');
            $components.$captionObject.html($(target).data('ilb2-caption'));
        } else if ($(target).find('img').attr('alt')) {
            $components.$captionObject.css('opacity', '1');
            $components.$captionObject.html($(target).find('img').attr('alt')!);
        }
    }

    navigationOn: void {
        if (!targets.length) {
            return;
        }
        for (let i = 0; i < targets.length; i++) {
            $components.$navObject.append($components.$navItem.clone());
        }
        const $navItems = $components.$navObject.children('a');
        $navItems.eq(targets.index(target)).addClass('active');

        $components.$wrapper.on('previous.ilb2 next.ilb2', function (): void {
            $navItems.removeClass('active').eq(targets.index(target)).addClass('active');
        });
        $components.$wrapper.append($components.$navObject);

        $components.$navObject
            .on('click.ilb7 touchend.ilb7', function (): boolean {
                return false;
            })
            .on('click.ilb7 touchend.ilb7', 'a', function (): void {
                const $this = $(this);
                if (targets.eq($this.index()).attr('href') !== $('.imagelightbox').attr('src')) {
                    const tmpTarget = targets.eq($this.index());
                    if (tmpTarget.length) {
                        currentIndex = targets.index(target);
                        target = tmpTarget;
                        _loadImage($this.index() < currentIndex ? -1 : 1);
                    }
                }
                $this.addClass('active').siblings().removeClass('active');
            });
    }

    arrowsOn(): void {
        $components.$wrapper.append($components.$arrows);
        $components.$arrows.on('click.ilb7 touchend.ilb7', function (e): void {
            e.stopImmediatePropagation();
            e.preventDefault();
            if ($(this).hasClass('imagelightbox-arrow-left')) {
                this._previousTarget();
            } else {
                this._nextTarget();
            }
        });
    }

    isTargetValid(element: JQuery): boolean {
        // eslint-disable-next-line
        return $(element).prop('tagName').toLowerCase() === 'a' && ((new RegExp('\.(' + this.options.allowedTypes + ')$', 'i')).test($(element).attr('href')!) || $(element).data('ilb2Video'));
    }

    _setImage(): void {
        if (!image.length) {
            return;
        }
    }

    _previousTarget(): void {
        targetIndex--;
        if (targetIndex < 0) {
            if (this.options.quitOnEnd === true) {
                _quitImageLightbox();
                return;
            }
            else {
                targetIndex = targets.length - 1;
            }
        }
        target = targets.eq(targetIndex);
        this._pushToHistory();
        $components.$wrapper.trigger('previous.ilb2', target);
        this._loadImage(+1);
    }

    addToImageLightbox(elements: JQuery): void  {
        this._addTargets(elements);
        this._preloadVideos(elements);
    }

    openHistory(): void {
        this._openHistory();
    }


    loadPreviousImage(): void {
        this._previousTarget();
    }

    loadNextImage(): void {
        this._nextTarget();
    }

    quitImageLightbox(): JQuery {
        this._quitImageLightbox();
        return this;
    }

    startImageLightbox(element: JQuery): void {
        if (element) {
            element.trigger('click.ilb7');
        } else {
            $(this).trigger('click.ilb7');
        };
    }
}

$.fn.imageLightbox = Object.assign<any, ILBOptions>(
    function(this: JQuery, options: Partial<ILBOptions>): JQuery {
        // guard against double initialization
        if ($.data( this, 'imagelightbox') != null) {
            return this;
        }

        const captionHeight = options.caption ? $components.$captionObject.outerHeight()! : 0,
        screenWidth = $(window).width()!,
        screenHeight = $(window).height()! - captionHeight,
        gutterFactor = Math.abs(1 - options.gutter/100);

        function setSizes (imageWidth: number, imageHeight: number): void {
            if (imageWidth > screenWidth || imageHeight > screenHeight) {
                const ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                imageWidth /= ratio;
                imageHeight /= ratio;
            }
            const cssHeight = imageHeight*gutterFactor,
            cssWidth = imageWidth*gutterFactor,
            cssLeft = ($(window).width()! - cssWidth ) / 2;

            image.css({
                'width': cssWidth + 'px',
                'height': cssHeight + 'px',
                'left':  cssLeft + 'px'
            });
        }

        const videoElement = image.get(0) as HTMLVideoElement;
        if(videoElement.videoWidth !== undefined) {
            setSizes(videoElement.videoWidth, videoElement.videoHeight);
            return;
        }

        const tmpImage = new Image();
        tmpImage.src = image.attr('src')!;
        tmpImage.onload = function (): void {
            setSizes(tmpImage.width, tmpImage.height);
        };
    },

    _loadImage = function (direction: number): void {
        if (inProgress) {
            return;
        }

        if (image.length) {
            const params = {'opacity': 0, 'left': ''};
            if (hasCssTransitionSupport) {
                cssTransitionTranslateX(image, (100 * direction) - swipeDiff + 'px', options.animationSpeed / 1000);
            }
            else {
                params.left = parseInt(image.css('left')) + (100 * direction) + 'px';
            }
            image.animate(params, options.animationSpeed, function (): void {
                _removeImage();
            });
            swipeDiff = 0;
        }

        inProgress = true;
        _onLoadStart();

        setTimeout(function (): void {
            let swipeStart = 0;
            let swipeEnd = 0;
            let imagePosLeft = 0;
            const imgPath = target.attr('href');

            // if (imgPath === undefined) {
            //     imgPath = target.attr('data-lightbox');
            // }

            const videoOptions = target.data('ilb2Video');
            let element = $();
            let preloadedVideo;
            if (videoOptions) {
                $.each(videos, function(_, video): void {
                    if(video.i === target.data('ilb2VideoId')) {
                        preloadedVideo = video.l;
                        element = video.e;
                        if(video.a) {
                            if(preloadedVideo === false) {
                                element.attr('autoplay', video.a);
                            }
                            if(preloadedVideo === true) {
                                (element.get(0) as HTMLVideoElement).play();
                            }
                        }
                    }
                });
            } else {
                element = $('<img id=\'' + options.id + '\' />')
                    .attr('src', imgPath!);
            }
            function onload (): void {
                const params = {'opacity': 1, 'left': ''};

                image.appendTo($components.$wrapper);
                _setImage();
                image.css('opacity', 0);
                if (hasCssTransitionSupport) {
                    cssTransitionTranslateX(image, -100 * direction + 'px', 0);
                    setTimeout(function (): void {
                        cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000);
                    }, 50);
                } else {
                    imagePosLeft = parseInt(image.css('left'));
                    params.left = imagePosLeft + 'px';
                    image.css('left', imagePosLeft - 100 * direction + 'px');
                }

                image.animate(params, options.animationSpeed, function (): void {
                    inProgress = false;
                    _onLoadEnd();
                });
                if (options.preloadNext) {
                    let nextTarget = targets.eq(targets.index(target) + 1);
                    if (!nextTarget.length) {
                        nextTarget = targets.eq(0);
                    }
                    $('<img />').attr('src', nextTarget.attr('href')!);
                }
                $components.$wrapper.trigger('loaded.ilb2');
            }
            function onclick (e: BaseJQueryEventObject): void {
                e.preventDefault();
                if (options.quitOnImgClick) {
                    _quitImageLightbox();
                    return;
                }
                if (wasTouched(e.originalEvent as PointerEvent)) {
                    return;
                }
                const posX = (e.pageX || (e.originalEvent as PointerEvent).pageX) - (e.target as HTMLImageElement).offsetLeft;
                if ((e.target as HTMLImageElement).width / 2 > posX) {
                    _previousTarget();
                } else {
                    _nextTarget();
                }
            }
            image = element
                .on('load.ilb7', onload)
                .on('error.ilb7', function (): void {
                    _onLoadEnd();
                })
                .on('touchstart.ilb7 pointerdown.ilb7 MSPointerDown.ilb7', function (e: BaseJQueryEventObject): void {
                    if (!wasTouched(e.originalEvent as PointerEvent) || options.quitOnImgClick) {
                        return;
                    }
                    if (hasCssTransitionSupport) {
                        imagePosLeft = parseInt(image.css('left'));
                    }
                    swipeStart = (e.originalEvent as PointerEvent).pageX || (e.originalEvent as TouchEvent).touches[0].pageX;
                })
                .on('touchmove.ilb7 pointermove.ilb7 MSPointerMove.ilb7', function (e: BaseJQueryEventObject): void {
                    if ((!hasPointers && e.type === 'pointermove') || !wasTouched(e.originalEvent as PointerEvent) || options.quitOnImgClick) {
                        return;
                    }
                    e.preventDefault();
                    swipeEnd = (e.originalEvent as PointerEvent).pageX || (e.originalEvent as TouchEvent).touches[0].pageX;
                    swipeDiff = swipeStart - swipeEnd;
                    if (hasCssTransitionSupport) {
                        cssTransitionTranslateX(image, -swipeDiff + 'px', 0);
                    } else {
                        image.css('left', imagePosLeft - swipeDiff + 'px');
                    }
                })
                .on('touchend.ilb7 touchcancel.ilb7 pointerup.ilb7 pointercancel.ilb7 MSPointerUp.ilb7 MSPointerCancel.ilb7', function (e): void {
                    if (!wasTouched(e.originalEvent as PointerEvent) || options.quitOnImgClick) {
                        return;
                    }
                    if (Math.abs(swipeDiff) > 50) {
                        if (swipeDiff < 0) {
                            _previousTarget();
                        } else {
                            _nextTarget();
                        }
                    } else {
                        if (hasCssTransitionSupport) {
                            cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000);
                        } else {
                            image.animate({'left': imagePosLeft + 'px'}, options.animationSpeed / 2);
                        }
                    }
                });
            if(preloadedVideo === true) {
                onload();
            }
            if(preloadedVideo === false) {
                image = image.on('loadedmetadata.ilb7', onload);
            }
            if(!videoOptions) {
                image = image.on(hasPointers ? 'pointerup.ilb7 MSPointerUp.ilb7' : 'click.ilb7', onclick);
            }

        }, options.animationSpeed + 100);
    },

    _removeImage = function (): void {
        if (!image.length) {
            return;
        }
        image.remove();
        image = $();
    },

    _openImageLightbox = function ($target: JQuery, noHistory = false): void {
        if (inProgress) {
            return;
        }
        inProgress = false;
        target = $target;
        targetIndex = targets.index(target);
        if(!noHistory) {
            _pushToHistory();
        }
        _onStart();
        $components.$body.append($components.$wrapper)
            .addClass('imagelightbox-open');
        $components.$wrapper.trigger('start.ilb2', $target);
        _loadImage(0);
    },

    _quitImageLightbox = function (noHistory = false): void {
        targetIndex = -1;
        if(!noHistory) {
            _pushQuitToHistory();
        }
        $components.$wrapper.trigger('quit.ilb2');
        $components.$body.removeClass('imagelightbox-open');
        if (!image.length) {
            return;
        }
        image.animate({'opacity': 0}, options.animationSpeed, function (): void {
            _removeImage();
            inProgress = false;
            $components.$wrapper.remove().find('*').remove();
        });
    },

    _addTargets = function (newTargets: JQuery): void {
        newTargets.each(function (): void {
            targets = newTargets.add($(this));
        });
        newTargets.on('click.ilb7', {set: targetSet}, function (e): void {
            e.preventDefault();
            targetSet = $(e.currentTarget).data('imagelightbox');
            filterTargets();
            if (targets.length < 1) {
                _quitImageLightbox();
            } else {
                _openImageLightbox($(this));
            }
        });
        function filterTargets (): void {
            newTargets
                .filter(function (): boolean {
                    return $(this).data('imagelightbox') === targetSet;
                })
                .filter(function (): boolean {
                    return isTargetValid($(this));
                })
                .each(function (): void {
                    targets = targets.add($(this));
                });
        }
    },

    _preloadVideos = function (elements: JQuery): void {
        elements.each(function() {
            const videoOptions = $(this).data('ilb2Video');
            if (videoOptions) {
                let id = $(this).data('ilb2Id');
                if(!id) {
                    id = 'a' + (((1+Math.random())*0x10000)|0).toString(16); // Random id
                }
                $(this).data('ilb2VideoId', id);
                const container: PreloadedVideo = {e: $('<video id=\'' + options.id + '\' preload=\'metadata\'>'), i: id, l: false, a: undefined};
                $.each(videoOptions, function(key: string, value): void {
                    if(key === 'autoplay') {
                        container.a = value;
                    } else if(key !== 'sources') {
                        container.e = container.e.attr(key, value);
                    }
                });
                if(videoOptions.sources) {
                    $.each(videoOptions.sources, function (_, source): void {
                        let sourceElement = $('<source>');
                        $.each(source, function(key: string, value): void {
                            sourceElement = sourceElement.attr(key, value);
                        });
                        container.e.append(sourceElement);
                    });
                }
                container.e.on('loadedmetadata.ilb7', function(): void {
                    container.l = true;
                });
                videos.push(container);
            }
        });
    };

    $(window).on('resize.ilb7', _setImage);
    if (hasHistorySupport && options.history) {
        $(window).on('popstate', _popHistory);
    }

    $(document).ready((): void => {

        if (options.quitOnDocClick) {
            $(document).on(hasTouch ? 'touchend.ilb7' : 'click.ilb7', function (e): void {
                if (image.length && !$(e.target).is(image)) {
                    e.preventDefault();
                    _quitImageLightbox();
                }
            });
        }

        if (options.fullscreen && hasFullscreenSupport) {
            $(document).on('keydown.ilb7', function (e): void {
                if (!image.length) {
                    return;
                }
                if([9, 32 ,38 ,40].includes(e.which!)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                if ([13].includes(e.which!)) {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleFullScreen();
                }
            });
        }

        if (options.enableKeyboard) {
            $(document).on('keydown.ilb7', (e): void => {
                if (!image.length) {
                    return;
                }
                if ([27].includes(e.which!) && options.quitOnEscKey) {
                    e.stopPropagation();
                    e.preventDefault();
                    _quitImageLightbox();
                }
                if ([37].includes(e.which!)) {
                    e.stopPropagation();
                    e.preventDefault();
                    _previousTarget();
                }
                if ([39].includes(e.which!)) {
                    e.stopPropagation();
                    e.preventDefault();
                    _nextTarget();
                }
            });
        }
    });

    function toggleFullScreen(): void {
        const doc = window.document as LegacyDocument;
        const docEl = document.getElementById(options.id)!.parentElement as LegacyHTMLElement;

        const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        const exitFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        }
        else {
            exitFullScreen.call(doc);
        }
    }

    $(document).off('click', options.selector);

    _addTargets($(this));

    _openHistory();

    _preloadVideos(targets);

    this.each(() => {
        $.data( this, $.fn.imageLightbox.PROJECT_NAME, new ImageLightbox( options, this ) );
    });

    return this;
},
{
    PROJECT_NAME,

    options: {
        selector:       'a[data-imagelightbox]',
        id:             'imagelightbox',
        allowedTypes:   'png|jpg|jpeg|gif',
        animationSpeed: 250,
        activity:       false,
        arrows:         false,
        button:         false,
        caption:        false,
        enableKeyboard: true,
        history:        false,
        fullscreen:     false,
        gutter:         10,     // percentage of client height
        offsetY:        0,      // percentage of gutter
        navigation:     false,
        overlay:        false,
        preloadNext:    true,
        quitOnEnd:      false,
        quitOnImgClick: false,
        quitOnDocClick: true,
        quitOnEscKey:   true
    },
},
);
