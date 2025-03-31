export const getDisplayDeltaFromDate = (date: Date): string => {
    const diffInMilliseconds = new Date().getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
    const parts: string[] = [];
    if (diffInDays > 0) {
        parts.push(`${diffInDays} days`);
    }
    if (diffInHours % 24 > 0) {
        parts.push(`${diffInHours % 24} hours`);
    }
    if (diffInMinutes % 60 > 0) {
        parts.push(`${diffInMinutes % 60} minutes`);
    }
    return `${parts.join(', ')} ago`;
};
