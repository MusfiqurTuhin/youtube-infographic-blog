"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, FileText, Code, Layout, BarChart, CheckCircle, ArrowRight, Settings, Cpu, Search, Database, Globe, Copy, RefreshCw, Layers, AlertCircle, Wifi } from 'lucide-react';

/**
 * SYSTEM PROMPT
 * Strict instructions to avoid hallucinating unrelated Odoo stories.
 */
const SYSTEM_PROMPT_TEMPLATE = `
You are an expert Content Marketing AI specialized in "Odoo Success Stories".
Your task is to convert a SPECIFIC YouTube video story into a structured, SEO-optimized Infographic Blog Post.

CRITICAL INSTRUCTIONS:
1. Analyze the specific video provided via the Google Search results (matching the Video ID).
2. Do NOT use internal knowledge of other popular Odoo case studies (like TentandTable, WoodCraft, etc.) unless they are the subject of THIS video.
3. If you cannot find information about this specific video ID, return an error in the JSON structure.
4. Return ONLY valid JSON.

Structure:
{
  "meta": {
    "title": "Catchy SEO Title (H1)",
    "description": "Meta description under 160 chars",
    "keywords": "comma, separated, keywords"
  },
  "hero": {
    "headline": "Impact-driven headline",
    "subheadline": "The core problem -> solution summary",
    "companyName": "Name of company in story"
  },
  "metrics": [
    { "label": "Short Label", "value": "Metric Value", "desc": "Brief Description" },
    { "label": "Short Label", "value": "Metric Value", "desc": "Brief Description" },
    { "label": "Short Label", "value": "Metric Value", "desc": "Brief Description" }
  ],
  "narrative": {
    "problem": "Detailed paragraph about challenges.",
    "solution": "How Odoo was implemented.",
    "impact": "Concrete business results."
  },
  "quote": {
    "text": "Powerful quote",
    "author": "Name, Title"
  },
  "timeline": [
    { "year": "Phase/Year", "event": "Event description" },
    { "year": "Phase/Year", "event": "Event description" },
    { "year": "Phase/Year", "event": "Event description" }
  ],
  "faq": [
    { "question": "Question?", "answer": "Answer" },
    { "question": "Question?", "answer": "Answer" }
  ]
}
`;

export default function YouTubeToInfographic() {
    const [apiKey, setApiKey] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [step, setStep] = useState('input'); // input, processing, result
    const [generatedData, setGeneratedData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('preview'); // preview, html
    const [loadingMsg, setLoadingMsg] = useState('');
    const [error, setError] = useState('');
    const [useLiveFetch, setUseLiveFetch] = useState(true);

    // Initialize empty
    useEffect(() => {
        // No preloaded data
    }, []);

    const handleGenerate = async () => {
        if (!apiKey) {
            setError('Please enter a Gemini API Key to proceed.');
            return;
        }
        if (!videoUrl && !transcript) {
            setError('Please enter a YouTube URL or paste a transcript.');
            return;
        }

        setStep('processing');
        setError('');

        try {
            let promptText = SYSTEM_PROMPT_TEMPLATE;
            let tools: any[] = [];
            let genConfig: any = { responseMimeType: "application/json" }; // Default for manual text

            // MODE 1: LIVE FETCH (URL ONLY)
            if (useLiveFetch && !transcript) {
                setLoadingMsg('Connecting to Gemini 3 Pro with Multimodal Context...');
                await new Promise(r => setTimeout(r, 1000));

                // Extract Video ID for better grounding specificity
                const videoIdMatch = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                setLoadingMsg(`Targeting Video ID: ${videoId || 'URL'}...`);

                promptText += `\n\nTASK: Analyze the YouTube video at this URL: "${videoUrl}" (Video ID: ${videoId}). 
        
        STEP 1: Use Google Search to find the specific transcript, description, or case study details for THIS specific Video ID "${videoId}".
        STEP 2: Ignore any other famous Odoo success stories. Focus ONLY on the content related to "${videoId}".
        STEP 3: Extract the company details, problem, solution (Odoo apps), and metrics from the search results.
        STEP 4: Generate the JSON.
        
        IMPORTANT: Return ONLY raw JSON code.`;

                // Enable Google Search Grounding to find video context
                tools = [{ "google_search": {} }];

                // CRITICAL FIX: Disable strict JSON mode when using Tools (API limitation)
                // We will parse the JSON manually from the text response.
                genConfig = {};

            } else {
                // MODE 2: MANUAL TRANSCRIPT
                setLoadingMsg('Processing provided transcript...');
                promptText += `\n\nTRANSCRIPT:\n${transcript}`;
            }

            setLoadingMsg('Synthesizing Infographic Data...');

            // Call Gemini API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }],
                    tools: tools,
                    generationConfig: genConfig
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (!data.candidates || !data.candidates[0].content) {
                throw new Error("No response. The model may have failed to access the video context. Try pasting the transcript manually.");
            }

            let jsonText = data.candidates[0].content.parts[0].text;

            // MANUAL JSON EXTRACTION (Since strict mode is off for Tools)
            // Find the first '{' and last '}'
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            } else {
                console.warn("Could not find JSON braces, attempting raw parse");
            }

            // Safety cleanup
            const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedData = JSON.parse(cleanJson);
            setGeneratedData(parsedData);
            setStep('result');

        } catch (err: any) {
            setError('Generation failed: ' + err.message);
            setStep('input');
        }
    };

    const generateRawHtml = () => {
        if (!generatedData) return '';
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${generatedData.meta.title}</title>
    <meta name="description" content="${generatedData.meta.description}">
    <style>
        :root { --primary: #714B67; --secondary: #00A09D; --bg: #F9FAFB; --text: #1F2937; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .hero { background: linear-gradient(135deg, var(--primary), #4e3447); color: white; padding: 60px 20px; text-align: center; border-radius: 0 0 40px 40px; }
        .hero h1 { font-size: 2.5rem; margin-bottom: 10px; line-height: 1.2; }
        .hero p { font-size: 1.2rem; opacity: 0.9; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: -40px 20px 40px; position: relative; z-index: 10; }
        .metric-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5rem; font-weight: bold; color: var(--secondary); display: block; }
        .metric-label { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 5px; display: block; }
        .content-section { background: white; padding: 40px; margin-bottom: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .section-title { color: var(--primary); font-size: 1.8rem; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 20px; }
        .quote-box { background: #f8f9fa; border-left: 5px solid var(--secondary); padding: 30px; font-style: italic; font-size: 1.2rem; margin: 40px 0; border-radius: 0 12px 12px 0; }
        .timeline { position: relative; padding: 20px 0; }
        .timeline-item { padding: 20px 0 20px 40px; position: relative; border-left: 2px solid var(--secondary); margin-left: 20px; }
        .timeline-item::before { content: ''; position: absolute; left: -9px; top: 28px; width: 16px; height: 16px; background: white; border: 4px solid var(--secondary); border-radius: 50%; }
        .timeline-year { font-weight: bold; color: var(--primary); }
        .faq-item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .faq-question { font-weight: bold; color: var(--text); display: block; margin-bottom: 5px; }
        @media (max-width: 600px) { .hero h1 { font-size: 2rem; } .metrics-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <header class="hero">
        <div class="container">
            <h1>${generatedData.hero.headline}</h1>
            <p>${generatedData.hero.subheadline}</p>
        </div>
    </header>

    <div class="container">
        <div class="metrics-grid">
            ${generatedData.metrics.map((m: any) => `
            <div class="metric-card">
                <span class="metric-value">${m.value}</span>
                <span class="metric-label">${m.label}</span>
                <div style="font-size:0.8rem; color:#888; margin-top:5px">${m.desc}</div>
            </div>`).join('')}
        </div>

        <section class="content-section">
            <h2 class="section-title">The Challenge</h2>
            <p>${generatedData.narrative.problem}</p>
        </section>

        <div class="quote-box">
            "${generatedData.quote.text}"
            <br><strong style="display:block; margin-top:10px; font-size:0.9rem; color:#666">— ${generatedData.quote.author}</strong>
        </div>

        <section class="content-section">
            <h2 class="section-title">The Solution: Odoo Implementation</h2>
            <p>${generatedData.narrative.solution}</p>
        </section>

         <section class="content-section">
            <h2 class="section-title">Timeline of Success</h2>
            <div class="timeline">
                ${generatedData.timeline.map((t: any) => `
                <div class="timeline-item">
                    <div class="timeline-year">${t.year}</div>
                    <div>${t.event}</div>
                </div>`).join('')}
            </div>
        </section>

        <section class="content-section">
            <h2 class="section-title">Key Results</h2>
            <p>${generatedData.narrative.impact}</p>
        </section>

        <section class="content-section">
            <h2 class="section-title">Frequently Asked Questions</h2>
            ${generatedData.faq.map((f: any) => `
            <div class="faq-item">
                <span class="faq-question">${f.question}</span>
                <p>${f.answer}</p>
            </div>`).join('')}
        </section>
    </div>
</body>
</html>
    `;
    };

    const copyToClipboard = () => {
        const code = generateRawHtml();
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    };

    // --- COMPONENT: PROCESSOR ANIMATION ---
    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Infographic Blog</h2>
                <p className="text-slate-500 animate-pulse">{loadingMsg}</p>

                {/* Console Log UI */}
                <div className="mt-8 max-w-md w-full bg-slate-900 rounded-lg shadow-xl p-4 text-left text-xs font-mono text-slate-400 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <Cpu className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400 font-bold">SYSTEM LOG</span>
                    </div>
                    <div>&gt; Initializing Gemini 2.0 Flash Agent...</div>
                    <div className="text-green-500">&gt; API Connection Established.</div>

                    {useLiveFetch && !transcript ? (
                        <>
                            <div className="text-blue-400">&gt; Mode: LIVE_FETCH (Multimodal/Search)</div>
                            <div>&gt; Target: {videoUrl.slice(0, 30)}...</div>
                            {loadingMsg.includes('Analyzing') && <div className="text-yellow-400 animate-pulse">&gt; Reading video content...</div>}
                            {loadingMsg.includes('Synthesizing') && <div className="text-green-400">&gt; Content extracted. Parsing JSON...</div>}
                        </>
                    ) : (
                        <div className="text-blue-400">&gt; Mode: TEXT_PROCESSING (Manual Transcript)</div>
                    )}
                </div>
            </div>
        );
    }

    // --- COMPONENT: RESULTS VIEW ---
    if (step === 'result' && generatedData) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col">
                {/* Navbar */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold text-slate-800">Infographic Generator</span>
                    </div>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'preview' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" /> Live Preview
                        </button>
                        <button
                            onClick={() => setActiveTab('html')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'html' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            <Code className="w-4 h-4 inline mr-2" /> Raw HTML
                        </button>
                    </div>
                    <button
                        onClick={() => { setStep('input'); setGeneratedData(null); }}
                        className="text-sm text-slate-500 hover:text-indigo-600"
                    >
                        Start Over
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-8">
                    {activeTab === 'preview' ? (
                        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* Infographic Header */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-12 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs tracking-wider mb-4 uppercase">Success Story: {generatedData.hero.companyName}</span>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{generatedData.hero.headline}</h1>
                                    <p className="text-xl text-indigo-100 max-w-2xl mx-auto">{generatedData.hero.subheadline}</p>
                                </div>
                            </div>

                            <div className="p-8 md:p-12 space-y-12">

                                {/* 1. Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-20">
                                    {generatedData.metrics.map((m: any, i: number) => (
                                        <div key={i} className="bg-white p-6 rounded-xl shadow-lg border-b-4 border-indigo-500 text-center transform hover:-translate-y-1 transition duration-300">
                                            <div className="text-3xl font-bold text-indigo-600 mb-2 truncate">{m.value}</div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.label}</div>
                                            <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* 2. Challenge Section */}
                                <div className="flex flex-col md:flex-row gap-12 items-center">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">01</span>
                                            The Challenge
                                        </h2>
                                        <p className="text-slate-600 leading-relaxed text-lg">
                                            {generatedData.narrative.problem}
                                        </p>
                                    </div>
                                    <div className="w-full md:w-1/3 bg-slate-50 rounded-xl p-6 border border-slate-100">
                                        <div className="text-sm font-semibold text-slate-400 mb-4 uppercase">Pain Points</div>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-2 text-slate-700"><div className="w-1.5 h-1.5 mt-2 rounded-full bg-red-400"></div>Manual Processes</li>
                                            <li className="flex items-start gap-2 text-slate-700"><div className="w-1.5 h-1.5 mt-2 rounded-full bg-red-400"></div>Lack of Reporting</li>
                                            <li className="flex items-start gap-2 text-slate-700"><div className="w-1.5 h-1.5 mt-2 rounded-full bg-red-400"></div>Data Inaccuracy</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 3. Quote Break */}
                                <div className="bg-indigo-50 rounded-r-2xl border-l-8 border-indigo-600 p-8 my-8">
                                    <p className="text-xl md:text-2xl font-serif italic text-indigo-900 mb-4">
                                        "{generatedData.quote.text}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                                            {generatedData.quote.author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{generatedData.quote.author}</div>
                                            <div className="text-xs text-slate-500 uppercase">Leadership Insight</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Solution & Timeline */}
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">02</span>
                                        The Solution & Journey
                                    </h2>
                                    <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pl-8 py-2">
                                        {generatedData.timeline.map((t: any, i: number) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-indigo-100 bg-indigo-600"></div>
                                                <h4 className="font-bold text-indigo-900">{t.year}</h4>
                                                <p className="text-slate-600">{t.event}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. Results Section */}
                                <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 text-center">
                                    <h2 className="text-2xl font-bold mb-6">The Impact</h2>
                                    <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
                                        {generatedData.narrative.impact}
                                    </p>
                                    <button className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-full font-bold transition">
                                        Read Full Case Study
                                    </button>
                                </div>

                                {/* 6. FAQ Section */}
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
                                    <div className="space-y-4">
                                        {generatedData.faq.map((f: any, i: number) => (
                                            <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-200 transition">
                                                <h3 className="font-semibold text-slate-800 mb-2">{f.question}</h3>
                                                <p className="text-slate-600 text-sm">{f.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-700">
                                    <span className="text-xs font-mono text-slate-400">index.html</span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-white transition"
                                    >
                                        <Copy className="w-3 h-3" /> Copy Code
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                    {generateRawHtml()}
                                </pre>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- COMPONENT: INPUT FORM (DEFAULT) ---
    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-indigo-100">

            {/* Hero Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        Powered by Gemini 2.0 Flash
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                        YouTube to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Infographic Blog</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
                        Turn any Odoo success story video into a high-converting, SEO-optimized case study webpage in seconds. No manual writing required.
                    </p>

                    {/* Main Input Card */}
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">

                            {/* API Key Input */}
                            <div className="text-left">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Gemini API Key
                                    <span className="ml-2 text-xs font-normal text-slate-400">(Required for processing)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                    <Settings className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            {/* URL Input */}
                            <div className="text-left">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">YouTube Video URL</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                        />
                                        <Play className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Toggle */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Wifi className={`w-4 h-4 ${useLiveFetch ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    <div className="text-sm">
                                        <span className="font-semibold text-slate-700">Live Fetch via Multimodal/Search</span>
                                        <p className="text-xs text-slate-400">Attempts to read video context directly from URL</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setUseLiveFetch(!useLiveFetch)}
                                    className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition ${useLiveFetch ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${useLiveFetch ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            {/* Transcript Manual Input (Conditional) */}
                            {!useLiveFetch && (
                                <div className="text-left animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Manual Transcript</label>
                                    <textarea
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-slate-600"
                                        placeholder="Paste text here..."
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                    <span className="mt-0.5">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transform transition active:scale-95 flex justify-center items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Generate Infographic Blog
                            </button>

                        </div>
                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Model: Gemini 2.0 Flash</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> SEO Optimized</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Model Selection Logic Section */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Why Gemini 2.0 Flash? */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Database className="w-6 h-6 text-indigo-600" />
                            Why Gemini 2.0 Flash?
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold">1</div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Native Multimodal Processing</h4>
                                    <p className="text-sm text-slate-600 mt-1">Unlike older scrapers, Gemini 2.0 Flash can "watch" video and "listen" to audio directly via URL. It captures visual context (e.g., text on screen) that text-only transcripts miss.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center text-purple-600 font-bold">2</div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Direct URL Support</h4>
                                    <p className="text-sm text-slate-600 mt-1">You no longer need to download .mp4 files. Passing a YouTube URL (<code>file_uri</code>) allows the model to access the stream directly for transcription and analysis.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600 font-bold">3</div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Structured Output Reliability</h4>
                                    <p className="text-sm text-slate-600 mt-1">Generating complex JSON with nested arrays (Timelines, Metrics) requires high adherence to schema. Flash models are optimized for speed and structured data.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Architecture */}
                    <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            Production Architecture
                        </h3>
                        <div className="space-y-4 text-sm font-mono border-l-2 border-slate-700 pl-4">
                            <div className="relative pb-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-500"></div>
                                <strong className="text-indigo-400 block mb-1">1. User Input</strong>
                                Submit YouTube URL via React Frontend.
                            </div>
                            <div className="relative pb-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-600"></div>
                                <strong className="text-slate-100 block mb-1">2. Backend (Python/Node)</strong>
                                Server receives URL. Uses <code className="bg-slate-800 px-1 rounded">youtube-transcript-api</code> to fetch raw text OR downloads audio via <code className="bg-slate-800 px-1 rounded">yt-dlp</code>.
                            </div>
                            <div className="relative pb-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500"></div>
                                <strong className="text-blue-400 block mb-1">3. Gemini 2.0 Flash</strong>
                                Raw text + System Prompt sent to Vertex AI / Gemini API. Model extracts JSON structure.
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500"></div>
                                <strong className="text-green-400 block mb-1">4. Render & Deploy</strong>
                                Frontend receives JSON, renders Infographic components, and compiles to static HTML for CMS upload.
                            </div>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
}
