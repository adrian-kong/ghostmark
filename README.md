# 🕵️ Textual Watermark – Leak Detection via Language Variants

A quick weekend side project that generates unique language variants for each recipient of a confidential message. The goal? If someone screenshots or copy-pastes the content, you can trace it back to the leaker.

It uses subtle wording changes powered by Gemini to embed watermarks into text. When a leak happens, you can compare the leaked version to your generated variants and identify who it came from.

Yes, it even works for shared screenshots. But if someone paraphrases or multiple people collude and blend their variants, you're out of luck.

---

## Demo

[🎥 Watch demo 1](media/demo.mp4)

---

## 🛠️ How to Run

### 1. Backend

```sh
cd backend && touch .env
```

Create .env file with the following

```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
```

Then install dependencies and start the backend:

```sh
pip install -r requirements.txt
python main.py
```

### 2. Frontend

```sh
cd frontend
pnpm install
pnpm run dev
```

### 🚀 Access

Once everything is running, visit:

http://localhost:8000

This isn't built for edge cases. It's a buggy weekend project. It's messy. But it was fun to make.
