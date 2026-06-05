from qualification_agent import qualify_company

company = {
    "name":"FlowSync Solutions",
    "description":
    """
    CRM automation,
    workflow automation,
    lead management,
    business process optimization
    """
}

print(
    qualify_company(company)
)