from rag.query import search_knowledge
def qualify_company(company_data):

    company_text = str(company_data)
    knowledge = search_knowledge(company_text)
    score = 0
    service = "Unknown"
    pain_points = []
    buying_signals = []
    lower_text = company_text.lower()

    # AI Automation
    if any(x in lower_text for x in [
        "automation",
        "workflow",
        "process",
        "manual"
    ]):
        score += 25
        service = "AI Automation Systems"

    # CRM
    if any(x in lower_text for x in [
        "crm",
        "lead",
        "sales",
        "pipeline"
    ]):
        score += 25
        service = "AI + CRM Automation"

        pain_points.extend([
            "Manual CRM updates",
            "Lead management inefficiencies"
        ])

        buying_signals.extend([
            "CRM Automation",
            "Lead Tracking"
        ])

    # SEO
    if any(x in lower_text for x in [
        "seo",
        "ranking",
        "traffic",
        "google"
    ]):
        score += 25
        service = "AI Search Optimization"

    # Startup Consulting
    if any(x in lower_text for x in [
        "startup",
        "cto",
        "funding",
        "mvp"
    ]):
        score += 25
        service = "Startup Technology Consulting"

    return {
        "recommended_service": service,
        "qualification_score": score,
        "pain_points": pain_points,
        "buying_signals": buying_signals,
        "knowledge_match": knowledge[:500]
    }