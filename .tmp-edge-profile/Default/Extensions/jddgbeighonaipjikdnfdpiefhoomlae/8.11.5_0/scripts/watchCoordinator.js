"use strict";
/**
 * Этот файл компилируется в js стандарными инструментами ts
 * поэтому в нем не должно быть импортов или экспортов
 *
 * Типы и переменные указанные в этом файле должны дублировать сущности
 * указанные в src/content/scripts/rolls/shared/*
 */
var YTMessageTypes;
(function (YTMessageTypes) {
    YTMessageTypes["YT_METHOD_CALL"] = "YT_METHOD_CALL";
    YTMessageTypes["YT_METHOD_RESULT"] = "YT_METHOD_RESULT";
})(YTMessageTypes || (YTMessageTypes = {}));
const YT_API_WRAPPER = 'YT_API_WRAPPER';
const MOVIE_PLAYER_ID = 'movie_player';
const isYoutubePlayer = (player) => player !== null &&
    'pauseVideo' in player &&
    typeof player.pauseVideo === 'function' &&
    'playVideo' in player &&
    typeof player.playVideo === 'function';
const isYTMethodCallMessage = (data) => {
    return (data &&
        data.source === YT_API_WRAPPER &&
        data.type === YTMessageTypes.YT_METHOD_CALL &&
        (data.method === 'pauseVideo' ||
            data.method === 'playVideo' ||
            data.method === 'getPlayerState'));
};
window.addEventListener('message', (event) => {
    const data = event.data;
    if (!isYTMethodCallMessage(data))
        return;
    const { method } = data;
    const playerElement = document.getElementById(MOVIE_PLAYER_ID);
    if (!isYoutubePlayer(playerElement)) {
        console.warn('[YT_API_WRAPPER] movie_player not ready or methods unavailable');
        return;
    }
    try {
        let result;
        if (method === 'getPlayerState') {
            result = playerElement[method]();
        }
        else {
            playerElement[method]();
            result = true;
        }
        const resultMessage = {
            source: YT_API_WRAPPER,
            type: YTMessageTypes.YT_METHOD_RESULT,
            method,
            result,
        };
        window.postMessage(resultMessage, '*');
    }
    catch (err) {
        console.error(`[YT_API_WRAPPER] Error calling ${method}:`, err);
    }
});
