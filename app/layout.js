import "../styles/globals.css";

export const metadata = {
  title: "ASCII Fractal Renderer",
  description: "Recursive ASCII renderer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}