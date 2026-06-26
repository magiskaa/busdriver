import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
	title: "Bussikuski",
	description: "Jägershotti on 12",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
	return (
		<html
			lang="en"
			className="h-full antialiased"
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col">
				<ConvexClientProvider>{children}</ConvexClientProvider>
			</body>
		</html>
	);
}
