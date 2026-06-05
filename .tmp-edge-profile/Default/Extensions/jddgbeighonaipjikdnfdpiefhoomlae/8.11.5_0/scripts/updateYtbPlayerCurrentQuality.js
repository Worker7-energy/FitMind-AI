"use strict";
/**
 * Этот файл компилируется в js стандарными инструментами ts
 * поэтому в нем не должно быть импортов или экспортов
 *
 * Типы указанные в этом файле должны дублировать типы
 * указанные в файлe src/content/scripts/youtubeRestrictionQuality/ytbRestrictionQuality.ts
 * (без импортов из src/: иначе tsc разносит зависимости по public/scripts).
 */
const YTB_LOCAL_STORAGE_QUALITY_KEY = 'yt-player-quality';
const YTB_SCRIPT_SOURCE = 'ytb-quality-script';
const YTB_PLAYER_ID = 'movie_player';
const DEFAULT_QUALITY = 'hd1080';
const ENFORCING_QUALITY_CHECK_INTERVAL = 60000; //1 minute
var YTbPlayerActions;
(function (YTbPlayerActions) {
    YTbPlayerActions["set-quality"] = "SET_QUALITY";
    YTbPlayerActions["stop-restrict-quality"] = "STOP_RESTRICT_QUALITY";
})(YTbPlayerActions || (YTbPlayerActions = {}));
const chosenQualityMap = {
    '1080': 'hd1080',
    '720': 'hd720',
    '480': 'large',
    '360': 'medium',
    '240': 'small',
    '144': 'tiny',
};
const qualityOrder = [
    'hd1080',
    'hd720',
    'large',
    'medium',
    'small',
    'tiny',
];
const globalState = {
    chosenQuality: null,
    enforceIntervalId: null,
    playerRef: null,
};
function getPlayer() {
    const player = document?.getElementById(YTB_PLAYER_ID);
    if (player && typeof player.getAvailableQualityLevels === 'function') {
        return player;
    }
    return null;
}
function updatePlayer() {
    const newPlayer = getPlayer();
    if (!newPlayer)
        return null;
    if (globalState.playerRef !== newPlayer) {
        globalState.playerRef = newPlayer;
        globalState.playerRef?.addEventListener?.('onPlaybackQualityChange', enforceQuality);
    }
    return globalState.playerRef;
}
function selectBestQuality(available) {
    const qualitiesWithoutAuto = available.filter((quality) => !quality.startsWith('auto'));
    const allowedQualities = qualitiesWithoutAuto.filter((quality) => {
        const index = qualityOrder.indexOf(quality);
        return index !== -1 && index <= qualityOrder.indexOf(DEFAULT_QUALITY);
    });
    const best = qualityOrder.find((quality) => allowedQualities.includes(quality));
    return best ?? null;
}
function getQualityIndex(quality) {
    if (!quality)
        return -1;
    return qualityOrder.indexOf(quality);
}
function setQuality(quality) {
    globalState.chosenQuality = quality;
    globalState.playerRef?.setPlaybackQuality?.(quality);
    globalState.playerRef?.setPlaybackQualityRange?.(quality);
    startEnforcing();
}
function handleQualityFromLocalStorage(qualities) {
    try {
        const rawData = localStorage?.getItem(YTB_LOCAL_STORAGE_QUALITY_KEY);
        if (!rawData)
            return null;
        const rawDataParsed = JSON.parse(rawData)?.data;
        if (typeof rawDataParsed !== 'string') {
            return null;
        }
        const qualityRaw = JSON.parse(rawDataParsed)?.quality;
        const mappedQuality = chosenQualityMap[qualityRaw] ?? qualityRaw;
        return qualities.includes(mappedQuality) ? mappedQuality : null;
    }
    catch (error) {
        console.info('Error parsing storage quality data', error);
        return null;
    }
}
function handleQualityFromMessage(event) {
    if (!event ||
        event.source !== window ||
        !event.data ||
        event.data.source !== YTB_SCRIPT_SOURCE) {
        return;
    }
    const player = updatePlayer();
    if (!player)
        return;
    if (event.data.type === YTbPlayerActions['set-quality']) {
        const qualities = player.getAvailableQualityLevels?.() || [];
        const current = player.getPlaybackQuality();
        const chosen = handleQualityFromLocalStorage(qualities);
        const chosenIndex = getQualityIndex(chosen);
        const best = selectBestQuality(qualities);
        const desired = chosen && chosenIndex !== -1 ? chosen : best;
        if (desired && (desired !== current || !globalState.enforceIntervalId)) {
            setQuality(desired);
        }
    }
    if (event.data.type === YTbPlayerActions['stop-restrict-quality']) {
        stopEnforcing();
        globalState.chosenQuality = null;
    }
}
function enforceQuality() {
    try {
        const { playerRef, chosenQuality } = globalState;
        if (!playerRef || !chosenQuality)
            return;
        const current = playerRef.getPlaybackQuality() || DEFAULT_QUALITY;
        const currentIndex = qualityOrder.indexOf(current);
        if (currentIndex === -1) {
            playerRef.setPlaybackQuality?.(chosenQuality);
            playerRef.setPlaybackQualityRange?.(chosenQuality);
        }
    }
    catch (error) {
        console.info('[Ytb Enforcer] Error enforcing quality', error);
    }
}
function startEnforcing() {
    if (globalState.enforceIntervalId !== null)
        return;
    globalState.enforceIntervalId = window?.setInterval(enforceQuality, ENFORCING_QUALITY_CHECK_INTERVAL);
}
function stopEnforcing() {
    const { enforceIntervalId } = globalState;
    if (enforceIntervalId !== null) {
        clearInterval(enforceIntervalId);
        globalState.enforceIntervalId = null;
    }
}
if (window) {
    try {
        window.removeEventListener('message', handleQualityFromMessage);
        window.addEventListener('message', handleQualityFromMessage);
    }
    catch (error) {
        console.info('[Ytb Enforcer] Error adding/removing listener to message', error);
    }
}
