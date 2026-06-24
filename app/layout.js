import "./globals.css";

export const metadata = {
  title: "MoneyPot Progress Prototype",
  description: "Standalone MoneyPot progress tracker prototype",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
