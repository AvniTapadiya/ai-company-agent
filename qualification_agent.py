# qualification_agent.py

from rag.query import search_knowledge
from openrouter_client import client
import json
import time

def get_rule_based_qualification(company_summary, knowledge):
    """
    Rule-based qualification fallback to guarantee the dashboard always gets
    a clean, structured response even if the LLM provider is completely offline.
    """
    lower_text = company_summary.lower()
    score = 0
    services = []
    pain_points = []
    buying_signals = []
    solutions = []

    # AI Automation
    if any(x in lower_text for x in ["automation", "workflow", "process", "manual", "optimization"]):
        score += 25
        services.append("AI Automation Systems")
        pain_points.append("Manual workflow bottlenecks")
        buying_signals.append("Workflow optimization needs")
        solutions.append("Automated business process flows")

    # CRM
    if any(x in lower_text for x in ["crm", "lead", "sales", "pipeline", "hubspot", "salesforce"]):
        score += 35
        services.append("AI + CRM Automation")
        pain_points.extend(["Manual CRM updates", "Lead tracking inefficiencies"])
        buying_signals.extend(["CRM automation interest", "Lead conversion drops"])
        solutions.extend(["Hyperlinq automated CRM pipelines", "Real-time lead scoring updates"])

    # SEO
    if any(x in lower_text for x in ["seo", "ranking", "traffic", "google", "marketing", "content"]):
        score += 20
        services.append("AI Search Optimization")
        pain_points.append("Low organic search traffic")
        buying_signals.append("SEO agency replacement search")
        solutions.append("AI-driven content generation and ranking strategy")

    # Startup Consulting
    if any(x in lower_text for x in ["startup", "cto", "funding", "mvp", "seed", "pitch"]):
        score += 25
        services.append("Startup Technology Consulting")
        pain_points.append("Lack of technical scaling architecture")
        buying_signals.append("Seeking fractional CTO or MVP builder")
        solutions.append("Hyperlinq MVP bootstrap planning and CTO advisory")

    best_service = services[0] if services else "AI Automation Systems"
    secondary_service = services[1] if len(services) > 1 else None

    # Calculate final score (capped at 100)
    final_score = min(score, 100)
    if final_score == 0:
        final_score = 45 # default baseline
        best_service = "AI Automation Systems"
        pain_points.append("General operational inefficiencies")
        buying_signals.append("Exploratory technology review")
        solutions.append("AI consulting review")

    status = "COLD"
    if final_score >= 70:
        status = "HOT"
    elif final_score >= 40:
        status = "WARM"

    qualified = final_score >= 50

    why = f"Based on keyword parsing, this company shows operational indicators that align with Hyperlinq's {best_service}."
    if secondary_service:
        why += f" They are also a prospective candidate for {secondary_service}."

    return {
        "qualified": qualified,
        "lead_score": final_score,
        "lead_status": status,
        "best_service": best_service,
        "secondary_service": secondary_service,
        "pain_points": list(set(pain_points)),
        "buying_signals": list(set(buying_signals)),
        "solutions": list(set(solutions)),
        "why_hyperlinq": why
    }

def qualify_company(company_data):
    name = company_data.get("company_name", "Unknown Company")
    url = company_data.get("website", "")
    details = company_data.get("company_details", "")
    
    # 1. Clean and truncate page contents to prevent token count blow-up.
    # Passing raw full-page markdowns of up to 15 pages easily exceeds 4k/8k context limits.
    website_summary = ""
    website_data = company_data.get("website_data", [])
    for page in website_data:
        page_url = page.get("url", "")
        page_title = page.get("title", "")
        page_content = page.get("markdown", "")
        
        is_homepage = page_url.rstrip("/") == url.rstrip("/")
        # Truncate homepage at 4000 characters, other pages at 1200 characters
        limit = 4000 if is_homepage else 1200
        
        website_summary += f"\n- Page: {page_url}\n  Title: {page_title}\n  Excerpt:\n  {page_content[:limit]}\n"

    company_summary = f"""
Company Name: {name}
Website: {url}
Additional Notes: {details}
Website Scraped Content:
{website_summary}
"""

    # Retrieve relevant knowledge and limit size
    knowledge = search_knowledge(company_summary)
    knowledge = knowledge[:3000]

    prompt = f"""
You are Hyperlinq's AI Lead Qualification Agent.

Your task is to analyze the company information and determine:
* Is the company qualified for Hyperlinq's services? (true/false)
* Lead score (0-100)
* Lead status (HOT, WARM, COLD)
* Best matching Hyperlinq service
* Secondary service (if applicable)
* Pain points (array of strings)
* Buying signals (array of strings)
* Solutions Hyperlinq can provide (array of strings)
* Why Hyperlinq is a good fit

COMPANY INFORMATION:
{company_summary}

RELEVANT SERVICE KNOWLEDGE:
{knowledge}

IMPORTANT RULES:
1. Use ONLY the provided service knowledge.
2. Return VALID JSON ONLY.
3. Do not include markdown code blocks like ```json or ```.
4. Do not include explanations outside JSON.

Required JSON format:
{{
  "qualified": true,
  "lead_score": 85,
  "lead_status": "HOT",
  "best_service": "AI + CRM Automation",
  "secondary_service": "AI Automation Systems",
  "pain_points": ["Manual CRM updates"],
  "buying_signals": ["CRM automation interest"],
  "solutions": ["Hyperlinq CRM Integration"],
  "why_hyperlinq": "Detailed reasoning here"
}}
"""

    # Model loop list prioritizing active and responsive free models on OpenRouter
    models_to_try = [
        "openai/gpt-oss-20b:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "qwen/qwen3-coder:free"
    ]

    for model in models_to_try:
        try:
            print(f"Qualifying lead with model: {model}")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=900
            )

            result = response.choices[0].message.content
            if not result:
                print(f"Warning: Model {model} returned empty content.")
                continue

            result = result.strip()
            
            # Clean up markdown code block fences if returned by model
            if result.startswith("```"):
                lines = result.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                result = "\n".join(lines).strip()
            elif "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()

            parsed_data = json.loads(result)
            print(f"Success! Qualified company {name} using model: {model}")
            return parsed_data

        except Exception as e:
            print(f"Model {model} failed. Error details: {e}")
            continue

    # Fallback if all AI model endpoints fail
    print("AI pipelines exhausted or rate-limited. Activating rule-based fallback qualification.")
    return get_rule_based_qualification(company_summary, knowledge)
