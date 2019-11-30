// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ILBOptions {
    selector: string;
    id: string;
    allowedTypes: string;
    animationSpeed: number;
    activity: boolean;
    arrows: boolean;
    button: boolean;
    caption: boolean;
    enableKeyboard: boolean;
    history: boolean;
    fullscreen: boolean;
    gutter: number;
    offsetY: number;
    navigation: boolean;
    overlay: boolean;
    preloadNext: boolean;
    quitOnEnd: boolean;
    quitOnImgClick: boolean;
    quitOnDocClick: boolean;
    quitOnEscKey: boolean;
}

interface ILBGlobalSettings {
    options: ILBOptions;
    PROJECT_NAME: string;
}

declare interface IScreen {
    width: number;
    height: number;
}

interface IImage {
    width: number;
    height: number;
    gutterFactor: number;
}
