import React, { useState, useCallback, useEffect } from 'react';
import { useCodeCourtStore } from './store/useCodeCourtStore';
import { analyzeCodeAndScreen } from './services/geminiService';
import PersonaSelector from './components/PersonaSelector';
import CodeInput from './components/CodeInput';
import ScreenCapture from './components/ScreenCapture';
import AnalysisResult from './components/AnalysisResult';
import { Button } from './components/common';
import { Play, Loader2, Frown, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// This is a polyfill for environments that don't have uuid.
const getUUID = () => (typeof uuidv4 === 'function' ? uuidv4() : Date.now().toString());

// Import lucide-react dynamically
const LucideIcons = {
    ShieldCheck: React.lazy(() => import('lucide-react').then(module => ({ default: module.ShieldCheck }))),
    Zap: React.lazy(() => import('lucide-react').then(module => ({ default: module.Zap }))),
    Palette: React.lazy(() => import('lucide-react').then(module => ({ default: module.Palette }))),
    Upload: React.lazy(() => import('lucide-react').then(module => ({ default: module.Upload }))),
    X: React.lazy(() => import('lucide-react').then(module => ({ default: module.X }))),
    FileCode: React.lazy(() => import('lucide-react').then(module => ({ default: module.FileCode }))),
    ScreenShare: React.lazy(() => import('lucide-react').then(module => ({ default: module.ScreenShare }))),
    ScreenShareOff: React.lazy(() => import('lucide-react').then(module => ({ default: module.ScreenShareOff }))),
    Video: React.lazy(() => import('lucide-react').then(module => ({ default: module.Video }))),
    Loader2: React.lazy(() => import('lucide-react').then(module => ({ default: module.Loader2 }))),
    Play: React.lazy(() => import('lucide-react').then(module => ({ default: module.Play }))),
    Frown: React.lazy(() => import('lucide-react').then(module => ({ default: module.Frown }))),
    Sparkles: React.lazy(() => import('lucide-react').then(module => ({ default: module.Sparkles }))),
    Copy: React.lazy(() => import('lucide-react').then(module => ({ default: module.Copy }))),
    Check: React.lazy(() => import('lucide-react').then(module => ({ default: module.Check }))),
};

const App: React.FC = () => {
    const { 
        activePersona, 
        codeFiles, 
        isScreenSharing, 
        connectionStatus, 
        setConnectionStatus, 
        addNewIssue, 
        appendIssueContent,
        clearIssues
    } = useCodeCourtStore();
    
    const [currentFrame, setCurrentFrame] = useState<string | null>(null);

    const handleFrameCapture = useCallback((frame: string | null) => {
        setCurrentFrame(frame);
    }, []);

    const startAnalysis = useCallback(async () => {
        if (codeFiles.length === 0 && !currentFrame) {
            alert("Please provide code or share your screen to start the analysis.");
            return;
        }

        clearIssues();
        setConnectionStatus('connecting');

        try {
            const stream = analyzeCodeAndScreen(activePersona, codeFiles, currentFrame);
            setConnectionStatus('streaming');
            let firstChunk = true;
            let currentIssueId = '';

            for await (const chunk of stream) {
                if (firstChunk) {
                    currentIssueId = getUUID();
                    addNewIssue({ id: currentIssueId, persona: activePersona, content: chunk });
                    firstChunk = false;
                } else {
                    // Rudimentary logic to detect new "issues" based on markdown headers
                    if (chunk.includes('\n## ') || chunk.includes('\n# ')) {
                        const parts = chunk.split(/(\n##? .*)/).filter(Boolean);
                        appendIssueContent(currentIssueId, parts[0]);
                        if(parts[1]) {
                             currentIssueId = getUUID();
                             addNewIssue({ id: currentIssueId, persona: activePersona, content: parts[1].trim() });
                        }
                    } else {
                        appendIssueContent(currentIssueId, chunk);
                    }
                }
            }
            setConnectionStatus('done');
        } catch (error) {
            console.error("Analysis failed:", error);
            setConnectionStatus('error');
        }
    }, [activePersona, codeFiles, currentFrame, setConnectionStatus, addNewIssue, appendIssueContent, clearIssues]);

     useEffect(() => {
        document.documentElement.classList.add('dark');
     }, []);


    const isAnalyzing = connectionStatus === 'connecting' || connectionStatus === 'streaming';
    const hasContext = codeFiles.length > 0 || isScreenSharing;

    const getStatusButton = () => {
        switch (connectionStatus) {
            case 'idle':
            case 'done':
            case 'error':
                return <><Play className="w-4 h-4 mr-2" /> Start Analysis</>;
            case 'connecting':
                return <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>;
            case 'streaming':
                return <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>;
            default:
                return null;
        }
    };

    return (
        <React.Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <div className="h-screen overflow-hidden bg-secondary/40 text-foreground font-sans">
            <main className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4 max-w-screen-2xl mx-auto h-full">
                <div className="md:col-span-1 xl:col-span-1 bg-card rounded-lg shadow-sm border p-6 flex flex-col gap-6 h-full overflow-y-auto">
                    <header>
                        <h1 className="text-2xl font-bold">CodeCourt</h1>
                        <p className="text-muted-foreground">Real-time AI Code Review</p>
                    </header>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">1. Select Persona</h2>
                        <PersonaSelector connectionStatus={connectionStatus} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">2. Provide Context</h2>
                        <CodeInput isAnalyzing={isAnalyzing} />
                    </div>

                    <div className="space-y-2 flex-1 min-h-[200px] flex flex-col">
                        <h2 className="text-sm font-semibold text-muted-foreground">3. Share UI (Optional)</h2>
                        <ScreenCapture isAnalyzing={isAnalyzing} onFrame={handleFrameCapture} />
                    </div>

                    <div className="mt-auto">
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={startAnalysis}
                            disabled={isAnalyzing || !hasContext}
                        >
                           {getStatusButton()}
                        </Button>
                    </div>
                </div>

                <div className="md:col-span-2 xl:col-span-3 h-full overflow-hidden">
                    <AnalysisResult />
                </div>
            </main>
        </div>
        </React.Suspense>
    );
};

export default App;