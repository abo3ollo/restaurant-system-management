import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/Navbar";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"], // latin لو فيه نصوص إنجليزي
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Foodics",
  description: "A restaurant management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-family-name:var(--font-cairo) antialiased`}>
        <Navbar/>

        {children}
      </body>
    </html>
  );
}