from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

KNOWLEDGE_DIR = "knowledge"

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

documents = []

for file in Path(KNOWLEDGE_DIR).glob("*.md"):

    content = file.read_text(
        encoding="utf-8"
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_text(content)

    for chunk in chunks:
        documents.append(chunk)

vectordb = Chroma.from_texts(
    texts=documents,
    embedding=embedding_model,
    persist_directory="chroma_db"
)

vectordb.persist()

print("Knowledge Base Created")