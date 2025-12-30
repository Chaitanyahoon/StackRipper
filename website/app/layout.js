export const metadata = {
  title: "StackRipper | The Intelligence Layer for Developers",
  description: "A premium technology profiler and architecture consultant for professional developers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
