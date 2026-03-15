# Gemini AI Chat App

A simple React + Vite front end paired with an Express backend that calls the Google Generative AI (`@google/generative-ai`) API to generate content from prompts.

## 🧩 Architecture

- **Client**: React + Vite application (in `client/`) that sends user prompts to the backend and renders AI-generated text using `react-markdown`.
- **Server**: Express server (in `server/`) that uses `@google/generative-ai` to query the Gemini model and returns the generated text.

## 🚀 Getting Started

### 1) Setup environment variables

Create a `.env` file in the `server/` folder with the following values:

```env
KEY=<YOUR_GOOGLE_GENERATIVE_AI_API_KEY>
PORT=8000
```

- `KEY`: Your Google Generative AI API key.
- `PORT`: Port for the Express server (defaults to `8000` in the client code).

### 2) Install dependencies

Install dependencies for both server and client:

```bash
cd server
npm install

cd ../client
npm install
```

### 3) Run the app (development)

Run the server:

```bash
cd server
npm start
```

Run the client:

```bash
cd client
npm run dev
```

Then open the URL shown by Vite (typically `http://localhost:5173`).

## 🔧 Project Structure

```
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Loading.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/              # Express backend
│   ├── index.js
│   └── package.json
├── package.json         # (root) minimal dependency placeholders
└── README.md            # (this file)
```

## 🧠 How it works

1. User enters a prompt in the React app and clicks **Create content**.
2. The client sends a POST request to `http://localhost:8000/ask` with `{ question }`.
3. The Express backend forwards the prompt to Google Generative AI using `gemini-2.5-flash`.
4. The server returns generated text; the client renders it via `react-markdown`.

## 🛠️ Notes

- The server currently listens on `process.env.PORT`. Make sure `.env` contains a valid port.
- The client is currently hard-coded to `http://localhost:8000/ask`. If you change the server port, update the URL in `client/src/App.jsx`.

---

If you want to expand this further, consider:

- Adding authentication to protect the API key.
- Adding proper error handling on the server and client.
- Adding rate limiting and request validation on the server.
- Making the API URL and server port configurable from the client.
