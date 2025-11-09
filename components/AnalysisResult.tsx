import React from 'react';
import { useCodeCourtStore } from '../store/useCodeCourtStore';
import { Issue } from '../types';
import { PERSONA_NAMES } from '../constants';
import { Card, CardContent, CardHeader, CardTitle, Button, CardFooter } from './common';
import { Loader2, Copy, Check, ThumbsUp, Download } from 'lucide-react';

const parseIssueContent = (content: string) => {
    const titleMatch = content.match(/^## Main Title:\s*(.*)/im);
    const title = titleMatch ? titleMatch[1].trim() : 'Analysis Finding';

    const problemMatch = content.match(/### The Problem\s*([\s\S]*?)(?=\s*### The Impact|\s*### The Fix|\s*### Code Fix|$)/i);
    const problem = problemMatch ? problemMatch[1].trim() : '';

    const impactMatch = content.match(/### The Impact\s*([\s\S]*?)(?=\s*### The Fix|\s*### Code Fix|$)/i);
    const impact = impactMatch ? impactMatch[1].trim() : '';

    const fixMatch = content.match(/### The Fix\s*([\s\S]*?)(?=\s*### Code Fix|$)/i);
    const fix = fixMatch ? fixMatch[1].trim() : '';
    
    const codeFixMatch = content.match(/### Code Fix\s*```(?:.*\n)?([\s\S]*?)\n```/i);
    const codeFix = codeFixMatch ? codeFixMatch[1].trim() : '';

    return { title, problem, impact, fix, codeFix };
};

// A simple component to render basic markdown (bold and code).
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    // Split by markdown delimiters, keeping the delimiters
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={i} className="bg-secondary px-1 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
                }
                return part;
            })}
        </>
    );
};

const severityClasses: Record<string, string> = {
    critical: 'text-red-400 border-red-400/50 bg-red-400/10',
    high: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
    medium: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    low: 'text-sky-400 border-sky-400/50 bg-sky-400/10',
};

const severityDotColors: Record<string, string> = {
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-sky-400',
};

interface StructuredIssueCardProps {
    issue: Issue;
    isApproved: boolean;
    onApproveToggle: () => void;
}

const StructuredIssueCard: React.FC<StructuredIssueCardProps> = ({ issue, isApproved, onApproveToggle }) => {
    const [copied, setCopied] = React.useState(false);
    const { title, problem, impact, fix, codeFix } = React.useMemo(() => parseIssueContent(issue.content), [issue.content]);

    const impactItems = React.useMemo(() => {
        if (!impact) return [];
        return impact
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('*'))
            .map(line => {
                const severityMatch = line.match(/\*\*(Critical|High|Medium|Low)\*\*/i);
                const severity = severityMatch ? severityMatch[1].toLowerCase() : 'medium';
                // More robustly remove the bullet and severity tag to get the clean text
                const text = line.replace(/^[-*]\s*\*\*(?:Critical|High|Medium|Low)\*\*[:\s]*/i, '').trim();
                return { severity, text };
            })
            .filter(item => item.text); // Ensure we don't render empty items
    }, [impact]);

    const handleCopy = () => {
        if (codeFix && codeFix !== 'N/A') {
            navigator.clipboard.writeText(codeFix);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    // Don't render card for empty content chunks during streaming
    if (!problem && impactItems.length === 0 && !fix && !codeFix) return null;

    const hasCodeFix = codeFix && codeFix !== 'N/A';

    return (
        <Card className="mb-6 bg-card/60 backdrop-blur-sm border-border/50 flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
                {problem && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2">The Problem</h3>
                        <p className="text-muted-foreground"><SimpleMarkdown text={problem} /></p>
                    </div>
                )}

                {impactItems.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-3">The Impact</h3>
                        <ul className="space-y-3">
                            {impactItems.map(({ severity, text }, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${severityDotColors[severity] || severityDotColors.medium}`} />
                                    <div className="flex-1">
                                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${severityClasses[severity] || severityClasses.medium} mr-2`}>
                                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                        </span>
                                        <span className="text-muted-foreground"><SimpleMarkdown text={text} /></span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {fix && (
                     <div>
                        <h3 className="font-semibold text-lg mb-2">The Fix</h3>
                        <p><SimpleMarkdown text={fix} /></p>
                    </div>
                )}

                {hasCodeFix && (
                     <div>
                        <h3 className="font-semibold text-lg mb-2">Code Fix</h3>
                        <div className="relative bg-secondary p-4 rounded-md font-mono text-sm border">
                            <pre className="overflow-x-auto"><code>{codeFix}</code></pre>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleCopy} aria-label="Copy code">
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
             {hasCodeFix && (
                <CardFooter>
                    <Button 
                        variant={isApproved ? "secondary" : "outline"} 
                        className="w-full" 
                        onClick={onApproveToggle}
                    >
                        {isApproved 
                            ? <><Check className="w-4 h-4 mr-2 text-green-500" /> Approved</> 
                            : <><ThumbsUp className="w-4 h-4 mr-2" /> Approve Fix</>
                        }
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};


const AnalysisResult: React.FC = () => {
    const { issues, activePersona, connectionStatus, codeFiles, isScreenSharing, approvedIssueIds, toggleApproveFix, approveAllFixes } = useCodeCourtStore();
    
    const isAnalyzing = connectionStatus === 'connecting' || connectionStatus === 'streaming';
    const hasContext = codeFiles.length > 0 || isScreenSharing;

    const validIssues = issues.filter(issue => issue.content.trim().length > 10);
    const issuesWithFixes = React.useMemo(() => 
        validIssues.filter(issue => {
            const { codeFix } = parseIssueContent(issue.content);
            return codeFix && codeFix !== 'N/A';
        })
    , [validIssues]);

    const handleApproveAll = () => {
        const ids = issuesWithFixes.map(issue => issue.id);
        approveAllFixes(ids);
    };

    const handleDownload = () => {
      const approvedIssues = issues.filter(issue => approvedIssueIds.includes(issue.id));
      const allFixes = approvedIssues.map(issue => {
        const { codeFix, title } = parseIssueContent(issue.content);
        return `/* --- Fix for: ${title} --- */\n\n${codeFix}\n\n`;
      }).join('');

      const blob = new Blob([allFixes], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'codecourt_fixes.js';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
        <Card className="h-full flex flex-col bg-transparent border-0 shadow-none">
            <CardHeader className="pt-2 sticky top-0 bg-secondary/40 backdrop-blur-sm z-10 flex flex-row justify-between items-center">
                <CardTitle>Analysis by {PERSONA_NAMES[activePersona]}</CardTitle>
                {issuesWithFixes.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleApproveAll} disabled={isAnalyzing}>
                        <ThumbsUp className="w-4 h-4 mr-2" /> Approve All
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-4">
                {isAnalyzing && validIssues.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Analyzing context...</p>
                        <p className="text-xs">The AI is thinking.</p>
                    </div>
                )}

                {!hasContext && !isAnalyzing && (
                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>Please provide code or share your screen to begin analysis.</p>
                    </div>
                )}
                
                {connectionStatus === 'error' && (
                     <div className="flex flex-col items-center justify-center h-full text-red-500">
                        <p>An error occurred during analysis. Please try again.</p>
                    </div>
                )}

                {validIssues.map(issue => (
                    <StructuredIssueCard 
                        key={issue.id} 
                        issue={issue}
                        isApproved={approvedIssueIds.includes(issue.id)}
                        onApproveToggle={() => toggleApproveFix(issue.id)}
                    />
                ))}
                
                {isAnalyzing && <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
            </CardContent>
            {approvedIssueIds.length > 0 && (
                <CardFooter className="sticky bottom-0 bg-secondary/40 backdrop-blur-sm z-10 pt-4">
                    <Button size="lg" className="w-full" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download {approvedIssueIds.length} Approved Fix{approvedIssueIds.length > 1 ? 'es' : ''}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default AnalysisResult;