(function(FuseBox){FuseBox.$fuse$=FuseBox;
FuseBox.target = "browser";
// allowSyntheticDefaultImports
FuseBox.sdep = true;
var __process_env__ = {"COMPILE_TIME":"1575148252979","PROJECT_NAME":"bookblock"};
FuseBox.pkg("default", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PROJECT_NAME = 'imageLightbox';
const imagelightbox_1 = require("./imagelightbox");
$.fn.imageLightbox = Object.assign(function (options) {
    // guard against double initialization
    if ($.data(this, PROJECT_NAME) != null) {
        return this;
    }
    // Here's a best practice for overriding 'defaults'
    // with specified options. Note how, rather than a
    // regular defaults object being passed as the second
    // parameter, we instead refer to $.fn.pluginName.options
    // explicitly, merging it with the options passed directly
    // to the plugin. This allows us to override options both
    // globally and on a per-call level.
    //   // Merge the global options with the options given as argument.
    const mergedOptions = Object.assign(Object.assign({}, $.fn.imageLightbox.options), options);
    $(document).off('click', mergedOptions.selector);
    this.each(() => {
        $.data(this, $.fn.imageLightbox.PROJECT_NAME, new imagelightbox_1.ImageLightbox(mergedOptions, this));
    });
    return this;
}, {
    PROJECT_NAME,
    options: {
        selector: 'a[data-imagelightbox]',
        id: 'imagelightbox',
        allowedTypes: 'png|jpg|jpeg|gif',
        animationSpeed: 250,
        activity: false,
        arrows: false,
        button: false,
        caption: false,
        enableKeyboard: true,
        history: false,
        fullscreen: false,
        gutter: 10,
        offsetY: 0,
        navigation: false,
        overlay: false,
        preloadNext: true,
        quitOnEnd: false,
        quitOnImgClick: false,
        quitOnDocClick: true,
        quitOnEscKey: true,
    },
});

});
___scope___.file("imagelightbox.js", function(exports, require, module, __filename, __dirname){

"use strict";
// http://blog.npmjs.org/post/112712169830/making-your-jquery-plugin-work-better-with-npm
// If there is a variable named module and it has an exports property,
// then we're working in a Node-like environment. Use require to load
// the jQuery object that the module system is using and pass it in.
// Otherwise, we're working in a browser, so just pass in the global
// jQuery object.
Object.defineProperty(exports, "__esModule", { value: true });
const imagelightbox_support_1 = require("./imagelightbox.support");
const imagelightbox_transforms_1 = require("./imagelightbox.transforms");
const imagelightbox_components_1 = require("./imagelightbox.components");
class ImageLightbox {
    constructor(options, elementT) {
        this.currentIndex = 0;
        this.inProgress = false;
        this.swipeDiff = 0;
        this.target = $();
        this.targetIndex = -1;
        this.targets = $([]);
        this.targetSet = '';
        this.videos = [];
        this.PROJECT_NAME = 'imageLightbox';
        const self = this;
        this.image = $(elementT);
        this.options = options;
        const captionHeight = options.caption ? imagelightbox_components_1.$components.$captionObject.outerHeight() : 0;
        const screenWidth = $(window).width();
        const screenHeight = $(window).height() - captionHeight;
        const gutterFactor = Math.abs(1 - options.gutter / 100);
        const videoElement = this.image.get(0);
        if (videoElement.videoWidth !== undefined) {
            //            setSizes({width:screenWidth, height:screenHeight}, {width:videoElement.videoWidth, height:videoElement.videoHeight});
            return;
        }
        const tmpImage = new Image();
        tmpImage.src = self.image.attr('src');
        tmpImage.onload = function () {
            // tmpImage.width, imageHeight: tmpImage.height
            self.image = imagelightbox_transforms_1.setSizes({ width: screenWidth, height: screenHeight }, { width: tmpImage.width, height: tmpImage.height, gutterFactor }, $(elementT));
        };
        $(window).on('resize.ilb7', this._setImage);
        if (imagelightbox_support_1.hasHistorySupport && options.history) {
            $(window).on('popstate', this._popHistory);
        }
        $(document).ready(() => {
            if (options.quitOnDocClick) {
                $(document).on(imagelightbox_support_1.hasTouch ? 'touchend.ilb7' : 'click.ilb7', function (e) {
                    if (self.image.length && !$(e.target).is(self.image)) {
                        e.preventDefault();
                        self._quitImageLightbox();
                    }
                });
            }
            if (options.fullscreen && imagelightbox_support_1.hasFullscreenSupport) {
                $(document).on('keydown.ilb7', function (e) {
                    if (!self.image.length) {
                        return;
                    }
                    if ([9, 32, 38, 40].includes(e.which)) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    if ([13].includes(e.which)) {
                        e.stopPropagation();
                        e.preventDefault();
                        imagelightbox_support_1.toggleFullScreen(options.id);
                    }
                });
            }
            if (options.enableKeyboard) {
                $(document).on('keydown.ilb7', (e) => {
                    if (!self.image.length) {
                        return;
                    }
                    if ([27].includes(e.which) && options.quitOnEscKey) {
                        e.stopPropagation();
                        e.preventDefault();
                        self._quitImageLightbox();
                    }
                    if ([37].includes(e.which)) {
                        e.stopPropagation();
                        e.preventDefault();
                        self._previousTarget();
                    }
                    if ([39].includes(e.which)) {
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
    _onStart() {
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
            imagelightbox_components_1.$components.$wrapper.append(imagelightbox_components_1.$components.$captionObject);
        }
    }
    _onLoadStart() {
        if (this.options.activity) {
            this.activityIndicatorOn();
        }
        if (this.options.caption) {
            this.captionReset();
        }
    }
    _onLoadEnd() {
        if (this.options.activity) {
            this.activityIndicatorOff();
        }
        if (this.options.arrows) {
            imagelightbox_components_1.$components.$arrows.css('display', 'block');
        }
    }
    _addQueryField(query, key, value) {
        const newField = key + '=' + value;
        let newQuery = '?' + newField;
        if (query) {
            const keyRegex = new RegExp('([?&])' + key + '=[^&]*');
            if (keyRegex.exec(query) !== null) {
                newQuery = query.replace(keyRegex, '$1' + newField);
            }
            else {
                newQuery = query + '&' + newField;
            }
        }
        return newQuery;
    }
    _pushToHistory() {
        if (!imagelightbox_support_1.hasHistorySupport || !this.options.history) {
            return;
        }
        let newIndex = this.targets[this.targetIndex].dataset.ilb2Id;
        if (!newIndex) {
            newIndex = this.targetIndex.toString();
        }
        const newState = { imageLightboxIndex: newIndex, imageLightboxSet: '' };
        const set = this.targets[this.targetIndex].dataset.imagelightbox;
        if (set) {
            newState.imageLightboxSet = set;
        }
        let newQuery = this._addQueryField(document.location.search, 'imageLightboxIndex', newIndex);
        if (set) {
            newQuery = this._addQueryField(newQuery, 'imageLightboxSet', set);
        }
        window.history.pushState(newState, '', document.location.pathname + newQuery);
    }
    _removeQueryField(query, key) {
        let newQuery = query;
        if (newQuery) {
            const keyRegex1 = new RegExp('\\?' + key + '=[^&]*');
            const keyRegex2 = new RegExp('&' + key + '=[^&]*');
            newQuery = newQuery.replace(keyRegex1, '?');
            newQuery = newQuery.replace(keyRegex2, '');
        }
        return newQuery;
    }
    _pushQuitToHistory() {
        if (!imagelightbox_support_1.hasHistorySupport || !this.options.history) {
            return;
        }
        let newQuery = this._removeQueryField(document.location.search, 'imageLightboxIndex');
        newQuery = this._removeQueryField(newQuery, 'imageLightboxSet');
        window.history.pushState({}, '', document.location.pathname + newQuery);
    }
    _getQueryField(key) {
        const keyValuePair = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)').exec(document.location.search);
        if (!keyValuePair || !keyValuePair[2]) {
            return undefined;
        }
        return decodeURIComponent(keyValuePair[2].replace(/\+/g, ' '));
    }
    _openHistory() {
        if (!imagelightbox_support_1.hasHistorySupport || !this.options.history) {
            return;
        }
        const id = this._getQueryField('imageLightboxIndex');
        if (!id) {
            return;
        }
        let element = this.targets.filter('[data-ilb2-id="' + id + '"]');
        if (element.length > 0) {
            this.targetIndex = this.targets.index(element);
        }
        else {
            this.targetIndex = parseInt(id);
            element = $(this.targets[this.targetIndex]);
        }
        const set = this._getQueryField('imageLightboxSet');
        if (!element[0] || (!!set && set !== element[0].dataset.imagelightbox)) {
            return;
        }
        this._openImageLightbox(element, true);
    }
    _popHistory(event) {
        const newState = event.originalEvent.state;
        if (!newState) {
            this._quitImageLightbox(true);
            return;
        }
        const newId = newState.imageLightboxIndex;
        if (newId === undefined) {
            this._quitImageLightbox(true);
            return;
        }
        let element = this.targets.filter('[data-ilb2-id="' + newId + '"]');
        let newIndex = newId;
        if (element.length > 0) {
            newIndex = this.targets.index(element);
        }
        else {
            element = $(this.targets[newIndex]);
        }
        if (!element[0] || (newState.imageLightboxSet && newState.imageLightboxSet !== element[0].dataset.imagelightbox)) {
            return;
        }
        if (this.targetIndex < 0) {
            this._openImageLightbox(element, true);
            return;
        }
        let direction = +1;
        if (newIndex > this.targetIndex) {
            direction = -1;
        }
        this.target = element;
        this.targetIndex = newIndex;
        this._loadImage(direction);
    }
    _nextTarget() {
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
        imagelightbox_components_1.$components.$wrapper.trigger('next.ilb2', this.target);
        this._loadImage(-1);
    }
    activityIndicatorOn() {
        imagelightbox_components_1.$components.$wrapper.append(imagelightbox_components_1.$components.$activityObject);
    }
    activityIndicatorOff() {
        $('.imagelightbox-loading').remove();
    }
    overlayOn() {
        imagelightbox_components_1.$components.$wrapper.append(imagelightbox_components_1.$components.$overlayObject);
    }
    closeButtonOn() {
        const self = this;
        imagelightbox_components_1.$components.$buttonObject.appendTo(imagelightbox_components_1.$components.$wrapper).on('click.ilb7', function () {
            self._quitImageLightbox();
        });
    }
    captionReset() {
        imagelightbox_components_1.$components.$captionObject.css('opacity', '0');
        imagelightbox_components_1.$components.$captionObject.html('&nbsp;');
        if ($(this.target).data('ilb2-caption')) {
            imagelightbox_components_1.$components.$captionObject.css('opacity', '1');
            imagelightbox_components_1.$components.$captionObject.html($(this.target).data('ilb2-caption'));
        }
        else if ($(this.target).find('img').attr('alt')) {
            imagelightbox_components_1.$components.$captionObject.css('opacity', '1');
            imagelightbox_components_1.$components.$captionObject.html($(this.target).find('img').attr('alt'));
        }
    }
    navigationOn() {
        const self = this;
        if (!this.targets.length) {
            return;
        }
        for (let i = 0; i < this.targets.length; i++) {
            imagelightbox_components_1.$components.$navObject.append(imagelightbox_components_1.$components.$navItem.clone());
        }
        const $navItems = imagelightbox_components_1.$components.$navObject.children('a');
        $navItems.eq(this.targets.index(this.target)).addClass('active');
        imagelightbox_components_1.$components.$wrapper.on('previous.ilb2 next.ilb2', function () {
            $navItems.removeClass('active').eq(self.targets.index(self.target)).addClass('active');
        });
        imagelightbox_components_1.$components.$wrapper.append(imagelightbox_components_1.$components.$navObject);
        imagelightbox_components_1.$components.$navObject
            .on('click.ilb7 touchend.ilb7', function () {
            return false;
        })
            .on('click.ilb7 touchend.ilb7', 'a', function () {
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
    arrowsOn() {
        const self = this;
        imagelightbox_components_1.$components.$wrapper.append(imagelightbox_components_1.$components.$arrows);
        imagelightbox_components_1.$components.$arrows.on('click.ilb7 touchend.ilb7', function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            if ($(this).hasClass('imagelightbox-arrow-left')) {
                self._previousTarget();
            }
            else {
                self._nextTarget();
            }
        });
    }
    isTargetValid(element) {
        // eslint-disable-next-line
        return $(element).prop('tagName').toLowerCase() === 'a' && ((new RegExp('\.(' + this.options.allowedTypes + ')$', 'i')).test($(element).attr('href')) || $(element).data('ilb2Video'));
    }
    _setImage() {
        if (!this.image.length) {
            return;
        }
    }
    _previousTarget() {
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
        imagelightbox_components_1.$components.$wrapper.trigger('previous.ilb2', this.target);
        this._loadImage(+1);
    }
    addToImageLightbox(elements) {
        this._addTargets(elements);
        this._preloadVideos(elements);
    }
    openHistory() {
        this._openHistory();
    }
    loadPreviousImage() {
        this._previousTarget();
    }
    loadNextImage() {
        this._nextTarget();
    }
    quitImageLightbox() {
        this._quitImageLightbox();
    }
    startImageLightbox(element) {
        if (element) {
            element.trigger('click.ilb7');
        }
        else {
            $(this).trigger('click.ilb7');
        }
    }
    _loadImage(direction) {
        const self = this;
        if (this.inProgress) {
            return;
        }
        if (this.image.length) {
            const params = { 'opacity': 0, 'left': '' };
            if (imagelightbox_support_1.hasCssTransitionSupport) {
                imagelightbox_support_1.cssTransitionTranslateX(this.image, (100 * direction) - this.swipeDiff + 'px', self.options.animationSpeed / 1000);
            }
            else {
                params.left = parseInt(self.image.css('left')) + (100 * direction) + 'px';
            }
            this.image.animate(params, self.options.animationSpeed, function () {
                self._removeImage();
            });
            this.swipeDiff = 0;
        }
        this.inProgress = true;
        this._onLoadStart();
        setTimeout(function () {
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
                $.each(self.videos, function (_, video) {
                    if (video.i === self.target.data('ilb2VideoId')) {
                        preloadedVideo = video.l;
                        element = video.e;
                        if (video.a) {
                            if (preloadedVideo === false) {
                                element.attr('autoplay', video.a);
                            }
                            if (preloadedVideo === true) {
                                element.get(0).play();
                            }
                        }
                    }
                });
            }
            else {
                element = $('<img id=\'' + self.options.id + '\' />')
                    .attr('src', imgPath);
            }
            function onload() {
                const params = { 'opacity': 1, 'left': '' };
                self.image.appendTo(imagelightbox_components_1.$components.$wrapper);
                self._setImage();
                self.image.css('opacity', 0);
                if (imagelightbox_support_1.hasCssTransitionSupport) {
                    imagelightbox_support_1.cssTransitionTranslateX(self.image, -100 * direction + 'px', 0);
                    setTimeout(function () {
                        imagelightbox_support_1.cssTransitionTranslateX(self.image, 0 + 'px', self.options.animationSpeed / 1000);
                    }, 50);
                }
                else {
                    imagePosLeft = parseInt(self.image.css('left'));
                    params.left = imagePosLeft + 'px';
                    self.image.css('left', imagePosLeft - 100 * direction + 'px');
                }
                self.image.animate(params, self.options.animationSpeed, function () {
                    self.inProgress = false;
                    self._onLoadEnd();
                });
                if (self.options.preloadNext) {
                    let nextTarget = self.targets.eq(self.targets.index(self.target) + 1);
                    if (!nextTarget.length) {
                        nextTarget = self.targets.eq(0);
                    }
                    $('<img />').attr('src', nextTarget.attr('href'));
                }
                imagelightbox_components_1.$components.$wrapper.trigger('loaded.ilb2');
            }
            function onclick(e) {
                e.preventDefault();
                if (self.options.quitOnImgClick) {
                    self._quitImageLightbox();
                    return;
                }
                if (imagelightbox_support_1.wasTouched(e.originalEvent)) {
                    return;
                }
                const posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
                if (e.target.width / 2 > posX) {
                    self._previousTarget();
                }
                else {
                    self._nextTarget();
                }
            }
            self.image = element
                .on('load.ilb7', onload)
                .on('error.ilb7', function () {
                self._onLoadEnd();
            })
                .on('touchstart.ilb7 pointerdown.ilb7 MSPointerDown.ilb7', function (e) {
                if (!imagelightbox_support_1.wasTouched(e.originalEvent) || self.options.quitOnImgClick) {
                    return;
                }
                if (imagelightbox_support_1.hasCssTransitionSupport) {
                    imagePosLeft = parseInt(self.image.css('left'));
                }
                swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
            })
                .on('touchmove.ilb7 pointermove.ilb7 MSPointerMove.ilb7', function (e) {
                if ((!imagelightbox_support_1.hasPointers && e.type === 'pointermove') || !imagelightbox_support_1.wasTouched(e.originalEvent) || self.options.quitOnImgClick) {
                    return;
                }
                e.preventDefault();
                swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                self.swipeDiff = swipeStart - swipeEnd;
                if (imagelightbox_support_1.hasCssTransitionSupport) {
                    imagelightbox_support_1.cssTransitionTranslateX(self.image, -1 * self.swipeDiff + 'px', 0);
                }
                else {
                    self.image.css('left', imagePosLeft - self.swipeDiff + 'px');
                }
            })
                .on('touchend.ilb7 touchcancel.ilb7 pointerup.ilb7 pointercancel.ilb7 MSPointerUp.ilb7 MSPointerCancel.ilb7', function (e) {
                if (!imagelightbox_support_1.wasTouched(e.originalEvent) || self.options.quitOnImgClick) {
                    return;
                }
                if (Math.abs(self.swipeDiff) > 50) {
                    if (self.swipeDiff < 0) {
                        self._previousTarget();
                    }
                    else {
                        self._nextTarget();
                    }
                }
                else {
                    if (imagelightbox_support_1.hasCssTransitionSupport) {
                        imagelightbox_support_1.cssTransitionTranslateX(self.image, 0 + 'px', self.options.animationSpeed / 1000);
                    }
                    else {
                        self.image.animate({ 'left': imagePosLeft + 'px' }, self.options.animationSpeed / 2);
                    }
                }
            });
            if (preloadedVideo === true) {
                onload();
            }
            if (preloadedVideo === false) {
                self.image = self.image.on('loadedmetadata.ilb7', onload);
            }
            if (!videoOptions) {
                self.image = self.image.on(imagelightbox_support_1.hasPointers ? 'pointerup.ilb7 MSPointerUp.ilb7' : 'click.ilb7', onclick);
            }
        }, self.options.animationSpeed + 100);
    }
    _removeImage() {
        if (!this.image.length) {
            return;
        }
        this.image.remove();
        this.image = $();
    }
    _openImageLightbox($target, noHistory = false) {
        if (this.inProgress) {
            return;
        }
        this.inProgress = false;
        this.target = $target;
        this.targetIndex = this.targets.index(this.target);
        if (!noHistory) {
            this._pushToHistory();
        }
        this._onStart();
        imagelightbox_components_1.$components.$body.append(imagelightbox_components_1.$components.$wrapper)
            .addClass('imagelightbox-open');
        imagelightbox_components_1.$components.$wrapper.trigger('start.ilb2', $target);
        this._loadImage(0);
    }
    _quitImageLightbox(noHistory = false) {
        const self = this;
        this.targetIndex = -1;
        if (!noHistory) {
            this._pushQuitToHistory();
        }
        imagelightbox_components_1.$components.$wrapper.trigger('quit.ilb2');
        imagelightbox_components_1.$components.$body.removeClass('imagelightbox-open');
        if (!this.image.length) {
            return;
        }
        this.image.animate({ 'opacity': 0 }, self.options.animationSpeed, function () {
            self._removeImage();
            self.inProgress = false;
            imagelightbox_components_1.$components.$wrapper.remove().find('*').remove();
        });
    }
    _addTargets(newTargets) {
        const self = this;
        newTargets.each(function () {
            self.targets = newTargets.add($(this));
        });
        newTargets.on('click.ilb7', { set: self.targetSet }, function (e) {
            e.preventDefault();
            self.targetSet = $(e.currentTarget).data('imagelightbox');
            filterTargets();
            if (self.targets.length < 1) {
                self._quitImageLightbox();
            }
            else {
                self._openImageLightbox($(this));
            }
        });
        function filterTargets() {
            newTargets
                .filter(function () {
                return $(this).data('imagelightbox') === self.targetSet;
            })
                .filter(function () {
                return self.isTargetValid($(this));
            })
                .each(function () {
                self.targets = self.targets.add($(this));
            });
        }
    }
    _preloadVideos(elements) {
        const self = this;
        elements.each(function () {
            const videoOptions = $(this).data('ilb2Video');
            if (videoOptions) {
                let id = $(this).data('ilb2Id');
                if (!id) {
                    id = 'a' + (((1 + Math.random()) * 0x10000) | 0).toString(16); // Random id
                }
                $(this).data('ilb2VideoId', id);
                const container = { e: $('<video id=\'' + self.options.id + '\' preload=\'metadata\'>'), i: id, l: false, a: undefined };
                $.each(videoOptions, function (key, value) {
                    if (key === 'autoplay') {
                        container.a = value;
                    }
                    else if (key !== 'sources') {
                        container.e = container.e.attr(key, value);
                    }
                });
                if (videoOptions.sources) {
                    $.each(videoOptions.sources, function (_, source) {
                        let sourceElement = $('<source>');
                        $.each(source, function (key, value) {
                            sourceElement = sourceElement.attr(key, value);
                        });
                        container.e.append(sourceElement);
                    });
                }
                container.e.on('loadedmetadata.ilb7', function () {
                    container.l = true;
                });
                self.videos.push(container);
            }
        });
    }
}
exports.ImageLightbox = ImageLightbox;

});
___scope___.file("imagelightbox.support.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cssTransitionSupport = function () {
    const s = (document.body || document.documentElement).style;
    if (s.transition === '') {
        return '';
    }
    if (s.webkitTransition === '') {
        return '-webkit-';
    }
    if (s.MozTransition === '') {
        return '-moz-';
    }
    if (s.OTransition === '') {
        return '-o-';
    }
    return false;
};
exports.hasCssTransitionSupport = cssTransitionSupport() !== false;
exports.cssTransitionTranslateX = function (element, positionX, speed) {
    const options = {}, prefix = cssTransitionSupport();
    options[prefix + 'transform'] = 'translateX(' + positionX + ') translateY(-50%)';
    options[prefix + 'transition'] = prefix + 'transform ' + speed + 's ease-in';
    element.css(options);
};
exports.hasTouch = ('ontouchstart' in window);
exports.hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
exports.wasTouched = function (event) {
    if (exports.hasTouch) {
        return true;
    }
    if (!exports.hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined') {
        return false;
    }
    if (typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined') {
        if (event.MSPOINTER_TYPE_MOUSE !== event.pointerType) {
            return true;
        }
    }
    else if (event.pointerType !== 'mouse') {
        return true;
    }
    return false;
};
exports.hasFullscreenSupport = !!(document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled);
exports.hasHistorySupport = !!(window.history && history.pushState);
function toggleFullScreen(target) {
    const doc = window.document;
    const docEl = document.getElementById(target).parentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const exitFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    }
    else {
        exitFullScreen.call(doc);
    }
}
exports.toggleFullScreen = toggleFullScreen;

});
___scope___.file("imagelightbox.transforms.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setSizes(screenXY, imageXY, image) {
    if (imageXY.width > screenXY.width || imageXY.height > screenXY.height) {
        const ratio = imageXY.width / imageXY.height > screenXY.width / screenXY.height ? imageXY.width / screenXY.width : imageXY.height / screenXY.height;
        imageXY.width /= ratio;
        imageXY.height /= ratio;
    }
    const cssHeight = imageXY.height * imageXY.gutterFactor;
    const cssWidth = imageXY.width * imageXY.gutterFactor;
    const cssLeft = ($(window).width() - cssWidth) / 2;
    image.css({
        'width': cssWidth + 'px',
        'height': cssHeight + 'px',
        'left': cssLeft + 'px'
    });
    return image;
}
exports.setSizes = setSizes;

});
___scope___.file("imagelightbox.components.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $arrowLeftObject = $('<button/>', {
    type: 'button',
    class: 'imagelightbox-arrow imagelightbox-arrow-left'
});
const $arrowRightObject = $('<button/>', {
    type: 'button',
    class: 'imagelightbox-arrow imagelightbox-arrow-right'
});
exports.$components = {
    $activityObject: $('<div/>')
        .attr('class', 'imagelightbox-loading')
        .append($('<div/>')),
    $arrows: $arrowLeftObject.add($arrowRightObject),
    $captionObject: $('<div/>', {
        class: 'imagelightbox-caption',
        html: '&nbsp;',
    }),
    $buttonObject: $('<button/>', {
        type: 'button',
        class: 'imagelightbox-close'
    }),
    $overlayObject: $('<div/>', {
        class: 'imagelightbox-overlay'
    }),
    $navItem: $('<a/>', {
        href: '#',
        class: 'imagelightbox-navitem'
    }),
    $navObject: $('<div/>', {
        class: 'imagelightbox-nav'
    }),
    $wrapper: $('<div/>', {
        class: 'imagelightbox-wrapper'
    }),
    $body: $('body')
};

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("events", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
if (FuseBox.isServer) {
	module.exports = global.require("events");
} else {
	function EventEmitter() {
		this._events = this._events || {};
		this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
		if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
		this._maxListeners = n;
		return this;
	};

	EventEmitter.prototype.emit = function(type) {
		var er, handler, len, args, i, listeners;

		if (!this._events) this._events = {};

		// If there is no 'error' event listener then throw.
		if (type === "error") {
			if (!this._events.error || (isObject(this._events.error) && !this._events.error.length)) {
				er = arguments[1];
				if (er instanceof Error) {
					throw er; // Unhandled 'error' event
				}
				throw TypeError('Uncaught, unspecified "error" event.');
			}
		}

		handler = this._events[type];

		if (isUndefined(handler)) return false;

		if (isFunction(handler)) {
			switch (arguments.length) {
				// fast cases
				case 1:
					handler.call(this);
					break;
				case 2:
					handler.call(this, arguments[1]);
					break;
				case 3:
					handler.call(this, arguments[1], arguments[2]);
					break;
				// slower
				default:
					args = Array.prototype.slice.call(arguments, 1);
					handler.apply(this, args);
			}
		} else if (isObject(handler)) {
			args = Array.prototype.slice.call(arguments, 1);
			listeners = handler.slice();
			len = listeners.length;
			for (i = 0; i < len; i++) listeners[i].apply(this, args);
		}

		return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
		var m;

		if (!isFunction(listener)) throw TypeError("listener must be a function");

		if (!this._events) this._events = {};

		// To avoid recursion in the case that type === "newListener"! Before
		// adding it to the listeners, first emit "newListener".
		if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);

		if (!this._events[type])
			// Optimize the case of one listener. Don't need the extra array object.
			this._events[type] = listener;
		else if (isObject(this._events[type]))
			// If we've already got an array, just append.
			this._events[type].push(listener);
		// Adding the second element, need to change to array.
		else this._events[type] = [this._events[type], listener];

		// Check for listener leak
		if (isObject(this._events[type]) && !this._events[type].warned) {
			if (!isUndefined(this._maxListeners)) {
				m = this._maxListeners;
			} else {
				m = EventEmitter.defaultMaxListeners;
			}

			if (m && m > 0 && this._events[type].length > m) {
				this._events[type].warned = true;
				console.error(
					"(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.",
					this._events[type].length
				);
				if (typeof console.trace === "function") {
					// not supported in IE 10
					console.trace();
				}
			}
		}

		return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
		if (!isFunction(listener)) throw TypeError("listener must be a function");

		var fired = false;

		function g() {
			this.removeListener(type, g);

			if (!fired) {
				fired = true;
				listener.apply(this, arguments);
			}
		}

		g.listener = listener;
		this.on(type, g);

		return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
		var list, position, length, i;

		if (!isFunction(listener)) throw TypeError("listener must be a function");

		if (!this._events || !this._events[type]) return this;

		list = this._events[type];
		length = list.length;
		position = -1;

		if (list === listener || (isFunction(list.listener) && list.listener === listener)) {
			delete this._events[type];
			if (this._events.removeListener) this.emit("removeListener", type, listener);
		} else if (isObject(list)) {
			for (i = length; i-- > 0; ) {
				if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
					position = i;
					break;
				}
			}

			if (position < 0) return this;

			if (list.length === 1) {
				list.length = 0;
				delete this._events[type];
			} else {
				list.splice(position, 1);
			}

			if (this._events.removeListener) this.emit("removeListener", type, listener);
		}

		return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
		var key, listeners;

		if (!this._events) return this;

		// not listening for removeListener, no need to emit
		if (!this._events.removeListener) {
			if (arguments.length === 0) this._events = {};
			else if (this._events[type]) delete this._events[type];
			return this;
		}

		// emit removeListener for all listeners on all events
		if (arguments.length === 0) {
			for (key in this._events) {
				if (key === "removeListener") continue;
				this.removeAllListeners(key);
			}
			this.removeAllListeners("removeListener");
			this._events = {};
			return this;
		}

		listeners = this._events[type];

		if (isFunction(listeners)) {
			this.removeListener(type, listeners);
		} else if (listeners) {
			// LIFO order
			while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
		}
		delete this._events[type];

		return this;
	};

	EventEmitter.prototype.listeners = function(type) {
		var ret;
		if (!this._events || !this._events[type]) ret = [];
		else if (isFunction(this._events[type])) ret = [this._events[type]];
		else ret = this._events[type].slice();
		return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
		if (this._events) {
			var evlistener = this._events[type];

			if (isFunction(evlistener)) return 1;
			else if (evlistener) return evlistener.length;
		}
		return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
		return emitter.listenerCount(type);
	};

	function isFunction(arg) {
		return typeof arg === "function";
	}

	function isNumber(arg) {
		return typeof arg === "number";
	}

	function isObject(arg) {
		return typeof arg === "object" && arg !== null;
	}

	function isUndefined(arg) {
		return arg === void 0;
	}
}

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("fusebox-hot-reload", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

"use strict";
/**
 * @module listens to `source-changed` socket events and actions hot reload
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Client = require("fusebox-websocket").SocketClient, bundleErrors = {}, outputElement = document.createElement("div"), styleElement = document.createElement("style"), minimizeToggleId = "fuse-box-toggle-minimized", hideButtonId = "fuse-box-hide", expandedOutputClass = "fuse-box-expanded-output", localStoragePrefix = "__fuse-box_";
function storeSetting(key, value) {
    localStorage[localStoragePrefix + key] = value;
}
function getSetting(key) {
    return localStorage[localStoragePrefix + key] === "true" ? true : false;
}
var outputInBody = false, outputMinimized = getSetting(minimizeToggleId), outputHidden = false;
outputElement.id = "fuse-box-output";
styleElement.innerHTML = "\n    #" + outputElement.id + ", #" + outputElement.id + " * {\n        box-sizing: border-box;\n    }\n    #" + outputElement.id + " {\n        z-index: 999999999999;\n        position: fixed;\n        top: 10px;\n        right: 10px;\n        width: 400px;\n        overflow: auto;\n        background: #fdf3f1;\n        border: 1px solid #eca494;\n        border-radius: 5px;\n        font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n        box-shadow: 0px 3px 6px 1px rgba(0,0,0,.15);\n    }\n    #" + outputElement.id + "." + expandedOutputClass + " {\n        height: auto;\n        width: auto;\n        left: 10px;\n        max-height: calc(100vh - 50px);\n    }\n    #" + outputElement.id + " .fuse-box-errors {\n        display: none;\n    }\n    #" + outputElement.id + "." + expandedOutputClass + " .fuse-box-errors {\n        display: block;\n        border-top: 1px solid #eca494;\n        padding: 0 10px;\n    }\n    #" + outputElement.id + " button {\n        border: 1px solid #eca494;\n        padding: 5px 10px;\n        border-radius: 4px;\n        margin-left: 5px;\n        background-color: white;\n        color: black;\n        box-shadow: 0px 2px 2px 0px rgba(0,0,0,.05);\n    }\n    #" + outputElement.id + " .fuse-box-header {\n        padding: 10px;\n    }\n    #" + outputElement.id + " .fuse-box-header h4 {\n        display: inline-block;\n        margin: 4px;\n    }";
styleElement.type = "text/css";
document.getElementsByTagName("head")[0].appendChild(styleElement);
function displayBundleErrors() {
    var errorMessages = Object.keys(bundleErrors).reduce(function (allMessages, bundleName) {
        var bundleMessages = bundleErrors[bundleName];
        return allMessages.concat(bundleMessages.map(function (message) {
            var messageOutput = message
                .replace(/\n/g, "<br>")
                .replace(/\t/g, "&nbsp;&nbps;&npbs;&nbps;")
                .replace(/ /g, "&nbsp;");
            return "<pre>" + messageOutput + "</pre>";
        }));
    }, []), errorOutput = errorMessages.join("");
    if (errorOutput && !outputHidden) {
        outputElement.innerHTML = "\n        <div class=\"fuse-box-header\" style=\"\">\n            <h4 style=\"\">Fuse Box Bundle Errors (" + errorMessages.length + "):</h4>\n            <div style=\"float: right;\">\n                <button id=\"" + minimizeToggleId + "\">" + (outputMinimized ? "Expand" : "Minimize") + "</button>\n                <button id=\"" + hideButtonId + "\">Hide</button>\n            </div>\n        </div>\n        <div class=\"fuse-box-errors\">\n            " + errorOutput + "\n        </div>\n        ";
        document.body.appendChild(outputElement);
        outputElement.className = outputMinimized ? "" : expandedOutputClass;
        outputInBody = true;
        document.getElementById(minimizeToggleId).onclick = function () {
            outputMinimized = !outputMinimized;
            storeSetting(minimizeToggleId, outputMinimized);
            displayBundleErrors();
        };
        document.getElementById(hideButtonId).onclick = function () {
            outputHidden = true;
            displayBundleErrors();
        };
    }
    else if (outputInBody) {
        document.body.removeChild(outputElement);
        outputInBody = false;
    }
}
exports.connect = function (port, uri, reloadFullPage) {
    if (FuseBox.isServer) {
        return;
    }
    port = port || window.location.port;
    var client = new Client({
        port: port,
        uri: uri
    });
    client.connect();
    client.on("page-reload", function (data) {
        return window.location.reload();
    });
    client.on("page-hmr", function (data) {
        FuseBox.flush();
        FuseBox.dynamic(data.path, data.content);
        if (FuseBox.mainFile) {
            try {
                FuseBox.import(FuseBox.mainFile);
            }
            catch (e) {
                if (typeof e === "string") {
                    if (/not found/.test(e)) {
                        return window.location.reload();
                    }
                }
                console.error(e);
            }
        }
    });
    client.on("source-changed", function (data) {
        console.info("%cupdate \"" + data.path + "\"", "color: #237abe");
        if (reloadFullPage) {
            return window.location.reload();
        }
        /**
         * If a plugin handles this request then we don't have to do anything
         **/
        for (var index = 0; index < FuseBox.plugins.length; index++) {
            var plugin = FuseBox.plugins[index];
            if (plugin.hmrUpdate && plugin.hmrUpdate(data)) {
                return;
            }
        }
        if (data.type === "hosted-css") {
            var fileId = data.path.replace(/^\//, "").replace(/[\.\/]+/g, "-");
            var existing = document.getElementById(fileId);
            if (existing) {
                existing.setAttribute("href", data.path + "?" + new Date().getTime());
            }
            else {
                var node = document.createElement("link");
                node.id = fileId;
                node.type = "text/css";
                node.rel = "stylesheet";
                node.href = data.path;
                document.getElementsByTagName("head")[0].appendChild(node);
            }
        }
        if (data.type === "js" || data.type === "css") {
            FuseBox.flush();
            FuseBox.dynamic(data.path, data.content);
            if (FuseBox.mainFile) {
                try {
                    FuseBox.import(FuseBox.mainFile);
                }
                catch (e) {
                    if (typeof e === "string") {
                        if (/not found/.test(e)) {
                            return window.location.reload();
                        }
                    }
                    console.error(e);
                }
            }
        }
    });
    client.on("error", function (error) {
        console.log(error);
    });
    client.on("bundle-error", function (_a) {
        var bundleName = _a.bundleName, message = _a.message;
        console.error("Bundle error in " + bundleName + ": " + message);
        var errorsForBundle = bundleErrors[bundleName] || [];
        errorsForBundle.push(message);
        bundleErrors[bundleName] = errorsForBundle;
        displayBundleErrors();
    });
    client.on("update-bundle-errors", function (_a) {
        var bundleName = _a.bundleName, messages = _a.messages;
        messages.forEach(function (message) { return console.error("Bundle error in " + bundleName + ": " + message); });
        bundleErrors[bundleName] = messages;
        displayBundleErrors();
    });
};

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("fusebox-websocket", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events = require("events");
var SocketClient = /** @class */ (function () {
    function SocketClient(opts) {
        opts = opts || {};
        var port = opts.port || window.location.port;
        var protocol = location.protocol === "https:" ? "wss://" : "ws://";
        var domain = location.hostname || "localhost";
        this.url = opts.host || "" + protocol + domain + ":" + port;
        if (opts.uri) {
            this.url = opts.uri;
        }
        this.authSent = false;
        this.emitter = new events.EventEmitter();
    }
    SocketClient.prototype.reconnect = function (fn) {
        var _this = this;
        setTimeout(function () {
            _this.emitter.emit("reconnect", { message: "Trying to reconnect" });
            _this.connect(fn);
        }, 5000);
    };
    SocketClient.prototype.on = function (event, fn) {
        this.emitter.on(event, fn);
    };
    SocketClient.prototype.connect = function (fn) {
        var _this = this;
        console.log("%cConnecting to fusebox HMR at " + this.url, "color: #237abe");
        setTimeout(function () {
            _this.client = new WebSocket(_this.url);
            _this.bindEvents(fn);
        }, 0);
    };
    SocketClient.prototype.close = function () {
        this.client.close();
    };
    SocketClient.prototype.send = function (eventName, data) {
        if (this.client.readyState === 1) {
            this.client.send(JSON.stringify({ event: eventName, data: data || {} }));
        }
    };
    SocketClient.prototype.error = function (data) {
        this.emitter.emit("error", data);
    };
    /** Wires up the socket client messages to be emitted on our event emitter */
    SocketClient.prototype.bindEvents = function (fn) {
        var _this = this;
        this.client.onopen = function (event) {
            console.log("%cConnected", "color: #237abe");
            if (fn) {
                fn(_this);
            }
        };
        this.client.onerror = function (event) {
            _this.error({ reason: event.reason, message: "Socket error" });
        };
        this.client.onclose = function (event) {
            _this.emitter.emit("close", { message: "Socket closed" });
            if (event.code !== 1011) {
                _this.reconnect(fn);
            }
        };
        this.client.onmessage = function (event) {
            var data = event.data;
            if (data) {
                var item = JSON.parse(data);
                _this.emitter.emit(item.type, item.data);
                _this.emitter.emit("*", item);
            }
        };
    };
    return SocketClient;
}());
exports.SocketClient = SocketClient;

});
return ___scope___.entry = "index.js";
});
FuseBox.import("fusebox-hot-reload").connect(4444, "", false)

FuseBox.import("default/index.js");
FuseBox.main("default/index.js");
})
(function(e){function r(e){var r=e.charCodeAt(0),n=e.charCodeAt(1);if((m||58!==n)&&(r>=97&&r<=122||64===r)){if(64===r){var t=e.split("/"),i=t.splice(2,t.length).join("/");return[t[0]+"/"+t[1],i||void 0]}var o=e.indexOf("/");if(o===-1)return[e];var a=e.substring(0,o),f=e.substring(o+1);return[a,f]}}function n(e){return e.substring(0,e.lastIndexOf("/"))||"./"}function t(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];for(var n=[],t=0,i=arguments.length;t<i;t++)n=n.concat(arguments[t].split("/"));for(var o=[],t=0,i=n.length;t<i;t++){var a=n[t];a&&"."!==a&&(".."===a?o.pop():o.push(a))}return""===n[0]&&o.unshift(""),o.join("/")||(o.length?"/":".")}function i(e){var r=e.match(/\.(\w{1,})$/);return r&&r[1]?e:e+".js"}function o(e){if(m){var r,n=document,t=n.getElementsByTagName("head")[0];/\.css$/.test(e)?(r=n.createElement("link"),r.rel="stylesheet",r.type="text/css",r.href=e):(r=n.createElement("script"),r.type="text/javascript",r.src=e,r.async=!0),t.insertBefore(r,t.firstChild)}}function a(e,r){for(var n in e)e.hasOwnProperty(n)&&r(n,e[n])}function f(e){return{server:require(e)}}function u(e,n){var o=n.path||"./",a=n.pkg||"default",u=r(e);if(u&&(o="./",a=u[0],n.v&&n.v[a]&&(a=a+"@"+n.v[a]),e=u[1]),e)if(126===e.charCodeAt(0))e=e.slice(2,e.length),o="./";else if(!m&&(47===e.charCodeAt(0)||58===e.charCodeAt(1)))return f(e);var s=x[a];if(!s){if(m&&"electron"!==_.target)throw"Package not found "+a;return f(a+(e?"/"+e:""))}e=e?e:"./"+s.s.entry;var l,d=t(o,e),c=i(d),p=s.f[c];return!p&&c.indexOf("*")>-1&&(l=c),p||l||(c=t(d,"/","index.js"),p=s.f[c],p||"."!==d||(c=s.s&&s.s.entry||"index.js",p=s.f[c]),p||(c=d+".js",p=s.f[c]),p||(p=s.f[d+".jsx"]),p||(c=d+"/index.jsx",p=s.f[c])),{file:p,wildcard:l,pkgName:a,versions:s.v,filePath:d,validPath:c}}function s(e,r,n){if(void 0===n&&(n={}),!m)return r(/\.(js|json)$/.test(e)?h.require(e):"");if(n&&n.ajaxed===e)return console.error(e,"does not provide a module");var i=new XMLHttpRequest;i.onreadystatechange=function(){if(4==i.readyState)if(200==i.status){var n=i.getResponseHeader("Content-Type"),o=i.responseText;/json/.test(n)?o="module.exports = "+o:/javascript/.test(n)||(o="module.exports = "+JSON.stringify(o));var a=t("./",e);_.dynamic(a,o),r(_.import(e,{ajaxed:e}))}else console.error(e,"not found on request"),r(void 0)},i.open("GET",e,!0),i.send()}function l(e,r){var n=y[e];if(n)for(var t in n){var i=n[t].apply(null,r);if(i===!1)return!1}}function d(e){if(null!==e&&["function","object","array"].indexOf(typeof e)!==-1&&!e.hasOwnProperty("default"))return Object.isFrozen(e)?void(e.default=e):void Object.defineProperty(e,"default",{value:e,writable:!0,enumerable:!1})}function c(e,r){if(void 0===r&&(r={}),58===e.charCodeAt(4)||58===e.charCodeAt(5))return o(e);var t=u(e,r);if(t.server)return t.server;var i=t.file;if(t.wildcard){var a=new RegExp(t.wildcard.replace(/\*/g,"@").replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&").replace(/@@/g,".*").replace(/@/g,"[a-z0-9$_-]+"),"i"),f=x[t.pkgName];if(f){var p={};for(var v in f.f)a.test(v)&&(p[v]=c(t.pkgName+"/"+v));return p}}if(!i){var g="function"==typeof r,y=l("async",[e,r]);if(y===!1)return;return s(e,function(e){return g?r(e):null},r)}var w=t.pkgName;if(i.locals&&i.locals.module)return i.locals.module.exports;var b=i.locals={},j=n(t.validPath);b.exports={},b.module={exports:b.exports},b.require=function(e,r){var n=c(e,{pkg:w,path:j,v:t.versions});return _.sdep&&d(n),n},m||!h.require.main?b.require.main={filename:"./",paths:[]}:b.require.main=h.require.main;var k=[b.module.exports,b.require,b.module,t.validPath,j,w];return l("before-import",k),i.fn.apply(k[0],k),l("after-import",k),b.module.exports}if(e.FuseBox)return e.FuseBox;var p="undefined"!=typeof ServiceWorkerGlobalScope,v="undefined"!=typeof WorkerGlobalScope,m="undefined"!=typeof window&&"undefined"!=typeof window.navigator||v||p,h=m?v||p?{}:window:global;m&&(h.global=v||p?{}:window),e=m&&"undefined"==typeof __fbx__dnm__?e:module.exports;var g=m?v||p?{}:window.__fsbx__=window.__fsbx__||{}:h.$fsbx=h.$fsbx||{};m||(h.require=require);var x=g.p=g.p||{},y=g.e=g.e||{},_=function(){function r(){}return r.global=function(e,r){return void 0===r?h[e]:void(h[e]=r)},r.import=function(e,r){return c(e,r)},r.on=function(e,r){y[e]=y[e]||[],y[e].push(r)},r.exists=function(e){try{var r=u(e,{});return void 0!==r.file}catch(e){return!1}},r.remove=function(e){var r=u(e,{}),n=x[r.pkgName];n&&n.f[r.validPath]&&delete n.f[r.validPath]},r.main=function(e){return this.mainFile=e,r.import(e,{})},r.expose=function(r){var n=function(n){var t=r[n].alias,i=c(r[n].pkg);"*"===t?a(i,function(r,n){return e[r]=n}):"object"==typeof t?a(t,function(r,n){return e[n]=i[r]}):e[t]=i};for(var t in r)n(t)},r.dynamic=function(r,n,t){this.pkg(t&&t.pkg||"default",{},function(t){t.file(r,function(r,t,i,o,a){var f=new Function("__fbx__dnm__","exports","require","module","__filename","__dirname","__root__",n);f(!0,r,t,i,o,a,e)})})},r.flush=function(e){var r=x.default;for(var n in r.f)e&&!e(n)||delete r.f[n].locals},r.pkg=function(e,r,n){if(x[e])return n(x[e].s);var t=x[e]={};return t.f={},t.v=r,t.s={file:function(e,r){return t.f[e]={fn:r}}},n(t.s)},r.addPlugin=function(e){this.plugins.push(e)},r.packages=x,r.isBrowser=m,r.isServer=!m,r.plugins=[],r}();return m||(h.FuseBox=_),e.FuseBox=_}(this))