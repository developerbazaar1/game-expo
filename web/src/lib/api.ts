export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

type ApiError = { error?: string };

export async function createEvent(name: string, maxPlayers: number) {
    const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, maxPlayers }),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
}

export async function getEvent(id: string, signal?: AbortSignal) {
    const res = await fetch(`${API_URL}/events/${id}`, { signal });
    const data = (await res.json()) as Record<string, unknown> & ApiError;
    if (!res.ok) throw new Error(data.error || 'Failed to fetch event');
    return data;
}

export async function getPlayers(id: string) {
    const res = await fetch(`${API_URL}/events/${id}/players`);
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
}

export async function joinEvent(id: string, name: string, email: string, phone?: string) {
    const res = await fetch(`${API_URL}/events/${id}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join event');
    return data;
}

export async function updateEventStatus(id: string, status: 'waiting' | 'active' | 'finished') {
    const res = await fetch(`${API_URL}/events/${id}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

export async function submitPrompt(id: string, email: string | undefined, prompt: string) {
    const res = await fetch(`${API_URL}/events/${id}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit prompt');
    return data;
}
