from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from crawl4ai import AsyncWebCrawler
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

import os
import re
import json
from qualification_agent import qualify_company

from fastapi.middleware.cors import CORSMiddleware

# ============================================
# LOAD ENV VARIABLES
# ============================================
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ============================================
# REQUEST MODEL
# ============================================
class CompanyRequest(BaseModel):
    company_name: str
    company_url: str
    company_details: str = ""


# ============================================
# CLEAN MARKDOWN CONTENT
# ============================================
def clean_markdown(text):

    if not text:
        return ""

    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)

    text = re.sub(r'http\S+', '', text)

    text = re.sub(r'\n+', '\n', text)

    text = re.sub(r'[ \t]+', ' ', text)

    junk_phrases = [
        "Buy Template",
        "Pelican",
        "Webflow",
        "Style Guide",
        "Licenses",
        "Changelog",
        "More Templates",
        "Password Protected",
        "404 Page",
        "Utility Pages",
        "Main Pages"
    ]

    for junk in junk_phrases:
        text = text.replace(junk, "")

    return text.strip()


# ============================================
# EXTRACT INTERNAL LINKS
# ============================================
def extract_internal_links(base_url, html):

    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")

    links = set()

    base_domain = urlparse(base_url).netloc

    for a in soup.find_all("a", href=True):

        href = a["href"]

        full_url = urljoin(base_url, href)

        parsed = urlparse(full_url)

        if parsed.netloc == base_domain:

            clean_url = full_url.split("#")[0].rstrip("/")

            links.add(clean_url)

    return list(links)


# ============================================
# FILTER IMPORTANT BUSINESS LINKS
# ============================================
def filter_business_links(links):

    important_keywords = [
        "about",
        "service",
        "solution",
        "pricing",
        "career",
        "job",
        "blog",
        "case",
        "contact",
        "team",
        "company",
        "workflow",
        "automation",
        "process",
        "integration",
        "customer",
        "client"
    ]

    ignored_keywords = [
        "login",
        "signup",
        "register",
        "privacy",
        "terms",
        "404",
        "wp-content",
        ".jpg",
        ".png",
        ".svg",
        ".pdf",
        ".zip"
    ]

    filtered = []

    for link in links:

        link_lower = link.lower()

        if any(bad in link_lower for bad in ignored_keywords):
            continue

        if any(good in link_lower for good in important_keywords):
            filtered.append(link)

    return list(set(filtered))


# ============================================
# SMART COMPANY CRAWLER
# ============================================
async def scrape_company(base_url: str):

    company_pages = []

    visited = set()

    async with AsyncWebCrawler() as crawler:

        try:

            print(f"\nSCRAPING HOMEPAGE: {base_url}")

            homepage = await crawler.arun(
                url=base_url
            )

            if not homepage:
                return []

            homepage_title = ""

            if homepage.metadata:
                homepage_title = homepage.metadata.get(
                    "title",
                    ""
                )

            homepage_markdown = clean_markdown(
                getattr(homepage, "markdown", "")
            )

            if homepage_markdown:

                company_pages.append({
                    "url": base_url.rstrip("/"),
                    "title": homepage_title,
                    "markdown": homepage_markdown[:20000]
                })

            html_content = getattr(
                homepage,
                "cleaned_html",
                ""
            )

            internal_links = extract_internal_links(
                base_url,
                html_content
            )

            important_links = filter_business_links(
                internal_links
            )

            print("\nIMPORTANT LINKS FOUND:")
            print(important_links)

            for link in important_links[:15]:

                normalized_link = link.rstrip("/")

                if normalized_link in visited:
                    continue

                visited.add(normalized_link)

                try:

                    print(f"\nSCRAPING: {normalized_link}")

                    result = await crawler.arun(
                        url=normalized_link
                    )

                    if not result:
                        continue

                    title = ""

                    if result.metadata:
                        title = result.metadata.get(
                            "title",
                            ""
                        )

                    bad_titles = [
                        "Not Found",
                        "404",
                        "Password Protected",
                        "Pelican"
                    ]

                    if any(
                        bad.lower() in title.lower()
                        for bad in bad_titles
                    ):
                        continue

                    cleaned_markdown = clean_markdown(
                        getattr(result, "markdown", "")
                    )

                    if len(cleaned_markdown) < 300:
                        continue

                    company_pages.append({
                        "url": normalized_link,
                        "title": title,
                        "markdown": cleaned_markdown[:20000]
                    })

                except Exception as e:

                    print(
                        f"Error scraping {normalized_link}: {e}"
                    )

        except Exception as e:

            print(f"\nCRAWLER ERROR: {e}")

    return company_pages


# ============================================
# MAIN ANALYZE ROUTE
# ============================================
@app.post("/analyze")
async def analyze_company(data: CompanyRequest):

    try:

        website_data = await scrape_company(
            data.company_url
        )

        os.makedirs("companies", exist_ok=True)

        filename = (
            data.company_name
            .lower()
            .replace(" ", "_")
        )

        filepath = f"companies/{filename}.json"

        with open(filepath, "w") as f:

            json.dump({
                "company_name": data.company_name,
                "website": data.company_url,
                "company_details": data.company_details,
                "total_pages_scraped": len(website_data),
                "website_data": website_data
            }, f, indent=2)

        return {

            "success": True,

            "company_name": data.company_name,

            "website": data.company_url,

            "total_pages_scraped": len(website_data),

            "saved_to": filepath,

            "website_data": website_data
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# HEALTH CHECK ROUTE
# ============================================
@app.get("/")
async def home():

    return {
        "status": "AI Company Intelligence Server Running"
    }

# ============================================
# QUALIFICATION ROUTE
# ============================================
@app.post("/qualify")
async def qualify(data: CompanyRequest):

    try:

        filename = (
            data.company_name
            .lower()
            .replace(" ", "_")
        )

        filepath = f"companies/{filename}.json"

        if not os.path.exists(filepath):

            return {
                "success": False,
                "error": "Company not analyzed yet. Run /analyze first."
            }

        with open(filepath, "r") as f:
            company_data = json.load(f)

        result = qualify_company(
            company_data
        )

        return {
            "success": True,
            "company_name": data.company_name,
            "qualification": result
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }