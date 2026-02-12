export const API_BASE_URL = '/api';

export const checkHealth = async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
        throw new Error('Health check failed');
    }
    return response.json();
};

export const uploadPdf = async (file: File): Promise<{ filename: string; status: string; id: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }
    return response.json();
};

export const sendChatMessage = async (
    message: string,
    bookId: number
): Promise<{ response: string }> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, book_id: bookId }),
    });

    if (!response.ok) {
        throw new Error('Chat request failed');
    }
    return response.json();
};
