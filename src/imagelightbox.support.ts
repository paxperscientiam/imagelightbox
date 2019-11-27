const cssTransitionSupport = function (): string|boolean {
    const s = (document.body || document.documentElement).style as LegacyCSSStyleDeclaration;
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
}

const hasCssTransitionSupport: boolean = cssTransitionSupport() !== false

export const cssTransitionTranslateX = function (element: JQuery, positionX: string, speed: number): void {
    const options: Record<string, string> = {}, prefix = cssTransitionSupport();
    options[prefix + 'transform'] = 'translateX(' + positionX + ') translateY(-50%)';
    options[prefix + 'transition'] = prefix + 'transform ' + speed + 's ease-in';
    element.css(options);
}

export const hasTouch = ('ontouchstart' in window)

export const hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled

export const wasTouched = function (event: PointerEvent): boolean {
    if (hasTouch) {
        return true;
    }

    if (!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined') {
        return false;
    }

    if (typeof (event as LegacyPointerEvent).MSPOINTER_TYPE_MOUSE !== 'undefined') {
        if ((event as LegacyPointerEvent).MSPOINTER_TYPE_MOUSE !== event.pointerType) {
            return true;
        }
    }
    else if (event.pointerType !== 'mouse') {
        return true;
    }

    return false;
}

export const hasFullscreenSupport = !!(document.fullscreenEnabled ||
                                       document.webkitFullscreenEnabled ||
                                       document.mozFullScreenEnabled ||
                                       document.msFullscreenEnabled)

export const hasHistorySupport = !!(window.history && history.pushState);
