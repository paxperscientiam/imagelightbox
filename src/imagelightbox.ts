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
    wasTouched,

    toggleFullScreen,
} from './imagelightbox.support';

import {
    setSizes,
} from './imagelightbox.transforms';

import { $components } from './imagelightbox.components';

export class ImageLightbox implements ImageLightboxPlugin {
    currentIndex: number = 0;
    image: JQuery<HTMLElement|HTMLImageElement|HTMLVideoElement>;
    inProgress: boolean = false;
    swipeDiff: number = 0;
    target: JQuery<HTMLElement> = $();
    targetIndex: number = -1;

    targets: JQuery = $([]);
    targetSet: string = '';
    videos: Array<PreloadedVideo> = [];

    options: ILBOptions;

    PROJECT_NAME: string = 'imageLightbox';

    constructor(options: ILBOptions, elementT: JQuery) {
        const self = this;

        this.image = $(elementT);

        this.options = options;

        const captionHeight = options.caption ? $components.$captionObject.outerHeight()! : 0;
        const screenWidth = $(window).width()!;
        const screenHeight = $(window).height()! - captionHeight;
        const gutterFactor = Math.abs(1 - options.gutter/100);

        const videoElement = this.image.get(0) as HTMLVideoElement;
        if(videoElement.videoWidth !== undefined) {
//            setSizes({width:screenWidth, height:screenHeight}, {width:videoElement.videoWidth, height:videoElement.videoHeight});
            return;
        }

        const tmpImage = new Image();
        tmpImage.src = self.image.attr('src')!;
        tmpImage.onload = function (): void {
            // tmpImage.width, imageHeight: tmpImage.height
            self.image = setSizes({width:screenWidth, height:screenHeight}, {width: tmpImage.width, height:tmpImage.height, gutterFactor}, $(elementT as JQuery<HTMLImageElement>));
        };

        $(window).on('resize.ilb7', this._setImage);
        if (hasHistorySupport && options.history) {
            $(window).on('popstate', this._popHistory);
        }

        $(document).ready((): void => {

            if (options.quitOnDocClick) {
                $(document).on(hasTouch ? 'touchend.ilb7' : 'click.ilb7', function (e): void {
                    if (self.image.length && !$(e.target).is(self.image)) {
                        e.preventDefault();
                        self._quitImageLightbox();
                    }
                });
            }

            if (options.fullscreen && hasFullscreenSupport) {
                $(document).on('keydown.ilb7', function (e): void {
                    if (!self.image.length) {
                        return;
                    }
                    if([9, 32 ,38 ,40].includes(e.which!)) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    if ([13].includes(e.which!)) {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleFullScreen(options.id);
                    }
                });
            }

            if (options.enableKeyboard) {
                $(document).on('keydown.ilb7', (e): void => {
                    if (!self.image.length) {
                        return;
                    }
                    if ([27].includes(e.which!) && options.quitOnEscKey) {
                        e.stopPropagation();
                        e.preventDefault();
                        self._quitImageLightbox();
                    }
                    if ([37].includes(e.which!)) {
                        e.stopPropagation();
                        e.preventDefault();
                        self._previousTarget();
                    }
                    if ([39].includes(e.which!)) {
                        e.stopPropagation();
                        e.preventDefault();
                        self._nextTarget();
                    }
                });
            }
        });
        this._addTargets($());

        this._openHistory();

        this._preloadVideos(this.targets);
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
        let newIndex = this.targets[this.targetIndex].dataset.ilb2Id;
        if(!newIndex) {
            newIndex = this.targetIndex.toString();
        }
        const newState = {imageLightboxIndex: newIndex, imageLightboxSet: ''};
        const set = this.targets[this.targetIndex].dataset.imagelightbox;
        if(set) {
            newState.imageLightboxSet = set;
        }
        let newQuery = this._addQueryField(document.location.search, 'imageLightboxIndex', newIndex);
        if(set) {
            newQuery = this._addQueryField(newQuery, 'imageLightboxSet', set);
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
        let element = this.targets.filter('[data-ilb2-id="' + id + '"]');
        if(element.length > 0) {
            this.targetIndex = this.targets.index(element);
        } else {
            this.targetIndex = parseInt(id);
            element = $(this.targets[this.targetIndex]);
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
        let element = this.targets.filter('[data-ilb2-id="' + newId + '"]');
        let newIndex = newId;
        if(element.length > 0) {
            newIndex = this.targets.index(element);
        } else {
            element = $(this.targets[newIndex]);
        }
        if(!element[0] || (newState.imageLightboxSet && newState.imageLightboxSet !== element[0].dataset.imagelightbox)) {
            return;
        }
        if(this.targetIndex < 0) {
            this._openImageLightbox(element, true);
            return;
        }
        let direction = +1;
        if(newIndex > this.targetIndex) {
            direction = -1;
        }
        this.target = element;
        this.targetIndex = newIndex;
        this._loadImage(direction);
    }

    _nextTarget(): void {
        this.targetIndex++;
        if (this.targetIndex >= this.targets.length) {
            if (this.options.quitOnEnd === true) {
                this._quitImageLightbox();
                return;
            }
            else {
                this.targetIndex = 0;
            }
        }
        this._pushToHistory();
        this.target = this.targets.eq(this.targetIndex);
        $components.$wrapper.trigger('next.ilb2', this.target);
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
        const self = this;
        $components.$buttonObject.appendTo($components.$wrapper).on('click.ilb7', function (): void {
            self._quitImageLightbox();
        });
    }

    captionReset(): void {
        $components.$captionObject.css('opacity', '0');
        $components.$captionObject.html('&nbsp;');
        if ($(this.target).data('ilb2-caption')) {
            $components.$captionObject.css('opacity', '1');
            $components.$captionObject.html($(this.target).data('ilb2-caption'));
        } else if ($(this.target).find('img').attr('alt')) {
            $components.$captionObject.css('opacity', '1');
            $components.$captionObject.html($(this.target).find('img').attr('alt')!);
        }
    }

    navigationOn(): void {
        const self = this;

        if (!this.targets.length) {
            return;
        }
        for (let i = 0; i < this.targets.length; i++) {
            $components.$navObject.append($components.$navItem.clone());
        }
        const $navItems = $components.$navObject.children('a');
        $navItems.eq(this.targets.index(this.target)).addClass('active');

        $components.$wrapper.on('previous.ilb2 next.ilb2', function (): void {
            $navItems.removeClass('active').eq(self.targets.index(self.target)).addClass('active');
        });
        $components.$wrapper.append($components.$navObject);

        $components.$navObject
            .on('click.ilb7 touchend.ilb7', function (): boolean {
                return false;
            })
            .on('click.ilb7 touchend.ilb7', 'a', function (): void {
                const $this = $(this);
                if (this.targets.eq($this.index()).attr('href') !== $('.imagelightbox').attr('src')) {
                    const tmpTarget = this.targets.eq($this.index());
                    if (tmpTarget.length) {
                        this.currentIndex = this.targets.index(this.target);
                        this.target = tmpTarget;
                        this._loadImage($this.index() < this.currentIndex ? -1 : 1);
                    }
                }
                $this.addClass('active').siblings().removeClass('active');
            });
    }

    arrowsOn(): void {
        const self = this;
        $components.$wrapper.append($components.$arrows);
        $components.$arrows.on('click.ilb7 touchend.ilb7', function (e): void {
            e.stopImmediatePropagation();
            e.preventDefault();
            if ($(this).hasClass('imagelightbox-arrow-left')) {
                self._previousTarget();
            } else {
                self._nextTarget();
            }
        });
    }

    isTargetValid(element: JQuery): boolean {
        // eslint-disable-next-line
        return $(element).prop('tagName').toLowerCase() === 'a' && ((new RegExp('\.(' + this.options.allowedTypes + ')$', 'i')).test($(element).attr('href')!) || $(element).data('ilb2Video'));
    }

    _setImage(): void {
        if (!this.image.length) {
            return;
        }
    }

    _previousTarget(): void {
        this.targetIndex--;
        if (this.targetIndex < 0) {
            if (this.options.quitOnEnd === true) {
                this._quitImageLightbox();
                return;
            }
            else {
                this.targetIndex = this.targets.length - 1;
            }
        }
        this.target = this.targets.eq(this.targetIndex);
        this._pushToHistory();
        $components.$wrapper.trigger('previous.ilb2', this.target);
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

    quitImageLightbox(): void {
        this._quitImageLightbox();
    }

    startImageLightbox(element: JQuery): void {
        if (element) {
            element.trigger('click.ilb7');
        } else {
            $(this).trigger('click.ilb7');
        }
    }

    _loadImage(direction: number): void {
        const self = this;

        if (this.inProgress) {
            return;
        }

        if (this.image.length) {
            const params = {'opacity': 0, 'left': ''};
            if (hasCssTransitionSupport) {
                cssTransitionTranslateX(this.image, (100 * direction) - this.swipeDiff + 'px', self.options.animationSpeed / 1000);
            }
            else {
                params.left = parseInt(self.image.css('left')) + (100 * direction) + 'px';
            }
            this.image.animate(params, self.options.animationSpeed, function (): void {
                self._removeImage();
            });
            this.swipeDiff = 0;
        }

        this.inProgress = true;
        this._onLoadStart();


        setTimeout(function (): void {
            let swipeStart = 0;
            let swipeEnd = 0;
            let imagePosLeft = 0;
            const imgPath = self.target.attr('href');

            // if (imgPath === undefined) {
            //     imgPath = target.attr('data-lightbox');
            // }

            const videoOptions = self.target.data('ilb2Video');
            let element = $();
            let preloadedVideo;
            if (videoOptions) {
                $.each(self.videos, function(_, video): void {
                    if(video.i === self.target.data('ilb2VideoId')) {
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
                element = $('<img id=\'' + self.options.id + '\' />')
                    .attr('src', imgPath!);
            }
            function onload (): void {
                const params = {'opacity': 1, 'left': ''};

                self.image.appendTo($components.$wrapper);
                self._setImage();
                self.image.css('opacity', 0);
                if (hasCssTransitionSupport) {
                    cssTransitionTranslateX(self.image, -100 * direction + 'px', 0);
                    setTimeout(function (): void {
                        cssTransitionTranslateX(self.image, 0 + 'px', self.options.animationSpeed / 1000);
                    }, 50);
                } else {
                    imagePosLeft = parseInt(self.image.css('left'));
                    params.left = imagePosLeft + 'px';
                    self.image.css('left', imagePosLeft - 100 * direction + 'px');
                }

                self.image.animate(params, self.options.animationSpeed, function (): void {
                    self.inProgress = false;
                    self._onLoadEnd();
                });
                if (self.options.preloadNext) {
                    let nextTarget = self.targets.eq(self.targets.index(self.target) + 1);
                    if (!nextTarget.length) {
                        nextTarget = self.targets.eq(0);
                    }
                    $('<img />').attr('src', nextTarget.attr('href')!);
                }
                $components.$wrapper.trigger('loaded.ilb2');
            }
            function onclick (e: BaseJQueryEventObject): void {
                e.preventDefault();
                if (self.options.quitOnImgClick) {
                    self._quitImageLightbox();
                    return;
                }
                if (wasTouched(e.originalEvent as PointerEvent)) {
                    return;
                }
                const posX = (e.pageX || (e.originalEvent as PointerEvent).pageX) - (e.target as HTMLImageElement).offsetLeft;
                if ((e.target as HTMLImageElement).width / 2 > posX) {
                    self._previousTarget();
                } else {
                    self._nextTarget();
                }
            }

            self.image = element
                .on('load.ilb7', onload)
                .on('error.ilb7', function (): void {
                    self._onLoadEnd();
                })
                .on('touchstart.ilb7 pointerdown.ilb7 MSPointerDown.ilb7', function (e: BaseJQueryEventObject): void {
                    if (!wasTouched(e.originalEvent as PointerEvent) || self.options.quitOnImgClick) {
                        return;
                    }
                    if (hasCssTransitionSupport) {
                        imagePosLeft = parseInt(self.image.css('left'));
                    }
                    swipeStart = (e.originalEvent as PointerEvent).pageX || (e.originalEvent as TouchEvent).touches[0].pageX;
                })
                .on('touchmove.ilb7 pointermove.ilb7 MSPointerMove.ilb7', function (e: BaseJQueryEventObject): void {
                    if ((!hasPointers && e.type === 'pointermove') || !wasTouched(e.originalEvent as PointerEvent) || self.options.quitOnImgClick) {
                        return;
                    }
                    e.preventDefault();
                    swipeEnd = (e.originalEvent as PointerEvent).pageX || (e.originalEvent as TouchEvent).touches[0].pageX;
                    self.swipeDiff = swipeStart - swipeEnd;
                    if (hasCssTransitionSupport) {
                        cssTransitionTranslateX(self.image, -1 * self.swipeDiff + 'px', 0);
                    } else {
                        self.image.css('left', imagePosLeft - self.swipeDiff + 'px');
                    }
                })
                .on('touchend.ilb7 touchcancel.ilb7 pointerup.ilb7 pointercancel.ilb7 MSPointerUp.ilb7 MSPointerCancel.ilb7', function (e): void {
                    if (!wasTouched(e.originalEvent as PointerEvent) || self.options.quitOnImgClick) {
                        return;
                    }
                    if (Math.abs(self.swipeDiff) > 50) {
                        if (self.swipeDiff < 0) {
                            self._previousTarget();
                        } else {
                            self._nextTarget();
                        }
                    } else {
                        if (hasCssTransitionSupport) {
                            cssTransitionTranslateX(self.image, 0 + 'px', self.options.animationSpeed / 1000);
                        } else {
                            self.image.animate({'left': imagePosLeft + 'px'}, self.options.animationSpeed / 2);
                        }
                    }
                });
            if(preloadedVideo === true) {
                onload();
            }
            if(preloadedVideo === false) {
                self.image = self.image.on('loadedmetadata.ilb7', onload);
            }
            if(!videoOptions) {
                self.image = self.image.on(hasPointers ? 'pointerup.ilb7 MSPointerUp.ilb7' : 'click.ilb7', onclick);
            }

        }, self.options.animationSpeed + 100);
    }

    _removeImage(): void {
        if (!this.image.length) {
            return;
        }
        this.image.remove();
        this.image = $();
    }

    _openImageLightbox($target: JQuery, noHistory = false): void {
        if (this.inProgress) {
            return;
        }
        this.inProgress = false;
        this.target = $target;
        this.targetIndex = this.targets.index(this.target);
        if(!noHistory) {
            this._pushToHistory();
        }
        this._onStart();
        $components.$body.append($components.$wrapper)
            .addClass('imagelightbox-open');
        $components.$wrapper.trigger('start.ilb2', $target);
        this._loadImage(0);
    }

    _quitImageLightbox(noHistory = false): void {
        const self = this;
        this.targetIndex = -1;
        if(!noHistory) {
            this._pushQuitToHistory();
        }
        $components.$wrapper.trigger('quit.ilb2');
        $components.$body.removeClass('imagelightbox-open');
        if (!this.image.length) {
            return;
        }
        this.image.animate({'opacity': 0}, self.options.animationSpeed, function (): void {
            self._removeImage();
            self.inProgress = false;
            $components.$wrapper.remove().find('*').remove();
        });
    }

    _addTargets(newTargets: JQuery): void {
        const self = this;
        newTargets.each(function (): void {
            self.targets = newTargets.add($(this));
        });

        newTargets.on('click.ilb7', {set: self.targetSet}, function (e): void {
            e.preventDefault();
            self.targetSet = $(e.currentTarget).data('imagelightbox');
            filterTargets();
            if (self.targets.length < 1) {
                self._quitImageLightbox();
            } else {
                self._openImageLightbox($(this));
            }
        });
        function filterTargets (): void {
            newTargets
                .filter(function (): boolean {
                    return $(this).data('imagelightbox') === self.targetSet;
                })
                .filter(function (): boolean {
                    return self.isTargetValid($(this));
                })
                .each(function (): void {
                    self.targets = self.targets.add($(this));
                });
        }
    }

    _preloadVideos(elements: JQuery): void {
        const self = this;
        elements.each(function() {
            const videoOptions = $(this).data('ilb2Video');
            if (videoOptions) {
                let id = $(this).data('ilb2Id');
                if(!id) {
                    id = 'a' + (((1+Math.random())*0x10000)|0).toString(16); // Random id
                }
                $(this).data('ilb2VideoId', id);
                const container: PreloadedVideo = {e: $('<video id=\'' + self.options.id + '\' preload=\'metadata\'>'), i: id, l: false, a: undefined};
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
                self.videos.push(container);
            }
        });
    }
}
