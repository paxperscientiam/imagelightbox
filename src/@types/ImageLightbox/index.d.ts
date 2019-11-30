/// <reference path="./JQuery.ts" />
/// <reference path="./ILBOptions.ts" />
/// <reference path="./PreloadedVideo.ts" />
/// <reference path="./TransformCssProperties.ts" />

declare class LegacyCSSStyleDeclaration extends CSSStyleDeclaration
{
    public MozTransition: string;
    public OTransition: string;
}
declare class LegacyDocument extends Document
{
    public webkitFullscreenEnabled?: boolean;
    public mozFullScreenEnabled?: boolean;
    public msFullscreenEnabled?: boolean;

    public mozFullScreenElement?: Element;
    public webkitFullscreenElement?: Element;
    public msFullscreenElement?: Element;

    public mozCancelFullScreen?: () => Promise<undefined>;
    public webkitExitFullscreen?: () => Promise<undefined>;
    public msExitFullscreen?: () => Promise<undefined>;
}
declare class LegacyHTMLElement extends HTMLElement
{
    public mozRequestFullScreen(options: FullscreenOptions): Promise<undefined>;
    public webkitRequestFullScreen(options: FullscreenOptions): Promise<undefined>;
    public msRequestFullscreen(options: FullscreenOptions): Promise<undefined>;
}
declare class LegacyPointerEvent extends PointerEvent
{
    public MSPOINTER_TYPE_MOUSE: string;
}

interface ImageLightboxPlugin {
    options: ILBOptions;

    arrowsOn: () => void;
    loadPreviousImage: () => void;
    isTargetValid: (element: JQuery) => boolean;

    _onStart: () => void;
    _onLoadStart: () => void;
    _onLoadEnd: () => void;

    _addQueryField: (query: string, key: string, value: string) => string;
    _pushToHistory: () => void;
    _removeQueryField: (query: string, key: string) => string;

    _addTargets: (target: JQuery) => void;

    _pushQuitToHistory: () => void;
    _getQueryField: (key: string) => string|undefined;
    _openHistory: () => void;
    _popHistory: (event: BaseJQueryEventObject) => void;

    _openImageLightbox: ($target: JQuery, noHistory: boolean) => void;
    _quitImageLightbox: () => void;
    _loadImage: (direction: number) => void;
    _previousTarget: () => void;
    _nextTarget: () => void;

    PROJECT_NAME: string;
}
