"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  X, 
  ExternalLink, 
  FileText, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Play, 
  ArrowRight,
  Shield,
  Activity,
  HeartHandshake,
  Lightbulb,
  MessageSquare
} from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { analyzeCompany, qualifyCompany } from "@/lib/api";
import { QualificationData } from "@/types";

type LoadingStep = "idle" | "scraping" | "analyzing" | "qualifying" | "done";

interface Toast {
  message: string;
  type: "success" | "error" | "info";
}

export default function Dashboard() {
  // Input fields state
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState("");

  // Workflow state
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [totalPagesScraped, setTotalPagesScraped] = useState<number | null>(null);
  const [results, setResults] = useState<QualificationData | null>(null);
  const [rawJson, setRawJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quick autofill for demo purposes
  const autofillDemo = () => {
    setCompanyName("FlowSync Solutions");
    setCompanyUrl("https://flowsync.io");
    setCompanyDetails(
      "A fast-growing software company specializing in workflow automation. They have been struggling with manual data entry in their CRM and are looking to optimize their sales pipelines."
    );
    showToast("Autofilled demo company data", "success");
  };

  // Toast notification helper
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    if (type !== "info") {
      const timer = setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
      return () => clearTimeout(timer);
    }
  };

  // Copy raw JSON to clipboard
  const copyToClipboard = () => {
    if (!rawJson) return;
    navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
    setCopied(true);
    showToast("JSON copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Main execution orchestration
  const handleAnalyzeAndQualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Please enter a company name", "error");
      return;
    }
    if (!companyUrl.trim()) {
      showToast("Please enter a company website", "error");
      return;
    }

    // Format URL properly if missing http
    let formattedUrl = companyUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
      setCompanyUrl(formattedUrl);
    }

    setError(null);
    setResults(null);
    setRawJson(null);
    setTotalPagesScraped(null);

    try {
      // Step 1: Scraping Website...
      setLoadingStep("scraping");
      showToast("Crawling company homepage and pages...", "info");

      // Set a simulation timer: after 4.5 seconds of scraping, transition to "Analyzing Business..."
      // because the crawl4ai library takes time to crawl and scrape, and then process the text.
      const stepTimer = setTimeout(() => {
        setLoadingStep("analyzing");
      }, 4500);

      const analyzeRes = await analyzeCompany({
        company_name: companyName,
        company_url: formattedUrl,
        company_details: companyDetails
      });

      clearTimeout(stepTimer);

      if (!analyzeRes.success) {
        throw new Error(analyzeRes.error || "Failed to analyze website");
      }

      setTotalPagesScraped(analyzeRes.total_pages_scraped || 0);

      // Step 2: Transition fully to qualifying (since analyze finished, we transition to lead qualification step)
      setLoadingStep("qualifying");
      showToast(`Successfully scraped ${analyzeRes.total_pages_scraped} pages. Running Lead Qualification...`, "info");

      const qualifyRes = await qualifyCompany({
        company_name: companyName,
        company_url: formattedUrl,
        company_details: companyDetails
      });

      if (!qualifyRes.success) {
        throw new Error(qualifyRes.error || "Failed to qualify company");
      }

      // Done
      setResults(qualifyRes.qualification || null);
      setRawJson(qualifyRes);
      setLoadingStep("done");
      setToast(null); // Clear the loading info toast
      showToast(`${companyName} qualified successfully!`, "success");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred in the qualification pipeline.");
      setLoadingStep("idle");
      showToast(err.message || "Pipeline execution failed", "error");
    }
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "HOT":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20";
      case "WARM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20";
      case "COLD":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20";
    }
  };

  // Custom step display helper for the loading interface
  const renderLoadingProgress = () => {
    const steps = [
      { id: "scraping", label: "Scraping Website...", desc: "Crawling internal business pages using crawl4ai" },
      { id: "analyzing", label: "Analyzing Business...", desc: "Extracting services, values, and business context" },
      { id: "qualifying", label: "Qualifying Lead...", desc: "Mapping target pain points and scoring via Hyperlinq LLM" }
    ];

    const currentIdx = steps.findIndex(s => s.id === loadingStep);

    return (
      <div className="space-y-6 max-w-md w-full mx-auto p-6 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
          <h3 className="text-lg font-bold text-white tracking-wide">Executing AI Qualification</h3>
          <p className="text-xs text-zinc-400">Processing target company data through RAG knowledge graph</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = step.id === loadingStep;
            
            return (
              <div 
                key={step.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? "bg-zinc-800/40 border-indigo-500/40 shadow-indigo-500/5 shadow-sm" 
                    : isCompleted
                    ? "bg-zinc-900/40 border-emerald-950/20 opacity-80"
                    : "border-transparent opacity-40"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center justify-center h-5 w-5">
                      <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full border border-zinc-700 text-zinc-500 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold tracking-wide ${isActive ? "text-white" : isCompleted ? "text-zinc-300" : "text-zinc-500"}`}>
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-indigo-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 shadow-2xl transition-all duration-300 border backdrop-blur-md ${
            toast.type === "success" 
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-500/5" 
              : toast.type === "error" 
              ? "bg-rose-950/90 border-rose-500/30 text-rose-200 shadow-rose-500/5" 
              : "bg-zinc-900/90 border-indigo-500/30 text-indigo-200 shadow-indigo-500/5"
          }`}
        >
          {toast.type === "success" && (
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Check className="h-4 w-4" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 animate-spin">
              <RefreshCw className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {toast.type === "success" ? "Success" : toast.type === "error" ? "Pipeline Error" : "System Update"}
            </span>
            <span className="text-sm text-zinc-300 mt-0.5">{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="text-zinc-500 hover:text-zinc-300 ml-4 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">Hyperlinq</span>
              <span className="text-xs text-zinc-500 block font-medium -mt-1">Intelligence System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-zinc-400">Backend Connected</span>
            </div>
            <button 
              onClick={autofillDemo}
              className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg transition-all"
            >
              Demo Auto-Fill
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form Controls (Sticky) */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="bg-zinc-900/40 backdrop-blur-sm border-zinc-800 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Target Profile
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Provide company details to scrape their portal and perform lead scoring.
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleAnalyzeAndQualify}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="company-name" className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Company Name
                    </label>
                    <Input
                      id="company-name"
                      placeholder="e.g., FlowSync Solutions"
                      className="bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-indigo-500/50"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loadingStep !== "idle" && loadingStep !== "done"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="company-website" className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Company Website <Globe className="h-3 w-3 text-zinc-500" />
                    </label>
                    <Input
                      id="company-website"
                      placeholder="e.g., flowsync.io"
                      className="bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-indigo-500/50"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      disabled={loadingStep !== "idle" && loadingStep !== "done"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="company-details" className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Additional Context <span className="text-zinc-500 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <Textarea
                      id="company-details"
                      placeholder="Enter target market notes, deal size, or custom notes..."
                      className="bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-600 min-h-[100px] focus-visible:ring-indigo-500/50 text-sm"
                      value={companyDetails}
                      onChange={(e) => setCompanyDetails(e.target.value)}
                      disabled={loadingStep !== "idle" && loadingStep !== "done"}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold tracking-wide transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                    disabled={loadingStep !== "idle" && loadingStep !== "done"}
                  >
                    {loadingStep !== "idle" && loadingStep !== "done" ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Running Pipeline...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Analyze & Qualify
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Hyperlinq Fit Quick Info */}
            <Card className="bg-zinc-900/20 border-zinc-900 hidden lg:block">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  Hyperlinq AI Standard
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Crawling is executed via high-performance headless agents, preserving DOM schemas. Analysis leverages custom retrieval-augmented prompt engineering matched against Hyperlinq's knowledge graph.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Execution Output & Dashboard */}
        <div className="flex-1 min-w-0">
          
          {/* Loading Screen State */}
          {loadingStep !== "idle" && loadingStep !== "done" && (
            <div className="min-h-[450px] flex items-center justify-center bg-zinc-900/10 border border-zinc-900 rounded-xl p-8">
              {renderLoadingProgress()}
            </div>
          )}

          {/* Error State */}
          {error && loadingStep === "idle" && (
            <Card className="bg-rose-950/20 border-rose-900/60 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-base font-bold text-rose-400">Analysis Pipeline Failed</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">{error}</p>
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setError(null)}
                      className="border-zinc-800 hover:bg-zinc-900 text-xs font-semibold"
                    >
                      Dismiss Error
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Idle Empty State */}
          {loadingStep === "idle" && !results && !error && (
            <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl">
              <div className="h-14 w-14 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
                <Building2 className="h-7 w-7 text-indigo-500/50" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Ready for Qualification</h2>
              <p className="text-sm text-zinc-400 max-w-sm mt-2 leading-relaxed">
                Provide a company profile on the left or use the autofill button to see the SaaS qualification workflow in action.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={autofillDemo}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Try Demo: FlowSync Solutions
                </button>
              </div>
            </div>
          )}

          {/* Results dashboard */}
          {results && loadingStep === "done" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              {/* Header / Summary Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/20 border border-zinc-800 rounded-2xl shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{companyName}</h2>
                    <Badge className={getStatusColor(results.lead_status)}>
                      {results.lead_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Globe className="h-3 w-3 text-zinc-500" />
                    <span className="hover:text-indigo-400 transition-colors">
                      {companyUrl}
                    </span>
                    {totalPagesScraped !== null && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span>{totalPagesScraped} website pages analyzed</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Qualification Status</span>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      {results.qualified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">QUALIFIED</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm font-bold text-zinc-400">DISQUALIFIED</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of Results: Score & Core Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Circular Progress Card */}
                <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col justify-between shadow-lg h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-zinc-500" />
                      Lead Score Index
                    </CardTitle>
                    <CardDescription className="text-[11px] text-zinc-500">Overall score based on solution alignment.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-6">
                    <CircularProgress value={results.lead_score} size={130} strokeWidth={11} />
                  </CardContent>
                  <CardFooter className="bg-zinc-900/20 border-t border-zinc-900/60 py-2.5 flex justify-center">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                      {results.lead_score >= 75 ? "Highly Qualified Pipeline" : results.lead_score >= 40 ? "Standard Pipeline" : "Low Interest Pipeline"}
                    </span>
                  </CardFooter>
                </Card>

                {/* Best Service Card */}
                <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col justify-between shadow-lg h-full border-t-2 border-t-indigo-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HeartHandshake className="h-4 w-4 text-indigo-400" />
                        Best Fit Service
                      </CardTitle>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wider py-0 px-1.5">
                        Primary
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px] text-zinc-500">Top offering aligned with company needs.</CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <h3 className="text-lg font-bold text-white tracking-wide">{results.best_service || "Not Specified"}</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      This service provides automated integrations custom-designed to resolve core workflow friction.
                    </p>
                  </CardContent>
                  <CardFooter className="bg-zinc-900/20 border-t border-zinc-900/60 py-3 text-xs text-zinc-400 flex items-center justify-between">
                    <span className="font-semibold text-indigo-400">100% Target Match</span>
                    <Activity className="h-4 w-4 text-indigo-400/40" />
                  </CardFooter>
                </Card>

                {/* Secondary Service Card */}
                <Card className="bg-zinc-900/40 border-zinc-800 flex flex-col justify-between shadow-lg h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-cyan-400" />
                        Secondary Service
                      </CardTitle>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold uppercase tracking-wider py-0 px-1.5">
                        Alternative
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px] text-zinc-500">Alternative services that add strategic value.</CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <h3 className="text-lg font-bold text-zinc-100 tracking-wide">{results.secondary_service || "None Recommended"}</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Addresses supplementary inefficiencies, scaling operations and optimization hooks.
                    </p>
                  </CardContent>
                  <CardFooter className="bg-zinc-900/20 border-t border-zinc-900/60 py-3 text-xs text-zinc-400 flex items-center justify-between">
                    <span className="font-semibold text-cyan-400">Supporting Solution</span>
                    <Activity className="h-4 w-4 text-cyan-400/40" />
                  </CardFooter>
                </Card>

              </div>

              {/* Executive Summary */}
              <Card className="bg-zinc-900/40 border-zinc-800 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    Executive Lead Summary
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500">Business-oriented profile breakdown.</CardDescription>
                </CardHeader>
                <CardContent className="py-2.5">
                  <p className="text-sm text-zinc-200 leading-relaxed font-normal bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                    {results.why_hyperlinq ? (
                      `"${companyName} is a ${results.qualified ? "highly" : "moderately"} qualified lead with a lead score of ${results.lead_score}. The company demonstrates ${results.lead_status === "HOT" ? "strong" : "active"} alignment with Hyperlinq's ${results.best_service || "AI Automation"} services. Key pain points identified include ${results.pain_points.slice(0, 3).join(", ") || "operational inefficiencies"}. ${results.why_hyperlinq}"`
                    ) : (
                      `"${companyName} is a ${results.qualified ? "highly" : "moderately"} qualified lead with a lead score of ${results.lead_score}. The company demonstrates ${results.lead_status === "HOT" ? "strong" : "active"} alignment with Hyperlinq's ${results.best_service || "AI Automation"} services. Key pain points include ${results.pain_points.slice(0, 3).join(", ") || "manual workflows, process tracking, and scaling challenges"}.`
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Grid: Pain Points & Buying Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pain Points */}
                <Card className="bg-zinc-900/40 border-zinc-800 shadow-lg">
                  <CardHeader className="pb-3 border-b border-zinc-900">
                    <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Key Pain Points
                    </CardTitle>
                    <CardDescription className="text-[11px] text-zinc-500">Inefficiencies detected on website and user details.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {results.pain_points && results.pain_points.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {results.pain_points.map((pain, idx) => (
                          <div 
                            key={idx} 
                            className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs px-3.5 py-2 rounded-xl border border-zinc-850 transition-colors flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            {pain}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">No major pain points extracted automatically.</span>
                    )}
                  </CardContent>
                </Card>

                {/* Buying Signals */}
                <Card className="bg-zinc-900/40 border-zinc-800 shadow-lg">
                  <CardHeader className="pb-3 border-b border-zinc-900">
                    <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Buying Signals
                    </CardTitle>
                    <CardDescription className="text-[11px] text-zinc-500">Identified triggers indicating readiness to buy.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {results.buying_signals && results.buying_signals.length > 0 ? (
                      <div className="space-y-2.5">
                        {results.buying_signals.map((signal, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-start gap-2.5 text-xs text-zinc-300 p-2.5 bg-zinc-950/30 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-all"
                          >
                            <span className="mt-0.5 p-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="font-medium">{signal}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">No immediate buying signals detected.</span>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Section 5: Hyperlinq Recommendations */}
              <Card className="bg-zinc-900/40 border-zinc-800 shadow-lg overflow-hidden">
                <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/20">
                  <CardTitle className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Hyperlinq Recommendation System
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500">RAG-driven solution alignment metrics.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
                    
                    {/* Solutions Hyperlinq can Provide */}
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-zinc-400" />
                        Solutions Rendered
                      </h4>
                      <ul className="space-y-2">
                        {results.solutions && results.solutions.length > 0 ? (
                          results.solutions.map((sol, idx) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                              <span className="mt-1 h-1 w-1 bg-indigo-500 rounded-full flex-shrink-0"></span>
                              <span>{sol}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="text-xs text-zinc-400">Custom workflow mapping</li>
                            <li className="text-xs text-zinc-400">Automated synchronization portals</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Recommended Services */}
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-zinc-400" />
                        Recommended Services
                      </h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-zinc-950/60 border border-zinc-900 rounded-lg">
                          <span className="text-xs font-bold text-indigo-300 block">{results.best_service || "AI Automation Systems"}</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5 block">Custom RAG-based business configurations.</span>
                        </div>
                        {results.secondary_service && (
                          <div className="p-2 bg-zinc-950/30 border border-zinc-900/50 rounded-lg">
                            <span className="text-xs font-semibold text-cyan-300 block">{results.secondary_service}</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5 block">Supplementary systems engineering.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Why Hyperlinq is a Good Fit */}
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-zinc-400" />
                        Strategic Alignment Fit
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-indigo-950/10 border border-indigo-950/40 p-3 rounded-lg">
                        {results.why_hyperlinq || "Target displays significant operational bottlenecks matching Hyperlinq's automation models."}
                      </p>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Section 7: Raw JSON collapsible */}
              <Collapsible
                open={jsonOpen}
                onOpenChange={setJsonOpen}
                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-lg"
              >
                <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/20 border-b border-zinc-900">
                  <CollapsibleTrigger className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer select-none">
                    {jsonOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Raw Qualification JSON Response
                  </CollapsibleTrigger>
                  
                  {jsonOpen && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>

                <CollapsibleContent>
                  <div className="p-4 bg-zinc-950 overflow-x-auto text-[11px] font-mono text-zinc-400 leading-relaxed border-t border-zinc-950 max-h-[400px]">
                    <pre>{JSON.stringify(rawJson, null, 2)}</pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>

            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-6 bg-zinc-950/20 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Hyperlinq System Corporation. All rights reserved.</p>
          <div className="flex items-center gap-4 text-zinc-500">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-zinc-400 transition-colors">Developer Portal</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
