"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui",
          padding: 32,
          textAlign: "center",
          background: "#faf8f5",
          color: "#2b2a28",
        }}
      >
        <h1>Something went wrong</h1>
        <p>Nothing you wrote has been lost. Try again in a moment.</p>
        <button type="button" onClick={reset} style={{ padding: "12px 20px", borderRadius: 999 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
