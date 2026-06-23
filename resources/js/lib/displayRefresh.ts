const CHANNEL = 'moonly-display-refresh';

export function notifyDisplayRefresh(screenId?: number | 'all') {
    try {
        const channel = new BroadcastChannel(CHANNEL);
        channel.postMessage({ screenId: screenId ?? 'all' });
        channel.close();
    } catch {
        // BroadcastChannel unavailable (e.g. very old browsers)
    }
}

export function subscribeDisplayRefresh(
    screenId: number,
    onRefresh: () => void,
): () => void {
    try {
        const channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = (event) => {
            const target = event.data?.screenId;
            if (target === 'all' || target === screenId) {
                onRefresh();
            }
        };
        return () => channel.close();
    } catch {
        return () => {};
    }
}
