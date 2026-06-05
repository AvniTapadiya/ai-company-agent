from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = Chroma(
    persist_directory="chroma_db",
    embedding_function=embedding_model
)

def search_knowledge(query):

    docs = db.similarity_search(
        query,
        k=5
    )

    return "\n\n".join(
        [d.page_content for d in docs]
    )