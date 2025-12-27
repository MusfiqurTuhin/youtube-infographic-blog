import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { model } from "@/lib/gemini";

// Helper to extract video ID
function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        // Fetch Transcript
        let transcriptText = "";
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            transcriptText = transcript.map(item => item.text).join(" ");
        } catch (e) {
            console.error("Transcript Error:", e);
            return NextResponse.json({ error: "Could not fetch transcript. The video might not have captions." }, { status: 500 });
        }

        // Truncate if too long (Gemini 1.5 Flash has large context, but safe to limit slightly if massive)
        // 1 hour video is roughly 10k words. Flash handles 1M tokens. We are fine.

        const prompt = `
      Analyze the following YouTube transcript and create a stylish infographic blog structure.
      Return strictly valid JSON (no markdown formatting, no \`\`\`json wrappers) with this schema:
      {
        "title": "Engaging Title",
        "summary": "Concise summary of the video content (2-3 sentences)",
        "keyStats": [
          { "label": "Stat Label (e.g. Steps, Tools, Years)", "value": "Stat Value" }
        ],
        "timeline": [
          { "time": "approx timestamp or simple 'Step 1'", "title": "Section Title", "description": "Brief description" }
        ],
        "takeaways": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
        "quote": "Most impactful quote from the video"
      }
      
      Transcript:
      ${transcriptText}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up if model adds backticks
        text = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');

        const data = JSON.parse(text);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate infographic content" }, { status: 500 });
    }
}
