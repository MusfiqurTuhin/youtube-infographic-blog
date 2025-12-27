export interface InfographicData {
    title: string;
    summary: string;
    keyStats: {
        label: string;
        value: string;
        icon?: string; // Optional icon name
    }[];
    timeline: {
        time: string;
        title: string;
        description: string;
    }[];
    takeaways: string[];
    quote: string;
}
